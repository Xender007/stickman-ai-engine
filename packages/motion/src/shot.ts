import { FootTrack, smooth } from './gait.ts';
import { LEG } from './rig.ts';
import { add3, solveSkeleton3, yaw, HIP_HALF, type Skeleton3, type V3 } from './rig3.ts';
import { landingX0, landingY, surfaceY, treadX, treadY, type Stairs } from './pilot.ts';

/**
 * The user's single locked 10 s shot (docs/handoff/milestone-4b.md): Ravi walks right with a crate, stops and twists his torso
 * toward the sea as the bore slams the quay, climbs 12 steps, steps onto the landing, turns in place to face the sea and breathes.
 * Uses the 3D rig, so both turns are visible and every bone keeps its length. Times are clip seconds (0 = start of the shot).
 */
export interface ShotParams {
  stairs: Stairs;
  ground: (x: number) => number;
  xStart: number;
  boxKg: number;
}

export interface ShotSample {
  t: number;
  sk: Skeleton3;
  hipYaw: number;
  chestYaw: number;
  planted: { L: boolean; R: boolean };
  support: { L: number; R: number };
  box: { c: V3; yaw: number };
  phase: 'walk' | 'look' | 'climb' | 'landing' | 'turn' | 'breathe';
}

export interface ShotClip {
  events: { stop: number; lookStart: number; lookEnd: number; climbStart: number; atLanding: number; turnStart: number; turnEnd: number };
  duration: number;
  sampleAt: (t: number, tEdit?: number) => ShotSample;
}

const softMin = (a: number, b: number, k: number) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));
const BOX_OFFSET: V3 = [0.42, -0.4, 0];
const HAND_ON_BOX = (side: 1 | -1): V3 => [-0.04, 0.02, 0.235 * side];
const keyed = (keys: [number, number][]) => (t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
  return keys[keys.length - 1][1];
};

