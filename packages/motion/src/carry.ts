import { ARM, LEG, shoulderOf, solveSkeleton, type Skeleton, type V2 } from './rig.ts';
import { FootTrack, lerp, scheduleSettle, scheduleWalk, smooth, walkPlan } from './gait.ts';

export interface CarryParams {
  massKg: number;
  /** Crate centre x when it starts on the ground (m). */
  crateX: number;
  /** How far the crate is carried before it is put down (m). */
  carryDistance: number;
}

export const CRATE = { w: 0.5, h: 0.4 } as const;
// Starting stance: feet 0.36 m apart, so the first step has the same leg geometry as every later step (a narrower stance made the hip dip, then pop).
const INIT_HALF_STANCE = 0.18;
const HAND_ON_CRATE: V2 = [-0.2, 0.05]; // hands grip the rear face, slightly above centre
const CARRY_ANCHOR: V2 = [0.42, -0.4]; // crate centre relative to the shoulder while carried

const softMin = (a: number, b: number, k: number) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));

type Key = [number, number];
/** Smoothly eased piecewise-constant-slope interpolation between keys (time, value). */
const keyed = (keys: Key[]) => (t: number): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  }
  return keys[keys.length - 1][1];
};

export interface CarrySample {
  t: number;
  sk: Skeleton;
  lean: number;
  planted: { L: boolean; R: boolean };
  /** Nominal crate pose from the animation (the physics bake owns it before the grasp and after the release). */
  crate: { x: number; y: number; angle: number };
  held: boolean;
  reach: number;
}

export interface CarryClip {
  params: CarryParams;
  duration: number;
  tGrasp: number;
  tRelease: number;
  speeds: { walk: number; carry: number };
  leanBackDeg: number;
  sampleAt: (t: number) => CarrySample;
}

