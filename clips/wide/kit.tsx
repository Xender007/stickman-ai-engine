/** 16:9 (1280x720) drawing kit for the YouTube cut. Layout rule: everything that is not background stays above y=590;
 *  the bottom band (y 600-720) belongs to the narration captions only. */
import React from 'react';
import { Doodle, INK, PAL } from '../store-ch1/doodle.tsx';
import type { Kind } from '../store-ch1/doodle.tsx';
import { ShelfRow } from '../store-ch1/props.tsx';
import { clamp, lerp, rnd } from '../store-ch1/props.tsx';
import { deadPose, idlePose, runPose, walkPose } from '../zombie-break/common.tsx';
import type { Pose } from '../zombie-break/common.tsx';
export * from '../store/lib.tsx';
export { Mob } from '../store/common.tsx';
import { Dead, LEG, POSE, Person, Sky, font } from '../store/lib.tsx';

export const W = 1280, H = 720, SAFE = 590;
export { INK, PAL, ShelfRow, clamp, lerp, rnd, Doodle, deadPose, idlePose, runPose, walkPose };
export type { Pose, Kind };

/** centred text that is squeezed to fit `maxW` when its estimated width is larger */
export const Txt: React.FC<{ x: number; y: number; size?: number; fill?: string; ls?: number; o?: number; children: React.ReactNode; rot?: number; anchor?: 'start' | 'middle' | 'end'; stroke?: string; maxW?: number }> = ({ x, y, size = 40, fill = INK, ls = 2, o = 1, children, rot = 0, anchor = 'middle', stroke, maxW = 1160 }) => {
  const n = String(children).length;
  const est = n * (size * 0.52 + ls);
  const f = est > maxW ? maxW / est : 1;
  return <text x={x} y={y} textAnchor={anchor} {...font} fontSize={size * f} fill={fill} letterSpacing={ls * f} opacity={o} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} stroke={stroke} strokeWidth={stroke ? 6 : 0} paintOrder="stroke">{children}</text>;
};
/** rounded label box with centred text lines */
export const Callout: React.FC<{ x: number; y: number; w: number; lines: { t: string; size?: number; fill?: string }[]; fill?: string; o?: number; scale?: number }> = ({ x, y, w, lines, fill = '#2a2220', o = 1, scale = 1 }) => {
  const h = lines.reduce((a, l) => a + (l.size ?? 40) + 12, 0) + 28;
  let yy = -h / 2 + 22;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={o}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={fill} stroke={INK} strokeWidth={4} opacity={fill === '#fff' ? 1 : 0.92} />
      {lines.map((l, i) => { const sz = l.size ?? 40; yy += sz + (i ? 12 : 0); return <Txt key={i} x={0} y={yy - 6} size={sz} fill={l.fill ?? (fill === '#fff' || fill === '#f4ecd0' ? INK : '#f6f1e2')} ls={2} maxW={w - 36}>{l.t}</Txt>; })}
    </g>
  );
};

