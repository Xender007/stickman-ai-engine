/** Chapter 3: The Regulars (script v3). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Aisle, AisleSign, Bucket, CardBg, Car, Dark, INK, Interior, Litter, Pallet, Parapet, Person, POSE, Shopcart, Sky, Stove, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../lib.tsx';
import { LotSide, Mob } from '../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Zzz: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>{[0, 1, 2].map((i) => { const k = (t * 0.6 + i * 0.33) % 1; return <text key={i} x={x + k * 30} y={y - k * 90} fontSize={30 + i * 10} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill="#f6f1e2" opacity={1 - k} stroke={INK} strokeWidth={4} paintOrder="stroke">Z</text>; })}</g>
);
const Speaker: React.FC<{ x: number; y: number; t: number; on: number }> = ({ x, y, t, on }) => (
  <g><rect x={x - 46} y={y - 36} width={92} height={72} rx={12} fill="#2a2220" stroke={INK} strokeWidth={5} /><circle cx={x} cy={y} r={26} fill="#555" stroke="#aaa" strokeWidth={4} /><circle cx={x} cy={y} r={9} fill="#222" />
    {[0, 1, 2].map((k) => { const r = (t * 1.1 + k / 3) % 1; return <circle key={k} cx={x} cy={y} r={40 + r * 300} fill="none" stroke="#ffe6a8" strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * on} />; })}</g>
);
const Rings: React.FC<{ x: number; y: number; t0: number; lt: number; color?: string }> = ({ x, y, t0, lt, color = '#c93a2e' }) => {
  const k = ramp(lt, t0, t0 + 0.6);
  return k > 0 && k < 1 ? <g opacity={1 - k}><circle cx={x} cy={y} r={30 + k * 170} fill="none" stroke={color} strokeWidth={9} /><circle cx={x} cy={y} r={14 + k * 100} fill="none" stroke={color} strokeWidth={6} /></g> : null;
};

export const ch: Chapter = {
  n: 3, label: 'THE REGULARS',
  scenes: [
    // 0-2 the dead do not hunt, they repeat
    { at: 0, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="day" /><Mob n={40} t={c.t * 1.2} seed={11} x0={40} x1={370} still={false} face="mixed" />
        <g opacity={ramp(c.lt, c.s(1) + 0.1, c.s(1) + 0.5)}><Txt x={360} y={200} size={64} fill="#2a2220" ls={4}>THEY DO NOT HUNT</Txt></g>
        <g opacity={ramp(c.lt, c.s(2), c.s(2) + 0.4)} transform={`translate(190 520) scale(${pop(ramp(c.lt, c.s(2), c.s(2) + 0.5))})`}><circle r={86} fill="none" stroke="#c93a2e" strokeWidth={14} strokeDasharray="420 120" transform={`rotate(${c.lt * 160})`} /><polygon points="86,-30 112,-6 66,-6" fill="#c93a2e" transform={`rotate(${c.lt * 160})`} /><Txt x={0} y={14} size={44} fill="#c93a2e" ls={2}>REPEAT</Txt></g>
      </g>
    ) },
    // 3-4 seven o'clock: they arrive and lean on the shutter all day
    { at: 3, card: true, el: (c) => {
      const x0 = 70, x1 = 650, hr = (h: number) => lerp(x0, x1, (h - 6) / 18);
      const now = lerp(6.5, 19, ramp(c.lt, 0.2, c.d - 0.3));
      const hh = Math.floor(now), mm = Math.floor((now % 1) * 60);
      return (
        <g><CardBg /><Txt x={360} y={190} size={50} ls={3}>A DAY WITH THE DEAD</Txt>
          <g transform="translate(360 380)"><rect x={-150} y={-70} width={300} height={130} rx={20} fill="#2a2220" /><Txt x={0} y={30} size={104} fill="#7dffb0" ls={4}>{`${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`}</Txt></g>
          <rect x={x0} y={680} width={x1 - x0} height={44} rx={10} fill="#f4f8f1" stroke={INK} strokeWidth={4} /><rect x={hr(7)} y={684} width={(hr(21) - hr(7)) * ramp(now, 7, 21)} height={36} rx={8} fill="#8fa8a0" /><circle cx={hr(Math.min(now, 23.9))} cy={702} r={20} fill="#d9462a" stroke={INK} strokeWidth={4} />
          <g opacity={ramp(c.lt, c.s(3), c.s(3) + 0.4)}><line x1={hr(7)} y1={730} x2={hr(7)} y2={790} stroke={INK} strokeWidth={4} /><Txt x={hr(7)} y={832} size={40}>7 AM</Txt><Txt x={hr(7)} y={874} size={30} fill="#6f7f6a" ls={2}>ARRIVE</Txt></g>
          <g opacity={ramp(c.lt, c.s(4), c.s(4) + 0.4)}><Txt x={360} y={650} size={36} fill="#c93a2e" ls={2}>ALL DAY: LEANING ON THE SHUTTER</Txt></g>
        </g>
      );
    } },
    // 5-8 sundown, the air turns cold, they stop
    { at: 5, push: [1, 1.06], el: (c) => {
      const stopT = c.s(6);
      const cold = ramp(c.lt, 0, c.s(6));
      const tone = c.lt < c.s(5) + 1.2 ? 'dusk' : 'night';
      return (
        <g><LotSide tone={tone} /><Mob n={80} t={Math.min(c.lt, stopT) + 50} seed={7} x0={60} x1={400} f0={930} f1={1190} still={false} face="right" />
          <g transform="translate(110 340)"><rect x={-26} y={-120} width={52} height={230} rx={26} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><circle cx={0} cy={112} r={34} fill={cold > 0.6 ? '#4aa0d8' : '#c93a2e'} stroke={INK} strokeWidth={5} /><rect x={-10} y={lerp(-90, 80, cold)} width={20} height={lerp(190, 30, cold)} fill={cold > 0.6 ? '#4aa0d8' : '#c93a2e'} /><Txt x={0} y={170} size={30} fill="#f6f1e2" stroke="#07050f">COLD</Txt></g>
          {c.lt > c.s(6) && Array.from({ length: 16 }, (_, i) => <circle key={i} cx={rnd(i) * 440} cy={920 + rnd(i + 2) * 270} r={3} fill="#dff4ff" opacity={0.4 + 0.5 * tri(c.lt * 2 + i)} />)}
          <g opacity={ramp(c.lt, c.s(7), c.s(7) + 0.25)} transform={`translate(360 300) scale(${pop(ramp(c.lt, c.s(7), c.s(7) + 0.4))})`}><Txt x={0} y={0} size={170} fill="#9fd0e8" stroke="#07050f" ls={6}>STOP.</Txt></g>
          <g opacity={ramp(c.lt, c.s(8), c.s(8) + 0.4)}><Txt x={360} y={1250} size={44} fill="#f6f1e2" stroke="#07050f" ls={3}>STATUES UNTIL MORNING</Txt></g>
        </g>
      );
    } },
    // 9-10 you do not know why; you write it on the wall
    { at: 9, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} />
        {['DAY: THEY MOVE', 'NIGHT: THEY STOP', 'COLD = ?'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(10) + i * 0.7, c.s(10) + i * 0.7 + 0.3)}><Txt x={150 + i * 12} y={330 + i * 110} size={52} fill="#c93a2e" anchor="start" ls={2} rot={-3 + i * 2}>{l}</Txt></g>)}
        {hero(560, 1010, 1.8, { ...POSE.idle(c.lt), lU: 100 + Math.sin(c.lt * 6) * 10, lF: 120, head: 6 }, true)}
        <Txt x={360} y={1160} size={90} fill="#2a2220" ls={4} o={ramp(c.lt, c.s(9), c.s(9) + 0.4)}>WHY?</Txt>
      </g>
    ) },
    // 11 work at night, live on the roof
    { at: 11, push: [1, 1.06], el: (c) => (
      <g><Sky tone="night" h={1010} /><rect y={760} width={W} height={260} fill="#2f2b4d" opacity={0.9} />{Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 62} y={700 - rnd(i) * 120} width={56} height={400} fill="#26233f" />)}
        <Parapet y={1010} />{hero(300, 1000, 2.3, POSE.idle(c.lt))}<g transform="translate(560 940)"><line x1={0} y1={0} x2={0} y2={-150} stroke={INK} strokeWidth={6} /><polygon points="0,-150 90,-120 0,-90" fill="#c93a2e" stroke={INK} strokeWidth={4} /></g>
        <Txt x={360} y={250} size={56} fill="#f6f1e2" ls={4} stroke="#07050f" o={ramp(c.lt, 0.3, 0.8)}>NIGHT SHIFT. ROOF HOME.</Txt>
      </g>
    ) },
    // 12-13 camp stove outside; a flame indoors is quiet danger
    { at: 12, push: [1, 1.05], el: (c) => {
      const inn = c.lt > c.s(13);
      return (
        <g>{!inn ? <g><Sky tone="night" h={1010} /><Parapet y={1010} /><Stove x={470} y={1000} s={2.1} t={c.lt} /><circle cx={470} cy={930} r={200} fill="#ffb347" opacity={0.14 + 0.04 * Math.sin(c.lt * 8)} />{hero(230, 1000, 2.1, { ...POSE.idle(c.lt), lU: 60 + Math.sin(c.lt * 4) * 10, lF: 90 })}</g>
          : <g><Interior wall="#bfb394" line={900} /><rect x={40} y={200} width={640} height={700} fill="none" stroke={INK} strokeWidth={8} /><rect x={44} y={204} width={632} height={692} fill="#8fd08a" opacity={ramp(c.lt, c.s(13), c.d - 0.3) * 0.55} />
            {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={100 + i * 80 + Math.sin(c.lt * 2 + i) * 20} cy={800 - ((c.lt * 70 + i * 90) % 560)} r={26 + (i % 3) * 10} fill="#d4f2c8" opacity={0.28} />)}<Stove x={150} y={900} s={1.4} t={c.lt} />
            <g transform="translate(470 770) rotate(-82)"><Person kind="hero" x={0} floor={66 * 1.6} s={1.6} pose={POSE.slump()} /></g><Zzz x={380} y={720} t={c.lt} />
            <g transform="translate(360 190)"><polygon points="0,-90 90,60 -90,60" fill="#f0c43a" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><Txt x={0} y={42} size={90} fill={INK}>!</Txt></g></g>}
          <g opacity={ramp(c.lt, 0.2, 0.6) * (inn ? 0 : 1)} transform={`translate(360 300) scale(${pop(ramp(c.lt, 0.3, 0.8))})`}><rect x={-250} y={-60} width={500} height={120} rx={14} fill="#fff" stroke={INK} strokeWidth={5} /><Txt x={0} y={26} size={80} fill="#c93a2e" ls={4}>NEVER INDOORS</Txt></g>
        </g>
      );
    } },
    // 14 day four: taps run dry
    { at: 14, push: [1, 1.06], el: (c) => {
      const drops = [0.4, 1.3, 2.4].map((t0) => ramp(c.lt, t0, t0 + 0.6));
      return (
        <g><Interior wall="#cfd6d2" line={960} tiles={false} />
          <rect x={300} y={300} width={90} height={430} fill="#aab4bb" stroke={INK} strokeWidth={5} /><path d="M 300 330 L 560 330 Q 620 330 620 400 L 620 440 L 570 440 L 570 400 Q 570 380 550 380 L 300 380 Z" fill="#c4cdd2" stroke={INK} strokeWidth={5} strokeLinejoin="round" /><rect x={560} y={430} width={70} height={26} fill="#aab4bb" stroke={INK} strokeWidth={4} /><circle cx={440} cy={300} r={28} fill="#c93a2e" stroke={INK} strokeWidth={5} />
          {drops.map((d, i) => d > 0 && d < 1 && <path key={i} d="M 0 -18 Q 12 0 0 10 Q -12 0 0 -18 Z" transform={`translate(595 ${470 + d * d * 420})`} fill="#6bb6e8" stroke={INK} strokeWidth={3} opacity={1 - d * 0.3} />)}
          <Txt x={360} y={190} size={80} fill="#2a2220" ls={4}>DAY 4</Txt><g opacity={ramp(c.lt, 2.6, 3.0)}><Txt x={360} y={1110} size={64} fill="#c93a2e" ls={3}>NO WATER.</Txt></g>
        </g>
      );
    } },
    // 15 eight pallets of bottled water
    { at: 15, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} />
        {Array.from({ length: 8 }, (_, i) => { const a = pop(ramp(c.lt, 0.2 + i * 0.22, 0.55 + i * 0.22)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -200})`}><Pallet x={110 + (i % 4) * 170} floor={620 + Math.floor(i / 4) * 280} s={0.9} color="#6bb6e8" /></g>; })}
        <Txt x={360} y={190} size={48} ls={3}>DRINKING IS EASY</Txt><g opacity={ramp(c.lt, 1.8, 2.3)}><Txt x={360} y={1110} size={80} fill="#2f7fb8">8 PALLETS</Txt></g>{hero(90, 1180, 1.4, POSE.idle(c.lt))}
      </g>
    ) },
    // 16-17 the toilet problem: bucket, bag, cat litter
    { at: 16, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} /><AisleSign x={360} y={60} n="13" label="PET CARE" sub="CAT LITTER" s={1.15} /><Litter x={540} floor={900} s={1.8} />
        <g transform={`translate(${lerp(540, 220, ease(ramp(c.lt, c.s(17) + 0.2, c.s(17) + 1.4)))} 840)`} opacity={ramp(c.lt, c.s(17), c.s(17) + 0.3)}><Bucket x={0} y={0} s={1.5} /><path d="M -50 -40 Q -80 -90 -30 -86 Q 0 -110 30 -86 Q 76 -90 50 -40 Z" fill="#2c2f36" stroke={INK} strokeWidth={4} /></g>
        <Txt x={180} y={430} size={56} fill="#c93a2e" ls={3} o={ramp(c.lt, 0.2, 0.6)}>THE PROBLEM</Txt>{hero(380, 1080, 1.6, POSE.idle(c.lt))}
      </g>
    ) },
    // 18-19 day five: Rhea's van parks perfectly between the lines
    { at: 18, push: [1, 1.05], el: (c) => {
      const x = lerp(-240, 215, ease(ramp(c.lt, 0.2, c.s(19) + 0.2)));
      return (
        <g><LotSide tone="dusk" /><rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" />
          <g transform={`translate(${x} 1150) scale(1.15)`}><rect x={-140} y={-130} width={270} height={100} rx={14} fill="#ece6d4" stroke={INK} strokeWidth={4.5} /><path d="M -140 -76 L -140 -30 L 130 -30 L 130 -76 Z" fill="#ece6d4" stroke={INK} strokeWidth={4.5} /><rect x={90} y={-120} width={36} height={44} fill="#cfe3ee" stroke={INK} strokeWidth={3} /><Txt x={-30} y={-80} size={28} fill={PAL_T} ls={2}>OAKLINE</Txt>{[-84, 78].map((wx) => <g key={wx}><circle cx={wx} cy={-24} r={24} fill="#2c2a2a" stroke={INK} strokeWidth={4} /><circle cx={wx} cy={-24} r={10} fill="#a9a9a9" stroke={INK} strokeWidth={3} /></g>)}</g>
          <Txt x={360} y={200} size={46} ls={4} fill="#f6f1e2" stroke="#07050f" o={ramp(c.lt, 0.1, 0.5)}>DAY 5 · RHEA'S VAN</Txt>
        </g>
      );
    } },
    // 20 the engine runs until the tank is empty
    { at: 20, push: [1, 1.06], el: (c) => {
      const fuel = 1 - ramp(c.lt, 0.3, c.d - 0.3);
      return (
        <g><LotSide tone="dusk" /><rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" />
          <Car x={215} floor={1150} s={1.15} exhaust={1} t={c.lt} color="#ece6d4" />
          <g transform="translate(530 330)"><circle r={110} fill="#f6f1e2" stroke={INK} strokeWidth={7} /><text x={-62} y={52} fontSize={34} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill={INK}>E</text><text x={42} y={52} fontSize={34} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill={INK}>F</text><line x1={0} y1={20} x2={Math.cos(Math.PI - fuel * Math.PI) * 78} y2={20 - Math.sin(fuel * Math.PI) * 78} stroke="#c93a2e" strokeWidth={8} strokeLinecap="round" /><circle cx={0} cy={20} r={10} fill={INK} /></g>
        </g>
      );
    } },
    // 21 the driver's door is open and the seat is empty
    { at: 21, el: (c) => (
      <g><LotSide tone="dusk" /><rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" />
        <Car x={215} floor={1150} s={1.15} door={ramp(c.lt, 0.3, 1.1)} color="#ece6d4" />
        <Txt x={215} y={1000} size={60} fill="#f6f1e2" stroke="#07050f" o={ramp(c.lt, 1.2, 1.7)}>EMPTY</Txt>
        {hero(560, 1190, 1.3, { ...POSE.idle(c.lt), head: 8 }, true)}
      </g>
    ) },
    // 22-23 a child's drawing of a house, a window smashed from the inside
    { at: 22, push: [1, 1.07], el: (c) => (
      <g><rect width={W} height={H} fill="#2f2b3a" /><rect y={760} width={W} height={520} fill="#3c3848" stroke={INK} strokeWidth={6} />
        <g transform="translate(250 560) rotate(-6)"><rect x={-170} y={-150} width={340} height={300} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><polygon points="-90,-10 0,-100 90,-10" fill="#c93a2e" stroke={INK} strokeWidth={4} /><rect x={-80} y={-10} width={160} height={110} fill="#f0c43a" stroke={INK} strokeWidth={4} /><rect x={-20} y={30} width={40} height={70} fill="#8a5a36" stroke={INK} strokeWidth={3} /><circle cx={-130} cy={-110} r={22} fill="#f0c43a" stroke={INK} strokeWidth={3} /></g>
        <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.4)}><rect x={400} y={160} width={300} height={380} fill="#9fb4c4" opacity={0.35} stroke={INK} strokeWidth={6} />{Array.from({ length: 9 }, (_, i) => <line key={i} x1={550} y1={350} x2={550 + Math.cos(i * 0.7) * 150} y2={350 + Math.sin(i * 0.7) * 170} stroke="#fff" strokeWidth={4} opacity={0.8} />)}{Array.from({ length: 6 }, (_, i) => <polygon key={i} points="0,0 18,8 8,24" transform={`translate(${380 - i * 38} ${620 + (i % 2) * 40}) rotate(${i * 50})`} fill="#cfe3ee" stroke={INK} strokeWidth={2} />)}</g>
        <Txt x={360} y={1060} size={50} fill="#f6f1e2" ls={3} stroke="#07050f" o={ramp(c.lt, c.s(23), c.s(23) + 0.5)}>SMASHED FROM INSIDE.</Txt>
      </g>
    ) },
    // 24-25 every night at nine: three knocks, a pause, three more
    { at: 24, push: [1, 1.05], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(25) + o);
      return (
        <g><Interior wall="#4a4660" floor="#2e2a3e" line={900} /><Dark o={0.35} color="#07050f" />
          <g transform="translate(360 190)"><rect x={-200} y={-60} width={400} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={30} size={74} fill="#7dffb0" ls={6}>9:00 PM</Txt></g>
          {hits.map((h, i) => <Rings key={i} x={360} y={640} t0={h} lt={c.lt} />)}{hero(150, 1050, 1.7, { ...POSE.idle(c.lt), head: 10 })}
        </g>
      );
    } },
    // 26-27 not from the doors: from the walk-in freezer
    { at: 26, push: [1, 1.07], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(27) + o);
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><Dark o={0.25} color="#07050f" />
          <g><rect x={160} y={200} width={400} height={720} fill="#5a6672" stroke={INK} strokeWidth={5} /><rect x={190} y={230} width={340} height={660} fill="#b7c3cf" stroke={INK} strokeWidth={5} /><rect x={206} y={246} width={308} height={628} fill="none" stroke="#3a3d42" strokeWidth={16} />
            {[[190, 360, 8], [530, 360, -8], [190, 560, 8], [530, 640, -8]].map(([tx, ty, r], i) => <g key={i} transform={`translate(${tx} ${ty}) rotate(${(r as number) > 0 ? 80 : -80})`}><rect x={-75} y={-13} width={150} height={26} fill="#e4d49a" stroke={INK} strokeWidth={2.5} /></g>)}
            <rect x={270} y={290} width={180} height={60} fill="#f4ecd0" stroke={INK} strokeWidth={3} /><Txt x={360} y={332} size={34} fill="#c93a2e">DO NOT OPEN</Txt></g>
          {hits.map((h, i) => <Rings key={i} x={360} y={560} t0={h} lt={c.lt} color="#9fd0e8" />)}
          <g opacity={ramp(c.lt, c.s(27), c.s(27) + 0.5)}><Txt x={360} y={1060} size={56} fill="#f6f1e2" stroke="#07050f" ls={3}>KNOCKING FROM INSIDE.</Txt></g>{hero(110, 1120, 1.5, { ...POSE.idle(c.lt), head: 8 })}
        </g>
      );
    } },
    // 28 day nine, asleep on dog beds, the ceiling turns white
    { at: 28, push: [1, 1.05], el: (c) => {
      const flash = ramp(c.lt, c.d - 1.0, c.d - 0.2);
      return (
        <g><Interior wall="#a89c86" line={900} /><rect width={W} height={H} fill="#1c1630" opacity={0.5} />
          {[[170, 860, '#b8453d'], [330, 880, '#3f6db0'], [490, 860, '#d9b04a'], [260, 800, '#6aa6a3'], [420, 790, '#8b5aa6']].map(([bx, by, col], i) => <g key={i}><ellipse cx={bx as number} cy={by as number} rx={110} ry={44} fill={col as string} stroke={INK} strokeWidth={5} /><ellipse cx={bx as number} cy={(by as number) - 8} rx={72} ry={24} fill="#f6f1e2" opacity={0.45} /></g>)}
          <g transform="translate(250 750) rotate(-84)"><Person kind="hero" x={0} floor={66 * 1.55} s={1.55} pose={POSE.slump()} /></g><Zzz x={360} y={640} t={c.lt} />
          <rect x={110} y={120} width={500} height={70} rx={10} fill="#4a4560" stroke={INK} strokeWidth={5} /><rect width={W} height={H} fill="#fff" opacity={flash} />
        </g>
      );
    } },
    // 29 every light, every freezer
    { at: 29, push: [1, 1.07], el: (c) => (
      <g><Aisle vp={[360, 540]} pushed={ramp(c.lt, 0, c.d) * 0.5} lightsOn={1} />{[[120, 220], [600, 220]].map(([sx, sy], i) => <Speaker key={i} x={sx} y={sy} t={c.lt} on={0.5} />)}
        <Txt x={360} y={1090} size={54} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.4, 0.9)}>EVERYTHING ON AT ONCE</Txt></g>
    ) },
    // 30-31 the intercom wakes up
    { at: 30, push: [1, 1.07], el: (c) => (
      <g><Aisle vp={[360, 540]} lightsOn={1} /><Speaker x={360} y={150} t={c.lt} on={ramp(c.lt, c.s(30) + 0.2, c.s(30) + 0.6)} />
        <g transform={`translate(360 450) scale(${pop(ramp(c.lt, c.s(31), c.s(31) + 0.6))})`} opacity={ramp(c.lt, c.s(31), c.s(31) + 0.3)}><rect x={-300} y={-80} width={600} height={160} rx={20} fill="#fff" stroke={INK} strokeWidth={6} /><Txt x={0} y={-6} size={64} fill="#c93a2e" ls={3}>ATTENTION,</Txt><Txt x={0} y={52} size={64} fill="#c93a2e" ls={3}>SHOPPERS</Txt></g>
        {hero(360, 1080, 1.8, { ...POSE.idle(c.lt), head: 8 })}
      </g>
    ) },
    // 32-33 the store is now closing; it says your name
    { at: 32, push: [1, 1.07], el: (c) => (
      <g><Aisle vp={[360, 540]} lightsOn={1} /><Speaker x={360} y={150} t={c.lt} on={0.9} />
        <g transform="translate(360 440)"><rect x={-310} y={-90} width={620} height={180} rx={20} fill="#fff" stroke={INK} strokeWidth={6} /><Txt x={0} y={-10} size={50} fill="#2a2220" ls={2}>THE STORE IS NOW CLOSING</Txt><g opacity={ramp(c.lt, c.s(33), c.s(33) + 0.4)}><Txt x={0} y={52} size={46} fill="#c93a2e" ls={3}>…AND THEN YOUR NAME.</Txt></g></g>
        {hero(360, 1080, 1.8, { ...POSE.idle(c.lt), head: 8 })}
        <g opacity={ramp(c.lt, c.s(33), c.s(33) + 0.5)} transform="translate(360 820)"><rect x={-110} y={-34} width={220} height={60} rx={8} fill="#f6f1e2" stroke={INK} strokeWidth={4} /><Txt x={0} y={8} size={34} fill="#6f7f6a" ls={3}>HELLO, I AM…</Txt></g>
      </g>
    ) },
    // 34 two hundred and fifty heads turn at once
    { at: 34, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" lit /><Mob n={80} t={c.t} seed={9} face={c.lt > 0.5 ? 'right' : 'left'} />
        <g transform={`translate(180 360) scale(${pop(ramp(c.lt, 0.3, 0.9))})`}><Txt x={0} y={0} size={150} fill="#c93a2e" stroke="#07050f">250</Txt><Txt x={0} y={50} size={38} fill="#f6f1e2" ls={4} stroke="#07050f">HEADS TURN</Txt></g>
      </g>
    ) },
  ],
  cues: [
    [0, 0, 'moan', 6], [2, 0.3, 'whoosh'], [3, 0.2, 'moan', 3], [6, 0.1, 'hiss'], [7, 0.0, 'slam'], [8, 0.3, 'gas', 3], [10, 0.4, 'scratch', 2],
    [11, 0.3, 'whoosh'], [12, 0.3, 'gas', 3], [13, 0.2, 'slam'], [14, 0.5, 'drip'], [14, 1.5, 'drip'], [14, 2.6, 'drip'], [15, 0.2, 'thud'], [15, 0.6, 'thud'], [15, 1.0, 'thud'], [15, 1.4, 'thud'],
    [17, 0.2, 'clunk'], [18, 0.2, 'engine', 3.8], [19, 1.0, 'click'], [20, 0.1, 'engine', 5], [21, 0.3, 'creak'], [23, 0.4, 'snap'],
    [24, 0.3, 'ding'], [25, 0.1, 'knock'], [25, 0.55, 'knock'], [25, 1.0, 'knock'], [25, 1.9, 'knock'], [25, 2.35, 'knock'], [25, 2.8, 'knock'],
    [27, 0.1, 'knock'], [27, 0.55, 'knock'], [27, 1.0, 'knock'], [27, 1.9, 'knock'], [27, 2.35, 'knock'], [27, 2.8, 'knock'],
    [28, 0.1, 'moan', 3], [29, 0.0, 'surge'], [30, 0.2, 'ding'], [31, 0.3, 'toot'], [34, 0.15, 'sting'], [34, 0.3, 'moan', 4],
  ],
};
const PAL_T = '#2a2220';
void H; void W; void Shopcart; void rnd;
