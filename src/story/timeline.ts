import {FPS} from '../config';
import type {StoryPart, StoryScene, StoryTiming} from './schema';
import {SOS_CYCLE} from './sos';

/** Narration-free hold after the last line, so the final reaction or payoff can land. */
export const END_HOLD = 1.5;
/** A scene begins this long before its first line is heard. */
export const SCENE_LEAD = 0.25;
/** Lit part of one SOS cycle (from the first pulse to the end of the last), in frames. */
export const SOS_LIT_SPAN = SOS_CYCLE - 42;

export type SceneWindow = StoryScene & {start: number; end: number};

export const partDuration = (timing: StoryTiming) => timing.duration + END_HOLD;

export const sceneWindows = (part: StoryPart, timing: StoryTiming): SceneWindow[] => {
  const startOf = (id: string) => {
    const l = timing.lines.find((x) => x.id === id);
    if (!l) throw new Error(`no timing for ${id}`);
    return l.start;
  };
  const starts = part.scenes.map((s, i) => (i === 0 ? 0 : Math.max(0, startOf(s.fromLine) - SCENE_LEAD)));
  return part.scenes.map((s, i) => ({...s, start: starts[i], end: starts[i + 1] ?? partDuration(timing)}));
};

/**
 * Seconds (part-relative) at which the lamp's current cycle started. A scene with sosStart begins a fresh cycle on that
 * line; otherwise the lamp keeps the phase it had at the end of the previous part (`carried`, seconds into the cycle).
 */
export const sosAnchor = (part: StoryPart, timing: StoryTiming, carried: number | null): number | null => {
  const fresh = part.scenes.find((s) => s.sosStart);
  if (fresh) return timing.lines.find((l) => l.id === fresh.sosStart)?.start ?? null;
  return carried === null ? null : -carried;
};

/** Seconds into the SOS cycle at the end of this part, for the next part to continue from. */
export const sosPhaseAtEnd = (anchor: number | null, timing: StoryTiming): number | null =>
  anchor === null ? null : (((partDuration(timing) - anchor) * FPS) % SOS_CYCLE) / FPS;
