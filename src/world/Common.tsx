import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {GROUND_Y, H, W} from '../config';
import type {Palette} from './palettes';

export type Lights = {flickerStart: number; lightsOut: number};

/** 1 = on, 0 = off. Flickers between flickerStart and lightsOut, with whole-grid dropouts. */
export const lightLevel = (t: number, seed: string, l: Lights | null): number => {
  if (!l || t < l.flickerStart) return 1;
  if (t >= l.lightsOut) return 0;
  const k = (t - l.flickerStart) / (l.lightsOut - l.flickerStart);
  const gridDrop = noise2D('grid', t * 7, 0) < -0.3;
  return !gridDrop && noise2D(seed, t * 9, 0) > -0.7 + 1.5 * k ? 1 : 0;
};

export const Defs: React.FC<{pal: Palette}> = ({pal}) => (
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={pal.skyTop} />
      <stop offset="1" stopColor={pal.skyBottom} />
    </linearGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3b8a92" />
      <stop offset="1" stopColor="#0f2a33" />
    </linearGradient>
    <radialGradient id="lampGlow">
      <stop offset="0" stopColor="#ffd38a" stopOpacity={0.75} />
      <stop offset="1" stopColor="#ffd38a" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.6} />
    </radialGradient>
    <filter id="glowWide" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={10} /></filter>
    <filter id="glowTight" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={2.5} /></filter>
    <filter id="smokeBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={16} /></filter>
    <filter id="dustBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={9} /></filter>
    <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={4} /></filter>
  </defs>
);

export const Sky: React.FC<{pal: Palette; t: number; horizonY?: number}> = ({pal, t, horizonY = GROUND_Y}) => (
  <>
    <rect x={-200} y={-200} width={W + 400} height={horizonY + 210} fill="url(#sky)" />
    <ellipse cx={W / 2} cy={horizonY - 150} rx={900} ry={520} fill={pal.glow} opacity={pal.glowStrength} filter="url(#smokeBlur)" />
    {pal.stars
      ? Array.from({length: 45}, (_, i) => (
          <circle key={i} cx={random(`st${i}x`) * W} cy={60 + random(`st${i}y`) * 900} r={1.2 + random(`st${i}r`) * 1.6}
            fill="#ffffff" opacity={0.25 + 0.35 * Math.abs(noise2D(`st${i}`, t * 0.6, 0))} />
        ))
      : null}
  </>
);

export const Ground: React.FC<{camX: number; pal: Palette; lanes?: boolean}> = ({camX, pal, lanes = true}) => {
  const step = 240;
  const shift = ((camX % step) + step) % step;
  return (
    <>
      <rect x={-200} y={GROUND_Y} width={W + 400} height={H - GROUND_Y + 200} fill={pal.ground} />
      <rect x={-200} y={GROUND_Y} width={W + 400} height={6} fill={pal.curb} />
      {lanes
        ? Array.from({length: 8}, (_, i) => (
            <rect key={i} x={i * step - shift - 200} y={GROUND_Y + 170} width={120} height={8} fill={pal.lane} opacity={0.7} />
          ))
        : null}
    </>
  );
};

export const Vignette: React.FC = () => <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#vignette)" />;

/** Lattice radio tower with a blinking red light. (x, baseY) is the foot of the tower. */
export const Tower: React.FC<{x: number; baseY: number; height: number; t: number; color?: string}> = ({x, baseY, height, t, color = '#0b0809'}) => {
  const top = baseY - height;
  const half = (y: number) => 14 + 60 * ((y - top) / height);
  const seg = 70;
  const rungs = Math.floor(height / seg);
  const d: string[] = [`M${x - half(baseY)} ${baseY}L${x - 14} ${top}`, `M${x + half(baseY)} ${baseY}L${x + 14} ${top}`];
  for (let i = 0; i < rungs; i++) {
    const y1 = baseY - i * seg;
    const y2 = y1 - seg;
    d.push(`M${x - half(y1)} ${y1}L${x + half(y2)} ${y2}`, `M${x + half(y1)} ${y1}L${x - half(y2)} ${y2}`, `M${x - half(y2)} ${y2}L${x + half(y2)} ${y2}`);
  }
  const blink = t % 1.2 < 0.55;
  return (
    <g>
      <path d={d.join('')} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={x - 62} y={top + height * 0.22} width={124} height={10} fill={color} />
      <rect x={x - 3} y={top - 130} width={6} height={132} fill={color} />
      <circle cx={x} cy={top - 132} r={blink ? 22 : 10} fill="#ff2d2d" opacity={blink ? 0.35 : 0.15} filter="url(#softBlur)" />
      <circle cx={x} cy={top - 132} r={7} fill={blink ? '#ff3b3b' : '#5a1414'} />
    </g>
  );
};
