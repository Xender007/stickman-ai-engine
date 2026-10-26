/** Chapter 5: Customers. Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../../engine.tsx';
import { Bucket, CardBg, Dark, Dead, Door, INK, Interior, Note, PAL, Person, POSE, ProblemCard, Tin, Truck, Txt, Wheelbarrow, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../../lib.tsx';
import { Bike, LockPlate, LotSide, Mob, RheaDead } from '../../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
/** a living stranger as a dark silhouette */
const Stranger: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; pose?: any; kind?: 'kid' | 'dana' }> = ({ x, floor, s = 1.2, flip = true, pose, kind = 'kid' }) => (
  <g style={{ filter: 'brightness(0.32)' }}><Person kind={kind} x={x} floor={floor} s={s} flip={flip} pose={pose ?? POSE.idle()} /></g>
);
const Rings: React.FC<{ x: number; y: number; t0: number; lt: number }> = ({ x, y, t0, lt }) => {
  const k = ramp(lt, t0, t0 + 0.55);
  return k > 0 && k < 1 ? <g opacity={1 - k}><circle cx={x} cy={y} r={40 + k * 150} fill="none" stroke="#c93a2e" strokeWidth={9} /><circle cx={x} cy={y} r={20 + k * 90} fill="none" stroke="#c93a2e" strokeWidth={6} /></g> : null;
};

