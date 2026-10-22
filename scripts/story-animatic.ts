/**
 * Renders the review animatic of every voiced part of a scripted story, carrying the SOS lamp phase across parts.
 *
 *   npx tsx scripts/story-animatic.ts story/the-quiet-coast [--scale 0.5]
 *
 * Output: out/<slug>/animatic-part-N.mp4
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {AnimaticProps} from '../src/story/Animatic';
import {StoryPartSchema, StoryTiming} from '../src/story/schema';
import {sosAnchor, sosPhaseAtEnd} from '../src/story/timeline';

const dir = process.argv[2];
if (!dir) throw new Error('usage: story-animatic.ts story/<slug> [--scale 0.5]');
const scaleAt = process.argv.indexOf('--scale');
const scale = scaleAt > 0 ? process.argv[scaleAt + 1] : '0.5';
const slug = path.basename(dir);
const outDir = path.join('out', slug);
fs.mkdirSync(outDir, {recursive: true});

let carried: number | null = null;
for (const f of fs.readdirSync(dir).filter((x) => /^part-\d+\.json$/.test(x)).sort()) {
  const part = StoryPartSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const timingFile = path.join(dir, `part-${part.part}.timing.json`);
  if (!fs.existsSync(timingFile)) {
    console.error(`[animatic] part ${part.part}: no timing, run story-voice first`);
    continue;
  }
  const timing: StoryTiming = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
  const anchor = sosAnchor(part, timing, carried);
  if (part.scenes.some((s) => s.signal === 'sos')) carried = sosPhaseAtEnd(anchor, timing);
  const props: AnimaticProps = {part, timing, sosAnchor: anchor};
  const propsFile = path.join(outDir, `animatic-part-${part.part}.props.json`);
  fs.writeFileSync(propsFile, JSON.stringify(props));
  const video = path.join(outDir, `animatic-part-${part.part}.mp4`);
  console.error(`[animatic] rendering ${video}`);
  const r = spawnSync('npx', ['remotion', 'render', 'StoryAnimatic', video, `--props=${propsFile}`, `--scale=${scale}`, '--log=error'],
    {stdio: ['ignore', process.stderr, process.stderr], shell: process.platform === 'win32'});
  if (r.status !== 0) throw new Error(`render of part ${part.part} failed`);
}
