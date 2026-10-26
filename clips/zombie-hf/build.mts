/** Builds the Hyperframes composition (clips/zombie-hf/index.html) from captions.json + the scenes bundle.
 *  Text style follows the user's reference reel: condensed ALL-CAPS captions in the top third, 2-6 words per cut,
 *  one key word per beat slammed in huge and red below the caption, a small "● DAY n" stamp on top. */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildSync } from 'esbuild';

buildSync({ entryPoints: ['clips/zombie-hf/scenes-entry.tsx'], bundle: true, format: 'iife', platform: 'browser', outfile: 'clips/zombie-hf/assets/scenes.js',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, minify: true, logLevel: 'error' });

const { engine, captions } = JSON.parse(readFileSync('clips/zombie-hf/assets/captions.json', 'utf8')) as { engine: string; captions: { text: string; start: number; end: number }[][] };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** 2-6 word phrases: split on commas/ellipses/sentence ends, then halve anything longer than 6 words. */
function chunk(sentence: string): string[] {
  let parts = sentence.match(/[^,;.?!]+[,;.?!]?/g)?.map((p) => p.trim()).filter(Boolean) ?? [sentence];
  parts = parts.flatMap((p) => {
    const w = p.split(/\s+/);
    if (w.length <= 6) return [p];
    const h = Math.ceil(w.length / 2);
    return [w.slice(0, h).join(' ') + '…', w.slice(h).join(' ')];
  });
  const merged: string[] = [];
  for (const p of parts) {
    if (merged.length && p.split(/\s+/).length < 2) merged[merged.length - 1] += ' ' + p; else merged.push(p);
  }
  return merged;
}

type Cap = { text: string; start: number; dur: number; clip: number };
const caps: Cap[] = [];
captions.forEach((cl, i) => cl.forEach((s) => {
  const parts = chunk(s.text);
  const total = parts.reduce((a, p) => a + p.length, 0);
  let t = s.start;
  parts.forEach((p) => {
    const d = ((s.end - s.start) * p.length) / total;
    caps.push({ text: p.replace(/[.,]$/, (m) => (m === '.' ? '.' : '')), start: i * 10 + t, dur: Math.max(0.45, d), clip: i });
    t += d;
  });
}));

// one big red word per beat (the first phrase that contains it)
const KEYWORDS = ['silent', 'scratch', 'moaning', 'rationed', 'empty', 'counting'];
const hls: { text: string; start: number; dur: number }[] = [{ text: "WHO'S KNOCKING?", start: 0.2, dur: 1.9 }];
KEYWORDS.forEach((kw, i) => {
  const c = caps.find((x) => x.clip === i && x.text.toLowerCase().includes(kw));
  if (c) hls.push({ text: kw.toUpperCase() + (/[.?!…]$/.test(c.text) ? c.text.slice(-1) : '.'), start: c.start, dur: Math.max(1.0, c.dur + 0.3) });
});
hls.forEach((h) => { h.dur = Math.min(h.dur, 58.7 - h.start); }); // nothing may overlap the end card
hls.push({ text: 'PART 2 →', start: 58.8, dur: 1.2 });

const stamps = [
  { text: 'FLOOR 10', start: 0, dur: 3 }, { text: 'DAY 1', start: 3, dur: 27 },
  { text: 'DAY 2', start: 30, dur: 10 }, { text: 'NIGHT 3', start: 40, dur: 20 },
];

