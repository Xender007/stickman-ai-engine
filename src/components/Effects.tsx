import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {GROUND_Y, RED, W} from '../config';
import {ANTON} from '../fonts';
import {progress, smooth} from '../lib/anim';

/** Rising smoke columns. Positions are in the layer's world space (scrolls with `depth`). */
export const SmokePlumes: React.FC<{t: number; start: number; camX: number; depth: number; plumes: {x: number; y: number}[]}> = ({
  t, start, camX, depth, plumes,
}) => {
  if (t < start) return null;
  const N = 16;
  const P = 5.5; // seconds a puff lives before it is recycled
  const fadeIn = Math.min(1, (t - start) / 1.2);
  return (
    <g filter="url(#smokeBlur)" transform={`translate(${-camX * depth} 0)`}>
      {plumes.flatMap((pl, k) =>
        Array.from({length: N}, (_, i) => {
          const born = start + random(`pl${k}`) * 0.8 + (i * P) / N;
          if (t < born) return null;
          const age = (t - born) % P;
          const x = pl.x + age * 28 + noise2D(`pl${k}-${i}`, age * 0.4, 0) * 22;
          const o = 0.9 * Math.sin((Math.PI * age) / P) * fadeIn;
          return <circle key={`${k}-${i}`} cx={x} cy={pl.y - age * 110} r={44 + age * 46} fill="#3b3032" opacity={o} />;
        }),
      )}
    </g>
  );
};

/** Falling chunks in screen space. */
export const Debris: React.FC<{t: number; from: number; to: number; count: number; seed: string}> = ({t, from, to, count, seed}) => (
  <g>
    {Array.from({length: count}, (_, i) => {
      const s = `${seed}${i}`;
      const age = t - (from + random(s) * (to - from));
      if (age < 0) return null;
      const x = random(s + 'x') * W + (random(s + 'v') - 0.5) * 140 * age;
      const y = 220 + random(s + 'y') * 650 + 0.5 * 1500 * age * age;
      if (y > GROUND_Y + 20) return null;
      const w = 10 + random(s + 'w') * 22;
      const h = 6 + random(s + 'h') * 12;
      return (
        <rect key={s} x={-w / 2} y={-h / 2} width={w} height={h} fill="#504748"
          transform={`translate(${x} ${y}) rotate(${(random(s + 'r') - 0.5) * 900 * age})`} />
      );
    })}
  </g>
);

/** Drifting embers once the city is burning. */
export const Embers: React.FC<{t: number; from: number; count: number}> = ({t, from, count}) => {
  if (t < from) return null;
  const k = Math.min(1, (t - from) / 1.5);
  return (
    <g>
      {Array.from({length: count}, (_, i) => {
        const s = `emb${i}`;
        const y = GROUND_Y - ((random(s + 'o') * 1500 + (t - from) * (40 + random(s) * 90)) % 1500);
        const x = random(s + 'x') * W + Math.sin(t * 1.3 + i) * 25;
        const o = k * (0.35 + 0.65 * Math.abs(noise2D(s, t * 3, 0)));
        return <circle key={s} cx={x} cy={y} r={2 + random(s + 'r') * 2.5} fill="#ffb15c" opacity={o} />;
      })}
    </g>
  );
};

export type Burst = {at: number; worldX: number; size: number};

/** Light dust clouds billowing at street level (ground layer world space). */
export const DustBursts: React.FC<{t: number; camX: number; bursts: Burst[]}> = ({t, camX, bursts}) => (
  <g filter="url(#dustBlur)">
    {bursts.flatMap((b, k) => {
      const age = t - b.at;
      if (age < 0 || age > 4) return [];
      const grow = progress(t, b.at, 1.3);
      return Array.from({length: 7}, (_, i) => {
        const s = `dust${k}-${i}`;
        const dx = (random(s + 'x') - 0.5) * b.size * 1.6 + age * 22;
        const dy = -random(s + 'y') * b.size * 0.8;
        const r = b.size * (0.35 + 0.65 * grow) * (0.55 + random(s + 'r') * 0.6);
        const o = 0.55 * (1 - smooth(0.8, 4, age)) * Math.min(1, age / 0.15);
        return <circle key={s} cx={b.worldX - camX + dx} cy={GROUND_Y - 30 + dy} r={r} fill="#a59b9a" opacity={o} />;
      });
    })}
  </g>
);

/** Huge red word that stamps in, shakes, then fades. Drawn inside the scene so smoke can pass over it. */
export const Slam: React.FC<{text: string; t: number; at: number; hold: number; cy?: number}> = ({text, t, at, hold, cy = 760}) => {
  const age = t - at;
  if (age < 0 || age > hold + 0.8) return null;
  const size = Math.min(300, 940 / (text.length * 0.5)); // long words shrink so the punch-in never leaves the frame
  const scale = 1.2 - 0.2 * progress(t, at, 0.16);
  const opacity = Math.min(1, age / 0.05) * (1 - smooth(hold, hold + 0.7, age));
  const jitter = age < 0.45 ? 14 * (1 - age / 0.45) : 0;
  const jx = noise2D('slamx', age * 30, 0) * jitter;
  const jy = noise2D('slamy', age * 30, 0) * jitter;
  return (
    <g transform={`translate(${W / 2 + jx} ${cy + jy}) scale(${scale})`} opacity={opacity}>
      <text x={0} y={100} textAnchor="middle" fontFamily={ANTON} fontSize={size} fill={RED}
        stroke="#140405" strokeWidth={14} strokeLinejoin="round" style={{paintOrder: 'stroke'}}>
        {text}
      </text>
    </g>
  );
};
