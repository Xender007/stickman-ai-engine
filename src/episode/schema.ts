import {z} from 'zod';

/** The fixed visual vocabulary the story writer can use. Add a value here only after the renderer supports it. */
export const SETTINGS = ['city', 'forest', 'hill_tower', 'flood'] as const;
export const MOODS = ['night', 'dusk', 'storm', 'disaster', 'dawn'] as const;
export const ACTIONS = ['walk', 'stand', 'uneasy', 'run', 'dive', 'climb', 'cling'] as const;
export const THREATS = ['none', 'quake', 'collapse', 'fire', 'wave', 'storm'] as const;
export const CAMERAS = ['track', 'wide', 'close'] as const;

export type Setting = (typeof SETTINGS)[number];
export type Mood = (typeof MOODS)[number];
export type Action = (typeof ACTIONS)[number];
export type Threat = (typeof THREATS)[number];

/** Where each action can physically happen. */
export const ACTIONS_BY_SETTING: Record<Setting, readonly Action[]> = {
  city: ['walk', 'stand', 'uneasy', 'run', 'dive'],
  forest: ['walk', 'stand', 'uneasy', 'run', 'dive'],
  hill_tower: ['walk', 'stand', 'uneasy', 'run', 'climb', 'cling'],
  flood: ['stand', 'uneasy', 'climb', 'cling'],
};
export const THREATS_BY_SETTING: Record<Setting, readonly Threat[]> = {
  city: ['none', 'quake', 'collapse', 'fire', 'wave', 'storm'],
  forest: ['none', 'quake', 'fire', 'wave', 'storm'],
  hill_tower: ['none', 'quake', 'wave', 'storm'],
  flood: ['none', 'storm'],
};

export const ShotSchema = z.object({
  fromLine: z.number().int().min(0).describe('Index of the narration line where this shot begins; it runs until the next shot'),
  setting: z.enum(SETTINGS),
  mood: z.enum(MOODS).describe('Lighting/colour of the shot'),
  action: z.enum(ACTIONS).describe('What the hero does for the whole shot'),
  threat: z.enum(THREATS).describe('What is happening around the hero'),
  camera: z.enum(CAMERAS).describe('track = follows a moving hero, wide = small hero in a big world, close = big hero'),
  impact: z.boolean().describe('Ends the shot with a huge hit, white flash and silence. Use at most once per episode'),
});

export const EpisodeSchema = z
  .object({
    title: z.string().min(3).max(60),
    clock: z.string().regex(/^\d{1,2}:\d{2} (AM|PM)$/).nullable().describe('Optional on-screen time stamp for the opening shot, e.g. "4:02 AM"'),
    lines: z.array(z.string().min(2).max(40)).min(14).max(26).describe('Narration, one caption per line, 2-6 words each'),
    shots: z.array(ShotSchema).min(4).max(9),
    slams: z
      .array(z.object({text: z.string().regex(/^[A-Z0-9 ]{2,10}[.!?]$/), afterLine: z.number().int().min(0)}))
      .max(2)
      .describe('Huge red visual-only words (never spoken), e.g. "RUN."'),
    countdown: z
      .object({fromLine: z.number().int().min(0), seconds: z.number().int().min(4).max(9)})
      .nullable()
      .describe('Optional TIME TO IMPACT countdown for a ticking-clock section'),
    summary: z.string().min(20).max(600).describe('What happened and what is unresolved, for writing the next part'),
    postCaption: z.string().min(5).max(200),
    hashtags: z.array(z.string().regex(/^#\w+$/)).min(3).max(8),
  })
  .superRefine((ep, ctx) => {
    const n = ep.lines.length;
    const issue = (message: string, path: (string | number)[]) => ctx.addIssue({code: 'custom', message, path});
    const words = ep.lines.join(' ').split(/\s+/).filter(Boolean).length;
    if (words < 90 || words > 180) issue(`Narration has ${words} words; it must be 90-180`, ['lines']);
    ep.lines.forEach((l, i) => {
      const w = l.split(/\s+/).filter(Boolean).length;
      if (w > 7) issue(`Line ${i} has ${w} words; captions must be 2-6 words`, ['lines', i]);
    });
    if (ep.shots[0]?.fromLine !== 0) issue('The first shot must start at line 0', ['shots', 0, 'fromLine']);
    ep.shots.forEach((s, i) => {
      if (s.fromLine >= n) issue(`fromLine ${s.fromLine} is past the last line (${n - 1})`, ['shots', i, 'fromLine']);
      if (i > 0 && s.fromLine <= ep.shots[i - 1].fromLine) issue('Shots must start on strictly increasing lines', ['shots', i, 'fromLine']);
      if (!ACTIONS_BY_SETTING[s.setting].includes(s.action)) {
        issue(`Action "${s.action}" is not possible in "${s.setting}" (allowed: ${ACTIONS_BY_SETTING[s.setting].join(', ')})`, ['shots', i, 'action']);
      }
      if (!THREATS_BY_SETTING[s.setting].includes(s.threat)) {
        issue(`Threat "${s.threat}" is not available in "${s.setting}" (allowed: ${THREATS_BY_SETTING[s.setting].join(', ')})`, ['shots', i, 'threat']);
      }
      if (s.impact && i === ep.shots.length - 1) issue('The last shot cannot be an impact; something must follow it', ['shots', i, 'impact']);
    });
    if (ep.shots.filter((s) => s.impact).length > 1) issue('Use impact at most once', ['shots']);
    ep.slams.forEach((s, i) => {
      if (s.afterLine >= n - 1) issue('A slam must come before the last line', ['slams', i, 'afterLine']);
    });
    if (ep.countdown && ep.countdown.fromLine >= n - 2) issue('Countdown starts too late', ['countdown', 'fromLine']);
  });

export type Episode = z.infer<typeof EpisodeSchema>;
export type Shot = z.infer<typeof ShotSchema>;

export const SeriesSchema = z.object({
  title: z.string().min(3).max(50),
  premise: z.string().min(20).max(400),
  hero: z.object({name: z.string().min(2).max(14), trait: z.string().max(80)}),
  world: z.string().max(300).describe('Where the series takes place, using only the available settings'),
  parts: z.number().int().min(2).max(6),
  arc: z.array(z.string().min(10).max(200)).min(2).max(6).describe('One sentence per part, in order'),
  tone: z.string().max(80),
}).refine((s) => s.arc.length === s.parts, {message: 'arc must have exactly one entry per part', path: ['arc']});

export type Series = z.infer<typeof SeriesSchema>;
