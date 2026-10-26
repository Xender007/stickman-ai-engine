/** Chapter 1 score + sound effects (synthesised), timed from assets/sentences.json -> assets/score.wav */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('clips/store-ch1/assets');
const { total, sentences } = JSON.parse(readFileSync(path.join(dir, 'sentences.json'), 'utf8')) as { total: number; sentences: { start: number; end: number }[] };
const sS = (i: number) => sentences[i].start, sE = (i: number) => sentences[i].end;
const SR = 44100;
const mix = new Float32Array(Math.ceil(total * SR));
const add = (b: Float32Array, at: number, g: number) => { const o = Math.floor(at * SR); for (let i = 0; i < b.length && o + i < mix.length; i++) mix[o + i] += b[i] * g; };
let seed = 99;
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
const thud = (t: number, g = 0.9) => add(sum(tone(0.3, 90, 45, 11), noise(0.1, 0.1, 22)), t, g);
const step = (t: number, g = 0.25) => add(noise(0.06, 0.25, 18, 0.03), t, g);

// bed: low pad on a slow minor drift + faint pulse
for (let i = 0; i < mix.length; i++) {
  const t = i / SR, lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.05 * t);
  mix[i] += (Math.sin(2 * Math.PI * 55 * t) * 0.35 + Math.sin(2 * Math.PI * 82.41 * t + Math.sin(t * 0.2)) * 0.2 + Math.sin(2 * Math.PI * 130.8 * t) * 0.07) * 0.16 * lfo;
}
for (let t = 4; t < total - 2; t += 7.5) add(tone(3.4, [110, 98, 82.4, 98][Math.floor(t / 7.5) % 4], 0, 1.4, 1), t, 0.07);
// freezers hum until the power dies
const dies = sE(36) - 0.45;
for (let i = 0; i < Math.floor(dies * SR); i++) mix[i] += Math.sin(2 * Math.PI * 100 * (i / SR)) * 0.018;

// 1 doors: sensor ding, slide hiss
add(sum(tone(0.25, 880, 880, 8), tone(0.3, 660, 660, 8)), 0.55, 0.15); add(noise(0.7, 0.4, 3, 0.05), 0.6, 0.18);
// 3 far doors open
add(noise(0.6, 0.4, 3, 0.05), sS(3) + 3.6, 0.1);
// 4 milk + cigarettes land
thud(sS(5) + 0.35, 0.5); thud(sS(5) + 0.65, 0.5);
// 5 doors bump closed on him
[0.35, 1.05, 1.75].forEach((o) => add(noise(0.5, 0.35, 4, 0.04), sS(7) - 0.1 + o, 0.12));
// 6 cart push, lock click, three bumps on the glass
for (let t = sS(8) + 1.0; t < sS(8) + 3.3; t += 0.18) step(t, 0.12);
add(sum(tone(0.05, 2400, 1800, 30), tone(0.06, 1500, 1200, 30)), sE(8) + 0.05, 0.3);
[0.45, 1.5, 2.3].forEach((o) => thud(sS(9) + o + 0.05, 1.0));
// 7 camera room tick
for (let t = sS(10) + 0.4; t < sE(11); t += 0.5) add(tone(0.03, 1800, 1500, 40), t, 0.04);
// 8 keys jingle, Dana's footsteps, door
for (let k = 0; k < 8; k++) add(tone(0.12, 3200 + rand() * 1600, 2600, 18), sS(12) + 0.4 + k * 0.07, 0.1);
for (let t = sS(16) + 0.3; t < sS(16) + 2.2; t += 0.3) step(t, 0.2);
add(sum(noise(0.5, 0.2, 5), tone(0.3, 120, 70, 9)), sS(16) + 2.0, 0.3);
// 10 card slam
thud(sS(19) + 0.1, 0.7);
// 11 grid ticks
for (let k = 0; k < 28; k++) add(tone(0.02, 2500, 2400, 50), sS(20) + k * 0.09, 0.04);
add(tone(0.5, 440, 440, 5, 1), sS(22) + 2.4, 0.12);
// 12 crank ratchet
for (let t = starts12(); t < sE(23); t += 0.22) add(sum(tone(0.03, 1200, 900, 40), noise(0.02, 0.5, 30, 0.1)), t, 0.08);
function starts12() { return sS(23) - 0.1; }
// 13 freight train rumble + slam
{
  const a = sS(25) - 0.1, len = 2.6, n = Math.floor(len * SR), b = new Float32Array(n); let y = 0;
  for (let i = 0; i < n; i++) { y += 0.04 * (rand() * 2 - y); const k = Math.pow(i / n, 1.8); b[i] = (y * 1.6 + Math.sin(2 * Math.PI * (38 + 18 * k) * (i / SR)) * 0.5) * (0.2 + 0.8 * k); }
  add(b, a, 0.55); thud(a + len, 1.0); add(noise(0.8, 0.5, 2.5, 0.05), a + len, 0.2);
}
// 14 walking
for (let t = sS(28) + 0.2; t < sE(29); t += 0.4) step(t, 0.18);
// 15 can reveal ticks
for (let k = 0; k < 20; k++) add(tone(0.04, 700 + k * 25, 700, 30), sS(31) - 0.2 + k * 0.07, 0.06);
// 18 power dies
add(sum(tone(0.9, 200, 40, 3), noise(0.5, 0.15, 5)), dies + 0.35, 0.45);
// 19 the clunk
thud(sE(38) - 0.5, 1.0); add(noise(0.4, 0.3, 6, 0.03), sE(38) - 0.45, 0.2);
// 20 running footsteps
for (let t = sS(41) + 0.2; t < sE(41) + 0.2; t += 0.21) step(t, 0.3);

let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
const pcm = Buffer.alloc(mix.length * 2);
for (let i = 0; i < mix.length; i++) pcm.writeInt16LE(Math.round(Math.tanh((mix[i] / peak) * 1.2) * 30000), i * 2);
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
writeFileSync(path.join(dir, 'score.wav'), Buffer.concat([hdr, pcm]));
console.log('score written', total.toFixed(1));