export function buildShotClip(p: ShotParams): ShotClip {
  const S = p.stairs;
  const g = p.ground;
  const L = new FootTrack(p.xStart - 0.18, 0.1, g(p.xStart - 0.18));
  const R = new FootTrack(p.xStart + 0.18, 0.1, g(p.xStart + 0.18));
  const feet = { L, R };
  let next: 'L' | 'R' = 'L';
  let t = 0.15;
  const place = (x: number, y: number, dur: number, swingFrac = 0.84) => {
    feet[next].addSwing(t, t + dur * swingFrac, x, y);
    t += dur;
    next = next === 'L' ? 'R' : 'L';
  };

  // walk to just short of the stairs (front foot about 0.3 m before the first riser)
  const goal = S.x0 - 0.3;
  const lead = p.xStart + 0.18;
  const nW = Math.ceil((goal - lead) / 0.6);
  for (let i = 1; i <= nW; i++) {
    const x = lead + (i * (goal - lead)) / nW;
    place(x, g(x), 0.36);
  }
  // close the stance: the rear foot comes up beside the front one
  const front = feet[next === 'L' ? 'R' : 'L'].plantedX;
  place(front - 0.2, g(front - 0.2), 0.3);
  const stop = t;
  // the look: twist toward the sea and back, feet planted
  const lookStart = stop + 0.05;
  const lookEnd = lookStart + 0.85;
  t = lookEnd + 0.05;
  const climbStart = t;
  for (let j = 1; j <= S.n; j++) place(treadX(S, j), treadY(S, j), 0.29);
  const atLanding = t;
  place(landingX0(S) + 0.35, landingY(S), 0.3);
  place(landingX0(S) + 0.75, landingY(S), 0.3);
  place(landingX0(S) + 0.55, landingY(S), 0.28);
  // turn in place to face the sea: each foot steps to its mirrored spot (its side swaps from near to far)
  const turnStart = t + 0.08;
  const turnEnd = turnStart + 0.9;
  const mid = (feet.L.plantedX + feet.R.plantedX) / 2;
  feet.L.addSwing(turnStart, turnStart + 0.42, mid + 0.06, landingY(S));
  feet.R.addSwing(turnStart + 0.45, turnStart + 0.87, mid - 0.06, landingY(S));
  const duration = turnEnd + 3;

  const hipYaw = keyed([[0, 0], [turnStart, 0], [turnEnd, Math.PI]]);
  const twist = keyed([[0, 0], [lookStart, 0], [lookStart + 0.45, 1.9], [lookEnd - 0.4, 1.9], [lookEnd, 0], [turnStart, 0], [turnStart + 0.3, 0.35], [turnEnd, 0]]);
  // feet change sides (near/far) only during their own turning step
  const sideZ = (side: 1 | -1, tt: number) => {
    const w0 = side === 1 ? turnStart : turnStart + 0.45;
    const k = smooth((tt - w0) / 0.42);
    return side * HIP_HALF * (1 - 2 * k);
  };
  const phaseAt = (tt: number): ShotSample['phase'] =>
    tt < stop ? 'walk' : tt < climbStart ? 'look' : tt < atLanding ? 'climb' : tt < turnStart ? 'landing' : tt < turnEnd ? 'turn' : 'breathe';
  const lean = keyed([[0, -3], [stop, -3], [climbStart, 5], [atLanding, 5], [atLanding + 0.6, -2], [turnEnd, -2]]);

  const meanFeet = (tt: number) => {
    const a = L.at(tt).p;
    const b = R.at(tt).p;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  const filtered = (tt: number) => {
    let x = 0;
    let y = 0;
    for (let k = 0; k < 7; k++) {
      const m = meanFeet(tt + (k / 6 - 0.5) * 0.3);
      x += m[0];
      y += m[1];
    }
    return [x / 7, y / 7];
  };

  const sampleAt = (tt: number, tEdit = tt): ShotSample => {
    const hy = hipYaw(tt);
    const cy = hy + twist(tt);
    const fwd = Math.cos(hy);
    const m = filtered(tt);
    const fl = L.at(tt);
    const fr = R.at(tt);
    const footL: V3 = [fl.p[0], fl.p[1], sideZ(1, tt)];
    const footR: V3 = [fr.p[0], fr.p[1], sideZ(-1, tt)];
    // breathing once he has stopped on the landing: a slow rise of the chest, timed on the edit clock so it reads naturally
    const breathe = phaseAt(tt) === 'breathe' ? Math.sin(tEdit * 2.2) : 0;
    const hipX = m[0] + 0.04 * fwd;
    let hipYv = m[1] + 0.7 + 0.006 * breathe;
    for (const [f, side] of [[footL, 1], [footR, -1]] as const) {
      const hs = yaw([0, 0, HIP_HALF * side], hy);
      const dx = f[0] - (hipX + hs[0]);
      const dz = f[2] - hs[2];
      hipYv = softMin(hipYv, f[1] + Math.sqrt(Math.max(0, (0.985 * LEG) ** 2 - dx * dx - dz * dz)), 0.04);
    }
    const hip: V3 = [hipX, hipYv, 0];
    const ln = lean(tt) + 1.2 * breathe;
    const rad = (ln * Math.PI) / 180;
    const neck = add3(hip, yaw([Math.sin(rad) * 0.54, Math.cos(rad) * 0.54, 0], cy));
    const c = add3(neck, yaw(BOX_OFFSET, cy));
    const sk = solveSkeleton3({ hip, hipYaw: hy, chestYaw: cy, lean: ln, footL, footR, handL: add3(c, yaw(HAND_ON_BOX(1), cy)), handR: add3(c, yaw(HAND_ON_BOX(-1), cy)) });
    return {
      t: tt,
      sk,
      hipYaw: hy,
      chestYaw: cy,
      planted: { L: fl.planted, R: fr.planted },
      support: { L: surfaceY(S, g, fl.p[0]), R: surfaceY(S, g, fr.p[0]) },
      box: { c, yaw: cy },
      phase: phaseAt(tt),
    };
  };
  return { events: { stop, lookStart, lookEnd, climbStart, atLanding, turnStart, turnEnd }, duration, sampleAt };
}
