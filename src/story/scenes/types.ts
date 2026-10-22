import type React from 'react';
import {smooth} from '../../lib/anim';
import type {Cam} from '../world/World';
import type {SceneWindow} from '../timeline';

/** What every scene and sound plan gets: part time, its own window, and cue times of the narration lines. */
export type Plan = {
  wins: SceneWindow[];
  total: number; // part length before the end card
  cue: (lineId: string) => number; // when a line starts being spoken
  cueEnd: (lineId: string) => number;
};

export type Ctx = Plan & {
  t: number; // part time
  lt: number; // time into this scene
  w: SceneWindow;
  lamp: (t: number) => boolean; // ridge lamp lit at part time t
};

export type SceneFC = React.FC<{c: Ctx}>;

export type SoundCue = {
  name: string; // public/sfx/<name>.wav
  at: number;
  dur?: number;
  loop?: boolean;
  volume: number | ((t: number) => number); // t = part time
  duck?: boolean; // dip under the voice
};

export type PartModule = {
  scenes: Record<string, SceneFC>;
  sound: (p: Plan) => SoundCue[];
  /** Times the picture cuts to black (it comes back at the next scene). */
  blackouts?: (p: Plan) => number[];
  /** Captions emphasised bigger and coloured: red for warnings, amber for the signal and the names. */
  keyLines: Record<string, 'warn' | 'signal'>;
  /** Huge red words seen, never spoken, in the silent beat after a line. */
  slams?: (p: Plan) => {text: string; at: number}[];
  clock?: {text: string; until: (p: Plan) => number};
  /** A long countdown in minutes (e.g. SECOND WAVE 15:00), compressed through keyed [part time, seconds left] jumps. */
  waveClock?: (p: Plan) => {label: string; keys: [number, number][]; from: number; until: number};
  /** Calm title cards over the picture, e.g. DAY 2 in a time-lapse. */
  cards?: (p: Plan) => {text: string; at: number; dur: number}[];
  /** TIME TO IMPACT countdown that reaches zero on the hit. */
  countdown?: (p: Plan) => {start: number; seconds: number};
  endCard: {title: string; subtitle: string; next?: string};
};

/** Eased 0..1 between part times a and b. */
export const ease = (a: number, b: number, t: number) => smooth(a, b, t);

/** Camera along timed keys, eased between them. */
export const camAt = (t: number, keys: [number, Cam][]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, c1] = keys[i];
    if (t <= t1) {
      const [t0, c0] = keys[i - 1];
      const k = smooth(t0, t1, t);
      return {x: c0.x + (c1.x - c0.x) * k, y: c0.y + (c1.y - c0.y) * k, z: c0.z * Math.pow(c1.z / c0.z, k)};
    }
  }
  return keys[keys.length - 1][1];
};

/** Linear-in-time value along keys, eased between them. */
export const valAt = (t: number, keys: [number, number][]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const k = smooth(keys[i - 1][0], keys[i][0], t);
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * k;
    }
  }
  return keys[keys.length - 1][1];
};
