/**
 * Voices a scripted story part and measures its cues.
 *
 *   npx tsx --env-file=.env scripts/story-voice.ts story/the-quiet-coast/part-2.json
 *
 * Narration uses VOICE_ID; the radio desk uses DESK_VOICE_ID with a radio filter (recorded = tape, live = receiver).
 * Lines are voiced in segments (split at speaker changes and deliberate pauses), each take is cached in .cache/tts,
 * so changing a pause re-times the part without paying for new audio.
 * Writes public/episodes/<story>/part-N.wav and <story>/part-N.timing.json. A part with "recorded" is not re-voiced:
 * its timing is rebuilt from the locked recording's props instead.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {Caption, StoryLine, StoryPart, StoryPartSchema, StoryTiming} from '../src/story/schema';
import {chunkLine, speakable} from '../src/story/captions';
import {buildCaptions} from './lib/captions';
import {elevenLabs} from './lib/vo';

const LEAD_IN = 0.6;
const SPEAKER_GAP = 0.45; // between narrator and radio when no pause is written
const DESK_VOICE = 'onwK4e9ZLuTAKqWW03F9'; // "Daniel - Steady Broadcaster"
const MIA_VOICE = 'cgSgspJ2msm6clMCkdW9'; // "Jessica - Playful, Bright, Warm"
const RADIO = {
  recorded: 'highpass=f=450,lowpass=f=2800,acompressor=threshold=-20dB:ratio=4,acrusher=bits=10:mix=0.2,volume=1.4',
  live: 'highpass=f=320,lowpass=f=3400,acompressor=threshold=-18dB:ratio=3,acrusher=bits=12:mix=0.12,volume=1.3',
} as const;

const log = (...m: unknown[]) => console.error('[voice]', ...m);
const probe = (file: string) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
const r3 = (s: number) => Math.round(s * 1000) / 1000;

type Segment = {lines: StoryLine[]; gapAfter: number};

export const segmentsOf = (lines: StoryLine[]): Segment[] => {
  const out: Segment[] = [];
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    const cur = out[out.length - 1];
    const sameVoice = prev && prev.speaker === l.speaker && prev.variant === l.variant;
    if (cur && sameVoice && prev.pauseAfter === undefined) cur.lines.push(l);
    else out.push({lines: [l], gapAfter: 0});
  });
  out.forEach((s, i) => {
    const last = s.lines[s.lines.length - 1];
    const next = out[i + 1];
    s.gapAfter = next ? last.pauseAfter ?? (next.lines[0].speaker !== last.speaker ? SPEAKER_GAP : 0.25) : 0;
  });
  return out;
};

/** Line and caption cues of one voiced segment, from its character alignment. */
const cuesOf = (seg: Segment, alignment: Parameters<typeof buildCaptions>[1]) => {
  const lines = buildCaptions(seg.lines.map((l) => speakable(l.text)), alignment);
  const chunks = seg.lines.flatMap((l) => chunkLine(l.text).map((text) => ({text, line: l})));
  const caps = buildCaptions(chunks.map((c) => speakable(c.text)), alignment);
  return {
    lines: seg.lines.map((l, i) => ({id: l.id, text: l.text, start: lines[i].start, end: lines[i].end})),
    captions: chunks.map((c, i): Caption => ({text: c.text, start: caps[i].start, end: caps[i].end, speaker: c.line.speaker, variant: c.line.variant})),
  };
};

