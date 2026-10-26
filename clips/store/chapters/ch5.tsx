/** Chapter 5: Customers (script v3). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Beam, Bucket, Cat, CardBg, Dark, INK, Interior, Person, POSE, ProblemCard, Tin, Txt, Wheelbarrow, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../lib.tsx';
import { Bike, LotSide, Mob } from '../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
/** a living stranger in a white protective suit with a dark visor */
const Suit: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; pose?: any }> = ({ x, floor, s = 1.2, flip = true, pose }) => (
  <g>
    <g style={{ filter: 'grayscale(1) brightness(2.6)' }}><Person kind="kid" x={x} floor={floor} s={s} flip={flip} pose={pose ?? POSE.idle()} mouth="none" /></g>
    <g transform={`translate(${x} ${floor - 66 * s}) scale(${(flip ? -1 : 1) * s} ${s})`}><path d="M -3 -84 A 26 26 0 0 1 22 -86 L 24 -66 L -2 -64 Z" fill="#1c2630" stroke={INK} strokeWidth={2.5} /><rect x={-14} y={-52} width={28} height={50} fill="#e8eef2" stroke={INK} strokeWidth={2.4} opacity={0.9} /></g>
  </g>
);
const Eyes: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>{[-22, 22].map((ex) => <g key={ex}><ellipse cx={ex} cy={0} rx={13} ry={9} fill="#f4f0d0" /><ellipse cx={ex} cy={0} rx={30} ry={20} fill="#f4f0d0" opacity={0.12} /><circle cx={ex + 3} cy={0} r={4.5} fill="#07050f" /></g>)}</g>
);

