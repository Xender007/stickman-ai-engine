import type { EnvFrame, FxEvent } from '../../../packages/world/src/envtimeline.ts';

/** Deterministic pseudo-random in [0, 1) from a seed and an index: the same droplet in the same place on every render. */
export const rnd = (seed: number, i: number): number => {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export interface ActiveFx extends FxEvent {
  /** Seconds of edit time since the effect started. */
  age: number;
}

/** Effects that started within the last `maxAge` edit seconds. Reads earlier frames, so it is a pure function of (frames, frame). */
export function activeFx(frames: EnvFrame[], frame: number, fps: number, maxAge = 4): ActiveFx[] {
  const out: ActiveFx[] = [];
  for (let f = Math.max(0, frame - Math.round(maxAge * fps)); f <= frame; f++) {
    for (const e of frames[f].fx) out.push({ ...e, age: (frame - f) / fps });
  }
  return out;
}

/** The most recent effect of a kind that targeted something, with its age, or null. */
export const lastOf = (list: ActiveFx[], kind: FxEvent['kind']): ActiveFx | null => list.filter((e) => e.kind === kind).sort((a, b) => a.age - b.age)[0] ?? null;
