/** Shared drawing kit for the time-driven chapter scenes (2-6): helpers, people, backdrops, props, cards. */
import React from 'react';
import { Doodle, INK, PAL } from '../store-ch1/doodle.tsx';
import type { Kind } from '../store-ch1/doodle.tsx';
import { CardBg, Doors, Floor, H, NightLot, ShelfRow, Shopcart, W, clamp, lerp, rnd } from '../store-ch1/props.tsx';
import { Aisle, AisleSign } from '../store-ch1/scenesA.tsx';
import { deadPose, idlePose, runPose, walkPose } from '../zombie-break/common.tsx';
import type { Pose } from '../zombie-break/common.tsx';

export { Aisle, AisleSign, CardBg, Doors, Floor, H, INK, NightLot, PAL, ShelfRow, Shopcart, W, clamp, lerp, rnd, idlePose, runPose, walkPose, deadPose };
export type { Pose, Kind };

export const font = { fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 } as const;
export const ramp = (x: number, a: number, b: number) => clamp((x - a) / Math.max(1e-6, b - a));
export const ease = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const pop = (x: number) => { const c = clamp(x); const s = 1.70158; return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2); };
export const tri = (x: number) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);

/** centred text */
export const Txt: React.FC<{ x: number; y: number; size?: number; fill?: string; ls?: number; o?: number; children: React.ReactNode; rot?: number; anchor?: 'start' | 'middle' | 'end'; stroke?: string }> = ({ x, y, size = 40, fill = INK, ls = 2, o = 1, children, rot = 0, anchor = 'middle', stroke }) => (
  <text x={x} y={y} textAnchor={anchor} {...font} fontSize={size} fill={fill} letterSpacing={ls} opacity={o} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} stroke={stroke} strokeWidth={stroke ? 6 : 0} paintOrder="stroke">{children}</text>
);