export const ch: Chapter = {
  n: 5, label: 'CUSTOMERS',
  scenes: [
    // 0 it buys you two days
    { at: 0, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={190} size={52} fill="#6f7f6a" ls={5}>THE ALARM CLOCK TRICK</Txt>
        {[10, 11, 12].map((d, i) => { const a = pop(ramp(c.lt, 0.2 + i * 0.5, 0.6 + i * 0.5)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(${130 + i * 230} 560) scale(${a})`}><rect x={-90} y={-110} width={180} height={220} rx={16} fill="#fff" stroke={INK} strokeWidth={5} /><rect x={-90} y={-110} width={180} height={52} rx={14} fill={i < 2 ? '#4aa86a' : '#c93a2e'} stroke={INK} strokeWidth={5} /><Txt x={0} y={-72} size={34} fill="#fff">DAY</Txt><Txt x={0} y={46} size={110}>{d}</Txt>{i < 2 && <path d="M -62 -30 L 62 80 M 62 -30 L -62 80" stroke="#c93a2e" strokeWidth={9} strokeLinecap="round" opacity={0.85} />}</g>; })}
        <g transform={`translate(360 940) scale(${pop(ramp(c.lt, 1.2, 1.8))})`}><Txt x={0} y={0} size={120} fill="#c93a2e" ls={3}>2 DAYS</Txt></g>
      </g>
    ) },
    // 1-3 three knocks, a pause, three more; the dead do not knock
    { at: 1, push: [1, 1.05], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(2) + o);
      return (
        <g><Interior wall="#7f7a8a" line={900} /><Dark o={0.35} color="#10101c" />
          <Door x={250} y={300} w={230} h={600} open={0} color="#6a7580" />
          {hits.map((h, i) => <Rings key={i} x={365} y={560} t0={h} lt={c.lt} />)}
          {hero(110, 1040, 1.6, { ...POSE.idle(c.lt), head: 10, lU: 40, lF: 20 })}
          <Txt x={360} y={210} size={52} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.2, 0.6)}>12TH NIGHT</Txt>
          <g opacity={ramp(c.lt, c.s(3), c.s(3) + 0.4)}><rect x={90} y={1000} width={540} height={120} rx={14} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={360} y={1075} size={48} fill="#c93a2e" ls={2}>THE DEAD DO NOT KNOCK</Txt></g>
        </g>
      );
    } },
    // 4-5 four of them, a truck, a chain, a plan
    { at: 4, push: [1, 1.05], el: (c) => {
      const tx = lerp(-300, 300, ease(ramp(c.lt, 0.2, c.s(5) - 0.4)));
      return (
        <g><LotSide tone="night" /><Truck x={tx} floor={1130} s={1.15} lights={ramp(c.lt, 0.2, 0.8)} />
          {[0, 1, 2, 3].map((i) => <g key={i} opacity={ramp(c.lt, 0.5 + i * 0.35, 0.9 + i * 0.35)}><Stranger x={110 + i * 70} floor={1190} s={1.15} flip={false} /></g>)}
          <Txt x={360} y={190} size={80} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.3, 0.7)}>FOUR OF THEM</Txt>
          <g opacity={ramp(c.lt, c.s(5), c.s(5) + 0.5)}>{['PICKUP TRUCK', 'TOW CHAIN', 'A SIMPLE PLAN'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(5) + i * 0.7, c.s(5) + i * 0.7 + 0.3)}><rect x={80} y={270 + i * 80} width={400} height={64} rx={12} fill="#2a2220" opacity={0.88} /><Txt x={280} y={316 + i * 80} size={36} fill="#f6f1e2" ls={3}>{l}</Txt></g>)}</g>
        </g>
      );
    } },
    // 6-8 they saw the lights; they know what is inside
    { at: 6, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" lit />
        <rect x={370} y={500} width={380} height={420} fill="#fff6c8" opacity={0.2 + 0.08 * tri(c.lt * 3)} />
        {[0, 1, 2, 3].map((i) => <Stranger key={i} x={90 + i * 78} floor={1180} s={1.2} flip={false} />)}
        <Txt x={360} y={190} size={60} fill="#fff6c8" stroke="#07050f" ls={4} o={ramp(c.lt, 0.2, 0.6)}>DAY 9: LIGHTS ON</Txt>
        <g opacity={ramp(c.lt, c.s(8), c.s(8) + 0.5)} transform={`translate(270 830) scale(${pop(ramp(c.lt, c.s(8), c.s(8) + 0.6))})`}><ellipse cx={0} cy={0} rx={190} ry={120} fill="#fff" stroke={INK} strokeWidth={5} />{[-90, -30, 30, 90].map((tx, i) => <Tin key={i} x={tx} y={20 + (i % 2) * 8} c={['#b8453d', '#3f6db0', '#d9b04a', '#8b9a5b'][i]} />)}<Txt x={0} y={-52} size={36}>WHAT IS INSIDE?</Txt><circle cx={-60} cy={150} r={14} fill="#fff" stroke={INK} strokeWidth={4} /><circle cx={-100} cy={190} r={8} fill="#fff" stroke={INK} strokeWidth={4} /></g>
      </g>
    ) },
    // 9 problem four
    { at: 9, card: true, el: (c) => <ProblemCard n="FOUR" title="THE LIVING" c={c} icon={<g>{[-150, -50, 50, 150].map((x, i) => <g key={i} transform={`translate(${x} 20)`}><circle cx={0} cy={-70} r={28} fill="#f6e6c8" stroke={INK} strokeWidth={6} /><path d="M -34 56 Q 0 -50 34 56 Z" fill="#6a7580" stroke={INK} strokeWidth={6} /></g>)}</g>} /> },
    // 10 you cannot fight four people
    { at: 10, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" />
        <Person kind="hero" x={560} floor={520} s={0.95} pose={POSE.idle(c.lt)} flip />
        {[0, 1, 2, 3].map((i) => <Stranger key={i} x={120 + i * 66} floor={1150} s={1.3} flip={false} />)}
        <g transform={`translate(360 300) scale(${pop(ramp(c.lt, 0.2, 0.8))})`}><Txt x={-120} y={0} size={140} fill="#4aa86a" stroke="#07050f">1</Txt><Txt x={0} y={0} size={110} fill="#f6f1e2" stroke="#07050f">vs</Txt><Txt x={130} y={0} size={140} fill="#c93a2e" stroke="#07050f">4</Txt></g>
      </g>
    ) },
    // 11-13 if they tear the shutter off, 250 dead walk in behind them
    { at: 11, push: [1, 1.06], el: (c) => {
      const tear = ramp(c.lt, c.s(12) + 0.2, c.s(12) + 1.6);
      const flood = ramp(c.lt, c.s(12) + 1.4, c.d - 0.6);
      return (
        <g><LotSide tone="night" shutter={1 - tear * 0.85} lit={tear > 0.3} />
          <g transform={`translate(${flood * 130} 0)`}><Mob n={60} t={c.t} seed={44} x0={-60} x1={360} f0={930} f1={1190} face="right" still={false} shown={ramp(c.lt, c.s(12), c.s(12) + 0.8)} /></g>
          {[0, 1].map((i) => <Stranger key={i} x={300 + i * 60} floor={1130} s={1.1} flip={false} />)}
          <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>IF THE SHUTTER GOES...</Txt>
          <g opacity={ramp(c.lt, c.s(13), c.s(13) + 0.5)}><rect x={60} y={300} width={600} height={110} rx={14} fill="#2a2220" opacity={0.9} /><Txt x={360} y={372} size={46} fill="#f6f1e2" ls={2}>NOBODY HAS A SUPERMARKET</Txt></g>
        </g>
      );
    } },
    // 14-15 you do not open the door, you open the store
    { at: 14, push: [1, 1.05], el: (c) => {
      const sign = ease(ramp(c.lt, c.s(15), c.s(15) + 0.8));
      return (
        <g><LotSide tone="night" lit />
          <g opacity={1 - ramp(c.lt, c.s(15) - 0.2, c.s(15) + 0.2)}><g transform="translate(555 760)"><circle r={110} fill="#c93a2e" opacity={0.9} /><path d="M -50 -50 l 100 100 M 50 -50 l -100 100" stroke="#fff" strokeWidth={22} strokeLinecap="round" /></g><Txt x={360} y={190} size={60} fill="#f6f1e2" stroke="#07050f" ls={3}>NOT THE DOOR</Txt></g>
          <g transform={`translate(555 ${lerp(300, 440, sign) + Math.sin(c.lt * 6) * 4 * sign})`} opacity={ramp(c.lt, c.s(15), c.s(15) + 0.3)}><line x1={-90} y1={-300} x2={-90} y2={0} stroke={INK} strokeWidth={5} /><line x1={90} y1={-300} x2={90} y2={0} stroke={INK} strokeWidth={5} /><rect x={-140} y={0} width={280} height={150} rx={18} fill="#c93a2e" stroke={INK} strokeWidth={6} /><rect x={-120} y={18} width={240} height={114} rx={12} fill="none" stroke="#fff" strokeWidth={4} /><Txt x={0} y={102} size={92} fill="#fff" ls={4}>OPEN</Txt></g>
          <g opacity={ramp(c.lt, c.s(15), c.s(15) + 0.5)}><Txt x={200} y={190} size={60} fill="#fff6c8" stroke="#07050f" ls={3}>THE STORE</Txt></g>
        </g>
      );
    } },
    // 16 one rope, one bucket off the roof at 1:30 am
    { at: 16, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.6, c.d - 0.3));
      const by = lerp(520, 1060, k);
      return (
        <g><LotSide tone="night" />
          <Person kind="hero" x={410} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: 80, lF: 100 }} />
          <line x1={440} y1={520} x2={440} y2={by - 40} stroke="#c9b27a" strokeWidth={5} /><Bucket x={440} y={by} s={0.9} />
          <Stranger x={300} floor={1190} s={1.1} flip={false} /><Stranger x={360} floor={1200} s={1.1} flip={false} />
          <g transform="translate(360 200)"><rect x={-180} y={-72} width={360} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={-6} size={34} fill="#d9b04a" ls={4}>ROOF · REAR</Txt><Txt x={0} y={30} size={60} fill="#7dffb0" ls={6}>1:30 AM</Txt></g>
        </g>
      );
    } },
    // 17-19 first fifteen tins free, then you trade
    { at: 17, card: true, el: (c) => {
      const rows: [string, string][] = [['BATTERIES', '#d9b04a'], ['FUEL', '#c93a2e'], ['MEDICINE', '#4aa86a'], ['NEWS', '#6aa6c8']];
      return (
        <g><rect width={W} height={H} fill="#2f4a3a" /><rect x={30} y={30} width={660} height={1220} fill="none" stroke="#a9835a" strokeWidth={22} />
          <g opacity={ramp(c.lt, 0.2, 0.6)}><Txt x={360} y={200} size={64} fill="#f6f1e2" ls={4}>THE FIRST 15 TINS</Txt><Txt x={360} y={290} size={120} fill="#7dffb0" ls={6}>FREE</Txt></g>
          {Array.from({ length: 15 }, (_, i) => <g key={i} opacity={ramp(c.lt, 0.5 + i * 0.05, 0.65 + i * 0.05)}><Tin x={96 + (i % 8) * 70} y={420 + Math.floor(i / 8) * 60} s={0.9} c={['#b8453d', '#3f6db0', '#d9b04a', '#8b9a5b'][i % 4]} /></g>)}
          <g opacity={ramp(c.lt, c.s(18), c.s(18) + 0.4)}><line x1={80} y1={580} x2={640} y2={580} stroke="#f6f1e2" strokeWidth={4} strokeDasharray="14 10" /><Txt x={360} y={650} size={64} fill="#f6f1e2" ls={4}>AFTER THAT:</Txt></g>
          {rows.map(([l, col], i) => <g key={i} opacity={ramp(c.lt, c.s(19) + i * 0.45, c.s(19) + i * 0.45 + 0.3)} transform={`translate(0 ${(1 - ramp(c.lt, c.s(19) + i * 0.45, c.s(19) + i * 0.45 + 0.3)) * 20})`}><rect x={110} y={700 + i * 100} width={500} height={80} rx={14} fill={col} stroke="#f6f1e2" strokeWidth={4} opacity={0.92} /><Txt x={360} y={756 + i * 100} size={50} fill="#1b1410" ls={4}>{l}</Txt></g>)}
        </g>
      );
    } },
    // 20-21 five years in retail: difficult customers
    { at: 20, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#d8c8a0" line={900} />
        <rect x={0} y={760} width={440} height={200} fill="#8a5a36" stroke={INK} strokeWidth={6} /><rect x={0} y={740} width={460} height={34} fill="#a9835a" stroke={INK} strokeWidth={5} />
        {hero(190, 880, 1.9, { ...POSE.idle(c.lt), lU: 20, lF: 40 })}
        <g transform={`translate(230 400) scale(${pop(ramp(c.lt, 0.3, 0.9))})`}><path d="M -110 0 L -110 -50 L 110 -50 L 110 0 L 80 0 L 80 20 L 50 0 Z" fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-12} size={30}>HAPPY TO HELP</Txt></g>
        <g transform={`translate(110 200)`} opacity={ramp(c.lt, 0.2, 0.6)}><rect x={-100} y={-44} width={200} height={72} rx={36} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={14} size={44} fill="#fff" ls={2}>5 YEARS</Txt></g>
        {[540, 640].map((x, i) => <g key={x} opacity={ramp(c.lt, c.s(21) + i * 0.3, c.s(21) + i * 0.3 + 0.4)}><Stranger x={x} floor={900 + i * 40} s={1.5} flip /><path d={`M ${x - 40} ${540 + i * 40} l 14 -26 l 14 26 l 14 -26`} stroke="#c93a2e" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
        <Txt x={360} y={1090} size={50} fill="#2a2220" ls={3} o={ramp(c.lt, c.s(21), c.s(21) + 0.5)}>DIFFICULT CUSTOMERS</Txt>
      </g>
    ) },
    // 22 house rule, amended
    { at: 22, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} />
        <g transform="translate(360 500) rotate(-2)"><rect x={-290} y={-190} width={580} height={380} fill="#f4ecd0" stroke={INK} strokeWidth={6} />
          <Txt x={0} y={-120} size={40} fill="#c93a2e" ls={3}>HOUSE RULE ONE</Txt>
          <Txt x={0} y={-30} size={56} ls={2}>NOBODY COMES IN</Txt>
          <line x1={-220} y1={-44} x2={220} y2={-44} stroke="#c93a2e" strokeWidth={6} opacity={ramp(c.lt, 0.4, 0.8)} />
          <g opacity={ramp(c.lt, 1.0, 1.4)} transform={`scale(${pop(ramp(c.lt, 1.0, 1.6))})`}><Txt x={0} y={60} size={34} fill="#6f7f6a">AMENDED:</Txt><Txt x={0} y={126} size={50} fill="#2f7fb8">THE ROOF IS OPEN</Txt></g></g>
      </g>
    ) },
    // 23-24 by day sixteen there is a queue
    { at: 23, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="dawn" />
        <line x1={440} y1={520} x2={440} y2={1020} stroke="#c9b27a" strokeWidth={5} /><Bucket x={440} y={1050} s={0.9} tin={2} />
        <g opacity={ramp(c.lt, c.s(24), c.s(24) + 0.4)}>
          <g transform="translate(120 0)"><Person kind="kid" x={0} floor={1190} s={1.2} pose={POSE.idle(c.lt)} /><g transform="translate(30 1000)"><ellipse rx={20} ry={26} fill="#f4efe6" stroke={INK} strokeWidth={4} /><circle cx={0} cy={-34} r={14} fill="#f6e6c8" stroke={INK} strokeWidth={3} /></g></g>
          <Person kind="kid" x={230} floor={1190} s={1.15} pose={POSE.idle(c.lt + 1)} /><Person kind="kid" x={300} floor={1195} s={1.15} pose={POSE.idle(c.lt + 2)} /><Wheelbarrow x={375} floor={1195} s={0.8} />
          <Bike x={40} floor={1160} s={1.1} />
        </g>
        <Txt x={360} y={190} size={64} fill="#2a2220" ls={4} o={ramp(c.lt, 0.2, 0.6)}>DAY 16: A QUEUE</Txt>
      </g>
    ) },
    // 25-27 metal on metal at the staff entrance
    { at: 25, push: [1, 1.05], el: (c) => (
      <g><rect width={W} height={H} fill="#2a2c3a" /><Dark o={0.25} color="#07050f" />
        <LockPlate x={360} y={560} s={1.5} keyX={lerp(60, 130, tri(c.lt * 3) * ramp(c.lt, c.s(26) - 0.2, c.s(26))) + 80} jiggle={Math.sin(c.lt * 40) * 4 * ramp(c.lt, c.s(26), c.d)} />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={300 + rnd(i) * 120} y1={470 + rnd(i + 5) * 180} x2={340 + rnd(i + 2) * 120} y2={470 + rnd(i + 8) * 180} stroke="#ffe6a8" strokeWidth={3} opacity={Math.max(0, Math.sin(c.lt * 30 + i * 2)) * ramp(c.lt, c.s(26), c.d)} />)}
        <Txt x={360} y={190} size={70} fill="#7dffb0" ls={6} o={ramp(c.lt, 0.2, 0.6)}>9:00 PM</Txt>
        <Txt x={360} y={1100} size={52} fill="#f6f1e2" ls={4} o={ramp(c.lt, c.s(26), c.s(26) + 0.4)}>SCRAPE. SCRAPE.</Txt>
      </g>
    ) },
    // 28-30 it is Rhea, she works at it for an hour
    { at: 28, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#5a5668" floor="#3a3748" line={900} /><Dark o={0.25} color="#07050f" />
        <Door x={380} y={320} w={230} h={580} sign="STAFF" color="#6a7580" />
        <RheaDead x={290} floor={900} s={2.0} t={c.t} arm={1 + Math.sin(c.lt * 7)} />
        <g transform="translate(300 600)"><circle r={10} fill="#d9b04a" /></g>
        <g opacity={ramp(c.lt, c.s(29), c.s(29) + 0.5)}><rect x={80} y={1010} width={560} height={110} rx={14} fill="#2a2220" opacity={0.9} /><Txt x={360} y={1060} size={34} fill="#d9b04a" ls={3}>THE LOCK IS FULL OF</Txt><Txt x={360} y={1104} size={44} fill="#f6f1e2" ls={3}>YOUR BROKEN KEY</Txt></g>
        <g opacity={ramp(c.lt, c.s(30), c.s(30) + 0.4)}><Txt x={360} y={210} size={70} fill="#f6f1e2" stroke="#07050f" ls={3}>FOR AN HOUR</Txt></g>
      </g>
    ) },
    // 31-32 the next night she is back, never late
    { at: 31, push: [1, 1.05], el: (c) => {
      const n = Math.min(3, Math.floor(ramp(c.lt, 0.2, c.d - 0.4) * 4));
      return (
        <g><Interior wall="#5a5668" floor="#3a3748" line={900} /><Dark o={0.25} color="#07050f" />
          <Door x={380} y={320} w={230} h={580} sign="STAFF" color="#6a7580" />
          <RheaDead x={290} floor={900} s={2.0} t={c.t} arm={1 + Math.sin(c.lt * 7)} />
          <g transform="translate(360 190)"><rect x={-250} y={-76} width={500} height={150} rx={20} fill="#2a2220" opacity={0.9} /><Txt x={0} y={-16} size={34} fill="#d9b04a" ls={4}>{`NIGHT ${17 + n}`}</Txt><Txt x={0} y={44} size={60} fill="#7dffb0" ls={6}>9:00 PM</Txt></g>
          <Txt x={360} y={1090} size={64} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, c.s(32), c.s(32) + 0.4)}>NEVER LATE.</Txt>
        </g>
      );
    } },
    // 33-34 day twenty: a note in the bucket
    { at: 33, push: [1, 1.07], el: (c) => {
      const k = ease(ramp(c.lt, 0.2, c.d - 0.3));
      return (
        <g><LotSide tone="dawn" />
          <line x1={440} y1={520} x2={440} y2={lerp(1060, 600, k)} stroke="#c9b27a" strokeWidth={5} /><Bucket x={440} y={lerp(1090, 640, k)} s={1.1} />
          <g transform={`translate(440 ${lerp(1040, 590, k)}) rotate(-8)`}><rect x={-34} y={-70} width={68} height={86} fill="#f4ecd0" stroke={INK} strokeWidth={4} />{[-40, -26, -12, 2].map((ly) => <line key={ly} x1={-24} y1={ly} x2={24} y2={ly} stroke="#6f6f6f" strokeWidth={2.5} />)}</g>
          <Person kind="hero" x={400} floor={520} s={0.95} pose={{ ...POSE.pull(POSE.idle(c.lt)) }} />
          <Txt x={360} y={190} size={70} fill="#2a2220" ls={4} o={ramp(c.lt, 0.2, 0.6)}>DAY 20</Txt>
        </g>
      );
    } },
    // 35-38 the note itself
    { at: 35, card: true, el: (c) => {
      const lines: [number, string, string][] = [[35, 'The men with the truck', 'are done trading.'], [36, 'They are coming', 'tonight.'], [37, 'They want all', 'of it.'], [38, 'Please let us in.', '']];
      return (
        <g><rect width={W} height={H} fill="#8a6a4a" />
          <g transform="translate(360 640) rotate(-2)"><rect x={-310} y={-520} width={620} height={1040} fill="#f4ecd0" stroke={INK} strokeWidth={5} />
            {Array.from({ length: 15 }, (_, i) => <line key={i} x1={-290} y1={-440 + i * 66} x2={290} y2={-440 + i * 66} stroke="#b9c8d8" strokeWidth={3} />)}
            <line x1={-250} y1={-520} x2={-250} y2={520} stroke="#e0a0a0" strokeWidth={3} />
            {lines.map(([si, a, b], i) => <g key={i} opacity={ramp(c.lt, c.s(si), c.s(si) + 0.5)}><Txt x={-20} y={-380 + i * 220} size={i === 3 ? 62 : 50} fill="#4a4a50" ls={1}>{a}</Txt><Txt x={-20} y={-380 + i * 220 + 66} size={50} fill="#4a4a50" ls={1}>{b}</Txt></g>)}
          </g>
        </g>
      );
    } },
    // 39 house rule one says nobody comes in
    { at: 39, push: [1, 1.07], el: (c) => (
      <g><LotSide tone="night" />
        <Person kind="hero" x={540} floor={520} s={1.0} pose={{ ...POSE.idle(c.lt), head: 14, lean: 8 }} flip />
        {[0, 1, 2, 3].map((i) => <Stranger key={i} x={120 + i * 66} floor={1150} s={1.3} flip={false} />)}
        <g transform={`translate(360 240) rotate(-2) scale(${pop(ramp(c.lt, 0.2, 0.8))})`}><rect x={-270} y={-80} width={540} height={150} fill="#f4ecd0" stroke={INK} strokeWidth={5} /><Txt x={0} y={-24} size={36} fill="#c93a2e" ls={3}>HOUSE RULE ONE</Txt><Txt x={0} y={34} size={56}>NOBODY COMES IN</Txt></g>
      </g>
    ) },
  ],
  cues: [
    [0, 0.3, 'ding'], [1, 0.3, 'moan', 2], [2, 0.1, 'knock'], [2, 0.55, 'knock'], [2, 1.0, 'knock'], [2, 1.9, 'knock'], [2, 2.35, 'knock'], [2, 2.8, 'knock'],
    [4, 0.2, 'engine', 5], [5, 0.2, 'clunk'], [6, 0.2, 'surge'], [9, 0.1, 'slam'], [10, 0.4, 'ding'],
    [12, 0.4, 'rumble'], [12, 1.8, 'moan', 4], [15, 0.4, 'ding'], [16, 0.8, 'creak'], [17, 0.3, 'clink'], [19, 0.2, 'ding'],
    [22, 0.4, 'ding'], [24, 0.2, 'steps', 3], [25, 0.2, 'scratch', 3], [26, 0.1, 'scratch', 3], [28, 0.2, 'scratch', 3], [28, 3, 'moan', 3], [31, 0.2, 'scratch', 3],
    [33, 0.4, 'ratchet', 2], [35, 0.2, 'sting'],
  ],
};
void CardBg; void Dead; void PAL; void H; void W; void lerp; void clamp;
