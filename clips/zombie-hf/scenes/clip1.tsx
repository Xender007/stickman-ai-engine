import React from 'react';
import { C, Figure, Glow, H, Motes, W, Vignette, clamp, deadPose, lerp, rnd, runPose } from '../../zombie-break/common.tsx';
import { StairWorld, stairPos, stairPose } from '../../zombie-break/stairs.tsx';
import { S } from './state.ts';

/** Peephole fisheye view of an empty corridor. shake / dust come from GSAP channels. */
export const Peephole: React.FC<{ f: number; shake: number; dust: number[]; zoomIn?: number }> = ({ f, shake, dust, zoomIn = 0 }) => {
  const cx = W / 2, cy = 640, R = 330;
  const flick = 0.55 + 0.35 * Math.sin(f * 0.5) + (rnd(Math.floor(f / 2) + 3) - 0.5) * 0.35;
  const rings = Array.from({ length: 11 }, (_, i) => Math.pow(0.68, i));
  const zoom = 1 + zoomIn * 0.25;
  return (
    <g transform={`translate(${shake} ${shake * 0.4})`}>
      <rect width={W} height={H} fill="#1c120f" />
      {Array.from({ length: 20 }, (_, i) => <line key={i} x1={0} x2={W} y1={i * 70} y2={i * 70 + 12} stroke="#120a08" strokeWidth={3} opacity={0.6} />)}
      <circle cx={cx} cy={cy} r={R + 26} fill="#6a5a3c" />
      <circle cx={cx} cy={cy} r={R + 14} fill="#2c2418" />
      <defs><clipPath id="lens"><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
      <g clipPath="url(#lens)">
        <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>
          <rect x={cx - R} y={cy - R} width={2 * R} height={2 * R} fill="#1a0a0c" />
          {rings.map((k, i) => {
            const s = R * 1.25 * k;
            return <rect key={i} x={cx - s} y={cy - s} width={2 * s} height={2 * s} rx={s * 0.55} fill={i % 2 === 0 ? '#3a1218' : '#2a0d13'} stroke="#561a22" strokeWidth={2} />;
          })}
          {[1, 3, 5, 7].map((i) => {
            const a = R * 1.25 * Math.pow(0.68, i), b = R * 1.25 * Math.pow(0.68, i + 1);
            const side = i % 4 === 1 ? -1 : 1;
            const pick = (s: number, k: number) => [cx + side * s * 0.92, cy + s * k] as const;
            return <polygon key={i} points={`${pick(a, -0.25)} ${pick(b, -0.25)} ${pick(b, 0.75)} ${pick(a, 0.75)}`} fill="#160709" stroke="#7a2a30" strokeWidth={2} />;
          })}
          {[2, 4, 6].map((i) => {
            const s = R * 1.25 * Math.pow(0.68, i);
            return <ellipse key={i} cx={cx} cy={cy - s * 0.88} rx={s * 0.22} ry={s * 0.06} fill={C.red} opacity={flick * 0.9} />;
          })}
          <Glow x={cx} y={cy - 140} r={360} color={C.red} o={0.55 * flick} id="pp" />
          <Glow x={cx} y={cy} r={90} color="#000" o={0.9} id="ppv" />
        </g>
        <defs>
          <radialGradient id="lensv" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.85} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="url(#lensv)" />
        <ellipse cx={cx - 120} cy={cy - 190} rx={60} ry={24} fill="#fff" opacity={0.07} transform={`rotate(-35 ${cx - 120} ${cy - 190})`} />
      </g>
      {dust.map((p, ki) => p > 0 && p < 1 && Array.from({ length: 14 }, (_, j) => {
        const x = cx + (rnd(ki * 50 + j) - 0.5) * 2 * (R + 60);
        const y0 = cy - Math.sqrt(Math.max(0, (R + 40) ** 2 - (x - cx) ** 2)) * (rnd(j + ki) > 0.5 ? 1 : -1);
        return <circle key={`${ki}-${j}`} cx={x} cy={y0 + (p * 120 - Math.sin(p * Math.PI) * 30 * rnd(j))} r={2 + rnd(j + 4) * 3} fill="#c9a98c" opacity={(1 - p) * 0.7} />;
      }))}
    </g>
  );
};

const TOWER_X = 130, TOWER_W = 460, TOWER_TOP = 260, STREET = 3000;

