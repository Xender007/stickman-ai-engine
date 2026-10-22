import React from 'react';
import {noise2D} from '@remotion/noise';

/** The wooden door Ravi rides; (x, y) is the middle of its top surface. */
export const DoorRaft: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const rock = noise2D('raft', t * 0.9, 0) * 4;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rock})`}>
      <rect x={-95} y={0} width={190} height={24} rx={4} fill="#6b4428" stroke="#2a180c" strokeWidth={4} />
      {[-60, -10, 40].map((px) => <rect key={px} x={px} y={5} width={30} height={14} fill="#00000025" />)}
      <circle cx={70} cy={12} r={5} fill="#c9a24a" />
    </g>
  );
};

/** A car floating on its roof-line, spinning slowly. */
export const FloatingCar: React.FC<{x: number; y: number; spin: number}> = ({x, y, spin}) => (
  <g transform={`translate(${x} ${y}) rotate(${spin})`}>
    <path d="M-120 0L-108 -44L-54 -80L56 -80L92 -42L124 -38L124 0Z" fill="#c4473f" stroke="#f1e8d8" strokeWidth={4} />
    <path d="M-48 -70L-6 -70L-6 -44L-88 -44Z M4 -70L50 -70L80 -44L4 -44Z" fill="#9fd0e6" opacity={0.85} />
    <circle cx={-66} cy={6} r={24} fill="#141416" />
    <circle cx={72} cy={6} r={24} fill="#141416" />
  </g>
);

/** Wreckage piled against the tower's main door. */
export const DebrisPile: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g fill="#120f12">
    <path d={`M${x - 120} ${y}L${x - 80} ${y - 60}L${x - 20} ${y - 90}L${x + 40} ${y - 70}L${x + 110} ${y - 30}L${x + 130} ${y}Z`} />
    <rect x={x - 90} y={y - 130} width={180} height={14} transform={`rotate(-24 ${x} ${y - 120})`} />
    <rect x={x - 40} y={y - 150} width={140} height={12} transform={`rotate(31 ${x} ${y - 140})`} />
  </g>
);

/**
 * A rescue helicopter (side view, facing left) at (x, y). `blink` = its searchlight flashing back; `beam` = a steady
 * searchlight cone down to the roof below, 0..1.
 */
export const Helicopter: React.FC<{x: number; y: number; t: number; blink: boolean; beam: number; groundY: number; scale?: number; color?: string}> = ({x, y, t, blink, beam, groundY, scale = 1, color = '#d9dde6'}) => {
  const rotor = 150 + 140 * Math.abs(Math.sin(t * 40));
  return (
    <g>
      {beam > 0 ? <path d={`M${x - 30} ${y + 30}L${x - 190} ${groundY}L${x + 130} ${groundY}Z`} fill="#fff6d0" opacity={0.22 * beam} /> : null}
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx={0} cy={0} rx={95} ry={45} fill={color} stroke="#1a1d24" strokeWidth={5} />
        <rect x={60} y={-14} width={170} height={20} rx={8} fill={color} stroke="#1a1d24" strokeWidth={4} />
        <rect x={210} y={-48} width={16} height={56} rx={4} fill="#c0392b" />
        <path d="M-80 -6Q-70 -40 -20 -40L10 -40L10 -4Z" fill="#7fb8d6" stroke="#1a1d24" strokeWidth={4} />
        <rect x={-20} y={8} width={90} height={14} fill="#f2f2f2" />
        <circle cx={226} cy={-50} r={6} fill={t % 1 < 0.15 ? '#ff4040' : '#5a1010'} />
        <circle cx={-90} cy={4} r={5} fill={t % 1.3 < 0.2 ? '#ffffff' : '#556'} />
        <rect x={-6} y={-60} width={12} height={20} fill="#1a1d24" />
        <rect x={-rotor} y={-66} width={rotor * 2} height={6} rx={3} fill="#1a1d24" opacity={0.85} />
        <path d="M-60 60H70M-40 46V60M50 46V60" stroke="#1a1d24" strokeWidth={6} />
        <circle cx={-40} cy={36} r={blink ? 16 : 8} fill={blink ? '#fffbe8' : '#55555c'} />
        {blink ? <circle cx={-40} cy={36} r={110} fill="url(#wGlow)" /> : null}
      </g>
    </g>
  );
};
