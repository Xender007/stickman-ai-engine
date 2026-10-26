import React from 'react';
import { C, Figure, Glow, H, W, clamp, lerp, rnd, Pose } from './common.tsx';

/** Switchback stairwell in side cross-section. World y grows downwards; ground = 1000; each flight rises 220. */
export const GROUND = 1000;
export const RISE = 220;
export const XL = 130;
export const XR = 520;

/** s = flights climbed (continuous). Returns the walking surface point and the facing. */
export const stairPos = (s: number) => {
  const i = Math.max(0, Math.floor(s));
  const fr = s - i;
  const even = i % 2 === 0;
  return { x: even ? lerp(XL, XR, fr) : lerp(XR, XL, fr), y: GROUND - RISE * s, flip: !even, flight: i };
};

export const StairWorld: React.FC<{
  camY: number; f: number; pulse: number; doorOpen?: number; shatter?: boolean; extra?: React.ReactNode; hue?: 'red' | 'green';
}> = ({ camY, f, pulse, doorOpen = 0, shatter, extra, hue = 'red' }) => {
  const first = Math.max(0, Math.floor((GROUND - camY - H) / RISE) - 1);
  const last = first + 8;
  const lamp = hue === 'red' ? C.red : C.green;
  return (
    <g transform={`translate(0 ${-camY})`}>
      {/* back wall */}
      <rect x={0} y={camY - 50} width={W} height={H + 100} fill="#1a2440" />
      {Array.from({ length: 14 }, (_, k) => {
        const y = Math.floor(camY / 160) * 160 + k * 160 - 160;
        return <rect key={k} x={0} y={y} width={W} height={4} fill="#101830" opacity={0.7} />;
      })}
      {/* pipes */}
      <rect x={640} y={camY - 50} width={14} height={H + 100} fill="#10192c" />
      <rect x={668} y={camY - 50} width={8} height={H + 100} fill="#0d1424" />
      <rect x={0} y={camY - 50} width={56} height={H + 100} fill="#0e1527" />
      {/* flights */}
      {Array.from({ length: last - first + 1 }, (_, n) => {
        const i = first + n;
        const even = i % 2 === 0;
        const y0 = GROUND - RISE * i, y1 = y0 - RISE;
        const xa = even ? XL : XR, xb = even ? XR : XL;
        const steps = 13;
        const pts: string[] = [];
        for (let k = 0; k <= steps; k++) {
          const x = lerp(xa, xb, k / steps), y = lerp(y0, y1, k / steps);
          pts.push(`${x},${y}`);
          pts.push(`${lerp(xa, xb, (k + 1) / steps)},${y}`);
        }
        const under = `${xb},${y1 + 34} ${xa},${y0 + 34}`;
        return (
          <g key={i}>
            <polygon points={`${xa},${y0} ${pts.join(' ')} ${under}`} fill="#2b3858" stroke="#445580" strokeWidth={2} />
            <polyline points={pts.join(' ')} fill="none" stroke="#6579a8" strokeWidth={3} />
            {/* rail */}
            <line x1={xa} y1={y0 - 70} x2={xb} y2={y1 - 70} stroke="#0a0f1c" strokeWidth={5} />
            {Array.from({ length: 6 }, (_, k) => (
              <line key={k} x1={lerp(xa, xb, k / 5)} y1={lerp(y0, y1, k / 5)} x2={lerp(xa, xb, k / 5)} y2={lerp(y0, y1, k / 5) - 70} stroke="#0a0f1c" strokeWidth={3} />
            ))}
            {/* landing at top of flight */}
            <rect x={even ? XR : 20} y={y1} width={even ? 180 : XL - 20 + 0} height={30} fill="#2b3858" stroke="#445580" strokeWidth={2} />
            {/* emergency lamp on each landing */}
            <circle cx={even ? 630 : 90} cy={y1 - 190} r={7} fill={lamp} opacity={0.4 + pulse * 0.6} />
            <Glow x={even ? 630 : 90} y={y1 - 190} r={230} color={lamp} o={0.18 + pulse * 0.4} id={`l${i}`} />
            {shatter && i === 1 && (
              <g>
                <rect x={290} y={GROUND - RISE * 1.55 - 230} width={110} height={160} fill="#0b1226" stroke="#6579a8" strokeWidth={4} />
                <polygon points={`290,${GROUND - RISE * 1.55 - 230} 345,${GROUND - RISE * 1.55 - 170} 320,${GROUND - RISE * 1.55 - 130} 290,${GROUND - RISE * 1.55 - 70}`} fill="#8ec9ff" opacity={0.3} />
                <polygon points={`400,${GROUND - RISE * 1.55 - 230} 360,${GROUND - RISE * 1.55 - 190} 385,${GROUND - RISE * 1.55 - 100} 400,${GROUND - RISE * 1.55 - 70}`} fill="#8ec9ff" opacity={0.3} />
              </g>
            )}
          </g>
        );
      })}
      {/* ground floor + stairwell door */}
      <rect x={0} y={GROUND} width={W} height={260} fill="#141c33" />
      <rect x={14} y={GROUND - 190} width={100} height={190} fill="#0a0f1c" stroke="#445580" strokeWidth={3} />
      <g transform={`translate(14 ${GROUND - 190})`}>
        <polygon points={`0,0 ${100 - doorOpen * 78},${doorOpen * 10} ${100 - doorOpen * 78},${190 - doorOpen * 10} 0,190`} fill="#3a4968" stroke="#6579a8" strokeWidth={3} />
      </g>
      {extra}
      <Glow x={W / 2} y={camY + 100} r={500} color={lamp} o={0.05 + pulse * 0.1} id="topg" />
    </g>
  );
};

export const stairPose = (p: number, lean = 22): Pose => {
  const amp = 46;
  const leg = (q: number) => {
    const t = amp * Math.sin(q) + 8;
    return [t, t - 30 - 60 * clamp(Math.cos(q), 0, 1)] as const;
  };
  const [lT, lS] = leg(p), [rT, rS] = leg(p + Math.PI);
  return { lean, lT, lS, rT, rS, lU: -48 * Math.sin(p), lF: -48 * Math.sin(p) + 70, rU: 48 * Math.sin(p), rF: 48 * Math.sin(p) + 70 };
};

export { Figure, rnd };
