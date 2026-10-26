/** Chapter 6: Closing Time. Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../../engine.tsx';
import { AisleSign, Bar, Bucket, CardBg, Cat, Clock, Dark, Door, INK, Interior, Person, POSE, ShelfRow, Truck, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../../lib.tsx';
import { LockPlate, LotSide, Mob, RheaDead, ShelvesBack } from '../../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const girl = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="kid" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Stranger: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; pose?: any }> = ({ x, floor, s = 1.2, flip = true, pose }) => (
  <g style={{ filter: 'brightness(0.32)' }}><Person kind="kid" x={x} floor={floor} s={s} flip={flip} pose={pose ?? POSE.idle()} /></g>
);
const Waves: React.FC<{ x: number; y: number; t: number; n?: number; max?: number; color?: string; o?: number }> = ({ x, y, t, n = 4, max = 420, color = '#d9462a', o = 1 }) => (
  <g>{Array.from({ length: n }, (_, k) => { const r = (t * 0.9 + k / n) % 1; return <circle key={k} cx={x} cy={y} r={20 + r * max} fill="none" stroke={color} strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * o} />; })}</g>
);
const Ladder: React.FC<{ x: number; y: number; len?: number; rot?: number; s?: number }> = ({ x, y, len = 240, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <line x1={-22} y1={0} x2={-22} y2={len} stroke="#c9a05a" strokeWidth={9} strokeLinecap="round" /><line x1={22} y1={0} x2={22} y2={len} stroke="#c9a05a" strokeWidth={9} strokeLinecap="round" />
    {Array.from({ length: Math.floor(len / 36) }, (_, i) => <line key={i} x1={-22} y1={20 + i * 36} x2={22} y2={20 + i * 36} stroke={INK} strokeWidth={6} />)}
  </g>
);
const Backpack: React.FC<{ s?: number; open?: number; t?: number }> = ({ s = 1, open = 0, t = 0 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-30} y={-40} width={60} height={80} rx={14} fill="#3d63a8" stroke={INK} strokeWidth={4} /><rect x={-20} y={-6} width={40} height={30} rx={6} fill="#2e4f8a" stroke={INK} strokeWidth={3} />
    <g transform={`translate(0 ${-44 - open * 20 + Math.sin(t * 4) * open * 3})`} opacity={open}><circle r={22} fill="#e8862f" stroke={INK} strokeWidth={4} /><polygon points="-18,-12 -14,-34 -2,-18" fill="#e8862f" stroke={INK} strokeWidth={3} /><polygon points="2,-18 14,-34 18,-12" fill="#e8862f" stroke={INK} strokeWidth={3} /><circle cx={-8} cy={-2} r={3} fill={INK} /><circle cx={8} cy={-2} r={3} fill={INK} /></g>
  </g>
);

export const ch: Chapter = {
  n: 6, label: 'CLOSING TIME', ending: true,
  scenes: [
    // 0 the rule was written by someone who thought the problem was the door
    { at: 0, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} />
        <g transform="translate(360 420) rotate(-2)"><rect x={-290} y={-170} width={580} height={340} fill="#f4ecd0" stroke={INK} strokeWidth={6} /><Txt x={0} y={-90} size={38} fill="#c93a2e" ls={3}>HOUSE RULE ONE</Txt><Txt x={0} y={-10} size={54}>NOBODY COMES IN</Txt>
          <g opacity={ramp(c.lt, 0.6, 1.2)}><path d="M -230 -26 L 230 -26" stroke="#c93a2e" strokeWidth={7} /><Txt x={0} y={80} size={40} fill="#6f7f6a">written about a door...</Txt></g></g>
        <g opacity={ramp(c.lt, 1.6, 2.2)} transform={`translate(360 880) scale(${pop(ramp(c.lt, 1.6, 2.3))})`}><Door x={-90} y={-170} w={180} h={240} open={0} sign="" color="#6a7580" /><Txt x={0} y={150} size={44} fill="#2a2220" ls={3}>BUT THE DOOR WAS NEVER THE PROBLEM</Txt></g>
      </g>
    ) },
    // 1 aisle 14: ladders
    { at: 1, push: [1, 1.05], el: (c) => (
      <g><Interior line={900} />
        {[0, 1].map((r) => <ShelfRow key={r} x={-20} y={250 + r * 330} w={760} h={120} seed={r + 80} />)}
        <AisleSign x={360} y={60} n="14" label="LADDERS" sub="STEPS · CLIMB" s={1.2} />
        {[90, 190, 290, 400, 500, 600].map((x, i) => <Ladder key={i} x={x} y={640} len={240} rot={(i % 2 ? 1 : -1) * 5} s={0.9 + (i % 3) * 0.05} />)}
        {hero(380, 1090, 1.6, POSE.carry(POSE.walk(c.lt, 1.2, 6)))}
      </g>
    ) },
    // 2 lower one off the roof
    { at: 2, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.3, c.d - 0.2));
      return (
        <g><LotSide tone="dusk" />
          <Person kind="hero" x={430} floor={520} s={0.95} pose={POSE.carry(POSE.idle(c.lt))} />
          <g transform={`translate(386 520) rotate(${lerp(90, 6, k)} 0 0)`}><Ladder x={0} y={0} len={560} rot={0} /></g>
          <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.2, 0.6)}>A LADDER, DOWN</Txt>
        </g>
      );
    } },
    // 3 the girl climbs up
    { at: 3, push: [1, 1.05], el: (c) => {
      const k = ramp(c.lt, 0.3, c.d - 0.2);
      return (
        <g><LotSide tone="dusk" />
          <g transform="translate(386 520) rotate(6)"><Ladder x={0} y={0} len={560} /></g>
          <g transform={`translate(${lerp(402, 392, k)} ${lerp(1060, 560, k)})`}><Person kind="kid" x={0} floor={0} s={0.8} pose={{ ...POSE.idle(), lU: 140 + Math.sin(c.lt * 7) * 30, lF: 150, rU: 140 - Math.sin(c.lt * 7) * 30, rF: 150 }} /><g transform="translate(-16 -64)"><Backpack s={0.5} /></g></g>
          <Person kind="hero" x={430} floor={520} s={0.95} pose={POSE.idle(c.lt)} />
          <Txt x={360} y={190} size={64} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.2, 0.6)}>UP SHE COMES</Txt>
        </g>
      );
    } },
    // 4 in the backpack, an enormous orange cat
    { at: 4, push: [1, 1.07], el: (c) => (
      <g><rect width={W} height={H} fill="#c99a6a" /><rect y={900} width={W} height={380} fill="#a9876f" stroke={INK} strokeWidth={5} />
        {girl(250, 1000, 2.2, POSE.idle(c.lt), false)}
        <g transform="translate(168 700)"><Backpack s={2.6} open={ramp(c.lt, 0.5, 1.2)} t={c.lt} /></g>
        <g opacity={ramp(c.lt, 1.0, 1.5)}><Cat x={520} floor={1000} s={2.0} t={c.lt} /></g>
        <Txt x={360} y={220} size={58} fill="#6a3a14" ls={3} o={ramp(c.lt, 1.2, 1.7)}>ONE ENORMOUS CAT</Txt>
      </g>
    ) },
    // 5-7 now the truck; you cannot stop four people but you know what can
    { at: 5, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" />
        <Truck x={290} floor={1130} s={1.1} flip lights={0.6} />
        {[0, 1, 2, 3].map((i) => <Stranger key={i} x={90 + i * 50} floor={1190} s={1.15} flip={false} />)}
        <Person kind="hero" x={540} floor={520} s={0.95} pose={POSE.idle(c.lt)} flip />
        <g transform="translate(250 300) scale(0.9)" opacity={ramp(c.lt, c.s(6), c.s(6) + 0.4)}><rect x={-220} y={-60} width={440} height={110} rx={16} fill="#2a2220" opacity={0.9} /><Txt x={0} y={-12} size={36} fill="#d9b04a" ls={3}>FOUR PEOPLE</Txt><Txt x={0} y={34} size={44} fill="#f6f1e2" ls={2}>YOU CANNOT STOP</Txt></g>
        <g opacity={ramp(c.lt, c.s(7), c.s(7) + 0.4)} transform={`translate(560 360) scale(${pop(ramp(c.lt, c.s(7), c.s(7) + 0.6))})`}><circle r={60} fill="#ffe28a" stroke={INK} strokeWidth={6} /><rect x={-22} y={50} width={44} height={26} rx={6} fill="#8a8f93" stroke={INK} strokeWidth={5} /><Txt x={0} y={22} size={80} fill={INK}>!</Txt></g>
      </g>
    ) },
    // 8-9 aisle 9: thirty alarm clocks
    { at: 8, push: [1, 1.04], el: (c) => {
      const n = Math.floor(ramp(c.lt, c.s(9) - 0.2, c.s(9) + 2.2) * 30);
      return (
        <g><ShelvesBack rows={0} />
          <AisleSign x={360} y={60} n="9" label="ALARM CLOCKS" sub="LOUD ONES" s={1.2} />
          {Array.from({ length: 30 }, (_, i) => i < n + (c.lt > c.s(8) ? 3 : 0) && <Clock key={i} x={90 + (i % 6) * 108} y={290 + Math.floor(i / 6) * 150} s={0.5} hour={(i * 5) % 12} min={(i * 11) % 60} />)}
          <g transform="translate(360 1090)" opacity={ramp(c.lt, c.s(9), c.s(9) + 0.4)}><rect x={-230} y={-70} width={460} height={130} rx={16} fill="#2a2220" opacity={0.9} /><Txt x={0} y={28} size={100} fill="#d9462a" ls={3}>{`${n} CLOCKS`}</Txt></g>
        </g>
      );
    } },
    // 10-12 one person: thirty minutes. two people: fifteen
    { at: 10, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={170} size={50} ls={3}>WINDING 30 CLOCKS</Txt>
        <Bar x={70} y={310} w={580} h={76} v={ramp(c.lt, 0.3, 1.6)} label="ONE PERSON" value="30 MIN" color="#d9462a" />
        <g opacity={ramp(c.lt, 0.2, 0.6)}>{hero(130, 560, 0.9, { ...POSE.idle(c.lt), lU: 60, lF: 90 })}</g>
        <Bar x={70} y={700} w={580} h={76} v={ramp(c.lt, c.s(11), c.s(11) + 1.0) * 0.5} label="TWO PEOPLE" value="15 MIN" color="#4aa86a" />
        <g opacity={ramp(c.lt, c.s(11), c.s(11) + 0.4)}>{hero(110, 960, 0.9, { ...POSE.idle(c.lt), lU: 60, lF: 90 })}{girl(220, 960, 0.9, { ...POSE.idle(c.lt + 1), lU: 60, lF: 90 })}</g>
        <g opacity={ramp(c.lt, c.s(12), c.s(12) + 0.5)} transform={`translate(360 1130) scale(${pop(ramp(c.lt, c.s(12), c.s(12) + 0.6))})`}><Txt x={0} y={0} size={44} fill="#c93a2e" ls={2}>THE POINT OF OTHER PEOPLE</Txt></g>
      </g>
    ) },
    // 13 at four, the truck backs up to the shutter
    { at: 13, push: [1, 1.05], el: (c) => {
      const x = lerp(-60, 250, ease(ramp(c.lt, 0.2, c.d - 0.2)));
      return (
        <g><LotSide tone="night" /><Truck x={x} floor={1130} s={1.1} flip lights={0.5} />
          <g transform="translate(360 200)"><rect x={-170} y={-60} width={340} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={30} size={74} fill="#7dffb0" ls={6}>4:00 AM</Txt></g>
          <Person kind="hero" x={540} floor={520} s={0.95} pose={POSE.idle(c.lt)} flip />
        </g>
      );
    } },
    // 14 men drag the chain, bucket lowered into the truck bed
    { at: 14, push: [1, 1.06], el: (c) => {
      const k = ease(ramp(c.lt, 0.6, c.d - 0.3));
      return (
        <g><LotSide tone="night" /><Truck x={250} floor={1130} s={1.1} flip lights={0.5} />
          {[0, 1].map((i) => <Stranger key={i} x={440 + i * 70} floor={1190} s={1.15} flip pose={POSE.walk(c.lt + i, 1.0, 12)} />)}
          <path d={`M 470 1130 Q 560 1190 650 1120`} stroke="#3a3f48" strokeWidth={9} fill="none" strokeDasharray="16 7" />
          <line x1={400} y1={520} x2={lerp(400, 330, k)} y2={lerp(560, 960, k)} stroke="#c9b27a" strokeWidth={5} />
          <Bucket x={lerp(400, 330, k)} y={lerp(590, 990, k)} s={0.9} tin={0} />
          <Person kind="hero" x={430} floor={520} s={0.95} pose={POSE.pull(POSE.idle(c.lt))} />
          <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>ONE LAST DELIVERY</Txt>
        </g>
      );
    } },
    // 15 thirty clocks, all set for 4:10
    { at: 15, card: true, el: (c) => (
      <g><CardBg />
        {Array.from({ length: 30 }, (_, i) => { const a = ramp(c.lt, 0.05 + i * 0.03, 0.2 + i * 0.03); return <g key={i} opacity={a}><Clock x={80 + (i % 6) * 112} y={190 + Math.floor(i / 6) * 150} s={0.5} hour={4} min={10} /></g>; })}
        <g transform={`translate(360 1040) scale(${pop(ramp(c.lt, 0.8, 1.4))})`}><rect x={-200} y={-90} width={400} height={140} rx={20} fill="#2a2220" /><Txt x={0} y={30} size={110} fill="#7dffb0" ls={6}>4:10</Txt></g>
      </g>
    ) },
    // 16-17 loudest thing in a month, everything turns toward the truck
    { at: 16, push: [1, 1.07], el: (c) => (
      <g><LotSide tone="night" /><Mob n={80} t={c.t} seed={61} x0={60} x1={400} f0={930} f1={1190} face="right" still={false} />
        <Truck x={250} floor={1130} s={1.1} flip lights={0.5} />
        {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${130 + i * 40} 960) scale(0.45)`}><Clock x={0} y={0} t={c.lt + i} ring={1} hour={4} min={10} /></g>)}
        <Waves x={250} y={1000} t={c.lt * 1.3} n={6} max={780} />
        <Txt x={360} y={190} size={84} fill="#e5361d" stroke="#07050f" ls={4} o={0.6 + 0.4 * tri(c.lt * 6)}>RRRINNNG!!</Txt>
      </g>
    ) },
    // 18-19 the men do the smart thing: drop the chain and drive
    { at: 18, push: [1, 1.05], el: (c) => {
      const go = ease(ramp(c.lt, c.s(19), c.d));
      return (
        <g><LotSide tone="night" /><g transform={`translate(${-go * 100} 0)`}><Mob n={80} t={c.t} seed={61} x0={60} x1={400} f0={930} f1={1190} face="left" still={false} /></g>
          <Truck x={lerp(250, -520, go)} floor={1130} s={1.1} flip lights={0.5} />
          <path d={`M 470 1150 Q 520 1190 570 1150`} stroke="#3a3f48" strokeWidth={9} fill="none" strokeDasharray="16 7" opacity={ramp(c.lt, c.s(19) - 0.2, c.s(19) + 0.3)} />
          <Txt x={360} y={190} size={56} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>THE SMART MOVE</Txt>
        </g>
      );
    } },
    // 20-21 the noise leaves with them, so does the crowd
    { at: 20, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.2, c.d - 0.1));
      return (
        <g><LotSide tone="night" /><g transform={`translate(${-k * 520} 0)`}><Mob n={80} t={c.t} seed={61} x0={60} x1={400} f0={930} f1={1190} face="left" still={false} /></g>
          <Waves x={lerp(120, -300, k)} y={1010} t={c.lt} n={4} max={500} o={1 - k} />
          <g transform={`translate(${lerp(360, 120, k)} 220)`} opacity={1 - ramp(c.lt, c.s(21) + 0.5, c.d)}><Txt x={0} y={0} size={60} fill="#d9462a" stroke="#07050f" ls={3}>THE NOISE LEAVES TOO</Txt></g>
        </g>
      );
    } },
    // 22 by sunrise the lot is empty
    { at: 22, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="dawn" />
        <Person kind="hero" x={500} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: 150 + Math.sin(c.lt * 5) * 15, lF: 150 }} flip />
        {girl(560, 520, 0.95, POSE.idle(c.lt + 1), true)}<Cat x={630} floor={520} s={0.42} flip t={c.lt} />
        <Txt x={360} y={190} size={60} fill="#6a4a36" ls={4} o={ramp(c.lt, 0.2, 0.6)}>SUNRISE: EMPTY LOT</Txt>
      </g>
    ) },
    // 23-27 day 28 inventory
    { at: 23, card: true, el: (c) => {
      const rows: [number, string, string][] = [[24, 'PEOPLE', '2'], [25, 'CATS', '1'], [26, 'TINS', 'PLENTY'], [27, 'CUSTOMERS', '24 A NIGHT']];
      return (
        <g><CardBg />
          <g transform={`translate(360 230) scale(${pop(ramp(c.lt, 0.1, 0.6))})`}><Txt x={0} y={-40} size={40} fill="#6f7f6a" ls={8}>DAY 28</Txt><Txt x={0} y={50} size={104} ls={4}>INVENTORY</Txt></g>
          <rect x={70} y={380} width={580} height={640} rx={18} fill="#f4f8f1" stroke={INK} strokeWidth={5} />
          {rows.map(([si, l, v], i) => <g key={i} opacity={ramp(c.lt, c.s(si), c.s(si) + 0.35)} transform={`translate(${(1 - ramp(c.lt, c.s(si), c.s(si) + 0.35)) * -40} 0)`}><line x1={100} y1={500 + i * 140 + 30} x2={620} y2={500 + i * 140 + 30} stroke="#cfd8cb" strokeWidth={3} /><Txt x={100} y={500 + i * 140} size={44} anchor="start" ls={3}>{l}</Txt><Txt x={620} y={500 + i * 140} size={i > 1 ? 40 : 64} anchor="end" fill={i === 3 ? '#4aa86a' : '#c93a2e'} ls={2}>{v}</Txt></g>)}
        </g>
      );
    } },
    // 28-30 a lifetime of food; alone you would not have made it to day 21
    { at: 28, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="dusk" />
        <g transform="translate(0 0)">{hero(470, 520, 0.95, POSE.sit(), true)}{girl(535, 520, 0.95, POSE.sit(), true)}<Cat x={625} floor={520} s={0.4} flip t={c.lt} /></g>
        <g opacity={ramp(c.lt, c.s(29), c.s(29) + 0.5)}><rect x={60} y={170} width={600} height={190} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={360} y={238} size={40} fill="#d9b04a" ls={3}>ALONE, YOU WOULD NOT</Txt><Txt x={360} y={300} size={54} fill="#f6f1e2" ls={3}>HAVE SEEN DAY 21</Txt></g>
        <g opacity={ramp(c.lt, c.s(30), c.s(30) + 0.4)}><Txt x={360} y={1040} size={60} fill="#f6f1e2" stroke="#07050f" ls={3}>YOU KNOW THAT NOW.</Txt></g>
      </g>
    ) },
    // 31-33 every night at nine the key scratches at the staff entrance
    { at: 31, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#5a5668" floor="#3a3748" line={900} /><Dark o={0.2} color="#07050f" />
        <Door x={290} y={320} w={230} h={580} sign="STAFF" color="#6a7580" />
        <RheaDead x={590} floor={900} s={1.9} t={c.t} flip arm={1 + Math.sin(c.lt * 7)} />
        {hero(110, 900, 1.7, { ...POSE.idle(c.lt), head: 8 })}{girl(190, 920, 1.5, POSE.idle(c.lt + 1))}<Cat x={60} floor={1010} s={0.7} t={c.lt} />
        <g transform="translate(360 190)"><rect x={-210} y={-60} width={420} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={30} size={74} fill="#7dffb0" ls={6}>9:00 PM</Txt></g>
        <g opacity={ramp(c.lt, c.s(32), c.s(32) + 0.4)}><Txt x={360} y={1090} size={50} fill="#f6f1e2" stroke="#07050f" ls={3}>RHEA IS STARTING HER SHIFT</Txt></g>
        <g opacity={ramp(c.lt, c.s(33), c.s(33) + 0.4)}><Txt x={360} y={1160} size={50} fill="#d9b04a" stroke="#07050f" ls={3}>SHE HAS NEVER MISSED ONE.</Txt></g>
      </g>
    ) },
    // 34 neither have you, then the title
    { at: 34, push: [1, 1.05], el: (c) => {
      const tt = ramp(c.lt, c.e(34) + 0.6, c.e(34) + 1.4);
      return (
        <g><LotSide tone="night" lit />
          {hero(500, 520, 1.0, POSE.idle(c.lt), true)}{girl(570, 520, 1.0, POSE.idle(c.lt + 1), true)}<Cat x={650} floor={520} s={0.45} flip t={c.lt} />
          <Txt x={360} y={190} size={72} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.1, 0.5)}>NEITHER HAVE YOU.</Txt>
          <rect width={W} height={H} fill="#0e0a1c" opacity={tt} />
          <g opacity={tt} transform={`translate(360 ${lerp(520, 480, tt)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize={190} fill="#e5361d" stroke="#2a0608" strokeWidth={6} paintOrder="stroke" letterSpacing={6}>DEAD</text>
            <text x={0} y={180} textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize={190} fill="#f3e8cf" stroke="#2a0608" strokeWidth={6} paintOrder="stroke" letterSpacing={6}>HOURS</text>
            <Txt x={0} y={290} size={40} fill="#b7a784" ls={6}>28 DAYS LOCKED INSIDE</Txt><Txt x={0} y={342} size={40} fill="#b7a784" ls={6}>A GROCERY STORE</Txt>
            <Txt x={0} y={470} size={44} fill="#f3e8cf" ls={10} o={ramp(c.lt, c.e(34) + 1.6, c.e(34) + 2.2)}>THE END</Txt>
          </g>
        </g>
      );
    } },
  ],
  cues: [
    [0, 0.8, 'click'], [1, 0.4, 'steps', 2.5], [2, 0.5, 'whoosh'], [2, 2.0, 'thud'], [3, 0.4, 'steps', 2], [4, 0.9, 'toot'], [4, 1.6, 'moan', 1],
    [5, 0.2, 'engine', 4], [7, 0.3, 'ding'], [9, 0.2, 'ratchet', 4], [10, 0.4, 'ratchet', 3], [12, 0.3, 'ding'],
    [13, 0.2, 'engine', 4.5], [14, 0.4, 'clink'], [14, 1.2, 'clink'], [15, 0.6, 'ding'],
    [16, 0.1, 'alarm', 5], [16, 0.2, 'sting'], [16, 0.5, 'moan', 5], [18, 0.1, 'alarm', 5], [19, 0.3, 'engine', 4], [20, 0.1, 'alarm', 4], [20, 0.4, 'moan', 4],
    [22, 0.6, 'toot'], [24, 0.1, 'ding'], [25, 0.1, 'ding'], [26, 0.1, 'ding'], [27, 0.1, 'ding'],
    [31, 0.4, 'scratch', 4], [32, 0.4, 'scratch', 3], [33, 0.4, 'scratch', 3], [34, 1.9, 'sting'],
  ],
};
void Cat; void H; void lerp; void clamp; void rnd; void AisleSign; void CardBg; void Dark; void LockPlate; void ShelfRow;
