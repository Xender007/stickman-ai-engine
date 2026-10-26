/** Chapter 4: Forty Seconds (16:9, script v4). Scene cuts keyed to script sentence numbers (0-based within the chapter). */
import React from 'react';
import type { Chapter } from '../engine.tsx';
import { Callout, CardW, Car, DarkW, Door, INK, Keyy, LotW, Mob, Pallet, Person, POSE, Room, Txt, Waves, W, H, clamp, ease, lerp, pop, ramp, rnd, tri } from '../kit.tsx';
import { ProblemW } from '../parts.tsx';

const F = 560;
const hero = (x: number, floor: number, s: number, pose = POSE.idle(0), flip = false) => <Person kind="hero" x={x} floor={floor} s={s} pose={pose} flip={flip} />;
const Blueprint: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1f3b5c" />{Array.from({ length: 11 }, (_, i) => <line key={i} x1={-100} y1={i * 72} x2={W + 100} y2={i * 72} stroke="#2f527a" strokeWidth={2} />)}{Array.from({ length: 19 }, (_, i) => <line key={`v${i}`} x1={i * 72} y1={-100} x2={i * 72} y2={H + 100} stroke="#2f527a" strokeWidth={2} />)}{children}</g>
);
const Breaker: React.FC<{ x: number; y: number; s?: number; down: number }> = ({ x, y, s = 1, down }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-210} y={-280} width={420} height={560} rx={16} fill="#7d838b" stroke={INK} strokeWidth={7} /><rect x={-170} y={-220} width={340} height={430} fill="#4b5560" stroke={INK} strokeWidth={5} /><rect x={-28} y={-190} width={56} height={340} rx={12} fill="#2a2e34" stroke={INK} strokeWidth={4} />
    <g transform={`translate(0 ${lerp(-110, 90, down)})`}><rect x={-34} y={-44} width={68} height={88} rx={14} fill="#c93a2e" stroke={INK} strokeWidth={5} /></g><Txt x={0} y={-244} size={34} fill="#f6f1e2" ls={4}>MAIN</Txt></g>
);
const Locker: React.FC<{ x: number; y: number; n: number; open?: number; hi?: boolean }> = ({ x, y, n, open = 0, hi }) => (
  <g><rect x={x} y={y} width={120} height={380} fill={hi ? '#4aa0d8' : '#6a7a8a'} stroke={INK} strokeWidth={5} />{open > 0 && <rect x={x + 8} y={y + 8} width={104} height={364} fill="#1b1d22" />}
    <polygon points={`${x},${y} ${x + 120 - open * 100},${y + open * 20} ${x + 120 - open * 100},${y + 380 - open * 20} ${x},${y + 380}`} fill={hi ? '#4aa0d8' : '#6a7a8a'} stroke={INK} strokeWidth={5} opacity={open > 0 ? 0.95 : 0} />
    {open === 0 && <g><rect x={x + 30} y={y + 40} width={60} height={16} fill="#2a2e34" /><circle cx={x + 60} cy={y + 240} r={9} fill="#d9d4c0" stroke={INK} strokeWidth={3} /><rect x={x + 35} y={y + 300} width={50} height={36} rx={4} fill="#f6f1e2" stroke={INK} strokeWidth={3} /><Txt x={x + 60} y={y + 330} size={26} fill={INK} maxW={44}>{String(n)}</Txt></g>}
  </g>
);
const Envelope: React.FC<{ s?: number; rot?: number; flap?: number }> = ({ s = 1, rot = 0, flap = 0 }) => (
  <g transform={`rotate(${rot}) scale(${s})`}><rect x={-190} y={-120} width={380} height={240} fill="#efe2bd" stroke={INK} strokeWidth={6} /><path d={`M -190 -120 L 0 ${lerp(20, -150, flap)} L 190 -120`} fill={flap > 0.5 ? '#d9cb9f' : 'none'} stroke={INK} strokeWidth={5} />{flap < 0.5 && <circle cx={0} cy={18} r={34} fill="#c93a2e" stroke={INK} strokeWidth={5} />}</g>
);

