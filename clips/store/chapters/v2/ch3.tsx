/** Chapter 3: The Regulars. Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../../engine.tsx';
import { Aisle, AisleSign, Bucket, CardBg, Car, Cat, Dark, INK, Interior, Litter, Pallet, Parapet, Person, POSE, Shopcart, Sky, Stove, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../../lib.tsx';
import { LotSide, Mob } from '../../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Zzz: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>{[0, 1, 2].map((i) => { const k = (t * 0.6 + i * 0.33) % 1; return <text key={i} x={x + k * 30} y={y - k * 90} fontSize={30 + i * 10} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill="#f6f1e2" opacity={1 - k} stroke={INK} strokeWidth={4} paintOrder="stroke">Z</text>; })}</g>
);
const Plate: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => <rect x={x} y={y} width={w} height={h} fill="#f6f1e2" stroke={INK} strokeWidth={3} />;

export const ch: Chapter = {
  n: 3, label: 'THE REGULARS',
  scenes: [
    // 0-2 they do not hunt, they repeat
    { at: 0, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="day" /><Mob n={40} t={c.t * 1.2} seed={11} x0={40} x1={370} still={false} face="mixed" />
        <g opacity={ramp(c.lt, c.s(1) + 0.2, c.s(1) + 0.6)}><Txt x={360} y={200} size={64} fill="#2a2220" ls={4}>THEY DO NOT HUNT</Txt></g>
        <g opacity={ramp(c.lt, c.s(2), c.s(2) + 0.4)} transform={`translate(190 520) scale(${pop(ramp(c.lt, c.s(2), c.s(2) + 0.5))})`}><circle r={86} fill="none" stroke="#c93a2e" strokeWidth={14} strokeDasharray="420 120" transform={`rotate(${c.lt * 160})`} /><polygon points="86,-30 112,-6 66,-6" fill="#c93a2e" transform={`rotate(${c.lt * 160})`} /><Txt x={0} y={14} size={44} fill="#c93a2e" ls={2}>REPEAT</Txt></g>
      </g>
    ) },
    // 3-6 a day with the dead
    { at: 3, card: true, el: (c) => {
      const x0 = 70, x1 = 650, hr = (h: number) => lerp(x0, x1, (h - 6) / 18);
      const now = lerp(6.5, 23.5, ramp(c.lt, 0.2, c.d - 0.3));
      const hh = Math.floor(now), mm = Math.floor((now % 1) * 60);
      const ap = hh >= 12 ? 'PM' : 'AM';
      return (
        <g><CardBg />
          <Txt x={360} y={190} size={50} ls={3}>A DAY WITH THE DEAD</Txt>
          <g transform="translate(360 380)"><rect x={-150} y={-70} width={300} height={130} rx={20} fill="#2a2220" /><Txt x={0} y={30} size={104} fill="#7dffb0" ls={4}>{`${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`}</Txt><Txt x={110} y={-30} size={30} fill="#d9b04a">{ap}</Txt></g>
          <rect x={x0} y={680} width={x1 - x0} height={44} rx={10} fill="#f4f8f1" stroke={INK} strokeWidth={4} />
          <rect x={hr(7)} y={684} width={(hr(21) - hr(7)) * ramp(now, 7, 21)} height={36} rx={8} fill="#8fa8a0" />
          <circle cx={hr(Math.min(now, 23.9))} cy={702} r={20} fill="#d9462a" stroke={INK} strokeWidth={4} />
          {[[7, '7 AM', 'ARRIVE'], [21, '9 PM', 'DRIFT OFF']].map(([h, a, b], i) => <g key={i} opacity={ramp(c.lt, i ? c.s(5) : c.s(3), (i ? c.s(5) : c.s(3)) + 0.4)}><line x1={hr(h as number)} y1={730} x2={hr(h as number)} y2={790} stroke={INK} strokeWidth={4} /><Txt x={hr(h as number)} y={832} size={40} ls={1}>{a as string}</Txt><Txt x={hr(h as number)} y={874} size={30} fill="#6f7f6a" ls={2}>{b as string}</Txt></g>)}
          <g opacity={ramp(c.lt, c.s(4) + 0.2, c.s(4) + 0.6)}><Txt x={lerp(hr(7), hr(21), 0.5)} y={650} size={36} fill="#c93a2e" ls={2}>ALL DAY: LEANING ON THE SHUTTER</Txt></g>
          <g opacity={ramp(c.lt, c.s(6), c.s(6) + 0.5)}><Shopcart x={360} y={1090} s={1.6} /><Txt x={360} y={990} size={44} fill="#2a2220">SAME OLD SHOPPING</Txt></g>
        </g>
      );
    } },
    // 7-9 the nights were always quiet
    { at: 7, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" lit={false} />
        {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={60 + i * 110} cy={1000 + (i % 2) * 50} r={4 + tri(c.lt * 2 + i) * 3} fill="#ffe6a8" opacity={0.5 + 0.4 * tri(c.lt * 1.5 + i * 0.7)} />)}
        {hero(540, 520, 0.95, POSE.idle(c.lt), true)}
        <g opacity={ramp(c.lt, c.s(8), c.s(8) + 0.5)}><Txt x={360} y={200} size={60} fill="#f6f1e2" ls={4} stroke="#07050f">QUIET NIGHTS</Txt></g>
        <g opacity={ramp(c.lt, c.s(9), c.s(9) + 0.5)}><rect x={90} y={1030} width={540} height={110} rx={16} fill="#2a2220" opacity={0.88} /><Txt x={360} y={1100} size={52} fill="#d9b04a" ls={3}>THAT IS WHY YOU TOOK THE JOB</Txt></g>
      </g>
    ) },
    // 10-11 night hours, the roof is yours
    { at: 10, push: [1, 1.06], el: (c) => (
      <g><Sky tone="night" h={1010} /><rect y={760} width={W} height={260} fill="#2f2b4d" opacity={0.9} />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 62} y={700 - rnd(i) * 120} width={56} height={400} fill="#26233f" />)}
        <Parapet y={1010} />{hero(300, 1000, 2.3, POSE.idle(c.lt))}
        <g transform="translate(560 940)"><line x1={0} y1={0} x2={0} y2={-150} stroke={INK} strokeWidth={6} /><polygon points="0,-150 90,-120 0,-90" fill="#c93a2e" stroke={INK} strokeWidth={4} /></g>
        <Txt x={360} y={250} size={56} fill="#f6f1e2" ls={4} stroke="#07050f" o={ramp(c.lt, c.s(11), c.s(11) + 0.5)}>THE ROOF IS YOURS</Txt>
      </g>
    ) },
    // 12-13 camping stove on the roof, never indoors
    { at: 12, push: [1, 1.05], el: (c) => (
      <g><Sky tone="night" h={1010} /><Parapet y={1010} />
        <Stove x={470} y={1000} s={2.1} t={c.lt} /><circle cx={470} cy={930} r={200} fill="#ffb347" opacity={0.14 + 0.04 * Math.sin(c.lt * 8)} />
        {hero(230, 1000, 2.1, { ...POSE.idle(c.lt), lU: 60 + Math.sin(c.lt * 4) * 10, lF: 90 })}
        <g opacity={ramp(c.lt, c.s(13), c.s(13) + 0.4)} transform={`translate(360 300) scale(${pop(ramp(c.lt, c.s(13), c.s(13) + 0.5))})`}><rect x={-250} y={-60} width={500} height={120} rx={14} fill="#fff" stroke={INK} strokeWidth={5} /><Txt x={0} y={26} size={80} fill="#c93a2e" ls={4}>NEVER INDOORS</Txt></g>
      </g>
    ) },
    // 14 a gas flame in a sealed building
    { at: 14, el: (c) => (
      <g><Interior wall="#bfb394" line={900} /><rect x={40} y={200} width={640} height={700} fill="none" stroke={INK} strokeWidth={8} />
        <rect x={44} y={204} width={632} height={692} fill="#8fd08a" opacity={ramp(c.lt, 0.2, c.d - 0.4) * 0.55} />
        {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={100 + i * 80 + Math.sin(c.lt * 2 + i) * 20} cy={800 - ((c.lt * 70 + i * 90) % 560)} r={26 + (i % 3) * 10} fill="#d4f2c8" opacity={0.28} />)}
        <Stove x={150} y={900} s={1.4} t={c.lt} />
        <g transform="translate(470 770) rotate(-82)"><Person kind="hero" x={0} floor={0 + 66 * 1.6} s={1.6} pose={POSE.slump()} /></g>
        <Zzz x={380} y={720} t={c.lt} />
        <g transform="translate(360 190)"><polygon points="0,-90 90,60 -90,60" fill="#f0c43a" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><Txt x={0} y={42} size={90} fill={INK}>!</Txt></g>
        <Txt x={360} y={1040} size={44} fill="#c93a2e" ls={3} o={ramp(c.lt, 0.5, 1.0)}>SEALED ROOM + FLAME = QUIET DANGER</Txt>
      </g>
    ) },
    // 15-16 taps run dry
    { at: 15, push: [1, 1.06], el: (c) => {
      const drops = [0.4, 1.3, 2.4].map((t0) => ramp(c.lt, t0, t0 + 0.6));
      return (
        <g><Interior wall="#cfd6d2" line={960} tiles={false} />
          <rect x={300} y={300} width={90} height={430} fill="#aab4bb" stroke={INK} strokeWidth={5} /><path d="M 300 330 L 560 330 Q 620 330 620 400 L 620 440 L 570 440 L 570 400 Q 570 380 550 380 L 300 380 Z" fill="#c4cdd2" stroke={INK} strokeWidth={5} strokeLinejoin="round" /><rect x={560} y={430} width={70} height={26} fill="#aab4bb" stroke={INK} strokeWidth={4} /><circle cx={440} cy={300} r={28} fill="#c93a2e" stroke={INK} strokeWidth={5} />
          {drops.map((d, i) => d > 0 && d < 1 && <path key={i} d="M 0 -18 Q 12 0 0 10 Q -12 0 0 -18 Z" transform={`translate(595 ${470 + d * d * 420})`} fill="#6bb6e8" stroke={INK} strokeWidth={3} opacity={1 - d * 0.3} />)}
          <rect x={460} y={880} width={260} height={90} fill="#c4cdd2" stroke={INK} strokeWidth={5} />
          <Txt x={360} y={190} size={80} fill="#2a2220" ls={4} o={ramp(c.lt, 0.1, 0.5)}>DAY 4</Txt>
          <g opacity={ramp(c.lt, c.s(16), c.s(16) + 0.5)}><rect x={90} y={1060} width={540} height={110} rx={14} fill="#fff" stroke={INK} strokeWidth={4} /><Txt x={360} y={1128} size={50} fill="#c93a2e" ls={3}>NO POWER = NO PUMPS</Txt></g>
        </g>
      );
    } },
    // 17 eight pallets of bottled water
    { at: 17, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} />
        {Array.from({ length: 8 }, (_, i) => { const a = pop(ramp(c.lt, 0.2 + i * 0.22, 0.55 + i * 0.22)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -200})`}><Pallet x={110 + (i % 4) * 170} floor={620 + Math.floor(i / 4) * 280} s={0.9} color="#6bb6e8" /></g>; })}
        <Txt x={360} y={190} size={48} ls={3}>DRINKING IS EASY</Txt>
        <g transform="translate(360 1110)" opacity={ramp(c.lt, 1.8, 2.3)}><Txt x={0} y={0} size={80} fill="#2f7fb8">8 PALLETS</Txt></g>
        {hero(90, 1180, 1.4, POSE.idle(c.lt))}
      </g>
    ) },
    // 18-20 the toilet problem: bucket, bag, litter
    { at: 18, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={900} />
        <AisleSign x={360} y={60} n="13" label="PET CARE" sub="CAT LITTER" s={1.15} />
        <Litter x={540} floor={900} s={1.8} />
        <g transform={`translate(${lerp(540, 220, ease(ramp(c.lt, c.s(19) + 0.6, c.s(19) + 1.6)))} ${860 - 90 * tri(ramp(c.lt, c.s(19) + 0.6, c.s(19) + 1.6))})`} opacity={ramp(c.lt, c.s(19), c.s(19) + 0.4)}><Bucket x={0} y={0} s={1.5} /><path d="M -50 -40 Q -80 -90 -30 -86 Q 0 -110 30 -86 Q 76 -90 50 -40 Z" fill="#2c2f36" stroke={INK} strokeWidth={4} /></g>
        <g opacity={ramp(c.lt, c.s(18) + 0.2, c.s(18) + 0.6)}><Txt x={180} y={430} size={56} fill="#c93a2e" ls={3}>THE PROBLEM</Txt></g>
        <g opacity={ramp(c.lt, c.s(20), c.s(20) + 0.5)} transform={`translate(360 380) scale(${pop(ramp(c.lt, c.s(20), c.s(20) + 0.5))})`}><circle r={70} fill="#4aa86a" stroke={INK} strokeWidth={6} /><path d="M -34 2 l 24 24 l 46 -50" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" /></g>
        {hero(380, 1080, 1.6, POSE.idle(c.lt))}
      </g>
    ) },
    // 21-23 a car stops perfectly between the lines
    { at: 21, push: [1, 1.05], el: (c) => {
      const x = lerp(-200, 215, ease(ramp(c.lt, 0.2, c.s(22) + 0.4)));
      return (
        <g><LotSide tone="dusk" />
          <g><rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" /></g>
          <Car x={x} floor={1150} s={1.15} color="#3d63a8" />
          <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.4)}><rect x={80} y={1170} width={240} height={52} rx={8} fill="#f6f1e2" stroke={INK} strokeWidth={4} /><Txt x={200} y={1208} size={34} ls={3}>RHEA'S CAR</Txt></g>
          <Txt x={360} y={200} size={46} ls={4} fill="#f6f1e2" stroke="#07050f" o={ramp(c.lt, 0.1, 0.5)}>DAY 5 · STAFF PARKING</Txt>
        </g>
      );
    } },
    // 24-25 engine running until the tank is empty
    { at: 24, push: [1, 1.06], el: (c) => {
      const fuel = 1 - ramp(c.lt, 0.4, c.s(25) + 1.2);
      return (
        <g><LotSide tone="dusk" />
          <rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" />
          <Car x={215} floor={1150} s={1.15} exhaust={1} t={c.lt} />
          <g transform="translate(215 1030)"><rect x={-26} y={-12} width={56} height={46} fill="#2f2b4d" /><circle cx={0} cy={4} r={18} fill="#f6e6c8" stroke={INK} strokeWidth={3} /><path d="M -22 -2 Q -22 -28 0 -28 Q 22 -28 22 -2 L 22 20 Q 14 8 0 8 Q -14 8 -22 20 Z" fill="#2e2420" stroke={INK} strokeWidth={3} /><circle cx={-6} cy={6} r={2.4} fill={INK} /><circle cx={7} cy={6} r={2.4} fill={INK} /></g>
          <g transform="translate(530 330)"><circle r={110} fill="#f6f1e2" stroke={INK} strokeWidth={7} /><text x={-62} y={52} fontSize={34} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill={INK}>E</text><text x={42} y={52} fontSize={34} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill={INK}>F</text><line x1={0} y1={20} x2={Math.cos(Math.PI - fuel * Math.PI) * 78} y2={20 - Math.sin(fuel * Math.PI) * 78} stroke="#c93a2e" strokeWidth={8} strokeLinecap="round" /><circle cx={0} cy={20} r={10} fill={INK} /></g>
          <Txt x={360} y={1260} size={40} fill="#f6f1e2" stroke="#07050f" o={ramp(c.lt, c.s(25), c.s(25) + 0.5)}>SHE NEVER GETS OUT.</Txt>
        </g>
      );
    } },
    // 26 day eight: the door hangs open, the seat is empty
    { at: 26, el: (c) => (
      <g><LotSide tone="dusk" />
        <rect x={96} y={1010} width={10} height={170} fill="#f2eee2" /><rect x={334} y={1010} width={10} height={170} fill="#f2eee2" />
        <Car x={215} floor={1150} s={1.15} door={ramp(c.lt, 0.3, 1.1)} />
        <Txt x={360} y={200} size={60} ls={4} fill="#f6f1e2" stroke="#07050f" o={ramp(c.lt, 0.1, 0.5)}>DAY 8</Txt>
        <g opacity={ramp(c.lt, 1.2, 1.7)} transform={`translate(215 1000)`}><text textAnchor="middle" fontSize={60} fill="#f6f1e2" y={0} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} stroke="#07050f" strokeWidth={6} paintOrder="stroke">EMPTY</text></g>
      </g>
    ) },
    // 27 asleep on dog beds, the ceiling turns white
    { at: 27, push: [1, 1.05], el: (c) => {
      const flash = ramp(c.lt, c.d - 1.0, c.d - 0.2);
      return (
        <g><Interior wall="#a89c86" line={900} /><rect width={W} height={H} fill="#1c1630" opacity={0.5} />
          {[[170, 860, '#b8453d'], [330, 880, '#3f6db0'], [490, 860, '#d9b04a'], [260, 800, '#6aa6a3'], [420, 790, '#8b5aa6']].map(([bx, by, col], i) => <g key={i}><ellipse cx={bx as number} cy={by as number} rx={110} ry={44} fill={col as string} stroke={INK} strokeWidth={5} /><ellipse cx={bx as number} cy={(by as number) - 8} rx={72} ry={24} fill="#f6f1e2" opacity={0.45} /></g>)}
          <g transform="translate(250 750) rotate(-84)"><Person kind="hero" x={0} floor={66 * 1.55} s={1.55} pose={POSE.slump()} /></g>
          <Zzz x={360} y={640} t={c.lt} />
          <rect x={110} y={120} width={500} height={70} rx={10} fill="#4a4560" stroke={INK} strokeWidth={5} />
          <rect width={W} height={H} fill="#fff" opacity={flash} />
        </g>
      );
    } },
    // 28-29 every light, every freezer, the playlist
    { at: 28, push: [1, 1.07], el: (c) => (
      <g><Aisle vp={[360, 540]} pushed={ramp(c.lt, 0, c.d) * 0.5} lightsOn={1} />
        {[[120, 220], [600, 220]].map(([sx, sy], i) => <g key={i}><rect x={sx - 34} y={sy - 30} width={68} height={60} rx={10} fill="#2a2220" stroke={INK} strokeWidth={4} /><circle cx={sx} cy={sy} r={20} fill="#555" stroke="#aaa" strokeWidth={3} />{[0, 1, 2].map((k) => { const r = ((c.lt * 1.4 + k * 0.33) % 1); return <circle key={k} cx={sx} cy={sy} r={30 + r * 90} fill="none" stroke="#ffe6a8" strokeWidth={6} opacity={(1 - r) * ramp(c.lt, c.s(29), c.s(29) + 0.3)} />; })}</g>)}
        {[0, 1, 2, 3].map((i) => { const k = ((c.lt * 0.7 + i * 0.25) % 1); return <text key={i} x={140 + i * 130 + Math.sin(k * 6) * 20} y={700 - k * 380} fontSize={54} {...{ fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 }} fill="#f6f1e2" stroke={INK} strokeWidth={5} paintOrder="stroke" opacity={(1 - k) * ramp(c.lt, c.s(29), c.s(29) + 0.3)}>{i % 2 ? '♫' : '♪'}</text>; })}
        <g opacity={ramp(c.lt, c.s(29) + 0.2, c.s(29) + 0.6)}><Txt x={360} y={1090} size={54} fill="#f6f1e2" stroke="#07050f" ls={3}>STORE PLAYLIST: MAX</Txt></g>
      </g>
    ) },
    // 30-31 the power is back, 250 heads turn
    { at: 30, push: [1, 1.05], el: (c) => {
      const turn = c.lt > c.s(31) + 0.1;
      return (
        <g><LotSide tone="night" lit />
          <Mob n={80} t={c.t} seed={9} face={turn ? 'right' : 'left'} />
          <g opacity={ramp(c.lt, c.s(30), c.s(30) + 0.3)}><Txt x={360} y={180} size={64} fill="#fff6c8" ls={4} stroke="#07050f">THE POWER IS BACK</Txt></g>
          <g opacity={ramp(c.lt, c.s(31) + 0.1, c.s(31) + 0.5)} transform={`translate(180 360) scale(${pop(ramp(c.lt, c.s(31) + 0.1, c.s(31) + 0.6))})`}><Txt x={0} y={0} size={150} fill="#c93a2e" stroke="#07050f">250</Txt><Txt x={0} y={50} size={38} fill="#f6f1e2" ls={4} stroke="#07050f">HEADS TURN</Txt></g>
        </g>
      );
    } },
    // 32 the breaker is seventy yards away: floor plan
    { at: 32, card: true, el: (c) => {
      const k = ramp(c.lt, 0.5, c.d - 0.3);
      return (
        <g><rect width={W} height={H} fill="#1f3b5c" />
          {Array.from({ length: 18 }, (_, i) => <line key={i} x1={0} y1={i * 72} x2={W} y2={i * 72} stroke="#2f527a" strokeWidth={2} />)}{Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 72} y1={0} x2={i * 72} y2={H} stroke="#2f527a" strokeWidth={2} />)}
          <rect x={90} y={250} width={540} height={740} fill="none" stroke="#cfe3ee" strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={160 + i * 110} y={420} width={50} height={440} fill="none" stroke="#7fa6c8" strokeWidth={3} />)}
          <rect x={90} y={940} width={250} height={50} fill="#4aa86a" opacity={0.6} /><Txt x={215} y={976} size={28} fill="#fff" ls={2}>FRONT DOORS</Txt>
          <rect x={440} y={250} width={190} height={130} fill="#c93a2e" opacity={0.35} stroke="#cfe3ee" strokeWidth={4} /><Txt x={535} y={300} size={28} fill="#fff" ls={1}>BACK OFFICE</Txt><Txt x={535} y={340} size={26} fill="#ffe6a8" ls={1}>MAIN BREAKER</Txt>
          <circle cx={215} cy={880} r={18} fill="#d9b04a" stroke="#fff" strokeWidth={4} /><Txt x={215} y={850} size={26} fill="#fff" ls={1}>YOU</Txt>
          <path d="M 215 880 L 215 520 L 535 400" fill="none" stroke="#ffe6a8" strokeWidth={8} strokeDasharray="22 16" strokeLinecap="round" pathLength={1} strokeDashoffset={0} opacity={k} />
          <circle cx={lerp(215, 535, ramp(k, 0.5, 1))} cy={lerp(880, 400, k)} r={12} fill="#c93a2e" opacity={k > 0 ? 1 : 0} />
          <g opacity={ramp(c.lt, 1.0, 1.5)}><Txt x={360} y={170} size={80} fill="#ffe6a8" ls={4}>70 YARDS</Txt></g>
        </g>
      );
    } },
  ],
  cues: [
    [0, 0, 'moan', 6], [2, 0.3, 'whoosh'], [4, 0.2, 'moan', 3], [7, 0.1, 'drip'],
    [10, 0.3, 'whoosh'], [12, 0.3, 'gas', 3], [13, 0.2, 'slam'], [14, 0.5, 'moan', 4],
    [15, 0.5, 'drip'], [15, 1.5, 'drip'], [15, 2.6, 'drip'], [17, 0.2, 'thud'], [17, 0.6, 'thud'], [17, 1.0, 'thud'], [17, 1.4, 'thud'],
    [19, 0.6, 'clunk'], [20, 0.1, 'ding'],
    [21, 0.2, 'engine', 3.8], [22, 1.4, 'click'], [24, 0.2, 'engine', 6], [26, 0.3, 'creak'],
    [27, 0.1, 'moan', 3], [28, 0.0, 'surge'], [29, 0.2, 'music', 8], [30, 0.1, 'ding'], [31, 0.15, 'sting'], [31, 0.3, 'moan', 4],
    [32, 0.3, 'click'], [32, 1.2, 'ding'],
  ],
};
void Cat; void Dark; void H; void clamp; void lerp;
