/** Chapter 3: The Regulars (16:9, script v4). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { AisleW, Bucket, Callout, CardW, Car, DarkW, FreezerDoorW, INK, Litter, LotW, Mob, Pallet, Person, POSE, Rings, Roof, Room, SkyW, Speaker, Stove, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../kit.tsx';

const F = 560;
const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Zzz: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>{[0, 1, 2].map((i) => { const k = (t * 0.6 + i * 0.33) % 1; return <text key={i} x={x + k * 30} y={y - k * 90} fontSize={30 + i * 10} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill="#f6f1e2" opacity={1 - k} stroke={INK} strokeWidth={4} paintOrder="stroke">Z</text>; })}</g>
);

export const ch: Chapter = {
  n: 3, label: 'THE REGULARS',
  scenes: [
    // 0-2 the dead do not hunt, they repeat
    { at: 0, push: [1, 1.04], el: (c) => (
      <g><LotW tone="day" /><Mob n={40} t={c.t * 1.2} seed={11} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} still={false} face="mixed" />
        <Callout x={330} y={150} w={520} lines={[{ t: 'THEY DO NOT HUNT', size: 56 }]} o={ramp(c.lt, c.s(1) + 0.1, c.s(1) + 0.5)} />
        <g opacity={ramp(c.lt, c.s(2), c.s(2) + 0.4)} transform={`translate(1000 400) scale(${pop(ramp(c.lt, c.s(2), c.s(2) + 0.5))})`}><circle r={80} fill="none" stroke="#c93a2e" strokeWidth={14} strokeDasharray="400 110" transform={`rotate(${c.lt * 160})`} /><Txt x={0} y={14} size={40} fill="#c93a2e" ls={2} maxW={130}>REPEAT</Txt></g>
      </g>
    ) },
    // 3-4 seven o'clock: they arrive and lean on the shutter all day
    { at: 3, card: true, el: (c) => {
      const x0 = 120, x1 = 1160, hr = (h: number) => lerp(x0, x1, (h - 6) / 18), now = lerp(6.5, 19, ramp(c.lt, 0.2, c.d - 0.3)), hh = Math.floor(now), mm = Math.floor((now % 1) * 60);
      return (
        <g><CardW /><Txt x={640} y={100} size={50} ls={3}>A DAY WITH THE DEAD</Txt>
          <g transform="translate(640 250)"><rect x={-170} y={-70} width={340} height={130} rx={20} fill="#2a2220" /><Txt x={0} y={30} size={104} fill="#7dffb0" ls={4} maxW={300}>{`${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`}</Txt></g>
          <rect x={x0} y={420} width={x1 - x0} height={44} rx={10} fill="#f4f8f1" stroke={INK} strokeWidth={4} /><rect x={hr(7)} y={424} width={(hr(21) - hr(7)) * ramp(now, 7, 21)} height={36} rx={8} fill="#8fa8a0" /><circle cx={hr(Math.min(now, 23.9))} cy={442} r={20} fill="#d9462a" stroke={INK} strokeWidth={4} />
          <g opacity={ramp(c.lt, c.s(3), c.s(3) + 0.4)}><line x1={hr(7)} y1={470} x2={hr(7)} y2={510} stroke={INK} strokeWidth={4} /><Txt x={hr(7)} y={548} size={36} maxW={200}>7 AM · ARRIVE</Txt></g>
          <g opacity={ramp(c.lt, c.s(4), c.s(4) + 0.4)}><Txt x={640} y={385} size={34} fill="#c93a2e" ls={2} maxW={1000}>ALL DAY: LEANING ON THE SHUTTER</Txt></g>
        </g>
      );
    } },
    // 5-8 sundown, the air turns cold, they stop
    { at: 5, push: [1, 1.04], el: (c) => {
      const stopT = c.s(6), cold = ramp(c.lt, 0, c.s(6)), tone = c.lt < c.s(5) + 1.2 ? 'dusk' : 'night';
      return (
        <g><LotW tone={tone} /><Mob n={80} t={Math.min(c.lt, stopT) + 50} seed={7} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} still={false} face="right" />
          <g transform="translate(110 250)"><rect x={-26} y={-110} width={52} height={210} rx={26} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><circle cx={0} cy={102} r={34} fill={cold > 0.6 ? '#4aa0d8' : '#c93a2e'} stroke={INK} strokeWidth={5} /><rect x={-10} y={lerp(-80, 70, cold)} width={20} height={lerp(170, 30, cold)} fill={cold > 0.6 ? '#4aa0d8' : '#c93a2e'} /></g>
          {c.lt > c.s(6) && Array.from({ length: 16 }, (_, i) => <circle key={i} cx={rnd(i) * 700} cy={470 + rnd(i + 2) * 120} r={3} fill="#dff4ff" opacity={0.4 + 0.5 * tri(c.lt * 2 + i)} />)}
          <g opacity={ramp(c.lt, c.s(7), c.s(7) + 0.25)} transform={`translate(520 190) scale(${pop(ramp(c.lt, c.s(7), c.s(7) + 0.4))})`}><Txt x={0} y={0} size={150} fill="#9fd0e8" stroke="#07050f" ls={6} maxW={500}>STOP.</Txt></g>
          <Callout x={1010} y={500} w={420} lines={[{ t: 'STATUES UNTIL MORNING', size: 34 }]} o={ramp(c.lt, c.s(8), c.s(8) + 0.4)} />
        </g>
      );
    } },
    // 9-10 you do not know why; you write it on the wall
    { at: 9, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={500} />
        {['DAY: THEY MOVE', 'NIGHT: THEY STOP', 'COLD = ?'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(10) + i * 0.7, c.s(10) + i * 0.7 + 0.3)}><Txt x={120 + i * 12} y={150 + i * 110} size={58} fill="#c93a2e" anchor="start" ls={2} rot={-3 + i * 2} maxW={700}>{l}</Txt></g>)}
        {hero(1000, F, 1.8, { ...POSE.idle(c.lt), lU: 100 + Math.sin(c.lt * 6) * 10, lF: 120, head: 6 }, true)}
        <Callout x={1010} y={150} w={240} lines={[{ t: 'WHY?', size: 90, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(9), c.s(9) + 0.4)} />
      </g>
    ) },
    // 11 work at night, live on the roof
    { at: 11, push: [1, 1.05], el: (c) => (
      <g><SkyW tone="night" h={520} /><rect y={330} x={-100} width={W + 200} height={200} fill="#2f2b4d" opacity={0.9} />{Array.from({ length: 24 }, (_, i) => <rect key={i} x={i * 56 - 20} y={320 - rnd(i) * 100} width={50} height={300} fill="#26233f" />)}
        <Roof y={500} />{hero(520, 500, 2.0, POSE.idle(c.lt))}<g transform="translate(900 470)"><line x1={0} y1={0} x2={0} y2={-150} stroke={INK} strokeWidth={6} /><polygon points="0,-150 90,-120 0,-90" fill="#c93a2e" stroke={INK} strokeWidth={4} /></g>
        <Callout x={640} y={70} w={700} lines={[{ t: 'NIGHT SHIFT. ROOF HOME.', size: 56 }]} o={ramp(c.lt, 0.3, 0.8)} />
      </g>
    ) },
    // 12-13 camp stove outside; a flame indoors is quiet danger
    { at: 12, push: [1, 1.04], el: (c) => {
      const inn = c.lt > c.s(13);
      return (
        <g>{!inn ? <g><SkyW tone="night" h={520} /><Roof y={500} /><Stove x={820} y={500} s={1.6} t={c.lt} /><circle cx={820} cy={430} r={190} fill="#ffb347" opacity={0.14 + 0.04 * Math.sin(c.lt * 8)} />{hero(480, 500, 1.9, { ...POSE.idle(c.lt), lU: 60 + Math.sin(c.lt * 4) * 10, lF: 90 })}
          <Callout x={640} y={110} w={640} lines={[{ t: 'NEVER INDOORS', size: 64, fill: '#ff8a7a' }]} fill="#fff" o={ramp(c.lt, 0.3, 0.8)} /></g>
          : <g><Room wall="#bfb394" line={500} /><rect x={140} y={50} width={1000} height={450} fill="none" stroke={INK} strokeWidth={8} /><rect x={144} y={54} width={992} height={442} fill="#8fd08a" opacity={ramp(c.lt, c.s(13), c.d - 0.3) * 0.55} />
            {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={200 + i * 100 + Math.sin(c.lt * 2 + i) * 20} cy={460 - ((c.lt * 70 + i * 90) % 380)} r={26 + (i % 3) * 10} fill="#d4f2c8" opacity={0.28} />)}<Stove x={300} y={500} s={1.4} t={c.lt} />
            <g transform="translate(780 440) rotate(-82)"><Person kind="hero" x={0} floor={66 * 1.6} s={1.6} pose={POSE.slump()} /></g><Zzz x={680} y={400} t={c.lt} />
            <g transform="translate(1040 130)"><polygon points="0,-60 60,40 -60,40" fill="#f0c43a" stroke={INK} strokeWidth={6} strokeLinejoin="round" /><Txt x={0} y={26} size={60} fill={INK}>!</Txt></g></g>}
        </g>
      );
    } },
    // 14 day four: taps run dry
    { at: 14, push: [1, 1.05], el: (c) => {
      const drops = [0.4, 1.3, 2.4].map((t0) => ramp(c.lt, t0, t0 + 0.6));
      return (
        <g><Room wall="#cfd6d2" line={520} tiles={false} />
          <g transform="translate(420 20)"><rect x={0} y={80} width={80} height={380} fill="#aab4bb" stroke={INK} strokeWidth={5} /><path d="M 0 110 L 260 110 Q 320 110 320 180 L 320 220 L 270 220 L 270 180 Q 270 160 250 160 L 0 160 Z" fill="#c4cdd2" stroke={INK} strokeWidth={5} strokeLinejoin="round" /><circle cx={140} cy={80} r={28} fill="#c93a2e" stroke={INK} strokeWidth={5} />
            {drops.map((d, i) => d > 0 && d < 1 && <path key={i} d="M 0 -18 Q 12 0 0 10 Q -12 0 0 -18 Z" transform={`translate(295 ${250 + d * d * 260})`} fill="#6bb6e8" stroke={INK} strokeWidth={3} opacity={1 - d * 0.3} />)}</g>
          <Callout x={1000} y={200} w={380} lines={[{ t: 'DAY 4', size: 80 }]} o={ramp(c.lt, 0.1, 0.5)} /><Callout x={1000} y={400} w={380} lines={[{ t: 'NO WATER.', size: 56, fill: '#ff8a7a' }]} o={ramp(c.lt, 2.6, 3.0)} />
        </g>
      );
    } },
    // 15 eight pallets of bottled water
    { at: 15, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={500} />
        {Array.from({ length: 8 }, (_, i) => { const a = pop(ramp(c.lt, 0.2 + i * 0.22, 0.55 + i * 0.22)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -200})`}><Pallet x={170 + (i % 4) * 190} floor={290 + Math.floor(i / 4) * 230} s={0.95} color="#6bb6e8" /></g>; })}
        {hero(1100, F, 1.7, POSE.idle(c.lt), true)}<Callout x={1090} y={190} w={320} lines={[{ t: 'DRINKING IS EASY', size: 30, fill: '#d9b04a' }, { t: '8 PALLETS', size: 56 }]} o={ramp(c.lt, 1.8, 2.3)} />
      </g>
    ) },
    // 16-17 the toilet problem: bucket, bag, cat litter
    { at: 16, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={500} /><Litter x={920} floor={F - 20} s={1.7} />
        <g transform={`translate(${lerp(920, 400, ease(ramp(c.lt, c.s(17) + 0.2, c.s(17) + 1.4)))} 520)`} opacity={ramp(c.lt, c.s(17), c.s(17) + 0.3)}><Bucket x={0} y={0} s={1.5} /><path d="M -50 -40 Q -80 -90 -30 -86 Q 0 -110 30 -86 Q 76 -90 50 -40 Z" fill="#2c2f36" stroke={INK} strokeWidth={4} /></g>
        <Callout x={330} y={150} w={460} lines={[{ t: 'THE PROBLEM', size: 56, fill: '#ff8a7a' }]} o={ramp(c.lt, 0.2, 0.6)} />{hero(180, F, 1.6, POSE.idle(c.lt))}
        <Callout x={920} y={140} w={340} lines={[{ t: 'AISLE 13', size: 30, fill: '#d9b04a' }, { t: 'CAT LITTER', size: 46 }]} o={ramp(c.lt, c.s(17), c.s(17) + 0.4)} />
      </g>
    ) },
    // 18-19 day five: Rhea's van parks perfectly between the lines
    { at: 18, push: [1, 1.04], el: (c) => {
      const x = lerp(-240, 380, ease(ramp(c.lt, 0.2, c.s(19) + 0.2)));
      return (
        <g><LotW tone="dusk" /><rect x={225} y={490} width={10} height={100} fill="#f2eee2" /><rect x={535} y={490} width={10} height={100} fill="#f2eee2" />
          <g data-enter="1" transform={`translate(${x} ${F}) scale(1.15)`}><rect x={-140} y={-130} width={270} height={100} rx={14} fill="#ece6d4" stroke={INK} strokeWidth={4.5} /><rect x={90} y={-120} width={36} height={44} fill="#cfe3ee" stroke={INK} strokeWidth={3} /><Txt x={-30} y={-80} size={28} fill={INK} ls={2} maxW={160}>OAKLINE</Txt>{[-84, 78].map((wx) => <g key={wx}><circle cx={wx} cy={-24} r={24} fill="#2c2a2a" stroke={INK} strokeWidth={4} /><circle cx={wx} cy={-24} r={10} fill="#a9a9a9" stroke={INK} strokeWidth={3} /></g>)}</g>
          <Callout x={330} y={150} w={500} lines={[{ t: "DAY 5 · RHEA'S VAN", size: 46 }]} o={ramp(c.lt, 0.1, 0.5)} />
        </g>
      );
    } },
    // 20 the engine runs until the tank is empty
    { at: 20, push: [1, 1.05], el: (c) => {
      const fuel = 1 - ramp(c.lt, 0.3, c.d - 0.3);
      return (
        <g><LotW tone="dusk" /><rect x={225} y={490} width={10} height={100} fill="#f2eee2" /><rect x={535} y={490} width={10} height={100} fill="#f2eee2" /><Car x={380} floor={F} s={1.15} exhaust={1} t={c.lt} color="#ece6d4" />
          <g transform="translate(1000 260)"><circle r={110} fill="#f6f1e2" stroke={INK} strokeWidth={7} /><text x={-62} y={52} fontSize={34} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill={INK}>E</text><text x={42} y={52} fontSize={34} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill={INK}>F</text><line x1={0} y1={20} x2={Math.cos(Math.PI - fuel * Math.PI) * 78} y2={20 - Math.sin(fuel * Math.PI) * 78} stroke="#c93a2e" strokeWidth={8} strokeLinecap="round" /><circle cx={0} cy={20} r={10} fill={INK} /></g>
        </g>
      );
    } },
    // 21 the driver's door is open and the seat is empty
    { at: 21, el: (c) => (
      <g><LotW tone="dusk" /><rect x={225} y={490} width={10} height={100} fill="#f2eee2" /><rect x={535} y={490} width={10} height={100} fill="#f2eee2" /><Car x={380} floor={F} s={1.15} door={ramp(c.lt, 0.3, 1.1)} color="#ece6d4" />
        <Callout x={330} y={300} w={320} lines={[{ t: 'EMPTY.', size: 70 }]} o={ramp(c.lt, 1.2, 1.7)} />{hero(760, F, 1.2, { ...POSE.idle(c.lt), head: 8 }, true)}
      </g>
    ) },
    // 22-23 a child's drawing of a house; a window smashed from the inside
    { at: 22, push: [1, 1.04], el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#2f2b3a" /><rect y={400} x={-100} width={W + 200} height={400} fill="#3c3848" stroke={INK} strokeWidth={6} />
        <g transform="translate(360 250) rotate(-6)"><rect x={-190} y={-170} width={380} height={330} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><polygon points="-100,-10 0,-110 100,-10" fill="#c93a2e" stroke={INK} strokeWidth={4} /><rect x={-90} y={-10} width={180} height={120} fill="#f0c43a" stroke={INK} strokeWidth={4} /><rect x={-22} y={30} width={44} height={80} fill="#8a5a36" stroke={INK} strokeWidth={3} /><circle cx={-140} cy={-120} r={24} fill="#f0c43a" stroke={INK} strokeWidth={3} /></g>
        <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.4)}><rect x={760} y={60} width={420} height={420} fill="#9fb4c4" opacity={0.35} stroke={INK} strokeWidth={6} />{Array.from({ length: 9 }, (_, i) => <line key={i} x1={970} y1={260} x2={970 + Math.cos(i * 0.7) * 190} y2={260 + Math.sin(i * 0.7) * 190} stroke="#fff" strokeWidth={4} opacity={0.8} />)}{Array.from({ length: 6 }, (_, i) => <polygon key={i} points="0,0 18,8 8,24" transform={`translate(${740 - i * 40} ${500 + (i % 2) * 40}) rotate(${i * 50})`} fill="#cfe3ee" stroke={INK} strokeWidth={2} />)}</g>
        <Callout x={970} y={540} w={420} lines={[{ t: 'SMASHED FROM INSIDE.', size: 34 }]} o={ramp(c.lt, c.s(23), c.s(23) + 0.5)} />
      </g>
    ) },
    // 24-25 every night at nine: three knocks, a pause, three more
    { at: 24, push: [1, 1.04], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(25) + o);
      return (
        <g><Room wall="#4a4660" floor="#2e2a3e" line={500} /><DarkW o={0.35} />
          <Callout x={1030} y={150} w={340} lines={[{ t: '9:00 PM', size: 70, fill: '#7dffb0' }]} />
          {hits.map((h, i) => <Rings key={i} x={640} y={300} t0={h} lt={c.lt} />)}{hero(250, F, 1.8, { ...POSE.idle(c.lt), head: 10 })}
        </g>
      );
    } },
    // 26-27 not from the doors: from the walk-in freezer
    { at: 26, push: [1, 1.05], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(27) + o);
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><DarkW o={0.25} /><FreezerDoorW taped={1} />
          {hits.map((h, i) => <Rings key={i} x={620} y={290} t0={h} lt={c.lt} color="#9fd0e8" />)}{hero(200, F, 1.6, { ...POSE.idle(c.lt), head: 8 })}
          <Callout x={1050} y={290} w={380} lines={[{ t: 'KNOCKING', size: 50 }, { t: 'FROM INSIDE.', size: 50 }]} o={ramp(c.lt, c.s(27), c.s(27) + 0.5)} />
        </g>
      );
    } },
    // 28-30 a hand an inch from the handle, every night, and you take it back
    { at: 28, push: [1, 1.05], el: (c) => {
      const reach = 0.5 + 0.5 * Math.sin(c.lt * 1.6 - 1.2);
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><DarkW o={0.2} /><FreezerDoorW taped={1} x={620} />
          <g><line x1={140} y1={380} x2={lerp(500, 880, reach) } y2={lerp(380, 340, reach)} stroke={INK} strokeWidth={12} strokeLinecap="round" /><circle cx={lerp(500, 880, reach)} cy={lerp(380, 340, reach)} r={26} fill="#f6e6c8" stroke={INK} strokeWidth={5} /></g>
          <Callout x={330} y={180} w={460} lines={[{ t: 'AN INCH FROM THE HANDLE', size: 34 }]} o={ramp(c.lt, c.s(28), c.s(28) + 0.4)} />
          <Callout x={330} y={290} w={460} lines={[{ t: 'EVERY NIGHT, YOU TAKE IT BACK', size: 30, fill: '#d9b04a' }]} o={ramp(c.lt, c.s(29), c.s(29) + 0.4)} />
          <Callout x={330} y={440} w={500} lines={[{ t: 'RULE TWO', size: 34, fill: '#ff8a7a' }, { t: 'ONLY WHEN THERE IS NO OTHER WAY', size: 30 }]} fill="#fff" o={ramp(c.lt, c.s(30), c.s(30) + 0.5)} />
        </g>
      );
    } },
    // 31 day nine, asleep on dog beds, the ceiling turns white
    { at: 31, push: [1, 1.04], el: (c) => {
      const flash = ramp(c.lt, c.d - 1.0, c.d - 0.2);
      return (
        <g><Room wall="#a89c86" line={440} /><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1c1630" opacity={0.5} />
          {[[420, 520, '#b8453d'], [640, 540, '#3f6db0'], [860, 520, '#d9b04a'], [520, 480, '#6aa6a3'], [760, 470, '#8b5aa6']].map(([bx, by, col], i) => <g key={i}><ellipse cx={bx as number} cy={by as number} rx={120} ry={44} fill={col as string} stroke={INK} strokeWidth={5} /><ellipse cx={bx as number} cy={(by as number) - 8} rx={80} ry={24} fill="#f6f1e2" opacity={0.45} /></g>)}
          <g transform="translate(580 470) rotate(-84)"><Person kind="hero" x={0} floor={66 * 1.5} s={1.5} pose={POSE.slump()} /></g><Zzz x={700} y={360} t={c.lt} />
          <rect x={390} y={20} width={500} height={60} rx={10} fill="#4a4560" stroke={INK} strokeWidth={5} /><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#fff" opacity={flash} />
        </g>
      );
    } },
    // 32 every light, every freezer
    { at: 32, push: [1, 1.06], el: (c) => (
      <g><AisleW lightsOn={1} pushed={ramp(c.lt, 0, c.d) * 0.4} />{[[300, 70], [980, 70]].map(([sx, sy], i) => <Speaker key={i} x={sx} y={sy} t={c.lt} on={0.5} />)}
        <Callout x={640} y={480} w={640} lines={[{ t: 'EVERYTHING ON AT ONCE', size: 48 }]} o={ramp(c.lt, 0.4, 0.9)} /></g>
    ) },
    // 33-34 the intercom wakes up
    { at: 33, push: [1, 1.05], el: (c) => (
      <g><AisleW lightsOn={1} /><Speaker x={640} y={60} t={c.lt} on={ramp(c.lt, c.s(33) + 0.2, c.s(33) + 0.6)} />
        <g transform={`translate(640 450) scale(${pop(ramp(c.lt, c.s(34), c.s(34) + 0.6))})`} opacity={ramp(c.lt, c.s(34), c.s(34) + 0.3)}><rect x={-330} y={-80} width={660} height={160} rx={20} fill="#fff" stroke={INK} strokeWidth={6} /><Txt x={0} y={-4} size={60} fill="#c93a2e" ls={3} maxW={600}>ATTENTION,</Txt><Txt x={0} y={52} size={60} fill="#c93a2e" ls={3} maxW={600}>SHOPPERS</Txt></g>
        {hero(250, F, 1.7, { ...POSE.idle(c.lt), head: 8 })}
      </g>
    ) },
    // 35-36 the store is now closing; it says your name
    { at: 35, push: [1, 1.05], el: (c) => (
      <g><AisleW lightsOn={1} /><Speaker x={640} y={60} t={c.lt} on={0.9} />
        <g transform="translate(700 450)"><rect x={-360} y={-90} width={720} height={180} rx={20} fill="#fff" stroke={INK} strokeWidth={6} /><Txt x={0} y={-10} size={50} fill={INK} ls={2} maxW={660}>THE STORE IS NOW CLOSING</Txt><g opacity={ramp(c.lt, c.s(36), c.s(36) + 0.4)}><Txt x={0} y={52} size={44} fill="#c93a2e" ls={3} maxW={660}>...AND THEN YOUR NAME.</Txt></g></g>
        {hero(250, F, 1.7, { ...POSE.idle(c.lt), head: 8 })}
        <g opacity={ramp(c.lt, c.s(36), c.s(36) + 0.5)} transform="translate(250 330)"><rect x={-90} y={-26} width={180} height={50} rx={8} fill="#f6f1e2" stroke={INK} strokeWidth={4} /><Txt x={0} y={9} size={26} fill="#6f7f6a" ls={2} maxW={160}>HELLO, I AM...</Txt></g>
      </g>
    ) },
    // 37 two hundred and fifty heads turn at once
    { at: 37, push: [1, 1.04], el: (c) => (
      <g><LotW tone="night" lit /><Mob n={80} t={c.t} seed={9} face={c.lt > 0.5 ? 'right' : 'left'} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} />
        <g transform={`translate(330 170) scale(${pop(ramp(c.lt, 0.3, 0.9))})`}><Txt x={0} y={0} size={130} fill="#ff6a5a" stroke="#07050f" maxW={400}>250</Txt><Txt x={0} y={80} size={34} fill="#f6f1e2" ls={4} stroke="#07050f" maxW={300}>HEADS TURN</Txt></g>
      </g>
    ) },
  ],
  cues: [
    [0, 0, 'moan', 6], [2, 0.3, 'whoosh'], [3, 0.2, 'moan', 3], [6, 0.1, 'hiss'], [7, 0.0, 'slam'], [8, 0.3, 'gas', 3], [10, 0.4, 'scratch', 2],
    [11, 0.3, 'whoosh'], [12, 0.3, 'gas', 3], [13, 0.2, 'slam'], [14, 0.5, 'drip'], [14, 1.5, 'drip'], [14, 2.6, 'drip'], [15, 0.2, 'thud'], [15, 0.6, 'thud'], [15, 1.0, 'thud'], [15, 1.4, 'thud'],
    [17, 0.2, 'clunk'], [18, 0.2, 'engine', 3.8], [19, 1.0, 'click'], [20, 0.1, 'engine', 5], [21, 0.3, 'creak'], [23, 0.4, 'snap'],
    [24, 0.3, 'ding'], [25, 0.1, 'knock'], [25, 0.55, 'knock'], [25, 1.0, 'knock'], [25, 1.9, 'knock'], [25, 2.35, 'knock'], [25, 2.8, 'knock'],
    [27, 0.1, 'knock'], [27, 0.55, 'knock'], [27, 1.0, 'knock'], [27, 1.9, 'knock'], [27, 2.35, 'knock'], [27, 2.8, 'knock'],
    [29, 0.2, 'click'], [30, 0.2, 'slam'], [31, 0.1, 'moan', 3], [32, 0.0, 'surge'], [33, 0.2, 'ding'], [34, 0.3, 'toot'], [37, 0.15, 'sting'], [37, 0.3, 'moan', 4],
  ],
};
void AisleW; void Bucket; void CardW; void Roof; void W; void H; void ease;
