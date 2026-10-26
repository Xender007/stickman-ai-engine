/** Score + synthesised sound effects for chapters 2-6: a low drone bed plus the cues listed in chapters/chN.tsx
 *  (sentence number, offset seconds, kind, amount), timed from assets/sentences.json -> assets/score.wav.
 *  usage: npx tsx clips/store/score.mts <chapter> */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const N = Number(process.argv[2]);
const dir = path.resolve(`clips/w-ch${N}/assets`);
// load the cue list from the chapter file without pulling in React scenes
const out = buildSync({
  stdin: { contents: `export { ch } from './chapters/ch${N}.tsx';`, resolveDir: path.resolve('clips/wide'), loader: 'tsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', logLevel: 'error',
}).outputFiles[0].text;
const m: any = { exports: {} };
new Function('module', 'exports', 'require', out)(m, m.exports, (id: string) => { throw new Error('require ' + id); });
const cues: [number, number, string, number?][] = m.exports.ch.cues;

const { total, sentences } = JSON.parse(readFileSync(path.join(dir, 'sentences.json'), 'utf8')) as { total: number; sentences: { start: number; end: number }[] };
const sS = (i: number) => sentences[Math.min(i, sentences.length - 1)].start;
const SR = 44100;
const mix = new Float32Array(Math.ceil(total * SR));
const add = (b: Float32Array, at: number, g: number) => { const o = Math.floor(at * SR); for (let i = 0; i < b.length && o + i < mix.length; i++) if (o + i >= 0) mix[o + i] += b[i] * g; };
let seed = 7 + N * 13;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
const env = (i: number, n: number, a = 0.004, d = 4) => Math.min(1, i / (a * SR)) * Math.exp((-d * i) / n);
const tone = (dur: number, f: number, f1 = f, d = 4, h = 0) => {
  const n = Math.floor(dur * SR), b = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { ph += (2 * Math.PI * (f + (f1 - f) * (i / n))) / SR; b[i] = (Math.sin(ph) + h * 0.5 * Math.sin(2 * ph)) * env(i, n, 0.004, d); }
  return b;
};
const noise = (dur: number, lp = 0.2, d = 5, hp = 0) => {
  const n = Math.floor(dur * SR), b = new Float32Array(n); let y = 0, yh = 0;
  for (let i = 0; i < n; i++) { y += lp * (rand() * 2 - y); yh += hp * (y - yh); b[i] = (hp ? y - yh : y) * env(i, n, 0.002, d); }
  return b;
};
const sum = (...bs: Float32Array[]) => { const r = new Float32Array(Math.max(...bs.map((b) => b.length))); bs.forEach((b) => b.forEach((v, i) => (r[i] += v))); return r; };

// bed: low pad on a slow drift, a different root per chapter
const root = [55, 49, 55, 46.25, 51.9, 55][N - 1] ?? 55;
for (let i = 0; i < mix.length; i++) {
  const t = i / SR, lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.05 * t);
  mix[i] += (Math.sin(2 * Math.PI * root * t) * 0.35 + Math.sin(2 * Math.PI * root * 1.5 * t + Math.sin(t * 0.2)) * 0.2 + Math.sin(2 * Math.PI * root * 2.4 * t) * 0.07) * 0.16 * lfo;
}
for (let t = 4; t < total - 2; t += 7.5) add(tone(3.4, [110, 98, 82.4, 98][Math.floor(t / 7.5) % 4] * (root / 55), 0, 1.4, 1), t, 0.07);

