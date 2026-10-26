/** Layout lint for the 16:9 chapters: renders each scene at several moments in headless Chrome and measures every visible text.
 *  Flags (1) text outside the frame, (2) non-caption text in the caption band (y > SAFE), (3) two visible texts overlapping.
 *  usage: npx tsx clips/wide/check.mts <chapter|all> [samplesPerScene=10]   exit code 1 when problems are found */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import puppeteer from 'puppeteer-core';
import { frame, sceneStarts } from './engine.tsx';

const SAFE = 590, W = 1280, H = 720;
const arg = process.argv[2] ?? 'all';
const chapters = arg === 'all' ? [1, 2, 3, 4, 5, 6] : [Number(arg)];
const samples = Number(process.argv[3] ?? 10);
const chrome = process.env.HF_CHROME ?? 'C:/Users/supro/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe';
if (!existsSync(chrome)) throw new Error(`Chrome not found at ${chrome}; set HF_CHROME`);
const font = path.resolve('clips/store-ch1/assets/PatrickHand-Regular.ttf').replace(/\\/g, '/');
const tmp = path.resolve('scratch/check'); mkdirSync(tmp, { recursive: true });

type Box = { text: string; x: number; y: number; w: number; h: number; o: number; entering?: boolean };
const measure = () => {
  const out: Box[] = [];
  const k = (document.querySelector('svg') as SVGElement).getBoundingClientRect().width / 1280;
  document.querySelectorAll('text').forEach((el) => {
    const text = (el.textContent ?? '').trim();
    const under = !!el.closest('[data-under]'), entering = !!el.closest('[data-enter]');
    if (under) return;
    if (!text || text === '.') return;
    let o = 1;
    for (let n: Element | null = el; n && n.tagName.toLowerCase() !== 'html'; n = n.parentElement) { const v = parseFloat(getComputedStyle(n).opacity); if (!Number.isNaN(v)) o *= v; }
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (o < 0.25 || fs < 8) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2) return;
    out.push({ text, x: r.left / k, y: r.top / k, w: r.width / k, h: r.height / k, o, entering });
  });
  return out;
};

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
let problems = 0;
for (const n of chapters) {
  const { ch } = await import(`./chapters/ch${n}.tsx`);
  const { total, sentences } = JSON.parse(readFileSync(`clips/w-ch${n}/assets/sentences.json`, 'utf8'));
  const starts = sceneStarts(ch, sentences);
  const hits = new Map<string, { msg: string; n: number }>();
  const report = (msg: string, key: string) => { const h = hits.get(key); if (h) h.n++; else hits.set(key, { msg, n: 1 }); };
  for (let i = 0; i < ch.scenes.length; i++) {
    const a = starts[i], b = i + 1 < starts.length ? starts[i + 1] : total;
    for (let k = 0; k < samples; k++) {
      const t = a + (b - a) * (0.08 + (0.84 * k) / Math.max(1, samples - 1));
      const svg = renderToStaticMarkup(frame(ch, sentences, total, t, starts));
      const file = path.join(tmp, 'frame.html');
      writeFileSync(file, `<!doctype html><html><head><style>@font-face{font-family:'Patrick Hand';src:url('file:///${font}')}html,body{margin:0;background:#000}svg{display:block}</style></head><body>${svg}</body></html>`);
      await page.goto('file:///' + file.replace(/\\/g, '/'));
      await page.evaluate(() => (document as any).fonts.ready);
      const boxes: Box[] = await page.evaluate(measure);
      const where = `scene ${i} (sentence ${ch.scenes[i].at}) at ${t.toFixed(1)}s`;
      for (const bx of boxes) {
        if (bx.entering) continue;
        if (bx.x < -2 || bx.x + bx.w > W + 2 || bx.y < -2) report(`${where}: "${bx.text}" runs off the frame`, `off-${i}-${bx.text}`);
        else if (bx.y + bx.h > SAFE + 6) report(`${where}: "${bx.text}" sits in the caption band (bottom ${Math.round(bx.y + bx.h)} > ${SAFE})`, `band-${i}-${bx.text}`);
      }
      for (let p = 0; p < boxes.length; p++) for (let q = p + 1; q < boxes.length; q++) {
        const A = boxes[p], B = boxes[q];
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
        if (ox > 6 && oy > 0.4 * Math.min(A.h, B.h) && A.text.length > 2 && B.text.length > 2) report(`${where}: "${A.text}" overlaps "${B.text}"`, `ov-${i}-${A.text}-${B.text}`);
      }
    }
  }
  for (const h of hits.values()) if (h.n >= 2) { problems++; console.log(`ch${n}  ${h.msg}`); }
}
await browser.close();
console.log(problems ? `${problems} layout problem(s)` : 'layout check passed: no text off-frame, in the caption band, or overlapping');
process.exit(problems ? 1 : 0);
