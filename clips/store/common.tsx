/** Composite backdrops reused across chapters. */
import React from 'react';
import { Dead, Door, INK, Interior, NightLot, PAL, Person, POSE, ShelfRow, Sky, Skyline, Txt, W, H, clamp, lerp, rnd } from './lib.tsx';

/** flat shelving wall seen from the front: three rows of shelves above a tiled floor */
export const ShelvesBack: React.FC<{ line?: number; dim?: number; rows?: number; seed?: number }> = ({ line = 900, rows = 3, seed = 3 }) => (
  <g>
    <Interior line={line} />
    {Array.from({ length: rows }, (_, i) => <ShelfRow key={i} x={-20} y={170 + i * 230} w={760} h={130} seed={seed + i * 5} />)}
  </g>
);

/** Side-on view of the store front: sky, skyline, building on the right with its roof ledge and glass doors, the lot on the left.
 *  Feet of the people in the lot stand on y=floor (900..1180). */
export const LotSide: React.FC<{ tone?: 'dawn' | 'day' | 'dusk' | 'night'; shutter?: number; doorsOpen?: number; lit?: boolean; sunk?: number; sign?: boolean }> = ({ tone = 'day', shutter = 1, doorsOpen = 0, lit = false, sign = true }) => {
  const ground = { dawn: '#8d8aa0', day: '#a3a3ad', dusk: '#6b6585', night: '#4c456f' }[tone];
  const wallC = tone === 'night' ? '#d8cdb0' : '#e8dcc0';
  return (
    <g>
      <Sky tone={tone} h={640} sun={0.25} />
      <Skyline y={700} color={tone === 'night' ? '#2f2b4d' : tone === 'day' ? '#9fb0c4' : '#6d6591'} win={tone === 'night' || tone === 'dusk'} />
      <rect y={700} width={W} height={180} fill={ground} opacity={0.75} /><rect y={880} width={W} height={H - 880} fill={ground} />
      {Array.from({ length: 6 }, (_, i) => <line key={i} x1={i * 130 - 20} y1={920} x2={i * 160 - 120} y2={H} stroke="#f2eee2" strokeWidth={4} opacity={0.45} />)}
      {/* store */}
      <rect x={380} y={520} width={360} height={380} fill={wallC} stroke={INK} strokeWidth={5} />
      <rect x={366} y={496} width={374} height={30} fill="#9b8e74" stroke={INK} strokeWidth={5} />
      {sign && <g><rect x={400} y={556} width={310} height={48} fill={PAL.teal} stroke={INK} strokeWidth={4} /><Txt x={555} y={592} size={30} fill="#f6f1e2" ls={3}>OAKLINE FOODS</Txt></g>}
      <rect x={410} y={640} width={290} height={240} fill={lit ? '#ffe6a8' : '#8e86b4'} stroke={INK} strokeWidth={4} />
      {[0, 1].map((i) => <rect key={i} x={414 + i * 144 - doorsOpen * (i ? -50 : 50)} y={644} width={136} height={232} fill="#cfe3ee" opacity={0.3} stroke={INK} strokeWidth={3} />)}
      {shutter > 0 && <g><rect x={410} y={640} width={290} height={240 * shutter} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: Math.floor((240 * shutter) / 14) }, (_, i) => <line key={i} x1={410} y1={654 + i * 14} x2={700} y2={654 + i * 14} stroke="#5d6772" strokeWidth={2.5} />)}</g>}
    </g>
  );
};