const kinds: Record<string, (t: number, a: number) => void> = {
  thud: (t, a) => add(sum(tone(0.3, 90, 45, 11), noise(0.1, 0.1, 22)), t, 0.9 * a),
  slam: (t, a) => { add(sum(tone(0.5, 70, 35, 8), noise(0.25, 0.15, 12)), t, 1.0 * a); add(noise(0.7, 0.4, 3, 0.05), t, 0.15 * a); },
  knock: (t, a) => add(sum(tone(0.12, 160, 90, 25), noise(0.04, 0.2, 40)), t, 0.8 * a),
  click: (t, a) => add(sum(tone(0.05, 2400, 1800, 30), tone(0.06, 1500, 1200, 30)), t, 0.3 * a),
  snap: (t, a) => add(sum(tone(0.04, 3000, 800, 40), noise(0.05, 0.6, 40, 0.2)), t, 0.5 * a),
  ding: (t, a) => add(sum(tone(0.5, 880, 880, 6), tone(0.5, 1320, 1320, 7)), t, 0.18 * a),
  creak: (t, a) => add(sum(tone(1.4, 140, 210, 1.2, 1), noise(1.4, 0.1, 1.5, 0.01)), t, 0.2 * a),
  hiss: (t, a) => add(noise(0.9, 0.4, 3, 0.05), t, 0.14 * a),
  whoosh: (t, a) => add(noise(0.7, 0.12, 2.2, 0.01), t, 0.3 * a),
  clunk: (t, a) => { add(sum(tone(0.3, 110, 60, 9), noise(0.08, 0.3, 25)), t, 0.8 * a); add(noise(0.3, 0.3, 6, 0.03), t, 0.2 * a); },
  rumble: (t, a) => { const len = 2.4 * (a || 1), n = Math.floor(len * SR), b = new Float32Array(n); let y = 0; for (let i = 0; i < n; i++) { y += 0.04 * (rand() * 2 - y); const k = Math.pow(i / n, 1.4); b[i] = (y * 1.6 + Math.sin(2 * Math.PI * (38 + 18 * k) * (i / SR)) * 0.5) * (0.2 + 0.8 * k); } add(b, t, 0.5); },
  surge: (t, a) => { add(tone(1.6, 60, 480, 0.9, 1), t, 0.2 * a); add(noise(1.2, 0.2, 2, 0.02), t, 0.12 * a); },
  powerdown: (t, a) => add(sum(tone(0.9, 200, 40, 3), noise(0.5, 0.15, 5)), t, 0.45 * a),
  sting: (t, a) => { add(sum(tone(2.4, 220, 220, 1.6, 1), tone(2.4, 277, 277, 1.6, 1), tone(2.4, 330, 330, 1.6, 1)), t, 0.14 * a); add(sum(tone(0.3, 90, 45, 11), noise(0.1, 0.1, 22)), t, 0.8 * a); },
  clink: (t, a) => add(sum(tone(0.25, 2600, 2600, 14), tone(0.25, 3900, 3900, 18)), t, 0.08 * a),
  engine: (t, a) => { const len = Math.max(1, a), n = Math.floor(len * SR), b = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / SR; b[i] = (Math.sin(2 * Math.PI * 52 * x) + 0.5 * Math.sin(2 * Math.PI * 104 * x + Math.sin(x * 40))) * Math.min(1, i / (0.3 * SR), (n - i) / (0.4 * SR)); } add(b, t, 0.16); },
  // sequences: `a` seconds long
  steps: (t, a) => { for (let x = 0; x < (a || 2); x += 0.4) add(noise(0.06, 0.25, 18, 0.03), t + x, 0.18); },
  run: (t, a) => { for (let x = 0; x < (a || 2); x += 0.21) add(noise(0.06, 0.25, 18, 0.03), t + x, 0.3); },
  scratch: (t, a) => { for (let x = 0; x < (a || 2); x += 0.13) add(sum(noise(0.08, 0.5, 14, 0.2), tone(0.06, 2800 + rand() * 900, 2200, 30)), t + x, 0.08); },
  ratchet: (t, a) => { for (let x = 0; x < (a || 2); x += 0.22) add(sum(tone(0.03, 1200, 900, 40), noise(0.02, 0.5, 30, 0.1)), t + x, 0.08); },
  alarm: (t, a) => { for (let x = 0; x < (a || 2); x += 0.08) add(sum(tone(0.05, 3100, 3100, 14), tone(0.05, 2700, 2700, 14)), t + x, 0.1 * (0.5 + 0.5 * ((Math.floor(x / 0.08) % 2)))); },
  moan: (t, a) => { const len = a || 3, n = Math.floor(len * SR), b = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / SR; b[i] = Math.sin(2 * Math.PI * (95 + 12 * Math.sin(x * 2.1)) * x + Math.sin(x * 5)) * Math.min(1, i / (0.6 * SR), (n - i) / (0.8 * SR)); } add(b, t, 0.12); },
  music: (t, a) => { const notes = [262, 330, 392, 330, 294, 349, 440, 349]; for (let x = 0; x < (a || 6); x += 0.5) add(tone(0.45, notes[Math.floor(x / 0.5) % notes.length], 0, 5, 1), t + x, 0.1); },
  gas: (t, a) => add(noise(a || 2, 0.1, 0.8, 0.02), t, 0.1),
  drip: (t, a) => add(sum(tone(0.12, 1800, 700, 28), tone(0.1, 900, 400, 30)), t, 0.2 * a),
  toot: (t, a) => add(sum(tone(0.5, 420, 420, 3, 1), tone(0.5, 530, 530, 3, 1)), t, 0.14 * a),
};
for (const [si, off, kind, a] of cues) {
  const f = kinds[kind];
  if (!f) throw new Error(`unknown cue kind ${kind}`);
  f(sS(si) + off, a ?? 1);
}

let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
const pcm = Buffer.alloc(mix.length * 2);
for (let i = 0; i < mix.length; i++) pcm.writeInt16LE(Math.round(Math.tanh((mix[i] / peak) * 1.2) * 30000), i * 2);
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
writeFileSync(path.join(dir, 'score.wav'), Buffer.concat([hdr, pcm]));
console.log(`score written ch${N}: ${total.toFixed(1)}s, ${cues.length} cues`);
