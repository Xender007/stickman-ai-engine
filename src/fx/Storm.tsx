import React from 'react';
import {random} from 'remotion';
import {H, W} from '../config';

export const Rain: React.FC<{t: number; count?: number}> = ({t, count = 140}) => (
  <g stroke="#c8dceb" strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round">
    {Array.from({length: count}, (_, i) => {
      const s = `rain${i}`;
      const speed = 1900 + random(s) * 700;
      const y = ((random(s + 'y') * (H + 300) + t * speed) % (H + 300)) - 150;
      const x = random(s + 'x') * (W + 500) - y * 0.25;
      return <line key={s} x1={x} y1={y} x2={x - 12} y2={y + 48} />;
    })}
  </g>
);

/** Brightness of the lightning flash at time t (0..1). */
export const flashAt = (t: number, times: number[]) =>
  times.reduce((m, at) => {
    const age = t - at;
    if (age < 0 || age > 0.6) return m;
    const flicker = age < 0.08 ? 1 : age < 0.14 ? 0.3 : age < 0.2 ? 0.8 : 1;
    return Math.max(m, flicker * Math.exp(-age * 7));
  }, 0);

export const Bolts: React.FC<{t: number; times: number[]; seed: string}> = ({t, times, seed}) => (
  <g>
    {times.map((at, k) => {
      if (t < at || t > at + 0.2) return null;
      const s = `${seed}bolt${k}`;
      let x = 150 + random(s) * (W - 300);
      let y = -20;
      const d = [`M${x} ${y}`];
      for (let i = 0; i < 9; i++) {
        x += (random(`${s}-${i}`) - 0.5) * 140;
        y += 70 + random(`${s}-y${i}`) * 50;
        d.push(`L${x} ${y}`);
      }
      return (
        <g key={s}>
          <path d={d.join('')} stroke="#dfe9ff" strokeWidth={16} fill="none" opacity={0.35} filter="url(#softBlur)" />
          <path d={d.join('')} stroke="#ffffff" strokeWidth={5} fill="none" strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);
