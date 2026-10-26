/** Chapter 4: Forty Seconds. Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../../engine.tsx';
import { AisleSign, Bar, CardBg, Car, Clock, Dark, INK, Interior, Note, Pallet, Person, POSE, ProblemCard, ShelfRow, Shopcart, Sky, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../../lib.tsx';
import { LotSide, Mob } from '../../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Waves: React.FC<{ x: number; y: number; t: number; n?: number; max?: number; color?: string; o?: number }> = ({ x, y, t, n = 4, max = 420, color = '#ffe6a8', o = 1 }) => (
  <g>{Array.from({ length: n }, (_, k) => { const r = (t * 0.9 + k / n) % 1; return <circle key={k} cx={x} cy={y} r={20 + r * max} fill="none" stroke={color} strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * o} />; })}</g>
);

export const ch: Chapter = {
  n: 4, label: 'FORTY SECONDS',
  scenes: [
    // 0-1 run to the grey box with the red handle
    { at: 0, push: [1, 1.05], el: (c) => {
      const scroll = c.lt * 520;
      const box = lerp(1100, 560, ease(ramp(c.lt, 0, c.d - 0.3)));
      return (
        <g><Interior wall="#b9ae8c" line={900} />
          {Array.from({ length: 6 }, (_, i) => { const px = ((i * 300 - scroll * 0.6) % 1800 + 1800) % 1800 - 200; return <g key={i}><rect x={px} y={260} width={150} height={640} fill="#a39a7c" stroke={INK} strokeWidth={4} /><rect x={px + 30} y={330} width={90} height={150} fill="#d9d4c0" stroke={INK} strokeWidth={3} /></g>; })}
          <g transform={`translate(${box} 560)`}><rect x={-80} y={-130} width={160} height={250} rx={8} fill="#7d838b" stroke={INK} strokeWidth={6} /><rect x={-60} y={-100} width={120} height={150} fill="#5d6772" stroke={INK} strokeWidth={4} /><rect x={-10} y={-70} width={20} height={80} rx={6} fill="#c93a2e" stroke={INK} strokeWidth={4} /><circle cx={0} cy={-84} r={12} fill="#c93a2e" stroke={INK} strokeWidth={4} /></g>
          {hero(200, 1030, 1.9, c.lt < c.d - 0.5 ? POSE.run(c.lt, 1.6) : POSE.push(POSE.idle()))}
          <Txt x={360} y={190} size={50} fill="#2a2220" ls={4} o={ramp(c.lt, 0.2, 0.7)}>GREY BOX · RED HANDLE</Txt>
        </g>
      );
    } },
    // 2 thirty-five seconds of light, then dark, then silence
    { at: 2, card: true, el: (c) => (
      <g><rect width={W} height={H} fill="#10101c" />
        {[['LIGHT', '#f5d86a', 520, '#2a2220', 35], ['DARK', '#2a3150', 700, '#a8b4d8', 0], ['SILENCE', '#05050a', 880, '#6a6a7a', 0]].map(([lab, col, y, tc], i) => {
          const a = pop(ramp(c.lt, 0.15 + i * 0.7, 0.6 + i * 0.7));
          return <g key={i} opacity={clamp(a * 3)} transform={`translate(${(1 - a) * -300} 0)`}><rect x={70} y={(y as number) - 90} width={580} height={150} rx={24} fill={col as string} stroke="#8a8aa0" strokeWidth={4} /><Txt x={360} y={(y as number) + 18} size={92} fill={tc as string} ls={6}>{lab as string}</Txt></g>;
        })}
        <g opacity={ramp(c.lt, 0.4, 0.9)}><Txt x={360} y={250} size={120} fill="#f5d86a" ls={4}>35 SEC</Txt></g>
      </g>
    ) },
    // 3 brightest, loudest building in town
    { at: 3, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="night" lit shutter={1} />
        <rect x={370} y={500} width={380} height={420} fill="#fff6c8" opacity={0.18 + 0.1 * Math.sin(c.lt * 10)} />
        <Waves x={555} y={760} t={c.lt} max={520} />
        <Waves x={555} y={760} t={c.lt + 0.45} max={520} color="#ffffff" o={0.5} />
        <Mob n={50} t={c.t} seed={21} face="right" shown={ramp(c.lt, 0.3, 1.6)} />
        <Txt x={360} y={190} size={64} fill="#fff6c8" ls={4} stroke="#07050f" o={ramp(c.lt, 0.2, 0.6)}>BRIGHTEST. LOUDEST.</Txt>
      </g>
    ) },
    // 4 house rule: the breaker stays off
    { at: 4, push: [1, 1.05], el: (c) => {
      const flip = ease(ramp(c.lt, 0.3, 0.8));
      return (
        <g><Interior wall="#b9ae8c" line={900} />
          <rect x={150} y={230} width={420} height={560} rx={16} fill="#7d838b" stroke={INK} strokeWidth={7} />
          <rect x={190} y={290} width={340} height={430} fill="#4b5560" stroke={INK} strokeWidth={5} />
          <rect x={332} y={330} width={56} height={340} rx={12} fill="#2a2e34" stroke={INK} strokeWidth={4} />
          <g transform={`translate(360 ${lerp(380, 620, flip)})`}><rect x={-34} y={-44} width={68} height={88} rx={14} fill="#c93a2e" stroke={INK} strokeWidth={5} /></g>
          <Txt x={360} y={268} size={34} fill="#f6f1e2" ls={4}>MAIN</Txt>
          <Txt x={560} y={350} size={42} fill="#4aa86a" o={1 - flip}>ON</Txt><Txt x={560} y={690} size={42} fill="#c93a2e" o={flip}>OFF</Txt>
          <g opacity={ramp(c.lt, 1.0, 1.4)} transform={`translate(360 900) rotate(-3) scale(${pop(ramp(c.lt, 1.0, 1.5))})`}><rect x={-250} y={-60} width={500} height={120} fill="#f4ecd0" stroke={INK} strokeWidth={4} /><Txt x={0} y={-14} size={34}>HOUSE RULE:</Txt><Txt x={0} y={32} size={46} fill="#c93a2e">BREAKER STAYS OFF</Txt></g>
          {hero(100, 1060, 1.5, POSE.push(POSE.idle(c.lt)))}
        </g>
      );
    } },
    // 5-7 too late, they are not leaning, they are pushing
    { at: 5, push: [1, 1.07], el: (c) => {
      const push = ramp(c.lt, c.s(7), c.s(7) + 0.5);
      const shake = push * Math.sin(c.lt * 38) * 4;
      return (
        <g><LotSide tone="night" /><g transform={`translate(${shake} 0)`}><Mob n={86} t={c.t} seed={31} x0={90} x1={400} f0={920} f1={1190} face="right" still={false} /></g>
          <g opacity={ramp(c.lt, 0.1, 0.4)}><Txt x={360} y={190} size={64} fill="#f6f1e2" ls={4} stroke="#07050f">TOO LATE.</Txt></g>
          {c.lt > c.s(6) && c.lt < c.s(7) + 0.3 && <g opacity={ramp(c.lt, c.s(6), c.s(6) + 0.3)}><Txt x={360} y={290} size={56} fill="#d9b04a" stroke="#07050f" ls={3}>NOT LEANING</Txt></g>}
          {c.lt > c.s(7) && <g transform={`translate(360 290) scale(${pop(ramp(c.lt, c.s(7), c.s(7) + 0.4))})`}><Txt x={0} y={0} size={104} fill="#e5361d" stroke="#2a0608">PUSHING!</Txt></g>}
        </g>
      );
    } },
    // 8 problem three
    { at: 8, card: true, el: (c) => <ProblemCard n="THREE" title="THE SHUTTER" c={c} icon={<g><rect x={-130} y={-96} width={260} height={50} fill="#4d5560" stroke={INK} strokeWidth={6} />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={-120} y={-44 + i * 18} width={240} height={14} fill="#8e99a6" stroke={INK} strokeWidth={3} />)}</g>} /> },
    // 9-10 built for one man with a crowbar, not 250
    { at: 9, card: true, el: (c) => (
      <g><CardBg />
        <Txt x={360} y={190} size={54} ls={4}>BUILT TO STOP:</Txt>
        <g transform={`translate(0 ${(1 - ramp(c.lt, 0.1, 0.5)) * 40})`} opacity={ramp(c.lt, 0.1, 0.5)}>
          <rect x={60} y={260} width={600} height={290} rx={20} fill="#f4f8f1" stroke={INK} strokeWidth={5} />
          <Person kind="kid" x={190} floor={520} s={1.4} pose={{ ...POSE.idle(), lU: 140, lF: 120 }} hold={<g transform="rotate(-20)"><rect x={-3} y={-60} width={8} height={70} fill="#3a3f48" stroke={INK} strokeWidth={2} /></g>} />
          <Txt x={440} y={380} size={50} anchor="middle">1 MAN</Txt><Txt x={440} y={440} size={34} fill="#6f7f6a">+ 1 CROWBAR</Txt>
          <g transform="translate(590 340) scale(0)"><circle r={1} /></g>
          <g transform={`translate(590 400) scale(${pop(ramp(c.lt, 0.7, 1.2))})`}><circle r={44} fill="#4aa86a" stroke={INK} strokeWidth={5} /><path d="M -20 2 l 14 16 l 28 -34" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" /></g>
        </g>
        <g opacity={ramp(c.lt, c.s(10), c.s(10) + 0.4)} transform={`translate(0 ${(1 - ramp(c.lt, c.s(10), c.s(10) + 0.5)) * 40})`}>
          <rect x={60} y={620} width={600} height={330} rx={20} fill="#f4f8f1" stroke={INK} strokeWidth={5} />
          {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={100 + (i % 8) * 38} cy={680 + Math.floor(i / 8) * 40} r={13} fill="#b8c4b3" stroke={INK} strokeWidth={3} />)}
          <Txt x={360} y={870} size={64} fill="#c93a2e">250 PEOPLE</Txt>
          <g transform={`translate(590 780) scale(${pop(ramp(c.lt, c.s(10) + 0.5, c.s(10) + 1.0))})`}><circle r={44} fill="#c93a2e" stroke={INK} strokeWidth={5} /><path d="M -18 -18 l 36 36 M 18 -18 l -36 36" stroke="#fff" strokeWidth={10} strokeLinecap="round" /></g>
        </g>
      </g>
    ) },
    // 11 by midnight the steel bows
    { at: 11, push: [1, 1.05], el: (c) => {
      const bow = ramp(c.lt, 0.2, c.d - 0.2) * 90;
      return (
        <g><Interior wall="#bfb394" line={920} />
          <g transform={`translate(${Math.sin(c.lt * 31) * 2.5} 0)`}>
            <rect x={20} y={200} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} />
            <path d={`M 40 310 L 680 310 Q ${680 + bow} 600 680 900 L 40 900 Q ${40 - bow} 600 40 310 Z`} fill="#8e99a6" stroke={INK} strokeWidth={5} />
            {Array.from({ length: 40 }, (_, i) => <line key={i} x1={44} y1={326 + i * 14} x2={676} y2={326 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
            {[0.3, 0.5, 0.7].map((f, i) => <path key={i} d={`M ${120 + i * 200} 380 Q ${160 + i * 200 + bow * 0.4} ${520 + i * 40} ${120 + i * 200} 780`} fill="none" stroke="#3a424b" strokeWidth={5} opacity={f + 0.3} />)}
          </g>
          <Clock x={620} y={110} s={0.9} hour={11.9} min={50 + ramp(c.lt, 0, c.d) * 10} t={c.lt} />
          <Txt x={360} y={1000} size={64} fill="#c93a2e" ls={4} o={ramp(c.lt, 0.5, 1.0)}>BY MIDNIGHT</Txt>
        </g>
      );
    } },
    // 12-13 a second wall of water pallets
    { at: 12, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} />
        <rect x={20} y={180} width={680} height={100} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={40} y={280} width={640} height={620} fill="#8e99a6" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 31 }, (_, i) => <line key={i} x1={40} y1={296 + i * 20} x2={680} y2={296 + i * 20} stroke="#5d6772" strokeWidth={3} />)}
        {Array.from({ length: 6 }, (_, i) => { const a = pop(ramp(c.lt, c.s(13) + i * 0.3, c.s(13) + 0.35 + i * 0.3)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -260})`}><Pallet x={130 + (i % 3) * 230} floor={900 - Math.floor(i / 3) * 0} s={1.2} color="#6bb6e8" /></g>; })}
        {hero(60, 1070, 1.6, POSE.push(POSE.walk(c.lt, 1.2, 10)))}
        <g opacity={ramp(c.lt, c.s(13) + 1.4, c.s(13) + 1.9)}><Txt x={360} y={1090} size={60} fill="#2f7fb8" ls={3}>A TON EACH</Txt></g>
      </g>
    ) },
    // 14-15 carts, nested and chained, thirty to a row
    { at: 14, push: [1, 1.05], el: (c) => {
      const n = Math.floor(ramp(c.lt, 0.2, c.s(15)) * 12) + 1;
      const car = pop(ramp(c.lt, c.s(15) + 0.2, c.s(15) + 0.8));
      return (
        <g><Interior wall="#bfb394" line={900} />
          {Array.from({ length: n }, (_, i) => <Shopcart key={i} x={60 + i * 34} y={1000} s={1.5} />)}
          <path d={`M 40 ${930} Q 200 ${1000} 400 ${930}`} fill="none" stroke="#3a3f48" strokeWidth={8} strokeDasharray="18 8" strokeLinecap="round" opacity={ramp(c.lt, 1.0, 1.6)} />
          <g transform="translate(360 330)"><rect x={-210} y={-70} width={420} height={110} rx={16} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-18} size={34} fill="#6f7f6a" ls={3}>NESTED + CHAINED</Txt><Txt x={0} y={28} size={54} fill="#c93a2e">30 CARTS / ROW</Txt></g>
          <g opacity={car} transform={`translate(520 ${700 - car * 20}) scale(${0.8 * car + 0.2})`}><Car x={0} floor={0} s={1} color="#8a8f93" /><Txt x={0} y={-150} size={44} fill="#c93a2e">= 1 SMALL CAR</Txt></g>
        </g>
      );
    } },
    // 16-17 a wall only buys time, you need them gone
    { at: 16, card: true, el: (c) => {
      const sand = ramp(c.lt, 0.2, c.s(17) + 1.0);
      return (
        <g><CardBg />
          <Txt x={360} y={180} size={56} ls={3}>A WALL ONLY</Txt><Txt x={360} y={248} size={56} ls={3}>BUYS TIME.</Txt>
          <g transform="translate(360 640)"><path d="M -120 -200 L 120 -200 L 120 -170 Q 120 -90 22 -10 Q 120 70 120 150 L 120 200 L -120 200 L -120 150 Q -120 70 -22 -10 Q -120 -90 -120 -170 Z" fill="#f4f8f1" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
            <path d={`M -100 ${-170 + sand * 120} L 100 ${-170 + sand * 120} L 100 -150 Q 100 -90 12 -10 L -12 -10 Q -100 -90 -100 -150 Z`} fill="#d9b04a" opacity={1 - sand * 0.9} />
            <line x1={0} y1={-10} x2={0} y2={190} stroke="#d9b04a" strokeWidth={6} opacity={1 - ramp(sand, 0.9, 1)} />
            <path d={`M -100 ${190 - sand * 120} Q 0 ${150 - sand * 130} 100 ${190 - sand * 120} L 100 190 L -100 190 Z`} fill="#d9b04a" />
            <rect x={-140} y={-224} width={280} height={24} rx={8} fill="#8a5a36" stroke={INK} strokeWidth={5} /><rect x={-140} y={200} width={280} height={24} rx={8} fill="#8a5a36" stroke={INK} strokeWidth={5} /></g>
          <g opacity={ramp(c.lt, c.s(17), c.s(17) + 0.5)}><Txt x={360} y={1000} size={72} fill="#c93a2e" ls={3}>THEY MUST LEAVE.</Txt></g>
        </g>
      );
    } },
    // 18 aisle 9, alarm clocks with two bells
    { at: 18, push: [1, 1.05], el: (c) => (
      <g><Interior line={900} />
        {[0, 1, 2].map((r) => <ShelfRow key={r} x={-20} y={230 + r * 220} w={760} h={120} seed={r + 70} />)}
        <AisleSign x={360} y={60} n="9" label="ALARM CLOCKS" sub="LOUD ONES" s={1.2} />
        {[0, 1, 2].map((r) => Array.from({ length: 6 }, (_, i) => <Clock key={`${r}${i}`} x={80 + i * 112} y={296 + r * 220 - 4} s={0.42} hour={(i + r * 2) % 12} min={(i * 13) % 60} />))}
        <g transform={`translate(360 ${860}) scale(${pop(ramp(c.lt, 0.6, 1.3)) * 1.7})`} opacity={ramp(c.lt, 0.5, 0.9)}><Clock x={0} y={0} t={c.lt} ring={ramp(c.lt, 1.2, 1.6)} hour={6} min={0} /></g>
        <Txt x={360} y={1160} size={46} fill="#c93a2e" ls={3} o={ramp(c.lt, 1.2, 1.7)}>TWO BELLS</Txt>
      </g>
    ) },
    // 19 set for noon
    { at: 19, card: true, el: (c) => {
      const k = ease(ramp(c.lt, 0.4, c.d - 0.5));
      return (
        <g><CardBg /><Txt x={360} y={200} size={56} ls={4} fill="#6f7f6a">SET FOR</Txt>
          <g transform="translate(360 600) scale(3.6)"><Clock x={0} y={0} hour={lerp(8, 12, k)} min={lerp(40, 0, k)} /></g>
          <g transform={`translate(360 1010) scale(${pop(ramp(c.lt, c.d - 0.9, c.d - 0.4))})`}><rect x={-170} y={-64} width={340} height={100} rx={16} fill="#2a2220" /><Txt x={0} y={22} size={80} fill="#7dffb0" ls={6}>12:00</Txt></g>
        </g>
      );
    } },
    // 20 hurl it off the back of the roof
    { at: 20, push: [1, 1.05], el: (c) => {
      const k = ramp(c.lt, 0.7, c.d - 0.2);
      const x = lerp(520, 70, k), y = 500 + 900 * k * k - 540 * k * (1 - k) * 2.2 - 0;
      return (
        <g><LotSide tone="night" />
          <Person kind="hero" x={560} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: lerp(150, 60, ramp(c.lt, 0.3, 0.8)), lF: lerp(160, 80, ramp(c.lt, 0.3, 0.8)) }} flip />
          <g transform={`translate(${x} ${Math.min(y, 1180)}) rotate(${k * 900}) scale(0.5)`} opacity={ramp(c.lt, 0.6, 0.8)}><Clock x={0} y={0} /></g>
          {k > 0.97 && <Waves x={70} y={1160} t={c.lt} n={2} max={120} />}
        </g>
      );
    } },
    // 21 at noon it rings and 250 heads swing away
    { at: 21, push: [1, 1.05], el: (c) => {
      const turn = c.lt > c.s(21) + 1.0;
      const drift = ramp(c.lt, c.s(21) + 1.2, c.d) * 160;
      return (
        <g><LotSide tone="day" sun={0.5} />
          <g transform={`translate(${-drift} 0)`}><Mob n={86} t={c.t} seed={31} x0={90} x1={400} f0={920} f1={1190} face={turn ? 'left' : 'right'} still={!turn} /></g>
          <g transform="translate(60 1170) scale(1.1)"><Clock x={0} y={0} t={c.lt} ring={1} hour={12} min={0} /></g>
          <Waves x={60} y={1150} t={c.lt * 1.4} n={5} max={600} color="#d9462a" />
          <Txt x={360} y={190} size={80} fill="#2a2220" ls={4} o={ramp(c.lt, 0.1, 0.5)}>NOON</Txt>
          <g opacity={ramp(c.lt, c.s(21) + 0.8, c.s(21) + 1.2)}><Txt x={360} y={300} size={52} fill="#c93a2e" ls={3}>250 HEADS TURN AWAY</Txt></g>
        </g>
      );
    } },
  ],
  cues: [
    [0, 0, 'run', 4.2], [0, 4.1, 'clunk'], [2, 0.1, 'surge'], [2, 0.8, 'powerdown'], [3, 0.1, 'music', 7], [3, 0.2, 'sting'],
    [4, 0.35, 'clunk'], [4, 0.4, 'powerdown'], [5, 0.0, 'moan', 6], [7, 0.4, 'slam'], [7, 0.9, 'slam'], [7, 1.4, 'slam'], [8, 0.1, 'slam'],
    [10, 0.9, 'click'], [11, 0.2, 'rumble'], [13, 0.2, 'thud'], [13, 0.6, 'thud'], [13, 0.95, 'thud'], [13, 1.3, 'thud'], [13, 1.6, 'thud'],
    [14, 0.3, 'clink'], [14, 0.6, 'clink'], [14, 0.9, 'clink'], [14, 1.2, 'clink'], [15, 0.3, 'thud'], [16, 0.1, 'click'],
    [18, 1.3, 'alarm', 1.2], [19, 0.6, 'ratchet', 2.0], [19, 3.0, 'ding'], [20, 0.9, 'whoosh'], [20, 2.6, 'thud'],
    [21, 0.1, 'alarm', 4.0], [21, 1.0, 'moan', 3],
  ],
};
void Dark; void Note; void Sky; void rnd; void tri; void lerp; void H;