export const Room: React.FC<{ wall?: string; floor?: string; line?: number; tiles?: boolean }> = ({ wall = '#cfc09f', floor = PAL.floor, line = 480, tiles = true }) => (
  <g>
    <rect x={-300} y={-100} width={W + 600} height={line + 100} fill={wall} />
    <rect x={-300} y={line - 12} width={W + 600} height={12} fill="#b8a983" stroke={INK} strokeWidth={2.5} />
    <rect x={-300} y={line} width={W + 600} height={H - line + 100} fill={floor} />
    {tiles && Array.from({ length: 5 }, (_, i) => <line key={i} x1={-300} y1={line + 24 + i * 52} x2={W + 300} y2={line + 24 + i * 52} stroke="#b9a984" strokeWidth={2} />)}
    {tiles && Array.from({ length: 22 }, (_, i) => <line key={`v${i}`} x1={i * 90 - 100} y1={line} x2={i * 120 - 280} y2={H} stroke="#b9a984" strokeWidth={2} />)}
  </g>
);
export const ShelvesW: React.FC<{ line?: number; rows?: number; seed?: number; wall?: string }> = ({ line = 500, rows = 2, seed = 3, wall }) => (
  <g><Room line={line} wall={wall} />{Array.from({ length: rows }, (_, i) => <ShelfRow key={i} x={-20} y={50 + i * 200} w={W + 40} h={130} seed={seed + i * 5} />)}</g>
);
export const SkyW: React.FC<{ tone?: 'dawn' | 'day' | 'dusk' | 'night'; h?: number; sun?: number }> = ({ tone = 'day', h = 380, sun = 0.25 }) => {
  const g = { dawn: ['#f2b98a', '#f7d9a8'], day: ['#8cc4e8', '#d4ecf5'], dusk: ['#5b4a86', '#e49a6e'], night: ['#1c1a38', '#4a4478'] }[tone];
  return (
    <g>
      <defs><linearGradient id={`wsky-${tone}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={g[0]} /><stop offset="1" stopColor={g[1]} /></linearGradient></defs>
      <rect x={-100} y={-50} width={W + 200} height={h + 50} fill={`url(#wsky-${tone})`} />
      {tone === 'night' && Array.from({ length: 40 }, (_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i + 40) * h * 0.8} r={1 + rnd(i + 9) * 1.6} fill="#fff" opacity={0.7} />)}
      {tone !== 'night' && <circle cx={lerp(160, 1100, sun)} cy={lerp(h * 0.7, h * 0.2, Math.sin(sun * Math.PI))} r={42} fill={tone === 'day' ? '#fff3b8' : '#ffe0a0'} stroke={INK} strokeWidth={3} />}
      {tone === 'night' && <circle cx={420} cy={90} r={34} fill="#f4efe0" stroke={INK} strokeWidth={2.5} />}
    </g>
  );
};
export const SkylineW: React.FC<{ y: number; color?: string; win?: boolean; seed?: number }> = ({ y, color = '#2f2b4d', win = true, seed = 0 }) => (
  <g>{Array.from({ length: 24 }, (_, i) => {
    const x = i * 56 - 20, hh = 50 + rnd(i + seed) * 110;
    return <g key={i}><rect x={x} y={y - hh} width={50} height={hh} fill={color} />{win && Array.from({ length: 4 }, (_, k) => rnd((i + seed) * 9 + k) > 0.55 && <rect key={k} x={x + 8 + (k % 2) * 20} y={y - hh + 10 + k * 20} width={8} height={9} fill="#ffcf6a" />)}</g>;
  })}</g>
);
export const CardW: React.FC<{ color?: string }> = ({ color = '#dbe5d6' }) => <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={color} />;
export const DarkW: React.FC<{ o: number; color?: string }> = ({ o, color = '#07050f' }) => <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={color} opacity={clamp(o)} />;

/** side view of the store front: sky, skyline, building at the right (roof ledge y=190), lot on the left. People in the lot stand on y 480-585. */
export const LotW: React.FC<{ tone?: 'dawn' | 'day' | 'dusk' | 'night'; shutter?: number; lit?: boolean; doorsOpen?: number }> = ({ tone = 'day', shutter = 1, lit = false, doorsOpen = 0 }) => {
  const ground = { dawn: '#8d8aa0', day: '#a3a3ad', dusk: '#6b6585', night: '#4c456f' }[tone];
  const wallC = tone === 'night' ? '#d8cdb0' : '#e8dcc0';
  return (
    <g>
      <SkyW tone={tone} h={330} sun={0.25} />
      <SkylineW y={400} color={tone === 'night' ? '#2f2b4d' : tone === 'day' ? '#9fb0c4' : '#6d6591'} win={tone === 'night' || tone === 'dusk'} />
      <rect x={-100} y={400} width={W + 200} height={60} fill={ground} opacity={0.75} /><rect x={-100} y={458} width={W + 200} height={H} fill={ground} />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 170 - 40} y1={470} x2={i * 210 - 200} y2={H} stroke="#f2eee2" strokeWidth={4} opacity={0.4} />)}
      <rect x={740} y={196} width={600} height={268} fill={wallC} stroke={INK} strokeWidth={5} /><rect x={726} y={176} width={620} height={24} fill="#9b8e74" stroke={INK} strokeWidth={5} />
      <rect x={780} y={214} width={330} height={44} fill={PAL.teal} stroke={INK} strokeWidth={4} /><Txt x={945} y={246} size={28} fill="#f6f1e2" ls={3} maxW={300}>OAKLINE FOODS</Txt>
      <rect x={780} y={280} width={380} height={180} fill={lit ? '#ffe6a8' : '#8e86b4'} stroke={INK} strokeWidth={4} />
      {[0, 1].map((i) => <rect key={i} x={784 + i * 188 - doorsOpen * (i ? -50 : 50)} y={284} width={180} height={172} fill="#cfe3ee" opacity={0.3} stroke={INK} strokeWidth={3} />)}
      {shutter > 0 && <g><rect x={780} y={280} width={380} height={180 * shutter} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: Math.floor((180 * shutter) / 12) }, (_, i) => <line key={i} x1={780} y1={290 + i * 12} x2={1160} y2={290 + i * 12} stroke="#5d6772" strokeWidth={2.5} />)}</g>}
    </g>
  );
};
export const Roof: React.FC<{ y?: number }> = ({ y = 500 }) => (
  <g>
    <rect x={-100} y={y} width={W + 200} height={H} fill="#8a6a58" stroke={INK} strokeWidth={4} />
    <rect x={-100} y={y - 20} width={W + 200} height={24} fill="#a9876f" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 3 }, (_, r) => Array.from({ length: 17 }, (_, i) => <rect key={`${r}${i}`} x={i * 84 - (r % 2) * 42 - 40} y={y + 8 + r * 52} width={80} height={48} fill="none" stroke="#6b4f40" strokeWidth={2} />))}
  </g>
);

