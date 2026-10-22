/**
 * Shared render driver for engine scenes. Modes:
 *   stills  <frames>   PNG stills for review                          out/engine/<name>-<frame>.png
 *   sequence           full PNG sequence vs isolated stills, bit-identical (rule R8b)
 *   shuffle            isolated stills in shuffled order vs in-order stills
 *   video [--scale n]  full clip as mp4                               out/engine/<name>.mp4
 * Everything is baked in Node by the caller; renders run on the Vulkan backend (GTX 1050).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderFrames, renderMedia, renderStill, selectComposition } from '@remotion/renderer';

export interface DriverScene {
  /** Remotion composition id. */
  id: string;
  /** Short name used for output files. */
  name: string;
  props: Record<string, unknown> & { frames: unknown[] };
  /** Frames sampled by the sequence and shuffle gates. */
  gateFrames: number[];
}

export async function runDriver(scene: DriverScene, argv: string[]): Promise<void> {
  const [mode = 'stills', arg] = argv;
  const scaleArg = argv.indexOf('--scale');
  const scale = scaleArg >= 0 ? Number(argv[scaleArg + 1]) || 1 : 1;
  const out = path.resolve('out/engine');
  mkdirSync(out, { recursive: true });

  const total = scene.props.frames.length;
  const serveUrl = await bundle({ entryPoint: path.resolve('apps/video/src/index.ts') });
  const chromiumOptions = { gl: 'vulkan' } as const;
  const comp = await selectComposition({ serveUrl, id: scene.id, inputProps: scene.props, chromiumOptions });
  const hashOf = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);
  const still = async (frame: number, tag: string) => {
    const output = path.join(out, `${scene.name}-${tag}-${frame}.png`);
    await renderStill({ composition: comp, serveUrl, output, frame, inputProps: scene.props, chromiumOptions, imageFormat: 'png' });
    return output;
  };
  const gate = scene.gateFrames.filter((f) => f < total);
  const finish = (report: { identical: boolean }, file: string) => {
    writeFileSync(path.join(out, file), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(report.identical ? 0 : 1);
  };

  if (mode === 'stills') {
    for (const f of (arg ?? '0,60,120,180,240').split(',').map(Number)) console.log(await still(f, 'still'));
  } else if (mode === 'sequence') {
    // Catches state that leaks between frames inside one canvas (e.g. a camera applied only once).
    const dir = path.join(out, `${scene.name}-seq`);
    await renderFrames({ composition: comp, serveUrl, inputProps: scene.props, chromiumOptions, outputDir: dir, imageFormat: 'png', onStart: () => undefined, onFrameUpdate: () => undefined });
    const pad = (n: number) => String(n).padStart(String(total - 1).length, '0');
    const mismatches: number[] = [];
    for (const f of gate) if (hashOf(await still(f, 'iso')) !== hashOf(path.join(dir, `element-${pad(f)}.png`))) mismatches.push(f);
    finish({ scene: scene.name, frames: gate, mismatches, identical: mismatches.length === 0 } as never, `${scene.name}-sequence.json`);
  } else if (mode === 'shuffle') {
    const inOrder: Record<number, string> = {};
    for (const f of gate) inOrder[f] = hashOf(await still(f, 'shuf'));
    const order = [...gate].sort((a, b) => ((a * 7919) % 103) - ((b * 7919) % 103));
    const mismatches: number[] = [];
    for (const f of order) if (hashOf(await still(f, 'shuf')) !== inOrder[f]) mismatches.push(f);
    finish({ scene: scene.name, frames: gate, order, mismatches, identical: mismatches.length === 0 } as never, `${scene.name}-shuffle.json`);
  } else if (mode === 'video') {
    const file = path.join(out, scale === 1 ? `${scene.name}.mp4` : `${scene.name}.preview.mp4`);
    const t0 = Date.now();
    await renderMedia({ composition: comp, serveUrl, codec: 'h264', outputLocation: file, inputProps: scene.props, chromiumOptions, scale, crf: 18, overwrite: true });
    console.log(JSON.stringify({ file, frames: total, seconds: (Date.now() - t0) / 1000 }));
  } else {
    throw new Error(`unknown mode ${mode}`);
  }
}
