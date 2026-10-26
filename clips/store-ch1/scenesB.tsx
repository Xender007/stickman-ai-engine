import React from 'react';
import { Doodle, INK, PAL } from './doodle.tsx';
import { Can, CardBg, Doors, Floor, H, NightLot, ShelfRow, W, clamp, lerp, rnd } from './props.tsx';
import { idlePose, runPose, walkPose } from '../zombie-break/common.tsx';
import { Aisle, AisleSign } from './scenesA.tsx';
import { S } from './state.ts';

const T = (p: Record<string, unknown>) => p;
const font = { fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 } as const;

/* ---- 11: shutter days per year */
export const Sc11: React.FC = () => {
  const cols = 20, rows = 19;
  return (
    <g>
      <CardBg />
      <text x={360} y={210} textAnchor="middle" {...font} fontSize={42} fill={INK} letterSpacing={3}>ROLLER SHUTTER:</text>
      <text x={360} y={262} textAnchor="middle" {...font} fontSize={42} fill={INK} letterSpacing={3}>DAYS DOWN PER YEAR</text>
      {Array.from({ length: 365 }, (_, i) => {
        const cx = 60 + (i % cols) * 31, cy = 320 + Math.floor(i / cols) * 27;
        const vis = clamp(S.c11_grid * 365 * 1.0 - i);
        const last = i === 0;
        return <rect key={i} x={cx} y={cy} width={24} height={24} fill={last && S.c11_red > 0 ? '#d9462a' : '#f4f8f1'} stroke={last && S.c11_red > 0 ? INK : '#7f8f7a'} strokeWidth={last && S.c11_red > 0 ? 3 : 1.6} opacity={vis} transform={last && S.c11_red > 0 ? `translate(${cx + 12} ${cy + 12}) scale(${1 + S.c11_red * 0.5}) translate(${-cx - 12} ${-cy - 12})` : undefined} />;
      })}
      <g opacity={clamp(S.c11_label)} transform={`translate(0 ${lerp(20, 0, clamp(S.c11_label))})`}>
        <text x={360} y={905} textAnchor="middle" {...font} fontSize={54} fill="#d9462a" letterSpacing={3}>NEW YEAR'S DAY</text>
        <text x={360} y={942} textAnchor="middle" {...font} fontSize={28} fill="#6f7f6a">1 day a year</text>
      </g>
    </g>
  );
};

/* ---- 12: lowering it by hand, with an audience */
export const Sc12: React.FC = () => (
  <g>
    <rect width={W} height={H} fill={PAL.wall} />
    <Doors x={60} y={380} w={600} h={560} open={0} sensorOn={false}>
      <NightLot y0={380} h={560} />
      {Array.from({ length: 9 }, (_, i) => (
        <Doodle key={i} x={110 + i * 62 + Math.sin(S.c12_sway + i) * 4} y={820 + (i % 3) * 14} s={0.62 + (i % 3) * 0.04} kind="dead" pose={{ ...idlePose(Math.sin(S.c12_sway * 1.3 + i) * 2), lU: 62, lF: 80, rU: 70, rF: 88, head: 8 }} look={3} opacity={clamp(S.c12_crowd * 9 - i)} flip={i % 2 === 0} />
      ))}
    </Doors>
    <rect x={20} y={260} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} />
    {Array.from({ length: Math.floor(lerp(1, 7, S.c12_drop)) }, (_, i) => <rect key={i} x={40} y={370 + i * 14} width={640} height={14} fill="#7b8693" stroke={INK} strokeWidth={2} />)}
    <g transform="translate(150 720)">
      <circle r={62} fill="none" stroke={INK} strokeWidth={8} />
      <g transform={`rotate(${S.c12_crank})`}>
        {[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={0} y1={0} x2={0} y2={-62} stroke={INK} strokeWidth={6} transform={`rotate(${a})`} />)}
        <circle cx={0} cy={-62} r={11} fill="#d9a441" stroke={INK} strokeWidth={4} />
      </g>
    </g>
    <Doodle x={300} y={1070} s={1.8} kind="hero" flip pose={{ ...idlePose(), lean: 14, lU: 50 + Math.sin(S.c12_crank * Math.PI / 180) * 40, lF: 70 + Math.cos(S.c12_crank * Math.PI / 180) * 40, rU: 55, rF: 80 }} mouth="o" />
    <Floor y={1010} />
    <Doodle x={300} y={1070} s={1.8} kind="hero" flip pose={{ ...idlePose(), lean: 14, lU: 50 + Math.sin(S.c12_crank * Math.PI / 180) * 40, lF: 70 + Math.cos(S.c12_crank * Math.PI / 180) * 40, rU: 55, rF: 80 }} mouth="o" />
  </g>
);

