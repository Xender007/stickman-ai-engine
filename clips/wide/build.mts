/** Builds clips/store-chN/index.html (Hyperframes composition) for chapters 2-6.
 *  usage: npx tsx clips/store/build.mts <chapter 2-6> */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const N = Number(process.argv[2]);
const dir = `clips/w-ch${N}`;
const root = path.resolve('clips/wide');

buildSync({
  stdin: {
    contents: `import { mountChapter } from './engine.tsx';
import { ch } from './chapters/ch${N}.tsx';
window.mountChapter = (el, sents, total) => mountChapter(el, ch, sents, total);`,
    resolveDir: root, sourcefile: 'entry.tsx', loader: 'tsx',
  },
  bundle: true, format: 'iife', platform: 'browser', outfile: `${dir}/assets/scenes.js`,
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, minify: true, logLevel: 'error',
});

const sj = JSON.parse(readFileSync(`${dir}/assets/sentences.json`, 'utf8')) as { total: number; sentences: { text: string; start: number; end: number }[] };
const words = JSON.parse(readFileSync(`${dir}/assets/words.json`, 'utf8')) as { w: string; start: number; end: number }[];
const total = Math.ceil(sj.total * 10) / 10;

// one word at a time, shown until the next word starts
const caps = words.map((w, i) => {
  const next = words[i + 1];
  const start = w.start, end = Math.max(start + 0.16, next ? Math.min(next.start, start + 1.6) : w.end);
  return { text: w.w.replace(/^["“]|["”.,;:!?…]+$/g, '').toUpperCase(), start, dur: end - start };
}).filter((c) => c.text);
const capEls = caps.map((c, i) => `<div class="clip cap" id="w${i}" data-start="${c.start.toFixed(3)}" data-duration="${c.dur.toFixed(3)}" data-track-index="10">${c.text.replace(/&/g, '&amp;')}</div>`);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Dead Hours, Chapter ${N}</title>
<style>
  @font-face{font-family:'Anton';src:url('assets/Anton-Regular.ttf') format('truetype')}
  @font-face{font-family:'PatrickHand';src:url('assets/PatrickHand-Regular.ttf') format('truetype')}
  html,body{margin:0;background:#000}
  #stage{position:relative;width:1920px;height:1080px;overflow:hidden;background:#000;font-family:'PatrickHand',sans-serif}
  #scene{position:absolute;inset:0}
  .cap{position:absolute;left:0;top:927px;width:1920px;text-align:center;font-size:114px;line-height:126px;color:#fff;letter-spacing:4px;-webkit-text-stroke:4.5px #120c08;paint-order:stroke fill;text-shadow:0 3px 8px rgba(0,0,0,.85)}
</style></head>
<body>
<div id="stage" data-composition-id="ch${N}" data-start="0" data-fps="30" data-width="1920" data-height="1080" data-duration="${total}">
  <div id="scene"></div>
  ${capEls.join('\n  ')}
  <audio id="narr" data-start="0" data-duration="${total}" data-track-index="20" data-volume="1" src="assets/narration.wav"></audio>
  <audio id="score" data-start="0" data-duration="${total}" data-track-index="21" data-volume="0.5" src="assets/score.wav"></audio>
  <script src="assets/gsap.min.js"></script>
  <script src="assets/scenes.js"></script>
  <script>
    const sents = ${JSON.stringify(sj.sentences)};
    const total = ${total};
    const draw = window.mountChapter(document.getElementById('scene'), sents, total);
    const tl = gsap.timeline({ paused: true });
    const o = { t: 0 };
    tl.to(o, { t: total, duration: total, ease: 'none', modifiers: { t: (v) => { draw(v); return v; } } }, 0);
    draw(0);
    ${JSON.stringify(caps.map((_, i) => 'w' + i))}.forEach((id) => {
      const el = document.getElementById(id), s = parseFloat(el.dataset.start);
      tl.fromTo(el, { opacity: 0, scale: 0.78, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.1, ease: 'back.out(2.4)', immediateRender: false }, s);
    });
    window.__timelines = window.__timelines || {};
    window.__timelines.ch${N} = tl;
  </script>
</div></body></html>
`;
writeFileSync(`${dir}/index.html`, html);
console.log(`built ${dir}/index.html: ${total}s, ${caps.length} caption words`);
