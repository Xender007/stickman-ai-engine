/**
 * Check a restyled video against our guide: the restyle may change the look but not where things are.
 *   npx tsx apps/engine-cli/src/restyle-check.mts <restyled.mp4> [guide.mp4]
 * Writes to out/restyle-check/:
 *   side-by-side.mp4   guide | restyled
 *   overlay.mp4        restyled with the guide's outlines drawn on top (magenta), to see drift
 *   sheet.png          8 sampled frames of the overlay, for a quick review
 */
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const [restyled, guideArg] = process.argv.slice(2);
if (!restyled) {
  console.error('usage: restyle-check.mts <restyled.mp4> [guide.mp4]');
  process.exit(1);
}
const guide = guideArg ?? path.resolve('out/restyle-kit/guide-720x1280-30fps.mp4');
const out = path.resolve('out/restyle-check');
mkdirSync(out, { recursive: true });

const ff = (args: string[]) => {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
};
const norm = 'fps=30,scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1';

ff(['-i', guide, '-i', restyled, '-filter_complex', `[0]${norm}[a];[1]${norm}[b];[a][b]hstack=inputs=2[v]`, '-map', '[v]', '-t', '10', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(out, 'side-by-side.mp4')]);
ff([
  '-i', restyled, '-i', guide, '-filter_complex',
  `[0]${norm}[b];[1]${norm},edgedetect=low=0.08:high=0.2,colorchannelmixer=rr=1:gg=0:bb=1,format=rgba,colorkey=black:0.1:0.0[e];[b][e]overlay[v]`,
  '-map', '[v]', '-t', '10', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(out, 'overlay.mp4'),
]);
ff(['-i', path.join(out, 'overlay.mp4'), '-vf', "select='not(mod(n,37))',scale=360:-1,tile=4x2", '-frames:v', '1', path.join(out, 'sheet.png')]);
console.log(JSON.stringify({ sideBySide: path.join(out, 'side-by-side.mp4'), overlay: path.join(out, 'overlay.mp4'), sheet: path.join(out, 'sheet.png') }));
