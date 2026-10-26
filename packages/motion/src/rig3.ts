import { RIG } from './rig.ts';

/**
 * A 3D stick rig for shots where the character must visibly turn (no cut to hide it). World axes: x along the street, y up,
 * z toward the camera. Yaw phi rotates about the vertical axis: phi = 0 faces +x, phi = pi/2 faces the camera, phi = pi faces -x.
 * Every bone keeps its length in 3D (two-bone IK in 3D, with a pole that makes knees and elbows bend the natural way), so the
 * projection to the screen foreshortens limbs correctly while turning instead of squashing them.
 */
export type V3 = [number, number, number];

export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len3 = (a: V3) => Math.sqrt(dot3(a, a));
export const norm3 = (a: V3): V3 => {
  const l = len3(a);
  return l < 1e-12 ? [0, -1, 0] : scale3(a, 1 / l);
};
export const dist3 = (a: V3, b: V3) => len3(sub3(a, b));

/** Rotate a local vector (forward = +x, up = +y, left of the figure = +z when facing +x) by yaw phi about the vertical axis. */
export const yaw = (v: V3, phi: number): V3 => [v[0] * Math.cos(phi) - v[2] * Math.sin(phi), v[1], v[0] * Math.sin(phi) + v[2] * Math.cos(phi)];

/** Two-bone IK in 3D. `pole` is a direction the middle joint should bend toward. */
export function ik3(root: V3, target: V3, l1: number, l2: number, pole: V3): { mid: V3; end: V3; clamped: boolean } {
  const d = dist3(root, target);
  const dir = norm3(sub3(target, root));
  const dMax = (l1 + l2) * 0.9995;
  const dMin = Math.abs(l1 - l2) + 1e-4;
  const dc = Math.min(dMax, Math.max(dMin, d));
  const along = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  // the part of the pole perpendicular to the limb axis
  let perp = sub3(pole, scale3(dir, dot3(pole, dir)));
  if (len3(perp) < 1e-9) perp = [0, 0, 1];
  perp = norm3(perp);
  return { mid: add3(add3(root, scale3(dir, along)), scale3(perp, h)), end: add3(root, scale3(dir, dc)), clamped: d > dMax };
}

export const HIP_HALF = 0.09;
export const SHOULDER_HALF = 0.17;

export interface Skeleton3 {
  hip: V3;
  hipL: V3;
  hipR: V3;
  kneeL: V3;
  kneeR: V3;
  footL: V3;
  footR: V3;
  neck: V3;
  shL: V3;
  shR: V3;
  elbowL: V3;
  elbowR: V3;
  handL: V3;
  handR: V3;
  head: V3;
  clamped: { legL: boolean; legR: boolean; armL: boolean; armR: boolean };
}

export interface Pose3Input {
  hip: V3;
  /** Yaw of the hips and legs, and of the chest and arms (a twist is chestYaw - hipYaw). */
  hipYaw: number;
  chestYaw: number;
  /** Lean forward in degrees (toward the chest's facing direction). */
  lean: number;
  footL: V3;
  footR: V3;
  handL: V3;
  handR: V3;
}

export function solveSkeleton3(p: Pose3Input): Skeleton3 {
  const rad = (p.lean * Math.PI) / 180;
  const hipL = add3(p.hip, yaw([0, 0, HIP_HALF], p.hipYaw));
  const hipR = add3(p.hip, yaw([0, 0, -HIP_HALF], p.hipYaw));
  const spine = yaw([Math.sin(rad), Math.cos(rad), 0], p.chestYaw);
  const neck = add3(p.hip, scale3(spine, RIG.torso));
  const shL = add3(neck, yaw([0, 0, SHOULDER_HALF], p.chestYaw));
  const shR = add3(neck, yaw([0, 0, -SHOULDER_HALF], p.chestYaw));
  const headDir = yaw([Math.sin(rad * 0.6), Math.cos(rad * 0.6), 0], p.chestYaw);
  const head = add3(neck, scale3(headDir, RIG.neck + RIG.headR));
  // knees bend forward (the hips' facing); elbows bend down and back (behind the chest's facing)
  const kneePole = yaw([1, 0, 0], p.hipYaw);
  const elbowPole = (side: 1 | -1) => yaw([-0.8, -0.6, 0.35 * side], p.chestYaw);
  const legL = ik3(hipL, p.footL, RIG.thigh, RIG.shin, kneePole);
  const legR = ik3(hipR, p.footR, RIG.thigh, RIG.shin, kneePole);
  const armL = ik3(shL, p.handL, RIG.upperArm, RIG.foreArm, elbowPole(1));
  const armR = ik3(shR, p.handR, RIG.upperArm, RIG.foreArm, elbowPole(-1));
  return {
    hip: p.hip,
    hipL,
    hipR,
    kneeL: legL.mid,
    kneeR: legR.mid,
    footL: legL.end,
    footR: legR.end,
    neck,
    shL,
    shR,
    elbowL: armL.mid,
    elbowR: armR.mid,
    handL: armL.end,
    handR: armR.end,
    head,
    clamped: { legL: legL.clamped, legR: legR.clamped, armL: armL.clamped, armR: armR.clamped },
  };
}

export function boneLengths3(s: Skeleton3) {
  return {
    torso: dist3(s.hip, s.neck),
    thighL: dist3(s.hipL, s.kneeL),
    shinL: dist3(s.kneeL, s.footL),
    thighR: dist3(s.hipR, s.kneeR),
    shinR: dist3(s.kneeR, s.footR),
    upperL: dist3(s.shL, s.elbowL),
    foreL: dist3(s.elbowL, s.handL),
    upperR: dist3(s.shR, s.elbowR),
    foreR: dist3(s.elbowR, s.handR),
  };
}
