import React from 'react';
import { C, Figure, Glow, H, Motes, Vignette, W, idlePose, jointPos, lerp, rnd, walkPose, Pose } from '../../zombie-break/common.tsx';
import { FLOOR, Room } from '../../zombie-break/rooms.tsx';
import { Peephole } from './clip1.tsx';
import { S } from './state.ts';

const SC = 1.5;
const HIP = FLOOR - 68 * SC;
const SEAT_HIP = FLOOR - 37 * SC;

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
};

const Skyline: React.FC<{ sky: string; sun?: number }> = ({ sky, sun }) => (
  <g>
    <rect x={90} y={300} width={340} height={520} fill={sky} stroke="#59495a" strokeWidth={8} />
    {sun !== undefined && <circle cx={260} cy={sun} r={46} fill="#ffcf7a" />}
    {[[100, 560, 60], [150, 500, 50], [200, 600, 70], [270, 520, 50], [320, 470, 60], [380, 580, 50]].map(([x, y, w], i) => (
      <rect key={i} x={x} y={y} width={w} height={820 - y} fill="#06090f" />
    ))}
    <line x1={260} y1={300} x2={260} y2={820} stroke="#59495a" strokeWidth={5} />
    <line x1={90} y1={560} x2={430} y2={560} stroke="#59495a" strokeWidth={4} />
  </g>
);

const Table: React.FC<{ crackers: number; bottle: number; candle: number }> = ({ crackers, bottle, candle }) => (
  <g>
    <rect x={150} y={FLOOR - 190} width={340} height={14} fill="#6b4f33" />
    <rect x={170} y={FLOOR - 176} width={12} height={176} fill="#4b3a28" /><rect x={458} y={FLOOR - 176} width={12} height={176} fill="#4b3a28" />
    {crackers > 0 && <rect x={200} y={FLOOR - 206} width={44} height={16} rx={3} fill="#d9b373" opacity={crackers} />}
    {crackers > 0.5 && <rect x={250} y={FLOOR - 206} width={44} height={16} rx={3} fill="#d9b373" opacity={(crackers - 0.5) * 2} />}
    {bottle > 0 && <g opacity={bottle}>
      <rect x={380} y={FLOOR - 250} width={22} height={60} rx={5} fill="#8cc4ff" opacity={0.7} />
      <rect x={385} y={FLOOR - 262} width={12} height={14} fill="#e8edf5" />
    </g>}
    {candle > 0 && (
      <g>
        <rect x={430} y={FLOOR - 236} width={14} height={46} fill="#e9e3cf" />
        <ellipse cx={437} cy={FLOOR - 252} rx={6 * candle} ry={14 * candle} fill="#ffcf5a" />
        <ellipse cx={437} cy={FLOOR - 250} rx={3 * candle} ry={8 * candle} fill="#fff4c4" />
      </g>
    )}
  </g>
);

/* ------------------------------------------------------------------ CLIP 4 */
export const Clip4: React.FC<{ f: number }> = ({ f }) => {
  const lapse = S.c4_lapse;
  const dark = f < 168 ? 0.25 : S.c4_dark;
  const skyBase = f < 168 ? '#2d3750' : lapse < 0.5 ? mix('#2d3750', '#c2603a', lapse * 2) : mix('#c2603a', '#070a16', (lapse - 0.5) * 2);
  const sunY = f < 168 ? undefined : S.c4_sun;
  let figure: React.ReactNode;
  if (f < 72) {
    const hand = S.c4_hand;
    figure = <Figure x={310} y={HIP} s={SC} flip pose={{ ...idlePose(Math.sin(f * 0.2)), lU: 20 + hand * 70, lF: 20 + hand * 75, lean: 4 }} torn scratch />;
  } else if (f < 168) {
    const sip = S.c4_sip, cap = S.c4_cap;
    figure = <Figure x={S.c4_x} y={HIP} s={SC} flip pose={{ ...idlePose(), lean: 10 + sip * 4, lU: lerp(35, 85, sip) + cap * 10, lF: lerp(60, 150, sip), head: -sip * 14 }} torn scratch />;
  } else {
    const seated = S.c4_seat;
    const strike = S.c4_strike;
    const x = lerp(360, 330, seated);
    const pose: Pose = seated > 0
      ? { ...idlePose(), lT: lerp(3, 88, seated), lS: 3, rT: lerp(-3, 84, seated), rS: -3, lean: 6, lU: 40, lF: 80, rU: 30, rF: 70 }
      : { ...idlePose(), lU: 35 + Math.sin(strike * 5) * 20, lF: 90 + Math.sin(strike * 5) * 20, lean: 8 };
    figure = <Figure x={x} y={lerp(HIP, SEAT_HIP, seated)} s={SC} flip={seated < 0.5} pose={pose} torn scratch />;
  }
  const candleOn = S.c4_candle;
  return (
    <g>
      <Room f={f} tint={mix('#141c36', '#0a0f1e', dark)} candle={false} window={<Skyline sky={skyBase} sun={sunY} />}
        extra={<><Table crackers={S.c4_crackers} bottle={f >= 72 ? 1 : 0} candle={candleOn} />{figure}</>} />
      {f >= 168 && (
        <>
          <rect width={W} height={H} fill="#000" opacity={dark * 0.8} />
          {f >= 196 && f < 208 && <Glow x={330} y={760} r={90} color="#ffe39a" o={0.9} id="match" />}
          {candleOn > 0 && <Glow x={437} y={FLOOR - 250} r={620 * candleOn} color={C.candle} o={0.55 + 0.08 * Math.sin(f * 0.9)} id="cn4" />}
        </>
      )}
      <Vignette />
    </g>
  );
};

