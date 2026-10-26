/** Chapter 2: The Cold Chain (script v3). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Aisle, AisleSign, Bar, Beam, CardBg, Clock, Dark, Door, H, INK, Interior, Keyy, Litter, PAL, Person, POSE, ProblemCard, ShelfRow, Tin, Txt, W, clamp, ease, lerp, pop, ramp, rnd, tri } from '../lib.tsx';
import { LotSide, Mob, ShelvesBack } from '../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Eyes: React.FC<{ x: number; y: number; s?: number; o?: number; blink?: number }> = ({ x, y, s = 1, o = 1, blink = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>{[-22, 22].map((ex) => <g key={ex}><ellipse cx={ex} cy={0} rx={13} ry={9 * blink} fill="#f4f0d0" /><ellipse cx={ex} cy={0} rx={30} ry={20 * blink} fill="#f4f0d0" opacity={0.12} /><circle cx={ex + 3} cy={0} r={4.5} fill="#07050f" /></g>)}</g>
);
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
const Tape: React.FC<{ x: number; y: number; w: number; rot: number }> = ({ x, y, w, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}><rect x={-w / 2} y={-13} width={w} height={26} fill="#e4d49a" stroke={INK} strokeWidth={2.5} opacity={0.95} /><line x1={-w / 2 + 6} y1={0} x2={w / 2 - 6} y2={0} stroke="#b8a864" strokeWidth={2} /></g>
);
const FreezerDoor: React.FC<{ x?: number; y?: number; w?: number; h?: number }> = ({ x = 190, y = 230, w = 340, h = 660 }) => (
  <g>
    <rect x={x - 30} y={y - 30} width={w + 60} height={h + 30} fill="#5a6672" stroke={INK} strokeWidth={5} />
    <rect x={x} y={y} width={w} height={h} fill="#b7c3cf" stroke={INK} strokeWidth={5} />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} fill="none" stroke="#3a3d42" strokeWidth={16} />
    <rect x={x + w - 70} y={y + h * 0.45} width={22} height={110} rx={9} fill="#d9d4c0" stroke={INK} strokeWidth={4} />
    <rect x={x + w / 2 - 100} y={y + 52} width={200} height={44} rx={6} fill="#2f5e86" stroke={INK} strokeWidth={4} />
    <Txt x={x + w / 2} y={y + 84} size={28} fill="#e8f4ff" ls={2}>WALK-IN FREEZER</Txt>
  </g>
);

export const ch: Chapter = {
  n: 2, label: 'THE COLD CHAIN',
  scenes: [
    // 0 slam the fire exit, four pallets of litter against it
    { at: 0, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#bfb394" line={900} /><Door x={240} y={330} w={240} h={570} open={lerp(0.3, 0, ease(ramp(c.lt, 0.2, 0.7)))} />
        {[170, 340, 520, 650].map((px, i) => { const a = pop(ramp(c.lt, 1.0 + i * 0.4, 1.35 + i * 0.4)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -260})`}><Litter x={px} floor={900 + (i % 2) * 36} s={1.45} /></g>; })}
        <Txt x={360} y={250} size={92} fill="#c93a2e" o={ramp(c.lt, 2.4, 2.7)}>x 4</Txt>{hero(90, 1020, 1.5, POSE.push(POSE.idle(c.lt)))}
      </g>
    ) },
    // 1-2 lock every door, snap your own key off in the staff entrance
    { at: 1, el: (c) => {
      const a = ramp(c.lt, 0.3, 1.0), snap = 1.4;
      const broken = c.lt > snap, fall = ramp(c.lt, snap, snap + 0.9);
      return (
        <g><rect width={W} height={H} fill="#cbbf9f" /><rect x={150} y={250} width={420} height={640} rx={26} fill="#8c97a3" stroke={INK} strokeWidth={6} /><rect x={176} y={276} width={368} height={588} rx={16} fill="none" stroke="#5d6772" strokeWidth={4} />
          <circle cx={360} cy={560} r={74} fill="#b5bec7" stroke={INK} strokeWidth={5} /><rect x={348} y={560} width={24} height={72} rx={10} fill="#1b1d22" stroke={INK} strokeWidth={3} /><circle cx={360} cy={560} r={22} fill="#1b1d22" />
          {!broken && <g transform={`rotate(${ramp(c.lt, 0.9, snap) * 38} 360 560)`}><Keyy x={lerp(-40, 330, ease(a))} y={560} s={1.5} /></g>}
          {broken && <g><rect x={330} y={553} width={36} height={14} fill="#d9b04a" stroke={INK} strokeWidth={3} transform="rotate(38 360 560)" /><g transform={`translate(${-30 * fall} ${fall * fall * 520}) rotate(${fall * 120} 250 560)`}><Keyy x={250} y={560} s={1.5} /></g></g>}
          <Txt x={360} y={1030} size={60} fill="#c93a2e" o={ramp(c.lt, snap + 0.3, snap + 0.7)}>NOBODY GETS IN.</Txt>
        </g>
      );
    } },
    // 3 ...or nobody being inside
    { at: 3, push: [1, 1.08], el: (c) => (
      <g><ShelvesBack /><Dark o={0.45} color="#07050f" />
        {hero(200, 1070, 1.8, { ...POSE.idle(c.lt), head: 12 })}
        <Eyes x={560} y={470} s={0.8} o={ramp(c.lt, 1.6, 2.1)} blink={1 - 0.9 * ramp(c.lt, 3.0, 3.1) * (1 - ramp(c.lt, 3.1, 3.25))} />
        <Txt x={360} y={190} size={46} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>NOBODY INSIDE, RIGHT?</Txt>
      </g>
    ) },
    // 4-6 the footprints dry up by the bakery; you search every aisle: nothing
    { at: 4, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#c9b99a" line={900} />
        <rect x={20} y={300} width={680} height={170} fill="#8a5a36" stroke={INK} strokeWidth={5} />{[0, 1, 2, 3].map((i) => <g key={i}><ellipse cx={120 + i * 160} cy={420} rx={64} ry={26} fill="#d49a4a" stroke={INK} strokeWidth={4} /><path d={`M ${80 + i * 160} 410 l 14 -8 M ${110 + i * 160} 412 l 14 -8`} stroke="#a96c2a" strokeWidth={4} /></g>)}
        <rect x={250} y={190} width={220} height={70} rx={12} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><Txt x={360} y={238} size={42}>BAKERY</Txt>
        {Array.from({ length: 6 }, (_, i) => <g key={i} opacity={Math.max(0, 1 - i * 0.18) * ramp(c.lt, 0.2 + i * 0.12, 0.4 + i * 0.12)}><ellipse cx={620 - i * 90 + (i % 2 ? 14 : -14)} cy={1020 + (i % 2) * 24} rx={14} ry={9} fill="#4a7ea8" opacity={0.85} /></g>)}
        {hero(180, 1040, 1.8, { ...POSE.walk(c.lt, 0.9, 6), lU: 70, lF: 98 })}
        <Beam x={250} y={820} ang={8} len={640} spread={22} o={0.55} />
        <g opacity={ramp(c.lt, c.s(6), c.s(6) + 0.4)}><Txt x={360} y={1180} size={80} fill="#f6f1e2" ls={4} stroke="#07050f">NOTHING.</Txt></g>
      </g>
    ) },
    // 7-8 emergency lights, built for everyone to leave
    { at: 7, push: [1, 1.05], el: (c) => {
      const bat = 1 - ramp(c.lt, 0, c.d);
      return (
        <g><ShelvesBack />
          {[110, 610].map((lx) => <g key={lx}><circle cx={lx} cy={260} r={130} fill="#ffb347" opacity={0.22 + 0.06 * Math.sin(c.lt * 6)} /><rect x={lx - 34} y={236} width={68} height={42} rx={8} fill="#f6f1e2" stroke={INK} strokeWidth={4} /><circle cx={lx - 16} cy={257} r={8} fill="#ffb347" stroke={INK} strokeWidth={2} /><circle cx={lx + 16} cy={257} r={8} fill="#ffb347" stroke={INK} strokeWidth={2} /></g>)}
          <rect width={W} height={H} fill="#1c1630" opacity={0.28} />
          {hero(150, 1060, 1.7, POSE.idle(c.lt))}
          <g transform="translate(360 960)"><rect x={-230} y={-46} width={460} height={92} rx={14} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-8} size={30} ls={3}>EMERGENCY LIGHTS: 2 HRS</Txt><rect x={-200} y={8} width={400} height={22} rx={8} fill="#f4f8f1" stroke={INK} strokeWidth={3} /><rect x={-197} y={11} width={394 * bat} height={16} rx={6} fill={bat > 0.3 ? '#4aa86a' : '#d9462a'} /></g>
          <Txt x={360} y={190} size={46} fill="#2a2220" ls={3} o={ramp(c.lt, c.s(8), c.s(8) + 0.4)}>NOBODY PLANNED FOR SOMEONE STAYING</Txt>
        </g>
      );
    } },
    // 9-10 the lamps die; supermarkets have no windows
    { at: 9, push: [1, 1.04], el: (c) => {
      const dk = ramp(c.lt, 0.3, c.e(9) + 0.8) * 0.94;
      return (
        <g><ShelvesBack />{hero(360, 1060, 1.9, POSE.idle(c.lt))}<Dark o={dk} />
          <g opacity={ramp(c.lt, c.s(10), c.s(10) + 0.5)}><rect x={150} y={180} width={420} height={420} fill="none" stroke="#d9d4c0" strokeWidth={8} /><line x1={150} y1={180} x2={570} y2={600} stroke="#c93a2e" strokeWidth={14} /><line x1={570} y1={180} x2={150} y2={600} stroke="#c93a2e" strokeWidth={14} /><Txt x={360} y={700} size={96} fill="#f6f1e2" ls={5} stroke="#07050f">NO WINDOWS</Txt></g>
        </g>
      );
    } },
    // 11 a cave
    { at: 11, el: (c) => (
      <g><rect width={W} height={H} fill="#140f1c" />
        <path d="M -20 -20 L 740 -20 L 740 420 Q 600 300 500 380 Q 360 250 220 380 Q 110 300 -20 420 Z" fill="#2a2234" stroke={INK} strokeWidth={5} />
        {[60, 170, 290, 420, 540, 650].map((sx, i) => <polygon key={i} points={`${sx - 28},330 ${sx + 28},330 ${sx + (i % 2 ? 6 : -4)},${430 + rnd(i) * 120}`} fill="#3a2f46" stroke={INK} strokeWidth={4} />)}
        <rect y={900} width={W} height={380} fill="#241c2e" />
        <Beam x={400} y={800} ang={0} len={600} spread={26} o={0.18 + 0.05 * Math.sin(c.lt * 7)} /><circle cx={430} cy={800} r={170} fill="#ffb347" opacity={0.2} />
        {hero(360, 960, 1.9, { ...POSE.idle(c.lt), lU: 60, lF: 84 })}
        <Eyes x={620} y={720} s={0.7} o={ramp(c.lt, 2.4, 2.9)} />
        <Txt x={360} y={250} size={54} fill="#a89ac2" ls={6} o={ramp(c.lt, 0.3, 0.9)}>YOUR OWN CAVE.</Txt>
      </g>
    ) },
    // 12 problem two
    { at: 12, card: true, el: (c) => <ProblemCard n="TWO" title="THE ROT" c={c} icon={<g><Fish x={0} y={0} s={2.2} c="#7fae7a" />{[-70, 0, 70].map((sx, i) => <path key={i} d={`M ${sx} -90 q 14 -26 0 -52 q -14 -26 0 -52`} fill="none" stroke="#6aa04a" strokeWidth={9} strokeLinecap="round" opacity={0.8} transform={`translate(0 ${-tri(c.lt * 1.4 + i * 0.4) * 22})`} />)}</g>} /> },
    // 13-14 fridge five hours, freezer three days
    { at: 13, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={190} size={50} ls={3}>WITHOUT POWER,</Txt><Txt x={360} y={252} size={50} ls={3}>FOOD STAYS SAFE FOR:</Txt>
        <Bar x={60} y={440} w={600} h={78} v={ramp(c.lt, 0.3, 1.3) * (5 / 72)} label="FRIDGE" value="5 HOURS" color="#d9462a" />
        <Bar x={60} y={700} w={600} h={78} v={ramp(c.lt, c.s(14) + 0.2, c.s(14) + 1.6)} label="FULL FREEZER" value="3 DAYS" color="#3f7fb8" />
      </g>
    ) },
    // 15 three tons
    { at: 15, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={250} size={52} fill="#6f7f6a" ls={5}>SEALED IN WITH</Txt>
        <g transform={`translate(360 640) scale(${pop(ramp(c.lt, 0.15, 0.7))})`}><Txt x={0} y={0} size={170} fill="#c93a2e" ls={4}>3 TONS</Txt></g>
        <Steak x={170} y={860 + Math.sin(c.lt * 3) * 6} s={1.1} /><Milk x={360} y={860 + Math.sin(c.lt * 3 + 1) * 6} s={1.1} /><Fish x={550} y={860 + Math.sin(c.lt * 3 + 2) * 6} s={1.2} />
      </g>
    ) },
    // 16-17 the walk-in freezer keeps heat out and everything else in
    { at: 16, push: [1, 1.05], el: (c) => {
      const warm = ramp(c.lt, c.s(17) - 0.3, c.s(17) + 0.4);
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><FreezerDoor />
          {[0, 1, 2].map((i) => { const k = (c.lt * 0.9 + i * 0.33) % 1; const px = lerp(-40, 150, Math.min(1, k * 1.5)) - (k > 0.67 ? (k - 0.67) * 280 : 0); return <g key={i} opacity={warm * (1 - ramp(k, 0.8, 1))}><path d={`M ${px} ${380 + i * 120} l 56 0 l -14 -16 m 14 16 l -14 16`} stroke="#d9462a" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>; })}
          <Txt x={90} y={300} size={30} fill="#d9462a" o={warm}>WARM AIR</Txt>
          {c.lt > c.s(17) + 0.8 && [0, 1, 2].map((i) => <path key={i} d={`M ${300 + i * 90} 780 q 14 -26 0 -52 q -14 -26 0 -52 q 14 -26 0 -52`} fill="none" stroke="#9fd0e8" strokeWidth={8} strokeLinecap="round" opacity={ramp(c.lt, c.s(17) + 0.8, c.s(17) + 1.4) * 0.85} transform={`translate(0 ${-tri(c.lt * 1.3 + i * 0.5) * 18})`} />)}
          <Txt x={360} y={1010} size={46} fill="#2f5e86" o={ramp(c.lt, c.s(17) + 1.0, c.s(17) + 1.5)}>EVERYTHING ELSE STAYS IN</Txt>
        </g>
      );
    } },
    // 18-19 nine hours, one cart; you keep the bread and fruit
    { at: 18, push: [1, 1.04], el: (c) => {
      const x = lerp(-120, 520, ((c.lt * 0.34) % 1));
      const keep = ramp(c.lt, c.s(19), c.s(19) + 0.5);
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} />
          {Array.from({ length: 3 }, (_, r) => Array.from({ length: 6 }, (_, k) => r * 6 + k < Math.floor(ramp(c.lt, 0, c.s(19)) * 18) + 1 && <rect key={`${r}${k}`} x={20 + k * 56} y={810 - r * 52} width={50} height={46} fill={['#7fb3d8', '#c8453d', '#e7d9b5'][r]} stroke={INK} strokeWidth={3} />))}
          <Clock x={600} y={220} s={1.2} min={c.lt * 40} hour={c.lt * 3} label="9 HOURS" t={c.lt} />
          {keep < 0.05 && <g><g transform={`translate(${x + 170} 1100) scale(1.7)`}><path d="M -50 -70 L 50 -70 L 40 -20 L -40 -20 Z" fill="#cdd5da" fillOpacity={0.4} stroke={INK} strokeWidth={3} /><circle cx={-26} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /><circle cx={28} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /></g>{hero(x, 1060, 1.6, POSE.push(POSE.walk(c.lt, 1.4, 12)))}</g>}
          {keep >= 0.05 && <g><rect x={90} y={880} width={540} height={130} rx={12} fill="#e7d9b5" stroke={INK} strokeWidth={5} /><Loaf x={190} y={940} s={1.2} /><Apple x={320} y={950} /><Apple x={380} y={952} c="#e0a52e" /><Apple x={440} y={950} c="#6aa04a" /><Loaf x={540} y={944} s={1} /><g transform={`translate(360 ${860 - keep * 10}) scale(${pop(keep)})`}><rect x={-90} y={-70} width={180} height={52} rx={26} fill="#4aa86a" stroke={INK} strokeWidth={4} /><Txt x={0} y={-33} size={32} fill="#fff" ls={3}>KEEP</Txt></g>{hero(110, 1090, 1.5, POSE.idle(c.lt))}</g>}
        </g>
      );
    } },
    // 20-21 tape the seams: do not open. ever.
    { at: 20, push: [1, 1.04], el: (c) => (
      <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><FreezerDoor />
        {[[190, 360, 80, 8], [530, 360, 80, -8], [190, 560, 80, 8], [530, 640, 80, -8], [360, 230, 330, 0], [360, 890, 330, 0]].map(([tx, ty, w, r], i) => ramp(c.lt, 0.1 + i * 0.12, 0.3 + i * 0.12) > 0 && <Tape key={i} x={tx} y={ty} w={Math.max(1, (w < 100 ? 150 : w) * ramp(c.lt, 0.1 + i * 0.12, 0.3 + i * 0.12))} rot={w < 100 ? (r > 0 ? 80 : -80) : 0} />)}
        <g transform="translate(360 520) rotate(-4)"><rect x={-140} y={-130} width={280} height={250} fill="#f4ecd0" stroke={INK} strokeWidth={4} /><Txt x={0} y={-50} size={52} fill="#c93a2e" o={ramp(c.lt, 1.0, 1.3)}>DO NOT</Txt><Txt x={0} y={14} size={60} fill="#c93a2e" o={ramp(c.lt, 1.3, 1.6)}>OPEN</Txt><g transform={`translate(0 ${96}) scale(${pop(ramp(c.lt, c.s(21), c.s(21) + 0.4))})`}><Txt x={0} y={0} size={70} fill={INK}>EVER.</Txt></g></g>
      </g>
    ) },
    // 22-24 a pyramid of tins you did not build
    { at: 22, push: [1, 1.07], el: (c) => {
      const rows = 5, shown = ramp(c.lt, c.s(23) - 0.2, c.s(23) + 1.4) * 15;
      let k = 0;
      return (
        <g><Interior line={900} />{[0, 1].map((r) => <ShelfRow key={r} x={-20} y={170 + r * 250} w={760} h={120} seed={r + 5} />)}<AisleSign x={360} y={50} n="5" label="PANTRY STAPLES" sub="TINS · JARS" s={1.1} />
          <g transform="translate(470 1000)">{Array.from({ length: rows }, (_, r) => Array.from({ length: rows - r }, (_, i) => { const o = k++ < shown; return o ? <Tin key={`${r}${i}`} x={(i - (rows - r - 1) / 2) * 46} y={-r * 42} s={1.15} c={['#c04b4b', '#3f6db0', '#d9b04a', '#8b9a5b'][(r + i) % 4]} /> : null; }))}</g>
          {hero(150, 1060, 1.8, { ...POSE.idle(c.lt), head: c.lt > c.s(24) ? 10 : 0, lU: c.lt > c.s(24) ? 120 : 8, lF: c.lt > c.s(24) ? 150 : 10 })}
          <g opacity={ramp(c.lt, c.s(24), c.s(24) + 0.4)} transform={`translate(260 760) scale(${pop(ramp(c.lt, c.s(24), c.s(24) + 0.5))})`}><Txt x={0} y={0} size={110} fill="#c93a2e">?!</Txt></g>
        </g>
      );
    } },
    // 25-26 the cameras have no power
    { at: 25, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#cfc09f" line={900} />
        <g transform="translate(360 330)"><rect x={-150} y={-70} width={300} height={140} rx={20} fill="#3a3f48" stroke={INK} strokeWidth={6} /><circle cx={0} cy={0} r={52} fill="#1b1d22" stroke={INK} strokeWidth={6} /><circle cx={0} cy={0} r={26} fill="#2a3a4a" /><circle cx={110} cy={-36} r={10} fill={c.lt < 1.0 ? '#e5392b' : '#4a1d1a'} stroke={INK} strokeWidth={3} /></g>
        <g opacity={ramp(c.lt, c.s(26), c.s(26) + 0.4)}><rect x={90} y={660} width={540} height={150} rx={16} fill="#1b1d22" stroke={INK} strokeWidth={5} /><Txt x={360} y={750} size={76} fill="#c93a2e" ls={6}>NO SIGNAL</Txt></g>
        {hero(130, 1060, 1.7, POSE.idle(c.lt))}
      </g>
    ) },
    // 27-28 every lock is still shut
    { at: 27, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} />
        {[0, 1, 2].map((i) => { const a = pop(ramp(c.lt, 0.3 + i * 0.7, 0.7 + i * 0.7)); return <g key={i}><Door x={60 + i * 220} y={340} w={160} h={560} open={0} sign={['EXIT', 'STAFF', 'DOCK'][i]} color="#6a7580" /><g transform={`translate(${140 + i * 220} 600) scale(${a})`} opacity={clamp(a * 3)}><rect x={-26} y={-8} width={52} height={44} rx={8} fill="#c93a2e" stroke={INK} strokeWidth={4} /><path d="M -14 -8 L -14 -26 A 14 14 0 0 1 14 -26 L 14 -8" fill="none" stroke={INK} strokeWidth={6} /></g></g>; })}
        {hero(660, 1010, 1.4, { ...POSE.idle(c.lt), head: 8 }, true)}
        <Txt x={360} y={190} size={54} fill="#2a2220" ls={4} o={ramp(c.lt, 0.2, 0.6)}>EVERY LOCK: STILL SHUT</Txt>
      </g>
    ) },
    // 29 somebody is living in this building with you
    { at: 29, push: [1, 1.08], el: (c) => (
      <g><ShelvesBack /><Dark o={0.6} color="#07050f" />
        {hero(360, 1090, 1.9, { ...POSE.idle(c.lt), head: 6 })}
        {[[110, 420, 0.9], [600, 560, 0.7], [380, 300, 0.5]].map(([ex, ey, es], i) => <Eyes key={i} x={ex} y={ey} s={es} o={ramp(c.lt, 0.4 + i * 0.9, 0.9 + i * 0.9) * (tri(c.lt * 1.3 + i) > 0.15 ? 1 : 0)} />)}
        <Txt x={360} y={1190} size={50} fill="#d9462a" ls={3} stroke="#07050f" o={ramp(c.lt, 0.5, 1.0)}>SOMEBODY IS IN HERE.</Txt>
      </g>
    ) },
    // 30 fourth morning, onto the roof
    { at: 30, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="dawn" /><Person kind="hero" x={lerp(610, 500, ease(ramp(c.lt, 0.4, c.d - 0.2)))} floor={520} s={0.95} pose={POSE.walk(c.lt, 1.2, 4)} flip />
        <Txt x={360} y={190} size={50} fill="#6a4a36" ls={5} o={ramp(c.lt, 0.3, 0.8)}>DAY 4 · MORNING</Txt></g>
    ) },
    // 31 three nights ago the lot was empty
    { at: 31, el: (c) => (
      <g><LotSide tone="night" lit /><rect width={W} height={H} fill="#5a3a20" opacity={0.18} /><Txt x={360} y={190} size={54} fill="#f6f1e2" ls={5} o={ramp(c.lt, 0.1, 0.5)} stroke="#07050f">THREE NIGHTS AGO</Txt><Txt x={200} y={1040} size={44} fill="#e8e4f2" ls={4} o={ramp(c.lt, 0.6, 1.1)}>EMPTY</Txt></g>
    ) },
    // 32-33 now a hundred and fifty, all facing the doors
    { at: 32, push: [1, 1.05], el: (c) => {
      const n = ramp(c.lt, 0.3, c.d - 0.8);
      return (
        <g><LotSide tone="day" /><Mob n={74} t={c.t} seed={5} shown={n} />
          <g transform="translate(360 330)"><rect x={-190} y={-120} width={380} height={190} rx={22} fill="#2a2220" opacity={0.85} /><Txt x={0} y={40} size={120} fill="#f6f1e2" ls={3}>{Math.round(150 * n)}</Txt><Txt x={0} y={-76} size={30} fill="#d9b04a" ls={5}>NOW IN THE LOT:</Txt></g>
          <g opacity={ramp(c.lt, c.s(33), c.s(33) + 0.4)}><Txt x={360} y={1240} size={44} fill="#f6f1e2" stroke="#07050f" ls={3}>NOT HUNTING YOU.</Txt></g>
        </g>
      );
    } },
    // 34 they are waiting for the store to open
    { at: 34, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="day" /><Mob n={74} t={c.t} seed={5} />
        <g transform={`translate(555 ${420 + Math.sin(c.lt * 3) * 4})`}><line x1={-90} y1={-200} x2={-90} y2={0} stroke={INK} strokeWidth={4} /><line x1={90} y1={-200} x2={90} y2={0} stroke={INK} strokeWidth={4} /><rect x={-120} y={0} width={240} height={100} rx={14} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={68} size={60} fill="#fff" ls={4}>OPEN?</Txt></g>
        <Person kind="hero" x={500} floor={520} s={0.95} pose={POSE.idle(c.lt)} flip />
        <Txt x={360} y={190} size={50} fill="#2a2220" ls={3} o={ramp(c.lt, 0.2, 0.6)}>THEY WANT TO SHOP.</Txt>
      </g>
    ) },
  ],
  cues: [
    [0, 0.2, 'slam'], [0, 1.1, 'thud'], [0, 1.5, 'thud'], [0, 1.9, 'thud'], [0, 2.3, 'thud'], [1, 0.4, 'click'], [1, 1.4, 'snap'], [3, 1.6, 'moan', 2],
    [4, 0.3, 'steps', 3], [6, 0.2, 'ding'], [7, 0.3, 'hiss'], [9, 0.3, 'powerdown'], [10, 0.2, 'moan', 3], [11, 2.4, 'moan', 2],
    [12, 0.1, 'slam'], [15, 0.2, 'thud'], [16, 0.2, 'hiss'], [18, 0.2, 'steps', 4], [19, 0.2, 'clunk'], [20, 0.2, 'scratch', 2.4], [21, 0.1, 'slam'],
    [23, 0.2, 'clink'], [23, 0.5, 'clink'], [23, 0.8, 'clink'], [24, 0.2, 'sting'], [26, 0.2, 'powerdown'], [27, 0.2, 'click'], [27, 1.0, 'click'], [28, 0.4, 'click'],
    [29, 0.6, 'moan', 4], [30, 0.1, 'steps', 2.5], [32, 0, 'moan', 6], [32, 3, 'moan', 6], [34, 0.1, 'moan', 5],
  ],
};
void PAL; void H; void lerp;
