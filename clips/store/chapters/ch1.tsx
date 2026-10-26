/** Chapter 1: The Night Shift (script v3). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Aisle, AisleSign, CardBg, Clock, Dark, Door, Doors, INK, Interior, Keyy, NightLot, PAL, Person, POSE, ProblemCard, ShelfRow, Shopcart, Txt, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../lib.tsx';
import { LotSide } from '../common.tsx';

const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const rhea = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="dana" x={x} floor={floor} s={s} pose={pose} flip={flip} mouth="none" />;
const regular = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="man" x={x} floor={floor} s={s} pose={pose} flip={flip} mouth="none" />;
const Band: React.FC<{ y?: number }> = ({ y = 150 }) => <g><rect x={0} y={y - 60} width={W} height={60} fill={PAL.teal} stroke={INK} strokeWidth={3} /><Txt x={W / 2} y={y - 20} size={26} fill="#dff2ef" ls={3}>WELCOME TO OAKLINE FOODS</Txt></g>;
const Speaker: React.FC<{ x: number; y: number; t: number; on: number }> = ({ x, y, t, on }) => (
  <g><rect x={x - 46} y={y - 36} width={92} height={72} rx={12} fill="#2a2220" stroke={INK} strokeWidth={5} /><circle cx={x} cy={y} r={26} fill="#555" stroke="#aaa" strokeWidth={4} /><circle cx={x} cy={y} r={9} fill="#222" />
    {[0, 1, 2].map((k) => { const r = (t * 1.1 + k / 3) % 1; return <circle key={k} cx={x} cy={y} r={40 + r * 300} fill="none" stroke="#ffe6a8" strokeWidth={8 * (1 - r) + 2} opacity={(1 - r) * on} />; })}</g>
);
const Envelope: React.FC<{ s?: number; rot?: number; stamp?: number }> = ({ s = 1, rot = 0, stamp = 0 }) => (
  <g transform={`rotate(${rot}) scale(${s})`}>
    <rect x={-190} y={-120} width={380} height={240} fill="#efe2bd" stroke={INK} strokeWidth={6} /><path d="M -190 -120 L 0 20 L 190 -120" fill="none" stroke={INK} strokeWidth={5} /><path d="M -190 120 L -40 -10 M 190 120 L 40 -10" fill="none" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={18} r={34} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={30} size={34} fill="#f6f1e2">R</Txt>
    <Txt x={0} y={86} size={34} fill="#4a4a50" ls={2}>OPEN ON DAY 10</Txt>
    {stamp > 0 && <g transform={`translate(70 -50) rotate(-14) scale(${1 + (1 - stamp) * 1.5})`} opacity={stamp}><rect x={-120} y={-34} width={240} height={68} fill="none" stroke="#c93a2e" strokeWidth={7} /><Txt x={0} y={14} size={44} fill="#c93a2e" ls={3}>NOT BEFORE</Txt></g>}
  </g>
);
const Footprint: React.FC<{ x: number; y: number; s: number; flip?: boolean }> = ({ x, y, s, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}><ellipse cx={0} cy={0} rx={14} ry={26} fill="#4a7ea8" stroke="#223a55" strokeWidth={2} opacity={0.85} /><ellipse cx={0} cy={-36} rx={11} ry={13} fill="#4a7ea8" stroke="#223a55" strokeWidth={2} opacity={0.85} /><ellipse cx={-4} cy={-8} rx={4} ry={9} fill="#9cc8e8" opacity={0.6} /></g>
);

export const ch: Chapter = {
  n: 1, label: 'THE NIGHT SHIFT',
  scenes: [
    // 0-2 the intercom says your name; you are alone
    { at: 0, push: [1, 1.08], el: (c) => (
      <g><Aisle vp={[360, 540]} lightsOn={1} />
        <Speaker x={360} y={150} t={c.lt} on={ramp(c.lt, c.s(1), c.s(1) + 0.3)} />
        {hero(360, 760, 0.55, POSE.idle(c.lt))}
        <g opacity={ramp(c.lt, c.s(1) + 0.2, c.s(1) + 0.6)} transform={`translate(360 330) scale(${pop(ramp(c.lt, c.s(1) + 0.2, c.s(1) + 0.7))})`}><rect x={-200} y={-52} width={400} height={96} rx={16} fill="#fff" stroke={INK} strokeWidth={5} /><Txt x={0} y={-8} size={30} fill="#6f7f6a" ls={3}>THE INTERCOM SAYS</Txt><Txt x={0} y={30} size={44} fill="#c93a2e" ls={2}>YOUR NAME</Txt></g>
        <g opacity={ramp(c.lt, c.s(2), c.s(2) + 0.4)}><rect x={150} y={1010} width={420} height={110} rx={16} fill="#2a2220" opacity={0.9} /><Txt x={360} y={1086} size={58} fill="#f6f1e2" ls={4}>1 PERSON INSIDE</Txt></g>
      </g>
    ) },
    // 3 shelving tins in aisle 5 at 3:07
    { at: 3, push: [1, 1.06], el: (c) => (
      <g><Interior line={900} />
        {[0, 1, 2].map((r) => <ShelfRow key={r} x={-20} y={230 + r * 220} w={760} h={120} seed={r + 5} />)}
        <AisleSign x={360} y={60} n="5" label="PANTRY STAPLES" sub="TINS · JARS" s={1.2} />
        <g transform="translate(600 150)"><rect x={-90} y={-44} width={180} height={80} rx={12} fill="#2a2220" stroke={INK} strokeWidth={4} /><Txt x={0} y={22} size={58} fill="#7dffb0" ls={4}>3:07</Txt></g>
        {hero(250, 1070, 1.8, { ...POSE.idle(c.lt), lU: 70 + Math.sin(c.lt * 4) * 14, lF: 95 })}
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(${440 + i * 60} ${1060 - i * 30})`}><rect x={-15} y={-38} width={30} height={38} rx={4} fill={['#c04b4b', '#3f6db0', '#d9b04a'][i]} stroke={INK} strokeWidth={2.8} /></g>)}
      </g>
    ) },
    // 4-5 the front doors slide open; a regular stands in the doorway
    { at: 4, push: [1, 1.05], el: (c) => (
      <g><rect width={W} height={H} fill={PAL.wall} /><Band y={150} />
        <Doors x={60} y={330} w={600} h={620} open={ease(ramp(c.lt, 0.3, 1.4))} sensorOn={tri(c.lt * 3) > 0.5}><NightLot y0={330} h={620} />{regular(360, 770, 1.1, POSE.walk(c.lt, 0.7, 6))}</Doors>
        <rect x={0} y={950} width={W} height={330} fill={PAL.floor} />
        <Txt x={360} y={1120} size={46} fill="#2a2220" ls={3} o={ramp(c.lt, c.s(5), c.s(5) + 0.4)}>HERE EVERY NIGHT AT THREE</Txt>
      </g>
    ) },
    // 6-7 no newspaper tonight; a fist clenched around something small
    { at: 6, push: [1, 1.08], el: (c) => (
      <g><rect width={W} height={H} fill="#22202e" />
        <circle cx={360} cy={620} r={330} fill="#ffe6a8" opacity={0.07} />
        <g transform={`translate(360 650) rotate(${Math.sin(c.lt * 9) * 1.2})`}><ellipse cx={0} cy={0} rx={190} ry={170} fill="#8fc66d" stroke={INK} strokeWidth={8} />{[-90, -30, 30, 90].map((fx) => <path key={fx} d={`M ${fx} -150 q 8 60 ${-fx / 6} 130`} fill="none" stroke="#4f7a3a" strokeWidth={6} strokeLinecap="round" />)}<path d="M -150 100 Q 0 190 150 100" fill="none" stroke="#4f7a3a" strokeWidth={5} /><path d="M 80 40 l 22 -8 l 10 18 l -24 10 z" fill="#7a1c1c" opacity={0.8} />
          <g opacity={ramp(c.lt, c.s(7), c.s(7) + 0.4)}><path d="M -30 -160 L -10 -190 L 26 -160" fill="#f0c43a" stroke={INK} strokeWidth={4} /><g transform="translate(0 -176)">{[0, 1, 2, 3].map((k) => <line key={k} x1={0} y1={0} x2={Math.cos(k * 0.8 + c.lt * 3) * 60} y2={Math.sin(k * 0.8 + c.lt * 3) * -60} stroke="#fff6c8" strokeWidth={4} opacity={0.8} />)}</g></g></g>
        <Txt x={360} y={1090} size={50} fill="#d9b04a" ls={4} o={ramp(c.lt, c.s(7) + 0.3, c.s(7) + 0.8)}>WHAT IS IN HIS FIST?</Txt>
      </g>
    ) },
    // 8 the doors keep trying to shut on him
    { at: 8, push: [1, 1.05], el: (c) => {
      const o = 0.65 + 0.35 * Math.cos(c.lt * 5.5);
      return (
        <g><rect width={W} height={H} fill={PAL.wall} /><Band y={150} />
          <Doors x={60} y={330} w={600} h={620} open={o} sensorOn={tri(c.lt * 4) > 0.5}><NightLot y0={330} h={620} /></Doors>
          {regular(360, 960, 1.35, { ...POSE.idle(c.lt), head: 8 }, false)}
          <rect x={0} y={950} width={W} height={330} fill={PAL.floor} opacity={0.0} />
        </g>
      );
    } },
    // 9-10 Rhea rams him out with a cart and turns the lock; he bumps the glass
    { at: 9, push: [1, 1.05], el: (c) => {
      const push = ease(ramp(c.lt, c.s(9) + 0.6, c.s(9) + 2.8));
      const closed = ramp(c.lt, c.e(9) - 0.6, c.e(9));
      const lock = pop(ramp(c.lt, c.e(9) + 0.1, c.e(9) + 0.5));
      const bump = (o: number) => { const k = ramp(c.lt, c.s(10) + o, c.s(10) + o + 0.12); return k * (1 - ramp(c.lt, c.s(10) + o + 0.12, c.s(10) + o + 0.45)); };
      const bx = bump(0.3) + bump(1.1) + bump(1.9);
      return (
        <g><rect width={W} height={H} fill={PAL.wall} /><Band y={150} />
          <Doors x={60} y={330} w={600} h={620} open={1 - closed} sensorOn><NightLot y0={330} h={620} />{push > 0.65 && <g transform={`translate(0 ${-bx * 14})`}>{regular(360 + bx * 0, 790, 1.0, POSE.walk(c.lt, 0.8, 8))}</g>}</Doors>
          {push <= 0.65 && regular(lerp(360, 360, push), lerp(960, 790, ease(push / 0.65)), lerp(1.35, 1.0, push / 0.65), POSE.walk(c.lt, 0.8, 8))}
          <rect x={0} y={950} width={W} height={330} fill={PAL.floor} />
          {rhea(lerp(120, 330, push), 1130, 1.7, POSE.push(POSE.walk(c.lt, 1.2, 10)))}<Shopcart x={lerp(120, 330, push) + 110} y={1130} s={1.4} />
          <g transform={`translate(360 330) scale(${lock})`} opacity={lock}><rect x={-34} y={-10} width={68} height={56} rx={10} fill="#c93a2e" stroke={INK} strokeWidth={5} /><path d="M -20 -10 L -20 -34 A 20 20 0 0 1 20 -34 L 20 -10" fill="none" stroke={INK} strokeWidth={8} /></g>
        </g>
      );
    } },
    // 11-12 twelve cameras, on every screen someone is running
    { at: 11, push: [1, 1.06], el: (c) => (
      <g><rect width={W} height={H} fill="#cfc09f" />
        <rect x={30} y={170} width={660} height={780} rx={12} fill="#2b3340" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 12 }, (_, i) => {
          const cx = 50 + (i % 4) * 160, cy = 190 + Math.floor(i / 4) * 250;
          const vis = ramp(c.lt, i * 0.06, i * 0.06 + 0.25);
          const run = ramp(c.lt, c.s(12) - 0.2, c.s(12) + 0.2);
          return (
            <g key={i} opacity={vis}><rect x={cx} y={cy} width={150} height={238} fill="#41576d" stroke={INK} strokeWidth={3} /><rect x={cx} y={cy + 170} width={150} height={68} fill="#364a5d" />
              <Txt x={cx + 8} y={cy + 20} size={16} fill="#cfe3ee" ls={1} anchor="start">{`CAM ${String(i + 1).padStart(2, '0')}`}</Txt><circle cx={cx + 136} cy={cy + 14} r={5} fill="#e5392b" opacity={tri(c.lt * 2 + i) > 0.5 ? 1 : 0.3} />
              <g transform={`translate(${cx + 75 + Math.sin(c.lt * 6 + i) * 36 * run} ${cy + 214})`} style={{ filter: 'brightness(3)' }}><Person kind="dead" x={0} floor={0} s={0.5} pose={POSE.run(c.lt + i * 0.2, 1.8)} flip={Math.cos(c.lt * 6 + i) < 0} /></g>
            </g>
          );
        })}
      </g>
    ) },
    // 13-14 Rhea grabs keys and coat, presses a sealed envelope into your hand
    { at: 13, push: [1, 1.05], el: (c) => {
      const env = pop(ramp(c.lt, c.s(14) + 0.1, c.s(14) + 0.7));
      return (
        <g><Interior wall="#c9b99a" line={900} />
          <rect x={430} y={560} width={260} height={30} fill="#8a5a36" stroke={INK} strokeWidth={5} /><rect x={450} y={590} width={18} height={310} fill="#6e4528" stroke={INK} strokeWidth={4} /><rect x={650} y={590} width={18} height={310} fill="#6e4528" stroke={INK} strokeWidth={4} />
          {hero(130, 960, 1.8, POSE.idle(c.lt))}
          {rhea(330, 960, 1.9, { ...POSE.idle(c.lt), lU: lerp(10, 80, ramp(c.lt, c.s(14), c.s(14) + 0.4)), lF: lerp(20, 95, ramp(c.lt, c.s(14), c.s(14) + 0.4)) }, true)}
          <g opacity={ramp(c.lt, c.s(13) + 0.2, c.s(13) + 0.6)}><g transform={`translate(520 ${500 + Math.sin(c.lt * 8) * 4}) rotate(${Math.sin(c.lt * 8) * 6})`}><Keyy x={0} y={0} s={0.6} rot={90} /></g></g>
          <g opacity={env} transform={`translate(230 700) scale(${0.28 * env})`}><Envelope /></g>
        </g>
      );
    } },
    // 15-16 open it on day ten, not before
    { at: 15, card: true, el: (c) => (
      <g><rect width={W} height={H} fill="#8a6a4a" />{Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={i * 110} x2={W} y2={i * 110 + 24} stroke="#76583c" strokeWidth={5} />)}
        <g transform={`translate(360 ${560 + (1 - pop(ramp(c.lt, 0.1, 0.7))) * -300}) `}><Envelope s={1.5} rot={-5} stamp={ease(ramp(c.lt, c.s(16), c.s(16) + 0.25))} /></g>
        <Txt x={360} y={180} size={64} fill="#f6f1e2" ls={5} stroke="#2a1d10" o={ramp(c.lt, 0.2, 0.7)}>DAY TEN</Txt>
      </g>
    ) },
    // 17-19 she is gone; the doors lock; "or so you think"
    { at: 17, push: [1, 1.06], el: (c) => {
      const go = ease(ramp(c.lt, 0.2, c.s(18) - 0.3));
      const flick = c.lt > c.s(19) ? (Math.sin(c.lt * 40) > 0.2 ? 0.55 : 0) * ramp(c.lt, c.s(19), c.s(19) + 0.2) : 0;
      return (
        <g><Interior wall="#bfb394" line={900} /><Door x={400} y={320} w={240} h={580} open={0} sign="EXIT" />
          {rhea(lerp(260, 520, go), 960, 1.8, POSE.walk(c.lt, 1.3, 6), false)}
          {hero(130, 960, 1.8, POSE.idle(c.lt))}
          <Speaker x={560} y={150} t={c.lt} on={ramp(c.lt, c.s(19), c.s(19) + 0.4) * 0.6} />
          <Dark o={flick} />
          <Txt x={360} y={1100} size={70} fill="#c93a2e" ls={4} stroke="#07050f" o={ramp(c.lt, c.s(19), c.s(19) + 0.5)}>OR SO YOU THINK.</Txt>
        </g>
      );
    } },
    // 20 25,000 products and one wall of glass
    { at: 20, push: [1.0, 1.1], el: (c) => (
      <g><Aisle vp={[360, 540]} farGlass farOpen={0} pushed={ramp(c.lt, 0, c.d) * 0.5} />
        <g transform="translate(360 1000)"><rect x={-280} y={-90} width={560} height={150} rx={20} fill="#2a2220" opacity={0.9} /><Txt x={0} y={20} size={92} fill="#f6f1e2" ls={3}>{Math.round(25000 * ease(ramp(c.lt, 0.1, c.d - 0.3))).toLocaleString('en-US')}</Txt><Txt x={0} y={-48} size={26} fill="#d9b04a" ls={6}>PRODUCTS</Txt></g>
      </g>
    ) },
    // 21 problem one: the glass
    { at: 21, card: true, el: (c) => <ProblemCard n="ONE" title="THE GLASS" c={c} icon={<g><rect x={-70} y={-70} width={140} height={140} fill="#cfe3ee" stroke={INK} strokeWidth={8} /><line x1={0} y1={-70} x2={0} y2={70} stroke={INK} strokeWidth={6} /><line x1={-70} y1={0} x2={70} y2={0} stroke={INK} strokeWidth={6} /><path d="M -30 -50 L -10 -10" stroke="#fff" strokeWidth={8} /></g>} /> },
    // 22-23 a steel shutter that needs mains power; wound by hand otherwise
    { at: 22, push: [1, 1.05], el: (c) => (
      <g><Interior wall="#bfb394" line={920} />
        <rect x={20} y={200} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={40} y={310} width={640} height={190} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: 13 }, (_, i) => <line key={i} x1={40} y1={324 + i * 14} x2={680} y2={324 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
        <g transform="translate(360 700)" opacity={ramp(c.lt, 0.3, 0.7)}><path d="M -40 -70 L 40 -70 L 40 -10 Q 40 30 0 30 Q -40 30 -40 -10 Z" fill="#d9d4c0" stroke={INK} strokeWidth={6} /><line x1={-18} y1={-70} x2={-18} y2={-110} stroke={INK} strokeWidth={8} /><line x1={18} y1={-70} x2={18} y2={-110} stroke={INK} strokeWidth={8} /><path d="M 10 -50 l -16 24 l 14 0 l -10 28 l 26 -34 l -14 0 z" fill="#f0c43a" stroke={INK} strokeWidth={3} /></g>
        <g opacity={ramp(c.lt, c.s(23), c.s(23) + 0.4)} transform="translate(360 700)"><rect x={-110} y={-130} width={220} height={220} fill="#f4ecd0" opacity={0.95} stroke={INK} strokeWidth={4} /><g transform={`translate(0 -20) rotate(${c.lt * 240})`}><circle r={50} fill="none" stroke={INK} strokeWidth={10} /><line x1={-50} y1={0} x2={50} y2={0} stroke={INK} strokeWidth={10} /><line x1={0} y1={-50} x2={0} y2={50} stroke={INK} strokeWidth={10} /></g><Txt x={0} y={70} size={34}>BY HAND</Txt></g>
        {hero(120, 1100, 1.6, POSE.idle(c.lt))}
      </g>
    ) },
    // 24-25 you wind it down: thirty-five seconds, like a freight train
    { at: 24, push: [1, 1.06], el: (c) => {
      const d = ease(ramp(c.lt, c.s(24) + 0.6, c.s(25) + 2.2));
      const sh = d > 0 && d < 0.98 ? Math.sin(c.lt * 70) * 5 : 0;
      const secs = Math.round(35 * ramp(c.lt, c.s(25), c.s(25) + 2.4));
      return (
        <g transform={`translate(${sh} ${sh * 0.4})`}><rect width={W} height={H} fill={PAL.wall} />
          <Doors x={60} y={380} w={600} h={560} open={0} sensorOn={false}><NightLot y0={380} h={560} /></Doors>
          <rect x={20} y={260} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={40} y={370} width={640} height={d * 570} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: 41 }, (_, i) => 370 + i * 14 < 370 + d * 570 && <line key={i} x1={40} y1={384 + i * 14} x2={680} y2={384 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
          <rect x={0} y={950} width={W} height={330} fill={PAL.floor} />
          <g transform="translate(110 1100)"><rect x={-90} y={-60} width={180} height={110} rx={14} fill="#2a2220" /><Txt x={0} y={20} size={70} fill="#7dffb0" ls={3}>{`${secs}s`}</Txt></g>
          {d > 0.95 && Array.from({ length: 14 }, (_, i) => <circle key={i} cx={60 + rnd(i) * 600} cy={920 + ((c.lt * 90 + rnd(i + 3) * 80) % 120)} r={4 + rnd(i + 9) * 5} fill="#cfc6b0" opacity={0.5} />)}
        </g>
      );
    } },
    // 26 house rule one
    { at: 26, push: [1, 1.05], el: (c) => (
      <g><rect width={W} height={H} fill={PAL.wall} /><rect x={20} y={260} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={40} y={370} width={640} height={570} fill="#8e99a6" stroke={INK} strokeWidth={4} />{Array.from({ length: 41 }, (_, i) => <line key={i} x1={40} y1={384 + i * 14} x2={680} y2={384 + i * 14} stroke="#5d6772" strokeWidth={3} />)}<rect x={0} y={950} width={W} height={330} fill={PAL.floor} />
        <g transform={`translate(360 ${lerp(1200, 650, pop(ramp(c.lt, 0.1, 0.6)))}) rotate(-3)`}><rect x={-270} y={-110} width={540} height={220} fill="#e9d8ad" stroke={INK} strokeWidth={5} /><Txt x={0} y={-36} size={40} ls={3}>HOUSE RULE ONE:</Txt><Txt x={0} y={44} size={72} fill="#c93a2e" ls={2}>NOBODY COMES IN</Txt></g>
      </g>
    ) },
    // 27 outside, the regular is still pressed against the steel
    { at: 27, push: [1, 1.06], el: (c) => (
      <g><LotSide tone="night" />
        {regular(372, 925, 1.25, { ...POSE.push(POSE.idle(c.lt)), lean: 14 }, false)}
        <Txt x={360} y={200} size={56} fill="#f6f1e2" stroke="#07050f" ls={4} o={ramp(c.lt, 0.2, 0.6)}>STILL THERE.</Txt>
      </g>
    ) },
    // 28-29 a small brass key, tagged with a number: locker twelve
    { at: 28, card: true, el: (c) => {
      const sw = Math.sin(c.lt * 2.2) * 5;
      return (
        <g><rect width={W} height={H} fill="#1c1a28" /><circle cx={360} cy={560} r={360} fill="#ffe6a8" opacity={0.09} />
          <g transform={`translate(360 120) rotate(${sw} 0 0)`}><line x1={0} y1={0} x2={0} y2={250} stroke="#6b6585" strokeWidth={5} />
            <g transform="translate(0 250)"><Keyy x={-34} y={0} s={3.2} rot={90} />
              <g transform={`translate(30 280) rotate(${-sw * 1.5})`} opacity={ramp(c.lt, c.s(29) - 0.3, c.s(29))}><rect x={-120} y={-80} width={240} height={160} rx={20} fill="#f0c43a" stroke={INK} strokeWidth={6} /><circle cx={0} cy={-62} r={10} fill="#1c1a28" stroke={INK} strokeWidth={3} /><Txt x={0} y={40} size={130} fill={INK} ls={2}>12</Txt></g></g></g>
          <g transform={`translate(360 1010) scale(${pop(ramp(c.lt, c.s(29), c.s(29) + 0.5))})`}><Txt x={0} y={0} size={90} fill="#f6f1e2" ls={6} stroke="#07050f">LOCKER 12</Txt></g>
        </g>
      );
    } },
    // 30-31 5:23, the power goes out and the freezers fall silent
    { at: 30, push: [1, 1.05], el: (c) => {
      const die = ramp(c.lt, c.s(30) + 1.4, c.s(30) + 1.6);
      const flick = die > 0 ? 1 : (Math.sin(c.lt * 30) > 0.9 ? 0.3 : 0);
      return (
        <g><Interior wall="#cfc9bb" line={900} />
          {Array.from({ length: 4 }, (_, i) => <g key={i}><rect x={20 + i * 175} y={200} width={160} height={700} fill="#e8ecef" stroke={INK} strokeWidth={5} /><rect x={36 + i * 175} y={222} width={128} height={640} fill="#bcd6e6" stroke={INK} strokeWidth={4} opacity={0.8} /><circle cx={100 + i * 175} cy={190} r={8} fill={die ? '#4a1d1a' : '#4aa86a'} stroke={INK} strokeWidth={2} /></g>)}
          <g transform="translate(360 120)"><rect x={-120} y={-44} width={240} height={90} rx={12} fill="#2a2220" /><Txt x={0} y={26} size={64} fill={die ? '#3a4a3a' : '#7dffb0'} ls={4}>5:23</Txt></g>
          {hero(360, 1090, 1.7, POSE.idle(c.lt))}
          <Dark o={die * 0.92 + flick * 0.3} />
          <g opacity={ramp(c.lt, c.s(31), c.s(31) + 0.5)}><Txt x={360} y={700} size={80} fill="#f6f1e2" ls={6} stroke="#07050f">SILENCE.</Txt></g>
        </g>
      );
    } },
    // 32-33 a clunk at the back: the magnet needs power
    { at: 32, push: [1, 1.08], el: (c) => {
      const clunk = ramp(c.lt, c.s(32) + 1.0, c.s(32) + 1.1);
      const led = c.lt < c.s(33) + 1.4;
      const jolt = clunk * Math.max(0, Math.sin((c.lt - c.s(32) - 1.0) * 50)) * 6 * (1 - ramp(c.lt, c.s(32) + 1.1, c.s(32) + 1.6));
      return (
        <g transform={`translate(${jolt} 0)`}><Interior wall="#7f7a8a" line={900} /><Dark o={0.35} color="#10101c" />
          <Door x={250} y={300} w={230} h={600} open={ramp(c.lt, c.s(33) + 1.2, c.s(33) + 1.8) * 0.12} color="#6a7580" />
          <g transform="translate(365 230)"><rect x={-70} y={-30} width={140} height={56} rx={8} fill="#3a3f48" stroke={INK} strokeWidth={4} /><circle cx={-40} cy={-2} r={9} fill={led ? '#4aa86a' : '#4a1d1a'} stroke={INK} strokeWidth={2} /><Txt x={14} y={8} size={22} fill="#dfe3e8" ls={1}>MAGNET LOCK</Txt></g>
          <g opacity={ramp(c.lt, c.s(33) + 1.4, c.s(33) + 1.7)}><Txt x={360} y={1060} size={60} fill="#c93a2e" ls={4} stroke="#07050f">NO POWER, NO LOCK.</Txt></g>
        </g>
      );
    } },
    // 34-35 you run the whole length of the store: too late
    { at: 34, push: [1, 1.05], el: (c) => {
      const scroll = c.lt * 560;
      const door = lerp(1000, 560, ease(ramp(c.lt, 0, c.s(35) + 0.6)));
      return (
        <g><Interior wall="#a89c86" line={900} /><Dark o={0.35} color="#10101c" />
          {Array.from({ length: 6 }, (_, i) => { const px = ((i * 300 - scroll * 0.7) % 1800 + 1800) % 1800 - 200; return <g key={i}><rect x={px} y={250} width={140} height={650} fill="#8a8068" stroke={INK} strokeWidth={4} /><rect x={px + 20} y={330} width={100} height={420} fill="#6f6452" stroke={INK} strokeWidth={3} /></g>; })}
          <Door x={door - 120} y={330} w={240} h={570} open={0.12} color="#6a7580" />
          {hero(220, 1030, 1.9, c.lt < c.s(35) + 0.5 ? POSE.run(c.lt, 1.7) : { ...POSE.idle(c.lt), head: 6 })}
          <g opacity={ramp(c.lt, c.s(35), c.s(35) + 0.4)}><Txt x={360} y={1160} size={72} fill="#c93a2e" ls={4} stroke="#07050f">TOO LATE.</Txt></g>
        </g>
      );
    } },
    // 36 the door is open, and wet footprints lead inside
    { at: 36, push: [1, 1.08], el: (c) => (
      <g><Interior wall="#7f7a8a" line={900} /><Dark o={0.3} color="#10101c" />
        <Door x={110} y={300} w={230} h={600} open={0.55} color="#6a7580" />
        {Array.from({ length: 8 }, (_, i) => { const a = ramp(c.lt, 0.2 + i * 0.26, 0.45 + i * 0.26); const t = i / 7; return <g key={i} opacity={a}><Footprint x={lerp(250, 520, t) + (i % 2 ? 22 : -22) * lerp(0.6, 1.8, t)} y={lerp(930, 1180, t)} s={lerp(0.55, 1.5, t)} flip={i % 2 === 0} /></g>; })}
        {hero(600, 1010, 1.7, { ...POSE.idle(c.lt), head: 12 }, true)}
        <rect width={W} height={H} fill="#07050f" opacity={ramp(c.lt, c.d - 0.8, c.d)} />
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
void Clock; void CardBg; void H; void lerp; void clamp;
