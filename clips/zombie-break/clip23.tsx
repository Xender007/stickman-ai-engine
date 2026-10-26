import React from 'react';
import { C, Figure, Glow, H, Motes, Vignette, W, clamp, deadPose, idlePose, lerp, prog, rnd, runPose, smooth, walkPose, Pose } from './common.tsx';
import { StairWorld, stairPos, stairPose } from './stairs.tsx';
import { FLOOR, Room } from './rooms.tsx';

/* ------------------------------------------------------------------ CLIP 2 */
const sOf = (f: number) =>
  f < 72 ? lerp(0.25, 1.4, f / 72)
    : f < 100 ? lerp(1.4, 1.55, smooth((f - 72) / 28))
      : f < 168 ? lerp(1.55, 1.72, smooth((f - 100) / 68))
        : f < 216 ? 1.72
          : 1.72 + (f - 216) * 0.014 * (1 + (f - 216) / 12);

export const Clip2: React.FC<{ f: number }> = ({ f }) => {
  const s = sOf(f);
  const sp = stairPos(s);
  const sc = 1.15;
  const torn = f >= 90;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.4);
  const camS = sOf(Math.min(f, 216));
  const cam = stairPos(camS).y - 76 - 640 + (f > 216 ? (f - 216) * 2.5 : 0);
  let pose: Pose;
  let hipDy = 0;
  if (f < 168 || f >= 216) {
    pose = stairPose(f * 0.7, f > 72 && f < 168 ? 14 : 22);
    if (f >= 80 && f < 92) { pose = { ...pose, lean: -10, lU: -70, lF: -40 }; hipDy = (f % 2) * 3; }
    if (f >= 100 && f < 168) pose = { ...pose, lean: 18 + Math.sin(f * 0.7) * 2 };
    hipDy += Math.abs(Math.sin(f * 0.7)) * -5;
  } else {
    // pause: look at the scratch, shrug
    const breath = Math.sin((f - 168) * 0.5) * 1.5;
    const look = smooth(prog(f, 172, 184)) * (1 - smooth(prog(f, 198, 206)));
    const shrug = Math.sin(clamp((f - 200) / 14) * Math.PI);
    pose = { ...idlePose(breath), lU: lerp(4, 70, look), lF: lerp(8, 135, look), head: look * 22, rU: -4 + shrug * 20, lean: 4 + look * 6 };
    hipDy = -shrug * 5;
  }
  const fade = f > 226 ? 1 - prog(f, 226, 240) : 1;
  return (
    <g>
      <StairWorld camY={cam} f={f} pulse={pulse} shatter extra={
        <>
          <Figure x={sp.x} y={sp.y - 76 + hipDy} s={sc} flip={sp.flip} pose={pose} torn={torn} scratch={torn} opacity={fade} />
          {f >= 86 && f < 130 && Array.from({ length: 8 }, (_, i) => {
            const t = (f - 86) / 44;
            return <rect key={i} x={sp.x + (i - 4) * 14 * (1 + t * 3)} y={sp.y - 140 + t * (60 + i * 20)} width={5} height={3} fill="#9fd4ff" opacity={1 - t} transform={`rotate(${t * 400 + i * 40} ${sp.x} ${sp.y})`} />;
          })}
        </>
      } />
      {/* foreground glass shards crossing the lens */}
      {f >= 82 && f < 140 && Array.from({ length: 9 }, (_, i) => {
        const t = (f - 82) / 58;
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
/** Cross-section of the tower: 10 floors, dead packed on floors 1..9. */
const Section: React.FC<{ f: number; camY: number; headsUp: number }> = ({ f, camY, headsUp }) => {
  const FH = 170;
  return (
    <g transform={`translate(0 ${-camY})`}>
      <rect x={0} y={-400} width={W} height={FH * 10 + 900} fill="#070b16" />
      {Array.from({ length: 10 }, (_, i) => {
        const floor = 10 - i; // floor 10 at top
        const y = i * FH;
        const dead = floor <= 9;
        return (
          <g key={i}>
            <rect x={70} y={y} width={W - 140} height={FH} fill={dead ? '#0f2a22' : '#16223f'} stroke="#34456c" strokeWidth={4} />
            {dead && <Glow x={W / 2} y={y + FH * 0.6} r={380} color={C.green} o={0.35} id={`fl${i}`} />}
            {dead && Array.from({ length: 4 + (i % 3) }, (_, k) => {
              const x = 130 + ((k * 97 + i * 53) % 470);
              return <Figure key={k} x={x} y={y + FH - 62 * 0.8} s={0.8} kind="dead" flip={(k + i) % 2 === 0}
                pose={{ ...deadPose(f / 24 + i * 0.37, (k + i * 5) / 11), head: headsUp ? -38 : 12 + Math.sin(f / 5 + k) * 14 }} />;
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
  // A: landing outside the door (0..46)
  if (f < 46) {
    const x = lerp(60, 520, smooth(f / 28));
    const enter = f >= 26;
    const open = smooth(prog(f, 22, 30)) * (1 - smooth(prog(f, 36, 40)));
    const slam = f >= 40 && f < 48 ? Math.sin((f - 40) * 2.5) * 10 : 0;
    return (
      <g transform={`translate(${slam} 0)`}>
        <rect width={W} height={H} fill="#121a30" />
        <rect y={FLOOR} width={W} height={H - FLOOR} fill="#0b1122" />
        <Glow x={120} y={500} r={480} color={C.red} o={0.25 + 0.2 * Math.sin(f * 0.4)} id="c3r" />
        <rect x={540} y={560} width={140} height={FLOOR - 560} fill="#0a0d16" />
        {!enter && <Figure x={x} y={hipY + Math.abs(Math.sin(f * 0.8)) * -8} s={sc} pose={runPose(f * 0.8, 18)} torn scratch />}
        {enter && f < 34 && <Figure x={lerp(520, 620, smooth(prog(f, 26, 34)))} y={hipY} s={sc} pose={runPose(f * 0.8, 18)} torn scratch opacity={1 - prog(f, 30, 34)} />}
        <polygon points={`548,560 ${548 + (1 - open * 0.8) * 128},${560 + open * 40} ${548 + (1 - open * 0.8) * 128},${FLOOR - open * 40} 548,${FLOOR}`} fill="#2e2a2c" stroke="#59495a" strokeWidth={4} />
        <Vignette />
      </g>
    );
  }
  // B: inside, chain + chair (46..168)
  if (f < 168) {
    const l = f - 46;
    const chain = smooth(prog(l, 8, 34));
    const slideChair = smooth(prog(l, 44, 74));
    const wedge = smooth(prog(l, 74, 92));
    const chairX = lerp(220, 520, slideChair);
    const slam = l < 10 ? Math.exp(-l / 3) * Math.sin(l * 3) * 12 : 0;
    // Xender: at door (chain), then drags chair, then steps back and heaves
    let x = 470, pose: Pose = idlePose(), flip = false;
    if (l < 44) {
      x = 480; flip = false;
      pose = { ...idlePose(), lU: lerp(10, 75, chain), lF: lerp(20, 95, chain), lean: 6 };
    } else if (l < 74) {
      x = lerp(250, 470, slideChair); pose = walkPose(l * 0.5, 8); pose = { ...pose, lU: 30, lF: 60, rU: 30, rF: 60 }; flip = false;
    } else if (l < 94) {
      x = 470; pose = { ...idlePose(), lean: 16, lU: 50, lF: 95, rU: 55, rF: 95 };
    } else {
      x = lerp(470, 380, smooth(prog(l, 94, 108))); pose = idlePose(Math.sin(l * 0.9) * 3 + 3);
    }
    const chairY = FLOOR - wedge * 0;
    const chairRot = lerp(0, -28, wedge);
    return (
      <Room f={f} chain={chain} knockShake={slam} tint="#141c36"
        chair={l >= 40 ? { x: l < 74 ? chairX : lerp(chairX, 516, wedge), y: chairY, rot: chairRot } : { x: 220, y: FLOOR, rot: 0 }}
        extra={
          <>
            <Figure x={x} y={hipY + (l > 100 ? Math.sin(l * 0.9) * 2 : 0)} s={sc} pose={pose} flip={flip} torn scratch />
            <Vignette />
          </>
        } />
    );
  }
  // C: jammed fire door (168..186)
  if (f < 186) {
    const l = f - 168;
    const shake = l < 12 ? Math.sin(l * 3) * 6 * Math.exp(-l / 6) : 0;
    return (
      <g transform={`translate(${shake} 0)`}>
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
  // D: sinking through the section (186..240)
  const l = f - 186;
  const camY = lerp(-200, 600, smooth(l / 54));
  return (
    <g>
      <Section f={f} camY={camY} headsUp={l > 36 ? 1 : 0} />
      <Vignette o={0.55} />
    </g>
  );
};
