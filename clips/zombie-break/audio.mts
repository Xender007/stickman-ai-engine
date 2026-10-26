/** Narration (Windows SAPI, male voice) + synthesized score and SFX -> out/zombie-break/part1-audio.wav and captions.json */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FFMPEG_DIR = 'C:\\Users\\supro\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin';
const FFMPEG = path.join(FFMPEG_DIR, 'ffmpeg.exe');
const FFPROBE = path.join(FFMPEG_DIR, 'ffprobe.exe');
const out = path.resolve('out/zombie-break');
mkdirSync(out, { recursive: true });
const SR = 44100, DUR = 60;

const NARRATION = [
  "He's alone on floor ten. So who keeps knocking? Day one. The city screamed for six minutes. Then it went silent.",
  "Everyone thinks the stairs are the safest escape. They're not. Halfway up, glass tore through his sleeve. Just a scratch, he thought.",
  'Apartment 10-C. He chained the door and jammed a chair under the handle. The stairs above were sealed. Below him, nine floors of moaning.',
  'Day two. No power. No signal. He rationed everything. Two crackers, one sip of water. And counted the hours till night.',
  'Night three. Three slow knocks on the door. He held his breath and pressed his eye to the peephole. The corridor was empty.',
  'Then his flashlight found the door. Fourteen chalk marks. Three crossed out. He never drew them. Someone is counting down.',
];

// ---- narration
const voice: Float32Array[] = [];
const captions: { text: string; start: number; end: number }[][] = [];
const decode = (file: string, filter?: string) => {
  const args = ['-v', 'error', '-i', file, ...(filter ? ['-af', filter] : []), '-f', 'f32le', '-ar', String(SR), '-ac', '1', 'pipe:1'];
  const b = execFileSync(FFMPEG, args, { maxBuffer: 1 << 28 });
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4).slice();
};
NARRATION.forEach((text, i) => {
  const txt = path.join(out, `narr-${i}.txt`), wav = path.join(out, `narr-${i}.wav`);
  writeFileSync(txt, text);
  execFileSync('powershell', ['-NoProfile', '-Command',
    `Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoice('Microsoft David Desktop'); $s.Rate=1; $s.SetOutputToWaveFile('${wav}'); $s.Speak((Get-Content -Raw '${txt}')); $s.Dispose()`]);
  const probe = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', wav]).toString());
  const raw = Number(probe.format.duration);
  const shifted = raw / 0.92;
  const tempo = Math.max(1, shifted / 9.2);
  const chain = tempo > 1.9 ? 'atempo=' + Math.sqrt(tempo).toFixed(3) + ',atempo=' + Math.sqrt(tempo).toFixed(3) : 'atempo=' + tempo.toFixed(3);
  const filt = 'asetrate=' + Math.round(22050 * 0.92) + ',aresample=' + SR + ',' + chain + ',lowpass=f=7000,acompressor';
  const v = decode(wav, filt);
  voice.push(v);
  const dur = v.length / SR;
  const sentences = text.split(/(?<=[.?!])\s+/).reduce<string[]>((a, x) => {
    if (a.length && a[a.length - 1].length < 16) a[a.length - 1] += ' ' + x; else a.push(x);
    return a;
  }, []);
  const total = sentences.reduce((a, s) => a + s.length, 0);
  let t = 0.35;
  captions.push(sentences.map((s) => {
    const len = (s.length / total) * dur;
    const c = { text: s, start: t, end: t + len };
    t += len;
    return c;
  }));
  console.log(`clip ${i + 1}: narration ${raw.toFixed(1)}s -> ${dur.toFixed(1)}s`);
});
writeFileSync(path.join(out, 'captions.json'), JSON.stringify(captions, null, 1));

// ---- synth
const mix = new Float32Array(SR * DUR);
const add = (buf: Float32Array, at: number, gain: number) => {
  const o = Math.floor(at * SR);
  for (let i = 0; i < buf.length && o + i < mix.length; i++) mix[o + i] += buf[i] * gain;
};
let seed = 1234;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
const env = (i: number, n: number, a = 0.005, d = 4) => Math.min(1, i / (a * SR)) * Math.exp((-d * i) / n);
const tone = (dur: number, f: number, f1 = f, d = 4, harm = 0) => {
  const n = Math.floor(dur * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const fr = f + (f1 - f) * (i / n);
    ph += (2 * Math.PI * fr) / SR;
    b[i] = (Math.sin(ph) + harm * Math.sin(2 * ph) * 0.5 + harm * Math.sin(3 * ph) * 0.3) * env(i, n, 0.004, d);
  }
  return b;
};
const noise = (dur: number, lp = 0.2, d = 5, hp = 0) => {
  const n = Math.floor(dur * SR), b = new Float32Array(n);
  let y = 0, yh = 0;
  for (let i = 0; i < n; i++) {
    y += lp * (rand() * 2 - y);
    yh += hp * (y - yh);
    b[i] = (hp ? y - yh : y) * env(i, n, 0.002, d);
  }
  return b;
};
const sum = (...bs: Float32Array[]) => { const n = Math.max(...bs.map((b) => b.length)); const r = new Float32Array(n); bs.forEach((b) => b.forEach((v, i) => (r[i] += v))); return r; };
const knock = (t: number, g = 1) => add(sum(tone(0.25, 130, 70, 14), noise(0.12, 0.08, 20)), t, 1.1 * g);
const thud = (t: number, g = 0.8) => add(tone(0.3, 60, 38, 10), t, g);
const step = (t: number, g = 0.35) => add(noise(0.07, 0.25, 18, 0.02), t, g);
const glass = (t: number, g = 0.3) => add(noise(0.25, 0.9, 9, 0.5), t, g);