/* ---------- people ---------- */
export const LEG = 66;
/** a person standing with the feet on `floor`; s = scale */
export const Person: React.FC<{ kind?: Kind; x: number; floor: number; s?: number; flip?: boolean; pose?: Pose; opacity?: number; mouth?: 'line' | 'o' | 'none'; hold?: React.ReactNode; look?: number }> = ({ kind = 'hero', x, floor, s = 1.6, flip, pose, opacity, mouth, hold, look }) => (
  <Doodle x={x} y={floor - LEG * s} s={s} flip={flip} kind={kind} pose={pose ?? idlePose()} opacity={opacity} mouth={mouth} hold={hold} look={look} />
);
export const POSE = {
  idle: (t = 0): Pose => ({ ...idlePose(Math.sin(t * 2) * 1.2), head: 0 }),
  walk: (t: number, speed = 1.6, lean = 5): Pose => walkPose(t * speed * Math.PI * 2, lean),
  run: (t: number, speed = 1.5): Pose => runPose(t * speed * Math.PI * 2, 16, 52),
  carry: (base: Pose): Pose => ({ ...base, lU: 62, lF: 92, rU: 56, rF: 88 }),
  push: (base: Pose): Pose => ({ ...base, lU: 48, lF: 78, rU: 44, rF: 74 }),
  pull: (base: Pose): Pose => ({ ...base, lU: 55, lF: 40, rU: 50, rF: 36, lean: base.lean - 8 }),
  point: (base: Pose): Pose => ({ ...base, lU: 88, lF: 92 }),
  up: (base: Pose): Pose => ({ ...base, lU: 150, lF: 160, rU: 140, rF: 150 }),
  slump: (): Pose => ({ ...idlePose(), lean: 12, head: 14, lU: 8, lF: 10, rU: 4, rF: 8 }),
  sit: (): Pose => ({ lean: 3, head: 0, lT: 88, lS: 4, rT: 82, rS: 2, lU: 40, lF: 70, rU: 36, rF: 66 }),
};
const RAGS = ['#5a6a7a', '#7a4a3a', '#4a5a3a', '#8a8a7a', '#6a4a6a', '#3f5870', '#7a6a4a'];
const SKIN = ['#aebfa8', '#b9bda0', '#a4b4b4', '#b7aea0', '#9fb59a'];
/** a decayed walker: torn clothes, sunken eyes, wounds, shadow (all derived from the seed so a crowd looks varied) */
export const Dead: React.FC<{ x: number; floor: number; s?: number; t: number; seed?: number; flip?: boolean; opacity?: number; still?: boolean; look?: number }> = ({ x, floor, s = 1, t, seed = 1, flip, opacity = 1, still, look }) => {
  const p = still ? { ...idlePose(Math.sin(t * 1.4 + seed) * 2), lU: 62, lF: 80, rU: 70, rF: 88, head: 8 + Math.sin(t * 0.9 + seed * 3) * 4 } : deadPose(t, seed);
  const hipY = floor - LEG * s, r1 = rnd(seed * 3.7), r2 = rnd(seed * 5.3 + 1), r3 = rnd(seed * 7.9 + 2);
  const shirt = RAGS[Math.floor(r1 * RAGS.length)], skin = SKIN[Math.floor(r2 * SKIN.length)];
  const lk = look ?? 3, hx = (p.head ?? 0) * 0.18;
  const torn = Array.from({ length: 5 }, (_, i) => `L ${14 - i * 7 - (i % 2) * 2} ${-2 + (i % 2 ? 9 + r3 * 6 : 1)}`).join(' ');
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={floor + 2} rx={30 * s} ry={6 * s} fill="#07050f" opacity={0.32} />
      <Doodle x={x} y={hipY} s={s} kind="dead" pose={p} flip={flip} look={lk} />
      <g transform={`translate(${x} ${hipY}) scale(${(flip ? -1 : 1) * s} ${s})`}>
        <path d={`M -13 -50 L 13 -50 L 15 -2 ${torn} L -15 -2 Z`} fill={shirt} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" opacity={0.96} />
        <path d={`M ${-8 + r1 * 8} -40 q 6 8 ${2 + r2 * 6} 20 q -8 2 -10 -6 z`} fill="#5a1414" opacity={0.75} />
        <circle cx={hx} cy={-76} r={24} fill={skin} opacity={0.55} />
        {[6, 17].map((ex, i) => <g key={i}><ellipse cx={ex + lk + hx} cy={-72} rx={6.4} ry={7.2} fill="#1c221d" /><circle cx={ex + lk + 1 + hx} cy={-72} r={2} fill={i ? '#e6e8a0' : '#cfd88a'} /></g>)}
        <path d={`M ${6 + lk + hx} -60 q 6 6 14 0`} fill="none" stroke="#2a1010" strokeWidth={2.4} strokeLinecap="round" />
        {r3 > 0.3 && <path d={`M ${14 + hx} -64 l 7 9 l -3 3 l -6 -6 z`} fill="#7a1c1c" opacity={0.85} />}
        {r2 > 0.45 && <path d={`M -22 -80 A 24 24 0 0 1 ${-4 + r1 * 10} -99 q -6 6 -8 14 q -8 -2 -10 6 z`} fill="#2c241d" stroke={INK} strokeWidth={2} />}
        {r1 > 0.55 && <path d="M -3 -52 q 4 10 1 22" fill="none" stroke="#7a1c1c" strokeWidth={3} strokeLinecap="round" opacity={0.8} />}
      </g>
    </g>
  );
};
type Slot = { x: number; floor: number; s: number; seed: number; flip: boolean };
/** deterministic crowd scattered over a region, sorted back to front */
export const crowd = (n: number, seed: number, x0: number, x1: number, f0: number, f1: number, s0: number, s1: number, flipAll?: boolean): Slot[] =>
  Array.from({ length: n }, (_, i) => {
    const f = lerp(f0, f1, rnd(seed + i * 3.1));
    return { x: lerp(x0, x1, rnd(seed * 2 + i * 7.7)), floor: f, s: lerp(s0, s1, (f - f0) / Math.max(1, f1 - f0)), seed: i + seed, flip: flipAll ?? rnd(seed + i * 11) > 0.5 };
  }).sort((a, b) => a.floor - b.floor);
