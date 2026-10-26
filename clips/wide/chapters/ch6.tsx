/** Chapter 6: Closing Time (16:9, script v4). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { AisleSignW, Bucket, Callout, Cat, CardW, Clock, DarkW, Dead, Door, FreezerDoorW, INK, LotW, Mob, Person, POSE, Rings, Room, ShelvesW, Speaker, Suit, Txt, Waves, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../kit.tsx';
import { BarW } from '../parts.tsx';

const F = 560;
const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const girl = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="kid" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const rhea = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="dana" x={x} floor={floor} s={s} pose={pose} flip={flip} mouth="none" />;

export const ch: Chapter = {
  n: 6, label: 'CLOSING TIME', ending: true,
  scenes: [
    // 0-1 nine o'clock: three knocks, a pause, three more
    { at: 0, push: [1, 1.04], el: (c) => {
      const hits = [0.1, 0.55, 1.0, 1.9, 2.35, 2.8].map((o) => c.s(1) + o);
      return (
        <g><Room wall="#4a4660" floor="#2e2a3e" line={500} /><DarkW o={0.35} /><Callout x={1030} y={150} w={340} lines={[{ t: '9:00 PM', size: 70, fill: '#7dffb0' }]} />
          {hits.map((h, i) => <Rings key={i} x={640} y={300} t0={h} lt={c.lt} />)}{hero(250, F, 1.7, { ...POSE.idle(c.lt), head: 10 })}{girl(380, F + 6, 1.5, POSE.idle(c.lt + 1))}
        </g>
      );
    } },
    // 2-4 this time someone knocks back from the other side of the roof hatch
    { at: 2, push: [1, 1.04], el: (c) => (
      <g><Room wall="#4a4660" floor="#2e2a3e" line={500} /><DarkW o={0.3} />
        <rect x={500} y={40} width={280} height={150} fill="#6a7580" stroke={INK} strokeWidth={6} /><rect x={516} y={56} width={248} height={118} fill="none" stroke="#3a3d42" strokeWidth={8} /><Txt x={640} y={126} size={30} fill="#d9d4c0" ls={3} maxW={220}>ROOF HATCH</Txt>
        <Rings x={640} y={120} t0={c.s(2) + 0.3} lt={c.lt} color="#f0c43a" /><Rings x={640} y={120} t0={c.s(2) + 1.1} lt={c.lt} color="#f0c43a" />
        {hero(400, F, 1.8, { ...POSE.idle(c.lt), head: -14 })}{girl(600, F + 8, 1.6, { ...POSE.idle(c.lt + 1), head: -14 })}<Cat x={780} floor={F + 10} s={0.8} t={c.lt} />
        <Callout x={1040} y={330} w={380} lines={[{ t: 'YOU LOOK AT MINA.', size: 32 }, { t: 'MINA LOOKS AT YOU.', size: 32 }]} o={ramp(c.lt, c.s(3), c.s(3) + 0.4)} />
      </g>
    ) },
    // 5 somebody is in the freezer
    { at: 5, push: [1, 1.05], el: (c) => (
      <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><DarkW o={0.2} /><FreezerDoorW taped={1} x={500} />
        {[0.2, 0.8, 1.4].map((o, i) => <Rings key={i} x={650} y={290} t0={o + 0.3} lt={c.lt} color="#9fd0e8" />)}{hero(240, F, 1.6, POSE.idle(c.lt))}{girl(1040, F + 8, 1.5, POSE.idle(c.lt + 1), true)}
        <Callout x={1040} y={170} w={380} lines={[{ t: 'SOMEBODY IS', size: 38 }, { t: 'IN THE FREEZER.', size: 38 }]} o={ramp(c.lt, 0.5, 1.0)} />
      </g>
    ) },
    // 6-8 why do the dead go still? the cold slows them
    { at: 6, card: true, el: (c) => {
      const cold = ramp(c.lt, c.s(7), c.s(7) + 0.8);
      return (
        <g><CardW /><Txt x={640} y={70} size={50} ls={3} maxW={1100}>WHY DO THE DEAD GO STILL AT NIGHT?</Txt>
          <rect x={120} y={120} width={470} height={430} rx={18} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><rect x={690} y={120} width={470} height={430} rx={18} fill="#d4e8f4" stroke={INK} strokeWidth={5} />
          <Txt x={355} y={170} size={36} fill="#c93a2e">WARM</Txt><Txt x={925} y={170} size={36} fill="#2f7fb8">COLD</Txt>
          <Dead x={355} floor={520} s={1.5} t={c.t} seed={3} still={false} /><Dead x={925} floor={520} s={1.5} t={50 + Math.min(c.lt, c.s(7))} seed={4} still={false} />
          {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={720 + rnd(i) * 410} cy={200 + rnd(i + 3) * 340} r={3} fill="#fff" opacity={cold * (0.4 + 0.5 * tri(c.lt * 2 + i))} />)}
        </g>
      );
    } },
    // 9-10 night one: bitten at the fire exit
    { at: 9, push: [1, 1.04], el: (c) => (
      <g><Room wall="#7f7a8a" line={480} /><DarkW o={0.35} color="#10101c" /><Door x={190} y={100} w={230} h={380} open={0.55} color="#6a7580" />
        {rhea(720, F, 2.0, { ...POSE.idle(c.lt), lU: 70, lF: 110, head: 10 }, true)}
        <g transform="translate(676 400)" opacity={ramp(c.lt, c.s(10), c.s(10) + 0.4)}><path d="M -14 -6 l 10 -14 l 8 14 l 10 -14 l 6 22 l -34 2 z" fill="#7a1c1c" stroke="#3a0a0a" strokeWidth={2.5} /></g>
        <Callout x={1030} y={170} w={340} lines={[{ t: 'NIGHT ONE', size: 56 }]} o={ramp(c.lt, 0.2, 0.6)} /><Callout x={1030} y={320} w={400} lines={[{ t: 'BITTEN AT THE', size: 36, fill: '#ff8a7a' }, { t: 'FIRE EXIT.', size: 50, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(10), c.s(10) + 0.4)} />
      </g>
    ) },
    // 11 she locks herself in the one place that keeps her human
    { at: 11, push: [1, 1.05], el: (c) => {
      const open = 1 - ease(ramp(c.lt, 1.0, 2.2));
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><FreezerDoorW x={500} open={open} />
          {open > 0.2 && <g style={{ opacity: open }}>{rhea(lerp(640, 660, 1 - open), 470, 1.4, POSE.walk(c.lt, 0.9, 6))}</g>}
          {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={540 + rnd(i) * 220} cy={90 + rnd(i + 2) * 380} r={3} fill="#fff" opacity={0.3 + 0.5 * tri(c.lt * 1.6 + i)} />)}
          <Callout x={1040} y={290} w={380} lines={[{ t: 'THE ONE PLACE', size: 34, fill: '#9fd0e8' }, { t: 'THAT KEEPS HER HUMAN', size: 34 }]} o={ramp(c.lt, 0.3, 0.8)} />
        </g>
      );
    } },
    // 12-13 the envelope was a map to reach her
    { at: 12, card: true, el: (c) => {
      const k = ramp(c.lt, c.s(13), c.s(13) + 1.2);
      return (
        <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1f3b5c" />{Array.from({ length: 11 }, (_, i) => <line key={i} x1={-100} y1={i * 72} x2={W + 100} y2={i * 72} stroke="#2f527a" strokeWidth={2} />)}{Array.from({ length: 19 }, (_, i) => <line key={`v${i}`} x1={i * 72} y1={-100} x2={i * 72} y2={H + 100} stroke="#2f527a" strokeWidth={2} />)}
          <rect x={110} y={90} width={1060} height={400} fill="none" stroke="#cfe3ee" strokeWidth={6} /><rect x={780} y={110} width={260} height={220} fill="#9fd0e8" opacity={0.3} stroke="#cfe3ee" strokeWidth={4} /><Txt x={910} y={235} size={32} fill="#fff" ls={2} maxW={220}>FREEZER</Txt>
          <path d="M 260 440 L 910 440 L 910 330" fill="none" stroke="#ffe6a8" strokeWidth={7} strokeDasharray="20 14" opacity={k} /><circle cx={lerp(260, 910, ramp(k, 0, 0.6))} cy={440} r={14} fill="#d9b04a" opacity={k > 0 ? 1 : 0} />
          <Callout x={330} y={150} w={460} lines={[{ t: 'NOT A MAP', size: 40, fill: '#cfe3ee' }, { t: 'TO ESCAPE.', size: 40, fill: '#cfe3ee' }]} fill="#12263c" o={ramp(c.lt, 0.2, 0.6)} />
          <Callout x={330} y={300} w={460} lines={[{ t: 'A MAP TO', size: 40, fill: '#ffe6a8' }, { t: 'REACH HER.', size: 56, fill: '#ffe6a8' }]} fill="#12263c" o={ramp(c.lt, c.s(13), c.s(13) + 0.5)} />
        </g>
      );
    } },
    // 14 then you prepare for the suits
    { at: 14, push: [1, 1.04], el: (c) => (
      <g><ShelvesW /><AisleSignW x={640} y={30} n="9" label="ALARM CLOCKS" sub="LOUD ONES" s={1.1} />{hero(450, F, 1.8, { ...POSE.idle(c.lt), lU: 90, lF: 100 })}{girl(640, F + 8, 1.6, { ...POSE.idle(c.lt + 1), lU: 90, lF: 100 })}<Cat x={800} floor={F + 10} s={0.8} t={c.lt} />
        <Callout x={1050} y={250} w={320} lines={[{ t: 'THE PLAN.', size: 60 }]} o={ramp(c.lt, 0.3, 0.8)} /></g>
    ) },
    // 15-16 you cannot stop three people, but you know what can
    { at: 15, push: [1, 1.04], el: (c) => (
      <g><LotW tone="night" />{[0, 1, 2].map((i) => <Suit key={i} x={170 + i * 90} floor={F} s={1.25} flip={false} />)}<Person kind="hero" x={1000} floor={186} s={0.75} pose={POSE.idle(c.lt)} flip />
        <Callout x={640} y={140} w={560} lines={[{ t: 'YOU CANNOT STOP THREE.', size: 46 }]} o={ramp(c.lt, c.s(15), c.s(15) + 0.4)} />
        <g opacity={ramp(c.lt, c.s(16), c.s(16) + 0.4)} transform={`translate(1000 90) scale(${pop(ramp(c.lt, c.s(16), c.s(16) + 0.6))})`}><circle r={44} fill="#ffe28a" stroke={INK} strokeWidth={5} /><Txt x={0} y={16} size={60} fill={INK} maxW={50}>!</Txt></g></g>
    ) },
    // 17 thirty alarm clocks and the van horn
    { at: 17, push: [1, 1.03], el: (c) => {
      const n = Math.floor(ramp(c.lt, 0.3, c.d - 0.4) * 30);
      return (
        <g><ShelvesW rows={2} /><AisleSignW x={640} y={30} n="9" label="ALARM CLOCKS" sub="LOUD ONES" s={1.1} />
          {Array.from({ length: 30 }, (_, i) => i < n && <Clock key={i} x={110 + (i % 10) * 118} y={190 + Math.floor(i / 10) * 140} s={0.46} hour={(i * 5) % 12} min={(i * 11) % 60} />)}
          <Callout x={640} y={540} w={720} lines={[{ t: `${n} CLOCKS + THE VAN HORN`, size: 44, fill: '#ff8a7a' }]} />
        </g>
      );
    } },
    // 18-20 winding: one person 30 minutes, two people 15
    { at: 18, card: true, el: (c) => (
      <g><CardW /><Txt x={640} y={80} size={50} ls={3} maxW={1000}>WINDING 30 CLOCKS</Txt>
        <BarW x={300} y={190} w={880} h={76} v={ramp(c.lt, 0.3, 1.6)} label="ONE PERSON" value="30 MIN" color="#d9462a" /><g opacity={ramp(c.lt, 0.2, 0.6)}>{hero(150, 300, 0.9, { ...POSE.idle(c.lt), lU: 60, lF: 90 })}</g>
        <BarW x={300} y={400} w={880} h={76} v={ramp(c.lt, c.s(19), c.s(19) + 1.0) * 0.5} label="TWO PEOPLE" value="15 MIN" color="#4aa86a" /><g opacity={ramp(c.lt, c.s(19), c.s(19) + 0.4)}>{hero(110, 510, 0.9, { ...POSE.idle(c.lt), lU: 60, lF: 90 })}{girl(210, 510, 0.9, { ...POSE.idle(c.lt + 1), lU: 60, lF: 90 })}</g>
        <g opacity={ramp(c.lt, c.s(20), c.s(20) + 0.5)} transform={`translate(740 560) scale(${pop(ramp(c.lt, c.s(20), c.s(20) + 0.6))})`}><Txt x={0} y={0} size={38} fill="#c93a2e" ls={2} maxW={800}>THE POINT OF OTHER PEOPLE</Txt></g></g>
    ) },
    // 21 at four the suits cut the shutter
    { at: 21, push: [1, 1.05], el: (c) => (
      <g><LotW tone="night" shutter={1 - ramp(c.lt, 0.8, c.d - 0.2) * 0.35} />{[0, 1, 2].map((i) => <Suit key={i} x={680 + i * 40} floor={F - 30 + (i % 2) * 20} s={1.1} flip />)}
        {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={780 + rnd(i) * 160} cy={380 + rnd(i + 2) * 80} r={3 + rnd(i + 5) * 3} fill="#ffb347" opacity={tri(c.lt * 9 + i) * 0.95} />)}
        <Callout x={330} y={150} w={380} lines={[{ t: '4:00 AM', size: 70, fill: '#7dffb0' }]} /></g>
    ) },
    // 22-23 the bucket drops: thirty clocks, all set for 4:10
    { at: 22, push: [1, 1.05], el: (c) => {
      const k = ease(ramp(c.lt, 0.5, c.d - 0.3));
      return (
        <g><LotW tone="night" /><Person kind="hero" x={790} floor={186} s={0.75} pose={POSE.pull(POSE.idle(c.lt))} /><line x1={760} y1={186} x2={lerp(760, 640, k)} y2={lerp(200, 500, k)} stroke="#c9b27a" strokeWidth={5} /><Bucket x={lerp(760, 640, k)} y={lerp(220, 520, k)} s={0.7} />
          <Callout x={330} y={140} w={440} lines={[{ t: 'ONE LAST DELIVERY', size: 44 }]} o={ramp(c.lt, 0.2, 0.6)} />
          <Callout x={330} y={290} w={480} lines={[{ t: '30 CLOCKS · ALL SET FOR', size: 30, fill: '#d9b04a' }, { t: '4:10', size: 76, fill: '#7dffb0' }]} o={ramp(c.lt, c.s(23), c.s(23) + 0.4)} /></g>
      );
    } },
    // 24-25 the loudest thing in a month: everything turns toward it
    { at: 24, push: [1, 1.05], el: (c) => (
      <g><LotW tone="night" /><Mob n={80} t={c.t} seed={61} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} face="left" still={false} />
        {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${60 + i * 36} 540) scale(0.4)`}><Clock x={0} y={0} t={c.lt + i} ring={1} hour={4} min={10} /></g>)}
        <Waves x={150} y={520} t={c.lt * 1.3} n={6} max={700} /><g transform="translate(900 150)"><Txt x={0} y={0} size={90} fill="#ff5a3a" stroke="#07050f" ls={4} o={0.6 + 0.4 * tri(c.lt * 6)} maxW={520}>RRRINNNG!!</Txt></g></g>
    ) },
    // 26-27 the suits do the smart thing: drop their tools and run
    { at: 26, push: [1, 1.04], el: (c) => {
      const run = ease(ramp(c.lt, c.s(27), c.d));
      return (
        <g><LotW tone="night" /><Waves x={150} y={520} t={c.lt * 1.3} n={5} max={600} />
          {[0, 1, 2].map((i) => <Suit key={i} x={lerp(700 + i * 50, 1400, run)} floor={F - 30 + (i % 2) * 20} s={1.1} flip pose={run > 0 ? POSE.run(c.lt + i * 0.3, 1.8) : POSE.idle()} />)}
          {[0, 1, 2].map((i) => <g key={i} opacity={ramp(c.lt, c.s(27), c.s(27) + 0.3)} transform={`translate(${700 + i * 36} ${560 + (i % 2) * 14}) rotate(${40 + i * 25})`}><rect x={-6} y={-30} width={12} height={60} fill="#8a8f93" stroke={INK} strokeWidth={3} /></g>)}
          <Callout x={330} y={150} w={360} lines={[{ t: 'THEY RUN.', size: 56 }]} o={ramp(c.lt, c.s(27), c.s(27) + 0.4)} /></g>
      );
    } },
    // 28-29 the noise goes with them, and so does the crowd
    { at: 28, push: [1, 1.04], el: (c) => {
      const k = ease(ramp(c.lt, 0.2, c.d - 0.1));
      return (
        <g><LotW tone="night" /><g transform={`translate(${-k * 700} 0)`}><Mob n={80} t={c.t} seed={61} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} face="left" still={false} /></g>
          <Waves x={lerp(150, -400, k)} y={520} t={c.lt} n={4} max={500} o={1 - k} /><Callout x={900} y={150} w={620} lines={[{ t: 'THE NOISE LEAVES.', size: 40 }, { t: 'THE CROWD LEAVES.', size: 40 }]} o={1 - ramp(c.lt, c.s(29) + 0.6, c.d)} /></g>
      );
    } },
    // 30 by sunrise the lot is empty
    { at: 30, push: [1, 1.05], el: (c) => (
      <g><LotW tone="dawn" /><Person kind="hero" x={960} floor={186} s={0.75} pose={{ ...POSE.idle(c.lt), lU: 150 + Math.sin(c.lt * 5) * 15, lF: 150 }} flip />{girl(1030, 186, 0.75, POSE.idle(c.lt + 1), true)}<Cat x={1110} floor={186} s={0.36} flip t={c.lt} />
        <Callout x={330} y={150} w={500} lines={[{ t: 'SUNRISE: EMPTY LOT', size: 46 }]} o={ramp(c.lt, 0.2, 0.6)} /></g>
    ) },
    // 31-32 that night the knocking comes softer, then stops
    { at: 31, push: [1, 1.05], el: (c) => {
      const hits = [0.2, 0.9, 1.8].map((o) => c.s(31) + o);
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><DarkW o={0.3} /><FreezerDoorW taped={1} x={500} />
          {hits.map((h, i) => <g key={i} opacity={1 - i * 0.3}><Rings x={650} y={290} t0={h} lt={c.lt} color="#9fd0e8" /></g>)}{hero(240, F, 1.6, { ...POSE.idle(c.lt), head: 8 })}{girl(1040, F + 8, 1.5, POSE.idle(c.lt + 1), true)}
          <Callout x={1040} y={170} w={380} lines={[{ t: 'SOFTER...', size: 52 }]} o={ramp(c.lt, c.s(31) + 0.2, c.s(31) + 0.6) * (1 - ramp(c.lt, c.s(32), c.s(32) + 0.2))} /><Callout x={1040} y={170} w={380} lines={[{ t: 'THEN IT STOPS.', size: 52, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(32), c.s(32) + 0.5)} />
        </g>
      );
    } },
    // 33-34 you swore never to open that door unless there was no other way; now there is none
    { at: 33, push: [1, 1.05], el: (c) => {
      const reach = ease(ramp(c.lt, c.s(34), c.d - 0.3));
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><DarkW o={0.2} /><FreezerDoorW taped={1 - reach} x={620} />
          <g><line x1={140} y1={380} x2={lerp(620, 880, reach)} y2={lerp(380, 340, reach)} stroke={INK} strokeWidth={12} strokeLinecap="round" /><circle cx={lerp(620, 880, reach)} cy={lerp(380, 340, reach)} r={26} fill="#f6e6c8" stroke={INK} strokeWidth={5} /></g>
          <Callout x={330} y={170} w={500} lines={[{ t: 'YOU SWORE: NEVER OPEN IT', size: 30, fill: '#d9b04a' }, { t: 'UNLESS THERE IS NO OTHER WAY.', size: 30 }]} o={ramp(c.lt, c.s(33), c.s(33) + 0.4)} />
          <Callout x={330} y={360} w={500} lines={[{ t: 'NOW THERE IS NONE.', size: 56, fill: '#ff8a7a' }]} fill="#fff" o={ramp(c.lt, c.s(34), c.s(34) + 0.4)} />
        </g>
      );
    } },
    // 35 day 28
    { at: 35, card: true, el: (c) => (
      <g><CardW /><g transform={`translate(640 300) scale(${pop(ramp(c.lt, 0.1, 0.7))})`}><Txt x={0} y={-90} size={44} fill="#6f7f6a" ls={8} maxW={300}>NIGHT</Txt><Txt x={0} y={110} size={240} fill="#c93a2e" ls={4} maxW={500}>28</Txt></g></g>
    ) },
    // 36-37 you open the freezer: frost pours out
    { at: 36, push: [1, 1.05], el: (c) => {
      const open = ease(ramp(c.lt, 0.5, c.s(37) + 0.8));
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} /><FreezerDoorW x={500} open={open} />
          {Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx={520 + rnd(i) * 300 + open * (i * 14)} cy={500 - ((c.lt * 40 + i * 30) % 90) + rnd(i + 3) * 30} rx={60 + rnd(i + 6) * 60} ry={22 + rnd(i + 8) * 20} fill="#e8f4fb" opacity={open * 0.55} />)}
          {hero(240, F, 1.6, POSE.idle(c.lt))}{girl(1040, F + 8, 1.5, POSE.idle(c.lt + 1), true)}<Callout x={1040} y={170} w={380} lines={[{ t: 'FROST POURS OUT.', size: 44 }]} o={ramp(c.lt, c.s(37), c.s(37) + 0.4)} /></g>
      );
    } },
    // 38-40 Rhea sits against the back wall, alive: how long?
    { at: 38, push: [1, 1.05], el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#bcd6e6" /><rect y={470} x={-100} width={W + 200} height={300} fill="#9fb8c8" />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={20 + i * 160} y={40} width={130} height={400} fill="#e8f4fb" stroke={INK} strokeWidth={4} opacity={0.7} />)}
        <g transform="translate(850 520)"><g style={{ filter: 'saturate(0.45) brightness(1.1)' }}>{rhea(0, 0, 1.9, POSE.sit())}</g></g>
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i + 2) * 500} r={2.5} fill="#fff" opacity={0.3 + 0.6 * tri(c.lt * 1.4 + i)} />)}
        {hero(300, F, 1.7, POSE.idle(c.lt))}
        <g opacity={ramp(c.lt, c.s(39), c.s(39) + 0.4)} transform={`translate(860 230) scale(${pop(ramp(c.lt, c.s(39), c.s(39) + 0.5))})`}><rect x={-190} y={-70} width={380} height={130} rx={18} fill="#fff" stroke={INK} strokeWidth={5} /><Txt x={0} y={-8} size={44} fill="#6f7f6a" ls={3} maxW={340}>HOW LONG?</Txt><Txt x={0} y={36} size={30} fill="#2f5e86" ls={2} maxW={340}>she whispers</Txt></g>
        <Callout x={300} y={150} w={360} lines={[{ t: '...28 NIGHTS.', size: 46 }]} o={ramp(c.lt, c.s(40), c.s(40) + 0.4)} />
      </g>
    ) },
    // 41-43 the intercom crackles in Rhea's own voice: do not turn the power back on
    { at: 41, push: [1, 1.05], el: (c) => {
      const flick = Math.sin(c.lt * 40) > 0.5 ? 0.35 : 0;
      return (
        <g><Room wall="#4a4660" floor="#2e2a3e" line={500} /><DarkW o={0.45 + flick} /><Speaker x={640} y={60} t={c.lt} on={ramp(c.lt, c.s(41), c.s(41) + 0.4)} />
          <g opacity={ramp(c.lt, c.s(42), c.s(42) + 0.4)} transform="translate(640 230)"><rect x={-340} y={-80} width={680} height={160} rx={20} fill="#fff" stroke={INK} strokeWidth={6} /><Txt x={0} y={-8} size={52} fill="#2a2220" ls={2} maxW={620}>ATTENTION, SHOPPERS</Txt><Txt x={0} y={44} size={30} fill="#6f7f6a" ls={3} maxW={620}>recorded on night one</Txt></g>
          <g opacity={ramp(c.lt, c.s(43), c.s(43) + 0.3)} transform={`translate(640 440) scale(${pop(ramp(c.lt, c.s(43), c.s(43) + 0.5))})`}><rect x={-340} y={-60} width={680} height={130} rx={16} fill="#c93a2e" stroke={INK} strokeWidth={6} /><Txt x={0} y={-6} size={44} fill="#fff" ls={3} maxW={620}>DO NOT TURN THE</Txt><Txt x={0} y={44} size={52} fill="#fff" ls={3} maxW={620}>POWER BACK ON.</Txt></g>
          {hero(160, F, 1.6, { ...POSE.idle(c.lt), head: -10 })}{girl(1100, F + 8, 1.5, POSE.idle(c.lt + 1), true)}</g>
      );
    } },
    // 44-45 outside, the sun is rising and the temperature with it; then the title
    { at: 44, push: [1, 1.04], el: (c) => {
      const warm = ramp(c.lt, 0.4, c.e(45)), tt = ramp(c.lt, c.e(45) + 0.5, c.e(45) + 1.4);
      return (
        <g data-under={tt > 0.3 ? 1 : undefined}><LotW tone="dawn" /><Mob n={60} t={c.t} seed={5} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} still={warm < 0.5} face="right" />
          <g transform="translate(110 250)"><rect x={-26} y={-110} width={52} height={210} rx={26} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><circle cx={0} cy={102} r={34} fill={warm > 0.3 ? '#c93a2e' : '#4aa0d8'} stroke={INK} strokeWidth={5} /><rect x={-10} y={lerp(70, -80, warm)} width={20} height={lerp(30, 170, warm)} fill={warm > 0.3 ? '#c93a2e' : '#4aa0d8'} /></g>
          <Callout x={640} y={110} w={560} lines={[{ t: 'THE SUN IS RISING.', size: 48 }]} o={ramp(c.lt, 0.2, 0.6)} />
          <rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#0e0a1c" opacity={tt} />
          <g opacity={tt} transform={`translate(640 ${lerp(300, 270, tt)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize={130} fill="#e5361d" stroke="#2a0608" strokeWidth={6} paintOrder="stroke" letterSpacing={6}>OAKLINE AFTER DARK</text>
            <Txt x={0} y={90} size={40} fill="#b7a784" ls={6} maxW={900}>28 NIGHTS LOCKED IN A SUPERMARKET</Txt>
          </g></g>
      );
    } },
  ],
  cues: [
    [0, 0.2, 'ding'], [1, 0.1, 'knock'], [1, 0.55, 'knock'], [1, 1.0, 'knock'], [1, 1.9, 'knock'], [1, 2.35, 'knock'], [1, 2.8, 'knock'],
    [2, 0.3, 'knock'], [2, 1.1, 'knock'], [5, 0.5, 'knock'], [5, 1.1, 'knock'], [5, 1.7, 'knock'], [7, 0.3, 'hiss'], [9, 0.4, 'moan', 2], [10, 0.3, 'snap'], [11, 1.0, 'clunk'], [11, 1.2, 'slam'],
    [13, 0.5, 'ding'], [15, 0.4, 'ding'], [17, 0.2, 'ratchet', 3.5], [19, 0.3, 'ding'], [21, 0.4, 'hiss'], [21, 1.0, 'slam'], [22, 0.8, 'ratchet', 2], [23, 0.3, 'ding'],
    [24, 0.1, 'alarm', 5], [24, 0.2, 'sting'], [24, 0.5, 'moan', 5], [26, 0.1, 'alarm', 4], [27, 0.3, 'run', 3], [28, 0.2, 'moan', 4],
    [31, 0.2, 'knock'], [31, 0.9, 'knock'], [31, 1.8, 'knock'], [34, 0.5, 'creak'], [35, 0.1, 'slam'], [36, 0.6, 'creak'], [36, 1.4, 'hiss'],
    [39, 0.2, 'drip'], [41, 0.2, 'surge'], [42, 0.3, 'ding'], [43, 0.1, 'sting'], [44, 0.4, 'whoosh'], [45, 0.8, 'moan', 4],
  ],
};
void AisleSignW; void H; void lerp; void clamp; void Txt;
