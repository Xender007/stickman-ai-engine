import React from 'react';
import { C, Figure, Glow, H, Vignette, W, deadPose, idlePose, lerp, rnd, runPose, walkPose, Pose } from '../../zombie-break/common.tsx';
import { StairWorld, stairPos, stairPose } from '../../zombie-break/stairs.tsx';
import { FLOOR, Room } from '../../zombie-break/rooms.tsx';
import { S } from './state.ts';

/* ------------------------------------------------------------------ CLIP 2 */
export const Clip2: React.FC<{ f: number }> = ({ f }) => {
  const s = S.c2_s;
  const sp = stairPos(s);
  const sc = 1.15;
  const torn = f >= 90;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.4);
  const cam = stairPos(Math.min(s, 1.72)).y - 76 - 640 + S.c2_camx;
  let pose: Pose;
  let hipDy = 0;
  const paused = f >= 168 && f < 216;
  if (!paused) {
    pose = stairPose(S.c2_run, f > 72 && f < 168 ? 14 : 22);
    if (f >= 80 && f < 92) { pose = { ...pose, lean: -10, lU: -70, lF: -40 }; hipDy = (f % 2) * 3; }
    if (f >= 100 && f < 168) pose = { ...pose, lean: 18 + Math.sin(f * 0.7) * 2 };
    hipDy += Math.abs(Math.sin(S.c2_run)) * -5;
  } else {
    const breath = Math.sin((f - 168) * 0.5) * 1.5;
    const look = S.c2_look, shrug = S.c2_shrug;
    pose = { ...idlePose(breath), lU: lerp(4, 70, look), lF: lerp(8, 135, look), head: look * 22, rU: -4 + shrug * 20, lean: 4 + look * 6 };
    hipDy = -shrug * 5;
  }
  const g = S.c2_glass;
  return (
    <g>
      <StairWorld camY={cam} f={f} pulse={pulse} shatter extra={
        <>
          <Figure x={sp.x} y={sp.y - 76 + hipDy} s={sc} flip={sp.flip} pose={pose} torn={torn} scratch={torn} opacity={S.c2_fade} />
          {g > 0 && g < 0.76 && Array.from({ length: 8 }, (_, i) => {
            const t = g / 0.76;
            return <rect key={i} x={sp.x + (i - 4) * 14 * (1 + t * 3)} y={sp.y - 140 + t * (60 + i * 20)} width={5} height={3} fill="#9fd4ff" opacity={1 - t} transform={`rotate(${t * 400 + i * 40} ${sp.x} ${sp.y})`} />;
          })}
        </>
      } />
      {g > 0 && g < 1 && Array.from({ length: 9 }, (_, i) => {
        const t = g;
        const x = rnd(i) * W + (rnd(i + 20) - 0.5) * 380 * t, y = -80 + t * (H * 0.9) * (0.6 + rnd(i + 9) * 0.7);
        const r = 26 + rnd(i + 5) * 46;
        return (
          <polygon key={i} points={`0,${-r} ${r * 0.55},${r * 0.2} ${-r * 0.2},${r * 0.7}`} fill="#bfe6ff" opacity={0.55 * (1 - t * 0.4)}
            stroke="#fff" strokeWidth={2} transform={`translate(${x} ${y}) rotate(${t * 520 * (rnd(i) > 0.5 ? 1 : -1) + i * 30})`} />
        );
      })}
      <Vignette />
    </g>
  );
};

/* ------------------------------------------------------------------ CLIP 3 */
const Section: React.FC<{ f: number; camY: number; heads: number }> = ({ f, camY, heads }) => {
  const FH = 170;
  return (
    <g transform={`translate(0 ${-camY})`}>
      <rect x={0} y={-400} width={W} height={FH * 10 + 900} fill="#070b16" />
      {Array.from({ length: 10 }, (_, i) => {
        const floor = 10 - i;
        const y = i * FH;
        const dead = floor <= 9;
        return (
          <g key={i}>
            <rect x={70} y={y} width={W - 140} height={FH} fill={dead ? '#0f2a22' : '#16223f'} stroke="#34456c" strokeWidth={4} />
            {dead && <Glow x={W / 2} y={y + FH * 0.6} r={380} color={C.green} o={0.35} id={`fl${i}`} />}
            {dead && Array.from({ length: 4 + (i % 3) }, (_, k) => {
              const x = 130 + ((k * 97 + i * 53) % 470);
              return <Figure key={k} x={x} y={y + FH - 62 * 0.8} s={0.8} kind="dead" flip={(k + i) % 2 === 0}
                pose={{ ...deadPose(f / 24 + i * 0.37, (k + i * 5) / 11), head: lerp(12 + Math.sin(f / 5 + k) * 14, -38, heads) }} />;
            })}
            {!dead && <Figure x={560} y={y + FH - 62 * 0.8} s={0.8} pose={idlePose()} flip />}
          </g>
        );
      })}
      <rect x={60} y={FH * 10} width={W - 120} height={30} fill="#26324f" />
    </g>
  );
};