export const Crowd: React.FC<{ slots: Slot[]; t: number; still?: boolean; shown?: number; face?: 'left' | 'right' | 'mixed' }> = ({ slots, t, still = true, shown = 1, face = 'mixed' }) => (
  <g>{slots.map((s, i) => (
    <Dead key={i} x={s.x} floor={s.floor} s={s.s} t={t} seed={s.seed} still={still} flip={face === 'mixed' ? s.flip : face === 'left'} opacity={clamp(shown * slots.length - i)} />
  ))}</g>
);

/* ---------- backdrops ---------- */
export const Interior: React.FC<{ wall?: string; floor?: string; line?: number; tiles?: boolean }> = ({ wall = '#cfc09f', floor = PAL.floor, line = 900, tiles = true }) => (
  <g>
    <rect width={W} height={H} fill={wall} />
    <rect y={line - 14} width={W} height={14} fill="#b8a983" stroke={INK} strokeWidth={2.5} />
    <rect y={line} width={W} height={H - line} fill={floor} />
    {tiles && Array.from({ length: 6 }, (_, i) => <line key={i} x1={0} y1={line + 36 + i * 64} x2={W} y2={line + 36 + i * 64} stroke="#b9a984" strokeWidth={2} />)}
    {tiles && Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 90} y1={line} x2={i * 90 + (i - 4) * 50} y2={H} stroke="#b9a984" strokeWidth={2} />)}
  </g>
);
export const Sky: React.FC<{ y0?: number; h?: number; tone?: 'dawn' | 'day' | 'dusk' | 'night'; sun?: number }> = ({ y0 = 0, h = 420, tone = 'day', sun = 0.5 }) => {
  const g = { dawn: ['#f2b98a', '#f7d9a8'], day: ['#8cc4e8', '#d4ecf5'], dusk: ['#5b4a86', '#e49a6e'], night: ['#1c1a38', '#4a4478'] }[tone];
  return (
    <g>
      <defs><linearGradient id={`sky-${tone}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={g[0]} /><stop offset="1" stopColor={g[1]} /></linearGradient></defs>
      <rect y={y0} width={W} height={h} fill={`url(#sky-${tone})`} />
      {tone === 'night' && Array.from({ length: 26 }, (_, i) => <circle key={i} cx={rnd(i) * W} cy={y0 + rnd(i + 40) * h * 0.7} r={1 + rnd(i + 9) * 1.6} fill="#fff" opacity={0.7} />)}
      {tone !== 'night' && <circle cx={lerp(120, 600, sun)} cy={y0 + lerp(h * 0.7, h * 0.2, Math.sin(sun * Math.PI))} r={46} fill={tone === 'day' ? '#fff3b8' : '#ffe0a0'} stroke={INK} strokeWidth={3} />}
      {tone === 'night' && <circle cx={500} cy={y0 + 110} r={38} fill="#f4efe0" stroke={INK} strokeWidth={2.5} />}
    </g>
  );
};
export const Skyline: React.FC<{ y: number; color?: string; win?: boolean; seed?: number }> = ({ y, color = '#2f2b4d', win = true, seed = 0 }) => (
  <g>{Array.from({ length: 14 }, (_, i) => {
    const x = i * 56 - 10, hh = 70 + rnd(i + seed) * 130;
    return <g key={i}><rect x={x} y={y - hh} width={50} height={hh} fill={color} />{win && Array.from({ length: 5 }, (_, k) => rnd((i + seed) * 9 + k) > 0.55 && <rect key={k} x={x + 8 + (k % 2) * 20} y={y - hh + 12 + k * 22} width={8} height={9} fill="#ffcf6a" />)}</g>;
  })}</g>
);
/** the parking lot seen from above / the roof: ground with converging bay lines */
export const LotGround: React.FC<{ y0?: number; color?: string; line?: string }> = ({ y0 = 400, color = '#6b6585', line = '#e8e4f2' }) => (
  <g>
    <rect y={y0} width={W} height={H - y0} fill={color} />
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={W / 2 + (i - 4) * 38} y1={y0} x2={W / 2 + (i - 4) * 130} y2={H} stroke={line} strokeWidth={4} opacity={0.5} />)}
    {[0.18, 0.42, 0.7].map((a, i) => <line key={`h${i}`} x1={0} y1={lerp(y0, H, a)} x2={W} y2={lerp(y0, H, a)} stroke={line} strokeWidth={3} opacity={0.35} />)}
  </g>
);
/** foreground parapet: brick lip of the roof across the bottom of the frame */
export const Parapet: React.FC<{ y?: number }> = ({ y = 1010 }) => (
  <g>
    <rect y={y} width={W} height={H - y} fill="#8a6a58" stroke={INK} strokeWidth={4} />
    <rect y={y - 22} width={W} height={26} fill="#a9876f" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 4 }, (_, r) => Array.from({ length: 9 }, (_, i) => <rect key={`${r}${i}`} x={i * 84 - (r % 2) * 42} y={y + 6 + r * 56} width={80} height={52} fill="none" stroke="#6b4f40" strokeWidth={2} />))}
  </g>
);
export const Dark: React.FC<{ o: number; color?: string }> = ({ o, color = '#07050f' }) => <rect width={W} height={H} fill={color} opacity={clamp(o)} />;
/** flashlight beam from (x,y) towards `ang` degrees (0 = right) */
export const Beam: React.FC<{ x: number; y: number; ang: number; len?: number; spread?: number; o?: number }> = ({ x, y, ang, len = 700, spread = 16, o = 0.8 }) => {
  const a = (ang * Math.PI) / 180, s = (spread * Math.PI) / 180;
  return (
    <g opacity={o}>
      <defs><linearGradient id="beamg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff3b0" stopOpacity={0.85} /><stop offset="1" stopColor="#fff3b0" stopOpacity={0} /></linearGradient></defs>
      <g transform={`translate(${x} ${y}) rotate(${ang})`}><polygon points={`0,0 ${len},${-Math.tan(s) * len} ${len},${Math.tan(s) * len}`} fill="url(#beamg)" /></g>
      <circle cx={x} cy={y} r={7} fill="#fff6c8" />
      <title>{a}</title>
    </g>
  );
};

