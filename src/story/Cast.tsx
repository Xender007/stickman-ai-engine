import React, {createContext, useContext} from 'react';

/** Size of a person in the current view: World sets it so people and buildings share one scale. */
export const PersonScale = createContext(1);
import {BONES, Joints, Pose, mixPose, solve} from '../rig/pose';
import type {StoryScene} from './schema';

/** Extra poses for this story (same rig and conventions as src/rig/pose.ts). */
export const WINDED: Pose = {lean: 38, lUA: 28, lFA: 6, rUA: 34, rFA: 2, lTh: 14, lSh: -26, rTh: -10, rSh: -22};
export const REACH: Pose = {lean: 6, lUA: -8, lFA: 14, rUA: 78, rFA: 12, lTh: 6, lSh: -4, rTh: -5, rSh: -3};
export const LAMP_UP: Pose = {lean: 2, lUA: 40, lFA: 70, rUA: 128, rFA: -10, lTh: 6, lSh: -3, rTh: -5, rSh: -3};
export const HOLD_LAMP: Pose = {lean: 3, lUA: 30, lFA: 80, rUA: 26, rFA: 72, lTh: 5, lSh: -3, rTh: -4, rSh: -3};
export const BRACE: Pose = {lean: -8, lUA: -40, lFA: 40, rUA: 46, rFA: 30, lTh: 22, lSh: -30, rTh: -20, rSh: -24};
export const LOOK_DOWN: Pose = {lean: 0, lUA: 165, lFA: 8, rUA: 150, rFA: 12, lTh: 6, lSh: -6, rTh: -5, rSh: -10};

export const easePose = (from: Pose, to: Pose, k: number) => mixPose(from, to, k * k * (3 - 2 * k));

const limbs = (j: Joints) =>
  [
    `M${j.hip.x} ${j.hip.y}L${j.shoulder.x} ${j.shoulder.y}`,
    `M${j.lHand.x} ${j.lHand.y}L${j.lElbow.x} ${j.lElbow.y}L${j.shoulder.x} ${j.shoulder.y}L${j.rElbow.x} ${j.rElbow.y}L${j.rHand.x} ${j.rHand.y}`,
    `M${j.lFoot.x} ${j.lFoot.y}L${j.lKnee.x} ${j.lKnee.y}L${j.hip.x} ${j.hip.y}L${j.rKnee.x} ${j.rKnee.y}L${j.rFoot.x} ${j.rFoot.y}`,
  ].join('');

const Body: React.FC<{j: Joints; color: string; extra: number}> = ({j, color, extra}) => (
  <>
    <path d={limbs(j)} fill="none" stroke={color} strokeWidth={BONES.stroke + extra} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={j.head.x} cy={j.head.y} r={BONES.headR + extra / 2} fill={color} />
  </>
);

/** Point along the torso: k=0 shoulder, k=1 hip, beyond 1 continues below the hip. */
const torsoAt = (j: Joints, k: number, side: number) => {
  const dx = j.hip.x - j.shoulder.x;
  const dy = j.hip.y - j.shoulder.y;
  const len = Math.hypot(dx, dy);
  return {x: j.shoulder.x + dx * k + (-dy / len) * side, y: j.shoulder.y + dy * k + (dx / len) * side};
};

const Apron: React.FC<{j: Joints; state: StoryScene['ravi']}> = ({j, state}) => {
  const fill = state === 'clean' ? '#efe3c8' : state === 'dusty' ? '#cfc4ad' : '#a89f8e';
  const tl = torsoAt(j, 0.28, -16);
  const tr = torsoAt(j, 0.28, 16);
  const br = torsoAt(j, 1.62, 25);
  const bl = torsoAt(j, 1.62, -25);
  // After the impact one bottom corner is torn away (a ragged notch).
  const pts = state === 'torn-wet'
    ? [tl, tr, br, torsoAt(j, 1.62, 8), torsoAt(j, 1.4, 2), torsoAt(j, 1.5, -10), torsoAt(j, 1.25, -25)]
    : [tl, tr, br, bl];
  return (
    <>
      <path d={`M${pts.map((p) => `${p.x} ${p.y}`).join('L')}Z`} fill={fill} stroke="#00000055" strokeWidth={2} />
      {state !== 'clean' ? <circle cx={torsoAt(j, 1.1, 6).x} cy={torsoAt(j, 1.1, 6).y} r={5} fill="#00000033" /> : null}
    </>
  );
};

type FigureProps = {pose: Pose; x: number; y: number; scale?: number; facing?: 1 | -1};

