import {random} from 'remotion';

/** Deterministic event times inside a shot. Shared by the picture and the sound so they always line up. */
const every = (dur: number, seed: string, first: number, minGap: number, spread: number): number[] => {
  const out: number[] = [];
  for (let t = first + random(seed) * 0.6, i = 0; t < dur - 0.3; i++) {
    out.push(t);
    t += minGap + random(`${seed}-${i}`) * spread;
  }
  return out;
};

export const lightningTimes = (dur: number, seed: string) => every(dur, `${seed}-bolt`, 0.7, 2.0, 2.0);
export const collapseTimes = (dur: number, seed: string) => every(dur, `${seed}-burst`, 0.3, 1.1, 0.6);