/* ---------- props ---------- */
export const Door: React.FC<{ x: number; y: number; w?: number; h?: number; open?: number; color?: string; sign?: string; frame?: string }> = ({ x, y, w = 240, h = 540, open = 0, color = '#7a8794', sign = 'EXIT', frame = '#2a2e38' }) => (
  <g>
    <rect x={x - 16} y={y - 16} width={w + 32} height={h + 16} fill={frame} stroke={INK} strokeWidth={5} />
    {open > 0.02 && <rect x={x} y={y} width={w} height={h} fill="#fff6d0" />}
    <polygon points={`${x},${y} ${x + w * (1 - open * 0.65)},${y + open * 24} ${x + w * (1 - open * 0.65)},${y + h - open * 24} ${x},${y + h}`} fill={color} stroke={INK} strokeWidth={4} />
    <rect x={x + w * (1 - open * 0.65) - 34} y={y + h * 0.5} width={20} height={44} rx={6} fill="#d9d4c0" stroke={INK} strokeWidth={3} opacity={1 - open * 0.3} />
    {sign && <g><rect x={x + w / 2 - 66} y={y - 74} width={132} height={52} rx={8} fill="#2f9b4f" stroke={INK} strokeWidth={4} /><Txt x={x + w / 2} y={y - 36} size={36} fill="#e8fff0" ls={4}>{sign}</Txt></g>}
  </g>
);
export const Litter: React.FC<{ x: number; floor: number; s?: number }> = ({ x, floor, s = 1 }) => (
  <g transform={`translate(${x} ${floor}) scale(${s})`}>
    <rect x={-70} y={-18} width={140} height={18} fill="#b98d54" stroke={INK} strokeWidth={3} />
    {[0, 1].map((r) => [0, 1, 2].map((c) => (
      <g key={`${r}${c}`}><rect x={-68 + c * 46} y={-74 - r * 56} width={44} height={54} rx={5} fill={['#6aa6a3', '#d9b04a', '#b8453d'][c]} stroke={INK} strokeWidth={2.5} /><rect x={-68 + c * 46} y={-60 - r * 56} width={44} height={16} fill="#f1ead6" stroke={INK} strokeWidth={1.5} /></g>
    )))}
  </g>
);
export const Keyy: React.FC<{ x: number; y: number; rot?: number; s?: number; color?: string }> = ({ x, y, rot = 0, s = 1, color = '#d9b04a' }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle cx={0} cy={0} r={22} fill="none" stroke={INK} strokeWidth={12} /><circle cx={0} cy={0} r={22} fill="none" stroke={color} strokeWidth={6} />
    <rect x={20} y={-5} width={78} height={11} fill={color} stroke={INK} strokeWidth={3} />
    <rect x={70} y={4} width={9} height={18} fill={color} stroke={INK} strokeWidth={3} /><rect x={86} y={4} width={9} height={14} fill={color} stroke={INK} strokeWidth={3} />
  </g>
);
export const Clock: React.FC<{ x: number; y: number; s?: number; t?: number; ring?: number; hour?: number; min?: number; face?: string; label?: string }> = ({ x, y, s = 1, t = 0, ring = 0, hour = 12, min = 0, face = '#f6f1e2', label }) => {
  const sh = ring ? Math.sin(t * 60) * 3 * ring : 0;
  return (
    <g transform={`translate(${x + sh} ${y}) scale(${s})`}>
      <line x1={-34} y1={50} x2={-48} y2={74} stroke={INK} strokeWidth={6} strokeLinecap="round" /><line x1={34} y1={50} x2={48} y2={74} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {[-1, 1].map((d) => <g key={d} transform={`rotate(${d * 36} 0 -4) translate(0 0)`}><path d={`M ${d * 6 - 16} -62 A 16 16 0 0 1 ${d * 6 + 16} -62 Z`} fill="#c98a3a" stroke={INK} strokeWidth={3} transform={`translate(${d * 24} -22)`} /></g>)}
      <circle cx={0} cy={0} r={56} fill="#c24a3a" stroke={INK} strokeWidth={5} />
      <circle cx={0} cy={0} r={43} fill={face} stroke={INK} strokeWidth={3} />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={Math.sin((i * Math.PI) / 6) * 36} y1={-Math.cos((i * Math.PI) / 6) * 36} x2={Math.sin((i * Math.PI) / 6) * 41} y2={-Math.cos((i * Math.PI) / 6) * 41} stroke={INK} strokeWidth={2.5} />)}
      <line x1={0} y1={0} x2={Math.sin(((hour % 12) + min / 60) * (Math.PI / 6)) * 22} y2={-Math.cos(((hour % 12) + min / 60) * (Math.PI / 6)) * 22} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin(min * (Math.PI / 30)) * 33} y2={-Math.cos(min * (Math.PI / 30)) * 33} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={0} cy={0} r={4} fill={INK} />
      {label && <Txt x={0} y={102} size={26} fill={INK} ls={1}>{label}</Txt>}
    </g>
  );
};
export const Bucket: React.FC<{ x: number; y: number; s?: number; tin?: number; rot?: number }> = ({ x, y, s = 1, tin = 0, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -40 -20 Q 0 -90 40 -20" fill="none" stroke={INK} strokeWidth={4} />
    <path d="M -44 -20 L 44 -20 L 34 56 L -34 56 Z" fill="#9a9f9a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={0} cy={-20} rx={44} ry={9} fill="#6b706b" stroke={INK} strokeWidth={3.5} />
    {Array.from({ length: Math.round(tin) }, (_, i) => <rect key={i} x={-26 + i * 15} y={-40 - (i % 2) * 8} width={14} height={20} rx={3} fill={['#b8453d', '#3f6db0', '#d9b04a', '#8b9a5b'][i % 4]} stroke={INK} strokeWidth={2} />)}
  </g>
);
export const Cat: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; t?: number }> = ({ x, floor, s = 1, flip, t = 0 }) => (
  <g transform={`translate(${x} ${floor}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <path d={`M -48 -30 Q -86 ${-60 + Math.sin(t * 4) * 8} -62 -96`} fill="none" stroke="#e0782a" strokeWidth={13} strokeLinecap="round" />
    <ellipse cx={0} cy={-34} rx={54} ry={32} fill="#e8862f" stroke={INK} strokeWidth={4} />
    <circle cx={46} cy={-62} r={26} fill="#e8862f" stroke={INK} strokeWidth={4} />
    <polygon points="30,-82 34,-110 48,-86" fill="#e8862f" stroke={INK} strokeWidth={3.5} /><polygon points="52,-86 66,-108 70,-78" fill="#e8862f" stroke={INK} strokeWidth={3.5} />
    <circle cx={40} cy={-64} r={3.4} fill={INK} /><circle cx={56} cy={-64} r={3.4} fill={INK} /><path d="M 44 -54 q 4 4 8 0" fill="none" stroke={INK} strokeWidth={2.4} />
    {[-30, -8, 20, 40].map((lx) => <rect key={lx} x={lx - 6} y={-14} width={12} height={16} rx={4} fill="#e8862f" stroke={INK} strokeWidth={3} />)}
    {[-30, -8, 18].map((sx) => <line key={sx} x1={sx} y1={-58} x2={sx + 8} y2={-38} stroke="#b9561a" strokeWidth={4} strokeLinecap="round" />)}
  </g>
);
export const Truck: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; lights?: number }> = ({ x, floor, s = 1, flip, lights = 0 }) => (
  <g transform={`translate(${x} ${floor}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <rect x={-170} y={-120} width={170} height={74} fill="#8a8f93" stroke={INK} strokeWidth={4} /><rect x={-170} y={-60} width={170} height={14} fill="#6e7478" stroke={INK} strokeWidth={3} />
    <path d="M 0 -120 L 70 -120 L 120 -76 L 150 -70 L 150 -30 L 0 -30 Z" fill="#a8382f" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 14 -110 L 64 -110 L 104 -78 L 14 -78 Z" fill="#cfe3ee" stroke={INK} strokeWidth={3} />
    {lights > 0 && <polygon points="150,-62 420,-120 420,20 150,-48" fill="#fff3b0" opacity={0.35 * lights} />}
    <rect x={144} y={-66} width={12} height={16} fill={lights > 0 ? '#fff3b0' : '#d9d4c0'} stroke={INK} strokeWidth={2.5} />
    <rect x={-150} y={-40} width={308} height={14} fill="#3c3a3a" stroke={INK} strokeWidth={3} />
    {[-110, 90].map((wx) => <g key={wx}><circle cx={wx} cy={-20} r={30} fill="#2c2a2a" stroke={INK} strokeWidth={4} /><circle cx={wx} cy={-20} r={13} fill="#a9a9a9" stroke={INK} strokeWidth={3} /></g>)}
  </g>
);
export const Car: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; door?: number; color?: string; exhaust?: number; t?: number }> = ({ x, floor, s = 1, flip, door = 0, color = '#3d63a8', exhaust = 0, t = 0 }) => (
  <g transform={`translate(${x} ${floor}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    {exhaust > 0 && [0, 1, 2, 3].map((i) => <circle key={i} cx={-120 - ((t * 60 + i * 26) % 100)} cy={-26 - ((t * 20 + i * 9) % 30)} r={8 + i * 3} fill="#d9d4c0" opacity={0.5 * exhaust * (1 - ((t * 60 + i * 26) % 100) / 100)} />)}
    <path d="M -130 -30 L -130 -66 L -84 -72 L -50 -112 L 52 -112 L 90 -72 L 130 -66 L 130 -30 Z" fill={color} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <path d="M -44 -104 L -76 -72 L -10 -72 L -10 -104 Z M 0 -104 L 0 -72 L 80 -72 L 48 -104 Z" fill="#cfe3ee" stroke={INK} strokeWidth={3} />
    {door > 0 && <polygon points={`-8,-104 ${-8 + door * 40},${-110 + door * 6} ${-8 + door * 40},${-26} -8,-30`} fill={color} stroke={INK} strokeWidth={3.5} opacity={0.95} />}
    {[-80, 80].map((wx) => <g key={wx}><circle cx={wx} cy={-24} r={24} fill="#2c2a2a" stroke={INK} strokeWidth={4} /><circle cx={wx} cy={-24} r={10} fill="#a9a9a9" stroke={INK} strokeWidth={3} /></g>)}
  </g>
);
export const Tin: React.FC<{ x: number; y: number; s?: number; c?: string; rot?: number }> = ({ x, y, s = 1, c = '#c04b4b', rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><rect x={-15} y={-38} width={30} height={38} rx={4} fill={c} stroke={INK} strokeWidth={2.8} /><rect x={-15} y={-26} width={30} height={13} fill="#f2e2c2" stroke={INK} strokeWidth={1.8} /></g>
);
export const Speech: React.FC<{ x: number; y: number; s?: number; lines: string[]; size?: number }> = ({ x, y, s = 1, lines, size = 30 }) => {
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.52 + 50, h = lines.length * (size + 8) + 36;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M ${-w / 2} ${-h / 2 + 14} Q ${-w / 2} ${-h / 2} ${-w / 2 + 16} ${-h / 2} L ${w / 2 - 16} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 14} L ${w / 2} ${h / 2 - 14} Q ${w / 2} ${h / 2} ${w / 2 - 16} ${h / 2} L -10 ${h / 2} L -34 ${h / 2 + 34} L -42 ${h / 2} L ${-w / 2 + 16} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 14} Z`} fill="#fff" stroke={INK} strokeWidth={4} />
      {lines.map((l, i) => <Txt key={i} x={0} y={-h / 2 + 18 + size + i * (size + 8)} size={size} ls={1}>{l}</Txt>)}
    </g>
  );
};
export const Note: React.FC<{ x: number; y: number; rot?: number; s?: number; lines: string[]; size?: number; fill?: string }> = ({ x, y, rot = 0, s = 1, lines, size = 30, fill = '#f4ecd0' }) => {
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.5 + 60, h = lines.length * (size + 10) + 50;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} stroke={INK} strokeWidth={4} />
      {lines.map((l, i) => <Txt key={i} x={0} y={-h / 2 + 24 + size + i * (size + 10)} size={size} ls={1}>{l}</Txt>)}
    </g>
  );
};
export const Stove: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-50} y={-24} width={100} height={24} rx={6} fill="#6b706b" stroke={INK} strokeWidth={4} />
    {[-20, 0, 20].map((fx, i) => <path key={i} d={`M ${fx - 7} -24 Q ${fx} ${-52 - Math.sin(t * 9 + i) * 8} ${fx + 7} -24 Z`} fill={['#ffb02e', '#ff7a2e', '#ffd84a'][i]} stroke={INK} strokeWidth={2} />)}
    <rect x={-42} y={-82} width={84} height={48} rx={8} fill="#b8453d" stroke={INK} strokeWidth={4} /><rect x={-48} y={-90} width={96} height={12} rx={5} fill="#8a3a32" stroke={INK} strokeWidth={3.5} />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${-16 + i * 16} -96 q 8 -16 0 -32 q -8 -16 0 -30`} fill="none" stroke="#f1ead6" strokeWidth={5} strokeLinecap="round" opacity={0.6 - ((t * 1.2 + i * 0.3) % 1) * 0.5} transform={`translate(0 ${-((t * 30 + i * 12) % 40)})`} />)}
  </g>
);
export const Wheelbarrow: React.FC<{ x: number; floor: number; s?: number; flip?: boolean }> = ({ x, floor, s = 1, flip }) => (
  <g transform={`translate(${x} ${floor}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <path d="M -60 -70 L 40 -70 L 28 -26 L -48 -26 Z" fill="#c9b27a" stroke={INK} strokeWidth={3.5} />
    <line x1={40} y1={-60} x2={96} y2={-96} stroke={INK} strokeWidth={5} strokeLinecap="round" /><line x1={-60} y1={-70} x2={-96} y2={-30} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <circle cx={-76} cy={-14} r={14} fill="#2c2a2a" stroke={INK} strokeWidth={3} />
    {[-40, -14, 12].map((tx) => <Tin key={tx} x={tx} y={-66} s={0.8} c={['#3f6db0', '#d9b04a', '#8b9a5b'][Math.abs(tx) % 3]} />)}
  </g>
);

