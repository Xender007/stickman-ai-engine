import type {Episode} from './schema';

export type Phrase = {text: string; start: number; end: number};

/** Silence left in the narration after an impact shot, for the crash and the ear-ring. */
export const IMPACT_GAP = 1.8;
/** Narration starts this long after the video does. */
export const LEAD_IN = 0.35;

const r3 = (s: number) => Math.round(s * 1000) / 1000;

/** Line indices where a new narration segment starts (right after each impact shot). */
export const segmentStarts = (ep: Episode): number[] =>
  ep.shots.flatMap((s, i) => (s.impact && ep.shots[i + 1] ? [ep.shots[i + 1].fromLine] : []));

/** Lines split into segments that are voiced separately and joined with IMPACT_GAP of silence. */
export const segments = (ep: Episode): string[][] => {
  const cuts = [0, ...segmentStarts(ep), ep.lines.length];
  return cuts.slice(0, -1).map((from, i) => ep.lines.slice(from, cuts[i + 1]));
};

/** Places per-segment phrase timings on one timeline (segment k starts after k gaps). */
export const joinSegments = (parts: {phrases: Phrase[]; duration: number}[]): Phrase[] => {
  let offset = LEAD_IN;
  return parts.flatMap((p, i) => {
    const placed = p.phrases.map((ph) => ({text: ph.text, start: r3(ph.start + offset), end: r3(ph.end + offset)}));
    offset += p.duration + (i < parts.length - 1 ? IMPACT_GAP : 0);
    return placed;
  });
};

/** Timings without a voice: ~165 words/min plus pauses on punctuation. For previews and dry runs. */
export const estimatePhrases = (ep: Episode): Phrase[] =>
  joinSegments(
    segments(ep).map((lines) => {
      let t = 0;
      const phrases = lines.map((text) => {
        const words = text.split(/\s+/).filter(Boolean).length;
        const start = t;
        const end = start + 0.36 * words + 0.1;
        t = end + (/(\.\.\.|…)$/.test(text) ? 0.5 : /[.!?]$/.test(text) ? 0.3 : 0.08);
        return {text, start, end};
      });
      return {phrases, duration: t};
    }),
  );
