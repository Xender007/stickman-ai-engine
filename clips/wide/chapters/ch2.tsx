/** Chapter 2: The Cold Chain (16:9, script v4). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Beam, Callout, CardW, Clock, DarkW, Door, Eyes, FreezerDoorW, INK, Keyy, Litter, LotW, Mob, PAL, Person, POSE, Room, ShelvesW, Tin, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../kit.tsx';
import { BarW, GlassDoors, ProblemW } from '../parts.tsx';

const F = 560;
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
const Envelope: React.FC<{ s?: number; rot?: number }> = ({ s = 1, rot = 0 }) => (
  <g transform={`rotate(${rot}) scale(${s})`}><rect x={-80} y={-52} width={160} height={104} fill="#efe2bd" stroke={INK} strokeWidth={4} /><path d="M -80 -52 L 0 8 L 80 -52" fill="none" stroke={INK} strokeWidth={3.5} /><circle cx={0} cy={8} r={15} fill="#c93a2e" stroke={INK} strokeWidth={3} /></g>
);

export const ch: Chapter = {
  n: 2, label: 'THE COLD CHAIN',
  scenes: [
    // 0 slam the fire exit, four pallets of litter against it
    { at: 0, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={480} /><Door x={260} y={90} w={230} h={390} open={lerp(0.3, 0, ease(ramp(c.lt, 0.2, 0.7)))} />
        {[600, 760, 920, 1080].map((px, i) => { const a = pop(ramp(c.lt, 1.0 + i * 0.4, 1.35 + i * 0.4)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -260})`}><Litter x={px} floor={F - (i % 2) * 26} s={1.05} /></g>; })}
        {hero(110, F, 1.6, POSE.push(POSE.idle(c.lt)))}<Callout x={640} y={130} w={200} lines={[{ t: 'x 4', size: 84, fill: '#ff8a7a' }]} o={ramp(c.lt, 2.4, 2.7)} />
      </g>
    ) },
    // 1-2 lock every door, snap your own key off in the staff entrance
    { at: 1, el: (c) => {
      const snap = 1.4, broken = c.lt > snap, fall = ramp(c.lt, snap, snap + 0.9);
      return (
        <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#cbbf9f" />
          <g transform="translate(400 300) scale(0.8)"><rect x={-210} y={-320} width={420} height={640} rx={26} fill="#8c97a3" stroke={INK} strokeWidth={6} /><rect x={-184} y={-294} width={368} height={588} rx={16} fill="none" stroke="#5d6772" strokeWidth={4} /><circle cx={0} cy={0} r={74} fill="#b5bec7" stroke={INK} strokeWidth={5} /><rect x={-12} y={0} width={24} height={72} rx={10} fill="#1b1d22" stroke={INK} strokeWidth={3} /><circle cx={0} cy={0} r={22} fill="#1b1d22" />
            {!broken && <g transform={`rotate(${ramp(c.lt, 0.9, snap) * 38})`}><Keyy x={lerp(-340, -30, ease(ramp(c.lt, 0.3, 1.0)))} y={0} s={1.5} /></g>}
            {broken && <g><rect x={-30} y={-7} width={36} height={14} fill="#d9b04a" stroke={INK} strokeWidth={3} transform="rotate(38)" /><g transform={`translate(${-30 * fall} ${fall * fall * 520}) rotate(${fall * 120} -110 0)`}><Keyy x={-110} y={0} s={1.5} /></g></g>}</g>
          <Callout x={1000} y={280} w={440} lines={[{ t: 'NOBODY', size: 70, fill: '#ff8a7a' }, { t: 'GETS IN.', size: 70, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(2), c.s(2) + 0.4)} />
        </g>
      );
    } },
    // 3 ...the same as nobody being inside
    { at: 3, push: [1, 1.06], el: (c) => (
      <g><ShelvesW /><DarkW o={0.5} />{hero(300, F, 1.8, { ...POSE.idle(c.lt), head: 12 })}
        <Eyes x={960} y={250} s={0.9} o={ramp(c.lt, 1.6, 2.1)} blink={1 - 0.9 * ramp(c.lt, 3.0, 3.1) * (1 - ramp(c.lt, 3.1, 3.25))} />
        <Callout x={760} y={110} w={640} lines={[{ t: 'NOBODY INSIDE, RIGHT?', size: 54 }]} o={ramp(c.lt, 0.2, 0.6)} />
      </g>
    ) },
    // 4-6 footprints dry up by the bakery; you search every aisle: nothing
    { at: 4, push: [1, 1.05], el: (c) => (
      <g><Room wall="#c9b99a" line={480} />
        <rect x={400} y={190} width={820} height={160} fill="#8a5a36" stroke={INK} strokeWidth={5} />{[0, 1, 2, 3, 4].map((i) => <g key={i}><ellipse cx={500 + i * 160} cy={290} rx={60} ry={24} fill="#d49a4a" stroke={INK} strokeWidth={4} /></g>)}
        <rect x={640} y={80} width={200} height={64} rx={12} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><Txt x={740} y={126} size={40}>BAKERY</Txt>
        {Array.from({ length: 7 }, (_, i) => <g key={i} opacity={Math.max(0, 1 - i * 0.15) * ramp(c.lt, 0.2 + i * 0.12, 0.4 + i * 0.12)}><ellipse cx={120 + i * 100} cy={520 + (i % 2) * 20} rx={14} ry={9} fill="#4a7ea8" opacity={0.85} /></g>)}
        {hero(300, F, 1.8, { ...POSE.walk(c.lt, 0.9, 6), lU: 70, lF: 98 })}<Beam x={400} y={400} ang={8} len={700} spread={22} o={0.5} />
        <Callout x={1000} y={450} w={320} lines={[{ t: 'NOTHING.', size: 70 }]} o={ramp(c.lt, c.s(6), c.s(6) + 0.4)} />
      </g>
    ) },
    // 7-8 emergency lights: built for everyone to leave
    { at: 7, push: [1, 1.04], el: (c) => {
      const bat = 1 - ramp(c.lt, 0, c.d);
      return (
        <g><ShelvesW />{[200, 1080].map((lx) => <g key={lx}><circle cx={lx} cy={90} r={110} fill="#ffb347" opacity={0.22 + 0.06 * Math.sin(c.lt * 6)} /><rect x={lx - 34} y={66} width={68} height={42} rx={8} fill="#f6f1e2" stroke={INK} strokeWidth={4} /></g>)}
          <rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1c1630" opacity={0.28} />{hero(300, F, 1.7, POSE.idle(c.lt))}
          <g transform="translate(910 250)"><rect x={-250} y={-60} width={500} height={120} rx={14} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={0} y={-16} size={30} ls={3} maxW={460}>EMERGENCY LIGHTS: 2 HRS</Txt><rect x={-210} y={4} width={420} height={24} rx={8} fill="#f4f8f1" stroke={INK} strokeWidth={3} /><rect x={-207} y={7} width={414 * bat} height={18} rx={6} fill={bat > 0.3 ? '#4aa86a' : '#d9462a'} /></g>
          <Callout x={910} y={420} w={520} lines={[{ t: 'NOBODY PLANNED FOR', size: 34, fill: '#d9b04a' }, { t: 'SOMEONE STAYING', size: 46 }]} o={ramp(c.lt, c.s(8), c.s(8) + 0.4)} />
        </g>
      );
    } },
    // 9-10 the lamps die; supermarkets have no windows
    { at: 9, push: [1, 1.03], el: (c) => (
      <g><ShelvesW />{hero(300, F, 1.9, POSE.idle(c.lt))}<DarkW o={ramp(c.lt, 0.3, c.e(9) + 0.8) * 0.94} />
        <g opacity={ramp(c.lt, c.s(10), c.s(10) + 0.5)}><rect x={540} y={60} width={200} height={200} fill="none" stroke="#d9d4c0" strokeWidth={8} /><line x1={540} y1={60} x2={740} y2={260} stroke="#c93a2e" strokeWidth={12} /><line x1={740} y1={60} x2={540} y2={260} stroke="#c93a2e" strokeWidth={12} /><Txt x={900} y={430} size={84} fill="#f6f1e2" ls={5} stroke="#07050f" maxW={560}>NO WINDOWS</Txt></g>
      </g>
    ) },
    // 11 a cave
    { at: 11, el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#140f1c" /><path d="M -100 -100 L 1380 -100 L 1380 220 Q 1150 150 980 210 Q 760 120 560 210 Q 340 140 160 210 Q 0 160 -100 220 Z" fill="#2a2234" stroke={INK} strokeWidth={5} />
        {[100, 280, 460, 640, 820, 1000, 1180].map((sx, i) => <polygon key={i} points={`${sx - 28},190 ${sx + 28},190 ${sx + (i % 2 ? 6 : -4)},${250 + rnd(i) * 90}`} fill="#3a2f46" stroke={INK} strokeWidth={4} />)}
        <rect y={500} x={-100} width={W + 200} height={300} fill="#241c2e" /><Beam x={560} y={400} ang={0} len={600} spread={26} o={0.18 + 0.05 * Math.sin(c.lt * 7)} /><circle cx={600} cy={420} r={170} fill="#ffb347" opacity={0.2} />
        {hero(500, F, 1.9, { ...POSE.idle(c.lt), lU: 60, lF: 84 })}<Eyes x={1100} y={380} s={0.8} o={ramp(c.lt, 2.4, 2.9)} />
        <Callout x={900} y={130} w={460} lines={[{ t: 'YOUR OWN CAVE.', size: 56, fill: '#c7b8e8' }]} o={ramp(c.lt, 0.3, 0.9)} />
      </g>
    ) },
    // 12 problem two
    { at: 12, card: true, el: (c) => <ProblemW n="TWO" title="THE ROT" lt={c.lt} icon={<g><Fish x={0} y={20} s={1.4} c="#7fae7a" />{[-50, 0, 50].map((sx, i) => <path key={i} d={`M ${sx} -30 q 10 -18 0 -36 q -10 -18 0 -36`} fill="none" stroke="#6aa04a" strokeWidth={7} strokeLinecap="round" opacity={0.8} transform={`translate(0 ${-tri(c.lt * 1.4 + i * 0.4) * 16})`} />)}</g>} /> },
    // 13-14 fridge five hours, freezer three days
    { at: 13, card: true, el: (c) => (
      <g><CardW /><Txt x={640} y={110} size={48} ls={3} maxW={1100}>WITHOUT POWER, FOOD STAYS SAFE FOR:</Txt>
        <BarW x={140} y={250} w={1000} h={80} v={ramp(c.lt, 0.3, 1.3) * (5 / 72)} label="FRIDGE" value="5 HOURS" color="#d9462a" />
        <BarW x={140} y={450} w={1000} h={80} v={ramp(c.lt, c.s(14) + 0.2, c.s(14) + 1.6)} label="FULL FREEZER" value="3 DAYS" color="#3f7fb8" /></g>
    ) },
    // 15 three tons
    { at: 15, card: true, el: (c) => (
      <g><CardW /><Txt x={640} y={120} size={48} fill="#6f7f6a" ls={5}>SEALED IN WITH</Txt>
        <g transform={`translate(640 330) scale(${pop(ramp(c.lt, 0.15, 0.7))})`}><Txt x={0} y={0} size={190} fill="#c93a2e" ls={4} maxW={900}>3 TONS</Txt></g>
        <Steak x={340} y={470 + Math.sin(c.lt * 3) * 6} s={1.1} /><Milk x={640} y={470 + Math.sin(c.lt * 3 + 1) * 6} s={1.1} /><Fish x={940} y={470 + Math.sin(c.lt * 3 + 2) * 6} s={1.2} /></g>
    ) },
    // 16-17 the walk-in freezer keeps heat out and everything else in
    { at: 16, push: [1, 1.04], el: (c) => {
      const warm = ramp(c.lt, c.s(17) - 0.3, c.s(17) + 0.4);
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><FreezerDoorW />
          {[0, 1, 2].map((i) => { const k = (c.lt * 0.9 + i * 0.33) % 1; const px = lerp(60, 400, Math.min(1, k * 1.5)) - (k > 0.67 ? (k - 0.67) * 500 : 0); return <g key={i} opacity={warm * (1 - ramp(k, 0.8, 1))}><path d={`M ${px} ${200 + i * 100} l 56 0 l -14 -16 m 14 16 l -14 16`} stroke="#d9462a" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>; })}
          <Txt x={200} y={150} size={36} fill="#d9462a" o={warm} maxW={300}>WARM AIR</Txt>
          {c.lt > c.s(17) + 0.8 && [0, 1, 2].map((i) => <path key={i} d={`M ${560 + i * 70} 420 q 14 -26 0 -52 q -14 -26 0 -52 q 14 -26 0 -52`} fill="none" stroke="#9fd0e8" strokeWidth={8} strokeLinecap="round" opacity={ramp(c.lt, c.s(17) + 0.8, c.s(17) + 1.4) * 0.85} transform={`translate(0 ${-tri(c.lt * 1.3 + i * 0.5) * 16})`} />)}
          <Callout x={1030} y={300} w={380} lines={[{ t: 'EVERYTHING ELSE', size: 36, fill: '#9fd0e8' }, { t: 'STAYS IN', size: 56 }]} o={ramp(c.lt, c.s(17) + 1.0, c.s(17) + 1.5)} />
        </g>
      );
    } },
    // 18-19 nine hours, one cart; you keep the bread and fruit
    { at: 18, push: [1, 1.03], el: (c) => {
      const x = lerp(-120, 900, ((c.lt * 0.34) % 1)), keep = ramp(c.lt, c.s(19), c.s(19) + 0.5);
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} />
          {Array.from({ length: 3 }, (_, r) => Array.from({ length: 8 }, (_, k) => r * 8 + k < Math.floor(ramp(c.lt, 0, c.s(19)) * 24) + 1 && <rect key={`${r}${k}`} x={30 + k * 62} y={420 - r * 54} width={56} height={48} fill={['#7fb3d8', '#c8453d', '#e7d9b5'][r]} stroke={INK} strokeWidth={3} />))}
          <g transform="translate(1110 160)"><Clock x={0} y={0} s={1.1} min={c.lt * 40} hour={c.lt * 3} t={c.lt} /></g><Txt x={1110} y={290} size={34} fill={INK} maxW={200}>9 HOURS</Txt>
          {keep < 0.05 && <g><g transform={`translate(${x + 170} ${F}) scale(1.7)`}><path d="M -50 -70 L 50 -70 L 40 -20 L -40 -20 Z" fill="#cdd5da" fillOpacity={0.4} stroke={INK} strokeWidth={3} /><circle cx={-26} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /><circle cx={28} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /></g>{hero(x, F, 1.6, POSE.push(POSE.walk(c.lt, 1.4, 12)))}</g>}
          {keep >= 0.05 && <g><rect x={420} y={380} width={540} height={130} rx={12} fill="#e7d9b5" stroke={INK} strokeWidth={5} /><Loaf x={520} y={440} s={1.2} /><Apple x={650} y={450} /><Apple x={710} y={452} c="#e0a52e" /><Apple x={770} y={450} c="#6aa04a" /><Loaf x={870} y={444} s={1} /><g transform={`translate(690 ${330 - keep * 10}) scale(${pop(keep)})`}><rect x={-90} y={-40} width={180} height={52} rx={26} fill="#4aa86a" stroke={INK} strokeWidth={4} /><Txt x={0} y={-3} size={32} fill="#fff" ls={3}>KEEP</Txt></g>{hero(240, F, 1.5, POSE.idle(c.lt))}</g>}
        </g>
      );
    } },
    // 20-21 tape the seams: do not open. ever.
    { at: 20, push: [1, 1.03], el: (c) => (
      <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><FreezerDoorW taped={ramp(c.lt, 0.1, 0.8)} />
        <g transform="translate(620 300) rotate(-4)"><rect x={-150} y={-100} width={300} height={200} fill="#f4ecd0" stroke={INK} strokeWidth={4} /><Txt x={0} y={-30} size={50} fill="#c93a2e" o={ramp(c.lt, 1.0, 1.3)}>DO NOT</Txt><Txt x={0} y={30} size={60} fill="#c93a2e" o={ramp(c.lt, 1.3, 1.6)}>OPEN</Txt></g>
        <g transform={`translate(1010 300) scale(${pop(ramp(c.lt, c.s(21), c.s(21) + 0.4))})`}><Txt x={0} y={0} size={120} fill="#ff8a7a" stroke="#07050f" ls={4} maxW={420}>EVER.</Txt></g>
      </g>
    ) },
    // 22-24 a pyramid of tins you did not build
    { at: 22, push: [1, 1.05], el: (c) => {
      const rows = 5, shown = ramp(c.lt, c.s(23) - 0.2, c.s(23) + 1.4) * 15;
      let k = 0;
      return (
        <g><ShelvesW rows={2} />
          <g transform="translate(860 560)">{Array.from({ length: rows }, (_, r) => Array.from({ length: rows - r }, (_, i) => { const o = k++ < shown; return o ? <Tin key={`${r}${i}`} x={(i - (rows - r - 1) / 2) * 52} y={-r * 46} s={1.3} c={['#c04b4b', '#3f6db0', '#d9b04a', '#8b9a5b'][(r + i) % 4]} /> : null; }))}</g>
          {hero(330, F, 1.8, { ...POSE.idle(c.lt), head: c.lt > c.s(24) ? 10 : 0, lU: c.lt > c.s(24) ? 120 : 8, lF: c.lt > c.s(24) ? 150 : 10 })}
          <g opacity={ramp(c.lt, c.s(24), c.s(24) + 0.4)} transform={`translate(520 260) scale(${pop(ramp(c.lt, c.s(24), c.s(24) + 0.5))})`}><Txt x={0} y={0} size={110} fill="#c93a2e" stroke="#fff">?!</Txt></g>
        </g>
      );
    } },
    // 25-26 the cameras have no power
    { at: 25, push: [1, 1.05], el: (c) => (
      <g><Room wall="#cfc09f" line={500} />
        <g transform="translate(640 170)"><rect x={-170} y={-80} width={340} height={160} rx={20} fill="#3a3f48" stroke={INK} strokeWidth={6} /><circle cx={0} cy={0} r={58} fill="#1b1d22" stroke={INK} strokeWidth={6} /><circle cx={0} cy={0} r={30} fill="#2a3a4a" /><circle cx={125} cy={-40} r={10} fill={c.lt < 1.0 ? '#e5392b' : '#4a1d1a'} stroke={INK} strokeWidth={3} /></g>
        <Callout x={640} y={400} w={500} lines={[{ t: 'NO SIGNAL', size: 80, fill: '#ff8a7a' }]} fill="#1b1d22" o={ramp(c.lt, c.s(26), c.s(26) + 0.4)} />{hero(220, F, 1.7, POSE.idle(c.lt))}
      </g>
    ) },
    // 27-28 every lock is still shut
    { at: 27, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={500} />
        {[0, 1, 2].map((i) => { const a = pop(ramp(c.lt, 0.3 + i * 0.7, 0.7 + i * 0.7)); return <g key={i}><Door x={100 + i * 290} y={120} w={190} h={380} open={0} sign={['EXIT', 'STAFF', 'DOCK'][i]} color="#6a7580" /><g transform={`translate(${195 + i * 290} 330) scale(${a})`} opacity={clamp(a * 3)}><rect x={-26} y={-8} width={52} height={44} rx={8} fill="#c93a2e" stroke={INK} strokeWidth={4} /><path d="M -14 -8 L -14 -26 A 14 14 0 0 1 14 -26 L 14 -8" fill="none" stroke={INK} strokeWidth={6} /></g></g>; })}
        {hero(1130, F, 1.5, { ...POSE.idle(c.lt), head: 8 }, true)}<Callout x={1090} y={230} w={340} lines={[{ t: 'EVERY LOCK:', size: 36, fill: '#d9b04a' }, { t: 'STILL SHUT', size: 54 }]} o={ramp(c.lt, 0.3, 0.7)} />
      </g>
    ) },
    // 29 somebody is living in this building with you
    { at: 29, push: [1, 1.06], el: (c) => (
      <g><ShelvesW /><DarkW o={0.6} />{hero(260, F, 1.8, { ...POSE.idle(c.lt), head: 6 })}
        {[[640, 220, 0.9], [1020, 330, 0.8], [900, 130, 0.5]].map(([ex, ey, es], i) => <Eyes key={i} x={ex} y={ey} s={es} o={ramp(c.lt, 0.4 + i * 0.9, 0.9 + i * 0.9) * (tri(c.lt * 1.3 + i) > 0.15 ? 1 : 0)} />)}
        <Callout x={900} y={480} w={540} lines={[{ t: 'SOMEBODY IS IN HERE.', size: 50, fill: '#ff8a7a' }]} o={ramp(c.lt, 0.5, 1.0)} />
      </g>
    ) },
    // 30-32 third night: the envelope against a flashlight, then back in the apron
    { at: 30, push: [1, 1.05], el: (c) => {
      const back = ramp(c.lt, c.s(32), c.s(32) + 0.8);
      return (
        <g><Room wall="#3a3650" floor="#26233a" line={500} /><DarkW o={0.35} />
          {hero(430, F, 1.9, { ...POSE.idle(c.lt), lU: lerp(150, 40, back), lF: lerp(160, 70, back), head: -10 })}
          <g transform={`translate(${lerp(560, 440, back)} ${lerp(190, 400, back)})`}><circle r={130} fill="#fff6c8" opacity={0.25 * (1 - back)} /><Envelope s={1.1} rot={-8} /></g>
          <Beam x={430} y={330} ang={-35} len={400} spread={14} o={0.5 * (1 - back)} />
          <Callout x={1000} y={170} w={420} lines={[{ t: 'THIRD NIGHT', size: 30, fill: '#d9b04a' }]} o={ramp(c.lt, 0.2, 0.6)} />
          <Callout x={1000} y={300} w={460} lines={[{ t: 'ALMOST READABLE...', size: 44 }]} o={ramp(c.lt, c.s(31), c.s(31) + 0.4) * (1 - ramp(c.lt, c.s(32), c.s(32) + 0.2))} />
          <Callout x={1000} y={300} w={460} lines={[{ t: 'BACK IN THE APRON.', size: 44 }]} o={ramp(c.lt, c.s(32) + 0.2, c.s(32) + 0.6)} />
        </g>
      );
    } },
    // 33-34 day ten, she said; not before
    { at: 33, card: true, el: (c) => (
      <g><CardW />
        <Txt x={640} y={110} size={50} ls={4} maxW={1100}>THE ENVELOPE WAITS FOR DAY TEN</Txt>
        {Array.from({ length: 10 }, (_, i) => { const a = ramp(c.lt, 0.3 + i * 0.06, 0.5 + i * 0.06), today = i === 2; return <g key={i} opacity={a}><rect x={80 + i * 112} y={230} width={100} height={130} rx={10} fill={i === 9 ? '#c93a2e' : '#fff'} stroke={INK} strokeWidth={4} /><Txt x={130 + i * 112} y={320} size={60} fill={i === 9 ? '#fff' : INK} maxW={80}>{String(i + 1)}</Txt>{i < 2 && <path d={`M ${96 + i * 112} 246 L ${164 + i * 112} 344 M ${164 + i * 112} 246 L ${96 + i * 112} 344`} stroke="#c93a2e" strokeWidth={8} strokeLinecap="round" />}{today && <circle cx={130 + i * 112} cy={410} r={14} fill="#d9b04a" stroke={INK} strokeWidth={3} />}</g>; })}
        <g transform="translate(1140 470)"><Envelope s={0.8} rot={6} /></g>
        <Callout x={400} y={500} w={560} lines={[{ t: 'DAY TEN, SHE SAID.', size: 52 }]} o={ramp(c.lt, c.s(33), c.s(33) + 0.4)} />
      </g>
    ) },
    // 35 fourth morning, onto the roof
    { at: 35, push: [1, 1.05], el: (c) => (
      <g><LotW tone="dawn" /><Person kind="hero" x={lerp(1250, 1000, ease(ramp(c.lt, 0.4, c.d - 0.2)))} floor={186} s={0.75} pose={POSE.walk(c.lt, 1.2, 4)} flip />
        <Callout x={330} y={150} w={460} lines={[{ t: 'DAY 4 · MORNING', size: 50 }]} o={ramp(c.lt, 0.3, 0.8)} /></g>
    ) },
    // 36 three nights ago the lot was empty
    { at: 36, el: (c) => (
      <g><LotW tone="night" lit /><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#5a3a20" opacity={0.18} />
        <Callout x={330} y={150} w={500} lines={[{ t: 'THREE NIGHTS AGO', size: 50 }]} o={ramp(c.lt, 0.1, 0.5)} /><Callout x={300} y={500} w={300} lines={[{ t: 'EMPTY', size: 54 }]} o={ramp(c.lt, 0.6, 1.1)} /></g>
    ) },
    // 37-38 now a hundred and fifty, all facing the doors
    { at: 37, push: [1, 1.04], el: (c) => {
      const n = ramp(c.lt, 0.3, c.d - 0.8);
      return (
        <g><LotW tone="day" /><Mob n={74} t={c.t} seed={5} shown={n} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} />
          <Callout x={330} y={150} w={460} lines={[{ t: 'NOW IN THE LOT:', size: 30, fill: '#d9b04a' }, { t: String(Math.round(150 * n)), size: 90 }]} />
          <Callout x={1010} y={500} w={440} lines={[{ t: 'NOT HUNTING YOU.', size: 40 }]} o={ramp(c.lt, c.s(38), c.s(38) + 0.4)} />
        </g>
      );
    } },
    // 39 they are waiting for the store to open
    { at: 39, push: [1, 1.05], el: (c) => (
      <g><LotW tone="day" /><Mob n={74} t={c.t} seed={5} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} />
        <g transform={`translate(960 ${60 + Math.sin(c.lt * 3) * 4})`}><line x1={-90} y1={-200} x2={-90} y2={0} stroke={INK} strokeWidth={4} /><line x1={90} y1={-200} x2={90} y2={0} stroke={INK} strokeWidth={4} /><rect x={-120} y={0} width={240} height={90} rx={14} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={64} size={56} fill="#fff" ls={4} maxW={200}>OPEN?</Txt></g>
        <Callout x={330} y={150} w={500} lines={[{ t: 'THEY WANT TO SHOP.', size: 46 }]} o={ramp(c.lt, 0.2, 0.6)} />
      </g>
    ) },
  ],
  cues: [
    [0, 0.2, 'slam'], [0, 1.1, 'thud'], [0, 1.5, 'thud'], [0, 1.9, 'thud'], [0, 2.3, 'thud'], [1, 0.4, 'click'], [1, 1.4, 'snap'], [3, 1.6, 'moan', 2],
    [4, 0.3, 'steps', 3], [6, 0.2, 'ding'], [7, 0.3, 'hiss'], [9, 0.3, 'powerdown'], [10, 0.2, 'moan', 3], [11, 2.4, 'moan', 2],
    [12, 0.1, 'slam'], [15, 0.2, 'thud'], [16, 0.2, 'hiss'], [18, 0.2, 'steps', 4], [19, 0.2, 'clunk'], [20, 0.2, 'scratch', 2.4], [21, 0.1, 'slam'],
    [23, 0.2, 'clink'], [23, 0.5, 'clink'], [23, 0.8, 'clink'], [24, 0.2, 'sting'], [26, 0.2, 'powerdown'], [27, 0.2, 'click'], [27, 1.0, 'click'], [28, 0.4, 'click'],
    [29, 0.6, 'moan', 4], [30, 0.4, 'click'], [32, 0.4, 'whoosh'], [34, 0.3, 'ding'], [35, 0.1, 'steps', 2.5], [37, 0, 'moan', 6], [37, 3, 'moan', 6], [39, 0.1, 'moan', 5],
  ],
};
void CardW; void PAL; void GlassDoors; void W; void H; void rnd; void Keyy;
