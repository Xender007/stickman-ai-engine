/**
 * Renders every voiced part of a scripted story (final picture and sound), carrying the SOS lamp phase across parts.
 *
 *   npx tsx scripts/story-animatic.ts story/the-quiet-coast [--scale 0.5]
 *
 * Output: out/<slug>/part-N.mp4, loudness-normalised to -14 LUFS
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {StoryVideoProps} from '../src/story/StoryVideo';
import {StoryPartSchema, StoryTiming} from '../src/story/schema';
import {sosAnchor, sosPhaseAtEnd} from '../src/story/timeline';

const dir = process.argv[2];
if (!dir) throw new Error('usage: story-render.ts story/<slug> [--scale 0.5] [--part N]');
const scaleAt = process.argv.indexOf('--scale');
const scale = scaleAt > 0 ? process.argv[scaleAt + 1] : '1';
const partAt = process.argv.indexOf('--part');
const only = partAt > 0 ? Number(process.argv[partAt + 1]) : null;
const slug = path.basename(dir);
const outDir = path.join('out', slug);
fs.mkdirSync(outDir, {recursive: true});

let carried: number | null = null;
for (const f of fs.readdirSync(dir).filter((x) => /^part-\d+\.json$/.test(x)).sort()) {
  const part = StoryPartSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const timingFile = path.join(dir, `part-${part.part}.timing.json`);
  if (!fs.existsSync(timingFile)) {
    console.error(`[render] part ${part.part}: no timing, run story-voice first`);
    continue;
  }
  const timing: StoryTiming = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
  const anchor = sosAnchor(part, timing, carried);
  if (part.scenes.some((s) => s.signal === 'sos')) carried = sosPhaseAtEnd(anchor, timing);
  const props: StoryVideoProps = {part, timing, sosAnchor: anchor};
  const propsFile = path.join(outDir, `part-${part.part}.story-props.json`);
  fs.writeFileSync(propsFile, JSON.stringify(props));
  if (only !== null && part.part !== only) continue;
  const raw = path.join(outDir, `part-${part.part}.raw.mp4`);
  const video = path.join(outDir, scale === "1" ? `part-${part.part}.mp4` : `part-${part.part}.preview.mp4`);
  console.error(`[render] rendering ${video}`);
  const r = spawnSync('npx', ['remotion', 'render', 'StoryPart', raw, `--props=${propsFile}`, `--scale=${scale}`, '--log=error'],
    {stdio: ['ignore', process.stderr, process.stderr], shell: process.platform === 'win32'});
  if (r.status !== 0) throw new Error(`render of part ${part.part} failed`);
  const m = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1:LRA=11', '-ar', '48000', video], {stdio: 'inherit'});
  if (m.status !== 0) throw new Error(`mastering of part ${part.part} failed`);
  fs.rmSync(raw);
  console.error(`[render] wrote ${video}`);
}
