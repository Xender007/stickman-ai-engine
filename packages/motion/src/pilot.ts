import { LEG, shoulderOf, solveSkeleton, type Skeleton, type V2 } from './rig.ts';
import { FootTrack } from './gait.ts';

/**
 * Milestone 4 character clip: Ravi carries a box along the street, climbs a stair gantry, waits on the landing, turns,
 * descends and walks out across the drained street. One planner makes every phase: a list of footholds (x, y, duration);
 * the hip is derived from the feet, so planted feet cannot slide on flat ground, a slope or stairs.
 */
export interface Stairs {
  /** x of the foot of the first riser (m). */
  x0: number;
  run: number;
  rise: number;
  /** Number of treads; the landing starts at the top of tread n and is `landingLen` long. */
  n: number;
  landingLen: number;
}

export const GANTRY: Stairs = { x0: 16.2, run: 0.28, rise: 0.21, n: 12, landingLen: 4 };
export const treadX = (s: Stairs, j: number) => s.x0 + (j - 0.5) * s.run; // centre of tread j (1-based)
export const treadY = (s: Stairs, j: number) => j * s.rise;
export const landingY = (s: Stairs) => s.n * s.rise;
export const landingX0 = (s: Stairs) => s.x0 + s.n * s.run;

/** Height of the walkable surface at x: the street, the treads, then the landing. */
export function surfaceY(s: Stairs, ground: (x: number) => number, x: number): number {
  if (x < s.x0) return ground(x);
  if (x < landingX0(s)) return Math.ceil((x - s.x0) / s.run - 1e-9) * s.rise;
  if (x <= landingX0(s) + s.landingLen) return landingY(s);
  return ground(x);
}

export interface PilotParams {
  stairs: Stairs;
  ground: (x: number) => number;
  boxKg: number;
  xStart: number;
  xExit: number;
  /** Story time at which Ravi starts moving back across the landing (after the wait). */
  tDescend: number;
}

export interface PilotSample {
  t: number;
  sk: Skeleton;
  facing: 1 | -1;
  lean: number;
  planted: { L: boolean; R: boolean };
  /** The surface under each foot, for the contact checks. */
  support: { L: number; R: number };
  box: { x: number; y: number; angle: number };
  phase: 'approach' | 'climb' | 'landing' | 'wait' | 'descend' | 'exit';
}

export interface PilotClip {
  params: PilotParams;
  duration: number;
  /** Times at which something notable happens. */
  events: { climbStart: number; atLanding: number; turn: number; descentStart: number; onStreet: number; end: number };
  stepCount: number;
  sampleAt: (t: number) => PilotSample;
}

const CARRY_ANCHOR: V2 = [0.42, -0.4];
const HAND_ON_BOX: V2 = [-0.2, 0.05];
const HIP_STAND = 0.7;
const softMin = (a: number, b: number, k: number) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));

interface Step {
  foot: 'L' | 'R';
  x: number;
  y: number;
  tA: number;
  tB: number;
}

