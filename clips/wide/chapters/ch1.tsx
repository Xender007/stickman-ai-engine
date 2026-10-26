/** Chapter 1: The Night Shift (16:9, script v4). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { AisleSignW, AisleW, Callout, CardW, Dark, DarkW, Door, FreezerDoorW, Keyy, Person, POSE, Room, ShelvesW, Speaker, Txt, W, H, INK, PAL, clamp, ease, lerp, pop, ramp, rnd, tri, Dead, LotW } from '../kit.tsx';
import { Fist, GlassDoors, ProblemW, StoreBand } from '../parts.tsx';

const F = 560;
const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const rhea = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="dana" x={x} floor={floor} s={s} pose={pose} flip={flip} mouth="none" />;
const regular = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="man" x={x} floor={floor} s={s} pose={pose} flip={flip} mouth="none" />;
const Envelope: React.FC<{ s?: number; rot?: number; stamp?: number }> = ({ s = 1, rot = 0, stamp = 0 }) => (
  <g transform={`rotate(${rot}) scale(${s})`}>
    <rect x={-190} y={-120} width={380} height={240} fill="#efe2bd" stroke={INK} strokeWidth={6} /><path d="M -190 -120 L 0 20 L 190 -120" fill="none" stroke={INK} strokeWidth={5} /><path d="M -190 120 L -40 -10 M 190 120 L 40 -10" fill="none" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={18} r={34} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={30} size={34} fill="#f6f1e2">R</Txt>
    <Txt x={0} y={86} size={30} fill="#4a4a50" ls={2} maxW={340}>NOT BEFORE DAY 10</Txt>
    {stamp > 0 && <g transform={`translate(70 -50) rotate(-14) scale(${1 + (1 - stamp) * 1.5})`} opacity={stamp}><rect x={-140} y={-34} width={280} height={68} fill="#efe2bd" stroke="#c93a2e" strokeWidth={7} /><Txt x={0} y={14} size={40} fill="#c93a2e" ls={3} maxW={260}>LAST RESORT ONLY</Txt></g>}
  </g>
);
const Footprint: React.FC<{ x: number; y: number; s: number; flip?: boolean }> = ({ x, y, s, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}><ellipse cx={0} cy={0} rx={14} ry={26} fill="#4a7ea8" stroke="#223a55" strokeWidth={2} opacity={0.85} /><ellipse cx={0} cy={-36} rx={11} ry={13} fill="#4a7ea8" stroke="#223a55" strokeWidth={2} opacity={0.85} /></g>
);

export const ch: Chapter = {
  n: 1, label: 'THE NIGHT SHIFT',
  scenes: [
    // 0-2 the intercom says your name; you are alone
    { at: 0, push: [1, 1.06], el: (c) => (
      <g><AisleW lightsOn={1} /><Speaker x={640} y={60} t={c.lt} on={ramp(c.lt, c.s(1), c.s(1) + 0.3)} />
        {hero(640, 470, 0.7, POSE.idle(c.lt))}
        <Callout x={260} y={250} w={400} lines={[{ t: 'THE INTERCOM SAYS', size: 28, fill: '#d9b04a' }, { t: 'YOUR NAME', size: 56, fill: '#ff8a7a' }]} fill="#2a2220" o={ramp(c.lt, c.s(1) + 0.2, c.s(1) + 0.6)} />
        <Callout x={1020} y={250} w={400} lines={[{ t: '1 PERSON INSIDE', size: 46 }]} o={ramp(c.lt, c.s(2), c.s(2) + 0.4)} />
      </g>
    ) },
    // 3 shelving tins in aisle 5 at 3:07
    { at: 3, push: [1, 1.05], el: (c) => (
      <g><ShelvesW /><AisleSignW x={640} y={30} n="5" label="PANTRY STAPLES" sub="TINS · JARS" s={1.1} />
        <Callout x={1110} y={200} w={220} lines={[{ t: '3:07', size: 70, fill: '#7dffb0' }, { t: 'A.M.', size: 26, fill: '#d9b04a' }]} />
        {hero(430, F, 1.8, { ...POSE.idle(c.lt), lU: 70 + Math.sin(c.lt * 4) * 14, lF: 95 })}
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(${650 + i * 60} ${F - i * 12})`}><rect x={-15} y={-38} width={30} height={38} rx={4} fill={['#c04b4b', '#3f6db0', '#d9b04a'][i]} stroke={INK} strokeWidth={2.8} /></g>)}
      </g>
    ) },
    // 4-5 the doors slide open; a regular stands in the doorway
    { at: 4, push: [1, 1.04], el: (c) => (
      <g><Room wall={PAL.wall} line={480} /><StoreBand />
        <GlassDoors x={340} y={110} w={600} h={370} open={ease(ramp(c.lt, 0.3, 1.4))} sensor={tri(c.lt * 3) > 0.5}>{regular(640, 450, 1.1, POSE.walk(c.lt, 0.7, 6))}</GlassDoors>
        <Callout x={1100} y={250} w={300} lines={[{ t: 'THE REGULAR', size: 28, fill: '#d9b04a' }, { t: 'EVERY NIGHT AT 3', size: 34 }]} o={ramp(c.lt, c.s(5), c.s(5) + 0.4)} />
      </g>
    ) },
    // 6-7 no paper tonight; a fist clenched around something small
    { at: 6, push: [1, 1.06], el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#22202e" /><circle cx={640} cy={290} r={300} fill="#ffe6a8" opacity={0.07} />
        <Fist x={640} y={300} s={1.35} t={c.lt} key2={ramp(c.lt, c.s(7), c.s(7) + 0.4)} />
        <Callout x={1030} y={170} w={380} lines={[{ t: 'NO PAPER.', size: 40 }, { t: 'NO COFFEE.', size: 40 }]} o={ramp(c.lt, 0.3, 0.7)} />
        <Callout x={250} y={480} w={420} lines={[{ t: 'WHAT IS IN HIS FIST?', size: 40, fill: '#ffd47a' }]} o={ramp(c.lt, c.s(7) + 0.3, c.s(7) + 0.8)} />
      </g>
    ) },
    // 8 the doors keep trying to shut on him
    { at: 8, push: [1, 1.04], el: (c) => (
      <g><Room wall={PAL.wall} line={480} /><StoreBand />
        <GlassDoors x={340} y={110} w={600} h={370} open={0.65 + 0.35 * Math.cos(c.lt * 5.5)} sensor={tri(c.lt * 4) > 0.5}>{null}</GlassDoors>
        {regular(640, F, 1.6, { ...POSE.idle(c.lt), head: 8 })}
      </g>
    ) },
    // 9-10 Rhea rams him out with a cart and turns the lock; he bumps the glass
    { at: 9, push: [1, 1.04], el: (c) => {
      const push = ease(ramp(c.lt, c.s(9) + 0.6, c.s(9) + 2.8)), closed = ramp(c.lt, c.e(9) - 0.6, c.e(9)), lock = pop(ramp(c.lt, c.e(9) + 0.1, c.e(9) + 0.5));
      const bump = (o: number) => { const k = ramp(c.lt, c.s(10) + o, c.s(10) + o + 0.12); return k * (1 - ramp(c.lt, c.s(10) + o + 0.12, c.s(10) + o + 0.45)); };
      const bx = bump(0.3) + bump(1.1) + bump(1.9), out = push > 0.65;
      return (
        <g><Room wall={PAL.wall} line={480} /><StoreBand />
          <GlassDoors x={340} y={110} w={600} h={370} open={1 - closed}>{out && <g transform={`translate(${bx * 10} 0)`}>{regular(640, 440, 1.0, POSE.walk(c.lt, 0.8, 8))}</g>}</GlassDoors>
          {!out && regular(640, lerp(F, 450, ease(push / 0.65)), lerp(1.6, 1.1, push / 0.65), POSE.walk(c.lt, 0.8, 8))}
          {rhea(lerp(130, 440, push), F + 10, 1.6, POSE.push(POSE.walk(c.lt, 1.2, 10)))}
          <g transform={`translate(${lerp(130, 440, push) + 110} ${F + 10}) scale(1.4)`}><path d="M -50 -70 L 50 -70 L 40 -20 L -40 -20 Z" fill="#cdd5da" fillOpacity={0.4} stroke={INK} strokeWidth={3} /><circle cx={-26} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /><circle cx={28} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /></g>
          <g transform={`translate(1090 280) scale(${lock})`} opacity={lock}><rect x={-34} y={-10} width={68} height={56} rx={10} fill="#c93a2e" stroke={INK} strokeWidth={5} /><path d="M -20 -10 L -20 -34 A 20 20 0 0 1 20 -34 L 20 -10" fill="none" stroke={INK} strokeWidth={8} /></g>
        </g>
      );
    } },
    // 11-12 twelve cameras; on every screen someone is running
    { at: 11, push: [1, 1.03], el: (c) => (
      <g><Room wall="#cfc09f" line={560} /><rect x={90} y={40} width={1100} height={510} rx={12} fill="#2b3340" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 12 }, (_, i) => {
          const cx = 110 + (i % 4) * 270, cy = 60 + Math.floor(i / 4) * 160, vis = ramp(c.lt, i * 0.06, i * 0.06 + 0.25), run = ramp(c.lt, c.s(12) - 0.2, c.s(12) + 0.2);
          return (
            <g key={i} opacity={vis}><rect x={cx} y={cy} width={255} height={150} fill="#41576d" stroke={INK} strokeWidth={3} /><rect x={cx} y={cy + 105} width={255} height={45} fill="#364a5d" />
              <Txt x={cx + 8} y={cy + 20} size={16} fill="#cfe3ee" ls={1} anchor="start" maxW={120}>{`CAM ${String(i + 1).padStart(2, '0')}`}</Txt><circle cx={cx + 238} cy={cy + 14} r={5} fill="#e5392b" opacity={tri(c.lt * 2 + i) > 0.5 ? 1 : 0.3} />
              <g transform={`translate(${cx + 128 + Math.sin(c.lt * 6 + i) * 70 * run} ${cy + 140})`} style={{ filter: 'brightness(3)' }}><Person kind="dead" x={0} floor={0} s={0.5} pose={POSE.run(c.lt + i * 0.2, 1.8)} flip={Math.cos(c.lt * 6 + i) < 0} /></g>
            </g>
          );
        })}
      </g>
    ) },
    // 13-14 Rhea grabs keys and coat, presses a sealed envelope into your hand
    { at: 13, push: [1, 1.04], el: (c) => {
      const env = pop(ramp(c.lt, c.s(14) + 0.1, c.s(14) + 0.7));
      return (
        <g><Room wall="#c9b99a" line={480} /><rect x={840} y={330} width={330} height={26} fill="#8a5a36" stroke={INK} strokeWidth={5} /><rect x={870} y={356} width={18} height={170} fill="#6e4528" stroke={INK} strokeWidth={4} /><rect x={1120} y={356} width={18} height={170} fill="#6e4528" stroke={INK} strokeWidth={4} />
          {hero(330, F, 1.8, POSE.idle(c.lt))}{rhea(620, F, 1.9, { ...POSE.idle(c.lt), lU: lerp(10, 80, ramp(c.lt, c.s(14), c.s(14) + 0.4)), lF: lerp(20, 95, ramp(c.lt, c.s(14), c.s(14) + 0.4)) }, true)}
          <g opacity={ramp(c.lt, c.s(13) + 0.2, c.s(13) + 0.6)} transform={`translate(760 ${300 + Math.sin(c.lt * 8) * 4}) rotate(${Math.sin(c.lt * 8) * 6})`}><Keyy x={0} y={0} s={0.6} rot={90} /></g>
          <g opacity={env} transform={`translate(480 360) scale(${0.3 * env})`}><Envelope /></g>
        </g>
      );
    } },
    // 15-16 do not open it before day ten, and not even then unless you must
    { at: 15, card: true, el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#8a6a4a" />{Array.from({ length: 9 }, (_, i) => <line key={i} x1={-100} y1={i * 90} x2={W + 100} y2={i * 90 + 18} stroke="#76583c" strokeWidth={5} />)}
        <g transform={`translate(430 ${290 + (1 - pop(ramp(c.lt, 0.1, 0.7))) * -300})`}><Envelope s={1.15} rot={-5} stamp={ease(ramp(c.lt, c.s(16), c.s(16) + 0.25))} /></g>
        <Callout x={980} y={190} w={420} lines={[{ t: 'DO NOT OPEN', size: 44, fill: '#ff8a7a' }, { t: 'BEFORE DAY TEN', size: 44 }]} o={ramp(c.lt, c.s(15), c.s(15) + 0.4)} />
        <Callout x={980} y={400} w={420} lines={[{ t: 'AND EVEN THEN,', size: 34, fill: '#d9b04a' }, { t: 'ONLY IF YOU MUST', size: 40 }]} o={ramp(c.lt, c.s(16), c.s(16) + 0.4)} />
      </g>
    ) },
    // 17-19 she is gone; the doors lock; "or so you think"
    { at: 17, push: [1, 1.04], el: (c) => {
      const go = ease(ramp(c.lt, 0.2, c.s(18) - 0.3));
      const flick = c.lt > c.s(19) ? (Math.sin(c.lt * 40) > 0.2 ? 0.55 : 0) * ramp(c.lt, c.s(19), c.s(19) + 0.2) : 0;
      return (
        <g><Room wall="#bfb394" line={480} /><Door x={880} y={90} w={220} h={390} open={0} sign="EXIT" />
          {rhea(lerp(520, 960, go), F, 1.8, POSE.walk(c.lt, 1.3, 6))}{hero(250, F, 1.8, POSE.idle(c.lt))}
          <Speaker x={640} y={50} t={c.lt} on={ramp(c.lt, c.s(19), c.s(19) + 0.4) * 0.6} /><DarkW o={flick} />
          <Callout x={640} y={250} w={520} lines={[{ t: 'OR SO YOU THINK.', size: 64, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(19), c.s(19) + 0.5)} />
        </g>
      );
    } },
    // 20 25,000 products and one wall of glass
    { at: 20, push: [1, 1.08], el: (c) => (
      <g><AisleW lightsOn={1} pushed={ramp(c.lt, 0, c.d) * 0.4} />
        <Callout x={640} y={470} w={560} lines={[{ t: 'PRODUCTS', size: 26, fill: '#d9b04a' }, { t: Math.round(25000 * ease(ramp(c.lt, 0.1, c.d - 0.3))).toLocaleString('en-US'), size: 80 }]} />
      </g>
    ) },
    // 21 problem one: the glass
    { at: 21, card: true, el: (c) => <ProblemW n="ONE" title="THE GLASS" lt={c.lt} icon={<g><rect x={-60} y={-60} width={120} height={120} fill="#cfe3ee" stroke={INK} strokeWidth={8} /><line x1={0} y1={-60} x2={0} y2={60} stroke={INK} strokeWidth={6} /><line x1={-60} y1={0} x2={60} y2={0} stroke={INK} strokeWidth={6} /></g>} /> },
    // 22-23 a steel shutter that needs mains power; by hand otherwise
    { at: 22, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={480} />
        <rect x={80} y={50} width={560} height={90} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={100} y={140} width={520} height={190} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: 13 }, (_, i) => <line key={i} x1={100} y1={154 + i * 14} x2={620} y2={154 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
        <g transform="translate(860 260)" opacity={ramp(c.lt, 0.3, 0.7)}><path d="M -40 -70 L 40 -70 L 40 -10 Q 40 30 0 30 Q -40 30 -40 -10 Z" fill="#d9d4c0" stroke={INK} strokeWidth={6} /><line x1={-18} y1={-70} x2={-18} y2={-110} stroke={INK} strokeWidth={8} /><line x1={18} y1={-70} x2={18} y2={-110} stroke={INK} strokeWidth={8} /><path d="M 10 -50 l -16 24 l 14 0 l -10 28 l 26 -34 l -14 0 z" fill="#f0c43a" stroke={INK} strokeWidth={3} /><Txt x={0} y={90} size={30} fill={INK} maxW={220}>MAINS POWER</Txt></g>
        <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.4)} transform="translate(1090 260)"><g transform={`rotate(${c.lt * 240})`}><circle r={50} fill="none" stroke={INK} strokeWidth={10} /><line x1={-50} y1={0} x2={50} y2={0} stroke={INK} strokeWidth={10} /><line x1={0} y1={-50} x2={0} y2={50} stroke={INK} strokeWidth={10} /></g><Txt x={0} y={100} size={30} fill={INK} maxW={200}>OR BY HAND</Txt></g>
        {hero(360, F, 1.7, POSE.idle(c.lt))}
      </g>
    ) },
    // 24-25 you wind it down: thirty-five seconds like a freight train
    { at: 24, push: [1, 1.05], el: (c) => {
      const d = ease(ramp(c.lt, c.s(24) + 0.6, c.s(25) + 2.2)), sh = d > 0 && d < 0.98 ? Math.sin(c.lt * 70) * 4 : 0, secs = Math.round(35 * ramp(c.lt, c.s(25), c.s(25) + 2.4));
      return (
        <g transform={`translate(${sh} ${sh * 0.4})`}><Room wall={PAL.wall} line={480} /><GlassDoors x={340} y={150} w={600} h={330} open={0} sensor={false}>{null}</GlassDoors>
          <rect x={300} y={60} width={680} height={90} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={320} y={150} width={640} height={d * 330} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: 24 }, (_, i) => 150 + i * 14 < 150 + d * 330 && <line key={i} x1={320} y1={164 + i * 14} x2={960} y2={164 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
          <Callout x={1120} y={250} w={220} lines={[{ t: `${secs}s`, size: 80, fill: '#7dffb0' }]} />
          {d > 0.95 && Array.from({ length: 14 }, (_, i) => <circle key={i} cx={330 + rnd(i) * 620} cy={470 + ((c.lt * 90 + rnd(i + 3) * 80) % 90)} r={4 + rnd(i + 9) * 5} fill="#cfc6b0" opacity={0.5} />)}
        </g>
      );
    } },
    // 26 house rule one
    { at: 26, push: [1, 1.04], el: (c) => (
      <g><Room wall={PAL.wall} line={480} /><rect x={300} y={60} width={680} height={90} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={320} y={150} width={640} height={330} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: 24 }, (_, i) => <line key={i} x1={320} y1={164 + i * 14} x2={960} y2={164 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
        <g transform={`translate(640 ${lerp(760, 300, pop(ramp(c.lt, 0.1, 0.6)))}) rotate(-3)`}><rect x={-300} y={-100} width={600} height={200} fill="#e9d8ad" stroke={INK} strokeWidth={5} /><Txt x={0} y={-48} size={36} ls={3} maxW={540}>HOUSE RULE ONE:</Txt><Txt x={0} y={52} size={64} fill="#c93a2e" ls={2} maxW={560}>NOBODY COMES IN</Txt></g>
      </g>
    ) },
    // 27 outside, the regular is still pressed against the steel
    { at: 27, push: [1, 1.05], el: (c) => (
      <g><LotW tone="night" />{regular(700, 540, 1.15, { ...POSE.push(POSE.idle(c.lt)), lean: 14 })}
        <Callout x={330} y={250} w={400} lines={[{ t: 'STILL THERE.', size: 60 }]} o={ramp(c.lt, 0.2, 0.6)} /></g>
    ) },
    // 28-29 a small brass key, tagged with a number: locker twelve
    { at: 28, card: true, el: (c) => {
      const sw = Math.sin(c.lt * 2.2) * 5;
      return (
        <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1c1a28" /><circle cx={460} cy={300} r={320} fill="#ffe6a8" opacity={0.09} />
          <g transform={`translate(460 20) rotate(${sw})`}><line x1={0} y1={0} x2={0} y2={120} stroke="#6b6585" strokeWidth={5} /><g transform="translate(0 120)"><Keyy x={-34} y={0} s={2.2} rot={90} /><g transform={`translate(30 190) rotate(${-sw * 1.5})`} opacity={ramp(c.lt, c.s(29) - 0.3, c.s(29))}><rect x={-100} y={-70} width={200} height={140} rx={18} fill="#f0c43a" stroke={INK} strokeWidth={6} /><circle cx={0} cy={-52} r={9} fill="#1c1a28" stroke={INK} strokeWidth={3} /><Txt x={0} y={38} size={110} fill={INK} ls={2} maxW={160}>12</Txt></g></g></g>
          <g transform={`translate(930 270) scale(${pop(ramp(c.lt, c.s(29), c.s(29) + 0.5))})`}><Txt x={0} y={0} size={86} fill="#f6f1e2" ls={4} stroke="#07050f" maxW={560}>LOCKER 12</Txt></g>
        </g>
      );
    } },
    // 30-31 5:23: the power goes out and the freezers fall silent
    { at: 30, push: [1, 1.04], el: (c) => {
      const die = ramp(c.lt, c.s(30) + 1.4, c.s(30) + 1.6), flick = die > 0 ? 1 : (Math.sin(c.lt * 30) > 0.9 ? 0.3 : 0);
      return (
        <g><Room wall="#cfc9bb" line={500} />
          {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={30 + i * 205} y={110} width={185} height={390} fill="#e8ecef" stroke={INK} strokeWidth={5} /><rect x={46 + i * 205} y={130} width={153} height={350} fill="#bcd6e6" stroke={INK} strokeWidth={4} opacity={0.8} /><circle cx={122 + i * 205} cy={100} r={8} fill={die ? '#4a1d1a' : '#4aa86a'} stroke={INK} strokeWidth={2} /></g>)}
          {hero(640, F, 1.5, POSE.idle(c.lt))}<DarkW o={die * 0.9 + flick * 0.3} />
          <Callout x={640} y={60} w={240} lines={[{ t: '5:23', size: 56, fill: die ? '#3a4a3a' : '#7dffb0' }]} />
          <Callout x={640} y={300} w={460} lines={[{ t: 'SILENCE.', size: 80, fill: '#f6f1e2' }]} o={ramp(c.lt, c.s(31), c.s(31) + 0.5)} />
        </g>
      );
    } },
    // 32-33 a clunk at the back: the magnet needs power
    { at: 32, push: [1, 1.06], el: (c) => {
      const clunk = ramp(c.lt, c.s(32) + 1.0, c.s(32) + 1.1), led = c.lt < c.s(33) + 1.4;
      const jolt = clunk * Math.max(0, Math.sin((c.lt - c.s(32) - 1.0) * 50)) * 6 * (1 - ramp(c.lt, c.s(32) + 1.1, c.s(32) + 1.6));
      return (
        <g transform={`translate(${jolt} 0)`}><Room wall="#7f7a8a" line={480} /><DarkW o={0.35} color="#10101c" />
          <Door x={520} y={110} w={230} h={370} open={ramp(c.lt, c.s(33) + 1.2, c.s(33) + 1.8) * 0.12} color="#6a7580" sign="" />
          <g transform="translate(635 60)"><rect x={-90} y={-26} width={180} height={50} rx={8} fill="#3a3f48" stroke={INK} strokeWidth={4} /><circle cx={-60} cy={-1} r={9} fill={led ? '#4aa86a' : '#4a1d1a'} stroke={INK} strokeWidth={2} /><Txt x={14} y={7} size={22} fill="#dfe3e8" ls={1} maxW={110}>MAGNET LOCK</Txt></g>
          <Callout x={1030} y={300} w={380} lines={[{ t: 'NO POWER,', size: 52, fill: '#ff8a7a' }, { t: 'NO LOCK.', size: 52, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(33) + 1.4, c.s(33) + 1.7)} />
        </g>
      );
    } },
    // 34-35 you run the whole length of the store: too late
    { at: 34, push: [1, 1.04], el: (c) => {
      const scroll = c.lt * 600, door = lerp(1000, 940, ease(ramp(c.lt, 0, c.s(35) + 0.6)));
      return (
        <g><Room wall="#a89c86" line={480} /><DarkW o={0.35} color="#10101c" />
          {Array.from({ length: 8 }, (_, i) => { const px = ((i * 300 - scroll * 0.7) % 2400 + 2400) % 2400 - 300; return <g key={i}><rect x={px} y={90} width={140} height={390} fill="#8a8068" stroke={INK} strokeWidth={4} /><rect x={px + 20} y={140} width={100} height={260} fill="#6f6452" stroke={INK} strokeWidth={3} /></g>; })}
          <Door x={door - 115} y={110} w={230} h={370} open={0.12} color="#6a7580" />
          {hero(420, F, 1.8, c.lt < c.s(35) + 0.5 ? POSE.run(c.lt, 1.7) : { ...POSE.idle(c.lt), head: 6 })}
          <Callout x={640} y={230} w={420} lines={[{ t: 'TOO LATE.', size: 76, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(35), c.s(35) + 0.4)} />
        </g>
      );
    } },
    // 36 the door is open, and wet footprints lead inside
    { at: 36, push: [1, 1.06], el: (c) => (
      <g><Room wall="#7f7a8a" line={480} /><DarkW o={0.3} color="#10101c" /><Door x={150} y={100} w={230} h={380} open={0.55} color="#6a7580" />
        {Array.from({ length: 8 }, (_, i) => { const a = ramp(c.lt, 0.2 + i * 0.26, 0.45 + i * 0.26), t = i / 7; return <g key={i} opacity={a}><Footprint x={lerp(300, 740, t) + (i % 2 ? 14 : -14) * lerp(0.6, 1.6, t)} y={lerp(500, 570, t)} s={lerp(0.5, 0.9, t)} flip={i % 2 === 0} /></g>; })}
        {hero(1000, F, 1.7, { ...POSE.idle(c.lt), head: 12 }, true)}
        <rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#07050f" opacity={ramp(c.lt, c.d - 0.8, c.d)} />
      </g>
    ) },
  ],
  cues: [
    [1, 0.0, 'ding'], [1, 0.3, 'whoosh'], [3, 0.5, 'clink'], [3, 1.2, 'clink'], [4, 0.3, 'hiss'], [4, 0.6, 'ding'], [6, 0.1, 'moan', 3], [7, 0.8, 'click'],
    [8, 0.3, 'hiss'], [8, 1.0, 'hiss'], [9, 1.0, 'steps', 2.2], [9, 3.4, 'click'], [10, 0.3, 'thud'], [10, 1.1, 'thud'], [10, 1.9, 'thud'],
    [11, 0.2, 'click'], [12, 0.1, 'run', 3], [13, 0.4, 'clink'], [14, 0.6, 'whoosh'], [16, 0.1, 'slam'], [17, 0.4, 'steps', 2], [18, 0.9, 'clunk'], [19, 0.2, 'surge'],
    [21, 0.1, 'slam'], [23, 0.3, 'ratchet', 3], [24, 0.6, 'rumble'], [25, 2.0, 'slam'], [26, 0.2, 'thud'], [27, 0.1, 'moan', 3], [29, 0.1, 'slam'],
    [30, 1.4, 'powerdown'], [32, 1.0, 'clunk'], [33, 1.4, 'creak'], [34, 0.0, 'run', 3.5], [35, 0.1, 'thud'], [36, 0.5, 'drip'], [36, 1.2, 'drip'],
  ],
};
void CardW; void Dead; void FreezerDoorW; void ShelvesW; void H; void lerp; void clamp; void Dark;