export function buildCarryClip(params: CarryParams): CarryClip {
  const mass = params.massKg;
  // Weight shows up as posture and pace, not as a label: a heavier load leans the torso back, sits the hips lower and slows the walk.
  const leanBack = 0.25 * mass;
  const hipCarry = 0.72 - 0.0006 * mass;
  const vWalk = 1.25;
  const vCarry = Math.max(0.5, vWalk - 0.012 * mass);

  const feet = { L: new FootTrack(-INIT_HALF_STANCE), R: new FootTrack(INIT_HALF_STANCE) };
  const hipSegs: { t0: number; t1: number; from: number; to: number }[] = [];

  // Walk to the crate and stop 0.75 m behind it.
  const w1 = walkPlan(0.5, 0, params.crateX - 0.75, vWalk, 0.5);
  const s1 = scheduleWalk(w1, feet, 'L');
  const rear1: 'L' | 'R' = s1.front === 'L' ? 'R' : 'L';
  const settle1 = scheduleSettle(s1.tEnd, 0.45, feet, rear1, s1.frontX, 0.14);
  hipSegs.push({ t0: w1.t0, t1: w1.t0 + w1.Tw, from: w1.x0, to: w1.x0 + w1.D });
  hipSegs.push({ t0: s1.tEnd, t1: s1.tEnd + 0.45, from: w1.x0 + w1.D, to: settle1.hipFinal });

  // Carry it; the first foot to step is the one that closed in at the settle.
  const w2 = walkPlan(5.4, settle1.hipFinal, params.carryDistance, vCarry, 0.42);
  const s2 = scheduleWalk(w2, feet, rear1);
  const rear2: 'L' | 'R' = s2.front === 'L' ? 'R' : 'L';
  const settle2 = scheduleSettle(s2.tEnd, 0.45, feet, rear2, s2.frontX, 0.14);
  hipSegs.push({ t0: w2.t0, t1: w2.t0 + w2.Tw, from: w2.x0, to: w2.x0 + w2.D });
  hipSegs.push({ t0: s2.tEnd, t1: s2.tEnd + 0.45, from: w2.x0 + w2.D, to: settle2.hipFinal });

  const tPutStart = s2.tEnd + 0.45 + 0.2; // after the settle plus a beat
  const tRelease = tPutStart + 0.9;
  const tGrasp = 3.9;
  const duration = tRelease + 2.0;

  const hipX = (t: number): number => {
    let x = hipSegs[0].from;
    for (const s of hipSegs) {
      if (t < s.t0) break;
      x = t >= s.t1 ? s.to : lerp(s.from, s.to, smooth((t - s.t0) / (s.t1 - s.t0)));
    }
    return x;
  };

  const hipBase = keyed([[0, 0.74], [3.0, 0.74], [tGrasp, 0.4], [4.4, 0.4], [5.4, hipCarry], [tPutStart, hipCarry], [tRelease, 0.4], [tRelease + 0.2, 0.4], [tRelease + 1.2, 0.74]]);
  const leanKey = keyed([[0, 2], [3.0, 2], [tGrasp, 55], [4.4, 55], [5.4, -leanBack], [tPutStart, -leanBack], [tRelease, 55], [tRelease + 0.2, 55], [tRelease + 1.2, 2]]);
  const lift = keyed([[0, 0], [4.0, 0], [4.7, 1], [tPutStart + 0.3, 1], [tRelease, 0]]);
  const reachKey = keyed([[0, 0], [3.0, 0], [tGrasp, 1], [tRelease + 0.1, 1], [tRelease + 0.8, 0]]);
  const walkAmount = (t: number) =>
    [w1, w2].reduce((m, w) => Math.max(m, smooth((t - w.t0) / 0.3) * (1 - smooth((t - (w.t0 + w.Tw - 0.3)) / 0.3))), 0);

  // Prescribed hip bob: lowest at double support, highest mid-swing, one cycle per step. The reach limit below stays as a safety net.
  const bob = (t: number): number => {
    const w = t >= w1.t0 && t <= w1.t0 + w1.Tw ? w1 : t >= w2.t0 && t <= w2.t0 + w2.Tw ? w2 : null;
    if (!w) return 0;
    const phase = (w.n * (w.hipAt(t) - w.x0)) / w.D;
    return 0.06 * walkAmount(t) * (0.5 + 0.5 * Math.cos(2 * Math.PI * (phase - 0.875)));
  };

  const ground1: V2 = [params.crateX, CRATE.h / 2];
  const ground2: V2 = [settle2.hipFinal + 0.75, CRATE.h / 2];

  const sampleAt = (t: number): CarrySample => {
    const hx = hipX(t);
    const fl = feet.L.at(t, -INIT_HALF_STANCE);
    const fr = feet.R.at(t, INIT_HALF_STANCE);
    const lean = leanKey(t) + 3 * walkAmount(t);

    // Hip height: as high as the keyframe asks, but never higher than the stance legs can reach with the feet where they are.
    // A soft minimum (never above the hard minimum) keeps the hip path free of kinks where a different foot becomes the limit.
    let hipY = hipBase(t) - bob(t);
    for (const f of [fl.p, fr.p]) {
      const dx = f[0] - hx;
      hipY = softMin(hipY, f[1] + Math.sqrt(Math.max(0, (0.985 * LEG) ** 2 - dx * dx)), 0.04);
    }
    const hip: V2 = [hx, hipY];
    const shoulder = shoulderOf(hip, lean);

    const lam = lift(t);
    const ground = t < (tPutStart + 5.4) / 2 ? ground1 : ground2;
    const anchor: V2 = [shoulder[0] + CARRY_ANCHOR[0], shoulder[1] + CARRY_ANCHOR[1]];
    const crate = { x: lerp(ground[0], anchor[0], lam), y: lerp(ground[1], anchor[1], lam), angle: 0 };

    const reach = reachKey(t);
    const handFor = (oppFootX: number, far: number): V2 => {
      const a = (Math.max(-1, Math.min(1, (oppFootX - hx) / 0.4)) * 25 * Math.PI) / 180;
      const hang: V2 = [shoulder[0] + ARM * 0.93 * Math.sin(a), shoulder[1] - ARM * 0.93 * Math.cos(a)];
      const grip: V2 = [crate.x + HAND_ON_CRATE[0] + far * 0.03, crate.y + HAND_ON_CRATE[1] + far * 0.02];
      return [lerp(hang[0], grip[0], reach), lerp(hang[1], grip[1], reach)];
    };

    const sk = solveSkeleton({ hip, lean, lFoot: fl.p, rFoot: fr.p, lHand: handFor(fr.p[0], 0), rHand: handFor(fl.p[0], 1) });
    return { t, sk, lean, planted: { L: fl.planted, R: fr.planted }, crate, held: t >= tGrasp && t < tRelease, reach };
  };

  return { params, duration, tGrasp, tRelease, speeds: { walk: vWalk, carry: vCarry }, leanBackDeg: leanBack, sampleAt };
}