// music bed
for (let i = 0; i < mix.length; i++) {
  const t = i / SR;
  const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.07 * t);
  mix[i] += (Math.sin(2 * Math.PI * 55 * t) * 0.5 + Math.sin(2 * Math.PI * 82.41 * t + Math.sin(t * 0.3)) * 0.25 + Math.sin(2 * Math.PI * 110.5 * t) * 0.1) * 0.22 * lfo;
}
for (let t = 1; t < DUR - 1; t += 1.25) { const g = 0.16 + 0.1 * Math.sin(t * 0.1); add(tone(0.3, 52, 40, 9), t, g); add(tone(0.25, 52, 40, 11), t + 0.22, g * 0.7); }
[[4, 110], [13, 98], [21, 82.4], [29, 98], [37, 110], [46, 73.4], [55, 82.4]].forEach(([t, f]) => add(tone(3, f, f, 1.6, 1), t, 0.14));

// narration (very audible over the bed)
voice.forEach((v, i) => add(v, i * 10 + 0.35, 1.0));

// ---- clip 1
[2, 17, 32].forEach((f) => knock(f / 24));
for (let k = 0; k < 4; k++) add(tone(1.0, 620 + k * 40, 900, 1.2), 3 + k * 1.0, 0.08);
for (let k = 0; k < 5; k++) add(tone(0.9, 700, 1100 - k * 60, 3), 3.2 + k * 0.7, 0.04 * (k < 4 ? 1 : 0));
for (let t = 3.4; t < 6.9; t += 0.55) add(sum(tone(0.5, 420 + rand() * 80, 360, 6), noise(0.5, 0.5, 5, 0.1)), t, 0.07);
for (let t = 7.1; t < 10; t += 0.22) step(t);
// ---- clip 2
for (let t = 10; t < 13.6; t += 0.21) step(t, 0.4);
for (let k = 0; k < 9; k++) glass(13.6 + k * 0.08 + rand() * 0.05, 0.28);
add(noise(0.28, 0.6, 3, 0.05), 13.75, 0.4);
for (let t = 14.4; t < 17.6; t += 0.55) add(noise(0.4, 0.6, 7, 0.3), t, 0.08);
for (let t = 18.9; t < 20; t += 0.14) step(t, 0.4);
// ---- clip 3
add(sum(noise(0.3, 0.3, 8), tone(0.3, 90, 50, 8)), 21.5, 1.0);
for (let k = 0; k < 6; k++) add(tone(0.06, 3000 + k * 400, 3500, 25), 23.8 + k * 0.07, 0.15);
add(noise(0.7, 0.15, 3, 0.01), 25.7, 0.35);
add(tone(0.35, 70, 40, 10), 26.3, 0.5);
for (let t = 27.5; t < 30; t += 1.2) add(tone(1.4, 105 + rand() * 20, 130, 1.8, 1), t, 0.1);
// ---- clip 4
for (let t = 30; t < 40; t += 1.0) add(tone(0.03, 1800, 1500, 40), t, 0.05);
add(noise(0.18, 0.5, 6, 0.1), 33.8, 0.3); add(noise(0.18, 0.5, 6, 0.1), 34.0, 0.25);
for (let k = 0; k < 5; k++) add(tone(0.04, 2600, 2300, 30), 36.6 + k * 0.07, 0.1);
add(noise(0.45, 0.8, 2.5, 0.2), 38.4, 0.35);
// ---- clip 5
[8, 32, 56].forEach((f) => knock(40 + f / 24, 1.2));
add(tone(0.8, 140, 180, 3, 1), 44.6, 0.06);
for (let t = 43.1; t < 47; t += 0.6) step(t, 0.12);
// ---- clip 6
add(sum(tone(2, 330, 330, 2, 1), tone(2, 349.2, 349.2, 2, 1), tone(2, 523.2, 523.2, 2, 1)), 54, 0.14);
thud(54, 1.0);
for (let t = 50; t < 53.6; t += 0.9) add(noise(0.2, 0.9, 20, 0.6), t, 0.03);
thud(57.6, 0.9); thud(57.8, 0.6);

// silence on the hard cut to black (last 0.25 s) and the city-noise cut at 7 s handled by the SFX layout
for (let i = Math.floor((DUR - 0.25) * SR); i < mix.length; i++) mix[i] *= Math.max(0, 1 - (i - (DUR - 0.25) * SR) / (0.25 * SR));
// soft limiter
let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
const norm = 0.89 / peak;
const pcm = Buffer.alloc(mix.length * 2);
for (let i = 0; i < mix.length; i++) pcm.writeInt16LE(Math.round(Math.tanh(mix[i] * norm * 1.1) * 32000), i * 2);
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
writeFileSync(path.join(out, 'part1-audio.wav'), Buffer.concat([hdr, pcm]));
console.log('audio written');
