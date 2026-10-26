import React from 'react';
import { INK, PAL } from './doodle.tsx';
import { clamp, lerp, rnd } from '../zombie-break/common.tsx';

export const W = 720, H = 1280;
export const ink = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** warm paper grain over everything (static) */
export const Grain: React.FC = () => (
  <>
    <defs>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.22 0" />
      </filter>
    </defs>
    <rect width={W} height={H} filter="url(#grain)" opacity={0.5} style={{ mixBlendMode: 'multiply' }} />
  </>
);

export const Vig: React.FC<{ o?: number }> = ({ o = 0.45 }) => (
  <>
    <defs>
      <radialGradient id="vg" cx="0.5" cy="0.5" r="0.75"><stop offset="0.5" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#1a1020" stopOpacity={o} /></radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#vg)" />
  </>
);

/** Night parking lot seen through glass */
export const NightLot: React.FC<{ y0?: number; h?: number; moon?: boolean }> = ({ y0 = 0, h = 900, moon = true }) => (
  <g>
    <defs>
      <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2646" /><stop offset="0.6" stopColor="#5a4f82" /><stop offset="1" stopColor="#6d6595" /></linearGradient>
    </defs>
    <rect x={0} y={y0} width={W} height={h} fill="url(#nsky)" />
    {moon && <circle cx={470} cy={y0 + 120} r={34} fill="#f4efe0" stroke={INK} strokeWidth={2} />}
    {Array.from({ length: 14 }, (_, i) => {
      const x = i * 56 - 10, hh = 70 + rnd(i) * 120;
      return <g key={i}><rect x={x} y={y0 + h * 0.45 - hh} width={50} height={hh} fill="#2f2b4d" />{Array.from({ length: 5 }, (_, k) => rnd(i * 9 + k) > 0.55 && <rect key={k} x={x + 8 + (k % 2) * 20} y={y0 + h * 0.45 - hh + 12 + k * 22} width={8} height={9} fill="#ffcf6a" />)}</g>;
    })}
    <rect x={0} y={y0 + h * 0.45} width={W} height={h * 0.55} fill="#4c456f" />
    {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={80 + i * 140} y1={y0 + h * 0.5} x2={i * 180 - 40} y2={y0 + h} stroke="#cfc6e6" strokeWidth={4} opacity={0.5} />)}
    {[110, 600].map((x) => (
      <g key={x}><rect x={x - 3} y={y0 + h * 0.2} width={6} height={h * 0.3} fill="#2a2646" /><circle cx={x} cy={y0 + h * 0.2} r={9} fill="#ffe6a8" /><ellipse cx={x} cy={y0 + h * 0.5} rx={90} ry={14} fill="#ffe6a8" opacity={0.18} /></g>
    ))}
  </g>
);

/** Sliding glass double doors in a frame (centre gap grows with `open`, 0..1). */
export const Doors: React.FC<{ x?: number; y?: number; w?: number; h?: number; open: number; sensorOn?: boolean; children?: React.ReactNode }> = ({ x = 60, y = 230, w = 600, h = 640, open, sensorOn = true, children }) => {
  const pw = w / 2, gap = open * (pw - 20);
  return (
    <g>
      <rect x={x - 14} y={y - 70} width={w + 28} height={h + 70} fill="#cbbd9c" stroke={INK} strokeWidth={4} />
      <rect x={x} y={y} width={w} height={h} fill="#8e86b4" />
      <g>{children}</g>
      <rect x={x} y={y - 54} width={w} height={44} fill="#3a3f48" stroke={INK} strokeWidth={3} />
      <circle cx={x + w / 2} cy={y - 32} r={7} fill={sensorOn ? '#e5392b' : '#4a1d1a'} stroke={INK} strokeWidth={2} />
      {[0, 1].map((i) => {
        const px = i === 0 ? x - gap : x + pw + gap;
        return <g key={i}><rect x={px} y={y} width={pw} height={h} fill="#cfe3ee" opacity={0.22} stroke={INK} strokeWidth={4} /><rect x={px + 8} y={y + 8} width={pw - 16} height={h - 16} fill="none" stroke="#fff" strokeWidth={2} opacity={0.4} /><line x1={px + 40} y1={y + 20} x2={px + 90} y2={y + 160} stroke="#fff" strokeWidth={6} opacity={0.25} /></g>;
      })}
      <rect x={x - 20} y={y + h} width={w + 40} height={26} fill="#a8997b" stroke={INK} strokeWidth={3} />
    </g>
  );
};

