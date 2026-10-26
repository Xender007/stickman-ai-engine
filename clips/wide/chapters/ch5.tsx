/** Chapter 5: Customers (16:9, script v4). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Beam, Bucket, Callout, Cat, CardW, DarkW, Eyes, INK, LotW, Mob, Person, POSE, Room, Suit, Tin, Txt, Wheelbarrow, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../kit.tsx';
import { ProblemW } from '../parts.tsx';

const F = 560;
const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Bike: React.FC<{ x: number; floor: number; s?: number }> = ({ x, floor, s = 1 }) => (
  <g transform={`translate(${x} ${floor}) scale(${s})`}>{[-48, 48].map((wx) => <circle key={wx} cx={wx} cy={-30} r={30} fill="none" stroke={INK} strokeWidth={6} />)}<path d="M -48 -30 L -8 -74 L 34 -74 L 48 -30 M -8 -74 L 12 -30 L -48 -30 M 34 -74 L 28 -92" fill="none" stroke="#3d63a8" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" /><line x1={14} y1={-94} x2={44} y2={-92} stroke={INK} strokeWidth={6} strokeLinecap="round" /></g>
);

export const ch: Chapter = {
  n: 5, label: 'CUSTOMERS',
  scenes: [
    // 0 it buys you two days
    { at: 0, card: true, el: (c) => (
      <g><CardW /><Txt x={640} y={90} size={48} fill="#6f7f6a" ls={5}>THE HORN TRICK</Txt>
        {[10, 11, 12].map((d, i) => { const a = pop(ramp(c.lt, 0.2 + i * 0.5, 0.6 + i * 0.5)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(${340 + i * 300} 300) scale(${a})`}><rect x={-100} y={-120} width={200} height={240} rx={16} fill="#fff" stroke={INK} strokeWidth={5} /><rect x={-100} y={-120} width={200} height={56} rx={14} fill={i < 2 ? '#4aa86a' : '#c93a2e'} stroke={INK} strokeWidth={5} /><Txt x={0} y={-80} size={34} fill="#fff">DAY</Txt><Txt x={0} y={50} size={110} maxW={140}>{String(d)}</Txt>{i < 2 && <path d="M -70 -30 L 70 90 M 70 -30 L -70 90" stroke="#c93a2e" strokeWidth={9} strokeLinecap="round" opacity={0.85} />}</g>; })}
        <g transform={`translate(640 520) scale(${pop(ramp(c.lt, 1.2, 1.8))})`}><Txt x={0} y={0} size={100} fill="#c93a2e" ls={3} maxW={500}>2 DAYS</Txt></g></g>
    ) },
    // 1 a rope drops from the next building; three people slide down in white suits
    { at: 1, push: [1, 1.04], el: (c) => {
      const k = (i: number) => ease(ramp(c.lt, 0.8 + i * 0.9, 2.4 + i * 0.9));
      return (
        <g><LotW tone="night" /><rect x={-100} y={150} width={290} height={340} fill="#4a4660" stroke={INK} strokeWidth={5} /><rect x={-110} y={130} width={310} height={26} fill="#6b6585" stroke={INK} strokeWidth={5} />
          <line x1={110} y1={156} x2={110} y2={lerp(156, 560, ease(ramp(c.lt, 0.1, 0.8)))} stroke="#c9b27a" strokeWidth={6} />
          {[0, 1, 2].map((i) => <Suit key={i} x={110 + i * 40} floor={lerp(190, F, k(i))} s={lerp(0.6, 1.2, k(i))} flip={false} />)}
          <Callout x={640} y={140} w={420} lines={[{ t: '12TH NIGHT', size: 52 }]} o={ramp(c.lt, 0.3, 0.7)} />
        </g>
      );
    } },
    // 2-3 clipboard, thermometer, a very simple plan
    { at: 2, push: [1, 1.04], el: (c) => (
      <g><LotW tone="night" />{[0, 1, 2].map((i) => <Suit key={i} x={170 + i * 90} floor={F + (i % 2) * 14} s={1.25} flip={false} />)}
        {['CLIPBOARD', 'THERMOMETER', 'A SIMPLE PLAN'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(3) + 0.2 + i * 0.7, c.s(3) + 0.5 + i * 0.7)}><Callout x={640} y={140 + i * 84} w={480} lines={[{ t: l, size: 38 }]} /></g>)}
      </g>
    ) },
    // 4-5 they know about the freezer, they have been tracking it for days
    { at: 4, card: true, el: (c) => {
      const sweep = (c.lt * 1.4) % 1;
      return (
        <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#0e1a14" />
          <g transform="translate(380 300)"><circle r={250} fill="none" stroke="#2f7a52" strokeWidth={4} /><circle r={170} fill="none" stroke="#2f7a52" strokeWidth={3} /><circle r={90} fill="none" stroke="#2f7a52" strokeWidth={3} /><line x1={-250} y1={0} x2={250} y2={0} stroke="#2f7a52" strokeWidth={2} /><line x1={0} y1={-250} x2={0} y2={250} stroke="#2f7a52" strokeWidth={2} />
            <path d={`M 0 0 L ${Math.cos(sweep * 6.283) * 250} ${Math.sin(sweep * 6.283) * 250}`} stroke="#7dffb0" strokeWidth={5} /><circle cx={80} cy={-60} r={14 + 8 * tri(c.lt * 2)} fill="#9fd0e8" opacity={0.9} /><Txt x={80} y={-88} size={28} fill="#9fd0e8" ls={3} maxW={160}>FREEZER</Txt></g>
          <Txt x={900} y={120} size={64} fill="#7dffb0" ls={5} o={ramp(c.lt, 0.2, 0.6)} maxW={600}>THEY KNOW.</Txt>
          <g opacity={ramp(c.lt, c.s(5), c.s(5) + 0.4)}><Txt x={900} y={250} size={34} fill="#7dffb0" ls={3} maxW={620}>TRACKING FOR DAYS</Txt>{[0, 1, 2, 3, 4].map((i) => <g key={i} opacity={ramp(c.lt, c.s(5) + 0.2 + i * 0.3, c.s(5) + 0.4 + i * 0.3)}><rect x={700 + i * 100} y={290} width={84} height={84} rx={10} fill="#1d3a2a" stroke="#7dffb0" strokeWidth={3} /><Txt x={742 + i * 100} y={350} size={44} fill="#7dffb0" maxW={60}>{String(i + 5)}</Txt></g>)}</g>
        </g>
      );
    } },
    // 6 problem four
    { at: 6, card: true, el: (c) => <ProblemW n="FOUR" title="THE LIVING" lt={c.lt} icon={<g>{[-100, 0, 100].map((x, i) => <g key={i} transform={`translate(${x} 20)`}><circle cx={0} cy={-26} r={30} fill="#e8eef2" stroke={INK} strokeWidth={6} /><rect x={-14} y={-40} width={36} height={22} rx={8} fill="#1c2630" /><path d="M -36 40 Q 0 -30 36 40 Z" fill="#e8eef2" stroke={INK} strokeWidth={6} /></g>)}</g>} /> },
    // 7 you cannot fight three people with suits and tools
    { at: 7, push: [1, 1.04], el: (c) => (
      <g><LotW tone="night" /><Person kind="hero" x={1000} floor={186} s={0.75} pose={POSE.idle(c.lt)} flip />{[0, 1, 2].map((i) => <Suit key={i} x={170 + i * 90} floor={F} s={1.3} flip={false} />)}
        <g transform={`translate(640 160) scale(${pop(ramp(c.lt, 0.2, 0.8))})`}><Txt x={-170} y={0} size={120} fill="#4aa86a" stroke="#07050f" maxW={120}>1</Txt><Txt x={0} y={0} size={96} fill="#f6f1e2" stroke="#07050f" maxW={140}>vs</Txt><Txt x={170} y={0} size={120} fill="#ff5a4a" stroke="#07050f" maxW={120}>3</Txt></g></g>
    ) },
    // 8-10 if they cut the shutter, 250 dead walk in behind them
    { at: 8, push: [1, 1.04], el: (c) => {
      const tear = ramp(c.lt, c.s(9), c.s(9) + 1.6), flood = ramp(c.lt, c.s(9) + 1.4, c.d - 0.6);
      return (
        <g><LotW tone="night" shutter={1 - tear * 0.85} lit={tear > 0.3} />{c.lt > c.s(9) - 0.4 && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={820 + rnd(i) * 300} cy={380 + rnd(i + 2) * 80} r={3 + rnd(i + 5) * 3} fill="#ffb347" opacity={tri(c.lt * 8 + i) * 0.9} />)}
          <g transform={`translate(${flood * 130} 0)`}><Mob n={60} t={c.t} seed={44} x0={-60} x1={600} f0={480} f1={585} s0={0.55} s1={0.78} face="right" still={false} shown={ramp(c.lt, c.s(9), c.s(9) + 0.8)} /></g>
          {[0, 1].map((i) => <Suit key={i} x={640 + i * 60} floor={F - 20} s={1.0} flip={false} />)}
          <Callout x={330} y={150} w={560} lines={[{ t: 'IF THE SHUTTER GOES...', size: 46 }]} o={ramp(c.lt, 0.2, 0.6)} />
          <Callout x={330} y={290} w={560} lines={[{ t: 'NOBODY HAS A SUPERMARKET', size: 38, fill: '#ffd47a' }]} o={ramp(c.lt, c.s(10), c.s(10) + 0.5)} />
        </g>
      );
    } },
    // 11-12 you do not open the door, you open the store
    { at: 11, push: [1, 1.04], el: (c) => {
      const sign = ease(ramp(c.lt, c.s(12), c.s(12) + 0.8));
      return (
        <g><LotW tone="night" lit />
          <g opacity={1 - ramp(c.lt, c.s(12) - 0.2, c.s(12) + 0.2)}><g transform="translate(970 370)"><circle r={90} fill="#c93a2e" opacity={0.9} /><path d="M -42 -42 l 84 84 M 42 -42 l -84 84" stroke="#fff" strokeWidth={18} strokeLinecap="round" /></g><Callout x={330} y={150} w={460} lines={[{ t: 'NOT THE DOOR', size: 56 }]} /></g>
          <g transform={`translate(970 ${lerp(-40, 40, sign) + Math.sin(c.lt * 6) * 4 * sign})`} opacity={ramp(c.lt, c.s(12), c.s(12) + 0.3)}><line x1={-90} y1={-200} x2={-90} y2={0} stroke={INK} strokeWidth={5} /><line x1={90} y1={-200} x2={90} y2={0} stroke={INK} strokeWidth={5} /><rect x={-140} y={0} width={280} height={120} rx={18} fill="#c93a2e" stroke={INK} strokeWidth={6} /><rect x={-120} y={14} width={240} height={92} rx={12} fill="none" stroke="#fff" strokeWidth={4} /><Txt x={0} y={84} size={74} fill="#fff" ls={4} maxW={200}>OPEN</Txt></g>
          <Callout x={330} y={150} w={460} lines={[{ t: 'OPEN THE STORE', size: 56, fill: '#ffe6a8' }]} o={ramp(c.lt, c.s(12), c.s(12) + 0.5)} />
        </g>
      );
    } },
    // 13 one rope, one bucket off the roof at 1:30
    { at: 13, push: [1, 1.04], el: (c) => {
      const k = ease(ramp(c.lt, 0.6, c.d - 0.3)), by = lerp(190, 520, k);
      return (
        <g><LotW tone="night" /><Person kind="hero" x={790} floor={186} s={0.75} pose={{ ...POSE.idle(c.lt), lU: 80, lF: 100 }} /><line x1={760} y1={186} x2={760} y2={by - 30} stroke="#c9b27a" strokeWidth={5} /><Bucket x={760} y={by} s={0.7} />
          <Suit x={560} floor={F} s={1.1} flip={false} /><Suit x={630} floor={F + 8} s={1.1} flip={false} />
          <g transform="translate(330 150)"><rect x={-190} y={-60} width={380} height={130} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={-20} size={28} fill="#d9b04a" ls={4} maxW={340}>ROOF · REAR</Txt><Txt x={0} y={50} size={56} fill="#7dffb0" ls={6} maxW={300}>1:30 AM</Txt></g></g>
      );
    } },
    // 14-15 the first fifteen tins are free; after that you trade
    { at: 14, card: true, el: (c) => {
      const rows: [string, string][] = [['BATTERIES', '#d9b04a'], ['FUEL', '#c93a2e'], ['MEDICINE', '#4aa86a'], ['NEWS', '#6aa6c8']];
      return (
        <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#2f4a3a" /><rect x={30} y={20} width={1220} height={570} fill="none" stroke="#a9835a" strokeWidth={20} />
          <g opacity={ramp(c.lt, 0.2, 0.6)}><Txt x={380} y={120} size={50} fill="#f6f1e2" ls={4} maxW={560}>THE FIRST 15 TINS</Txt><Txt x={380} y={230} size={110} fill="#7dffb0" ls={6} maxW={400}>FREE</Txt></g>
          {Array.from({ length: 15 }, (_, i) => <g key={i} opacity={ramp(c.lt, 0.5 + i * 0.05, 0.65 + i * 0.05)}><Tin x={130 + (i % 8) * 64} y={400 + Math.floor(i / 8) * 64} s={0.95} c={['#b8453d', '#3f6db0', '#d9b04a', '#8b9a5b'][i % 4]} /></g>)}
          <g opacity={ramp(c.lt, c.s(15), c.s(15) + 0.4)}><line x1={720} y1={70} x2={720} y2={540} stroke="#f6f1e2" strokeWidth={4} strokeDasharray="14 10" /><Txt x={950} y={100} size={44} fill="#f6f1e2" ls={4} maxW={420}>AFTER THAT:</Txt></g>
          {rows.map(([l, col], i) => <g key={i} opacity={ramp(c.lt, c.s(15) + 0.7 + i * 0.45, c.s(15) + 1.0 + i * 0.45)}><rect x={770} y={140 + i * 100} width={400} height={80} rx={14} fill={col} stroke="#f6f1e2" strokeWidth={4} opacity={0.92} /><Txt x={970} y={196 + i * 100} size={46} fill="#1b1410" ls={4} maxW={360}>{l}</Txt></g>)}
        </g>
      );
    } },
    // 16-17 five years of retail: difficult customers
    { at: 16, push: [1, 1.04], el: (c) => (
      <g><Room wall="#d8c8a0" line={500} /><rect x={-100} y={380} width={620} height={170} fill="#8a5a36" stroke={INK} strokeWidth={6} /><rect x={-100} y={360} width={640} height={30} fill="#a9835a" stroke={INK} strokeWidth={5} />{hero(300, 400, 1.7, { ...POSE.idle(c.lt), lU: 20, lF: 40 })}
        <g transform={`translate(560 180) scale(${pop(ramp(c.lt, 0.3, 0.9))})`}><path d="M -140 0 L -140 -56 L 140 -56 L 140 0 L 100 0 L 100 22 L 66 0 Z" fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-14} size={32} maxW={250}>HAPPY TO HELP</Txt></g>
        <g transform="translate(180 120)" opacity={ramp(c.lt, 0.2, 0.6)}><rect x={-100} y={-40} width={200} height={68} rx={34} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={12} size={40} fill="#fff" ls={2} maxW={170}>5 YEARS</Txt></g>
        {[860, 1020].map((x, i) => <g key={x} opacity={ramp(c.lt, c.s(17) + i * 0.3, c.s(17) + i * 0.3 + 0.4)}><Suit x={x} floor={F - i * 20} s={1.5} flip /><path d={`M ${x - 40} ${190 + i * 40} l 14 -26 l 14 26 l 14 -26`} stroke="#c93a2e" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
        <Callout x={940} y={90} w={420} lines={[{ t: 'DIFFICULT CUSTOMERS', size: 32 }]} o={ramp(c.lt, c.s(17), c.s(17) + 0.5)} />
      </g>
    ) },
    // 18 house rule one, amended
    { at: 18, push: [1, 1.03], el: (c) => (
      <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><g transform="translate(640 290) rotate(-2)"><rect x={-360} y={-200} width={720} height={400} fill="#f4ecd0" stroke={INK} strokeWidth={6} /><Txt x={0} y={-120} size={40} fill="#c93a2e" ls={3} maxW={600}>HOUSE RULE ONE</Txt><Txt x={0} y={-30} size={60} ls={2} maxW={640}>NOBODY COMES IN</Txt><line x1={-280} y1={-46} x2={280} y2={-46} stroke="#c93a2e" strokeWidth={6} opacity={ramp(c.lt, 0.4, 0.8)} /><g opacity={ramp(c.lt, 1.0, 1.4)} transform={`scale(${pop(ramp(c.lt, 1.0, 1.6))})`}><Txt x={0} y={60} size={34} fill="#6f7f6a" maxW={600}>AMENDED:</Txt><Txt x={0} y={136} size={56} fill="#2f7fb8" maxW={640}>THE ROOF IS OPEN</Txt></g></g></g>
    ) },
    // 19-20 by day sixteen there is a queue
    { at: 19, push: [1, 1.04], el: (c) => (
      <g><LotW tone="dawn" /><line x1={760} y1={186} x2={760} y2={470} stroke="#c9b27a" strokeWidth={5} /><Bucket x={760} y={500} s={0.7} tin={2} />
        <g opacity={ramp(c.lt, c.s(20), c.s(20) + 0.4)}><Person kind="kid" x={150} floor={F} s={1.2} pose={POSE.idle(c.lt)} /><g transform="translate(190 410)"><ellipse rx={20} ry={26} fill="#f4efe6" stroke={INK} strokeWidth={4} /><circle cx={0} cy={-34} r={14} fill="#f6e6c8" stroke={INK} strokeWidth={3} /></g><Person kind="kid" x={300} floor={F} s={1.15} pose={POSE.idle(c.lt + 1)} /><Person kind="kid" x={380} floor={F + 4} s={1.15} pose={POSE.idle(c.lt + 2)} /><Wheelbarrow x={500} floor={F + 4} s={0.85} /><Bike x={650} floor={F} s={1.1} /></g>
        <Callout x={330} y={110} w={460} lines={[{ t: 'DAY 16: A QUEUE', size: 52 }]} o={ramp(c.lt, 0.2, 0.6)} />
      </g>
    ) },
    // 21 the seventeenth night: you catch the thing moving your tins
    { at: 21, push: [1, 1.05], el: (c) => (
      <g><Room wall="#7a7488" floor="#4a4658" line={500} /><DarkW o={0.3} />
        <rect x={420} y={20} width={440} height={170} fill="#c9c2b0" stroke={INK} strokeWidth={6} />{Array.from({ length: 5 }, (_, i) => <line key={i} x1={508 + i * 88} y1={20} x2={508 + i * 88} y2={190} stroke="#a9a290" strokeWidth={3} />)}<rect x={540} y={60} width={200} height={130} fill="#07050f" stroke={INK} strokeWidth={6} /><Eyes x={640} y={130} s={0.8} o={ramp(c.lt, 0.8, 1.2)} />
        {hero(560, F, 1.9, { ...POSE.idle(c.lt), head: -12, lU: 150, lF: 160 })}<Beam x={600} y={300} ang={-85} len={400} spread={18} o={0.5} />
        <Callout x={1030} y={300} w={360} lines={[{ t: 'GOT YOU.', size: 66 }]} o={ramp(c.lt, 0.5, 1.0)} />
      </g>
    ) },
    // 22-24 a nine-year-old girl in the ceiling; her name is Mina
    { at: 22, push: [1, 1.04], el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1c1626" /><path d="M -100 -100 L 1380 -100 L 1380 200 L -100 330 Z" fill="#2a2234" stroke={INK} strokeWidth={5} />{[100, 300, 500, 700, 900, 1100].map((x) => <line key={x} x1={x} y1={-100} x2={x} y2={240 + (x < 640 ? -x * 0.1 : 0)} stroke="#3a3048" strokeWidth={14} />)}
        <rect y={500} x={-100} width={W + 200} height={300} fill="#241c2e" /><ellipse cx={900} cy={520} rx={230} ry={40} fill="#8a5a36" stroke={INK} strokeWidth={5} />{[[800, 505, '#6aa6a3'], [910, 500, '#b8453d'], [1010, 508, '#d9b04a']].map(([bx, by, col], i) => <ellipse key={i} cx={bx as number} cy={by as number} rx={56} ry={18} fill={col as string} stroke={INK} strokeWidth={3} />)}
        <Person kind="kid" x={520} floor={F} s={2.0} pose={POSE.idle(c.lt)} /><circle cx={520} cy={380} r={250} fill="#ffe6a8" opacity={0.07} />
        <g transform={`translate(900 190) scale(${pop(ramp(c.lt, c.s(23), c.s(23) + 0.5))})`} opacity={ramp(c.lt, c.s(23), c.s(23) + 0.3)}><rect x={-200} y={-70} width={400} height={140} rx={14} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><Txt x={0} y={-34} size={26} fill="#6f7f6a" ls={4} maxW={360}>HELLO, MY NAME IS</Txt><Txt x={0} y={52} size={76} fill="#c93a2e" ls={4} maxW={300}>MINA</Txt></g>
        <Callout x={900} y={410} w={560} lines={[{ t: 'HERE SINCE BEFORE THE LIGHTS WENT OUT', size: 26 }]} o={ramp(c.lt, c.s(24), c.s(24) + 0.4)} />
      </g>
    ) },
    // 25 in her backpack, one enormous orange cat
    { at: 25, push: [1, 1.05], el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#c99a6a" /><rect y={480} x={-100} width={W + 200} height={300} fill="#a9876f" stroke={INK} strokeWidth={5} /><Person kind="kid" x={380} floor={F} s={2.0} pose={POSE.idle(c.lt)} />
        <g transform="translate(300 350) scale(2.2)"><rect x={-30} y={-40} width={60} height={80} rx={14} fill="#3d63a8" stroke={INK} strokeWidth={4} /><g transform={`translate(0 ${-44 - ramp(c.lt, 0.5, 1.2) * 20})`} opacity={ramp(c.lt, 0.5, 1.2)}><circle r={22} fill="#e8862f" stroke={INK} strokeWidth={4} /><polygon points="-18,-12 -14,-34 -2,-18" fill="#e8862f" stroke={INK} strokeWidth={3} /><polygon points="2,-18 14,-34 18,-12" fill="#e8862f" stroke={INK} strokeWidth={3} /><circle cx={-8} cy={-2} r={3} fill={INK} /><circle cx={8} cy={-2} r={3} fill={INK} /></g></g>
        <g opacity={ramp(c.lt, 1.0, 1.5)}><Cat x={860} floor={F} s={2.0} t={c.lt} /></g><Callout x={900} y={130} w={560} lines={[{ t: 'ONE ENORMOUS CAT', size: 50, fill: '#ffe6a8' }]} o={ramp(c.lt, 1.2, 1.7)} />
      </g>
    ) },
    // 26 day twenty: the bucket comes up with a note
    { at: 26, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.2, c.d - 0.3));
      return (
        <g><LotW tone="dawn" /><line x1={760} y1={186} x2={760} y2={lerp(520, 270, k)} stroke="#c9b27a" strokeWidth={5} /><Bucket x={760} y={lerp(540, 290, k)} s={0.8} /><g transform={`translate(760 ${lerp(500, 250, k)}) rotate(-8)`}><rect x={-26} y={-52} width={52} height={64} fill="#f4ecd0" stroke={INK} strokeWidth={4} />{[-30, -20, -10, 0].map((ly) => <line key={ly} x1={-18} y1={ly} x2={18} y2={ly} stroke="#6f6f6f" strokeWidth={2.5} />)}</g>
          <Person kind="hero" x={720} floor={186} s={0.75} pose={POSE.pull(POSE.idle(c.lt))} /><Callout x={330} y={150} w={360} lines={[{ t: 'DAY 20', size: 70 }]} o={ramp(c.lt, 0.2, 0.6)} /></g>
      );
    } },
    // 27-30 the note: the suits are done trading, they come tonight, they want the freezer
    { at: 27, card: true, el: (c) => {
      const lines: [number, string, string][] = [[27, 'The people in white suits', 'are done trading.'], [28, 'They are coming', 'tonight.'], [29, 'They do not want', 'the food.'], [30, 'They want what is behind', 'the door that says DO NOT OPEN.']];
      return (
        <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#8a6a4a" /><g transform="translate(640 300) rotate(-1)"><rect x={-480} y={-270} width={960} height={540} fill="#f4ecd0" stroke={INK} strokeWidth={5} />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={-460} y1={-200 + i * 62} x2={460} y2={-200 + i * 62} stroke="#b9c8d8" strokeWidth={3} />)}<line x1={-410} y1={-270} x2={-410} y2={270} stroke="#e0a0a0" strokeWidth={3} />
          {lines.map(([si, a, b], i) => <g key={i} opacity={ramp(c.lt, c.s(si), c.s(si) + 0.5)}><Txt x={20} y={-170 + i * 118} size={44} fill="#4a4a50" ls={1} maxW={800}>{a}</Txt><Txt x={20} y={-170 + i * 118 + 48} size={44} fill={i === 3 ? '#c93a2e' : '#4a4a50'} ls={1} maxW={800}>{b}</Txt></g>)}</g></g>
      );
    } },
  ],
  cues: [
    [0, 0.3, 'ding'], [1, 0.2, 'whoosh'], [1, 1.0, 'steps', 3], [3, 0.3, 'click'], [4, 0.2, 'ding'], [4, 1.2, 'ding'], [6, 0.1, 'slam'], [7, 0.4, 'ding'],
    [9, 0.4, 'hiss'], [9, 0.8, 'rumble'], [9, 2.0, 'moan', 4], [12, 0.4, 'ding'], [13, 0.8, 'creak'], [14, 0.3, 'clink'], [15, 0.3, 'ding'],
    [18, 0.4, 'ding'], [20, 0.2, 'steps', 3], [21, 0.8, 'sting'], [22, 0.4, 'ding'], [25, 0.9, 'toot'], [26, 0.4, 'ratchet', 2], [27, 0.2, 'sting'], [30, 0.4, 'moan', 3],
  ],
};
void Beam; void Eyes; void H; void lerp;