async function voice(part: StoryPart, storyDir: string, slug: string) {
  const {ELEVENLABS_API_KEY, VOICE_ID, DESK_VOICE_ID, MIA_VOICE_ID, ELEVENLABS_MODEL} = process.env;
  if (!ELEVENLABS_API_KEY || !VOICE_ID) throw new Error('ELEVENLABS_API_KEY and VOICE_ID must be set');
  const voices = {narrator: VOICE_ID, desk: DESK_VOICE_ID || DESK_VOICE, mia: MIA_VOICE_ID || MIA_VOICE};
  const work = path.join('out', slug, `part-${part.part}-vo`);
  const cache = path.join('.cache', 'tts');
  fs.mkdirSync(work, {recursive: true});
  fs.mkdirSync(cache, {recursive: true});

  const segs = segmentsOf(part.lines);
  const placed: {file: string; duration: number; offset: number}[] = [];
  const timing: StoryTiming = {audio: '', lines: [], captions: [], duration: 0};
  let offset = LEAD_IN;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const speaker = seg.lines[0].speaker;
    const voiceId = voices[speaker];
    const text = seg.lines.map((l) => speakable(l.text)).join(' ');
    // Keep the narrator's delivery continuous across pauses; radio lines stand alone.
    const sameVoice = (s?: Segment) => (s && s.lines[0].speaker === speaker ? s.lines.map((l) => speakable(l.text)).join(' ') : undefined);
    const ctx = {previousText: sameVoice(segs[i - 1]), nextText: sameVoice(segs[i + 1])};
    const model = ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
    const key = createHash('sha1').update(JSON.stringify({voiceId, model, text, ctx})).digest('hex').slice(0, 16);
    const cached = path.join(cache, `${key}.json`);
    let take: {audio_base64: string; alignment: Parameters<typeof buildCaptions>[1]};
    if (fs.existsSync(cached)) take = JSON.parse(fs.readFileSync(cached, 'utf8'));
    else {
      log(`tts ${speaker}: ${text}`);
      const r = await elevenLabs({apiKey: ELEVENLABS_API_KEY, voiceId, modelId: model})(text, ctx);
      take = {audio_base64: r.audio.toString('base64'), alignment: r.alignment};
      fs.writeFileSync(cached, JSON.stringify(take));
    }
    const raw = path.join(work, `seg-${i}.mp3`);
    fs.writeFileSync(raw, Buffer.from(take.audio_base64, 'base64'));
    const file = path.join(work, `seg-${i}.wav`);
    const variant = seg.lines[0].variant;
    const af = speaker === 'desk' && variant ? RADIO[variant] : 'anull';
    // Short fades at both ends so takes never click or start abruptly when joined.
    const len = probe(raw);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af',
      `aformat=sample_rates=44100:channel_layouts=mono,${af},afade=t=in:d=0.02,afade=t=out:st=${Math.max(0, len - 0.06)}:d=0.06`, file]);
    const duration = probe(file);
    const cues = cuesOf(seg, take.alignment);
    timing.lines.push(...cues.lines.map((c) => ({...c, start: r3(c.start + offset), end: r3(c.end + offset)})));
    timing.captions.push(...cues.captions.map((c) => ({...c, start: r3(c.start + offset), end: r3(c.end + offset)})));
    placed.push({file, duration, offset});
    offset += duration + seg.gapAfter;
  }
  timing.duration = r3(offset);

  const out = path.join('public', 'episodes', slug, `part-${part.part}.wav`);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const filter = placed.map((p, i) => `[${i}:a]adelay=${Math.round(p.offset * 1000)}:all=1[a${i}]`).join(';') +
    `;${placed.map((_, i) => `[a${i}]`).join('')}amix=inputs=${placed.length}:normalize=0,apad=whole_dur=${timing.duration}[out]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...placed.flatMap((p) => ['-i', p.file]), '-filter_complex', filter, '-map', '[out]', out]);
  timing.audio = `episodes/${slug}/part-${part.part}.wav`;
  fs.writeFileSync(path.join(storyDir, `part-${part.part}.timing.json`), JSON.stringify(timing, null, 1) + '\n');
  log(`wrote ${out} (${timing.duration.toFixed(1)} s, ${segs.length} segments)`);
}

/**
 * A locked recording is never re-voiced, stretched or trimmed. Its line cues come from the props it was rendered with;
 * deliberate pauses are inserted by cutting it only in the silence between two lines (the midpoint of the gap).
 */
function fromRecording(part: StoryPart, storyDir: string, slug: string) {
  const props = JSON.parse(fs.readFileSync(path.join('series', slug, `part-${part.part}.props.json`), 'utf8'));
  const phrases: {text: string; start: number; end: number}[] = props.phrases;
  if (phrases.length !== part.lines.length) throw new Error(`recording has ${phrases.length} lines, script has ${part.lines.length}`);
  part.lines.forEach((l, i) => {
    if (phrases[i].text !== l.text) throw new Error(`${l.id} differs from the recording: "${phrases[i].text}"`);
  });
  const source = path.join('public', part.recorded!);
  const sourceDur = probe(source);
  // Pieces of the recording, each followed by the pause written after its last line.
  const cuts = part.lines.flatMap((l, i) => (l.pauseAfter && i < part.lines.length - 1 ? [{at: (phrases[i].end + phrases[i + 1].start) / 2, pause: l.pauseAfter, after: i}] : []));
  const shiftOf = (i: number) => cuts.filter((c) => c.after < i).reduce((a, c) => a + c.pause, 0);
  const lines = part.lines.map((l, i) => ({id: l.id, text: l.text, start: r3(phrases[i].start + shiftOf(i)), end: r3(phrases[i].end + shiftOf(i))}));
  // Recorded lines are all short enough to be one caption each.
  const captions = part.lines.map((l, i): Caption => ({text: l.text, start: lines[i].start, end: lines[i].end, speaker: l.speaker}));
  const added = cuts.reduce((a, c) => a + c.pause, 0);
  let audio = part.recorded!;
  if (cuts.length) {
    const bounds = [0, ...cuts.map((c) => c.at), sourceDur];
    const pieces = bounds.slice(0, -1).map((from, k) =>
      `[0:a]atrim=${from}:${bounds[k + 1]},asetpts=N/SR/TB,afade=t=in:d=0.03,afade=t=out:st=${Math.max(0, bounds[k + 1] - from - 0.05)}:d=0.05${k < cuts.length ? `,apad=pad_dur=${cuts[k].pause}` : ''}[p${k}]`);
    audio = `episodes/${slug}/part-${part.part}.edit.wav`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-filter_complex',
      `${pieces.join(';')};${pieces.map((_, k) => `[p${k}]`).join('')}concat=n=${pieces.length}:v=0:a=1[out]`, '-map', '[out]', path.join('public', audio)]);
  }
  const duration = r3(sourceDur + added);
  fs.writeFileSync(path.join(storyDir, `part-${part.part}.timing.json`), JSON.stringify({audio, lines, captions, duration}, null, 1) + '\n');
  log(`part ${part.part}: locked recording ${sourceDur.toFixed(1)} s + ${added.toFixed(1)} s of written pauses = ${duration.toFixed(1)} s`);
}

const file = process.argv[2];
if (!file) throw new Error('usage: story-voice.ts story/<slug>/part-N.json');
const part = StoryPartSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
const storyDir = path.dirname(file);
const slug = path.basename(storyDir);
(part.recorded ? Promise.resolve(fromRecording(part, storyDir, slug)) : voice(part, storyDir, slug)).catch((e) => {
  log(e instanceof Error ? e.message : e);
  process.exit(1);
});
