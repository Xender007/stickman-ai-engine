/** Part 1 of "Floor 10: 14 Days". Usage: tsx clips/zombie-break/render.mts stills 10,100 | video [--scale 0.5]
 *  Always renders on the NVIDIA GPU through ANGLE/Vulkan (never the software or Intel path). */
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const [mode = 'stills', arg] = process.argv.slice(2);
const scaleArg = process.argv.indexOf('--scale');
const scale = scaleArg >= 0 ? Number(process.argv[scaleArg + 1]) : 1;
const out = path.resolve('out/zombie-break');
mkdirSync(out, { recursive: true });

const capFile = path.join(out, 'captions.json');
const captions = existsSync(capFile) ? JSON.parse(readFileSync(capFile, 'utf8')) : [[], [], [], [], [], []];
const inputProps = { captions, overlays: true };
const chromiumOptions = { gl: 'vulkan' } as const;

const serveUrl = await bundle({ entryPoint: path.resolve('clips/zombie-break/Part1.tsx') });
const composition = await selectComposition({ serveUrl, id: 'Part1', inputProps, chromiumOptions });

if (mode === 'stills') {
  for (const f of (arg ?? '10,100,200').split(',').map(Number)) {
    const output = path.join(out, `still-${f}.png`);
    await renderStill({ composition, serveUrl, output, frame: f, inputProps, chromiumOptions, imageFormat: 'png' });
    console.log(output);
  }
} else {
  const file = path.join(out, scale === 1 ? 'part1-silent.mp4' : 'part1-silent.preview.mp4');
  const t0 = Date.now();
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: file, inputProps, chromiumOptions, scale, crf: 18, overwrite: true });
  console.log(JSON.stringify({ file, seconds: (Date.now() - t0) / 1000 }));
}