/* ---------- cards ---------- */
export const Kicker: React.FC<{ y: number; children: React.ReactNode; o?: number }> = ({ y, children, o = 1 }) => <Txt x={360} y={y} size={44} fill="#6f7f6a" ls={8} o={o}>{children}</Txt>;
export const ProblemCard: React.FC<{ n: string; title: string; c: { lt: number }; icon?: React.ReactNode }> = ({ n, title, c, icon }) => {
  const a = pop(ramp(c.lt, 0.05, 0.55)), b = ramp(c.lt, 0.3, 0.75);
  return (
    <g>
      <CardBg />
      <g transform={`translate(360 400) scale(${a})`}>{icon}</g>
      <Kicker y={640} o={b}>PROBLEM {n}</Kicker>
      <Txt x={360} y={750} size={112} ls={4} o={b}>{title}</Txt>
    </g>
  );
};
export const Bar: React.FC<{ x: number; y: number; w: number; h?: number; v: number; label: string; value: string; color?: string }> = ({ x, y, w, h = 56, v, label, value, color = '#d9462a' }) => (
  <g>
    <Txt x={x} y={y - 16} size={34} fill={INK} ls={2} anchor="start">{label}</Txt>
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#f4f8f1" stroke={INK} strokeWidth={3.5} />
    <rect x={x + 3} y={y + 3} width={Math.max(0, (w - 6) * clamp(v))} height={h - 6} rx={8} fill={color} />
    <Txt x={x + w - 14} y={y + h - 14} size={36} fill={INK} ls={1} anchor="end" o={clamp(v * 4)}>{value}</Txt>
  </g>
);
export const Pallet: React.FC<{ x: number; floor: number; s?: number; label?: string; color?: string }> = ({ x, floor, s = 1, label, color = '#6aa6c8' }) => (
  <g transform={`translate(${x} ${floor}) scale(${s})`}>
    <rect x={-80} y={-16} width={160} height={16} fill="#b98d54" stroke={INK} strokeWidth={3} />
    {[0, 1, 2].map((r) => Array.from({ length: 4 }, (_, c) => <g key={`${r}${c}`}><rect x={-76 + c * 38} y={-60 - r * 44} width={36} height={42} rx={7} fill={color} stroke={INK} strokeWidth={2.5} /><path d={`M ${-70 + c * 38} ${-52 - r * 44} q 12 -8 24 0`} fill="none" stroke="#fff" strokeWidth={2} opacity={0.7} /></g>))}
    {label && <Txt x={0} y={-10} size={14} fill="#fff" ls={1}>{label}</Txt>}
  </g>
);
export const Shutter: React.FC<{ x?: number; y: number; w?: number; h: number; bow?: number; down?: number }> = ({ x = 40, y, w = 640, h, bow = 0, down = 1 }) => (
  <g>
    <rect x={x - 20} y={y - 110} width={w + 40} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} />
    <path d={`M ${x} ${y} L ${x + w} ${y} L ${x + w + bow * 0.2} ${y + h * down * 0.5} L ${x + w} ${y + h * down} L ${x} ${y + h * down} L ${x - bow * 0.2} ${y + h * down * 0.5} Z`} fill="#8e99a6" stroke={INK} strokeWidth={4} />
    {Array.from({ length: Math.floor((h * down) / 14) }, (_, i) => <line key={i} x1={x} y1={y + 14 + i * 14} x2={x + w} y2={y + 14 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
    {bow > 0 && <path d={`M ${x + 80} ${y + h * 0.15} Q ${x + w / 2 + bow} ${y + h * down * 0.5} ${x + w - 80} ${y + h * 0.9 * down}`} fill="none" stroke="#3a424b" strokeWidth={4} opacity={0.6} />}
  </g>
);
export { Parapet as RoofEdge };