/* ---- 13: the shutter comes down like a freight train */
export const Sc13: React.FC = () => {
  const d = S.c13_drop;
  const sh = S.c13_shake;
  return (
    <g transform={`translate(${sh} ${sh * 0.5})`}>
      <rect width={W} height={H} fill={PAL.wall} />
      <Doors x={60} y={380} w={600} h={560} open={0} sensorOn={false}><NightLot y0={380} h={560} /></Doors>
      <rect x={20} y={260} width={680} height={110} fill="#4d5560" stroke={INK} strokeWidth={5} />
      <rect x={40} y={370} width={640} height={clamp(d) * 600} fill="#8e99a6" stroke={INK} strokeWidth={4} />
      {Array.from({ length: 44 }, (_, i) => 370 + i * 14 < 370 + clamp(d) * 600 && <line key={i} x1={40} y1={384 + i * 14} x2={680} y2={384 + i * 14} stroke="#5d6772" strokeWidth={3} />)}
      {d > 0.05 && Array.from({ length: 18 }, (_, i) => <circle key={i} cx={60 + rnd(i) * 600} cy={370 + clamp(d) * 600 + 20 + ((S.c13_dust * 120 + rnd(i + 3) * 100) % 160)} r={3 + rnd(i + 9) * 4} fill="#cfc6b0" opacity={0.6 * (1 - clamp(S.c13_dust))} />)}
      <Floor y={980} />
      <g transform={`translate(360 ${lerp(1100, 1040, clamp(S.c13_sign))}) rotate(-3) scale(${clamp(S.c13_sign)})`} opacity={clamp(S.c13_sign * 2)}>
        <rect x={-250} y={-90} width={500} height={180} fill="#e9d8ad" stroke={INK} strokeWidth={5} />
        <rect x={-30} y={-110} width={60} height={34} fill="#e8e0b0" opacity={0.8} />
        <text x={0} y={-30} textAnchor="middle" {...font} fontSize={38} fill={INK}>HOUSE RULE:</text>
        <text x={0} y={42} textAnchor="middle" {...font} fontSize={64} fill="#c93a2e">NOBODY COMES IN</text>
      </g>
    </g>
  );
};

/* ---- 14: you count stock */
export const Sc14: React.FC = () => {
  const x = S.c14_x;
  return (
    <g>
      <rect width={W} height={H} fill="#cbbf9f" />
      {[0, 1, 2, 3].map((i) => <ShelfRow key={i} x={-20} y={190 + i * 200} w={760} h={120} seed={i * 5 + 2} />)}
      {Array.from({ length: 10 }, (_, i) => <g key={i} opacity={clamp(S.c14_tick * 10 - i)}><path d={`M ${60 + i * 62} ${640 - (i % 2) * 190} l 12 14 l 26 -30`} fill="none" stroke="#2f9b4f" strokeWidth={7} strokeLinecap="round" /></g>)}
      <Floor y={940} />
      <Doodle x={x} y={1060} s={2} kind="hero" pose={{ ...walkPose(S.c14_walk, 8), lU: 70, lF: 100, rU: 15, rF: 40 }} hold={<g transform="rotate(-10)"><rect x={-4} y={-34} width={40} height={52} fill="#e7d9b5" stroke={INK} strokeWidth={3} /><line x1={2} y1={-20} x2={28} y2={-20} stroke={INK} strokeWidth={2} /><line x1={2} y1={-10} x2={28} y2={-10} stroke={INK} strokeWidth={2} /><line x1={2} y1={0} x2={20} y2={0} stroke={INK} strokeWidth={2} /></g>} />
    </g>
  );
};

