import React from 'react';
import { C, Glow, H, W, rnd } from './common.tsx';

export const FLOOR = 940;

/** Side-view apartment room with the front door on the right. */
export const Room: React.FC<{
  f: number; tint?: string; light?: number; chain?: number; chair?: { x: number; y: number; rot: number } | null;
  chalk?: { count: number; crossed: number } | null; candle?: boolean; window?: React.ReactNode; knockShake?: number;
  extra?: React.ReactNode;
}> = ({ f, tint = '#16223f', light = 1, chain = 0, chair = null, chalk = null, candle = false, window: win, knockShake = 0, extra }) => (
  <g transform={`translate(${knockShake} 0)`}>
    <rect width={W} height={H} fill={tint} />
    <rect y={FLOOR} width={W} height={H - FLOOR} fill="#0d1426" />
    <rect y={FLOOR} width={W} height={5} fill="#34456c" />
    {Array.from({ length: 6 }, (_, i) => <line key={i} x1={i * 150 - 20} y1={FLOOR + 5} x2={i * 150 - 90} y2={H} stroke="#0a1020" strokeWidth={3} />)}
    {win}
    {/* front door */}
    <rect x={548} y={560} width={128} height={FLOOR - 560} fill="#2e2a2c" stroke="#59495a" strokeWidth={4} />
    <rect x={560} y={590} width={104} height={150} fill="#262224" stroke="#46394a" strokeWidth={2} />
    <rect x={560} y={760} width={104} height={160} fill="#262224" stroke="#46394a" strokeWidth={2} />
    <circle cx={612} cy={600} r={7} fill="#0a0a0c" stroke="#8a8a90" strokeWidth={2} />
    {/* handle */}
    <rect x={558} y={776} width={34} height={8} rx={4} fill="#b8b2a0" />
    <circle cx={595} cy={780} r={6} fill="#b8b2a0" />
    {/* chain */}
    <g>
      <rect x={640} y={680} width={20} height={8} fill="#888" />
      <line x1={650} y1={684} x2={650 - 60 * (1 - chain)} y2={684 + 14 * (1 - chain)} stroke="#c9c2a2" strokeWidth={3} strokeDasharray="6 3" />
      <rect x={560} y={678} width={30} height={10} rx={3} fill="#777" />
      {chain > 0.5 && <circle cx={592} cy={684} r={4} fill="#c9c2a2" />}
    </g>
    {/* chalk marks on the inner face */}
    {chalk && (
      <g>
        {Array.from({ length: chalk.count }, (_, i) => {
          const x = 570 + (i % 7) * 14, y = 610 + Math.floor(i / 7) * 54;
          return (
            <g key={i} opacity={0.92}>
              <line x1={x} y1={y} x2={x} y2={y + 36} stroke="#f2f2ea" strokeWidth={4} strokeLinecap="round" />
              {i < chalk.crossed && <line x1={x - 8} y1={y + 30} x2={x + 8} y2={y + 4} stroke="#f2f2ea" strokeWidth={3} strokeLinecap="round" />}
            </g>
          );
        })}
      </g>
    )}
    {chair && (
      <g transform={`translate(${chair.x} ${chair.y}) rotate(${chair.rot})`}>
        <rect x={-34} y={-60} width={68} height={10} rx={3} fill="#7b5a3a" />
        <rect x={-34} y={-130} width={10} height={80} fill="#7b5a3a" />
        <rect x={-34} y={-130} width={40} height={8} fill="#7b5a3a" />
        <rect x={-30} y={-50} width={8} height={50} fill="#5b412a" /><rect x={22} y={-50} width={8} height={50} fill="#5b412a" />
      </g>
    )}
    {extra}
    {candle && <Glow x={300} y={720} r={560} color={C.candle} o={0.38 + 0.08 * Math.sin(f * 0.9) + (rnd(Math.floor(f / 2)) - 0.5) * 0.08} id="cndl" />}
  </g>
);
