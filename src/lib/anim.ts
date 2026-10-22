import {Easing, interpolate} from 'remotion';

export type Keys = ReadonlyArray<readonly [number, number]>;

/**
 * Piecewise-linear curve through [time, value] keys, clamped at both ends.
 * Keys are sorted and de-duplicated so beat times derived from the VO can't crash a render.
 */
export const curve = (t: number, keys: Keys): number => {
  const sorted = [...keys].sort((a, b) => a[0] - b[0]);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [x, y] of sorted) {
    const prev = xs[xs.length - 1];
    xs.push(prev !== undefined && x <= prev ? prev + 1e-3 : x);
    ys.push(y);
  }
  if (xs.length === 1) return ys[0];
  return interpolate(t, xs, ys, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

/** Smoothstep from 0 (t <= a) to 1 (t >= b). */
export const smooth = (a: number, b: number, t: number): number => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export const easeOut = Easing.out(Easing.cubic);

/** 0→1 ease-out progress of an animation that starts at `start` and lasts `dur` seconds. */
export const progress = (t: number, start: number, dur: number): number =>
  easeOut(Math.min(1, Math.max(0, (t - start) / dur)));