/** crowd leaning on the shutter (right side), used by several chapters */
export const Mob: React.FC<{ n: number; t: number; seed?: number; x0?: number; x1?: number; f0?: number; f1?: number; s0?: number; s1?: number; shown?: number; face?: 'right' | 'left' | 'mixed'; still?: boolean }> = ({ n, t, seed = 5, x0 = 30, x1 = 380, f0 = 930, f1 = 1200, s0 = 0.62, s1 = 1.0, shown = 1, face = 'right', still = true }) => (
  <g>{Array.from({ length: n }, (_, i) => {
    const f = lerp(f0, f1, rnd(seed + i * 3.1));
    return { x: lerp(x0, x1, rnd(seed * 2 + i * 7.7)), f, s: lerp(s0, s1, (f - f0) / Math.max(1, f1 - f0)), i, flip: face === 'mixed' ? rnd(seed + i * 11) > 0.5 : face === 'left' };
  }).sort((a, b) => a.f - b.f).map((d, k) => <Dead key={d.i} x={d.x} floor={d.f} s={d.s} t={t} seed={d.i + seed} still={still} flip={d.flip} opacity={clamp(shown * n - d.i)} />)}</g>
);
export { Door, NightLot, Person, POSE, H, W, clamp };

/** Rhea after the change: a pale walker in her mustard cardigan, dark bob and round glasses (x = centre, floor = feet). */
export const RheaDead: React.FC<{ x: number; floor: number; s?: number; t: number; flip?: boolean; arm?: number }> = ({ x, floor, s = 1.6, t, flip, arm = 0 }) => {
  const hipY = floor - 66 * s;
  return (
    <g>
      <Dead x={x} floor={floor} s={s} t={t} seed={2} still flip={flip} />
      <g transform={`translate(${x} ${hipY}) scale(${(flip ? -1 : 1) * s} ${s})`}>
        <path d="M -14 -52 L 14 -52 L 17 -2 L -17 -2 Z" fill="#d4a22c" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M -27 -66 L -27 -78 A 27 27 0 0 1 27 -78 L 27 -62 Q 22 -72 14 -82 Q 0 -90 -12 -82 Q -22 -72 -27 -62 Z" fill="#2e2420" stroke={INK} strokeWidth={3} />
        <g fill="none" stroke={INK} strokeWidth={2.2}><circle cx={6} cy={-72} r={6.5} /><circle cx={17} cy={-72} r={6.5} /><line x1={12.5} y1={-72} x2={10.5} y2={-72} /></g>
        {arm > 0 && <line x1={0} y1={-48} x2={30 + arm * 6} y2={-34} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />}
      </g>
    </g>
  );
};
export const LockPlate: React.FC<{ x: number; y: number; s?: number; keyX?: number; jiggle?: number }> = ({ x, y, s = 1, keyX = 0, jiggle = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-120} y={-190} width={240} height={380} rx={22} fill="#8c97a3" stroke={INK} strokeWidth={6} />
    <rect x={-100} y={-170} width={200} height={340} rx={14} fill="none" stroke="#5d6772" strokeWidth={4} />
    <circle cx={0} cy={0} r={62} fill="#b5bec7" stroke={INK} strokeWidth={5} /><rect x={-10} y={0} width={20} height={62} rx={8} fill="#1b1d22" stroke={INK} strokeWidth={3} /><circle cx={0} cy={0} r={18} fill="#1b1d22" />
    <g transform={`translate(${keyX + jiggle} 0)`}><circle cx={-130} cy={0} r={20} fill="none" stroke={INK} strokeWidth={11} /><circle cx={-130} cy={0} r={20} fill="none" stroke="#d9b04a" strokeWidth={5} /><rect x={-112} y={-5} width={86} height={10} fill="#d9b04a" stroke={INK} strokeWidth={2.5} /></g>
  </g>
);
export const Bike: React.FC<{ x: number; floor: number; s?: number }> = ({ x, floor, s = 1 }) => (
  <g transform={`translate(${x} ${floor}) scale(${s})`}>
    {[-48, 48].map((wx) => <circle key={wx} cx={wx} cy={-30} r={30} fill="none" stroke={INK} strokeWidth={6} />)}
    <path d="M -48 -30 L -8 -74 L 34 -74 L 48 -30 M -8 -74 L 12 -30 L -48 -30 M 34 -74 L 28 -92" fill="none" stroke="#3d63a8" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    <line x1={14} y1={-94} x2={44} y2={-92} stroke={INK} strokeWidth={6} strokeLinecap="round" />
  </g>
);
