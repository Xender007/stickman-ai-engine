/** Reusable composite parts for the 16:9 chapters. */
import React from 'react';
import { CardW, Callout, Doodle, INK, PAL, Person, POSE, SkylineW, Txt, W, clamp, ease, lerp, pop, ramp, rnd, tri } from './kit.tsx';

/** night street seen through the glass, drawn inside the box (x,y,w,h) */
export const NightBox: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <defs><linearGradient id="nbsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2646" /><stop offset="0.6" stopColor="#5a4f82" /><stop offset="1" stopColor="#6d6595" /></linearGradient><clipPath id={`nbclip-${x}-${y}`}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
    <g clipPath={`url(#nbclip-${x}-${y})`}>
      <rect x={x} y={y} width={w} height={h} fill="url(#nbsky)" />
      <g transform={`translate(${x} ${y + h * 0.5}) scale(${w / 1280} ${h / 330})`}><SkylineW y={0} color="#2f2b4d" /></g>
      <rect x={x} y={y + h * 0.5} width={w} height={h * 0.5} fill="#4c456f" />
      <circle cx={x + w * 0.72} cy={y + h * 0.2} r={22} fill="#f4efe0" stroke={INK} strokeWidth={2} />
      {[0.14, 0.86].map((a) => <g key={a}><rect x={x + w * a - 3} y={y + h * 0.28} width={6} height={h * 0.3} fill="#2a2646" /><circle cx={x + w * a} cy={y + h * 0.28} r={8} fill="#ffe6a8" /></g>)}
    </g>
  </g>
);
/** sliding glass double doors in a frame; children are drawn behind the glass */
export const GlassDoors: React.FC<{ x?: number; y?: number; w?: number; h?: number; open: number; sensor?: boolean; children?: React.ReactNode }> = ({ x = 340, y = 130, w = 600, h = 340, open, sensor = true, children }) => {
  const pw = w / 2, gap = open * (pw - 16);
  return (
    <g>
      <rect x={x - 14} y={y - 56} width={w + 28} height={h + 56} fill="#cbbd9c" stroke={INK} strokeWidth={4} />
      <NightBox x={x} y={y} w={w} h={h} />
      {children}
      <rect x={x} y={y - 44} width={w} height={36} fill="#3a3f48" stroke={INK} strokeWidth={3} /><circle cx={x + w / 2} cy={y - 26} r={7} fill={sensor ? '#e5392b' : '#4a1d1a'} stroke={INK} strokeWidth={2} />
      {[0, 1].map((i) => { const px = i === 0 ? x - gap : x + pw + gap; return <g key={i}><rect x={px} y={y} width={pw} height={h} fill="#cfe3ee" opacity={0.22} stroke={INK} strokeWidth={4} /><line x1={px + 30} y1={y + 14} x2={px + 70} y2={y + 120} stroke="#fff" strokeWidth={6} opacity={0.25} /></g>; })}
      <rect x={x - 18} y={y + h} width={w + 36} height={20} fill="#a8997b" stroke={INK} strokeWidth={3} />
    </g>
  );
};
export const StoreBand: React.FC<{ y?: number }> = ({ y = 62 }) => (
  <g><rect x={-100} y={y - 50} width={W + 200} height={50} fill={PAL.teal} stroke={INK} strokeWidth={3} /><Txt x={W / 2} y={y - 15} size={26} fill="#dff2ef" ls={3} maxW={700}>WELCOME TO OAKLINE FOODS</Txt></g>
);
export const ProblemW: React.FC<{ n: string; title: string; lt: number; icon?: React.ReactNode }> = ({ n, title, lt, icon }) => {
  const a = pop(ramp(lt, 0.05, 0.55)), b = ramp(lt, 0.3, 0.75);
  return (
    <g>
      <CardW />
      <g transform={`translate(640 170) scale(${a})`}>{icon}</g>
      <Txt x={640} y={330} size={44} fill="#6f7f6a" ls={8} o={b}>PROBLEM {n}</Txt>
      <Txt x={640} y={470} size={128} fill={INK} ls={4} o={b} maxW={1100}>{title}</Txt>
    </g>
  );
};
export const BarW: React.FC<{ x: number; y: number; w: number; h?: number; v: number; label: string; value: string; color?: string }> = ({ x, y, w, h = 60, v, label, value, color = '#d9462a' }) => (
  <g>
    <Txt x={x} y={y - 14} size={32} fill={INK} ls={2} anchor="start" maxW={500}>{label}</Txt>
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#f4f8f1" stroke={INK} strokeWidth={3.5} />
    <rect x={x + 3} y={y + 3} width={Math.max(0, (w - 6) * clamp(v))} height={h - 6} rx={8} fill={color} />
    <Txt x={x + w - 14} y={y + h - 16} size={34} fill={INK} ls={1} anchor="end" o={clamp(v * 4)} maxW={300}>{value}</Txt>
  </g>
);
/** brass key with tag */
export const Fist: React.FC<{ x: number; y: number; s?: number; t?: number; key2?: number }> = ({ x, y, s = 1, t = 0, key2 = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 9) * 1.2})`}>
    <rect x={-120} y={-30} width={240} height={190} rx={60} fill="#8fc66d" stroke={INK} strokeWidth={8} />
    {[-90, -30, 30, 90].map((fx, i) => <g key={fx}><rect x={fx - 28} y={-110} width={56} height={110} rx={28} fill="#8fc66d" stroke={INK} strokeWidth={7} /><line x1={fx - 16} y1={-30} x2={fx + 16} y2={-30} stroke="#4f7a3a" strokeWidth={5} strokeLinecap="round" /></g>)}
    <rect x={-170} y={20} width={80} height={46} rx={23} fill="#8fc66d" stroke={INK} strokeWidth={7} transform="rotate(-18 -130 40)" />
    <path d="M 40 40 l 30 -10 l 12 24 l -32 14 z" fill="#7a1c1c" opacity={0.8} />
    <g opacity={key2}><path d="M -14 -112 L 4 -148 L 30 -112" fill="#f0c43a" stroke={INK} strokeWidth={4} />{[0, 1, 2, 3, 4].map((k) => <line key={k} x1={8} y1={-130} x2={8 + Math.cos(k * 1.1 + t * 3) * 70} y2={-130 - Math.abs(Math.sin(k * 1.1 + t * 3)) * 60} stroke="#fff6c8" strokeWidth={4} opacity={0.8} />)}</g>
  </g>
);
export { Callout, Doodle, Person, POSE, ease, lerp, rnd, tri };
