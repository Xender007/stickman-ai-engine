/** Quick contact sheets of a chapter's scenes without rendering video: SVG -> PNG with sharp.
 *  usage: npx tsx clips/store/preview.mts <chapter> [fraction=0.6] [firstScene] [lastScene] */
import { readFileSync, writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { frame, sceneStarts } from './engine.tsx';

const N = Number(process.argv[2]);
const frac = Number(process.argv[3] ?? 0.6);
const { ch } = await import(`./chapters/ch${N}.tsx`);
const { total, sentences } = JSON.parse(readFileSync(`clips/v3-ch${N}/assets/sentences.json`, 'utf8'));
const starts = sceneStarts(ch, sentences);
const from = Number(process.argv[4] ?? 0), to = Number(process.argv[5] ?? ch.scenes.length - 1);
const TW = 270, TH = 480, COLS = 4, ROWS = 3;
const tiles: { input: Buffer; left: number; top: number }[][] = [];
let page: { input: Buffer; left: number; top: number }[] = [];
for (let i = from; i <= to; i++) {
  const a = starts[i], b = i + 1 < starts.length ? starts[i + 1] : total;
  const t = a + (b - a) * frac;
  let svg: string;
  try { svg = renderToStaticMarkup(frame(ch, sentences, total, t, starts)); } catch (e) { console.error(`scene ${i} (at ${ch.scenes[i].at}) failed:`, (e as Error).message); continue; }
  const png = await sharp(Buffer.from(svg)).resize(TW, TH).png().toBuffer();
  const k = page.length;
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="26"><rect width="${TW}" height="26" fill="#000" opacity=".7"/><text x="6" y="19" font-size="16" fill="#fff" font-family="Arial">${i}  s${ch.scenes[i].at}  ${t.toFixed(1)}s</text></svg>`);
  const withLabel = await sharp(png).composite([{ input: label, left: 0, top: 0 }]).png().toBuffer();
  page.push({ input: withLabel, left: (k % COLS) * TW, top: Math.floor(k / COLS) * TH });
  if (page.length === COLS * ROWS) { tiles.push(page); page = []; }
}
if (page.length) tiles.push(page);
for (let p = 0; p < tiles.length; p++) {
  const out = `scratch/preview-ch${N}-${p + 1}.png`;
  const buf = await sharp({ create: { width: TW * COLS, height: TH * ROWS, channels: 3, background: '#222' } }).composite(tiles[p]).png().toBuffer();
  writeFileSync(out, buf);
  console.log(out);
}
