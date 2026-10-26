/** Builds clips/store-ch1/index.html (Hyperframes composition) from sentences/words + the scene bundle. */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildSync } from 'esbuild';

buildSync({ entryPoints: ['clips/store-ch1/entry.tsx'], bundle: true, format: 'iife', platform: 'browser', outfile: 'clips/store-ch1/assets/scenes.js',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, minify: true, logLevel: 'error' });

const sj = JSON.parse(readFileSync('clips/store-ch1/assets/sentences.json', 'utf8')) as { engine: string; total: number; sentences: { text: string; start: number; end: number }[] };
const words = JSON.parse(readFileSync('clips/store-ch1/assets/words.json', 'utf8')) as { w: string; start: number; end: number }[];
const total = Math.ceil(sj.total * 10) / 10;

// one word at a time, shown until the next word starts
const caps = words.map((w, i) => {
  const next = words[i + 1];
  const start = w.start, end = Math.max(start + 0.16, next ? Math.min(next.start, start + 1.6) : w.end);
  return { text: w.w.replace(/^["“]|["”.,;!?…]+$/g, '').toUpperCase(), start, dur: end - start };
}).filter((c) => c.text);

const capEls = caps.map((c, i) => `<div class="clip cap" id="w${i}" data-start="${c.start.toFixed(3)}" data-duration="${c.dur.toFixed(3)}" data-track-index="10">${c.text.replace(/&/g, '&amp;')}</div>`);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Dead Hours: 28 Days Locked Inside a Grocery Store, Chapter 1</title>
<style>
  @font-face{font-family:'Anton';src:url('assets/Anton-Regular.ttf') format('truetype')}
  @font-face{font-family:'PatrickHand';src:url('assets/PatrickHand-Regular.ttf') format('truetype')}
  html,body{margin:0;background:#000}
  #stage{position:relative;width:720px;height:1280px;overflow:hidden;background:#000;font-family:'PatrickHand',sans-serif}
  #scene{position:absolute;inset:0}
  .cap{position:absolute;left:0;top:928px;width:720px;text-align:center;font-size:92px;line-height:96px;color:#1b1410;letter-spacing:3px;
    -webkit-text-stroke:2px #1b1410;paint-order:stroke fill;text-shadow:0 0 6px rgba(255,255,255,.95),0 0 16px rgba(255,255,255,.7),0 0 34px rgba(255,236,200,.55)}
</style></head>
<body>
<div id="stage" data-composition-id="ch1" data-start="0" data-fps="30" data-width="720" data-height="1280" data-duration="${total}">
  <div id="scene"></div>
  ${capEls.join('\n  ')}
  <audio id="narr" data-start="0" data-duration="${total}" data-track-index="20" data-volume="1" src="assets/narration.wav"></audio>
  <audio id="score" data-start="0" data-duration="${total}" data-track-index="21" data-volume="0.5" src="assets/score.wav"></audio>
  <script src="assets/gsap.min.js"></script>
  <script src="assets/scenes.js"></script>
  <script>
    const sents = ${JSON.stringify(sj.sentences)};
    const total = ${total};
    const starts = window.sceneStarts(sents);
    const draw = window.mountScenes(document.getElementById('scene'), starts);
    const tl = gsap.timeline({ paused: true });
    // GSAP clock: redraws the scene for the current time. Runs before and after the channel tweens (seek-order safe).
    const clockTween = (o) => tl.to(o, { t: total, duration: total, ease: 'none', modifiers: { t: (v) => { draw(v); return v; } } }, 0);
    clockTween({ t: 0 });
    window.buildChoreo(tl, sents, total);
    clockTween({ t: 0 });
    draw(0);
    // captions: each word pops in
    ${JSON.stringify(caps.map((_, i) => 'w' + i))}.forEach((id) => {
      const el = document.getElementById(id), s = parseFloat(el.dataset.start);
      tl.fromTo(el, { opacity: 0, scale: 0.78, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.1, ease: 'back.out(2.4)', immediateRender: false }, s);
    });
    window.__timelines = window.__timelines || {};
    window.__timelines.ch1 = tl;
  </script>
</div></body></html>
`;
writeFileSync('clips/store-ch1/index.html', html);
console.log(`built index.html: ${total}s, ${caps.length} caption words`);
