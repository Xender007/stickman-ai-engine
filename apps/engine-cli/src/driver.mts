/**
 * Shared render driver for engine scenes. Modes:
 *   stills  <frames>   PNG stills for review                          out/engine/<name>-<frame>.png
 *   sequence           full PNG sequence vs isolated stills: bit-identical for WebGL scenes (rule R8b); for DOM/SVG scenes,
 *                      two sequences with different chunking and the isolated stills must be similar (see `similarity`)
 *   shuffle            isolated stills in shuffled order vs in-order stills
 *   video [--scale n]  full clip as mp4                               out/engine/<name>.mp4
 * Everything is baked in Node by the caller; renders run on the Vulkan backend (GTX 1050).
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
  /** Chromium GL backend (default vulkan, the GTX 1050). */
  gl?: 'vulkan' | 'angle' | 'swangle';
  /**
   * DOM/SVG scenes only. Chrome's 2D path rasteriser places small shapes in a coverage atlas whose layout depends on what the tab
   * drew before, so edge pixels of tiny shapes (spray droplets) vary between runs even when the drawn content is identical; and a
   * still and a sequence capture DOM content through paths that round colours by one level. For such scenes the state hash is
   * the exact check, and frames must be *similar*: every gate frame, between two sequence renders with different worker chunking
   * and between a sequence frame and an isolated still, needs PSNR >= minPsnr and at most maxBadPixels pixels that differ by
   * more than badLevel (plan section 11.4: separate state hashes from frame similarity).
   */
  similarity?: { minPsnr: number; maxBadPixels: number; badLevel: number };
}

/** PSNR (dB, Infinity when identical) and the number of pixels whose difference exceeds `badLevel` on any channel. */
function compareImages(a: string, b: string, badLevel: number): { psnr: number; badPixels: number } {
  const p = spawnSync('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' });
  const pm = /average:(inf|[\d.]+)/.exec(p.stderr ?? '');
  const psnr = !pm ? 0 : pm[1] === 'inf' ? Infinity : Number(pm[1]);
  const lut = `if(gt(val,${badLevel}),255,0)`;
  const d = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-i', a, '-i', b, '-filter_complex', `[0]format=rgb24[x];[1]format=rgb24[y];[x][y]blend=all_mode=difference,format=gray,lut=y='${lut}',signalstats,metadata=print:key=lavfi.signalstats.YAVG`, '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const dm = /YAVG=([\d.]+)/.exec(d.stderr ?? '');
  const dims = /(\d{3,5})x(\d{3,5})/.exec(p.stderr ?? '');
  const pixels = dims ? Number(dims[1]) * Number(dims[2]) : 1080 * 1920;
  const badPixels = dm ? Math.round((Number(dm[1]) / 255) * pixels) : pixels;
  return { psnr, badPixels };
}

export async function runDriver(scene: DriverScene, argv: string[]): Promise<void> {
  const [mode = 'stills', arg] = argv;
  const scaleArg = argv.indexOf('--scale');
  const scale = scaleArg >= 0 ? Number(argv[scaleArg + 1]) || 1 : 1;
  const out = path.resolve('out/engine');
  mkdirSync(out, { recursive: true });

  const total = scene.props.frames.length;
  const serveUrl = await bundle({ entryPoint: path.resolve('apps/video/src/index.ts') });
  const chromiumOptions = { gl: scene.gl ?? 'vulkan' } as const;
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
    const seqFile = (d: string, f: number) => path.join(d, `element-${pad(f)}.png`);
    if (!scene.similarity) {
      const mismatches: number[] = [];
      for (const f of gate) if (hashOf(await still(f, 'iso')) !== hashOf(seqFile(dir, f))) mismatches.push(f);
      finish({ scene: scene.name, frames: gate, mismatches, identical: mismatches.length === 0 } as never, `${scene.name}-sequence.json`);
    } else {
      const sim = scene.similarity;
      const dir1 = path.join(out, `${scene.name}-seq1`);
      await renderFrames({ composition: comp, serveUrl, inputProps: scene.props, chromiumOptions, outputDir: dir1, imageFormat: 'png', concurrency: 1, onStart: () => undefined, onFrameUpdate: () => undefined });
      const failures: { frame: number; pair: string; psnr: number; badPixels: number }[] = [];
      const worst = { psnr: Infinity, badPixels: 0 };
      for (const f of gate) {
        const iso = await still(f, 'iso');
        for (const [pair, x, y] of [['chunking', seqFile(dir, f), seqFile(dir1, f)], ['still', iso, seqFile(dir, f)]] as const) {
          const c = compareImages(x, y, sim.badLevel);
          worst.psnr = Math.min(worst.psnr, c.psnr);
          worst.badPixels = Math.max(worst.badPixels, c.badPixels);
          if (c.psnr < sim.minPsnr || c.badPixels > sim.maxBadPixels) failures.push({ frame: f, pair, psnr: c.psnr, badPixels: c.badPixels });
        }
      }
      finish({ scene: scene.name, gateFrames: gate, criteria: sim, worst, failures, identical: failures.length === 0 } as never, `${scene.name}-sequence.json`);
    }
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
