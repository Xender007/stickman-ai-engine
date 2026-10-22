/**
 * Stickman rig in metres, side view facing +x, y up. Proportions come from the legacy rig (src/rig/pose.ts BONES)
 * divided by 148 units per metre (docs/style-bible.md), so identity carries over from the Quiet Coast figures.
 * Bone lengths are constants: FK/IK below never changes them, which is what the identity check measures.
 */
export type V2 = [number, number];

export const RIG = { torso: 0.54, upperArm: 0.3, foreArm: 0.28, thigh: 0.39, shin: 0.39, neck: 0.06, headR: 0.18 } as const;
export const LEG = RIG.thigh + RIG.shin;
export const ARM = RIG.upperArm + RIG.foreArm;
export const STAND_HEIGHT = LEG + RIG.torso + RIG.neck + 2 * RIG.headR;

const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface Ik2 {
  mid: V2;
  end: V2;
  /** True when the target was out of reach and the chain is fully extended toward it. */
  clamped: boolean;
}

/** Two-bone IK. side = +1 bends the middle joint to the left of the root->target direction. Knees: +1. Elbows: -1. */
export function ik2(root: V2, target: V2, l1: number, l2: number, side: 1 | -1): Ik2 {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const d = Math.hypot(dx, dy);
  const dir: V2 = d < 1e-9 ? [0, -1] : [dx / d, dy / d];
  const dMax = (l1 + l2) * 0.9995;
  const dMin = Math.abs(l1 - l2) + 1e-4;
  const dc = clamp(d, dMin, dMax);
  const along = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const perp: V2 = [-dir[1], dir[0]];
  return {
    mid: [root[0] + dir[0] * along + perp[0] * h * side, root[1] + dir[1] * along + perp[1] * h * side],
    end: [root[0] + dir[0] * dc, root[1] + dir[1] * dc],
    clamped: d > dMax,
  };
}

export const shoulderOf = (hip: V2, leanDeg: number): V2 => add(hip, [RIG.torso * Math.sin(rad(leanDeg)), RIG.torso * Math.cos(rad(leanDeg))]);

export interface PoseInput {
  hip: V2;
  /** Torso lean from vertical in degrees, forward (+x) positive. */
  lean: number;
  lFoot: V2;
  rFoot: V2;
  lHand: V2;
  rHand: V2;
}

export interface Skeleton {
  hip: V2;
  shoulder: V2;
  head: V2;
  lKnee: V2;
  rKnee: V2;
  lFoot: V2;
  rFoot: V2;
  lElbow: V2;
  rElbow: V2;
  lHand: V2;
  rHand: V2;
  /** Which chains hit full extension; a clamped foot target means the contact could not be held. */
  clamped: { lLeg: boolean; rLeg: boolean; lArm: boolean; rArm: boolean };
}

/**
 * Solve the pose. `facing` = -1 makes the figure face -x: the inputs are mirrored about the hip's x, solved facing +x, and mirrored
 * back. Mirroring preserves every length, so bone lengths stay constant and knees/elbows bend the natural way in either direction.
 */
export function solveSkeleton(p: PoseInput, facing: 1 | -1 = 1): Skeleton {
  if (facing === -1) {
    const hx = p.hip[0];
    const m = (v: V2): V2 => [2 * hx - v[0], v[1]];
    const s = solveSkeleton({ hip: p.hip, lean: p.lean, lFoot: m(p.lFoot), rFoot: m(p.rFoot), lHand: m(p.lHand), rHand: m(p.rHand) }, 1);
    return {
      hip: s.hip,
      shoulder: m(s.shoulder),
      head: m(s.head),
      lKnee: m(s.lKnee),
      rKnee: m(s.rKnee),
      lFoot: m(s.lFoot),
      rFoot: m(s.rFoot),
      lElbow: m(s.lElbow),
      rElbow: m(s.rElbow),
      lHand: m(s.lHand),
      rHand: m(s.rHand),
      clamped: s.clamped,
    };
  }
  const shoulder = shoulderOf(p.hip, p.lean);
  const headDir: V2 = [Math.sin(rad(p.lean * 0.6)), Math.cos(rad(p.lean * 0.6))];
  const head = add(shoulder, [headDir[0] * (RIG.neck + RIG.headR), headDir[1] * (RIG.neck + RIG.headR)]);
  const lLeg = ik2(p.hip, p.lFoot, RIG.thigh, RIG.shin, 1);
  const rLeg = ik2(p.hip, p.rFoot, RIG.thigh, RIG.shin, 1);
  const lArm = ik2(shoulder, p.lHand, RIG.upperArm, RIG.foreArm, -1);
  const rArm = ik2(shoulder, p.rHand, RIG.upperArm, RIG.foreArm, -1);
  return {
    hip: p.hip,
    shoulder,
    head,
    lKnee: lLeg.mid,
    rKnee: rLeg.mid,
    lFoot: lLeg.end,
    rFoot: rLeg.end,
    lElbow: lArm.mid,
    rElbow: rArm.mid,
    lHand: lArm.end,
    rHand: rArm.end,
    clamped: { lLeg: lLeg.clamped, rLeg: rLeg.clamped, lArm: lArm.clamped, rArm: rArm.clamped },
  };
}

/** Bone lengths measured from a solved skeleton: used by the identity check. */
export function boneLengths(s: Skeleton) {
  const d = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  return {
    torso: d(s.hip, s.shoulder),
    lThigh: d(s.hip, s.lKnee),
    lShin: d(s.lKnee, s.lFoot),
    rThigh: d(s.hip, s.rKnee),
    rShin: d(s.rKnee, s.rFoot),
    lUpperArm: d(s.shoulder, s.lElbow),
    lForeArm: d(s.lElbow, s.lHand),
    rUpperArm: d(s.shoulder, s.rElbow),
    rForeArm: d(s.rElbow, s.rHand),
  };
}

/** Knee flexion in degrees: 0 = straight, positive = bent the natural way, negative = hyperextended. */
export function kneeFlexionDeg(hip: V2, knee: V2, foot: V2): number {
  const a1 = Math.atan2(knee[1] - hip[1], knee[0] - hip[0]);
  const a2 = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]);
  let diff = a1 - a2; // thigh heading minus shin heading; > 0 means the shin turned clockwise = knee forward (natural)
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return (diff * 180) / Math.PI;
}