export const Clip3: React.FC<{ f: number }> = ({ f }) => {
  const sc = 1.5;
  const hipY = FLOOR - 68 * sc;
  if (f < 46) {
    const open = S.c3_open;
    const enter = f >= 26;
    return (
      <g transform={`translate(${S.c3_slamA} 0)`}>
        <rect width={W} height={H} fill="#121a30" />
        <rect y={FLOOR} width={W} height={H - FLOOR} fill="#0b1122" />
        <Glow x={120} y={500} r={480} color={C.red} o={0.25 + 0.2 * Math.sin(f * 0.4)} id="c3r" />
        <rect x={540} y={560} width={140} height={FLOOR - 560} fill="#0a0d16" />
        {!enter && <Figure x={S.c3_x} y={hipY + Math.abs(Math.sin(S.c3_run)) * -8} s={sc} pose={runPose(S.c3_run, 18)} torn scratch />}
        {enter && f < 34 && <Figure x={S.c3_enterX} y={hipY} s={sc} pose={runPose(S.c3_run, 18)} torn scratch opacity={S.c3_enterO} />}
        <polygon points={`548,560 ${548 + (1 - open * 0.8) * 128},${560 + open * 40} ${548 + (1 - open * 0.8) * 128},${FLOOR - open * 40} 548,${FLOOR}`} fill="#2e2a2c" stroke="#59495a" strokeWidth={4} />
        <Vignette />
      </g>
    );
  }
  if (f < 168) {
    const l = f - 46;
    const chain = S.c3_chain, slide = S.c3_slide, wedge = S.c3_wedge;
    let x = 470, pose: Pose = idlePose();
    if (l < 44) {
      x = 480;
      pose = { ...idlePose(), lU: lerp(10, 75, chain), lF: lerp(20, 95, chain), lean: 6 };
    } else if (l < 74) {
      x = lerp(250, 470, slide);
      pose = { ...walkPose(S.c3_walk, 8), lU: 30, lF: 60, rU: 30, rF: 60 };
    } else if (l < 94) {
      pose = { ...idlePose(), lean: 16, lU: 50, lF: 95, rU: 55, rF: 95 };
    } else {
      x = S.c3_back;
      pose = idlePose(Math.sin(l * 0.9) * 3 + 3);
    }
    const chairX = lerp(lerp(220, 520, slide), 516, wedge);
    return (
      <Room f={f} chain={chain} knockShake={S.c3_slamB} tint="#141c36"
        chair={{ x: chairX, y: FLOOR, rot: lerp(0, -28, wedge) }}
        extra={
          <>
            <Figure x={x} y={hipY + (l > 100 ? Math.sin(l * 0.9) * 2 : 0)} s={sc} pose={pose} torn scratch />
            <Vignette />
          </>
        } />
    );
  }
  if (f < 186) {
    return (
      <g transform={`translate(${S.c3_shakeC} 0)`}>
        <rect width={W} height={H} fill="#16203a" />
        <rect y={FLOOR} width={W} height={H - FLOOR} fill="#0b1122" />
        <rect x={190} y={480} width={340} height={FLOOR - 480} fill="#3a4968" stroke="#6579a8" strokeWidth={5} />
        <rect x={180} y={FLOOR - 50} width={360} height={50} fill="#1c243a" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={170 + i * 55} y={FLOOR - 70 - (i % 3) * 22} width={90} height={14} fill="#6b4f33" transform={`rotate(${-35 + i * 11} ${215 + i * 55} ${FLOOR - 60})`} />
        ))}
        <rect x={230} y={620} width={260} height={22} fill="#4b3a28" transform="rotate(-20 360 630)" />
        <rect x={250} y={700} width={240} height={22} fill="#5d4730" transform="rotate(18 370 710)" />
        <Glow x={360} y={440} r={420} color={C.red} o={0.3 + 0.25 * Math.sin(f * 0.4)} id="c3f" />
        <Vignette />
      </g>
    );
  }
  return (
    <g>
      <Section f={f} camY={S.c3_camY} heads={S.c3_heads} />
      <Vignette o={0.55} />
    </g>
  );
};
