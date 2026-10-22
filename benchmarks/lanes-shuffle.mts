/**
 * Milestone 0 gate: frames of the Three.js 2.5D scene rendered in shuffled order must equal
 * the same frames rendered in order (same machine, same backend).
 * Usage: npx tsx benchmarks/lanes-shuffle.ts [--gl vulkan|angle|swiftless] [--frames 0,15,30,...]
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { bakeHash, bakeRigid } from '../packages/physics/src/rapier.ts';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const gl = arg('gl', 'vulkan') as 'vulkan' | 'angle' | 'swangle';
const frames = arg('frames', '0,12,24,36,48,60,72,89').split(',').map(Number);
const outDir = path.resolve('out/benchmarks');
mkdirSync(outDir, { recursive: true });

const tracks = await bakeRigid({
  fps: 30,
  stepSeconds: 1 / 120,
  frames: 90,
  bodies: [{ id: 'crate', lane: 'hero', shape: { kind: 'box', hx: 0.4, hy: 0.4 }, position: [4, 5], angle: 0.4, mass: 30 }],
});
const props = { tracks: { fps: 30, frames: tracks } };
console.log('bake hash', bakeHash(tracks));

const serveUrl = await bundle({ entryPoint: path.resolve('apps/video/src/index.ts'), webpackOverride: (c) => c });
const chromiumOptions = { gl } as const;
const comp = await selectComposition({ serveUrl, id: 'Lanes25D', inputProps: props, chromiumOptions });

const hashFrame = async (frame: number) => {
  const file = path.join(outDir, `lanes-${gl}-${frame}.png`);
  await renderStill({ composition: comp, serveUrl, output: file, frame, inputProps: props, chromiumOptions, imageFormat: 'png' });
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);
};

const t0 = Date.now();
const inOrder: Record<number, string> = {};
for (const f of frames) inOrder[f] = await hashFrame(f);
const msInOrder = Date.now() - t0;

const shuffled = [...frames].sort((a, b) => ((a * 7919) % 101) - ((b * 7919) % 101));
const mismatches: number[] = [];
for (const f of shuffled) if ((await hashFrame(f)) !== inOrder[f]) mismatches.push(f);

const report = { gl, frames, order: shuffled, inOrder, mismatches, identical: mismatches.length === 0, msPerStill: Math.round(msInOrder / frames.length) };
writeFileSync(path.join(outDir, `lanes-shuffle-${gl}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
process.exit(report.identical ? 0 : 1);