const capEls = caps.map((c, i) => `<div class="clip cap" id="cap-${i}" style="font-size:${c.text.length > 24 ? 66 : 80}px;line-height:${c.text.length > 24 ? 70 : 84}px" data-start="${c.start.toFixed(3)}" data-duration="${c.dur.toFixed(3)}" data-track-index="10">${esc(c.text.toUpperCase())}</div>`);
const hlEls = hls.map((h, i) => {
  const size = Math.max(96, Math.min(230, Math.round(640 / (h.text.length * 0.44))));
  return `<div class="clip hl" id="hl-${i}" style="font-size:${size}px;line-height:${size}px" data-start="${h.start.toFixed(3)}" data-duration="${h.dur.toFixed(3)}" data-track-index="11">${esc(h.text)}</div>`;
});
const stampEls = stamps.map((s, i) => `<div class="clip stamp" id="stamp-${i}" data-start="${s.start}" data-duration="${s.dur}" data-track-index="3"><i class="dot"></i>${esc(s.text)}</div>`);
const narr = captions.map((_, i) => `<audio id="narr-${i}" data-start="${i * 10 + 0.35}" data-duration="9.4" data-track-index="${20 + i}" data-volume="1" src="assets/narr-${i}.wav"></audio>`);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Floor 10: 14 Days, Part 1</title>
<style>
  @font-face{font-family:'Anton';src:url('assets/Anton-Regular.ttf') format('truetype')}
  html,body{margin:0;background:#000}
  #stage{position:relative;width:720px;height:1280px;overflow:hidden;background:#000;font-family:'Anton',sans-serif}
  #scene{position:absolute;inset:0}
  .cap,.hl,.stamp,#tag{position:absolute;left:0;width:720px;text-align:center;text-transform:uppercase;color:#fff}
  .cap{top:150px;font-size:80px;line-height:84px;padding:0 44px;box-sizing:border-box;letter-spacing:1px;text-shadow:0 3px 14px rgba(0,0,0,.7),0 0 2px rgba(0,0,0,.8)}
  .hl{top:340px;color:#e5161d;letter-spacing:1px;text-shadow:0 0 30px rgba(255,40,40,.55),0 6px 0 rgba(0,0,0,.35),0 10px 30px rgba(0,0,0,.6)}
  .stamp{top:84px;font-size:34px;line-height:36px;letter-spacing:3px;text-shadow:0 2px 8px rgba(0,0,0,.7)}
  .dot{display:inline-block;width:14px;height:14px;border-radius:50%;background:#ff2a2a;margin-right:12px;vertical-align:2px;box-shadow:0 0 10px #ff2a2a}
  #tag{left:470px;top:34px;width:220px;font-size:26px;letter-spacing:2px;text-align:right;opacity:.85;text-shadow:0 2px 8px rgba(0,0,0,.7)}
</style></head>
<body>
<div id="stage" data-composition-id="part1" data-start="0" data-fps="60" data-motion-blur="on" data-motion-blur-shutter="180" data-motion-blur-samples="4" data-width="720" data-height="1280" data-duration="60">
  <div id="scene"></div>
  <div id="tag" class="clip" data-start="0" data-duration="60" data-track-index="4">PART 1/5</div>
  ${stampEls.join('\n  ')}
  ${capEls.join('\n  ')}
  ${hlEls.join('\n  ')}
  ${narr.join('\n  ')}
  <audio id="score" data-start="0" data-duration="60" data-track-index="30" data-volume="0.55" src="assets/score.wav"></audio>
  <script src="assets/gsap.min.js"></script>
  <script src="assets/scenes.js"></script>
  <script>
    const draw = window.mountScenes(document.getElementById('scene'));
    const tl = gsap.timeline({ paused: true });
    // The scene is redrawn from a GSAP-driven clock. It runs both before and after the channel tweens, so the last
    // draw always sees fresh values whether the timeline is seeked forwards or backwards.
    const clockA = { f: 0 }, clockB = { f: 0 };
    const clockTween = (o) => tl.to(o, { f: 1440, duration: 60, ease: 'none', modifiers: { f: (v) => { draw(v); return v; } } }, 0);
    clockTween(clockA);
    window.buildChoreo(tl);        // every scene channel: cameras, doors, chain, chair, sun, candle, flashlight, shakes
    clockTween(clockB);
    draw(0);

    const num = (el, k) => parseFloat(el.dataset[k]);
    // caption: quick pop in, ghost-fade out (blur + drift), like the reference reel
    ${JSON.stringify(caps.map((_, i) => 'cap-' + i))}.forEach((id) => {
      const el = document.getElementById(id), s = num(el, 'start'), d = num(el, 'duration');
      tl.fromTo(el, { opacity: 0, y: 22, scale: 0.86, filter: 'blur(7px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.16, ease: 'back.out(2.2)', immediateRender: false }, s);
      tl.to(el, { opacity: 0, y: -12, scale: 1.05, filter: 'blur(9px)', duration: 0.18, ease: 'power2.in', immediateRender: false }, s + d - 0.18);
    });
    // highlight word: slams in big, rings, then fades out as a blurred ghost
    ${JSON.stringify(hls.map((_, i) => 'hl-' + i))}.forEach((id) => {
      const el = document.getElementById(id), s = num(el, 'start'), d = num(el, 'duration');
      tl.fromTo(el, { opacity: 0, scale: 2.4, y: -30, filter: 'blur(14px)' }, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.22, ease: 'expo.out', immediateRender: false }, s);
      tl.fromTo(el, { x: 0 }, { keyframes: [{ x: 9, duration: 0.04 }, { x: -7, duration: 0.04 }, { x: 4, duration: 0.04 }, { x: 0, duration: 0.05 }], immediateRender: false }, s + 0.2);
      tl.to(el, { opacity: 0, scale: 1.16, filter: 'blur(16px)', duration: 0.34, ease: 'power2.in', immediateRender: false }, s + d - 0.34);
    });
    // stamp: rolls in from above, blinking recording dot
    ${JSON.stringify(stamps.map((_, i) => 'stamp-' + i))}.forEach((id) => {
      const el = document.getElementById(id), s = num(el, 'start'), d = num(el, 'duration');
      tl.fromTo(el, { opacity: 0, y: -22 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, s);
      tl.to(el, { opacity: 0, y: 14, duration: 0.2, ease: 'power2.in', immediateRender: false }, s + d - 0.2);
      tl.fromTo(el.querySelector('.dot'), { opacity: 1 }, { opacity: 0.2, duration: 0.5, yoyo: true, repeat: Math.max(1, Math.floor(d / 0.5) - 1), ease: 'sine.inOut', immediateRender: false }, s);
    });
    window.__timelines = window.__timelines || {};
    window.__timelines.part1 = tl;
  </script>
</div></body></html>
`;
writeFileSync('clips/zombie-hf/index.html', html);
console.log(`built index.html (narration: ${engine}, ${caps.length} caption cuts, ${hls.length} highlights)`);