/* ---- 15: AISLE 7 card */
export const Sc15: React.FC = () => (
  <g>
    <CardBg />
    <text x={360} y={190} textAnchor="middle" {...font} fontSize={78} fill={INK} letterSpacing={6} opacity={clamp(S.c15_title)}>AISLE 5</text>
    <text x={360} y={270} textAnchor="middle" {...font} fontSize={34} fill="#6f7f6a" opacity={clamp(S.c15_title)}>TINS</text>
    {Array.from({ length: 20 }, (_, i) => {
      const cx = 125 + (i % 5) * 118, cy = 390 + Math.floor(i / 5) * 112;
      const k = clamp(S.c15_cans * 20 - i);
      return <g key={i} opacity={k} transform={`translate(${cx} ${cy + (1 - k) * -40})`}><Can x={0} y={0} c="#b84a3a" s={1.9} /></g>;
    })}
    <text x={360} y={850} textAnchor="middle" {...font} fontSize={130} fill={INK}>{Math.round(S.c15_num).toLocaleString('en-US')}</text>
    <g opacity={clamp(S.c15_years)} transform={`translate(0 ${lerp(24, 0, clamp(S.c15_years))})`}>
      <text x={360} y={915} textAnchor="middle" {...font} fontSize={44} fill="#6f7f6a">5 a day = 4 years</text>
    </g>
  </g>
);

/* ---- 16: enough food to last a lifetime */
export const Sc16: React.FC = () => (
  <g>
    <Aisle pushed={S.c16_push} />
    <AisleSign x={360} y={190} n="5" s={1.1} />
    <Doodle x={lerp(360, 360, 0)} y={lerp(900, 640, clamp(S.c16_walk))} s={lerp(1.5, 0.6, clamp(S.c16_walk))} kind="hero" pose={walkPose(S.c16_phase, 6)} flip={false} />
  </g>
);

/* ---- 17: day thirty, food is not the problem */
export const Sc17: React.FC = () => (
  <g>
    <rect width={W} height={H} fill="#c9bb98" />
    {[0, 1, 2].map((i) => <ShelfRow key={i} x={-20} y={150 + i * 260} w={760} h={160} seed={i * 4 + 1} />)}
    <rect width={W} height={H} fill="#cfc09f" opacity={0.55} />
    <Doodle x={360 + S.c17_slide} y={960} s={5.2} kind="hero" pose={{ ...idlePose(Math.sin(S.c17_breath) * 1.2), head: 0 }} look={S.c17_look} mouth="line" />
    <g transform={`translate(360 230) rotate(-5) scale(${lerp(2.2, 1, clamp(S.c17_stamp))})`} opacity={clamp(S.c17_stamp * 2)}>
      <rect x={-170} y={-60} width={340} height={120} rx={10} fill="#f7ecd0" stroke="#c93a2e" strokeWidth={8} />
      <text x={0} y={30} textAnchor="middle" {...font} fontSize={96} fill="#c93a2e" letterSpacing={4}>DAY 28</text>
    </g>
  </g>
);

/* ---- 18: the power dies */
export const Sc18: React.FC = () => {
  const dark = S.c18_dark;
  return (
    <g>
      <Aisle lightsOn={dark < 0.4 ? 1 : 0} />
      <g transform="translate(130 760)">
        <rect x={-110} y={-200} width={220} height={330} rx={10} fill="#bcd8e8" stroke={INK} strokeWidth={5} opacity={lerp(0.95, 0.25, clamp(dark * 2))} />
        {Array.from({ length: 4 }, (_, i) => <rect key={i} x={-90 + (i % 2) * 100} y={-170 + Math.floor(i / 2) * 150} width={80} height={110} fill={PROD_C[i]} stroke={INK} strokeWidth={3} opacity={lerp(1, 0.4, dark)} />)}
        {Array.from({ length: 3 }, (_, i) => <path key={i} d={`M ${-140 - i * 22} ${-110 + i * 6} q -12 -30 0 -60`} fill="none" stroke={INK} strokeWidth={4} opacity={clamp(1 - S.c18_hum * 2) * (1 - i * 0.25)} />)}
      </g>
      <rect width={W} height={H} fill="#0e0a1c" opacity={dark * 0.88} />
      <g transform="translate(360 150)" opacity={clamp(S.c18_clock)}>
        <rect x={-120} y={-46} width={240} height={92} rx={12} fill="#142a2a" stroke={INK} strokeWidth={4} opacity={1 - dark * 0.5} />
        <text x={0} y={24} textAnchor="middle" {...font} fontSize={66} fill="#7dffb0" letterSpacing={4} opacity={1 - clamp(dark * 3)}>5:23</text>
      </g>
    </g>
  );
};
const PROD_C = ['#6aa8d8', '#e5543a', '#8dc27a', '#d9a441'];