/** one-point-perspective aisle for the wide frame; vp = vanishing point */
export const AisleW: React.FC<{ vp?: [number, number]; lightsOn?: number; pushed?: number; endLabel?: string }> = ({ vp = [640, 270], lightsOn = 1, pushed = 0, endLabel = 'FROZEN FOODS' }) => {
  const zoom = 1 + pushed * 0.5, slices = 26, levels = 4;
  const wall = (side: -1 | 1) => {
    const near = { x: side < 0 ? -80 : W + 80, t: -40, b: 700 };
    const far = { x: vp[0] + side * 150, t: vp[1] - 85, b: vp[1] + 85 };
    const pos = (a: number) => ({ x: lerp(near.x, far.x, a), t: lerp(near.t, far.t, a), b: lerp(near.b, far.b, a) });
    const depth = (i: number) => Math.pow(i / slices, 1.75);
    const el: React.ReactNode[] = [];
    el.push(<polygon key="back" points={`${near.x},${near.t} ${far.x},${far.t} ${far.x},${far.b} ${near.x},${near.b}`} fill="#6f6452" stroke={INK} strokeWidth={3} />);
    for (let j = 0; j < levels; j++) {
      const f0 = j / levels, f1 = (j + 1) / levels, yy = (p: { t: number; b: number }, f: number) => lerp(p.t, p.b, f);
      let i = 0, blk = 0;
      while (i < slices) {
        const len = 2 + Math.floor(rnd(j * 17 + blk * 5 + (side + 2) * 31) * 4);
        const PK: [string, string][] = [['#e9dfc6', '#b8453d'], ['#3f6db0', '#f1ead6'], ['#d9b04a', '#f1ead6'], ['#8b9a5b', '#f1ead6'], ['#b8453d', '#f1ead6'], ['#4a4545', '#d9b04a'], ['#e07a3a', '#f1ead6'], ['#6aa6a3', '#f1ead6'], ['#d9cfe0', '#7b5aa6']];
        const [body, stripe] = PK[Math.floor(rnd(j * 11 + blk * 7 + (side + 3) * 13) * PK.length)];
        const i1 = Math.min(slices, i + len), p0 = pos(depth(i)), p1 = pos(depth(i1));
        const top = (p: typeof p0) => yy(p, f0) + (yy(p, f1) - yy(p, f0)) * 0.1, bot = (p: typeof p0) => yy(p, f1) - (yy(p, f1) - yy(p, f0)) * 0.16, mid = (p: typeof p0, t: number) => lerp(top(p), bot(p), t);
        el.push(<polygon key={`b${j}-${blk}`} points={`${p0.x},${top(p0)} ${p1.x},${top(p1)} ${p1.x},${bot(p1)} ${p0.x},${bot(p0)}`} fill={body} stroke={INK} strokeWidth={1.4} />);
        el.push(<polygon key={`s${j}-${blk}`} points={`${p0.x},${mid(p0, 0.38)} ${p1.x},${mid(p1, 0.38)} ${p1.x},${mid(p1, 0.7)} ${p0.x},${mid(p0, 0.7)}`} fill={stripe} />);
        i = i1; blk++;
      }
      const e0 = pos(0), e1 = pos(1), lipT = (p: typeof e0) => lerp(yy(p, f0), yy(p, f1), 0.84), lipB = (p: typeof e0) => lerp(yy(p, f0), yy(p, f1), 0.93);
      el.push(<polygon key={`lip${j}`} points={`${e0.x},${lipT(e0)} ${e1.x},${lipT(e1)} ${e1.x},${lipB(e1)} ${e0.x},${lipB(e0)}`} fill="#f1ede0" stroke={INK} strokeWidth={2} />);
    }
    return el;
  };
  return (
    <g transform={`translate(${vp[0]} ${vp[1]}) scale(${zoom}) translate(${-vp[0]} ${-vp[1]})`}>
      <rect x={-300} y={-200} width={W + 600} height={H + 400} fill="#d9caa4" />
      <polygon points={`-300,-200 ${W + 300},-200 ${W + 80},-40 ${vp[0] + 150},${vp[1] - 85} ${vp[0] - 150},${vp[1] - 85} -80,-40`} fill="#4a4560" stroke={INK} strokeWidth={3} />
      {[0.25, 0.5, 0.7].map((a, i) => { const y = lerp(-20, vp[1] - 90, a), hw = lerp(330, 100, a), h = lerp(26, 8, a); return <polygon key={i} points={`${vp[0] - hw},${y + h} ${vp[0] - hw * 0.85},${y} ${vp[0] + hw * 0.85},${y} ${vp[0] + hw},${y + h}`} fill={lightsOn ? '#f7f4ea' : '#7a7788'} stroke={INK} strokeWidth={2} />; })}
      <polygon points={`-80,700 ${W + 80},700 ${vp[0] + 150},${vp[1] + 85} ${vp[0] - 150},${vp[1] + 85}`} fill="#e6d8b2" stroke={INK} strokeWidth={3} />
      {wall(-1)}{wall(1)}
      <rect x={vp[0] - 150} y={vp[1] - 85} width={300} height={170} fill="#e9dfc6" stroke={INK} strokeWidth={3} />
      <rect x={vp[0] - 130} y={vp[1] - 72} width={260} height={30} fill={PAL.teal} stroke={INK} strokeWidth={3} /><Txt x={vp[0]} y={vp[1] - 50} size={20} fill="#f6f1e2" ls={2} maxW={240}>{endLabel}</Txt>
      <rect x={vp[0] - 130} y={vp[1] - 30} width={260} height={100} fill="#f4f0e4" stroke={INK} strokeWidth={2} />
    </g>
  );
};
export const AisleSignW: React.FC<{ x: number; y: number; n: string; label?: string; sub?: string; s?: number }> = ({ x, y, n, label = 'PANTRY STAPLES', sub = 'TINS · JARS', s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={-92} y1={-90} x2={-92} y2={0} stroke={INK} strokeWidth={3} /><line x1={92} y1={-90} x2={92} y2={0} stroke={INK} strokeWidth={3} />
    <rect x={-130} y={0} width={260} height={74} rx={6} fill={PAL.teal} stroke={INK} strokeWidth={3.5} /><circle cx={-92} cy={37} r={24} fill="#f6f1e2" stroke={INK} strokeWidth={3} />
    <text x={-92} y={48} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={32} fill={PAL.teal}>{n}</text>
    <Txt x={34} y={32} size={21} fill="#f6f1e2" ls={1} maxW={170}>{label}</Txt><Txt x={34} y={59} size={20} fill="#d6ebe6" ls={1} maxW={170}>{sub}</Txt>
  </g>
);
export const Speaker: React.FC<{ x: number; y: number; t: number; on: number }> = ({ x, y, t, on }) => (
  <g><rect x={x - 46} y={y - 36} width={92} height={72} rx={12} fill="#2a2220" stroke={INK} strokeWidth={5} /><circle cx={x} cy={y} r={26} fill="#555" stroke="#aaa" strokeWidth={4} /><circle cx={x} cy={y} r={9} fill="#222" />
    {[0, 1, 2].map((k) => { const r = (t * 1.1 + k / 3) % 1; return <circle key={k} cx={x} cy={y} r={40 + r * 300} fill="none" stroke="#ffe6a8" strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * on} />; })}</g>
);
export const Rings: React.FC<{ x: number; y: number; t0: number; lt: number; color?: string }> = ({ x, y, t0, lt, color = '#c93a2e' }) => {
  const k = ramp(lt, t0, t0 + 0.6);
  return k > 0 && k < 1 ? <g opacity={1 - k}><circle cx={x} cy={y} r={30 + k * 170} fill="none" stroke={color} strokeWidth={9} /><circle cx={x} cy={y} r={14 + k * 100} fill="none" stroke={color} strokeWidth={6} /></g> : null;
};
export const Waves: React.FC<{ x: number; y: number; t: number; n?: number; max?: number; color?: string; o?: number }> = ({ x, y, t, n = 4, max = 420, color = '#d9462a', o = 1 }) => (
  <g>{Array.from({ length: n }, (_, k) => { const r = (t * 0.9 + k / n) % 1; return <circle key={k} cx={x} cy={y} r={20 + r * max} fill="none" stroke={color} strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * o} />; })}</g>
);
export const Eyes: React.FC<{ x: number; y: number; s?: number; o?: number; blink?: number }> = ({ x, y, s = 1, o = 1, blink = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>{[-22, 22].map((ex) => <g key={ex}><ellipse cx={ex} cy={0} rx={13} ry={9 * blink} fill="#f4f0d0" /><ellipse cx={ex} cy={0} rx={30} ry={20 * blink} fill="#f4f0d0" opacity={0.12} /><circle cx={ex + 3} cy={0} r={4.5} fill="#07050f" /></g>)}</g>
);
export const Suit: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; pose?: Pose }> = ({ x, floor, s = 1.2, flip = true, pose }) => (
  <g>
    <g style={{ filter: 'grayscale(1) brightness(2.6)' }}><Person kind="kid" x={x} floor={floor} s={s} flip={flip} pose={pose ?? POSE.idle()} mouth="none" /></g>
    <g transform={`translate(${x} ${floor - LEG * s}) scale(${(flip ? -1 : 1) * s} ${s})`}><path d="M -3 -84 A 26 26 0 0 1 22 -86 L 24 -66 L -2 -64 Z" fill="#1c2630" stroke={INK} strokeWidth={2.5} /><rect x={-14} y={-52} width={28} height={50} fill="#e8eef2" stroke={INK} strokeWidth={2.4} opacity={0.9} /></g>
  </g>
);
export const FreezerDoorW: React.FC<{ x?: number; y?: number; w?: number; h?: number; taped?: number; open?: number }> = ({ x = 470, y = 70, w = 300, h = 430, taped = 0, open = 0 }) => (
  <g>
    <rect x={x - 28} y={y - 24} width={w + 56} height={h + 24} fill="#5a6672" stroke={INK} strokeWidth={5} />
    {open > 0 && <rect x={x} y={y} width={w} height={h} fill="#cfe8f4" />}
    <polygon points={`${x},${y} ${x + w * (1 - open * 0.85)},${y + open * 30} ${x + w * (1 - open * 0.85)},${y + h - open * 30} ${x},${y + h}`} fill="#b7c3cf" stroke={INK} strokeWidth={5} />
    {open < 0.1 && <g><rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} fill="none" stroke="#3a3d42" strokeWidth={14} /><rect x={x + w - 64} y={y + h * 0.45} width={20} height={90} rx={9} fill="#d9d4c0" stroke={INK} strokeWidth={4} />
      <rect x={x + w / 2 - 94} y={y + 40} width={188} height={38} rx={6} fill="#2f5e86" stroke={INK} strokeWidth={4} /><Txt x={x + w / 2} y={y + 68} size={22} fill="#e8f4ff" ls={2} maxW={170}>WALK-IN FREEZER</Txt>
      {taped > 0 && [[x, y + 130, 8], [x + w, y + 130, -8], [x, y + 270, 8], [x + w, y + 330, -8]].map(([tx, ty, r], i) => <g key={i} transform={`translate(${tx} ${ty}) rotate(${(r as number) > 0 ? 80 : -80})`} opacity={taped}><rect x={-60} y={-11} width={120} height={22} fill="#e4d49a" stroke={INK} strokeWidth={2.5} /></g>)}</g>}
  </g>
);
export function ramp(x: number, a: number, b: number) { return clamp((x - a) / Math.max(1e-6, b - a)); }
export { Dead, Person, POSE, Sky };