/* ------------------------------------------------------------------ CLIP 5 */
export const Clip5: React.FC<{ f: number }> = ({ f }) => {
  const chair = { x: 520, y: FLOOR, rot: -28 };
  const flick = 0.55 + 0.1 * Math.sin(f * 0.9);
  if (f >= 200) {
    return (
      <g>
        <Peephole f={f + 400} shake={0} dust={[]} zoomIn={S.c5_zoomIn} />
        <Vignette />
      </g>
    );
  }
  const dust = [S.c5_dust0, S.c5_dust1, S.c5_dust2];
  const sitting = f < 72;
  let x = 330, pose: Pose = idlePose(), y = HIP;
  if (sitting) {
    pose = { ...idlePose(), lT: 88, lS: 3, rT: 84, rS: -3, lean: 4, lU: 30, lF: 70, rU: 25, rF: 65 };
    y = SEAT_HIP;
  } else if (f < 160) {
    x = S.c5_x;
    pose = { ...walkPose(S.c5_walk, 10), lU: 55, lF: 95, rU: 30, rF: 60 };
    y = HIP + Math.abs(Math.sin(S.c5_walk)) * -4;
  } else {
    x = S.c5_x2;
    pose = { ...idlePose(), lean: S.c5_lean, head: 12, lU: 55, lF: 95 };
  }
  const { hand } = jointPos(x, y, SC, false, pose);
  const ang = f >= 72 ? -2 + Math.sin(f * 1.7) * 3 : 0;
  const camScale = S.c5_cam || 1;
  return (
    <g transform={`translate(${W / 2} 720) scale(${camScale}) translate(${-W / 2 - (camScale - 1) * 80} -720)`}>
      <g transform={`translate(${S.c5_shake} 0)`}>
        <Room f={f} tint="#101830" chain={1} chair={chair} candle
          extra={
            <>
              <Table crackers={1} bottle={1} candle={1} />
              {dust.map((p, ki) => p > 0 && p < 1 && Array.from({ length: 12 }, (_, j) => (
                <circle key={`${ki}${j}`} cx={548 + rnd(ki * 9 + j) * 128} cy={560 + p * 220 * (0.6 + rnd(j) * 0.6)} r={2.5} fill="#d6b99a" opacity={(1 - p) * 0.8} />
              )))}
              <Figure x={x} y={y} s={SC} pose={pose} torn scratch />
              {f >= 72 && (
                <g transform={`rotate(${ang} ${hand[0]} ${hand[1]})`}>
                  <polygon points={`${hand[0]},${hand[1] - 4} ${hand[0] + 360},${hand[1] - 70} ${hand[0] + 360},${hand[1] + 70} ${hand[0]},${hand[1] + 4}`} fill={C.orange} opacity={0.22} />
                  <circle cx={hand[0]} cy={hand[1]} r={7} fill="#fff1c0" />
                </g>
              )}
            </>
          } />
        <Glow x={437} y={FLOOR - 250} r={520} color={C.candle} o={flick + S.c5_spike * 0.5} id="cn5" />
        <Motes f={f} n={16} color="#ffd9a0" o={0.25} seed={9} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ CLIP 6 */
export const Clip6: React.FC<{ f: number }> = ({ f }) => {
  if (f >= 234) return <rect width={W} height={H} fill="#000" />;
  const spot: [number, number] = f < 72 ? [S.c6_sx, S.c6_sy] : f < 168 ? [610, S.c6_sy] : [S.c6_sx, S.c6_sy];
  const spun = S.c6_spun;
  const x = f < 168 ? S.c6_x : lerp(400, 300, spun * 0.5);
  const pose: Pose = f < 168 ? { ...idlePose(), lean: 4, lU: 60, lF: 100 } : { ...idlePose(), lean: 8 + spun * 6, lU: 62, lF: 98 };
  const flip = spun > 0.5;
  const { hand } = jointPos(x, HIP, SC, flip, pose);
  const camOrigin: [number, number] = f < 170 ? [610, 700] : [100, 760];
  const scale = f < 170 ? S.c6_push : S.c6_rush;
  const dim = S.c6_dim;
  return (
    <g>
      <g transform={`translate(${camOrigin[0]} ${camOrigin[1]}) scale(${scale}) translate(${-camOrigin[0]} ${-camOrigin[1]})`}>
        <Room f={f} tint="#0e1428" chain={1} chair={{ x: 520, y: FLOOR, rot: -28 }} chalk={{ count: 14, crossed: 3 }}
          extra={<Figure x={x} y={HIP} s={SC} flip={flip} pose={pose} torn scratch />} />
        <polygon points={`${hand[0]},${hand[1] - 3} ${spot[0]},${spot[1] - 70} ${spot[0]},${spot[1] + 70} ${hand[0]},${hand[1] + 3}`} fill={C.orange} opacity={0.2} />
        <Glow x={spot[0]} y={spot[1]} r={190} color="#ffd596" o={0.55} id="spot6" />
        {f >= 72 && f < 170 && <Motes f={f} n={26} color="#fff" o={0.6} seed={21} />}
        <defs>
          <radialGradient id="hole">
            <stop offset="0" stopColor="#000" /><stop offset="0.55" stopColor="#222" /><stop offset="1" stopColor="#fff" />
          </radialGradient>
          <mask id="dmask">
            <rect x={-800} y={-800} width={W + 1600} height={H + 1600} fill="#fff" />
            <circle cx={spot[0]} cy={spot[1]} r={230} fill="url(#hole)" />
          </mask>
        </defs>
        <rect x={-800} y={-800} width={W + 1600} height={H + 1600} fill="#000" opacity={0.82 + dim * 0.18} mask="url(#dmask)" />
      </g>
      <Vignette o={0.8} />
    </g>
  );
};