const Tower: React.FC<{ camY: number; f: number; crowd: number }> = ({ camY, f, crowd }) => {
  const sweep = (f * 5.5) % (W * 2);
  const phase = Math.floor(f / 4) % 2;
  return (
    <g transform={`translate(0 ${-camY})`}>
      <defs>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3560" /><stop offset="0.12" stopColor="#c0603c" /><stop offset="0.28" stopColor="#3a2f58" /><stop offset="1" stopColor="#0a1124" />
        </linearGradient>
        <linearGradient id="siren" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff2230" stopOpacity={0} /><stop offset="0.5" stopColor={phase ? '#3f7bff' : '#ff2230'} stopOpacity={0.55} /><stop offset="1" stopColor="#ff2230" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={-200} width={W} height={STREET + 600} fill="url(#dusk)" />
      {[0, 1, 2, 3].map((i) => {
        const x = [-30, 60, 590, 640][i], w = [140, 90, 120, 110][i], top = [700, 1100, 500, 1500][i];
        return (
          <g key={i}>
            <rect x={x} y={top} width={w} height={STREET - top} fill="#0b1226" />
            {Array.from({ length: Math.floor((STREET - top) / 110) }, (_, r) => (
              <rect key={r} x={x + 14 + (r % 2) * 30} y={top + 30 + r * 110} width={16} height={22} fill={rnd(i * 99 + r) > 0.7 ? '#ffb85a' : '#101a34'} opacity={0.8} />
            ))}
          </g>
        );
      })}
      <rect x={TOWER_X} y={TOWER_TOP} width={TOWER_W} height={STREET - TOWER_TOP} fill="#0d1428" stroke="#1e2a48" strokeWidth={4} />
      <rect x={TOWER_X + TOWER_W - 40} y={TOWER_TOP} width={40} height={STREET - TOWER_TOP} fill="#090e1c" />
      <rect x={TOWER_X + 160} y={TOWER_TOP - 70} width={140} height={70} fill="#0d1428" />
      <rect x={TOWER_X + 225} y={TOWER_TOP - 150} width={6} height={80} fill="#0d1428" />
      {Array.from({ length: 26 }, (_, r) => Array.from({ length: 5 }, (_, c) => {
        const x = TOWER_X + 30 + c * 80, y = TOWER_TOP + 50 + r * 104;
        const lit = rnd(r * 13 + c * 7) > 0.62;
        return (
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width={46} height={64} fill={lit ? '#ffc56a' : '#121c38'} opacity={lit ? 0.85 : 1} stroke="#1e2a48" strokeWidth={2} />
            {lit && <rect x={x} y={y + 30} width={46} height={34} fill="#d9892a" opacity={0.5} />}
          </g>
        );
      }))}
      {Array.from({ length: 26 }, (_, r) => <rect key={r} x={TOWER_X} y={TOWER_TOP + 24 + r * 104} width={TOWER_W} height={5} fill="#070b16" />)}
      <rect x={sweep - W} y={TOWER_TOP} width={W} height={STREET - TOWER_TOP} fill="url(#siren)" />
      <rect x={0} y={STREET} width={W} height={500} fill="#10172c" />
      <rect x={0} y={STREET + 30} width={W} height={6} fill="#26324f" />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i ? 540 : 120} ${STREET + 150})`}>
          <rect x={-60} y={-34} width={120} height={46} rx={10} fill="#1d2744" />
          <rect x={-30} y={-52} width={60} height={22} rx={6} fill="#1d2744" />
          <circle cx={-18} cy={-56} r={9} fill={(Math.floor(f / 3) + i) % 2 ? '#ff2230' : '#3f7bff'} />
          <circle cx={18} cy={-56} r={9} fill={(Math.floor(f / 3) + i) % 2 ? '#3f7bff' : '#ff2230'} />
          <Glow x={0} y={-50} r={230} color={(Math.floor(f / 3) + i) % 2 ? '#ff2230' : '#3f7bff'} o={0.45} id={`sv${i}`} />
        </g>
      ))}
      {Array.from({ length: 13 }, (_, i) => {
        const dead = i % 3 === 0;
        const t = crowd / 24;
        const baseX = rnd(i * 17) * 640 + 40;
        if (dead) {
          const x = baseX + Math.sin(t * 1.2 + i) * 20 + clamp(crowd / 120) * (rnd(i) - 0.5) * 120;
          return <Figure key={i} x={x} y={STREET + 150 + (i % 4) * 36} s={0.55} kind="dead" pose={deadPose(t, i / 13)} flip={i % 2 === 0} />;
        }
        const dir = rnd(i * 5) > 0.5 ? 1 : -1;
        const x = ((baseX + dir * crowd * (3 + rnd(i) * 3)) % 840 + 840) % 840 - 60;
        return <Figure key={i} x={x} y={STREET + 140 + (i % 4) * 36} s={0.5} pose={runPose(crowd * 0.6 + i, 16)} flip={dir < 0} />;
      })}
      <Glow x={W / 2} y={STREET + 120} r={420} color="#2fff8a" o={0.12} id="sg" />
    </g>
  );
};

export const Clip1: React.FC<{ f: number }> = ({ f }) => {
  if (f < 72) {
    return (
      <g>
        <Peephole f={f} shake={S.c1_shake} dust={[S.c1_dust0, S.c1_dust1, S.c1_dust2]} />
        <Vignette />
      </g>
    );
  }
  if (f < 168) {
    const l = f - 72;
    return (
      <g transform={`translate(${Math.sin(l * 1.7) * 2} 0)`}>
        <Tower camY={S.c1_camY} f={l} crowd={S.c1_crowd} />
        <Vignette o={0.55} />
      </g>
    );
  }
  const l = f - 168;
  const sp = stairPos(S.c1_s);
  const hipY = sp.y - 76;
  const startX = lerp(70, sp.x, S.c1_entry);
  const cam = lerp(292, hipY - 640, S.c1_cam);
  const pulse = 0.5 + 0.5 * Math.sin(l * 0.4);
  const hipOffset = Math.abs(Math.sin(S.c1_run)) * -5;
  return (
    <g>
      <g transform={`rotate(${S.c1_tilt} ${W / 2} 640)`}>
        <StairWorld camY={cam} f={l} pulse={pulse} doorOpen={S.c1_door}
          extra={<Figure x={S.c1_entry < 1 ? startX : sp.x} y={hipY + hipOffset} s={1.15} flip={sp.flip} pose={stairPose(S.c1_run)} />} />
      </g>
      <Motes f={l} n={14} color="#ff8a8a" o={0.3} seed={4} />
      <Vignette />
    </g>
  );
};