export const ch: Chapter = {
  n: 5, label: 'CUSTOMERS',
  scenes: [
    // 0 it buys you two days
    { at: 0, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={190} size={52} fill="#6f7f6a" ls={5}>THE HORN TRICK</Txt>
        {[10, 11, 12].map((d, i) => { const a = pop(ramp(c.lt, 0.2 + i * 0.5, 0.6 + i * 0.5)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(${130 + i * 230} 560) scale(${a})`}><rect x={-90} y={-110} width={180} height={220} rx={16} fill="#fff" stroke={INK} strokeWidth={5} /><rect x={-90} y={-110} width={180} height={52} rx={14} fill={i < 2 ? '#4aa86a' : '#c93a2e'} stroke={INK} strokeWidth={5} /><Txt x={0} y={-72} size={34} fill="#fff">DAY</Txt><Txt x={0} y={46} size={110}>{d}</Txt>{i < 2 && <path d="M -62 -30 L 62 80 M 62 -30 L -62 80" stroke="#c93a2e" strokeWidth={9} strokeLinecap="round" opacity={0.85} />}</g>; })}
        <g transform={`translate(360 940) scale(${pop(ramp(c.lt, 1.2, 1.8))})`}><Txt x={0} y={0} size={120} fill="#c93a2e" ls={3}>2 DAYS</Txt></g></g>
    ) },
    // 1 a rope drops from the next building; three people slide down in white suits
    { at: 1, push: [1, 1.05], el: (c) => {
      const k = (i: number) => ease(ramp(c.lt, 0.8 + i * 0.9, 2.4 + i * 0.9));
      return (
        <g><LotSide tone="night" /><rect x={-20} y={470} width={190} height={420} fill="#4a4660" stroke={INK} strokeWidth={5} /><rect x={-30} y={450} width={210} height={26} fill="#6b6585" stroke={INK} strokeWidth={5} />
          <line x1={120} y1={470} x2={120} y2={lerp(470, 1150, ease(ramp(c.lt, 0.1, 0.8)))} stroke="#c9b27a" strokeWidth={6} />
          {[0, 1, 2].map((i) => <Suit key={i} x={120 + i * 40} floor={lerp(500, 1190, k(i))} s={lerp(0.8, 1.2, k(i))} flip={false} />)}
          <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.3, 0.7)}>12TH NIGHT</Txt>
        </g>
      );
    } },
    // 2-3 clipboard, thermometer, a very simple plan
    { at: 2, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" />
        {[0, 1, 2].map((i) => <Suit key={i} x={150 + i * 80} floor={1190 + (i % 2) * 14} s={1.25} flip={false} />)}
        <g opacity={ramp(c.lt, c.s(3) + 0.1, c.s(3) + 0.5)} transform="translate(360 330)">{['CLIPBOARD', 'THERMOMETER', 'A SIMPLE PLAN'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(3) + 0.2 + i * 0.7, c.s(3) + 0.5 + i * 0.7)}><rect x={-230} y={-60 + i * 84} width={460} height={66} rx={12} fill="#2a2220" opacity={0.9} /><Txt x={0} y={-14 + i * 84} size={38} fill="#f6f1e2" ls={3}>{l}</Txt></g>)}</g>
      </g>
    ) },
    // 4-5 they know about the freezer, they have been tracking it for days
    { at: 4, card: true, el: (c) => {
      const sweep = (c.lt * 1.4) % 1;
      return (
        <g><rect width={W} height={H} fill="#0e1a14" />
          <g transform="translate(360 600)"><circle r={300} fill="none" stroke="#2f7a52" strokeWidth={4} /><circle r={200} fill="none" stroke="#2f7a52" strokeWidth={3} /><circle r={100} fill="none" stroke="#2f7a52" strokeWidth={3} /><line x1={-300} y1={0} x2={300} y2={0} stroke="#2f7a52" strokeWidth={2} /><line x1={0} y1={-300} x2={0} y2={300} stroke="#2f7a52" strokeWidth={2} />
            <path d={`M 0 0 L ${Math.cos(sweep * 6.283) * 300} ${Math.sin(sweep * 6.283) * 300}`} stroke="#7dffb0" strokeWidth={5} /><circle cx={90} cy={-70} r={14 + 8 * tri(c.lt * 2)} fill="#9fd0e8" opacity={0.9} /><Txt x={90} y={-100} size={30} fill="#9fd0e8" ls={3}>FREEZER</Txt></g>
          <Txt x={360} y={180} size={54} fill="#7dffb0" ls={5} o={ramp(c.lt, 0.2, 0.6)}>THEY KNOW.</Txt>
          <g opacity={ramp(c.lt, c.s(5), c.s(5) + 0.4)}>{[0, 1, 2, 3, 4].map((i) => <g key={i} opacity={ramp(c.lt, c.s(5) + 0.2 + i * 0.3, c.s(5) + 0.4 + i * 0.3)}><rect x={90 + i * 108} y={1050} width={90} height={90} rx={10} fill="#1d3a2a" stroke="#7dffb0" strokeWidth={3} /><Txt x={135 + i * 108} y={1110} size={44} fill="#7dffb0">{i + 5}</Txt></g>)}<Txt x={360} y={1000} size={34} fill="#7dffb0" ls={3}>TRACKING FOR DAYS</Txt></g>
        </g>
      );
    } },
    // 6 problem four
    { at: 6, card: true, el: (c) => <ProblemCard n="FOUR" title="THE LIVING" c={c} icon={<g>{[-100, 0, 100].map((x, i) => <g key={i} transform={`translate(${x} 20)`}><circle cx={0} cy={-70} r={30} fill="#e8eef2" stroke={INK} strokeWidth={6} /><rect x={-14} y={-84} width={36} height={22} rx={8} fill="#1c2630" /><path d="M -36 60 Q 0 -50 36 60 Z" fill="#e8eef2" stroke={INK} strokeWidth={6} /></g>)}</g>} /> },
    // 7 you cannot fight three people with suits and tools
    { at: 7, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" /><Person kind="hero" x={560} floor={520} s={0.95} pose={POSE.idle(c.lt)} flip />{[0, 1, 2].map((i) => <Suit key={i} x={140 + i * 80} floor={1150} s={1.3} flip={false} />)}
        <g transform={`translate(360 300) scale(${pop(ramp(c.lt, 0.2, 0.8))})`}><Txt x={-120} y={0} size={140} fill="#4aa86a" stroke="#07050f">1</Txt><Txt x={0} y={0} size={110} fill="#f6f1e2" stroke="#07050f">vs</Txt><Txt x={130} y={0} size={140} fill="#c93a2e" stroke="#07050f">3</Txt></g></g>
    ) },
    // 8-10 if they cut the shutter, 250 dead walk in behind them
    { at: 8, push: [1, 1.06], el: (c) => {
      const tear = ramp(c.lt, c.s(9), c.s(9) + 1.6), flood = ramp(c.lt, c.s(9) + 1.4, c.d - 0.6);
      return (
        <g><LotSide tone="night" shutter={1 - tear * 0.85} lit={tear > 0.3} />{c.lt > c.s(9) - 0.4 && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={470 + rnd(i) * 200} cy={760 + rnd(i + 2) * 120} r={3 + rnd(i + 5) * 3} fill="#ffb347" opacity={tri(c.lt * 8 + i) * 0.9} />)}
          <g transform={`translate(${flood * 130} 0)`}><Mob n={60} t={c.t} seed={44} x0={-60} x1={360} f0={930} f1={1190} face="right" still={false} shown={ramp(c.lt, c.s(9), c.s(9) + 0.8)} /></g>
          {[0, 1].map((i) => <Suit key={i} x={300 + i * 60} floor={1130} s={1.1} flip={false} />)}
          <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>IF THE SHUTTER GOES...</Txt>
          <g opacity={ramp(c.lt, c.s(10), c.s(10) + 0.5)}><rect x={60} y={300} width={600} height={110} rx={14} fill="#2a2220" opacity={0.9} /><Txt x={360} y={372} size={46} fill="#f6f1e2" ls={2}>NOBODY HAS A SUPERMARKET</Txt></g>
        </g>
      );
    } },
    // 11-12 you do not open the door, you open the store
    { at: 11, push: [1, 1.05], el: (c) => {
      const sign = ease(ramp(c.lt, c.s(12), c.s(12) + 0.8));
      return (
        <g><LotSide tone="night" lit />
          <g opacity={1 - ramp(c.lt, c.s(12) - 0.2, c.s(12) + 0.2)}><g transform="translate(555 760)"><circle r={110} fill="#c93a2e" opacity={0.9} /><path d="M -50 -50 l 100 100 M 50 -50 l -100 100" stroke="#fff" strokeWidth={22} strokeLinecap="round" /></g><Txt x={360} y={190} size={60} fill="#f6f1e2" stroke="#07050f" ls={3}>NOT THE DOOR</Txt></g>
          <g transform={`translate(555 ${lerp(300, 440, sign) + Math.sin(c.lt * 6) * 4 * sign})`} opacity={ramp(c.lt, c.s(12), c.s(12) + 0.3)}><line x1={-90} y1={-300} x2={-90} y2={0} stroke={INK} strokeWidth={5} /><line x1={90} y1={-300} x2={90} y2={0} stroke={INK} strokeWidth={5} /><rect x={-140} y={0} width={280} height={150} rx={18} fill="#c93a2e" stroke={INK} strokeWidth={6} /><rect x={-120} y={18} width={240} height={114} rx={12} fill="none" stroke="#fff" strokeWidth={4} /><Txt x={0} y={102} size={92} fill="#fff" ls={4}>OPEN</Txt></g>
          <g opacity={ramp(c.lt, c.s(12), c.s(12) + 0.5)}><Txt x={200} y={190} size={60} fill="#fff6c8" stroke="#07050f" ls={3}>THE STORE</Txt></g></g>
      );
    } },
    // 13 one rope, one bucket off the roof at 1:30
    { at: 13, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.6, c.d - 0.3)), by = lerp(520, 1060, k);
      return (
        <g><LotSide tone="night" /><Person kind="hero" x={410} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: 80, lF: 100 }} /><line x1={440} y1={520} x2={440} y2={by - 40} stroke="#c9b27a" strokeWidth={5} /><Bucket x={440} y={by} s={0.9} />
          <Suit x={300} floor={1190} s={1.1} flip={false} /><Suit x={360} floor={1200} s={1.1} flip={false} />
          <g transform="translate(360 200)"><rect x={-180} y={-72} width={360} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={-6} size={34} fill="#d9b04a" ls={4}>ROOF · REAR</Txt><Txt x={0} y={30} size={60} fill="#7dffb0" ls={6}>1:30 AM</Txt></g></g>
      );
    } },
    // 14-15 the first fifteen tins are free; after that you trade
    { at: 14, card: true, el: (c) => {
      const rows: [string, string][] = [['BATTERIES', '#d9b04a'], ['FUEL', '#c93a2e'], ['MEDICINE', '#4aa86a'], ['NEWS', '#6aa6c8']];
      return (
        <g><rect width={W} height={H} fill="#2f4a3a" /><rect x={30} y={30} width={660} height={1220} fill="none" stroke="#a9835a" strokeWidth={22} />
          <g opacity={ramp(c.lt, 0.2, 0.6)}><Txt x={360} y={200} size={64} fill="#f6f1e2" ls={4}>THE FIRST 15 TINS</Txt><Txt x={360} y={290} size={120} fill="#7dffb0" ls={6}>FREE</Txt></g>
          {Array.from({ length: 15 }, (_, i) => <g key={i} opacity={ramp(c.lt, 0.5 + i * 0.05, 0.65 + i * 0.05)}><Tin x={96 + (i % 8) * 70} y={420 + Math.floor(i / 8) * 60} s={0.9} c={['#b8453d', '#3f6db0', '#d9b04a', '#8b9a5b'][i % 4]} /></g>)}
          <g opacity={ramp(c.lt, c.s(15), c.s(15) + 0.4)}><line x1={80} y1={580} x2={640} y2={580} stroke="#f6f1e2" strokeWidth={4} strokeDasharray="14 10" /><Txt x={360} y={650} size={64} fill="#f6f1e2" ls={4}>AFTER THAT:</Txt></g>
          {rows.map(([l, col], i) => <g key={i} opacity={ramp(c.lt, c.s(15) + 0.7 + i * 0.45, c.s(15) + 1.0 + i * 0.45)}><rect x={110} y={700 + i * 100} width={500} height={80} rx={14} fill={col} stroke="#f6f1e2" strokeWidth={4} opacity={0.92} /><Txt x={360} y={756 + i * 100} size={50} fill="#1b1410" ls={4}>{l}</Txt></g>)}
        </g>
      );
    } },
    // 16-17 five years of retail: difficult customers
    { at: 16, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#d8c8a0" line={900} /><rect x={0} y={760} width={440} height={200} fill="#8a5a36" stroke={INK} strokeWidth={6} /><rect x={0} y={740} width={460} height={34} fill="#a9835a" stroke={INK} strokeWidth={5} />{hero(190, 880, 1.9, { ...POSE.idle(c.lt), lU: 20, lF: 40 })}
        <g transform={`translate(230 400) scale(${pop(ramp(c.lt, 0.3, 0.9))})`}><path d="M -110 0 L -110 -50 L 110 -50 L 110 0 L 80 0 L 80 20 L 50 0 Z" fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-12} size={30}>HAPPY TO HELP</Txt></g>
        <g transform="translate(110 200)" opacity={ramp(c.lt, 0.2, 0.6)}><rect x={-100} y={-44} width={200} height={72} rx={36} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={14} size={44} fill="#fff" ls={2}>5 YEARS</Txt></g>
        {[540, 640].map((x, i) => <g key={x} opacity={ramp(c.lt, c.s(17) + i * 0.3, c.s(17) + i * 0.3 + 0.4)}><Suit x={x} floor={900 + i * 40} s={1.5} flip /><path d={`M ${x - 40} ${540 + i * 40} l 14 -26 l 14 26 l 14 -26`} stroke="#c93a2e" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
        <Txt x={360} y={1090} size={50} fill="#2a2220" ls={3} o={ramp(c.lt, c.s(17), c.s(17) + 0.5)}>DIFFICULT CUSTOMERS</Txt></g>
    ) },
    // 18 house rule one, amended
    { at: 18, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><g transform="translate(360 500) rotate(-2)"><rect x={-290} y={-190} width={580} height={380} fill="#f4ecd0" stroke={INK} strokeWidth={6} /><Txt x={0} y={-120} size={40} fill="#c93a2e" ls={3}>HOUSE RULE ONE</Txt><Txt x={0} y={-30} size={56} ls={2}>NOBODY COMES IN</Txt><line x1={-220} y1={-44} x2={220} y2={-44} stroke="#c93a2e" strokeWidth={6} opacity={ramp(c.lt, 0.4, 0.8)} /><g opacity={ramp(c.lt, 1.0, 1.4)} transform={`scale(${pop(ramp(c.lt, 1.0, 1.6))})`}><Txt x={0} y={60} size={34} fill="#6f7f6a">AMENDED:</Txt><Txt x={0} y={126} size={50} fill="#2f7fb8">THE ROOF IS OPEN</Txt></g></g></g>
    ) },
    // 19-20 by day sixteen there is a queue
    { at: 19, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="dawn" /><line x1={440} y1={520} x2={440} y2={1020} stroke="#c9b27a" strokeWidth={5} /><Bucket x={440} y={1050} s={0.9} tin={2} />
        <g opacity={ramp(c.lt, c.s(20), c.s(20) + 0.4)}><g transform="translate(120 0)"><Person kind="kid" x={0} floor={1190} s={1.2} pose={POSE.idle(c.lt)} /><g transform="translate(30 1000)"><ellipse rx={20} ry={26} fill="#f4efe6" stroke={INK} strokeWidth={4} /><circle cx={0} cy={-34} r={14} fill="#f6e6c8" stroke={INK} strokeWidth={3} /></g></g><Person kind="kid" x={230} floor={1190} s={1.15} pose={POSE.idle(c.lt + 1)} /><Person kind="kid" x={300} floor={1195} s={1.15} pose={POSE.idle(c.lt + 2)} /><Wheelbarrow x={375} floor={1195} s={0.8} /><Bike x={40} floor={1160} s={1.1} /></g>
        <Txt x={360} y={190} size={64} fill="#2a2220" ls={4} o={ramp(c.lt, 0.2, 0.6)}>DAY 16: A QUEUE</Txt></g>
    ) },
    // 21 the seventeenth night: you catch the thing moving your tins
    { at: 21, push: [1, 1.07], el: (c) => (
      <g><Interior wall="#7a7488" floor="#4a4658" line={900} /><Dark o={0.3} color="#07050f" />
        <rect x={160} y={80} width={400} height={300} fill="#c9c2b0" stroke={INK} strokeWidth={6} />{Array.from({ length: 6 }, (_, i) => <line key={i} x1={160 + i * 80} y1={80} x2={160 + i * 80} y2={380} stroke="#a9a290" strokeWidth={3} />)}
        <rect x={250} y={140} width={220} height={200} fill="#07050f" stroke={INK} strokeWidth={6} /><Eyes x={360} y={250} s={0.9} o={ramp(c.lt, 0.8, 1.2)} />
        {hero(300, 1050, 1.9, { ...POSE.idle(c.lt), head: -12, lU: 150, lF: 160 })}<Beam x={330} y={640} ang={-82} len={600} spread={18} o={0.5} />
        <Txt x={360} y={1190} size={50} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.5, 1.0)}>GOT YOU.</Txt></g>
    ) },
    // 22-24 a nine-year-old girl in the ceiling; her name is Mina
    { at: 22, push: [1, 1.06], el: (c) => (
      <g><rect width={W} height={H} fill="#1c1626" /><path d="M 0 0 L 720 0 L 720 300 L 0 540 Z" fill="#2a2234" stroke={INK} strokeWidth={5} />{[100, 260, 420, 580].map((x) => <line key={x} x1={x} y1={0} x2={x} y2={x < 360 ? 480 - x * 0.2 : 330} stroke="#3a3048" strokeWidth={14} />)}
        <rect y={900} width={W} height={380} fill="#241c2e" /><ellipse cx={500} cy={940} rx={190} ry={44} fill="#8a5a36" stroke={INK} strokeWidth={5} />{[[420, 930, '#6aa6a3'], [520, 926, '#b8453d'], [600, 936, '#d9b04a']].map(([bx, by, col], i) => <ellipse key={i} cx={bx as number} cy={by as number} rx={50} ry={18} fill={col as string} stroke={INK} strokeWidth={3} />)}
        <Person kind="kid" x={330} floor={1010} s={2.0} pose={POSE.idle(c.lt)} /><circle cx={330} cy={760} r={260} fill="#ffe6a8" opacity={0.07} />
        <g transform={`translate(360 360) scale(${pop(ramp(c.lt, c.s(23), c.s(23) + 0.5))})`} opacity={ramp(c.lt, c.s(23), c.s(23) + 0.3)}><rect x={-190} y={-70} width={380} height={140} rx={14} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><Txt x={0} y={-24} size={30} fill="#6f7f6a" ls={4}>HELLO, MY NAME IS</Txt><Txt x={0} y={46} size={84} fill="#c93a2e" ls={4}>MINA</Txt></g>
        <g opacity={ramp(c.lt, c.s(24), c.s(24) + 0.4)}><Txt x={360} y={1150} size={44} fill="#f6f1e2" stroke="#07050f" ls={3}>HERE SINCE BEFORE THE LIGHTS WENT OUT</Txt></g></g>
    ) },
    // 25 in her backpack, one enormous orange cat
    { at: 25, push: [1, 1.07], el: (c) => (
      <g><rect width={W} height={H} fill="#c99a6a" /><rect y={900} width={W} height={380} fill="#a9876f" stroke={INK} strokeWidth={5} /><Person kind="kid" x={250} floor={1000} s={2.2} pose={POSE.idle(c.lt)} />
        <g transform="translate(168 700) scale(2.6)"><rect x={-30} y={-40} width={60} height={80} rx={14} fill="#3d63a8" stroke={INK} strokeWidth={4} /><g transform={`translate(0 ${-44 - ramp(c.lt, 0.5, 1.2) * 20})`} opacity={ramp(c.lt, 0.5, 1.2)}><circle r={22} fill="#e8862f" stroke={INK} strokeWidth={4} /><polygon points="-18,-12 -14,-34 -2,-18" fill="#e8862f" stroke={INK} strokeWidth={3} /><polygon points="2,-18 14,-34 18,-12" fill="#e8862f" stroke={INK} strokeWidth={3} /><circle cx={-8} cy={-2} r={3} fill={INK} /><circle cx={8} cy={-2} r={3} fill={INK} /></g></g>
        <g opacity={ramp(c.lt, 1.0, 1.5)}><Cat x={520} floor={1000} s={2.0} t={c.lt} /></g><Txt x={360} y={220} size={58} fill="#6a3a14" ls={3} o={ramp(c.lt, 1.2, 1.7)}>ONE ENORMOUS CAT</Txt></g>
    ) },
    // 26 day twenty: the bucket comes up with a note
    { at: 26, push: [1, 1.07], el: (c) => {
      const k = ease(ramp(c.lt, 0.2, c.d - 0.3));
      return (
        <g><LotSide tone="dawn" /><line x1={440} y1={520} x2={440} y2={lerp(1060, 600, k)} stroke="#c9b27a" strokeWidth={5} /><Bucket x={440} y={lerp(1090, 640, k)} s={1.1} /><g transform={`translate(440 ${lerp(1040, 590, k)}) rotate(-8)`}><rect x={-34} y={-70} width={68} height={86} fill="#f4ecd0" stroke={INK} strokeWidth={4} />{[-40, -26, -12, 2].map((ly) => <line key={ly} x1={-24} y1={ly} x2={24} y2={ly} stroke="#6f6f6f" strokeWidth={2.5} />)}</g>
          <Person kind="hero" x={400} floor={520} s={0.95} pose={POSE.pull(POSE.idle(c.lt))} /><Txt x={360} y={190} size={70} fill="#2a2220" ls={4} o={ramp(c.lt, 0.2, 0.6)}>DAY 20</Txt></g>
      );
    } },
    // 27-30 the note: the suits are done trading, they come tonight, they want the freezer
    { at: 27, card: true, el: (c) => {
      const lines: [number, string, string][] = [[27, 'The people in white suits', 'are done trading.'], [28, 'They are coming', 'tonight.'], [29, 'They do not want', 'the food.'], [30, 'They want what is behind', 'the door that says DO NOT OPEN.']];
      return (
        <g><rect width={W} height={H} fill="#8a6a4a" /><g transform="translate(360 640) rotate(-2)"><rect x={-320} y={-540} width={640} height={1080} fill="#f4ecd0" stroke={INK} strokeWidth={5} />{Array.from({ length: 15 }, (_, i) => <line key={i} x1={-300} y1={-460 + i * 68} x2={300} y2={-460 + i * 68} stroke="#b9c8d8" strokeWidth={3} />)}<line x1={-260} y1={-540} x2={-260} y2={540} stroke="#e0a0a0" strokeWidth={3} />
          {lines.map(([si, a, b], i) => <g key={i} opacity={ramp(c.lt, c.s(si), c.s(si) + 0.5)}><Txt x={-10} y={-380 + i * 220} size={i === 3 ? 38 : 46} fill="#4a4a50" ls={1}>{a}</Txt><Txt x={-10} y={-380 + i * 220 + 62} size={i === 3 ? 38 : 46} fill={i === 3 ? '#c93a2e' : '#4a4a50'} ls={1}>{b}</Txt></g>)}</g></g>
      );
    } },
  ],
  cues: [
    [0, 0.3, 'ding'], [1, 0.2, 'whoosh'], [1, 1.0, 'steps', 3], [3, 0.3, 'click'], [4, 0.2, 'ding'], [4, 1.2, 'ding'], [6, 0.1, 'slam'], [7, 0.4, 'ding'],
    [9, 0.4, 'hiss'], [9, 0.8, 'rumble'], [9, 2.0, 'moan', 4], [12, 0.4, 'ding'], [13, 0.8, 'creak'], [14, 0.3, 'clink'], [15, 0.3, 'ding'],
    [18, 0.4, 'ding'], [20, 0.2, 'steps', 3], [21, 0.8, 'sting'], [22, 0.4, 'ding'], [25, 0.9, 'toot'], [26, 0.4, 'ratchet', 2], [27, 0.2, 'sting'], [30, 0.4, 'moan', 3],
  ],
};
void CardBg; void H; void W; void lerp; void Tin;
