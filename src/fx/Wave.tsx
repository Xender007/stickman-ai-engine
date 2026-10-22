import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {H, W} from '../config';

const crest = (x: number, y: number, t: number, seed: string) =>
  y + 35 * noise2D(seed, x * 0.005, t * 0.4) + 12 * Math.sin(x * 0.03 + t * 2.5);

const Spray: React.FC<{pts: [number, number][]; t: number; seed: string}> = ({pts, t, seed}) => (
  <g>
    {pts.flatMap(([x, y], i) => {
      if (i % 2) return [];
      const s = `${seed}sp${i}`;
      const k = ((t * (0.8 + random(s))) + random(s + 'o')) % 1;
      return [<circle key={s} cx={x + k * 30} cy={y - 10 - k * 120} r={3 + random(s + 'r') * 5} fill="#ffffff" opacity={0.8 * (1 - k)} />];
    })}
  </g>
);

/** A wall of water rising behind the skyline. */
export const WaveWall: React.FC<{crestY: number; t: number; seed: string}> = ({crestY, t, seed}) => {
  const pts: [number, number][] = [];
  for (let x = -200; x <= W + 200; x += 40) pts.push([x, crest(x, crestY, t, seed)]);
  const line = pts.map(([x, y]) => `${x} ${y}`).join('L');
  return (
    <g>
      <path d={`M-200 ${H + 200}L${line}L${W + 200} ${H + 200}Z`} fill="url(#wave)" />
      {pts.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
        <line key={i} x1={x} y1={y + 30} x2={x + 6} y2={y + 260 + (i % 3) * 60} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={3} />
      ))}
      <path d={`M${line}`} fill="none" stroke="#ffffff" strokeWidth={9} strokeLinejoin="round" />
      <Spray pts={pts} t={t} seed={seed} />
    </g>
  );
};

/** A curling wave front sweeping in from the left; frontX is the leading edge. */
export const WaveFront: React.FC<{frontX: number; crestY: number; baseY: number; t: number; seed: string}> = ({frontX, crestY, baseY, t, seed}) => {
  const pts: [number, number][] = [];
  for (let x = -200; x <= frontX - 140; x += 40) pts.push([x, crest(x, crestY, t, seed)]);
  pts.push([frontX - 140, crestY]);
  const top = pts.map(([x, y]) => `${x} ${y}`).join('L');
  const lip = `C${frontX + 40} ${crestY - 40} ${frontX + 100} ${crestY + 80} ${frontX + 30} ${crestY + 130}`;
  return (
    <g>
      <path d={`M-200 ${baseY + 400}L${top}${lip}L${frontX - 30} ${baseY + 400}Z`} fill="url(#wave)" />
      {pts.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
        <line key={i} x1={x} y1={y + 40} x2={x + 10} y2={y + 400} stroke="#ffffff" strokeOpacity={0.1} strokeWidth={3} />
      ))}
      <path d={`M${top}${lip}`} fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <Spray pts={pts.slice(-6)} t={t} seed={seed} />
      <FoamCluster x={frontX - 10} y={baseY - 30} t={t} seed={seed} size={1} />
    </g>
  );
};

const FoamCluster: React.FC<{x: number; y: number; t: number; seed: string; size: number}> = ({x, y, t, seed, size}) => (
  <g>
    {Array.from({length: 12}, (_, i) => {
      const s = `${seed}fc${i}`;
      const r = (14 + random(s) * 26) * size * (0.85 + 0.15 * Math.sin(t * 5 + i));
      return <circle key={s} cx={x + (random(s + 'x') - 0.5) * 120 * size} cy={y - random(s + 'y') * 70 * size} r={r} fill="#f4f6f8" opacity={0.85} />;
    })}
  </g>
);

/** Explosion of white foam when the wave hits. */
export const FoamBurst: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const age = t - at;
  if (age < 0) return null;
  return (
    <g>
      {Array.from({length: 90}, (_, i) => {
        const s = `burst${i}`;
        const a = random(s) * Math.PI - Math.PI;
        const v = 500 + random(s + 'v') * 1300;
        const cx = x + Math.cos(a) * v * age;
        const cy = y + Math.sin(a) * v * age + 500 * age * age;
        const r = (6 + random(s + 'r') * 26) * (1 + age);
        return <circle key={s} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={Math.max(0, 0.9 - age * 0.6) * (0.4 + random(s + 'o') * 0.6)} />;
      })}
    </g>
  );
};
