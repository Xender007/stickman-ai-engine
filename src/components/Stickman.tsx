import React from 'react';
import {BONES, Joints} from '../rig/pose';

const limbs = (j: Joints) =>
  [
    `M${j.hip.x} ${j.hip.y}L${j.shoulder.x} ${j.shoulder.y}`,
    `M${j.lHand.x} ${j.lHand.y}L${j.lElbow.x} ${j.lElbow.y}L${j.shoulder.x} ${j.shoulder.y}L${j.rElbow.x} ${j.rElbow.y}L${j.rHand.x} ${j.rHand.y}`,
    `M${j.lFoot.x} ${j.lFoot.y}L${j.lKnee.x} ${j.lKnee.y}L${j.hip.x} ${j.hip.y}L${j.rKnee.x} ${j.rKnee.y}L${j.rFoot.x} ${j.rFoot.y}`,
  ].join('');

const Body: React.FC<{j: Joints; d: string; color: string; extra: number; cup: boolean}> = ({j, d, color, extra, cup}) => (
  <>
    <path d={d} fill="none" stroke={color} strokeWidth={BONES.stroke + extra} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={j.head.x} cy={j.head.y} r={BONES.headR + extra / 2} fill={color} />
    {cup ? (
      <rect x={j.rHand.x - 2 - extra / 2} y={j.rHand.y - 22 - extra / 2} width={16 + extra} height={22 + extra} rx={3} fill={color} />
    ) : null}
  </>
);

/** Glowing white stick figure. (x, y) is where its lowest point touches the ground. */
export const Stickman: React.FC<{j: Joints; x: number; y: number; facing?: 1 | -1; scale?: number; cup?: boolean}> = ({
  j, x, y, facing = 1, scale = 1, cup = false,
}) => {
  const d = limbs(j);
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * scale} ${scale})`}>
      <g filter="url(#glowWide)" opacity={0.3}>
        <Body j={j} d={d} color="#dfe3f5" extra={30} cup={cup} />
      </g>
      <g filter="url(#glowTight)" opacity={0.65}>
        <Body j={j} d={d} color="#c9ccd9" extra={11} cup={cup} />
      </g>
      <Body j={j} d={d} color="#ffffff" extra={0} cup={cup} />
    </g>
  );
};
