/** Renders the 2.5D probe as a video and samples GPU memory. Records the Milestone 0 hardware baseline. */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { bakeRigid } from '../packages/physics/src/rapier.ts';

const gl = process.argv[2] ?? 'vulkan';
const out = path.resolve('out/benchmarks');
mkdirSync(out, { recursive: true });
const frames = await bakeRigid({ fps: 30, stepSeconds: 1 / 120, frames: 90, bodies: [{ id: 'crate', lane: 'hero', shape: { kind: 'box', hx: 0.4, hy: 0.4 }, position: [4, 5], angle: 0.4, mass: 30 }] });
const propsFile = path.join(out, 'lanes-props.json');
writeFileSync(propsFile, JSON.stringify({ tracks: { fps: 30, frames } }));

let peakMiB = 0;
const sample = () => {
  const r = spawnSync('nvidia-smi', ['--query-gpu=memory.used', '--format=csv,noheader,nounits'], { encoding: 'utf8' });
  const v = Number(r.stdout.trim().split('\n')[0]);
  if (Number.isFinite(v)) peakMiB = Math.max(peakMiB, v);
};
sample();
const baseMiB = peakMiB;
const timer = setInterval(sample, 500);
const t0 = Date.now();
const p = spawn('npx', ['remotion', 'render', 'apps/video/src/index.ts', 'Lanes25D', path.join(out, `lanes-${gl}.mp4`), `--props=${propsFile}`, `--gl=${gl}`], { stdio: 'inherit', shell: true });
const code: number = await new Promise((r) => p.on('exit', (c) => r(c ?? 1)));
clearInterval(timer);
const seconds = (Date.now() - t0) / 1000;
const report = { gl, frames: 90, seconds, secondsPerFrame: +(seconds / 90).toFixed(3), gpuMemBaselineMiB: baseMiB, gpuMemPeakMiB: peakMiB, gpuMemDeltaMiB: peakMiB - baseMiB, exit: code };
writeFileSync(path.join(out, `render-baseline-${gl}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