/* ---- 19: something goes clunk at the back */
export const Sc19: React.FC = () => {
  const z = 1 + S.c19_zoom * 0.9;
  return (
    <g>
      <g transform={`translate(360 560) scale(${z}) translate(-360 -560) translate(${S.c19_clunk} 0)`}>
        <rect width={W} height={H} fill="#bfb494" />
        <rect y={1000} width={W} height={280} fill="#a99b78" />
        <line x1={0} y1={1000} x2={W} y2={1000} stroke={INK} strokeWidth={4} />
        <rect x={200} y={260} width={320} height={740} fill="#7a8794" stroke={INK} strokeWidth={6} />
        <rect x={214} y={274} width={292} height={712} fill="#8b97a3" stroke={INK} strokeWidth={3} />
        <polygon points={`${360 - S.c19_ajar * 70},${274} ${506 - S.c19_ajar * 70},${274} ${506 - S.c19_ajar * 70},${986} ${360 - S.c19_ajar * 70},${986}`} fill="#8b97a3" opacity={0} />
        <rect x={500} y={560} width={26} height={110} fill="#d8d2c0" stroke={INK} strokeWidth={4} />
        <rect x={278} y={150} width={164} height={64} rx={8} fill="#2f9b4f" stroke={INK} strokeWidth={5} />
        <text x={360} y={198} textAnchor="middle" {...font} fontSize={44} fill="#e8fff0" letterSpacing={4}>EXIT</text>
        {S.c19_ajar > 0 && <rect x={514 - S.c19_ajar * 6} y={274} width={S.c19_ajar * 22} height={712} fill="#fff6d0" opacity={0.9} />}
        <g transform="translate(360 420)">
          <rect x={-130} y={-34} width={260} height={64} rx={6} fill="#3a3f48" stroke={INK} strokeWidth={4} />
          <text x={-22} y={9} textAnchor="middle" {...font} fontSize={23} fill="#dfe3e8" letterSpacing={1}>ELECTRO-LOCK</text>
          <circle cx={100} cy={0} r={11} fill={S.c19_led > 0.5 ? '#3fe068' : '#2a3a2f'} stroke={INK} strokeWidth={3} />
          {S.c19_led > 0.5 && <circle cx={100} cy={0} r={26} fill="#3fe068" opacity={0.3} />}
          <rect x={-130} y={34} width={260} height={22} fill="#e7e2d0" stroke={INK} strokeWidth={3} />
        </g>
      </g>
    </g>
  );
};

/* ---- 20: you run the whole length of the store */
export const Sc20: React.FC = () => {
  const s = S.c20_scroll;
  return (
    <g>
      <rect width={W} height={H} fill="#bfb494" />
      {[0, 1].map((r) => (
        <g key={r}>
          {Array.from({ length: 4 }, (_, i) => {
            const x = (((i * 300 - s * 900) % 1200) + 1200) % 1200 - 300;
            return <ShelfRow key={i} x={x} y={200 + r * 300} w={280} h={150} seed={i * 3 + r * 7} />;
          })}
        </g>
      ))}
      <Floor y={940} />
      {Array.from({ length: 6 }, (_, i) => {
        const x = (((i * 260 - s * 1800) % 1560) + 1560) % 1560 - 200;
        return <rect key={i} x={x} y={200} width={180} height={18} fill="#fffbe6" stroke={INK} strokeWidth={3} />;
      })}
      <Doodle x={300} y={1040 - Math.abs(Math.sin(S.c20_run)) * 14} s={2.2} kind="hero" pose={runPose(S.c20_run, 20, 54)} mouth="o" />
      <rect width={W} height={H} fill="#0e0a1c" opacity={S.c20_fade} />
    </g>
  );
};

void T; void Doors; void idlePose;

