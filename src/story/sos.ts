/**
 * The one SOS cycle every lamp uses (frames at 30 fps): · · ·  — — —  · · ·  then a pause.
 * Short pulse 6, long pulse 18, gap inside a letter 6, gap between letters 18, gap between cycles 42 = 204 frames (6.8 s).
 */
const S = [6, 6, 6, 6, 6]; // on, off, on, off, on
const O = [18, 6, 18, 6, 18];
const STEPS = [...S, 18, ...O, 18, ...S, 42]; // alternating on/off, starting with on
export const SOS_CYCLE = STEPS.reduce((a, b) => a + b, 0);

/** Frames (within one cycle) at which each of the nine pulses switches on: the shutter clicks. */
export const SOS_ONSETS: number[] = STEPS.reduce<{at: number; out: number[]}>((acc, len, i) => {
  if (i % 2 === 0 && i < STEPS.length - 1) acc.out.push(acc.at);
  acc.at += len;
  return acc;
}, {at: 0, out: []}).out;

/** Whether the lamp is lit `frame` frames after its cycle started (any integer, wraps). */
export const sosOn = (frame: number): boolean => {
  let f = ((Math.floor(frame) % SOS_CYCLE) + SOS_CYCLE) % SOS_CYCLE;
  for (let i = 0; i < STEPS.length; i++) {
    if (f < STEPS[i]) return i % 2 === 0;
    f -= STEPS[i];
  }
  return false;
};