/** Glowing stick figure; (x, y) is where its lowest point touches the ground. */
const Figure: React.FC<FigureProps & {color: string; glow: string; children?: (j: Joints) => React.ReactNode}> = ({
  pose, x, y, scale = 1, facing = 1, color, glow, children,
}) => {
  const j = solve(pose);
  const k = useContext(PersonScale);
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * scale * k} ${scale * k})`}>
      <g filter="url(#glowWide)" opacity={0.28}><Body j={j} color={glow} extra={28} /></g>
      <g filter="url(#glowTight)" opacity={0.6}><Body j={j} color={glow} extra={10} /></g>
      <Body j={j} color={color} extra={0} />
      {children?.(j)}
    </g>
  );
};

export const Ravi: React.FC<FigureProps & {state: StoryScene['ravi']}> = ({state, ...p}) => (
  <Figure {...p} color="#ffffff" glow="#dfe3f5">
    {(j) => (
      <>
        <Apron j={j} state={state} />
        {state === 'torn-wet' ? (
          <path d={`M${(j.shoulder.x + j.rElbow.x * 2) / 3} ${(j.shoulder.y + j.rElbow.y * 2) / 3}L${j.rElbow.x} ${j.rElbow.y}`}
            stroke="#b4473f" strokeWidth={6} strokeLinecap="round" />
        ) : null}
      </>
    )}
  </Figure>
);

/** Mara: raincoat and hood, the coast-watch signal lamp in her right hand (`lamp` = how lit its lens is, 0..1). */
export const Mara: React.FC<FigureProps & {lamp?: number; book?: boolean}> = ({lamp = 0, book = false, ...p}) => (
  <Figure {...p} color="#d9e1ef" glow="#aebbd3">
    {(j) => {
      const tl = torsoAt(j, 0.05, -24);
      const tr = torsoAt(j, 0.05, 24);
      const br = torsoAt(j, 1.75, 40);
      const bl = torsoAt(j, 1.75, -40);
      const h = j.rHand;
      return (
        <>
          <path d={`M${tl.x} ${tl.y}L${tr.x} ${tr.y}L${br.x} ${br.y}L${bl.x} ${bl.y}Z`} fill="#1c2638" stroke="#d9e1ef" strokeWidth={3} />
          <path d={`M${j.head.x - 33} ${j.head.y + 8}A33 36 0 0 1 ${j.head.x + 33} ${j.head.y + 8}`} fill="none" stroke="#1c2638" strokeWidth={12} />
          {book ? <rect x={j.lHand.x - 30} y={j.lHand.y - 40} width={44} height={56} rx={4} fill="#5a3a26" stroke="#d9e1ef" strokeWidth={2} /> : null}
          <g transform={`translate(${h.x} ${h.y})`}>
            <rect x={-18} y={-30} width={40} height={34} rx={5} fill="#2b2f36" stroke="#d9e1ef" strokeWidth={2} />
            <rect x={-6} y={-46} width={16} height={16} rx={3} fill="#2b2f36" />
            <circle cx={24} cy={-13} r={11} fill={lamp > 0.05 ? '#fff4c8' : '#4a4a50'} opacity={0.4 + 0.6 * lamp} />
          </g>
        </>
      );
    }}
  </Figure>
);

/** Other townspeople: dimmer and slightly smaller than Ravi, so the hero stays readable in a crowd. */
export const Townsperson: React.FC<FigureProps> = (p) => <Figure {...p} color="#b9c2d4" glow="#8995ad" />;

/** Mia, about ten: smaller, yellow raincoat, ponytail; `light` = her flashlight (0 off .. 1 on). */
export const Mia: React.FC<FigureProps & {light?: number}> = ({light = 0, ...p}) => (
  <Figure {...p} color="#fff7f0" glow="#ffd7a8">
    {(j) => {
      const tl = torsoAt(j, 0.05, -22);
      const tr = torsoAt(j, 0.05, 22);
      const br = torsoAt(j, 1.55, 36);
      const bl = torsoAt(j, 1.55, -36);
      const h = j.rHand;
      return (
        <>
          <path d={`M${tl.x} ${tl.y}L${tr.x} ${tr.y}L${br.x} ${br.y}L${bl.x} ${bl.y}Z`} fill="#f2b81f" stroke="#fff7f0" strokeWidth={3} />
          <path d={`M${j.head.x - 24} ${j.head.y - 6}q-26 10 -30 46`} fill="none" stroke="#5a3a26" strokeWidth={12} strokeLinecap="round" />
          <g transform={`translate(${h.x} ${h.y})`}>
            <rect x={-6} y={-30} width={14} height={34} rx={4} fill="#2b2f36" stroke="#fff7f0" strokeWidth={2} />
            <circle cx={1} cy={-32} r={8} fill={light > 0.05 ? '#fff4c8' : '#4a4a50'} />
          </g>
        </>
      );
    }}
  </Figure>
);

/** Kneeling on a raft, paddling with both hands (phase 0..1 = one stroke). */
export const paddle = (phase: number): Pose => {
  const s = Math.sin(phase * Math.PI * 2);
  return {lean: 48, lUA: 70 + 40 * s, lFA: 20, rUA: 70 - 40 * s, rFA: 20, lTh: 70, lSh: -150, rTh: 60, rSh: -140};
};

/** Walking up a flight of stairs: forward lean, knees lifted high (phase 0..1 = two steps). */
export const stairs = (phase: number): Pose => {
  const s = Math.sin(phase * Math.PI * 2);
  const c = Math.cos(phase * Math.PI * 2);
  return {
    lean: 16,
    lTh: 10 + 42 * Math.max(0, s) - 12 * Math.max(0, -s),
    rTh: 10 + 42 * Math.max(0, -s) - 12 * Math.max(0, s),
    lSh: -70 * Math.max(0, s) - 8 + 10 * c,
    rSh: -70 * Math.max(0, -s) - 8 - 10 * c,
    lUA: -24 * s + 10, lFA: 40, rUA: 24 * s + 10, rFA: 40,
  };
};

/** Sitting on the ground, knees up, arms on the knees. */
export const SIT: Pose = {lean: 6, lUA: 40, lFA: 50, rUA: 34, rFA: 56, lTh: 92, lSh: -100, rTh: 84, rSh: -96};
/** Looking up at the sky, one arm half raised. */
export const LOOK_UP: Pose = {lean: -16, lUA: -10, lFA: 20, rUA: 120, rFA: 20, lTh: 6, lSh: -4, rTh: -6, rSh: -4};
