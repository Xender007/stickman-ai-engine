/** Chapter 4: Forty Seconds (script v3). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Bar, CardBg, Car, Dark, Door, Interior, INK, Keyy, Pallet, Person, POSE, ProblemCard, Shopcart, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../lib.tsx';
import { LotSide, Mob } from '../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Waves: React.FC<{ x: number; y: number; t: number; n?: number; max?: number; color?: string; o?: number }> = ({ x, y, t, n = 4, max = 420, color = '#ffe6a8', o = 1 }) => (
  <g>{Array.from({ length: n }, (_, k) => { const r = (t * 0.9 + k / n) % 1; return <circle key={k} cx={x} cy={y} r={20 + r * max} fill="none" stroke={color} strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * o} />; })}</g>
);
const Breaker: React.FC<{ x: number; y: number; s?: number; down: number }> = ({ x, y, s = 1, down }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-210} y={-280} width={420} height={560} rx={16} fill="#7d838b" stroke={INK} strokeWidth={7} /><rect x={-170} y={-220} width={340} height={430} fill="#4b5560" stroke={INK} strokeWidth={5} /><rect x={-28} y={-190} width={56} height={340} rx={12} fill="#2a2e34" stroke={INK} strokeWidth={4} />
    <g transform={`translate(0 ${lerp(-110, 90, down)})`}><rect x={-34} y={-44} width={68} height={88} rx={14} fill="#c93a2e" stroke={INK} strokeWidth={5} /></g><Txt x={0} y={-244} size={34} fill="#f6f1e2" ls={4}>MAIN</Txt></g>
);
const Locker: React.FC<{ x: number; y: number; n: number; open?: number; hi?: boolean }> = ({ x, y, n, open = 0, hi }) => (
  <g><rect x={x} y={y} width={110} height={420} fill={hi ? '#4aa0d8' : '#6a7a8a'} stroke={INK} strokeWidth={5} />{open > 0 && <rect x={x + 8} y={y + 8} width={94} height={404} fill="#1b1d22" />}
    <g transform={`translate(${x} ${y}) `}><polygon points={`0,0 ${110 - open * 90},${open * 22} ${110 - open * 90},${420 - open * 22} 0,420`} fill={hi ? '#4aa0d8' : '#6a7a8a'} stroke={INK} strokeWidth={5} opacity={open > 0 ? 0.95 : 0} /></g>
    {open === 0 && <g><rect x={x + 30} y={y + 40} width={50} height={16} fill="#2a2e34" /><circle cx={x + 55} cy={y + 270} r={9} fill="#d9d4c0" stroke={INK} strokeWidth={3} /><rect x={x + 30} y={y + 330} width={50} height={36} rx={4} fill="#f6f1e2" stroke={INK} strokeWidth={3} /><Txt x={x + 55} y={y + 360} size={26} fill={INK}>{String(n)}</Txt></g>}
  </g>
);

export const ch: Chapter = {
  n: 4, label: 'FORTY SECONDS',
  scenes: [
    // 0 the main breaker is seventy yards away
    { at: 0, card: true, el: (c) => {
      const k = ramp(c.lt, 0.5, c.d - 0.3);
      return (
        <g><rect width={W} height={H} fill="#1f3b5c" />{Array.from({ length: 18 }, (_, i) => <line key={i} x1={0} y1={i * 72} x2={W} y2={i * 72} stroke="#2f527a" strokeWidth={2} />)}{Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 72} y1={0} x2={i * 72} y2={H} stroke="#2f527a" strokeWidth={2} />)}
          <rect x={90} y={250} width={540} height={740} fill="none" stroke="#cfe3ee" strokeWidth={6} />{[0, 1, 2, 3].map((i) => <rect key={i} x={160 + i * 110} y={420} width={50} height={440} fill="none" stroke="#7fa6c8" strokeWidth={3} />)}
          <rect x={90} y={940} width={250} height={50} fill="#4aa86a" opacity={0.6} /><Txt x={215} y={976} size={28} fill="#fff" ls={2}>FRONT DOORS</Txt><rect x={440} y={250} width={190} height={130} fill="#c93a2e" opacity={0.35} stroke="#cfe3ee" strokeWidth={4} /><Txt x={535} y={300} size={26} fill="#fff" ls={1}>BACK OFFICE</Txt><Txt x={535} y={340} size={26} fill="#ffe6a8" ls={1}>MAIN BREAKER</Txt>
          <circle cx={215} cy={880} r={18} fill="#d9b04a" stroke="#fff" strokeWidth={4} /><Txt x={215} y={850} size={26} fill="#fff" ls={1}>YOU</Txt><path d="M 215 880 L 215 520 L 535 400" fill="none" stroke="#ffe6a8" strokeWidth={8} strokeDasharray="22 16" strokeLinecap="round" opacity={k} />
          <g opacity={ramp(c.lt, 0.6, 1.1)}><Txt x={360} y={230} size={80} fill="#ffe6a8" ls={4}>70 YARDS</Txt></g>
        </g>
      );
    } },
    // 1 you run it faster than you have ever run anything
    { at: 1, push: [1, 1.05], el: (c) => {
      const scroll = c.lt * 560, box = lerp(1100, 560, ease(ramp(c.lt, 0, c.d - 0.2)));
      return (
        <g><Interior wall="#b9ae8c" line={900} />
          {Array.from({ length: 6 }, (_, i) => { const px = ((i * 300 - scroll * 0.6) % 1800 + 1800) % 1800 - 200; return <g key={i}><rect x={px} y={260} width={150} height={640} fill="#a39a7c" stroke={INK} strokeWidth={4} /><rect x={px + 30} y={330} width={90} height={150} fill="#d9d4c0" stroke={INK} strokeWidth={3} /></g>; })}
          <Breaker x={box} y={560} s={0.5} down={0} />{hero(200, 1030, 1.9, POSE.run(c.lt, 1.7))}
        </g>
      );
    } },
    // 2-3 ten steps short, the lights die: 35 seconds of light, then darkness, then silence
    { at: 2, push: [1, 1.05], el: (c) => {
      const die = ramp(c.lt, c.s(2) + 1.8, c.s(2) + 1.95);
      const secs = Math.round(35 * ramp(c.lt, c.s(3), c.e(3)));
      return (
        <g><Interior wall="#b9ae8c" line={900} />{Array.from({ length: 5 }, (_, i) => <rect key={i} x={40 + i * 140} y={120} width={100} height={24} fill="#fff6c8" stroke={INK} strokeWidth={3} />)}
          <Breaker x={560} y={560} s={0.5} down={0} />{hero(300, 1030, 1.9, c.lt < c.s(2) + 1.8 ? POSE.run(c.lt, 1.7) : { ...POSE.idle(c.lt), head: 8 })}<Dark o={die * 0.92} />
          <g transform="translate(360 260)"><rect x={-160} y={-60} width={320} height={110} rx={18} fill="#2a2220" opacity={0.92} /><Txt x={0} y={30} size={74} fill={die ? '#c93a2e' : '#7dffb0'} ls={4}>{`${secs}s`}</Txt></g>
          <g opacity={ramp(c.lt, c.s(3) + 1.2, c.s(3) + 1.6)}><Txt x={360} y={1000} size={64} fill="#f6f1e2" ls={5} stroke="#07050f">LIGHT. DARK. SILENCE.</Txt></g>
        </g>
      );
    } },
    // 4-5 you did not touch the breaker: somebody else did
    { at: 4, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#b9ae8c" line={900} /><Dark o={0.5} color="#07050f" /><Breaker x={360} y={520} s={0.9} down={ease(ramp(c.lt, 0.2, 0.7))} />
        {hero(110, 1060, 1.5, POSE.idle(c.lt))}
        <g opacity={ramp(c.lt, c.s(5), c.s(5) + 0.4)}><g transform={`translate(${lerp(640, 760, ramp(c.lt, c.s(5) + 0.2, c.d))} 960)`} style={{ filter: 'brightness(0)' }}><Person kind="kid" x={0} floor={0} s={1.7} pose={POSE.walk(c.lt, 1.2, 8)} flip={false} /></g><Txt x={360} y={1190} size={60} fill="#d9462a" ls={3} stroke="#07050f">SOMEBODY ELSE DID.</Txt></g>
      </g>
    ) },
    // 6-7 day ten: you open Rhea's envelope on the office floor
    { at: 6, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#a89c86" line={900} /><Dark o={0.45} color="#07050f" />
        <g transform="translate(560 230)"><rect x={-110} y={-70} width={220} height={150} rx={10} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><rect x={-110} y={-70} width={220} height={40} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={-40} size={28} fill="#fff" ls={3}>DAY</Txt><Txt x={0} y={52} size={80}>{c.lt > c.s(7) ? '10' : '9'}</Txt></g>
        {hero(250, 1010, 1.8, POSE.sit())}
        <g transform={`translate(430 ${860 - ramp(c.lt, 0.2, 0.8) * 20}) rotate(-8)`}><rect x={-90} y={-60} width={180} height={120} fill="#efe2bd" stroke={INK} strokeWidth={5} /><path d="M -90 -60 L 0 10 L 90 -60" fill="none" stroke={INK} strokeWidth={4} /><circle cx={0} cy={6} r={18} fill={c.lt > c.s(7) ? 'none' : '#c93a2e'} stroke={INK} strokeWidth={3} /></g>
        <Txt x={360} y={1160} size={52} fill="#f6f1e2" ls={4} stroke="#07050f" o={ramp(c.lt, c.s(7), c.s(7) + 0.4)}>NOT BEFORE. NOW.</Txt>
      </g>
    ) },
    // 8-9 no letter: a floor plan with a tunnel under the freezer circled
    { at: 8, card: true, el: (c) => {
      const k = ramp(c.lt, c.s(9), c.s(9) + 1.2);
      return (
        <g><rect width={W} height={H} fill="#1f3b5c" />{Array.from({ length: 18 }, (_, i) => <line key={i} x1={0} y1={i * 72} x2={W} y2={i * 72} stroke="#2f527a" strokeWidth={2} />)}{Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 72} y1={0} x2={i * 72} y2={H} stroke="#2f527a" strokeWidth={2} />)}
          <rect x={90} y={250} width={540} height={560} fill="none" stroke="#cfe3ee" strokeWidth={6} />{[0, 1, 2].map((i) => <rect key={i} x={140 + i * 110} y={320} width={50} height={340} fill="none" stroke="#7fa6c8" strokeWidth={3} />)}
          <rect x={440} y={280} width={170} height={240} fill="#9fd0e8" opacity={0.3} stroke="#cfe3ee" strokeWidth={4} /><Txt x={525} y={410} size={30} fill="#fff" ls={2}>FREEZER</Txt>
          <path d="M 525 520 L 525 900 L 180 900" fill="none" stroke="#ffe6a8" strokeWidth={7} strokeDasharray="20 14" opacity={k} /><Txt x={360} y={960} size={36} fill="#ffe6a8" ls={3} o={k}>SERVICE TUNNEL</Txt>
          <ellipse cx={525} cy={410} rx={110} ry={160} fill="none" stroke="#e5361d" strokeWidth={9} strokeDasharray="640" strokeDashoffset={640 * (1 - k)} />
          <Txt x={360} y={170} size={60} fill="#cfe3ee" ls={5} o={ramp(c.lt, 0.2, 0.6)}>NO LETTER.</Txt>
        </g>
      );
    } },
    // 10 one line in her handwriting
    { at: 10, card: true, el: (c) => (
      <g><rect width={W} height={H} fill="#8a6a4a" /><g transform="translate(360 640) rotate(-2)"><rect x={-300} y={-300} width={600} height={600} fill="#f4ecd0" stroke={INK} strokeWidth={5} />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={-280} y1={-220 + i * 70} x2={280} y2={-220 + i * 70} stroke="#b9c8d8" strokeWidth={3} />)}
        {['DO NOT LET', 'THEM HEAR', 'THE COLD.'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(10) + 0.3 + i * 0.5, c.s(10) + 0.7 + i * 0.5)}><Txt x={0} y={-120 + i * 110} size={70} fill="#4a4a50" ls={2} rot={-1 + i}>{l}</Txt></g>)}</g></g>
    ) },
    // 11-12 you do not understand it yet, but you understand the crowd
    { at: 11, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="night" /><Mob n={86} t={c.t} seed={31} x0={90} x1={400} f0={920} f1={1190} face="right" />
        <Person kind="hero" x={540} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), head: 10 }} flip />
        <g transform={`translate(560 330) scale(${pop(ramp(c.lt, 0.3, 0.8))})`}><Txt x={0} y={0} size={110} fill="#d9b04a" stroke="#07050f">?</Txt></g>
        <Txt x={360} y={190} size={56} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, c.s(12), c.s(12) + 0.4)}>THE CROWD IS CLEAR.</Txt>
      </g>
    ) },
    // 13-14 they are not leaning any more, they are pushing
    { at: 13, push: [1, 1.07], el: (c) => {
      const push = ramp(c.lt, c.s(14), c.s(14) + 0.5), shake = push * Math.sin(c.lt * 38) * 4;
      return (
        <g><LotSide tone="night" /><g transform={`translate(${shake} 0)`}><Mob n={86} t={c.t} seed={31} x0={90} x1={400} f0={920} f1={1190} face="right" still={false} /></g>
          {c.lt < c.s(14) && <Txt x={360} y={190} size={56} fill="#d9b04a" stroke="#07050f" ls={3}>NOT LEANING</Txt>}
          {c.lt > c.s(14) && <g transform={`translate(360 290) scale(${pop(ramp(c.lt, c.s(14), c.s(14) + 0.4))})`}><Txt x={0} y={0} size={104} fill="#e5361d" stroke="#2a0608">PUSHING!</Txt></g>}
        </g>
      );
    } },
    // 15 problem three
    { at: 15, card: true, el: (c) => <ProblemCard n="THREE" title="THE SHUTTER" c={c} icon={<g><rect x={-130} y={-96} width={260} height={50} fill="#4d5560" stroke={INK} strokeWidth={6} />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={-120} y={-44 + i * 18} width={240} height={14} fill="#8e99a6" stroke={INK} strokeWidth={3} />)}</g>} /> },
    // 16-17 built for one man with a crowbar, not 250
    { at: 16, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={190} size={54} ls={4}>BUILT TO STOP:</Txt>
        <g opacity={ramp(c.lt, 0.1, 0.5)}><rect x={60} y={260} width={600} height={290} rx={20} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><Person kind="kid" x={190} floor={520} s={1.4} pose={{ ...POSE.idle(), lU: 140, lF: 120 }} hold={<g transform="rotate(-20)"><rect x={-3} y={-60} width={8} height={70} fill="#3a3f48" stroke={INK} strokeWidth={2} /></g>} /><Txt x={440} y={380} size={50}>1 MAN</Txt><Txt x={440} y={440} size={34} fill="#6f7f6a">+ 1 CROWBAR</Txt><g transform={`translate(590 400) scale(${pop(ramp(c.lt, 0.7, 1.2))})`}><circle r={44} fill="#4aa86a" stroke={INK} strokeWidth={5} /><path d="M -20 2 l 14 16 l 28 -34" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" /></g></g>
        <g opacity={ramp(c.lt, c.s(17), c.s(17) + 0.4)}><rect x={60} y={620} width={600} height={330} rx={20} fill="#f4f8f1" stroke={INK} strokeWidth={5} />{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={100 + (i % 8) * 38} cy={680 + Math.floor(i / 8) * 40} r={13} fill="#b8c4b3" stroke={INK} strokeWidth={3} />)}<Txt x={360} y={870} size={64} fill="#c93a2e">250 PEOPLE</Txt><g transform={`translate(590 780) scale(${pop(ramp(c.lt, c.s(17) + 0.5, c.s(17) + 1.0))})`}><circle r={44} fill="#c93a2e" stroke={INK} strokeWidth={5} /><path d="M -18 -18 l 36 36 M 18 -18 l -36 36" stroke="#fff" strokeWidth={10} strokeLinecap="round" /></g></g>
      </g>
    ) },
    // 18 by midnight the steel bows
    { at: 18, push: [1, 1.05], el: (c) => {
      const bow = ramp(c.lt, 0.2, c.d - 0.2) * 90;
      return (
        <g><Interior wall="#bfb394" line={920} /><g transform={`translate(${Math.sin(c.lt * 31) * 2.5} 0)`}><rect x={20} y={200} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} /><path d={`M 40 310 L 680 310 Q ${680 + bow} 600 680 900 L 40 900 Q ${40 - bow} 600 40 310 Z`} fill="#8e99a6" stroke={INK} strokeWidth={5} />{Array.from({ length: 40 }, (_, i) => <line key={i} x1={44} y1={326 + i * 14} x2={676} y2={326 + i * 14} stroke="#5d6772" strokeWidth={3} />)}</g>
          <Txt x={360} y={1000} size={64} fill="#c93a2e" ls={4} o={ramp(c.lt, 0.5, 1.0)}>BY MIDNIGHT</Txt></g>
      );
    } },
    // 19-20 a second wall: water pallets against the steel
    { at: 19, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} /><rect x={20} y={180} width={680} height={100} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={40} y={280} width={640} height={620} fill="#8e99a6" stroke={INK} strokeWidth={5} />{Array.from({ length: 31 }, (_, i) => <line key={i} x1={40} y1={296 + i * 20} x2={680} y2={296 + i * 20} stroke="#5d6772" strokeWidth={3} />)}
        {Array.from({ length: 6 }, (_, i) => { const a = pop(ramp(c.lt, c.s(20) + i * 0.3, c.s(20) + 0.35 + i * 0.3)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -260})`}><Pallet x={130 + (i % 3) * 230} floor={900} s={1.2} color="#6bb6e8" /></g>; })}
        {hero(60, 1070, 1.6, POSE.push(POSE.walk(c.lt, 1.2, 10)))}<Txt x={360} y={1090} size={60} fill="#2f7fb8" ls={3} o={ramp(c.lt, c.s(20) + 1.4, c.s(20) + 1.9)}>A TON EACH</Txt></g>
    ) },
    // 21 carts, nested and chained
    { at: 21, push: [1, 1.05], el: (c) => {
      const n = Math.floor(ramp(c.lt, 0.2, c.d - 0.4) * 12) + 1;
      return (
        <g><Interior wall="#bfb394" line={900} />{Array.from({ length: n }, (_, i) => <Shopcart key={i} x={60 + i * 34} y={1000} s={1.5} />)}<path d="M 40 930 Q 200 1000 400 930" fill="none" stroke="#3a3f48" strokeWidth={8} strokeDasharray="18 8" strokeLinecap="round" opacity={ramp(c.lt, 1.0, 1.6)} />
          <g transform="translate(360 330)"><rect x={-210} y={-70} width={420} height={110} rx={16} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-18} size={34} fill="#6f7f6a" ls={3}>NESTED + CHAINED</Txt><Txt x={0} y={28} size={54} fill="#c93a2e">30 CARTS / ROW</Txt></g></g>
      );
    } },
    // 22-23 a wall only buys time: you need them to leave
    { at: 22, card: true, el: (c) => {
      const sand = ramp(c.lt, 0.2, c.s(23) + 1.0);
      return (
        <g><CardBg /><Txt x={360} y={180} size={56} ls={3}>A WALL ONLY</Txt><Txt x={360} y={248} size={56} ls={3}>BUYS TIME.</Txt>
          <g transform="translate(360 640)"><path d="M -120 -200 L 120 -200 L 120 -170 Q 120 -90 22 -10 Q 120 70 120 150 L 120 200 L -120 200 L -120 150 Q -120 70 -22 -10 Q -120 -90 -120 -170 Z" fill="#f4f8f1" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><path d={`M -100 ${-170 + sand * 120} L 100 ${-170 + sand * 120} L 100 -150 Q 100 -90 12 -10 L -12 -10 Q -100 -90 -100 -150 Z`} fill="#d9b04a" opacity={1 - sand * 0.9} /><path d={`M -100 ${190 - sand * 120} Q 0 ${150 - sand * 130} 100 ${190 - sand * 120} L 100 190 L -100 190 Z`} fill="#d9b04a" /><rect x={-140} y={-224} width={280} height={24} rx={8} fill="#8a5a36" stroke={INK} strokeWidth={5} /><rect x={-140} y={200} width={280} height={24} rx={8} fill="#8a5a36" stroke={INK} strokeWidth={5} /></g>
          <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.5)}><Txt x={360} y={1000} size={72} fill="#c93a2e" ls={3}>THEY MUST LEAVE.</Txt></g></g>
      );
    } },
    // 24 Rhea's van is still in the lot
    { at: 24, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="dusk" /><rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" /><Car x={215} floor={1150} s={1.15} color="#ece6d4" />
        <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.2, 0.6)}>RHEA'S VAN. STILL THERE.</Txt></g>
    ) },
    // 25-26 locker twelve is Rhea's
    { at: 25, push: [1, 1.05], el: (c) => {
      const open = ease(ramp(c.lt, c.s(26), c.s(26) + 0.8));
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} />{[0, 1, 2, 3, 4].map((i) => <Locker key={i} x={20 + i * 135} y={300} n={8 + i} hi={8 + i === 12} open={8 + i === 12 ? open : 0} />)}
          <g transform={`translate(${lerp(90, 450, ease(ramp(c.lt, 0.5, c.s(26)))) } ${lerp(1050, 760, ease(ramp(c.lt, 0.5, c.s(26))))})`} opacity={1 - open}><Keyy x={0} y={0} s={0.9} /></g>
          {hero(620, 1090, 1.7, POSE.idle(c.lt), true)}<Txt x={360} y={190} size={54} ls={3} o={ramp(c.lt, 0.2, 0.6)}>STAFF LOCKER ROOM</Txt>
        </g>
      );
    } },
    // 27 inside: her phone, a photograph of two kids, and the van's remote
    { at: 27, push: [1, 1.05], el: (c) => (
      <g><rect width={W} height={H} fill="#1b1d22" /><rect x={90} y={150} width={540} height={980} fill="#3a4350" stroke={INK} strokeWidth={8} />
        {[0, 1, 2].map((i) => { const a = pop(ramp(c.lt, 0.3 + i * 0.7, 0.8 + i * 0.7)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(360 ${300 + i * 300}) scale(${a})`}>
          {i === 0 && <g><rect x={-60} y={-100} width={120} height={200} rx={16} fill="#2a2e34" stroke={INK} strokeWidth={5} /><rect x={-48} y={-82} width={96} height={150} fill="#9fd0e8" opacity={0.7} /><Txt x={0} y={150} size={34} fill="#f6f1e2">HER PHONE</Txt></g>}
          {i === 1 && <g><rect x={-120} y={-90} width={240} height={180} fill="#f6f1e2" stroke={INK} strokeWidth={5} />{[-50, 50].map((px) => <g key={px}><circle cx={px} cy={-20} r={24} fill="#f6e6c8" stroke={INK} strokeWidth={3} /><path d={`M ${px - 30} 70 Q ${px} 0 ${px + 30} 70 Z`} fill={px < 0 ? '#c93a2e' : '#3d63a8'} stroke={INK} strokeWidth={3} /></g>)}<Txt x={0} y={140} size={34} fill="#f6f1e2">TWO KIDS</Txt></g>}
          {i === 2 && <g><rect x={-50} y={-70} width={100} height={140} rx={20} fill="#2a2e34" stroke={INK} strokeWidth={5} /><circle cx={0} cy={20} r={30} fill="#c93a2e" stroke={INK} strokeWidth={4} /><Txt x={0} y={120} size={34} fill="#f6f1e2">VAN REMOTE</Txt></g>}</g>; })}</g>
    ) },
    // 28 roof: aim the remote, hold the panic button
    { at: 28, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="night" /><Car x={215} floor={1150} s={1.15} color="#ece6d4" />
        <Mob n={50} t={c.t} seed={77} x0={20} x1={170} f0={930} f1={1100} s0={0.5} s1={0.7} face="right" />
        <Person kind="hero" x={540} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: 100, lF: 100 }} flip hold={<g><rect x={-6} y={-8} width={14} height={20} rx={4} fill="#2a2e34" stroke={INK} strokeWidth={2} /><circle cx={0} cy={0} r={4} fill="#c93a2e" /></g>} />
        <path d="M 500 480 L 260 1040" stroke="#c93a2e" strokeWidth={4} strokeDasharray="12 10" opacity={ramp(c.lt, 1.2, 1.8)} />
        <Txt x={360} y={190} size={56} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>THE PANIC BUTTON</Txt>
      </g>
    ) },
    // 29 the horn screams
    { at: 29, push: [1, 1.07], el: (c) => (
      <g><LotSide tone="night" /><Mob n={80} t={c.t} seed={61} x0={60} x1={400} f0={930} f1={1190} face="right" still={false} /><Car x={215} floor={1150} s={1.15} color="#ece6d4" />
        <Waves x={215} y={1080} t={c.lt * 1.4} n={6} max={700} color="#d9462a" /><g transform={`translate(215 900) scale(${1 + 0.1 * tri(c.lt * 8)})`}><Txt x={0} y={0} size={100} fill="#e5361d" stroke="#07050f" ls={4}>HONK!!</Txt></g></g>
    ) },
    // 30 two hundred and fifty heads swing away
    { at: 30, push: [1, 1.05], el: (c) => {
      const drift = ramp(c.lt, 0.6, c.d) * 170;
      return (
        <g><LotSide tone="night" /><g transform={`translate(${-drift} 0)`}><Mob n={86} t={c.t} seed={31} x0={90} x1={400} f0={920} f1={1190} face="left" still={false} /></g>
          <Car x={215} floor={1150} s={1.15} color="#ece6d4" /><Waves x={215} y={1080} t={c.lt * 1.4} n={5} max={600} color="#d9462a" />
          <g opacity={ramp(c.lt, 0.3, 0.7)}><Txt x={360} y={190} size={56} fill="#c93a2e" stroke="#07050f" ls={3}>250 HEADS TURN AWAY</Txt></g></g>
      );
    } },
  ],
  cues: [
    [0, 0.5, 'click'], [1, 0, 'run', 3.5], [2, 0.0, 'run', 1.8], [2, 1.85, 'powerdown'], [3, 0.2, 'moan', 3], [4, 0.3, 'clunk'], [5, 0.4, 'steps', 2], [6, 0.8, 'snap'], [7, 0.2, 'sting'],
    [9, 0.4, 'scratch', 2], [10, 0.2, 'moan', 3], [11, 0.0, 'moan', 5], [14, 0.0, 'slam'], [14, 0.5, 'slam'], [14, 1.0, 'slam'], [15, 0.1, 'slam'],
    [18, 0.2, 'rumble'], [20, 0.2, 'thud'], [20, 0.6, 'thud'], [20, 0.95, 'thud'], [20, 1.3, 'thud'], [21, 0.3, 'clink'], [21, 0.7, 'clink'], [21, 1.1, 'clink'], [23, 0.1, 'click'],
    [25, 0.9, 'clink'], [26, 0.5, 'creak'], [27, 0.3, 'ding'], [27, 1.1, 'ding'], [27, 1.9, 'ding'], [28, 1.4, 'click'], [29, 0.1, 'alarm', 4], [29, 0.2, 'sting'], [30, 0.2, 'moan', 4],
  ],
};
void Dark; void Door; void H; void rnd; void Bar; void CardBg;
