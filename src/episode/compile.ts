import type {Episode, Shot} from './schema';
import type {Phrase} from './timing';

export type CompiledShot = Shot & {start: number; end: number};
export type Compiled = {
  shots: CompiledShot[];
  slams: {text: string; at: number}[];
  countdown: {start: number; seconds: number} | null;
  clockUntil: number;
  endCard: number;
  duration: number;
};

export const END_CARD_HOLD = 3.2;

/** Turns line-indexed story structure into seconds, using the narration timings. */
export const compile = (ep: Episode, phrases: Phrase[]): Compiled => {
  if (phrases.length !== ep.lines.length) {
    throw new Error(`compile: ${phrases.length} timings for ${ep.lines.length} lines`);
  }
  const endCard = phrases[phrases.length - 1].end + 0.45;
  const startOf = (line: number) => Math.max(0, phrases[line].start - 0.15);
  const shots = ep.shots.map((s, i) => ({
    ...s,
    start: i === 0 ? 0 : startOf(s.fromLine),
    end: i < ep.shots.length - 1 ? startOf(ep.shots[i + 1].fromLine) : endCard,
  }));
  const countdown = ep.countdown
    ? {start: phrases[ep.countdown.fromLine].start, seconds: Math.max(1, Math.min(ep.countdown.seconds, Math.floor(endCard - phrases[ep.countdown.fromLine].start)))}
    : null;
  return {
    shots,
    slams: ep.slams.map((s) => ({text: s.text, at: phrases[s.afterLine].end + 0.25})),
    countdown,
    clockUntil: shots[1]?.start ?? endCard,
    endCard,
    duration: endCard + END_CARD_HOLD,
  };
};
