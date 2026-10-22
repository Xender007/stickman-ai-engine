/**
 * Validates a scripted story and reports its pacing against the editorial targets, using the measured voice timings.
 *
 *   npx tsx scripts/story-check.ts story/the-quiet-coast
 *
 * Prints a markdown report (also written to <story>/pacing.md). Exit code 1 if validation fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import {FPS} from '../src/config';
import {StoryPart, StoryPartSchema, StoryTiming, crossPartIssues} from '../src/story/schema';
import {MAX_CAPTION_WORDS, chunkLine, speakable} from '../src/story/captions';
import {END_HOLD, SOS_LIT_SPAN, partDuration, sceneWindows, sosAnchor, sosPhaseAtEnd} from '../src/story/timeline';

const dir = process.argv[2];
if (!dir) throw new Error('usage: story-check.ts story/<slug>');
const files = fs.readdirSync(dir).filter((f) => /^part-\d+\.json$/.test(f)).sort();
const out: string[] = [`# Pacing and continuity: ${path.basename(dir)}`, ''];
const problems: string[] = [];
const notes: string[] = [];
const f1 = (n: number) => n.toFixed(1);

const parts: StoryPart[] = [];
for (const f of files) {
  const r = StoryPartSchema.safeParse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  if (!r.success) problems.push(...r.error.issues.map((i) => `${f}: ${i.message}`));
  else parts.push(r.data);
}
problems.push(...crossPartIssues(parts));

let carried: number | null = null;
for (const part of parts) {
  const timingFile = path.join(dir, `part-${part.part}.timing.json`);
  out.push(`## Part ${part.part}: ${part.title}`, '');
  if (!fs.existsSync(timingFile)) {
    out.push('_No voice timing yet._', '');
    continue;
  }
  const timing: StoryTiming = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
  const wins = sceneWindows(part, timing);
  const total = partDuration(timing);
  const speech = timing.lines.reduce((a, l) => a + (l.end - l.start), 0);
  const words = part.lines.reduce((a, l) => a + speakable(l.text).split(/\s+/).length, 0);
  const wpm = (words / speech) * 60;
  const silentTail = total - timing.lines[timing.lines.length - 1].end;
  out.push(`Length **${f1(total)} s** (target 65) · ${words} words · speech rate **${Math.round(wpm)} wpm** while speaking (target 150-170) · narration-free ending ${f1(silentTail)} s`, '');
  out.push('| Scene | Target | Measured | Δ length | Lines | Clues |', '|---|---|---|---|---|---|');
  for (const w of wins) {
    const tLen = w.target[1] - w.target[0];
    const len = w.end - w.start;
    const d = len - tLen;
    const lines = part.lines.filter((l) => {
      const c = timing.lines.find((x) => x.id === l.id)!;
      return c.start >= w.start && c.start < w.end;
    }).length;
    out.push(`| ${w.id} | ${w.target[0]}-${w.target[1]} (${tLen} s) | ${f1(w.start)}-${f1(w.end)} (${f1(len)} s) | ${d >= 0 ? '+' : ''}${f1(d)} | ${lines} | ${w.clues.join('; ') || '-'} |`);
    if (w.clues.length && len < 2 + w.clues.length * 0.8) notes.push(`${w.id}: ${f1(len)} s may be short to read ${w.clues.length} clue(s) on a phone`);
    if (len < 2) problems.push(`${w.id} lasts only ${f1(len)} s`);
  }
  out.push('');

  const anchor = sosAnchor(part, timing, carried);
  for (const w of wins.filter((x) => x.sosStart)) {
    const room = (w.end - anchor!) * FPS;
    const ok = room >= SOS_LIT_SPAN;
    (ok ? notes : problems).push(`${w.id}: SOS starts at ${f1(anchor!)} s; ${ok ? 'one full cycle fits' : `only ${Math.floor(room)} of ${SOS_LIT_SPAN} frames fit before the scene ends`}`);
  }
  if (!part.scenes.some((s) => s.sosStart) && part.scenes.some((s) => s.signal === 'sos')) {
    notes.push(`Part ${part.part}: lamp continues the previous part's phase (${carried === null ? 'none!' : `${f1(carried)} s into its cycle`})`);
    if (carried === null) problems.push(`Part ${part.part}: the lamp should carry over but the previous part has no SOS`);
  }
  carried = part.scenes.some((s) => s.signal === 'sos') ? sosPhaseAtEnd(anchor, timing) : carried;

  // Captions: split long lines, and flag chunks that are on screen too briefly to read.
  const split = part.lines.filter((l) => chunkLine(l.text).length > 1);
  if (split.length) {
    out.push(`Captions split from ${split.length} long line(s) (max ${MAX_CAPTION_WORDS} words each):`, '');
    for (const l of split) out.push(`- ${l.id}: ${chunkLine(l.text).map((c) => `“${c}”`).join(' → ')}`);
    out.push('');
  }
  timing.captions.forEach((c, i) => {
    const next = timing.captions[i + 1];
    const shown = Math.min(next ? next.start : Infinity, c.end + 1.2) - c.start;
    if (shown < 0.7) notes.push(`Part ${part.part}: caption “${c.text}” is on screen ${f1(shown)} s`);
  });
}

out.push('## Findings', '');
if (!problems.length && !notes.length) out.push('None.');
for (const p of problems) out.push(`- **PROBLEM** ${p}`);
for (const n of notes) out.push(`- ${n}`);
out.push('', `_End hold after the last line: ${END_HOLD} s. Scene windows start ${'0.25'} s before their first line._`);
const report = out.join('\n') + '\n';
fs.writeFileSync(path.join(dir, 'pacing.md'), report);
process.stdout.write(report);
if (problems.length) process.exit(1);