export function buildPilotClip(p: PilotParams): PilotClip {
  const { stairs: S, ground } = p;
  const leanBack = 0.25 * p.boxKg;
  const feet = { L: new FootTrack(p.xStart - 0.18, 0.1, ground(p.xStart - 0.18)), R: new FootTrack(p.xStart + 0.18, 0.1, ground(p.xStart + 0.18)) };
  const steps: Step[] = [];
  let t = 0.6;
  let facing: 1 | -1 = 1;
  const segs: { t0: number; t1: number; phase: PilotSample['phase']; facing: 1 | -1 }[] = [];

  /** The foot that is behind, relative to the direction of travel. */
  const rearFoot = (dir: 1 | -1): 'L' | 'R' => ((feet.L.plantedX - feet.R.plantedX) * dir <= 0 ? 'L' : 'R');
  const other = (f: 'L' | 'R'): 'L' | 'R' => (f === 'L' ? 'R' : 'L');
  let next: 'L' | 'R' = rearFoot(1);

  const place = (x: number, y: number, dur: number): void => {
    const tB = t + dur * 0.84;
    feet[next].addSwing(t, tB, x, y);
    steps.push({ foot: next, x, y, tA: t, tB });
    t += dur;
    next = other(next);
  };
  const phase = (name: PilotSample['phase'], body: () => void): void => {
    const t0 = t;
    body();
    segs.push({ t0, t1: t, phase: name, facing });
  };

  // 1. Approach: even steps along the street to the foot of the stairs.
  const stepA = 0.55;
  phase('approach', () => {
    const lead = Math.max(feet.L.plantedX, feet.R.plantedX);
    const nA = Math.ceil((S.x0 - 0.2 - lead) / stepA);
    for (let i = 1; i <= nA; i++) {
      const x = lead + (i * (S.x0 - 0.2 - lead)) / nA;
      place(x, ground(x), 0.55);
    }
  });
  const climbStart = t;
  // 2. Climb: one tread per step, alternating feet.
  phase('climb', () => {
    for (let j = 1; j <= S.n; j++) place(treadX(S, j), treadY(S, j), 0.5);
  });
  const atLanding = t;
  // 3. Onto the landing: two steps and a closing step so both feet end level.
  phase('landing', () => {
    const x1 = landingX0(S) + 0.3;
    const x2 = landingX0(S) + 0.7;
    place(x1, landingY(S), 0.55);
    place(x2, landingY(S), 0.55);
    place(x2 - 0.22, landingY(S), 0.5);
  });
  // 4. Wait: feet fixed (the time-lapse). Then turn (a one-frame flip, declared), then walk back to the top of the stairs.
  const waitStart = t;
  t = p.tDescend;
  segs.push({ t0: waitStart, t1: t, phase: 'wait', facing });
  const turn = t - 0.001;
  facing = -1;
  next = rearFoot(-1);
  const descentStart = t;
  phase('descend', () => {
    place(landingX0(S) + 0.15, landingY(S), 0.5);
    for (let j = S.n; j >= 1; j--) place(treadX(S, j), treadY(S, j), 0.42);
  });
  const onStreet = t;
  phase('exit', () => {
    const lead = Math.min(feet.L.plantedX, feet.R.plantedX);
    const nE = Math.ceil((lead - p.xExit) / 0.55);
    for (let i = 1; i <= nE; i++) {
      const x = lead + (i * (p.xExit - lead)) / nE;
      place(x, ground(x), 0.5);
    }
    // close the stance
    const front = feet[other(next)].plantedX;
    place(front + 0.22, ground(front + 0.22), 0.5);
  });
  const end = t + 0.6;

  const facingAt = (tt: number): 1 | -1 => (tt >= turn ? -1 : 1);
  const phaseAt = (tt: number): PilotSample['phase'] => segs.find((s) => tt >= s.t0 && tt < s.t1)?.phase ?? (tt < segs[0].t0 ? 'approach' : 'exit');

  // Hip: the mean of the feet, low-pass filtered over one step so the stop-go of single support does not reach the hip.
  const meanFeet = (tt: number): V2 => {
    const a = feet.L.at(tt).p;
    const b = feet.R.at(tt).p;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  const filtered = (tt: number): V2 => {
    const N = 7;
    const W = 0.5;
    let x = 0;
    let y = 0;
    for (let k = 0; k < N; k++) {
      const m = meanFeet(tt + (k / (N - 1) - 0.5) * W);
      x += m[0];
      y += m[1];
    }
    return [x / N, y / N];
  };

  const sampleAt = (tt: number): PilotSample => {
    const f = facingAt(tt);
    const fl = feet.L.at(tt);
    const fr = feet.R.at(tt);
    const m = filtered(tt);
    const ph = phaseAt(tt);
    const lean = (ph === 'climb' ? 9 : 3) - leanBack * 0.2;
    // The hip leads the feet slightly in the direction of travel; its height follows the feet, never beyond reach.
    let hipY = m[1] + HIP_STAND;
    const hipX = m[0] + 0.04 * f;
    for (const q of [fl.p, fr.p]) {
      const dx = (q[0] - hipX) * f;
      hipY = softMin(hipY, q[1] + Math.sqrt(Math.max(0, (0.985 * LEG) ** 2 - dx * dx)), 0.04);
    }
    const hip: V2 = [hipX, hipY];
    const sh = shoulderOf([0, 0], lean); // lean offset in the facing frame
    const shoulder: V2 = [hip[0] + sh[0] * f, hip[1] + sh[1]];
    const box = { x: shoulder[0] + CARRY_ANCHOR[0] * f, y: shoulder[1] + CARRY_ANCHOR[1], angle: 0 };
    const grip: V2 = [box.x + HAND_ON_BOX[0] * f, box.y + HAND_ON_BOX[1]];
    const sk = solveSkeleton({ hip, lean, lFoot: fl.p, rFoot: fr.p, lHand: grip, rHand: [grip[0] + 0.03 * f, grip[1] + 0.02] }, f);
    return {
      t: tt,
      sk,
      facing: f,
      lean,
      planted: { L: fl.planted, R: fr.planted },
      support: { L: surfaceY(S, ground, fl.p[0]), R: surfaceY(S, ground, fr.p[0]) },
      box,
      phase: ph,
    };
  };

  return { params: p, duration: end, events: { climbStart, atLanding, turn, descentStart, onStreet, end }, stepCount: steps.length, sampleAt };
}

