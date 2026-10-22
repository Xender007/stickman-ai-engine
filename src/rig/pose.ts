/**
 * Stick-figure rig. Angles are degrees measured from straight down; + means toward the facing side.
 * Forearm and shin angles are relative to their parent bone.
 */
export type Pose = {
  lean: number; // torso tilt from vertical (+ = leaning forward)
  lUA: number; // left upper arm
  lFA: number; // left forearm (+ folds forward/up)
  rUA: number;
  rFA: number;
  lTh: number; // left thigh
  lSh: number; // left shin (- folds the knee back)
  rTh: number;
  rSh: number;
};

export const BONES = {torso: 80, upperArm: 44, foreArm: 42, thigh: 58, shin: 58, neck: 9, headR: 27, stroke: 12};

const KEYS = ['lean', 'lUA', 'lFA', 'rUA', 'rFA', 'lTh', 'lSh', 'rTh', 'rSh'] as const;

export const mixPose = (a: Pose, b: Pose, k: number): Pose => {
  const out = {} as Pose;
  for (const key of KEYS) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
};

const HOLD_CUP = {rUA: 14, rFA: 80};
export const STAND: Pose = {lean: 2, lUA: -6, lFA: 12, rUA: 8, rFA: 14, lTh: 5, lSh: -3, rTh: -4, rSh: -3};
export const STAND_CUP: Pose = {...STAND, ...HOLD_CUP};
export const UNEASY: Pose = {lean: -3, lUA: -28, lFA: 34, rUA: 30, rFA: 38, lTh: 9, lSh: -5, rTh: -9, rSh: -4};
export const UNEASY_CUP: Pose = {...UNEASY, ...HOLD_CUP};

const TAU = Math.PI * 2;

/** Walk cycle. phase 0..1 = one full stride (two steps). */
export const walk = (phase: number, cup = false): Pose => {
  const s = Math.sin(phase * TAU);
  const c = Math.cos(phase * TAU);
  const pose: Pose = {
    lean: 5,
    lTh: 24 * s,
    rTh: -24 * s,
    lSh: -40 * Math.max(0, c) - 5, // knee folds while the leg swings forward
    rSh: -40 * Math.max(0, -c) - 5,
    lUA: -18 * s, // arms swing against the legs
    lFA: 18,
    rUA: 18 * s,
    rFA: 18,
  };
  return cup ? {...pose, ...HOLD_CUP, rUA: HOLD_CUP.rUA + 3 * s} : pose;
};

export const run = (phase: number): Pose => {
  const s = Math.sin(phase * TAU);
  const c = Math.cos(phase * TAU);
  return {
    lean: 17,
    lTh: 50 * s,
    rTh: -50 * s,
    lSh: -105 * Math.max(0, c) - 16,
    rSh: -105 * Math.max(0, -c) - 16,
    lUA: -55 * s,
    lFA: 95,
    rUA: 55 * s,
    rFA: 95,
  };
};

type P = {x: number; y: number};
export type Joints = {
  hip: P; shoulder: P; head: P;
  lElbow: P; lHand: P; rElbow: P; rHand: P;
  lKnee: P; lFoot: P; rKnee: P; rFoot: P;
};

const rad = (d: number) => (d * Math.PI) / 180;
const bone = (from: P, len: number, deg: number): P => ({
  x: from.x + len * Math.sin(rad(deg)),
  y: from.y + len * Math.cos(rad(deg)),
});

/** Joint positions, shifted so the lowest point of the body rests on y = 0 (the ground). */
export const solve = (pose: Pose): Joints => {
  const b = BONES;
  const up = {x: Math.sin(rad(pose.lean)), y: -Math.cos(rad(pose.lean))};
  const hip = {x: 0, y: 0};
  const shoulder = {x: up.x * b.torso, y: up.y * b.torso};
  const head = {x: shoulder.x + up.x * (b.neck + b.headR), y: shoulder.y + up.y * (b.neck + b.headR)};
  const lElbow = bone(shoulder, b.upperArm, pose.lUA);
  const rElbow = bone(shoulder, b.upperArm, pose.rUA);
  const lKnee = bone(hip, b.thigh, pose.lTh);
  const rKnee = bone(hip, b.thigh, pose.rTh);
  const j: Joints = {
    hip, shoulder, head, lElbow, rElbow, lKnee, rKnee,
    lHand: bone(lElbow, b.foreArm, pose.lUA + pose.lFA),
    rHand: bone(rElbow, b.foreArm, pose.rUA + pose.rFA),
    lFoot: bone(lKnee, b.shin, pose.lTh + pose.lSh),
    rFoot: bone(rKnee, b.shin, pose.rTh + pose.rSh),
  };
  const pts = Object.values(j) as P[];
  const lowest = Math.max(...pts.map((p) => p.y), head.y + b.headR) + b.stroke / 2;
  for (const p of pts) p.y -= lowest;
  return j;
};

/** Flat on the ground after a dive, arms reaching forward. */
export const DIVE: Pose = {lean: 86, lUA: 100, lFA: 0, rUA: 84, rFA: 8, lTh: -84, lSh: 0, rTh: -80, rSh: -6};

/** Climbing a ladder/lattice in front of him (facing it). phase 0..1 = one hand-over-hand cycle. */
export const climb = (phase: number): Pose => {
  const s = Math.sin(phase * TAU);
  return {lean: 2, lUA: 150 + 22 * s, lFA: 14, rUA: 150 - 22 * s, rFA: 14, lTh: 40 + 25 * s, lSh: -85 - 20 * s, rTh: 40 - 25 * s, rSh: -85 + 20 * s};
};

/** Hanging on with both arms, legs dangling and swaying. */
export const cling = (time: number): Pose => {
  const s = Math.sin(time * 1.6);
  return {lean: 0, lUA: 165 + 3 * s, lFA: 8, rUA: 155 - 3 * s, rFA: 12, lTh: 6 + 5 * s, lSh: -6, rTh: -5 - 5 * s, rSh: -10};
};
