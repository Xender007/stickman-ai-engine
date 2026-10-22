import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {GROUND_Y, H, W} from '../config';
import {smooth} from '../lib/anim';
import type {Palette} from './palettes';

/** Hill rising to the right; the tower stands near its top. */
export const hillY = (x: number) => GROUND_Y + 60 - 330 * smooth(60, 940, x);
export const TOWER_X = 820;

export const Hill: React.FC<{pal: Palette; seed: string}> = ({pal, seed}) => {
  const pts: string[] = [];
  for (let x = -200; x <= W + 200; x += 20) pts.push(`${x} ${hillY(x)}`);
  const horizon = GROUND_Y - 120;
  return (
    <>
      {Array.from({length: 20}, (_, i) => {
        const h = 50 + random(`${seed}hz${i}`) * 190;
        return <rect key={i} x={-60 + i * 62} y={horizon - h} width={48 + random(`${seed}hw${i}`) * 30} height={h + 200} fill={pal.far} />;
      })}
      <path d={`M-200 ${H + 200}L${pts.join('L')}L${W + 200} ${H + 200}Z`} fill={pal.ground} />
      {Array.from({length: 9}, (_, i) => {
        const x = 40 + i * 115 + random(`${seed}b${i}`) * 40;
        const r = 16 + random(`${seed}br${i}`) * 22;
        return <circle key={i} cx={x} cy={hillY(x) - r * 0.6} r={r} fill={pal.ground} />;
      })}
    </>
  );
};

export const WATER_Y = 1260;

/** Drowned city at the waterline: sun, half-sunk rooftops, shimmering reflections. */
export const Flood: React.FC<{pal: Palette; seed: string; t: number}> = ({pal, seed, t}) => {
  const sunX = 760;
  return (
    <>
      {pal.sun ? <circle cx={sunX} cy={WATER_Y + 10} r={95} fill={pal.sun} /> : null}
      {Array.from({length: 11}, (_, i) => {
        const h = 18 + random(`${seed}rf${i}`) * 80;
        const x = -40 + i * 105 + random(`${seed}rx${i}`) * 30;
        return <rect key={i} x={x} y={WATER_Y - h} width={50 + random(`${seed}rw${i}`) * 70} height={h + 4} fill={pal.mid} />;
      })}
      <rect x={-200} y={WATER_Y} width={W + 400} height={H - WATER_Y + 200} fill={pal.water} />
      {Array.from({length: 26}, (_, i) => {
        const y = WATER_Y + 18 + i * 24;
        const w = (pal.sun ? 160 - i * 4 : 90) * (0.6 + 0.4 * Math.abs(noise2D(`${seed}rl${i}`, t * 0.8, 0)));
        const x = (pal.sun ? sunX : 200 + random(`${seed}lx${i}`) * 700) + noise2D(`${seed}ro${i}`, t * 0.5, 0) * 30;
        return <rect key={i} x={x - w / 2} y={y} width={Math.max(10, w)} height={5} rx={2} fill={pal.waterLine} opacity={0.55 - i * 0.015} />;
      })}
    </>
  );
};

export const Ripples: React.FC<{x: number; y: number; t: number; color: string}> = ({x, y, t, color}) => (
  <g>
    {[0, 1, 2].map((i) => {
      const k = ((t * 0.5 + i / 3) % 1 + 1) % 1;
      return <ellipse key={i} cx={x} cy={y} rx={40 + k * 140} ry={6 + k * 18} fill="none" stroke={color} strokeWidth={3} opacity={0.6 * (1 - k)} />;
    })}
  </g>
);

export const Rooftop: React.FC<{x: number; y: number; w: number; fill: string}> = ({x, y, w, fill}) => (
  <g>
    <rect x={x} y={y} width={w} height={WATER_Y - y + 20} fill={fill} />
    <rect x={x - 8} y={y - 10} width={w + 16} height={12} fill={fill} />
    <rect x={x + w * 0.7} y={y - 70} width={8} height={62} fill={fill} />
  </g>
);

export const FLOOD_TOWER = {x: 300, baseY: WATER_Y + 300, height: 980};
export const ROOF = {x: 280, y: WATER_Y - 70, w: 300};
