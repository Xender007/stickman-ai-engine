import React from 'react';
import { Pose, idlePose, rad } from '../zombie-break/common.tsx';

export const INK = '#2a2220';
export const PAL = {
  paper: '#f2e2c2', floor: '#d9caa4', wall: '#cfc09f', wallDark: '#b8a983',
  teal: '#6b3f86', tealDark: '#4d2c63', orange: '#e0602a', red: '#b83a3a', blue: '#3d63a8', grey: '#8d8d8d',
  night: '#3a3558', nightDark: '#262341', skin: '#f6e6c8', dead: '#b8c4b3', glow: '#ffe6a8',
};

const L1 = 34, L2 = 34, T = 54, U = 26, F = 26, HR = 24;
const pt = (x: number, y: number, len: number, deg: number) => [x + len * Math.sin(rad(deg)), y + len * Math.cos(rad(deg))] as const;

export type Kind = 'hero' | 'dana' | 'man' | 'dead' | 'kid';
type Props = { x: number; y: number; s?: number; flip?: boolean; pose?: Pose; kind?: Kind; opacity?: number; mouth?: 'line' | 'o' | 'none'; look?: number; hold?: React.ReactNode };

/** Doodle person like the reference: round head with a face, coloured clothes, thin limbs. (x,y) = hip joint. */
export const Doodle: React.FC<Props> = ({ x, y, s = 1.5, flip, pose = idlePose(), kind = 'hero', opacity = 1, mouth = 'line', look = 0, hold }) => {
  const lean = pose.lean;
  const lk = pt(0, 0, L1, pose.lT), lf = pt(lk[0], lk[1], L2, pose.lS);
  const rk = pt(0, 0, L1, pose.rT), rf = pt(rk[0], rk[1], L2, pose.rS);
  const neck: [number, number] = [T * Math.sin(rad(lean)), -T * Math.cos(rad(lean))];
  const sh: [number, number] = [(T - 6) * Math.sin(rad(lean)), -(T - 6) * Math.cos(rad(lean))];
  const le = pt(sh[0], sh[1], U, pose.lU), lh = pt(le[0], le[1], F, pose.lF);
  const re = pt(sh[0], sh[1], U, pose.rU), rh = pt(re[0], re[1], F, pose.rF);
  const hd: [number, number] = [neck[0] + (HR - 2) * Math.sin(rad(lean + (pose.head ?? 0))), neck[1] - (HR - 2) * Math.cos(rad(lean + (pose.head ?? 0)))];
  const line = (a: readonly number[], b: readonly number[], w = 4.5, c = INK) => (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
  );
  const cloth = { hero: '#8a2f3d', dana: '#d4a22c', man: '#7a5a3a', dead: '#6c7466', kid: '#d9a441' }[kind];
  const pants = { hero: '#3a4a5c', dana: '#3b3235', man: '#2f3b52', dead: '#4f5548', kid: '#4a5a6b' }[kind];
  const infected = kind === 'man';
  const skin = kind === 'dead' ? PAL.dead : infected ? '#8fc66d' : PAL.skin;
  const torsoW = kind === 'man' ? 34 : 28;
  const torsoEnd: [number, number] = kind === 'man' ? [-6 * Math.sin(rad(lean)), 26] : [0, 0];
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`} opacity={opacity}>
      {line([0, 0], rk, 5, pants)}{line(rk, rf, 5, pants)}{line(rf, [rf[0] + 9, rf[1] + 1], 6, INK)}
      {line(sh, re, 4.5, INK)}{line(re, rh, 4.5, INK)}
      <path d={`M ${-torsoW / 2 + torsoEnd[0]} ${torsoEnd[1]} L ${neck[0] - torsoW / 2 + 2} ${neck[1] + 4} L ${neck[0] + torsoW / 2 - 2} ${neck[1] + 4} L ${torsoW / 2 + torsoEnd[0]} ${torsoEnd[1]} Z`}
        fill={cloth} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {kind === 'hero' && <path d={`M ${neck[0] - 8} ${neck[1] + 4} L ${neck[0] * 0.5} ${neck[1] * 0.45} L ${neck[0] + 8} ${neck[1] + 4}`} fill="none" stroke="#f5ead2" strokeWidth={4} strokeLinejoin="round" />}
      {line([0, 0], lk, 5, pants)}{line(lk, lf, 5, pants)}{line(lf, [lf[0] + 9, lf[1] + 1], 6, INK)}
      {line(sh, le, 4.5, INK)}{line(le, lh, 4.5, INK)}
      {hold && <g transform={`translate(${lh[0]} ${lh[1]})`}>{hold}</g>}
      <circle cx={hd[0]} cy={hd[1]} r={HR} fill={skin} stroke={INK} strokeWidth={3.5} />
      {kind === 'dana' && <path d={`M ${hd[0] - HR - 3} ${hd[1] + 12} L ${hd[0] - HR - 3} ${hd[1] - 2} A ${HR + 3} ${HR + 3} 0 0 1 ${hd[0] + HR + 3} ${hd[1] - 2} L ${hd[0] + HR + 3} ${hd[1] + 12} Q ${hd[0] + HR - 2} ${hd[1] + 4} ${hd[0] + HR - 8} ${hd[1] - 6} Q ${hd[0]} ${hd[1] - 14} ${hd[0] - HR + 6} ${hd[1] - 6} Q ${hd[0] - HR + 2} ${hd[1] + 4} ${hd[0] - HR - 3} ${hd[1] + 12} Z`} fill="#2e2420" stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
      {kind === 'hero' && (
        <g>
          <path d={`M ${hd[0] - HR - 1} ${hd[1] - 3} A ${HR + 1} ${HR + 4} 0 0 1 ${hd[0] + HR + 1} ${hd[1] - 3} Z`} fill="#4d6b57" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <rect x={hd[0] - HR - 2} y={hd[1] - 11} width={2 * HR + 4} height={10} rx={4} fill="#3a5242" stroke={INK} strokeWidth={3} />
          <circle cx={hd[0] + 1} cy={hd[1] - HR - 5} r={6} fill="#cbd5c6" stroke={INK} strokeWidth={2.5} />
        </g>
      )}
      {kind === 'man' && <path d={`M ${hd[0] - HR + 1} ${hd[1] - 2} A ${HR} ${HR} 0 0 1 ${hd[0] + HR - 1} ${hd[1] - 2} Q ${hd[0] + 4} ${hd[1] - 13} ${hd[0] - HR + 1} ${hd[1] - 2} Z`} fill="#2c211a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
      {kind === 'dead' ? (
        <g><circle cx={hd[0] + 6 + look} cy={hd[1] + 4} r={4.5} fill="#232b25" /><circle cx={hd[0] + 17 + look} cy={hd[1] + 4} r={4.5} fill="#232b25" /><ellipse cx={hd[0] + 11 + look} cy={hd[1] + 15} rx={5} ry={3.5} fill="#232b25" /></g>
      ) : (
        <g>
          {infected ? <g><circle cx={hd[0] + 7 + look} cy={hd[1] + 5} r={4.6} fill="#f3f0a8" stroke={INK} strokeWidth={1.6} /><circle cx={hd[0] + 17 + look} cy={hd[1] + 5} r={4.6} fill="#f3f0a8" stroke={INK} strokeWidth={1.6} /><circle cx={hd[0] + 8 + look} cy={hd[1] + 5} r={1.8} fill={INK} /><circle cx={hd[0] + 18 + look} cy={hd[1] + 5} r={1.8} fill={INK} /><path d={`M ${hd[0] + 2 + look} ${hd[1] + 11} q 5 4 10 0 M ${hd[0] + 14 + look} ${hd[1] + 11} q 5 4 10 0`} fill="none" stroke="#4f7a3a" strokeWidth={2} /><path d={`M ${hd[0] - 6} ${hd[1] + 14} l 7 4 M ${hd[0] + 20} ${hd[1] - 8} l -5 8`} stroke="#4f7a3a" strokeWidth={2} fill="none" /></g> : <g><circle cx={hd[0] + 7 + look} cy={hd[1] + 5} r={2.6} fill={INK} /><circle cx={hd[0] + 17 + look} cy={hd[1] + 5} r={2.6} fill={INK} /></g>}
          {mouth === 'line' && <path d={`M ${hd[0] + 8 + look} ${hd[1] + 14} Q ${hd[0] + 12 + look} ${hd[1] + 16} ${hd[0] + 16 + look} ${hd[1] + 14}`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />}
          {kind === 'dana' && <g fill="none" stroke={INK} strokeWidth={2.2}><circle cx={hd[0] + 7 + look} cy={hd[1] + 5} r={6.5} /><circle cx={hd[0] + 18 + look} cy={hd[1] + 5} r={6.5} /><line x1={hd[0] + 13.5 + look} y1={hd[1] + 5} x2={hd[0] + 11.5 + look} y2={hd[1] + 5} /></g>}
          {mouth === 'o' && <ellipse cx={hd[0] + 12 + look} cy={hd[1] + 15} rx={3} ry={3.6} fill={INK} />}
        </g>
      )}
    </g>
  );
};