export const Floor: React.FC<{ y: number; color?: string }> = ({ y, color = PAL.floor }) => (
  <g>
    <rect x={0} y={y} width={W} height={H - y} fill={color} />
    {Array.from({ length: 8 }, (_, i) => <line key={i} x1={0} y1={y + 40 + i * 70} x2={W} y2={y + 40 + i * 70} stroke="#b9a984" strokeWidth={2} />)}
    {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 90} y1={y} x2={i * 90 + (i - 4) * 40} y2={H} stroke="#b9a984" strokeWidth={2} />)}
  </g>
);

/** Can / box / bottle colours used on shelves */
/** Muted supermarket packaging colours: [box body, label stripe] */
export const PACK: [string, string][] = [
  ['#e9dfc6', '#b8453d'], ['#3f6db0', '#f1ead6'], ['#d9b04a', '#f1ead6'], ['#8b9a5b', '#f1ead6'],
  ['#b8453d', '#f1ead6'], ['#4a4545', '#d9b04a'], ['#e07a3a', '#f1ead6'], ['#6aa6a3', '#f1ead6'], ['#d9cfe0', '#7b5aa6'],
];
const SHELF_BACK = '#6f6452';

/** One flat shelf level facing the camera: dark back panel, groups of same-product boxes with label stripes,
 *  a white front lip with small yellow price tags (like the reference reel). */
export const ShelfRow: React.FC<{ x: number; y: number; w: number; h?: number; seed?: number }> = ({ x, y, w, h = 70, seed = 1 }) => {
  const els: React.ReactNode[] = [];
  let cx = x + 6, g = 0;
  while (cx < x + w - 14) {
    const [body, stripe] = PACK[Math.floor(rnd(seed * 13 + g * 5) * PACK.length)];
    const n = 3 + Math.floor(rnd(seed * 7 + g * 3) * 4);
    const bw = 15 + Math.floor(rnd(seed + g) * 10), bh = (h - 18) * (0.72 + rnd(seed * 3 + g) * 0.28);
    els.push(<rect key={`t${g}`} x={cx - 1} y={y + h - 6} width={9} height={7} fill="#e8c545" stroke={INK} strokeWidth={1} />);
    for (let k = 0; k < n && cx < x + w - 14; k++) {
      els.push(<g key={`${g}-${k}`}><rect x={cx} y={y + h - 8 - bh} width={bw} height={bh} fill={body} stroke={INK} strokeWidth={1.6} /><rect x={cx} y={y + h - 8 - bh * 0.7} width={bw} height={bh * 0.3} fill={stripe} stroke={INK} strokeWidth={1.2} /></g>);
      cx += bw + 1.5;
    }
    cx += 5 + rnd(g + seed) * 4;
    g++;
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={SHELF_BACK} stroke={INK} strokeWidth={2.5} />
      {els}
      <rect x={x} y={y + h - 8} width={w} height={9} fill="#f1ede0" stroke={INK} strokeWidth={2.2} />
      <rect x={x} y={y + h + 1} width={w} height={5} fill="#3e362b" />
    </g>
  );
};

export const Can: React.FC<{ x: number; y: number; c?: string; s?: number }> = ({ x, y, c = '#c04b4b', s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-13} y={-34} width={26} height={34} rx={4} fill={c} stroke={INK} strokeWidth={2.5} />
    <rect x={-13} y={-22} width={26} height={11} fill="#f2e2c2" stroke={INK} strokeWidth={1.5} />
  </g>
);

export const Sign: React.FC<{ x: number; y: number; w: number; h: number; text: string; size?: number; fill?: string; color?: string }> = ({ x, y, w, h, text, size = 28, fill = PAL.teal, color = '#f6f1e2' }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={INK} strokeWidth={3.5} />
    <text x={x + w / 2} y={y + h / 2 + size * 0.35} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={size} fill={color} letterSpacing={2}>{text}</text>
  </g>
);

/** Card background used for infographic beats */
export const CardBg: React.FC = () => <rect width={W} height={H} fill="#dbe5d6" />;

export const Shopcart: React.FC<{ x: number; y: number; s?: number; flip?: boolean }> = ({ x, y, s = 1, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <path d="M -50 -70 L 50 -70 L 40 -20 L -40 -20 Z" fill="#cdd5da" fillOpacity={0.4} stroke={INK} strokeWidth={3} />
    {[-30, -10, 10, 30].map((x2) => <line key={x2} x1={x2} y1={-70} x2={x2 * 0.8} y2={-20} stroke={INK} strokeWidth={1.5} />)}
    <line x1={-50} y1={-70} x2={-70} y2={-92} stroke={INK} strokeWidth={4} /><line x1={-80} y1={-92} x2={-60} y2={-92} stroke={INK} strokeWidth={5} />
    <circle cx={-26} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /><circle cx={28} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} />
  </g>
);

export { clamp, lerp, rnd };