export const ch: Chapter = {
  n: 4, label: 'FORTY SECONDS',
  scenes: [
    // 0 the main breaker is seventy yards away
    { at: 0, card: true, el: (c) => {
      const k = ramp(c.lt, 0.5, c.d - 0.3);
      return (
        <g><Blueprint><rect x={110} y={90} width={1060} height={420} fill="none" stroke="#cfe3ee" strokeWidth={6} />{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={250 + i * 140} y={190} width={60} height={230} fill="none" stroke="#7fa6c8" strokeWidth={3} />)}
          <rect x={110} y={450} width={280} height={60} fill="#4aa86a" opacity={0.6} /><Txt x={250} y={492} size={28} fill="#fff" ls={2} maxW={250}>FRONT DOORS</Txt><rect x={950} y={90} width={220} height={120} fill="#c93a2e" opacity={0.35} stroke="#cfe3ee" strokeWidth={4} /><Txt x={1060} y={140} size={26} fill="#fff" ls={1} maxW={200}>BACK OFFICE</Txt><Txt x={1060} y={178} size={26} fill="#ffe6a8" ls={1} maxW={200}>MAIN BREAKER</Txt>
          <circle cx={250} cy={440} r={18} fill="#d9b04a" stroke="#fff" strokeWidth={4} /><path d="M 250 440 L 250 330 L 1060 200" fill="none" stroke="#ffe6a8" strokeWidth={8} strokeDasharray="22 16" strokeLinecap="round" opacity={k} /></Blueprint>
          <g opacity={ramp(c.lt, 0.6, 1.1)}><Txt x={640} y={570} size={1} o={0}>.</Txt></g>
          <Callout x={820} y={110} w={440} lines={[{ t: '70 YARDS', size: 84, fill: '#ffe6a8' }]} o={ramp(c.lt, 0.6, 1.1)} />
        </g>
      );
    } },
    // 1 you run it faster than you have ever run anything
    { at: 1, push: [1, 1.04], el: (c) => {
      const scroll = c.lt * 600, box = lerp(1500, 1030, ease(ramp(c.lt, 0, c.d - 0.2)));
      return (
        <g><Room wall="#b9ae8c" line={500} />
          {Array.from({ length: 8 }, (_, i) => { const px = ((i * 300 - scroll * 0.6) % 2400 + 2400) % 2400 - 300; return <g key={i}><rect x={px} y={100} width={150} height={400} fill="#a39a7c" stroke={INK} strokeWidth={4} /><rect x={px + 30} y={150} width={90} height={150} fill="#d9d4c0" stroke={INK} strokeWidth={3} /></g>; })}
          <g data-enter="1"><Breaker x={box} y={300} s={0.5} down={0} /></g>{hero(420, F, 1.9, POSE.run(c.lt, 1.7))}
        </g>
      );
    } },
    // 2-3 ten steps short, the lights die: 35 seconds of light, darkness, silence
    { at: 2, push: [1, 1.04], el: (c) => {
      const die = ramp(c.lt, c.s(2) + 1.8, c.s(2) + 1.95), secs = Math.round(35 * ramp(c.lt, c.s(3), c.e(3)));
      return (
        <g><Room wall="#b9ae8c" line={500} />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={40 + i * 160} y={30} width={110} height={24} fill="#fff6c8" stroke={INK} strokeWidth={3} />)}
          <Breaker x={1040} y={300} s={0.5} down={0} />{hero(540, F, 1.9, c.lt < c.s(2) + 1.8 ? POSE.run(c.lt, 1.7) : { ...POSE.idle(c.lt), head: 8 })}<DarkW o={die * 0.92} />
          <Callout x={1120} y={500} w={240} lines={[{ t: `${secs}s`, size: 80, fill: die ? '#ff6a5a' : '#7dffb0' }]} />
          <Callout x={400} y={150} w={640} lines={[{ t: 'LIGHT. DARK. SILENCE.', size: 54 }]} o={ramp(c.lt, c.s(3) + 1.2, c.s(3) + 1.6)} />
        </g>
      );
    } },
    // 4-5 you did not touch the breaker: somebody else did
    { at: 4, push: [1, 1.05], el: (c) => (
      <g><Room wall="#b9ae8c" line={500} /><DarkW o={0.5} /><Breaker x={700} y={280} s={0.78} down={ease(ramp(c.lt, 0.2, 0.7))} />
        {hero(220, F, 1.7, POSE.idle(c.lt))}
        <g opacity={ramp(c.lt, c.s(5), c.s(5) + 0.4)}><g transform={`translate(${lerp(1000, 1320, ramp(c.lt, c.s(5) + 0.2, c.d))} ${F})`} style={{ filter: 'brightness(0)' }}><Person kind="kid" x={0} floor={0} s={1.7} pose={POSE.walk(c.lt, 1.2, 8)} flip={false} /></g>
          <Callout x={1020} y={180} w={420} lines={[{ t: 'SOMEBODY', size: 46, fill: '#ff8a7a' }, { t: 'ELSE DID.', size: 46, fill: '#ff8a7a' }]} /></g>
      </g>
    ) },
    // 6-8 day ten: the envelope on the office floor, a last resort
    { at: 6, push: [1, 1.05], el: (c) => (
      <g><Room wall="#a89c86" line={480} /><DarkW o={0.45} />
        <g transform="translate(1040 170)"><rect x={-110} y={-70} width={220} height={150} rx={10} fill="#f6f1e2" stroke={INK} strokeWidth={5} /><rect x={-110} y={-70} width={220} height={40} fill="#c93a2e" stroke={INK} strokeWidth={5} /><Txt x={0} y={-40} size={28} fill="#fff" ls={3}>DAY</Txt><Txt x={0} y={52} size={80}>{c.lt > c.s(7) ? '10' : '9'}</Txt></g>
        {hero(350, F, 1.8, POSE.sit())}<g transform={`translate(560 ${480 - ramp(c.lt, 0.2, 0.8) * 20}) rotate(-8)`}><Envelope s={0.5} /></g>
        <Callout x={820} y={330} w={520} lines={[{ t: 'ONLY AS A LAST RESORT', size: 44, fill: '#ffd47a' }]} o={ramp(c.lt, c.s(8), c.s(8) + 0.5)} />
      </g>
    ) },
    // 9-10 the power is gone, the crowd is gathering, you are out of ideas
    { at: 9, push: [1, 1.04], el: (c) => (
      <g><LotW tone="night" /><Mob n={70} t={c.t} seed={31} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} shown={ramp(c.lt, 0, c.s(10))} />
        <Person kind="hero" x={1000} floor={186} s={0.75} pose={POSE.idle(c.lt)} flip />
        <Callout x={330} y={150} w={500} lines={[{ t: 'OUT OF IDEAS.', size: 56, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(9) + 0.6, c.s(9) + 1.0)} />
        <g transform={`translate(1000 420) scale(${pop(ramp(c.lt, c.s(10), c.s(10) + 0.5))})`} opacity={ramp(c.lt, c.s(10), c.s(10) + 0.3)}><rect x={-190} y={-40} width={380} height={80} rx={10} fill="#fff" stroke="#c93a2e" strokeWidth={7} /><Txt x={0} y={14} size={44} fill="#c93a2e" ls={3} maxW={340}>LAST RESORT</Txt></g>
      </g>
    ) },
    // 11-12 you tear it open: inside, there is no letter
    { at: 11, card: true, el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#8a6a4a" />{Array.from({ length: 9 }, (_, i) => <line key={i} x1={-100} y1={i * 90} x2={W + 100} y2={i * 90 + 18} stroke="#76583c" strokeWidth={5} />)}
        <g transform="translate(500 330)"><Envelope s={1.2} flap={ease(ramp(c.lt, 0.5, 1.2))} rot={-4} />{ramp(c.lt, 1.2, 1.5) > 0 && <rect x={-170} y={-100} width={340} height={200} fill="#fdf8e8" opacity={ramp(c.lt, 1.2, 1.6)} />}</g>
        <Callout x={1030} y={250} w={380} lines={[{ t: 'NO LETTER.', size: 66, fill: '#ff8a7a' }]} o={ramp(c.lt, c.s(12), c.s(12) + 0.4)} />
      </g>
    ) },
    // 13 a floor plan: a service tunnel under the freezer
    { at: 13, card: true, el: (c) => {
      const k = ramp(c.lt, 0.3, 1.8);
      return (
        <g><Blueprint><rect x={110} y={90} width={1060} height={400} fill="none" stroke="#cfe3ee" strokeWidth={6} />{[0, 1, 2].map((i) => <rect key={i} x={170 + i * 130} y={160} width={60} height={250} fill="none" stroke="#7fa6c8" strokeWidth={3} />)}
          <rect x={780} y={110} width={260} height={220} fill="#9fd0e8" opacity={0.3} stroke="#cfe3ee" strokeWidth={4} /><Txt x={910} y={235} size={32} fill="#fff" ls={2} maxW={220}>FREEZER</Txt>
          <path d="M 910 330 L 910 440 L 300 440" fill="none" stroke="#ffe6a8" strokeWidth={7} strokeDasharray="20 14" opacity={k} /><Txt x={600} y={420} size={34} fill="#ffe6a8" ls={3} o={k} maxW={400}>SERVICE TUNNEL</Txt>
          <ellipse cx={910} cy={220} rx={170} ry={140} fill="none" stroke="#e5361d" strokeWidth={9} strokeDasharray="1000" strokeDashoffset={1000 * (1 - k)} /></Blueprint>
        </g>
      );
    } },
    // 14 one line in her handwriting
    { at: 14, card: true, el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#8a6a4a" /><g transform="translate(640 300) rotate(-2)"><rect x={-420} y={-230} width={840} height={460} fill="#f4ecd0" stroke={INK} strokeWidth={5} />{Array.from({ length: 6 }, (_, i) => <line key={i} x1={-400} y1={-150 + i * 62} x2={400} y2={-150 + i * 62} stroke="#b9c8d8" strokeWidth={3} />)}
        {['DO NOT LET THEM', 'HEAR THE COLD.'].map((l, i) => <g key={i} opacity={ramp(c.lt, c.s(14) + 0.3 + i * 0.6, c.s(14) + 0.7 + i * 0.6)}><Txt x={0} y={-60 + i * 110} size={74} fill="#4a4a50" ls={2} rot={-1 + i} maxW={760}>{l}</Txt></g>)}</g></g>
    ) },
    // 15-16 you do not understand it yet; you understand the crowd
    { at: 15, push: [1, 1.04], el: (c) => (
      <g><LotW tone="night" /><Mob n={86} t={c.t} seed={31} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} />
        <Person kind="hero" x={1000} floor={186} s={0.75} pose={{ ...POSE.idle(c.lt), head: 10 }} flip /><g transform={`translate(1000 90) scale(${pop(ramp(c.lt, 0.3, 0.8))})`}><Txt x={0} y={0} size={70} fill="#d9b04a" stroke="#07050f" maxW={80}>?</Txt></g>
        <Callout x={330} y={150} w={500} lines={[{ t: 'THE CROWD IS CLEAR.', size: 46 }]} o={ramp(c.lt, c.s(16), c.s(16) + 0.4)} />
      </g>
    ) },
    // 17-18 not leaning any more: pushing
    { at: 17, push: [1, 1.05], el: (c) => {
      const push = ramp(c.lt, c.s(18), c.s(18) + 0.5), shake = push * Math.sin(c.lt * 38) * 4;
      return (
        <g><LotW tone="night" /><g transform={`translate(${shake} 0)`}><Mob n={86} t={c.t} seed={31} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} still={false} /></g>
          {c.lt < c.s(18) && <Callout x={330} y={150} w={460} lines={[{ t: 'NOT LEANING', size: 56, fill: '#ffd47a' }]} />}
          {c.lt > c.s(18) && <g transform={`translate(330 150) scale(${pop(ramp(c.lt, c.s(18), c.s(18) + 0.4))})`}><Txt x={0} y={0} size={100} fill="#ff5a3a" stroke="#2a0608" maxW={560}>PUSHING!</Txt></g>}
        </g>
      );
    } },
    // 19 problem three
    { at: 19, card: true, el: (c) => <ProblemW n="THREE" title="THE SHUTTER" lt={c.lt} icon={<g><rect x={-90} y={-60} width={180} height={34} fill="#4d5560" stroke={INK} strokeWidth={6} />{Array.from({ length: 5 }, (_, i) => <rect key={i} x={-84} y={-24 + i * 16} width={168} height={12} fill="#8e99a6" stroke={INK} strokeWidth={3} />)}</g>} /> },
    // 20-21 built for one man with a crowbar, not 250
    { at: 20, card: true, el: (c) => (
      <g><CardW /><Txt x={640} y={80} size={50} ls={4}>BUILT TO STOP:</Txt>
        <g opacity={ramp(c.lt, 0.1, 0.5)}><rect x={80} y={130} width={530} height={380} rx={20} fill="#f4f8f1" stroke={INK} strokeWidth={5} /><Person kind="kid" x={230} floor={460} s={1.6} pose={{ ...POSE.idle(), lU: 140, lF: 120 }} hold={<g transform="rotate(-20)"><rect x={-3} y={-60} width={8} height={70} fill="#3a3f48" stroke={INK} strokeWidth={2} /></g>} /><Txt x={470} y={290} size={50} maxW={220}>1 MAN</Txt><Txt x={470} y={350} size={30} fill="#6f7f6a" maxW={220}>+ 1 CROWBAR</Txt><g transform={`translate(540 190) scale(${pop(ramp(c.lt, 0.7, 1.2))})`}><circle r={40} fill="#4aa86a" stroke={INK} strokeWidth={5} /><path d="M -18 2 l 12 14 l 26 -30" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /></g></g>
        <g opacity={ramp(c.lt, c.s(21), c.s(21) + 0.4)}><rect x={670} y={130} width={530} height={380} rx={20} fill="#f4f8f1" stroke={INK} strokeWidth={5} />{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={720 + (i % 8) * 46} cy={200 + Math.floor(i / 8) * 50} r={16} fill="#b8c4b3" stroke={INK} strokeWidth={3} />)}<Txt x={935} y={430} size={60} fill="#c93a2e" maxW={460}>250 PEOPLE</Txt><g transform={`translate(1140 180) scale(${pop(ramp(c.lt, c.s(21) + 0.5, c.s(21) + 1.0))})`}><circle r={40} fill="#c93a2e" stroke={INK} strokeWidth={5} /><path d="M -16 -16 l 32 32 M 16 -16 l -32 32" stroke="#fff" strokeWidth={9} strokeLinecap="round" /></g></g>
      </g>
    ) },
    // 22 by midnight the steel has started to bow
    { at: 22, push: [1, 1.04], el: (c) => {
      const bow = ramp(c.lt, 0.2, c.d - 0.2) * 70;
      return (
        <g><Room wall="#bfb394" line={520} /><g transform={`translate(${Math.sin(c.lt * 31) * 2.5} 0)`}><rect x={250} y={30} width={780} height={90} fill="#4d5560" stroke={INK} strokeWidth={5} /><path d={`M 270 120 L 1010 120 Q ${1010 + bow} 330 1010 520 L 270 520 Q ${270 - bow} 330 270 120 Z`} fill="#8e99a6" stroke={INK} strokeWidth={5} />{Array.from({ length: 28 }, (_, i) => <line key={i} x1={274} y1={134 + i * 14} x2={1006} y2={134 + i * 14} stroke="#5d6772" strokeWidth={3} />)}</g>
          <Callout x={1140} y={250} w={250} lines={[{ t: 'MIDNIGHT', size: 40, fill: '#ff8a7a' }]} o={ramp(c.lt, 0.5, 1.0)} />
        </g>
      );
    } },
    // 23-24 a second wall: water pallets against the steel
    { at: 23, push: [1, 1.04], el: (c) => (
      <g><Room wall="#bfb394" line={520} /><rect x={250} y={30} width={780} height={90} fill="#4d5560" stroke={INK} strokeWidth={5} /><rect x={270} y={120} width={740} height={400} fill="#8e99a6" stroke={INK} strokeWidth={5} />{Array.from({ length: 20 }, (_, i) => <line key={i} x1={270} y1={134 + i * 20} x2={1010} y2={134 + i * 20} stroke="#5d6772" strokeWidth={3} />)}
        {Array.from({ length: 6 }, (_, i) => { const a = pop(ramp(c.lt, c.s(24) + i * 0.3, c.s(24) + 0.35 + i * 0.3)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(0 ${(1 - a) * -260})`}><Pallet x={380 + (i % 3) * 270} floor={F - Math.floor(i / 3) * 0} s={1.2} color="#6bb6e8" /></g>; })}
        {hero(130, F, 1.6, POSE.push(POSE.walk(c.lt, 1.2, 10)))}<Callout x={1130} y={250} w={240} lines={[{ t: 'A TON', size: 44 }, { t: 'EACH', size: 44 }]} o={ramp(c.lt, c.s(24) + 1.4, c.s(24) + 1.9)} />
      </g>
    ) },
    // 25 shopping carts, nested and chained
    { at: 25, push: [1, 1.04], el: (c) => {
      const n = Math.floor(ramp(c.lt, 0.2, c.d - 0.4) * 14) + 1;
      return (
        <g><Room wall="#bfb394" line={500} />{Array.from({ length: n }, (_, i) => <g key={i} transform={`translate(${80 + i * 36} ${F}) scale(1.6)`}><path d="M -50 -70 L 50 -70 L 40 -20 L -40 -20 Z" fill="#cdd5da" fillOpacity={0.4} stroke={INK} strokeWidth={3} /><circle cx={-26} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /><circle cx={28} cy={-8} r={9} fill="#555" stroke={INK} strokeWidth={2.5} /></g>)}
          <path d="M 60 470 Q 300 540 560 470" fill="none" stroke="#3a3f48" strokeWidth={8} strokeDasharray="18 8" strokeLinecap="round" opacity={ramp(c.lt, 1.0, 1.6)} />
          <Callout x={940} y={250} w={460} lines={[{ t: 'NESTED + CHAINED', size: 34, fill: '#d9b04a' }, { t: '30 CARTS / ROW', size: 56 }]} />
        </g>
      );
    } },
    // 26-27 a wall only buys time; you need them to leave
    { at: 26, card: true, el: (c) => {
      const sand = ramp(c.lt, 0.2, c.s(27) + 1.0);
      return (
        <g><CardW /><g transform="translate(400 290) scale(0.85)"><path d="M -120 -200 L 120 -200 L 120 -170 Q 120 -90 22 -10 Q 120 70 120 150 L 120 200 L -120 200 L -120 150 Q -120 70 -22 -10 Q -120 -90 -120 -170 Z" fill="#f4f8f1" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><path d={`M -100 ${-170 + sand * 120} L 100 ${-170 + sand * 120} L 100 -150 Q 100 -90 12 -10 L -12 -10 Q -100 -90 -100 -150 Z`} fill="#d9b04a" opacity={1 - sand * 0.9} /><path d={`M -100 ${190 - sand * 120} Q 0 ${150 - sand * 130} 100 ${190 - sand * 120} L 100 190 L -100 190 Z`} fill="#d9b04a" /><rect x={-140} y={-224} width={280} height={24} rx={8} fill="#8a5a36" stroke={INK} strokeWidth={5} /><rect x={-140} y={200} width={280} height={24} rx={8} fill="#8a5a36" stroke={INK} strokeWidth={5} /></g>
          <Txt x={900} y={200} size={66} ls={3} maxW={520}>A WALL ONLY</Txt><Txt x={900} y={280} size={66} ls={3} maxW={520}>BUYS TIME.</Txt><g opacity={ramp(c.lt, c.s(27), c.s(27) + 0.5)}><Txt x={900} y={430} size={58} fill="#c93a2e" ls={3} maxW={520}>THEY MUST LEAVE.</Txt></g></g>
      );
    } },
    // 28 Rhea's van is still in the lot
    { at: 28, push: [1, 1.04], el: (c) => (
      <g><LotW tone="dusk" /><rect x={225} y={490} width={10} height={100} fill="#f2eee2" /><rect x={535} y={490} width={10} height={100} fill="#f2eee2" /><Car x={380} floor={F} s={1.15} color="#ece6d4" />
        <Callout x={330} y={150} w={560} lines={[{ t: "RHEA'S VAN. STILL THERE.", size: 44 }]} o={ramp(c.lt, 0.2, 0.6)} /></g>
    ) },
    // 29-30 locker twelve is Rhea's
    { at: 29, push: [1, 1.04], el: (c) => {
      const open = ease(ramp(c.lt, c.s(30), c.s(30) + 0.8)), k = ease(ramp(c.lt, 0.5, c.s(30)));
      return (
        <g><Room wall="#a9b4be" floor="#8e99a4" line={500} tiles={false} />{[0, 1, 2, 3, 4, 5].map((i) => <Locker key={i} x={180 + i * 135} y={120} n={8 + i} hi={8 + i === 12} open={8 + i === 12 ? open : 0} />)}
          <g transform={`translate(${lerp(120, 770, k)} ${lerp(500, 330, k)})`} opacity={1 - open}><Keyy x={0} y={0} s={0.9} /></g>
          {hero(1130, F, 1.6, POSE.idle(c.lt), true)}<Callout x={1040} y={150} w={340} lines={[{ t: 'STAFF LOCKERS', size: 34 }]} o={ramp(c.lt, 0.2, 0.6)} />
        </g>
      );
    } },
    // 31 inside: her phone, a photograph of two kids, and the van's remote
    { at: 31, push: [1, 1.03], el: (c) => (
      <g><rect x={-100} y={-100} width={W + 200} height={H + 200} fill="#1b1d22" /><rect x={160} y={30} width={960} height={540} fill="#3a4350" stroke={INK} strokeWidth={8} />
        {[0, 1, 2].map((i) => { const a = pop(ramp(c.lt, 0.3 + i * 0.7, 0.8 + i * 0.7)); return <g key={i} opacity={clamp(a * 3)} transform={`translate(${320 + i * 320} 290) scale(${a})`}>
          {i === 0 && <g><rect x={-60} y={-100} width={120} height={200} rx={16} fill="#2a2e34" stroke={INK} strokeWidth={5} /><rect x={-48} y={-82} width={96} height={150} fill="#9fd0e8" opacity={0.7} /><Txt x={0} y={150} size={32} fill="#f6f1e2" maxW={240}>HER PHONE</Txt></g>}
          {i === 1 && <g><rect x={-120} y={-90} width={240} height={180} fill="#f6f1e2" stroke={INK} strokeWidth={5} />{[-50, 50].map((px) => <g key={px}><circle cx={px} cy={-20} r={24} fill="#f6e6c8" stroke={INK} strokeWidth={3} /><path d={`M ${px - 30} 70 Q ${px} 0 ${px + 30} 70 Z`} fill={px < 0 ? '#c93a2e' : '#3d63a8'} stroke={INK} strokeWidth={3} /></g>)}<Txt x={0} y={150} size={32} fill="#f6f1e2" maxW={240}>TWO KIDS</Txt></g>}
          {i === 2 && <g><rect x={-50} y={-70} width={100} height={140} rx={20} fill="#2a2e34" stroke={INK} strokeWidth={5} /><circle cx={0} cy={20} r={30} fill="#c93a2e" stroke={INK} strokeWidth={4} /><Txt x={0} y={120} size={32} fill="#f6f1e2" maxW={240}>VAN REMOTE</Txt></g>}</g>; })}</g>
    ) },
    // 32 roof: aim the remote, hold the panic button
    { at: 32, push: [1, 1.05], el: (c) => (
      <g><LotW tone="night" /><Car x={380} floor={F} s={1.15} color="#ece6d4" /><Mob n={50} t={c.t} seed={77} x0={40} x1={300} f0={500} f1={585} s0={0.5} s1={0.65} face="right" />
        <Person kind="hero" x={1000} floor={186} s={0.75} pose={{ ...POSE.idle(c.lt), lU: 100, lF: 100 }} flip hold={<g><rect x={-6} y={-8} width={14} height={20} rx={4} fill="#2a2e34" stroke={INK} strokeWidth={2} /><circle cx={0} cy={0} r={4} fill="#c93a2e" /></g>} />
        <path d="M 960 120 L 400 420" stroke="#c93a2e" strokeWidth={4} strokeDasharray="12 10" opacity={ramp(c.lt, 1.2, 1.8)} />
        <Callout x={330} y={150} w={480} lines={[{ t: 'THE PANIC BUTTON', size: 46 }]} o={ramp(c.lt, 0.2, 0.6)} />
      </g>
    ) },
    // 33 the horn screams
    { at: 33, push: [1, 1.05], el: (c) => (
      <g><LotW tone="night" /><Mob n={80} t={c.t} seed={61} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} face="right" still={false} /><Car x={380} floor={F} s={1.15} color="#ece6d4" />
        <Waves x={380} y={470} t={c.lt * 1.4} n={6} max={600} color="#d9462a" /><g transform={`translate(380 170) scale(${1 + 0.1 * tri(c.lt * 8)})`}><Txt x={0} y={0} size={96} fill="#ff5a3a" stroke="#07050f" ls={4} maxW={500}>HONK!!</Txt></g></g>
    ) },
    // 34 two hundred and fifty heads swing away
    { at: 34, push: [1, 1.04], el: (c) => {
      const drift = ramp(c.lt, 0.6, c.d) * 170;
      return (
        <g><LotW tone="night" /><g transform={`translate(${-drift} 0)`}><Mob n={86} t={c.t} seed={31} x0={40} x1={650} f0={480} f1={585} s0={0.55} s1={0.78} face="left" still={false} /></g>
          <Car x={380} floor={F} s={1.15} color="#ece6d4" /><Waves x={380} y={470} t={c.lt * 1.4} n={5} max={500} color="#d9462a" />
          <Callout x={940} y={150} w={560} lines={[{ t: '250 HEADS TURN AWAY', size: 46, fill: '#ffd47a' }]} o={ramp(c.lt, 0.3, 0.7)} />
        </g>
      );
    } },
  ],
  cues: [
    [0, 0.5, 'click'], [1, 0, 'run', 3.5], [2, 0.0, 'run', 1.8], [2, 1.85, 'powerdown'], [3, 0.2, 'moan', 3], [4, 0.3, 'clunk'], [5, 0.4, 'steps', 2],
    [8, 0.3, 'click'], [10, 0.4, 'sting'], [11, 0.6, 'snap'], [12, 0.2, 'whoosh'], [14, 0.4, 'scratch', 2], [15, 0.0, 'moan', 5], [18, 0.0, 'slam'], [18, 0.5, 'slam'], [18, 1.0, 'slam'], [19, 0.1, 'slam'],
    [22, 0.2, 'rumble'], [24, 0.2, 'thud'], [24, 0.6, 'thud'], [24, 0.95, 'thud'], [24, 1.3, 'thud'], [25, 0.3, 'clink'], [25, 0.7, 'clink'], [25, 1.1, 'clink'], [27, 0.1, 'click'],
    [29, 0.9, 'clink'], [30, 0.5, 'creak'], [31, 0.3, 'ding'], [31, 1.1, 'ding'], [31, 1.9, 'ding'], [32, 1.4, 'click'], [33, 0.1, 'alarm', 4], [33, 0.2, 'sting'], [34, 0.2, 'moan', 4],
  ],
};
void Txt; void Door; void rnd; void CardW; void H; void lerp;
