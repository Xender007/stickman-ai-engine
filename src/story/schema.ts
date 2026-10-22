import {z} from 'zod';

/**
 * Scripted (hand-directed) stories. Unlike the generated episodes in src/episode, a scene here is a named, fixed piece of
 * staging with explicit continuity state, and narration is decoupled from captions (see captions.ts).
 */

export const RAVI_STATES = ['clean', 'dusty', 'torn-wet'] as const;
export const MAST_STATES = ['intact', 'damaged', 'brace-failed'] as const;
export const WATER_STATES = ['none', 'advancing', 'impact', 'high-lull', 'retreating', 'refilling', 'surge-gully'] as const;
export const SIGNALS = ['off', 'sos', 'carried', 'answered'] as const;

export const LineSchema = z.object({
  id: z.string().regex(/^P\d-L\d{2}$/),
  text: z.string().min(2),
  speaker: z.enum(['narrator', 'desk', 'mia']),
  variant: z.enum(['recorded', 'live']).optional().describe('Radio treatment for the desk voice'),
  pauseAfter: z.number().min(0).max(3).optional().describe('Deliberate silence after this line, in seconds'),
});

export const SceneSchema = z.object({
  id: z.string().regex(/^P\d-S\d$/),
  fromLine: z.string(),
  target: z.tuple([z.number().min(0), z.number().positive()]).describe('Editorial target window in seconds, half-open'),
  location: z.string(),
  timeOfDay: z.enum(['night', 'night-to-dawn', 'dawn', 'early-morning']),
  camera: z.string(),
  beat: z.string().max(140),
  clues: z.array(z.string()),
  ravi: z.enum(RAVI_STATES),
  water: z.enum(WATER_STATES),
  mast: z.enum(MAST_STATES),
  signal: z.enum(SIGNALS),
  transition: z.enum(['cut', 'blackout', 'end']),
  sosStart: z.string().optional().describe('Line whose start begins a fresh SOS cycle; otherwise the lamp carries its phase'),
});

const rank = <T extends string>(list: readonly T[], v: T) => list.indexOf(v);

export const StoryPartSchema = z
  .object({
    part: z.number().int().min(1),
    title: z.string(),
    recorded: z.string().optional().describe('Locked narration file in public/; the part is not re-voiced'),
    lines: z.array(LineSchema).min(1),
    scenes: z.array(SceneSchema).min(1),
  })
  .superRefine((p, ctx) => {
    const issue = (message: string, path: (string | number)[]) => ctx.addIssue({code: 'custom', message, path});
    const lineIndex = new Map(p.lines.map((l, i) => [l.id, i]));
    if (lineIndex.size !== p.lines.length) issue('Duplicate line ids', ['lines']);
    if (new Set(p.scenes.map((s) => s.id)).size !== p.scenes.length) issue('Duplicate scene ids', ['scenes']);
    p.lines.forEach((l, i) => {
      if (!l.id.startsWith(`P${p.part}-`)) issue(`${l.id} does not belong to part ${p.part}`, ['lines', i, 'id']);
      if (l.speaker === 'desk' && !l.variant) issue(`${l.id}: desk lines need variant recorded|live`, ['lines', i]);
    });
    p.scenes.forEach((s, i) => {
      const at = lineIndex.get(s.fromLine);
      if (at === undefined) return issue(`${s.id}: unknown line ${s.fromLine}`, ['scenes', i, 'fromLine']);
      if (i === 0 && at !== 0) issue('The first scene must start on the first line', ['scenes', 0]);
      const prev = p.scenes[i - 1];
      if (!prev) return;
      if (at <= (lineIndex.get(prev.fromLine) ?? -1)) issue(`${s.id} must start after ${prev.id}`, ['scenes', i, 'fromLine']);
      if (s.target[0] !== prev.target[1]) issue(`${s.id} target must start where ${prev.id} ends (no gaps)`, ['scenes', i, 'target']);
      if (rank(RAVI_STATES, s.ravi) < rank(RAVI_STATES, prev.ravi)) issue(`${s.id}: Ravi's state cannot reset (${prev.ravi} -> ${s.ravi})`, ['scenes', i, 'ravi']);
      if (rank(MAST_STATES, s.mast) < rank(MAST_STATES, prev.mast)) issue(`${s.id}: the mast cannot repair itself (${prev.mast} -> ${s.mast})`, ['scenes', i, 'mast']);
      if (prev.transition === 'end') issue(`${prev.id} ends the part but is not last`, ['scenes', i - 1]);
    });
    p.scenes.forEach((s, i) => {
      if (s.target[1] <= s.target[0]) issue(`${s.id}: empty target window`, ['scenes', i, 'target']);
    });
    if (p.scenes[p.scenes.length - 1].transition !== 'end') issue('The last scene must have transition "end"', ['scenes']);
  });

export type StoryLine = z.infer<typeof LineSchema>;
export type StoryScene = z.infer<typeof SceneSchema>;
export type StoryPart = z.infer<typeof StoryPartSchema>;

/** Continuity across parts: each part opens in (or after) the state the previous part ended in. */
export const crossPartIssues = (parts: StoryPart[]): string[] =>
  parts.slice(1).flatMap((p, i) => {
    const end = parts[i].scenes[parts[i].scenes.length - 1];
    const start = p.scenes[0];
    const out: string[] = [];
    if (rank(RAVI_STATES, start.ravi) < rank(RAVI_STATES, end.ravi)) out.push(`${start.id}: Ravi resets from ${end.ravi} to ${start.ravi}`);
    if (rank(MAST_STATES, start.mast) < rank(MAST_STATES, end.mast)) out.push(`${start.id}: mast resets from ${end.mast} to ${start.mast}`);
    return out;
  });

/** Measured timings: one entry per narration line, and the caption chunks shown on screen. */
export type Cue = {text: string; start: number; end: number};
export type Caption = Cue & {speaker: StoryLine['speaker']; variant?: StoryLine['variant']};
/** `audio` is the narration file in public/ (for a locked recording, its paused edit). */
export type StoryTiming = {audio: string; lines: (Cue & {id: string})[]; captions: Caption[]; duration: number};
