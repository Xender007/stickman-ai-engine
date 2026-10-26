/** Chapter 2: The Cold Chain. Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../../engine.tsx';
import { Aisle, AisleSign, Bar, Beam, CardBg, Clock, Dark, Door, H, INK, Interior, Kicker, Keyy, Litter, Note, PAL, Pallet, Person, POSE, ProblemCard, ShelfRow, Shopcart, Sky, Tin, Txt, W, clamp, ease, lerp, pop, ramp, rnd, tri } from '../../lib.tsx';
import { LotSide, Mob, ShelvesBack } from '../../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;

const Fish: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = '#6aa6a3' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M -50 0 Q -10 -40 40 0 Q -10 40 -50 0 Z" fill={c} stroke={INK} strokeWidth={4} /><polygon points="36,0 70,-24 70,24" fill={c} stroke={INK} strokeWidth={4} /><circle cx={-26} cy={-6} r={5} fill="#fff" stroke={INK} strokeWidth={2} /><circle cx={-25} cy={-6} r={2} fill={INK} /></g>
);
const Steak: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M -50 -10 Q -40 -44 0 -40 Q 50 -38 52 -4 Q 50 34 0 34 Q -46 32 -50 -10 Z" fill="#c8453d" stroke={INK} strokeWidth={4} /><circle cx={14} cy={-4} r={13} fill="#f1ead6" stroke={INK} strokeWidth={3} /></g>
);
const Milk: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M -34 -60 L 34 -60 L 28 30 L -28 30 Z" fill="#f4efe6" stroke={INK} strokeWidth={4} strokeLinejoin="round" /><path d="M -34 -60 L 0 -90 L 34 -60 Z" fill="#e4dccd" stroke={INK} strokeWidth={4} strokeLinejoin="round" /><rect x={-26} y={-36} width={52} height={32} fill="#6b3f86" stroke={INK} strokeWidth={3} /></g>
);
const Loaf: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M -50 10 Q -56 -30 -10 -34 Q 44 -38 50 6 Q 20 18 -50 10 Z" fill="#d49a4a" stroke={INK} strokeWidth={4} /><path d="M -24 -22 l 8 14 M 0 -26 l 8 14 M 24 -20 l 6 12" stroke="#a96c2a" strokeWidth={4} strokeLinecap="round" /></g>
);
const Apple: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = '#c0392b' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle r={24} fill={c} stroke={INK} strokeWidth={3.5} /><path d="M 0 -24 q 2 -14 12 -16" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" /></g>
);
const Crown: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M -26 0 L -30 -34 L -14 -18 L 0 -40 L 14 -18 L 30 -34 L 26 0 Z" fill="#f0c43a" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" /><circle cx={0} cy={-40} r={5} fill="#c0392b" stroke={INK} strokeWidth={2} /></g>
);
const Tape: React.FC<{ x: number; y: number; w: number; rot: number }> = ({ x, y, w, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}><rect x={-w / 2} y={-13} width={w} height={26} fill="#e4d49a" stroke={INK} strokeWidth={2.5} opacity={0.95} /><line x1={-w / 2 + 6} y1={0} x2={w / 2 - 6} y2={0} stroke="#b8a864" strokeWidth={2} /></g>
);
const FreezerDoor: React.FC<{ x?: number; y?: number; w?: number; h?: number }> = ({ x = 190, y = 230, w = 340, h = 660 }) => (
  <g>
    <rect x={x - 30} y={y - 30} width={w + 60} height={h + 30} fill="#5a6672" stroke={INK} strokeWidth={5} />
    <rect x={x} y={y} width={w} height={h} fill="#b7c3cf" stroke={INK} strokeWidth={5} />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} fill="none" stroke="#3a3d42" strokeWidth={16} />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} fill="none" stroke="#6a6e74" strokeWidth={4} />
    <rect x={x + w - 70} y={y + h * 0.45} width={22} height={110} rx={9} fill="#d9d4c0" stroke={INK} strokeWidth={4} />
    <rect x={x + w / 2 - 100} y={y + 52} width={200} height={44} rx={6} fill="#2f5e86" stroke={INK} strokeWidth={4} />
    <Txt x={x + w / 2} y={y + 84} size={28} fill="#e8f4ff" ls={2}>WALK-IN FREEZER</Txt>
  </g>
);

export const ch: Chapter = {
  n: 2, label: 'THE COLD CHAIN',
  scenes: [
    // 0-1 the fire exit drifts open, you haul it shut
    { at: 0, push: [1, 1.07], el: (c) => {
      const pull = c.s(1) + 0.3, shut = c.s(1) + 1.1;
      const o = c.lt < pull ? 0.06 + 0.3 * ramp(c.lt, 0, pull) : c.lt < shut ? lerp(0.36, 0, ease(ramp(c.lt, pull, shut))) : 0.32 * ramp(c.lt, shut + 0.5, c.d);
      const x = lerp(30, 250, ease(ramp(c.lt, c.s(0) + 0.1, c.s(1))));
      const moving = c.lt < c.s(1) && c.lt > c.s(0) + 0.1;
      const pose = moving ? POSE.run(c.lt, 1.3) : c.lt < shut ? POSE.pull(POSE.idle(c.lt)) : POSE.idle(c.lt);
      return <g><Interior wall="#bfb394" line={900} /><Door x={380} y={320} w={240} h={580} open={o} />{hero(x, 900, 1.9, pose)}</g>;
    } },
    // 2-3 pallet jack, a pallet weighs nearly a ton
    { at: 2, push: [1, 1.06], el: (c) => {
      const x = lerp(60, 330, ease(ramp(c.lt, 0.3, c.s(3) - 0.3)));
      const wt = pop(ramp(c.lt, c.s(3) + 0.1, c.s(3) + 0.6));
      return (
        <g><Interior wall="#bfb394" line={900} /><Door x={500} y={330} w={230} h={570} open={0} sign="" />
          <Litter x={x + 170} floor={900} s={1.5} /><rect x={x + 60} y={870} width={100} height={12} fill="#555" stroke={INK} strokeWidth={3} />
          {hero(x, 900, 1.8, POSE.push(POSE.walk(c.lt, 1.4, 12)))}
          <g opacity={wt} transform={`translate(360 ${300}) scale(${wt})`}><rect x={-250} y={-60} width={500} height={110} rx={14} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-8} size={44}>1 PALLET</Txt><Txt x={0} y={34} size={44} fill="#c93a2e">= ALMOST 1 TON</Txt></g>
        </g>
      );
    } },
    // 4 four pallets against the door
    { at: 4, el: (c) => (
      <g><Interior wall="#bfb394" line={900} /><Door x={240} y={330} w={240} h={570} open={0} sign="" />
        {[170, 340, 520, 650].map((px, i) => { const a = pop(ramp(c.lt, 0.15 + i * 0.4, 0.5 + i * 0.4)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -260})`}><Litter x={px} floor={900 + (i % 2) * 36} s={1.45} /></g>; })}
        <Txt x={360} y={250} size={92} fill="#c93a2e" o={ramp(c.lt, 1.6, 1.9)}>x 4</Txt>
        {hero(90, 1000, 1.5, POSE.idle(c.lt))}
      </g>
    ) },
    // 5-6 staff entrance, eight keys
    { at: 5, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#c9b99a" line={900} />
        <Door x={290} y={340} w={220} h={560} open={0} sign="STAFF" color="#6f7e8c" />
        <rect x={30} y={380} width={200} height={250} rx={8} fill="#8a6a46" stroke={INK} strokeWidth={5} />
        <Txt x={130} y={418} size={30} fill="#f6f1e2" ls={3}>KEYS</Txt>
        {Array.from({ length: 8 }, (_, i) => { const a = pop(ramp(c.lt, c.s(6) + 0.3 + i * 0.18, c.s(6) + 0.6 + i * 0.18)); return <g key={i} opacity={clamp(a * 3)}><Keyy x={64 + (i % 4) * 44} y={470 + Math.floor(i / 4) * 80} rot={90} s={0.34 * a} /></g>; })}
        <Txt x={130} y={680} size={44} fill="#c93a2e" o={ramp(c.lt, c.s(6) + 0.2, c.s(6) + 0.6)}>8 KEYS</Txt>
        {hero(620, 900, 1.8, POSE.idle(c.lt), true)}
      </g>
    ) },
    // 7-9 the key snaps, nobody has one, she will have to knock
    { at: 7, el: (c) => {
      const a = ramp(c.lt, 0.3, 1.0), snap = c.s(7) + 1.0;
      const keyX = lerp(-40, 330, ease(a));
      const broken = c.lt > snap;
      const fall = ramp(c.lt, snap, snap + 0.9);
      const kn = c.s(9) + 0.9;
      return (
        <g><rect width={W} height={H} fill="#cbbf9f" />
          <rect x={150} y={250} width={420} height={640} rx={26} fill="#8c97a3" stroke={INK} strokeWidth={6} />
          <rect x={176} y={276} width={368} height={588} rx={16} fill="none" stroke="#5d6772" strokeWidth={4} />
          <circle cx={360} cy={560} r={74} fill="#b5bec7" stroke={INK} strokeWidth={5} /><rect x={348} y={560} width={24} height={72} rx={10} fill="#1b1d22" stroke={INK} strokeWidth={3} /><circle cx={360} cy={560} r={22} fill="#1b1d22" />
          {!broken && <g transform={`rotate(${ramp(c.lt, 0.9, snap) * 38} ${360} ${560})`}><Keyy x={keyX} y={560} s={1.5} /></g>}
          {broken && <g><rect x={330} y={553} width={36} height={14} fill="#d9b04a" stroke={INK} strokeWidth={3} transform="rotate(38 360 560)" /><g transform={`translate(${-30 * fall} ${fall * fall * 520}) rotate(${fall * 120} 250 560)`}><Keyy x={250} y={560} s={1.5} rot={0} /></g></g>}
          {c.lt > c.s(9) && [0, 1].map((i) => { const k = ramp(c.lt, kn + i * 0.42, kn + i * 0.42 + 0.25); return <g key={i} opacity={k * (1 - ramp(c.lt, kn + i * 0.42 + 0.3, kn + i * 0.42 + 0.7))}><circle cx={360} cy={560} r={120 + k * 140} fill="none" stroke="#c93a2e" strokeWidth={8} /></g>; })}
          <Txt x={360} y={1000} size={60} fill="#c93a2e" o={ramp(c.lt, kn, kn + 0.2)}>KNOCK KNOCK</Txt>
        </g>
      );
    } },
    // 10-12 emergency lamps, everyone walks out
    { at: 10, push: [1, 1.05], el: (c) => {
      const bat = 1 - ramp(c.lt, 0, c.d);
      const walkT = ramp(c.lt, c.s(11), c.e(11) + 0.8);
      return (
        <g><ShelvesBack />
          {[110, 610].map((lx) => <g key={lx}><circle cx={lx} cy={260} r={130} fill="#ffb347" opacity={0.22 + 0.06 * Math.sin(c.lt * 6)} /><rect x={lx - 34} y={236} width={68} height={42} rx={8} fill="#f6f1e2" stroke={INK} strokeWidth={4} /><circle cx={lx - 16} cy={257} r={8} fill="#ffb347" stroke={INK} strokeWidth={2} /><circle cx={lx + 16} cy={257} r={8} fill="#ffb347" stroke={INK} strokeWidth={2} /></g>)}
          <rect width={W} height={H} fill="#1c1630" opacity={0.28} />
          {walkT > 0 && walkT < 1 && [0, 1].map((i) => <Person key={i} kind="kid" x={lerp(100 - i * 150, 860 - i * 130, ease(walkT))} floor={1010 + i * 24} s={1.4} pose={POSE.walk(c.lt + i * 0.3, 1.5)} />)}
          {hero(150, 1060, 1.7, c.lt > c.s(12) ? { ...POSE.idle(c.lt), head: 10 } : POSE.idle(c.lt))}
          <g transform="translate(360 250)" opacity={0.95}><rect x={-230} y={-46} width={460} height={92} rx={14} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-8} size={30} ls={3}>EMERGENCY LIGHTS: 2 HRS</Txt><rect x={-200} y={8} width={400} height={22} rx={8} fill="#f4f8f1" stroke={INK} strokeWidth={3} /><rect x={-197} y={11} width={394 * bat} height={16} rx={6} fill={bat > 0.3 ? '#4aa86a' : '#d9462a'} /></g>
        </g>
      );
    } },
    // 13-14 the lamps fade, no windows
    { at: 13, push: [1, 1.04], el: (c) => {
      const dk = ramp(c.lt, c.s(13) + 0.3, c.e(13) + 1.0) * 0.94;
      return (
        <g><ShelvesBack />
          {hero(360, 1060, 1.9, POSE.idle(c.lt))}
          <Dark o={dk} />
          <g opacity={ramp(c.lt, c.s(14), c.s(14) + 0.5)}><rect x={150} y={180} width={420} height={420} fill="none" stroke="#d9d4c0" strokeWidth={8} /><line x1={150} y1={180} x2={570} y2={600} stroke="#c93a2e" strokeWidth={14} /><line x1={570} y1={180} x2={150} y2={600} stroke="#c93a2e" strokeWidth={14} /><Txt x={360} y={700} size={96} fill="#f6f1e2" ls={5} stroke="#07050f">NO WINDOWS</Txt></g>
        </g>
      );
    } },
    // 15 a cave
    { at: 15, el: (c) => (
      <g><rect width={W} height={H} fill="#140f1c" />
        <path d="M -20 -20 L 740 -20 L 740 420 Q 600 300 500 380 Q 360 250 220 380 Q 110 300 -20 420 Z" fill="#2a2234" stroke={INK} strokeWidth={5} />
        {[60, 170, 290, 420, 540, 650].map((sx, i) => <polygon key={i} points={`${sx - 28},330 ${sx + 28},330 ${sx + (i % 2 ? 6 : -4)},${430 + rnd(i) * 120}`} fill="#3a2f46" stroke={INK} strokeWidth={4} />)}
        <rect y={900} width={W} height={380} fill="#241c2e" />
        <Beam x={400} y={800} ang={0} len={600} spread={26} o={0.18 + 0.05 * Math.sin(c.lt * 7)} />
        <circle cx={430} cy={800} r={170} fill="#ffb347" opacity={0.2} />
        {hero(360, 960, 1.9, { ...POSE.idle(c.lt), lU: 60, lF: 84 })}
        <g transform="translate(446 826)"><rect x={-9} y={-6} width={18} height={30} rx={4} fill="#d9b04a" stroke={INK} strokeWidth={3} /><circle cx={0} cy={-14} r={10} fill="#ffe28a" /></g>
        <Txt x={360} y={250} size={54} fill="#a89ac2" ls={6} o={ramp(c.lt, 0.3, 0.9)}>A CAVE.</Txt>
      </g>
    ) },
    // 16-17 aisle 9: flashlights and batteries
    { at: 16, push: [1, 1.05], el: (c) => (
      <g><Interior line={900} />
        {[0, 1, 2].map((r) => <g key={r}><ShelfRow x={-20} y={250 + r * 210} w={760} h={110} seed={r + 40} />
          {Array.from({ length: 11 }, (_, i) => r === 1 ? <g key={i}><rect x={30 + i * 62} y={290 + r * 210} width={18} height={50} rx={5} fill="#3c3f46" stroke={INK} strokeWidth={2.5} /><rect x={30 + i * 62} y={286 + r * 210} width={18} height={12} fill="#f0c43a" stroke={INK} strokeWidth={2} /></g> : <g key={i}><rect x={34 + i * 62} y={300 + r * 210} width={12} height={34} rx={2} fill={r ? '#d9b04a' : '#4aa86a'} stroke={INK} strokeWidth={2} /></g>)}</g>)}
        <AisleSign x={360} y={60} n="9" label="LIGHTS" sub="BATTERIES" s={1.15} />
        {Array.from({ length: 5 }, (_, i) => <g key={i} opacity={ramp(c.lt, c.s(17) + i * 0.12, c.s(17) + i * 0.12 + 0.2)}><g stroke="#c93a2e" strokeWidth={6} strokeLinecap="round">{Array.from({ length: 4 }, (_, k) => <line key={k} x1={470 + i * 44 + k * 7} y1={900 + 40} x2={470 + i * 44 + k * 7} y2={900 + 90} />)}<line x1={470 + i * 44 - 4} y1={900 + 90} x2={470 + i * 44 + 30} y2={900 + 44} /></g></g>)}
        {hero(220, 1060, 1.8, { ...POSE.walk(c.lt, 0.6, 6), lU: 70, lF: 96 })}
      </g>
    ) },
    // 18 problem two
    { at: 18, card: true, el: (c) => <ProblemCard n="TWO" title="THE ROT" c={c} icon={<g><Fish x={0} y={0} s={2.2} c="#7fae7a" />{[-70, 0, 70].map((sx, i) => <path key={i} d={`M ${sx} -90 q 14 -26 0 -52 q -14 -26 0 -52`} fill="none" stroke="#6aa04a" strokeWidth={9} strokeLinecap="round" opacity={0.8} transform={`translate(0 ${-tri(c.lt * 1.4 + i * 0.4) * 22})`} />)}</g>} /> },
    // 19-20 fridge 5 hours, freezer 3 days
    { at: 19, card: true, el: (c) => (
      <g><CardBg />
        <Txt x={360} y={190} size={50} ls={3}>WITHOUT POWER,</Txt><Txt x={360} y={252} size={50} ls={3}>FOOD STAYS SAFE FOR:</Txt>
        <Bar x={60} y={440} w={600} h={78} v={ramp(c.lt, 0.3, 1.3) * (5 / 72)} label="FRIDGE" value="5 HOURS" color="#d9462a" />
        <Bar x={60} y={700} w={600} h={78} v={ramp(c.lt, c.s(20) + 0.2, c.s(20) + 1.8)} label="FULL FREEZER" value="3 DAYS" color="#3f7fb8" />
        <g opacity={ramp(c.lt, c.s(20) + 1.8, c.s(20) + 2.2)}><Txt x={360} y={930} size={44} fill="#6f7f6a">...then it all turns.</Txt></g>
      </g>
    ) },
    // 21 three tons
    { at: 21, card: true, el: (c) => (
      <g><CardBg />
        <Txt x={360} y={250} size={52} fill="#6f7f6a" ls={5}>SEALED IN WITH</Txt>
        <g transform={`translate(360 640) scale(${pop(ramp(c.lt, 0.15, 0.7))})`}><Txt x={0} y={0} size={170} fill="#c93a2e" ls={4}>3 TONS</Txt></g>
        <Steak x={170} y={860 + Math.sin(c.lt * 3) * 6} s={1.1} /><Milk x={360} y={860 + Math.sin(c.lt * 3 + 1) * 6} s={1.1} /><Fish x={550} y={860 + Math.sin(c.lt * 3 + 2) * 6} s={1.2} />
      </g>
    ) },
    // 22-24 walk-in freezer: heat out, smells in
    { at: 22, push: [1, 1.05], el: (c) => {
      const warm = ramp(c.lt, c.s(23), c.e(23));
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><FreezerDoor />
          {warm > 0 && [0, 1, 2].map((i) => { const k = (c.lt * 0.9 + i * 0.33) % 1; const px = lerp(-40, 150, Math.min(1, k * 1.5)) - (k > 0.67 ? (k - 0.67) * 280 : 0); return <g key={i} opacity={warm * (1 - ramp(k, 0.8, 1))}><path d={`M ${px} ${380 + i * 120} l 56 0 l -14 -16 m 14 16 l -14 16`} stroke="#d9462a" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>; })}
          <Txt x={70} y={300} size={30} fill="#d9462a" o={warm}>WARM AIR</Txt>
          {c.lt > c.s(24) && [0, 1, 2].map((i) => <path key={i} d={`M ${300 + i * 90} 780 q 14 -26 0 -52 q -14 -26 0 -52 q 14 -26 0 -52`} fill="none" stroke="#6aa04a" strokeWidth={8} strokeLinecap="round" opacity={ramp(c.lt, c.s(24), c.s(24) + 0.6) * 0.85} transform={`translate(0 ${-tri(c.lt * 1.3 + i * 0.5) * 18})`} />)}
          <Txt x={360} y={1010} size={46} fill="#2f5e86" o={ramp(c.lt, c.s(24) + 0.2, c.s(24) + 0.7)}>SMELLS STAY IN</Txt>
        </g>
      );
    } },
    // 25-26 nine hours, one cart; keep the bread and fruit back
    { at: 25, push: [1, 1.04], el: (c) => {
      const x = lerp(-120, 520, ((c.lt * 0.34) % 1));
      const keep = ramp(c.lt, c.s(26), c.s(26) + 0.5);
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} />
          {Array.from({ length: 3 }, (_, r) => Array.from({ length: 6 }, (_, k) => r * 6 + k < Math.floor(ramp(c.lt, 0, c.s(26)) * 18) + 1 && <rect key={`${r}${k}`} x={20 + k * 56} y={810 - r * 52} width={50} height={46} fill={['#7fb3d8', '#c8453d', '#e7d9b5'][r]} stroke={INK} strokeWidth={3} />))}
          <Clock x={600} y={220} s={1.2} min={c.lt * 40} hour={c.lt * 3} label="9 HOURS" t={c.lt} />
          {keep < 0.05 && <g><Shopcart x={x + 170} y={1100} s={1.7} />{[0, 1, 2].map((i) => <rect key={i} x={x + 110 + i * 40} y={950 - (i % 2) * 14} width={36} height={42} fill={['#7fb3d8', '#c8453d', '#e7d9b5'][i]} stroke={INK} strokeWidth={3} />)}{hero(x, 1060, 1.6, POSE.push(POSE.walk(c.lt, 1.4, 12)))}</g>}
          {keep >= 0.05 && <g><rect x={90} y={880} width={540} height={130} rx={12} fill="#e7d9b5" stroke={INK} strokeWidth={5} /><Loaf x={190} y={940} s={1.2} /><Apple x={320} y={950} /><Apple x={380} y={952} c="#e0a52e" /><Apple x={440} y={950} c="#6aa04a" /><Loaf x={540} y={944} s={1} /><g transform={`translate(360 ${860 - keep * 10}) scale(${pop(keep)})`}><rect x={-90} y={-70} width={180} height={52} rx={26} fill="#4aa86a" stroke={INK} strokeWidth={4} /><Txt x={0} y={-33} size={32} fill="#fff" ls={3}>KEEP</Txt></g>{hero(110, 1090, 1.5, POSE.idle(c.lt))}</g>}
        </g>
      );
    } },
    // 27 a week eating like a king
    { at: 27, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#d8b88a" line={900} /><rect x={90} y={780} width={540} height={26} fill="#8a5a36" stroke={INK} strokeWidth={5} /><rect x={140} y={806} width={20} height={150} fill="#6e4528" stroke={INK} strokeWidth={4} /><rect x={560} y={806} width={20} height={150} fill="#6e4528" stroke={INK} strokeWidth={4} />
        <Steak x={240} y={750} s={0.8} /><Fish x={360} y={754} s={0.7} c="#d98a4a" /><Loaf x={470} y={752} s={0.7} /><Apple x={560} y={756} s={0.7} />
        {[0, 1, 2].map((i) => <path key={i} d={`M ${230 + i * 120} 700 q 10 -20 0 -40 q -10 -20 0 -40`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.6 - ((c.lt * 0.8 + i * 0.3) % 1) * 0.5} transform={`translate(0 ${-((c.lt * 30 + i * 12) % 30)})`} />)}
        <rect x={62} y={820} width={100} height={22} fill="#6e4528" stroke={INK} strokeWidth={4} />
        <Person kind="hero" x={110} floor={960} s={1.7} pose={{ ...POSE.sit(), lU: 40 + Math.sin(c.lt * 5) * 14, lF: 80 + Math.sin(c.lt * 5) * 20 }} />
        <Crown x={110 + 4} y={960 - 66 * 1.7 - 54 * 1.7 - 44 * 1.7 + 6} s={1.7} />
        <Txt x={360} y={230} size={52} fill="#8a5a36" ls={3} o={ramp(c.lt, 0.2, 0.7)}>KING OF THE STORE</Txt>
      </g>
    ) },
    // 28 tape the seams, write on the door
    { at: 28, push: [1, 1.04], el: (c) => (
      <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><FreezerDoor />
        {[[190, 360, 80, 8], [530, 360, 80, -8], [190, 560, 80, 8], [530, 640, 80, -8], [360, 230, 330, 0], [360, 890, 330, 0]].map(([tx, ty, w, r], i) => ramp(c.lt, 0.1 + i * 0.12, 0.3 + i * 0.12) > 0 && <Tape key={i} x={tx} y={ty} w={Math.max(1, (w < 100 ? 150 : w) * ramp(c.lt, 0.1 + i * 0.12, 0.3 + i * 0.12))} rot={w < 100 ? (r > 0 ? 80 : -80) : 0} />)}
        <g transform="translate(360 520) rotate(-4)"><rect x={-140} y={-130} width={280} height={250} fill="#f4ecd0" stroke={INK} strokeWidth={4} /><Txt x={0} y={-70} size={38} fill="#c93a2e" o={ramp(c.lt, c.s(28) + 0.5, c.s(28) + 0.8)}>HOUSE RULE:</Txt><Txt x={0} y={-12} size={34} o={ramp(c.lt, c.s(28) + 1.4, c.s(28) + 1.7)}>NOBODY OPENS</Txt><Txt x={0} y={30} size={34} o={ramp(c.lt, c.s(28) + 1.7, c.s(28) + 2.0)}>THIS.</Txt><Txt x={0} y={86} size={50} fill="#c93a2e" o={ramp(c.lt, c.s(28) + 2.2, c.s(28) + 2.5)}>EVER.</Txt></g>
      </g>
    ) },
    // 29 climb onto the roof (fourth morning)
    { at: 29, push: [1, 1.05], el: (c) => {
      const x = lerp(610, 500, ease(ramp(c.lt, 0.4, c.d - 0.2)));
      return (
        <g><LotSide tone="dawn" />
          <Person kind="hero" x={x} floor={520} s={0.95} pose={POSE.walk(c.lt, 1.2, 4)} flip />
          <Txt x={360} y={190} size={50} fill="#6a4a36" ls={5} o={ramp(c.lt, 0.3, 0.8)}>DAY 4 · MORNING</Txt>
        </g>
      );
    } },
    // 30 three nights ago the lot was empty
    { at: 30, el: (c) => (
      <g><LotSide tone="night" lit /><rect width={W} height={H} fill="#5a3a20" opacity={0.18} />
        <Txt x={360} y={190} size={54} fill="#f6f1e2" ls={5} o={ramp(c.lt, 0.1, 0.5)} stroke="#07050f">THREE NIGHTS AGO</Txt>
        <Txt x={200} y={1040} size={44} fill="#e8e4f2" ls={4} o={ramp(c.lt, 0.6, 1.1)}>EMPTY</Txt>
      </g>
    ) },
    // 31-32 now: 150 people, all facing the doors
    { at: 31, push: [1, 1.05], el: (c) => {
      const n = ramp(c.lt, 0.3, c.s(32) + 0.4);
      return (
        <g><LotSide tone="day" /><Mob n={74} t={c.t} seed={5} shown={n} />
          <g transform="translate(360 330)"><rect x={-190} y={-120} width={380} height={190} rx={22} fill="#2a2220" opacity={0.85} /><Txt x={0} y={40} size={120} fill="#f6f1e2" ls={3}>{Math.round(150 * n)}</Txt><Txt x={0} y={-76} size={30} fill="#d9b04a" ls={5}>NOW IN THE LOT:</Txt></g>
        </g>
      );
    } },
    // 33-35 not hunting you, they do not know you are here
    { at: 33, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="day" /><Mob n={74} t={c.t} seed={5} />
        <Person kind="hero" x={560} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: 70 + Math.sin(c.lt * 6) * 25, lF: 100 + Math.sin(c.lt * 6) * 30 }} flip />
        <g opacity={ramp(c.lt, c.s(34), c.s(34) + 0.5)}><Txt x={560} y={450} size={90} fill="#c93a2e">?</Txt><Txt x={360} y={180} size={52} fill="#2a2220" ls={4}>THEY DO NOT KNOW.</Txt></g>
      </g>
    ) },
    // 35-36 it is Sunday morning, shopping
    { at: 35, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="day" doorsOpen={0} /><Mob n={74} t={c.t} seed={5} />
        {[90, 190, 300].map((cx, i) => <Shopcart key={i} x={cx} y={1020 + i * 60} s={1.3} flip={i % 2 === 0} />)}
        <g transform="translate(360 200)"><rect x={-250} y={-70} width={500} height={130} rx={20} fill="#fff" stroke={INK} strokeWidth={5} /><Txt x={0} y={-10} size={64} fill="#c93a2e" ls={4}>SUNDAY 9 AM</Txt><Txt x={0} y={36} size={40} ls={3}>OPEN FOR SHOPPING</Txt></g>
      </g>
    ) },
  ],
  cues: [
    [0, 0.2, 'creak'], [1, 1.0, 'thud'], [1, 1.9, 'creak'], [2, 0.4, 'steps', 2.2], [3, 0.1, 'thud'],
    [4, 0.2, 'slam'], [4, 0.7, 'slam'], [4, 1.1, 'slam'], [4, 1.5, 'slam'],
    [6, 0.4, 'clink'], [6, 0.7, 'clink'], [6, 1.0, 'clink'], [7, 0.4, 'click'], [7, 1.0, 'snap'], [9, 0.9, 'knock'], [9, 1.32, 'knock'],
    [11, 0.2, 'steps', 2], [13, 0.2, 'powerdown'], [14, 0.2, 'moan', 3], [16, 0.5, 'click'], [18, 0.1, 'slam'],
    [21, 0.2, 'thud'], [22, 0.2, 'hiss'], [24, 0.2, 'gas', 2], [25, 0.2, 'steps', 4], [26, 0.2, 'clunk'], [28, 0.2, 'scratch', 2.4],
    [29, 0.1, 'steps', 2.5], [31, 0, 'moan', 6], [31, 3, 'moan', 6], [35, 0.1, 'moan', 5],
  ],
};
void Aisle; void Kicker; void Note; void PAL; void Sky; void Tin; void H;
