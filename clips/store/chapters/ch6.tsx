/** Chapter 6: Closing Time (script v3). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { AisleSign, Bar, Bucket, CardBg, Cat, Clock, Dark, Dead, Door, INK, Interior, Person, POSE, ShelfRow, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../lib.tsx';
import { LotSide, Mob, ShelvesBack } from '../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const girl = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="kid" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const rhea = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="dana" x={x} floor={floor} s={s} pose={pose} flip={flip} mouth="none" />;
const Suit: React.FC<{ x: number; floor: number; s?: number; flip?: boolean; pose?: any }> = ({ x, floor, s = 1.2, flip = true, pose }) => (
  <g>
    <g style={{ filter: 'grayscale(1) brightness(2.6)' }}><Person kind="kid" x={x} floor={floor} s={s} flip={flip} pose={pose ?? POSE.idle()} mouth="none" /></g>
    <g transform={`translate(${x} ${floor - 66 * s}) scale(${(flip ? -1 : 1) * s} ${s})`}><path d="M -3 -84 A 26 26 0 0 1 22 -86 L 24 -66 L -2 -64 Z" fill="#1c2630" stroke={INK} strokeWidth={2.5} /><rect x={-14} y={-52} width={28} height={50} fill="#e8eef2" stroke={INK} strokeWidth={2.4} opacity={0.9} /></g>
  </g>
);
const Waves: React.FC<{ x: number; y: number; t: number; n?: number; max?: number; color?: string; o?: number }> = ({ x, y, t, n = 4, max = 420, color = '#d9462a', o = 1 }) => (
  <g>{Array.from({ length: n }, (_, k) => { const r = (t * 0.9 + k / n) % 1; return <circle key={k} cx={x} cy={y} r={20 + r * max} fill="none" stroke={color} strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * o} />; })}</g>
);
const Rings: React.FC<{ x: number; y: number; t0: number; lt: number; color?: string }> = ({ x, y, t0, lt, color = '#c93a2e' }) => {
  const k = ramp(lt, t0, t0 + 0.6);
  return k > 0 && k < 1 ? <g opacity={1 - k}><circle cx={x} cy={y} r={30 + k * 170} fill="none" stroke={color} strokeWidth={9} /><circle cx={x} cy={y} r={14 + k * 100} fill="none" stroke={color} strokeWidth={6} /></g> : null;
};
const Speaker: React.FC<{ x: number; y: number; t: number; on: number }> = ({ x, y, t, on }) => (
  <g><rect x={x - 46} y={y - 36} width={92} height={72} rx={12} fill="#2a2220" stroke={INK} strokeWidth={5} /><circle cx={x} cy={y} r={26} fill="#555" stroke="#aaa" strokeWidth={4} /><circle cx={x} cy={y} r={9} fill="#222" />
    {[0, 1, 2].map((k) => { const r = (t * 1.1 + k / 3) % 1; return <circle key={k} cx={x} cy={y} r={40 + r * 300} fill="none" stroke="#ffe6a8" strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * on} />; })}</g>
);
const FreezerFront: React.FC<{ open?: number }> = ({ open = 0 }) => (
  <g><rect x={160} y={200} width={400} height={720} fill="#5a6672" stroke={INK} strokeWidth={5} />{open > 0 && <rect x={190} y={230} width={340} height={660} fill="#cfe8f4" />}
    <polygon points={`190,230 ${190 + 340 * (1 - open * 0.85)},${230 + open * 40} ${190 + 340 * (1 - open * 0.85)},${890 - open * 40} 190,890`} fill="#b7c3cf" stroke={INK} strokeWidth={5} />{open < 0.1 && <g><rect x={206} y={246} width={308} height={628} fill="none" stroke="#3a3d42" strokeWidth={16} />{[[190, 360, 80], [530, 360, -80], [190, 560, 80], [530, 640, -80]].map(([tx, ty, r], i) => <g key={i} transform={`translate(${tx} ${ty}) rotate(${r})`}><rect x={-75} y={-13} width={150} height={26} fill="#e4d49a" stroke={INK} strokeWidth={2.5} /></g>)}<rect x={270} y={290} width={180} height={60} fill="#f4ecd0" stroke={INK} strokeWidth={3} /><Txt x={360} y={332} size={34} fill="#c93a2e">DO NOT OPEN</Txt></g>}</g>
);

export const ch: Chapter = {
  n: 6, label: 'CLOSING TIME', ending: true,
  scenes: [
    // 0-1 nine o'clock: three knocks, a pause, three more
    { at: 0, push: [1, 1.05], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(1) + o);
      return (
        <g><Interior wall="#4a4660" floor="#2e2a3e" line={900} /><Dark o={0.35} color="#07050f" />
          <g transform="translate(360 190)"><rect x={-200} y={-60} width={400} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={30} size={74} fill="#7dffb0" ls={6}>9:00 PM</Txt></g>
          {hits.map((h, i) => <Rings key={i} x={360} y={640} t0={h} lt={c.lt} />)}{hero(150, 1050, 1.7, { ...POSE.idle(c.lt), head: 10 })}{girl(250, 1060, 1.5, POSE.idle(c.lt + 1))}
        </g>
      );
    } },
    // 2-4 this time someone knocks back from the other side of the roof hatch
    { at: 2, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#4a4660" floor="#2e2a3e" line={900} /><Dark o={0.3} color="#07050f" />
        <rect x={210} y={110} width={300} height={190} fill="#6a7580" stroke={INK} strokeWidth={6} /><rect x={226} y={126} width={268} height={158} fill="none" stroke="#3a3d42" strokeWidth={8} /><Txt x={360} y={220} size={34} fill="#d9d4c0" ls={3}>ROOF HATCH</Txt>
        <Rings x={360} y={200} t0={c.s(2) + 0.3} lt={c.lt} color="#f0c43a" /><Rings x={360} y={200} t0={c.s(2) + 1.1} lt={c.lt} color="#f0c43a" />
        {hero(230, 1060, 1.8, { ...POSE.idle(c.lt), head: -14 })}{girl(430, 1070, 1.6, { ...POSE.idle(c.lt + 1), head: -14 })}<Cat x={600} floor={1075} s={0.8} t={c.lt} />
        <g opacity={ramp(c.lt, c.s(3), c.s(3) + 0.4)}><Txt x={360} y={1180} size={50} fill="#f6f1e2" stroke="#07050f" ls={3}>YOU LOOK AT MINA. MINA LOOKS AT YOU.</Txt></g></g>
    ) },
    // 5 somebody is in the freezer
    { at: 5, push: [1, 1.07], el: (c) => (
      <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><Dark o={0.2} color="#07050f" /><FreezerFront />
        {[0.2, 0.8, 1.4].map((o, i) => <Rings key={i} x={360} y={560} t0={o + 0.3} lt={c.lt} color="#9fd0e8" />)}{hero(80, 1080, 1.6, POSE.idle(c.lt))}{girl(640, 1090, 1.5, POSE.idle(c.lt + 1), true)}
        <Txt x={360} y={1160} size={54} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.5, 1.0)}>SOMEBODY IS IN THE FREEZER.</Txt></g>
    ) },
    // 6-8 why do the dead go still? the cold slows them
    { at: 6, card: true, el: (c) => {
      const cold = ramp(c.lt, c.s(7), c.s(7) + 0.8);
      return (
        <g><CardBg /><Txt x={360} y={180} size={56} ls={3}>WHY DO THE DEAD</Txt><Txt x={360} y={246} size={56} ls={3}>GO STILL AT NIGHT?</Txt>
          <rect x={60} y={320} width={290} height={600} rx={18} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><rect x={370} y={320} width={290} height={600} rx={18} fill="#d4e8f4" stroke={INK} strokeWidth={5} />
          <Txt x={205} y={380} size={36} fill="#c93a2e">WARM</Txt><Txt x={515} y={380} size={36} fill="#2f7fb8">COLD</Txt>
          <Dead x={205} floor={900} s={1.7} t={c.t} seed={3} still={false} /><Dead x={515} floor={900} s={1.7} t={50 + Math.min(c.lt, c.s(7))} seed={4} still={false} />
          {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={400 + rnd(i) * 230} cy={420 + rnd(i + 3) * 480} r={3} fill="#fff" opacity={cold * (0.4 + 0.5 * tri(c.lt * 2 + i))} />)}
          <g opacity={ramp(c.lt, c.s(8), c.s(8) + 0.4)}><Txt x={360} y={1040} size={52} fill="#2f5e86" ls={3}>…AND IN THE FREEZER?</Txt></g></g>
      );
    } },
    // 9-10 night one: bitten at the fire exit
    { at: 9, push: [1, 1.06], el: (c) => (
      <g><Interior wall="#7f7a8a" line={900} /><Dark o={0.35} color="#10101c" /><Door x={110} y={300} w={230} h={600} open={0.55} color="#6a7580" />
        {rhea(430, 1000, 2.0, { ...POSE.idle(c.lt), lU: 70, lF: 110, head: 10 }, true)}
        <g transform={`translate(${430 - 24} 800)`} opacity={ramp(c.lt, c.s(10), c.s(10) + 0.4)}><path d="M -14 -6 l 10 -14 l 8 14 l 10 -14 l 6 22 l -34 2 z" fill="#7a1c1c" stroke="#3a0a0a" strokeWidth={2.5} /></g>
        <Txt x={360} y={190} size={56} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>NIGHT ONE</Txt><Txt x={360} y={1160} size={48} fill="#d9462a" stroke="#07050f" ls={3} o={ramp(c.lt, c.s(10), c.s(10) + 0.4)}>BITTEN AT THE FIRE EXIT.</Txt></g>
    ) },
    // 11 she locks herself in the one place that keeps her human
    { at: 11, push: [1, 1.07], el: (c) => {
      const open = 1 - ease(ramp(c.lt, 1.0, 2.2));
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><FreezerFront open={open} />
          {open > 0.2 && <g style={{ opacity: open }}>{rhea(lerp(330, 360, 1 - open), 880, 1.5, POSE.walk(c.lt, 0.9, 6), false)}</g>}
          {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={240 + rnd(i) * 240} cy={300 + rnd(i + 2) * 500} r={3} fill="#fff" opacity={0.3 + 0.5 * tri(c.lt * 1.6 + i)} />)}
          <Txt x={360} y={1060} size={46} fill="#2f5e86" ls={3} o={ramp(c.lt, 0.3, 0.8)}>THE ONE PLACE THAT KEEPS HER HUMAN.</Txt></g>
      );
    } },
    // 12-13 the envelope was a map to reach her
    { at: 12, card: true, el: (c) => {
      const k = ramp(c.lt, c.s(13), c.s(13) + 1.2);
      return (
        <g><rect width={W} height={H} fill="#1f3b5c" />{Array.from({ length: 18 }, (_, i) => <line key={i} x1={0} y1={i * 72} x2={W} y2={i * 72} stroke="#2f527a" strokeWidth={2} />)}{Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 72} y1={0} x2={i * 72} y2={H} stroke="#2f527a" strokeWidth={2} />)}
          <rect x={90} y={250} width={540} height={560} fill="none" stroke="#cfe3ee" strokeWidth={6} /><rect x={440} y={280} width={170} height={240} fill="#9fd0e8" opacity={0.3} stroke="#cfe3ee" strokeWidth={4} /><Txt x={525} y={410} size={30} fill="#fff" ls={2}>FREEZER</Txt>
          <path d="M 180 900 L 525 900 L 525 520" fill="none" stroke="#ffe6a8" strokeWidth={7} strokeDasharray="20 14" opacity={k} /><circle cx={lerp(180, 525, ramp(k, 0, 0.6))} cy={900} r={14} fill="#d9b04a" opacity={k > 0 ? 1 : 0} />
          <g opacity={ramp(c.lt, 0.2, 0.6)}><Txt x={360} y={170} size={50} fill="#cfe3ee" ls={4}>NOT A MAP TO ESCAPE.</Txt></g><g opacity={ramp(c.lt, c.s(13), c.s(13) + 0.5)}><Txt x={360} y={1060} size={60} fill="#ffe6a8" ls={4}>A MAP TO REACH HER.</Txt></g></g>
      );
    } },
    // 14 then you prepare for the suits
    { at: 14, push: [1, 1.06], el: (c) => (
      <g><ShelvesBack /><AisleSign x={360} y={50} n="9" label="ALARM CLOCKS" sub="LOUD ONES" s={1.1} />{hero(250, 1080, 1.8, { ...POSE.idle(c.lt), lU: 90, lF: 100 })}{girl(450, 1090, 1.6, { ...POSE.idle(c.lt + 1), lU: 90, lF: 100 })}<Cat x={600} floor={1095} s={0.8} t={c.lt} />
        <Txt x={360} y={1200} size={56} fill="#2a2220" ls={4} o={ramp(c.lt, 0.3, 0.8)}>THE PLAN.</Txt></g>
    ) },
    // 15-16 you cannot stop three people, but you know what can
    { at: 15, push: [1, 1.05], el: (c) => (
      <g><LotSide tone="night" />{[0, 1, 2].map((i) => <Suit key={i} x={110 + i * 70} floor={1190} s={1.2} flip={false} />)}<Person kind="hero" x={540} floor={520} s={0.95} pose={POSE.idle(c.lt)} flip />
        <g opacity={ramp(c.lt, c.s(15), c.s(15) + 0.4)}><rect x={60} y={260} width={430} height={110} rx={16} fill="#2a2220" opacity={0.9} /><Txt x={275} y={332} size={42} fill="#f6f1e2" ls={2}>YOU CANNOT STOP THREE.</Txt></g>
        <g opacity={ramp(c.lt, c.s(16), c.s(16) + 0.4)} transform={`translate(560 360) scale(${pop(ramp(c.lt, c.s(16), c.s(16) + 0.6))})`}><circle r={60} fill="#ffe28a" stroke={INK} strokeWidth={6} /><rect x={-22} y={50} width={44} height={26} rx={6} fill="#8a8f93" stroke={INK} strokeWidth={5} /><Txt x={0} y={22} size={80} fill={INK}>!</Txt></g></g>
    ) },
    // 17 thirty alarm clocks and the van horn
    { at: 17, push: [1, 1.04], el: (c) => {
      const n = Math.floor(ramp(c.lt, 0.3, c.d - 0.4) * 30);
      return (
        <g><ShelvesBack rows={0} /><AisleSign x={360} y={60} n="9" label="ALARM CLOCKS" sub="LOUD ONES" s={1.2} />
          {Array.from({ length: 30 }, (_, i) => i < n && <Clock key={i} x={90 + (i % 6) * 108} y={290 + Math.floor(i / 6) * 150} s={0.5} hour={(i * 5) % 12} min={(i * 11) % 60} />)}
          <g transform="translate(360 1090)"><rect x={-260} y={-70} width={520} height={130} rx={16} fill="#2a2220" opacity={0.9} /><Txt x={0} y={28} size={80} fill="#d9462a" ls={3}>{`${n} CLOCKS + VAN HORN`}</Txt></g></g>
      );
    } },
    // 18-20 winding: one person 30 minutes, two people 15
    { at: 18, card: true, el: (c) => (
      <g><CardBg /><Txt x={360} y={170} size={50} ls={3}>WINDING 30 CLOCKS</Txt>
        <Bar x={70} y={310} w={580} h={76} v={ramp(c.lt, 0.3, 1.6)} label="ONE PERSON" value="30 MIN" color="#d9462a" /><g opacity={ramp(c.lt, 0.2, 0.6)}>{hero(130, 560, 0.9, { ...POSE.idle(c.lt), lU: 60, lF: 90 })}</g>
        <Bar x={70} y={700} w={580} h={76} v={ramp(c.lt, c.s(19), c.s(19) + 1.0) * 0.5} label="TWO PEOPLE" value="15 MIN" color="#4aa86a" /><g opacity={ramp(c.lt, c.s(19), c.s(19) + 0.4)}>{hero(110, 960, 0.9, { ...POSE.idle(c.lt), lU: 60, lF: 90 })}{girl(220, 960, 0.9, { ...POSE.idle(c.lt + 1), lU: 60, lF: 90 })}</g>
        <g opacity={ramp(c.lt, c.s(20), c.s(20) + 0.5)} transform={`translate(360 1130) scale(${pop(ramp(c.lt, c.s(20), c.s(20) + 0.6))})`}><Txt x={0} y={0} size={44} fill="#c93a2e" ls={2}>THE POINT OF OTHER PEOPLE</Txt></g></g>
    ) },
    // 21 at four the suits cut the shutter
    { at: 21, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="night" shutter={1 - ramp(c.lt, 0.8, c.d - 0.2) * 0.35} />{[0, 1, 2].map((i) => <Suit key={i} x={330 + i * 40} floor={1130 + (i % 2) * 20} s={1.2} flip />)}
        {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={440 + rnd(i) * 160} cy={860 + rnd(i + 2) * 80} r={3 + rnd(i + 5) * 3} fill="#ffb347" opacity={tri(c.lt * 9 + i) * 0.95} />)}
        <g transform="translate(360 200)"><rect x={-170} y={-60} width={340} height={110} rx={18} fill="#2a2220" opacity={0.9} /><Txt x={0} y={30} size={74} fill="#7dffb0" ls={6}>4:00 AM</Txt></g></g>
    ) },
    // 22-23 the bucket drops: thirty clocks, all set for 4:10
    { at: 22, push: [1, 1.06], el: (c) => {
      const k = ease(ramp(c.lt, 0.5, c.d - 0.3));
      return (
        <g><LotSide tone="night" /><Person kind="hero" x={430} floor={520} s={0.95} pose={POSE.pull(POSE.idle(c.lt))} /><line x1={400} y1={520} x2={lerp(400, 330, k)} y2={lerp(560, 1020, k)} stroke="#c9b27a" strokeWidth={5} /><Bucket x={lerp(400, 330, k)} y={lerp(590, 1050, k)} s={0.9} />
          <Txt x={360} y={190} size={54} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, 0.2, 0.6)}>ONE LAST DELIVERY</Txt>
          <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.4)} transform="translate(360 330)"><rect x={-210} y={-60} width={420} height={120} rx={16} fill="#2a2220" opacity={0.92} /><Txt x={0} y={-8} size={32} fill="#d9b04a" ls={3}>30 CLOCKS · ALL SET FOR</Txt><Txt x={0} y={38} size={64} fill="#7dffb0" ls={6}>4:10</Txt></g></g>
      );
    } },
    // 24-25 the loudest thing in a month: everything turns toward it
    { at: 24, push: [1, 1.07], el: (c) => (
      <g><LotSide tone="night" /><Mob n={80} t={c.t} seed={61} x0={60} x1={400} f0={930} f1={1190} face="left" still={false} />
        {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${70 + i * 30} 1000) scale(0.45)`}><Clock x={0} y={0} t={c.lt + i} ring={1} hour={4} min={10} /></g>)}
        <Waves x={150} y={1000} t={c.lt * 1.3} n={6} max={780} /><Txt x={360} y={190} size={84} fill="#e5361d" stroke="#07050f" ls={4} o={0.6 + 0.4 * tri(c.lt * 6)}>RRRINNNG!!</Txt></g>
    ) },
    // 26-27 the suits do the smart thing: drop their tools and run
    { at: 26, push: [1, 1.05], el: (c) => {
      const run = ease(ramp(c.lt, c.s(27), c.d));
      return (
        <g><LotSide tone="night" /><Waves x={150} y={1000} t={c.lt * 1.3} n={5} max={700} />
          {[0, 1, 2].map((i) => <Suit key={i} x={lerp(420 + i * 50, 880, run)} floor={1130 + (i % 2) * 20} s={1.2} flip pose={run > 0 ? POSE.run(c.lt + i * 0.3, 1.8) : POSE.idle()} />)}
          {[0, 1, 2].map((i) => <g key={i} opacity={ramp(c.lt, c.s(27), c.s(27) + 0.3)} transform={`translate(${440 + i * 36} ${1150 + (i % 2) * 18}) rotate(${40 + i * 25})`}><rect x={-6} y={-30} width={12} height={60} fill="#8a8f93" stroke={INK} strokeWidth={3} /></g>)}
          <Txt x={360} y={190} size={56} fill="#f6f1e2" stroke="#07050f" ls={3} o={ramp(c.lt, c.s(27), c.s(27) + 0.4)}>THEY RUN.</Txt></g>
      );
    } },
    // 28-29 the noise goes with them, and so does the crowd
    { at: 28, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.2, c.d - 0.1));
      return (
        <g><LotSide tone="night" /><g transform={`translate(${-k * 520} 0)`}><Mob n={80} t={c.t} seed={61} x0={60} x1={400} f0={930} f1={1190} face="left" still={false} /></g>
          <Waves x={lerp(120, -300, k)} y={1010} t={c.lt} n={4} max={500} o={1 - k} /><Txt x={360} y={190} size={56} fill="#f6f1e2" stroke="#07050f" ls={3} o={1 - ramp(c.lt, c.s(29) + 0.6, c.d)}>THE NOISE LEAVES. THE CROWD LEAVES.</Txt></g>
      );
    } },
    // 30 by sunrise the lot is empty
    { at: 30, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="dawn" /><Person kind="hero" x={500} floor={520} s={0.95} pose={{ ...POSE.idle(c.lt), lU: 150 + Math.sin(c.lt * 5) * 15, lF: 150 }} flip />{girl(560, 520, 0.95, POSE.idle(c.lt + 1), true)}<Cat x={630} floor={520} s={0.42} flip t={c.lt} />
        <Txt x={360} y={190} size={60} fill="#6a4a36" ls={4} o={ramp(c.lt, 0.2, 0.6)}>SUNRISE: EMPTY LOT</Txt></g>
    ) },
    // 31 day 28
    { at: 31, card: true, el: (c) => (
      <g><CardBg /><g transform={`translate(360 640) scale(${pop(ramp(c.lt, 0.1, 0.7))})`}><Txt x={0} y={-60} size={44} fill="#6f7f6a" ls={8}>NIGHT</Txt><Txt x={0} y={120} size={220} fill="#c93a2e" ls={4}>28</Txt></g></g>
    ) },
    // 32-33 you open the freezer: frost pours out
    { at: 32, push: [1, 1.06], el: (c) => {
      const open = ease(ramp(c.lt, 0.5, c.s(33) + 0.8));
      return (
        <g><Interior wall="#a9b4be" floor="#8e99a4" line={900} tiles={false} /><FreezerFront open={open} />
          {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={260 + rnd(i) * 200 + open * (i * 14)} cy={900 - ((c.lt * 40 + i * 30) % 90) + rnd(i + 3) * 40} rx={60 + rnd(i + 6) * 60} ry={22 + rnd(i + 8) * 20} fill="#e8f4fb" opacity={open * 0.55} />)}
          {hero(90, 1090, 1.6, POSE.idle(c.lt))}{girl(640, 1100, 1.5, POSE.idle(c.lt + 1), true)}</g>
      );
    } },
    // 34-36 Rhea sits against the back wall, alive: how long?
    { at: 34, push: [1, 1.07], el: (c) => (
      <g><rect width={W} height={H} fill="#bcd6e6" /><rect y={900} width={W} height={380} fill="#9fb8c8" />{Array.from({ length: 5 }, (_, i) => <rect key={i} x={20 + i * 140} y={240} width={120} height={500} fill="#e8f4fb" stroke={INK} strokeWidth={4} opacity={0.7} />)}
        <g transform="translate(470 920)"><g style={{ filter: 'saturate(0.45) brightness(1.1)' }}>{rhea(0, 0, 2.0, POSE.sit())}</g></g>
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i + 2) * 900} r={2.5} fill="#fff" opacity={0.3 + 0.6 * tri(c.lt * 1.4 + i)} />)}
        {hero(130, 1010, 1.7, POSE.idle(c.lt))}
        <g opacity={ramp(c.lt, c.s(35), c.s(35) + 0.4)} transform={`translate(470 430) scale(${pop(ramp(c.lt, c.s(35), c.s(35) + 0.5))})`}><rect x={-190} y={-70} width={380} height={130} rx={18} fill="#fff" stroke={INK} strokeWidth={5} /><Txt x={0} y={-8} size={36} fill="#6f7f6a" ls={3}>HOW LONG?</Txt><Txt x={0} y={36} size={34} fill="#2f5e86" ls={2}>she whispers</Txt></g>
        <g opacity={ramp(c.lt, c.s(36), c.s(36) + 0.4)}><Txt x={130} y={640} size={40} fill="#c93a2e" ls={3}>…28 NIGHTS.</Txt></g></g>
    ) },
    // 37-39 the intercom crackles in Rhea's own voice: do not turn the power back on
    { at: 37, push: [1, 1.07], el: (c) => {
      const flick = Math.sin(c.lt * 40) > 0.5 ? 0.35 : 0;
      return (
        <g><Interior wall="#4a4660" floor="#2e2a3e" line={900} /><Dark o={0.45 + flick} color="#07050f" /><Speaker x={360} y={150} t={c.lt} on={ramp(c.lt, c.s(37), c.s(37) + 0.4)} />
          <g opacity={ramp(c.lt, c.s(38), c.s(38) + 0.4)} transform="translate(360 440)"><rect x={-310} y={-90} width={620} height={180} rx={20} fill="#fff" stroke={INK} strokeWidth={6} /><Txt x={0} y={-10} size={46} fill="#2a2220" ls={2}>ATTENTION, SHOPPERS</Txt><Txt x={0} y={46} size={34} fill="#6f7f6a" ls={3}>— recorded on night one</Txt></g>
          <g opacity={ramp(c.lt, c.s(39), c.s(39) + 0.3)} transform={`translate(360 760) scale(${pop(ramp(c.lt, c.s(39), c.s(39) + 0.5))})`}><rect x={-300} y={-70} width={600} height={170} rx={16} fill="#c93a2e" stroke={INK} strokeWidth={6} /><Txt x={0} y={-6} size={50} fill="#fff" ls={3}>DO NOT TURN THE</Txt><Txt x={0} y={52} size={60} fill="#fff" ls={3}>POWER BACK ON.</Txt></g>
          {hero(150, 1080, 1.7, { ...POSE.idle(c.lt), head: -10 })}{girl(260, 1090, 1.5, POSE.idle(c.lt + 1))}</g>
      );
    } },
    // 40-41 outside, the sun is rising, and the temperature with it; then the title
    { at: 40, push: [1, 1.05], el: (c) => {
      const warm = ramp(c.lt, 0.4, c.e(41));
      const tt = ramp(c.lt, c.e(41) + 0.5, c.e(41) + 1.4);
      return (
        <g><LotSide tone="dawn" />
          <Mob n={60} t={c.t} seed={5} x0={40} x1={380} still={warm < 0.5} shown={1} face="right" />
          <g transform="translate(110 340)"><rect x={-26} y={-120} width={52} height={230} rx={26} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><circle cx={0} cy={112} r={34} fill={warm > 0.3 ? '#c93a2e' : '#4aa0d8'} stroke={INK} strokeWidth={5} /><rect x={-10} y={lerp(80, -90, warm)} width={20} height={lerp(30, 190, warm)} fill={warm > 0.3 ? '#c93a2e' : '#4aa0d8'} /></g>
          <Txt x={360} y={190} size={50} fill="#6a4a36" ls={4} o={ramp(c.lt, 0.2, 0.6)}>THE SUN IS RISING.</Txt>
          <rect width={W} height={H} fill="#0e0a1c" opacity={tt} />
          <g opacity={tt} transform={`translate(360 ${lerp(520, 480, tt)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize={150} fill="#e5361d" stroke="#2a0608" strokeWidth={6} paintOrder="stroke" letterSpacing={6}>OAKLINE</text>
            <text x={0} y={160} textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize={150} fill="#f3e8cf" stroke="#2a0608" strokeWidth={6} paintOrder="stroke" letterSpacing={6}>AFTER DARK</text>
            <Txt x={0} y={270} size={40} fill="#b7a784" ls={6}>28 NIGHTS LOCKED IN</Txt><Txt x={0} y={322} size={40} fill="#b7a784" ls={6}>A SUPERMARKET</Txt>
          </g></g>
      );
    } },
  ],
  cues: [
    [0, 0.2, 'ding'], [1, 0.1, 'knock'], [1, 0.55, 'knock'], [1, 1.0, 'knock'], [1, 1.9, 'knock'], [1, 2.35, 'knock'], [1, 2.8, 'knock'],
    [2, 0.3, 'knock'], [2, 1.1, 'knock'], [5, 0.5, 'knock'], [5, 1.1, 'knock'], [5, 1.7, 'knock'], [7, 0.3, 'hiss'], [9, 0.4, 'moan', 2], [10, 0.3, 'snap'], [11, 1.0, 'clunk'], [11, 1.2, 'slam'],
    [13, 0.5, 'ding'], [15, 0.4, 'ding'], [17, 0.2, 'ratchet', 3.5], [19, 0.3, 'ding'], [21, 0.4, 'hiss'], [21, 1.0, 'slam'], [22, 0.8, 'ratchet', 2], [23, 0.3, 'ding'],
    [24, 0.1, 'alarm', 5], [24, 0.2, 'sting'], [24, 0.5, 'moan', 5], [26, 0.1, 'alarm', 4], [27, 0.3, 'run', 3], [28, 0.2, 'moan', 4], [31, 0.1, 'slam'], [32, 0.6, 'creak'], [32, 1.4, 'hiss'],
    [35, 0.2, 'drip'], [37, 0.2, 'surge'], [38, 0.3, 'ding'], [39, 0.1, 'sting'], [40, 0.4, 'whoosh'], [41, 0.8, 'moan', 4],
  ],
};
void AisleSign; void Bucket; void Door; void ShelfRow; void H; void lerp; void clamp; void CardBg;
