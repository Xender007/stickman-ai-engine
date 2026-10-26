/** Voices one chapter of story/supermarket/script-v4.md: every sentence separately (ElevenLabs only if USE_ELEVEN=1, otherwise Kokoro),
 *  joined with small gaps. Writes clips/store-chN/assets/{narration.wav,sentences.json,words.json}.
 *  usage: npx tsx --env-file=.env clips/store/narration.mts <chapter 1-6> [tailSeconds] */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FF = 'C:/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/';
const ffmpeg = FF + 'ffmpeg.exe';
const N = Number(process.argv[2] ?? 1);
const tail = Number(process.argv[3] ?? (N === 6 ? 4.5 : 0.9));
const dir = path.resolve(`clips/w-ch${N}/assets`);
mkdirSync(dir, { recursive: true });
const SR = 24000;

const md = readFileSync('story/supermarket/script-v4.md', 'utf8');
const body = md.split(new RegExp(`^## Chapter ${N}:.*$`, 'm'))[1].split(/^## /m)[0];
const sentences: { text: string; paragraphEnd: boolean }[] = [];
body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
  const ss = p.replace(/\s+/g, ' ').split(/(?<=[.?!])\s+(?=[A-Z0-9"])/);
  ss.forEach((s, i) => sentences.push({ text: s.trim(), paragraphEnd: i === ss.length - 1 }));
});

const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const words = (n: number): string => n < 20 ? ones[n] : n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '') : n < 1000 ? ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '') : words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + words(n % 1000) : '');
/** spoken form for the TTS engines only; captions keep the original text */
const spoken = (t: string) => t
  .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => `${words(+h)} ${m === '00' ? '' : +m < 10 ? 'oh ' + words(+m) : words(+m)}`)
  .replace(/\b\d{1,3}(?:,\d{3})+\b|\b\d+\b/g, (m) => words(+m.replace(/,/g, '')));

const key = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || 'pNInz6obpgDQGcFmaJgB';
type Align = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
const engine = key && process.env.USE_ELEVEN === '1' ? 'elevenlabs' : 'kokoro';
let kokoro: any;

async function voice(text: string): Promise<{ pcm: Float32Array; align?: Align }> {
  if (engine === 'elevenlabs') {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': key!, 'content-type': 'application/json' },
      body: JSON.stringify({ text: spoken(text), model_id: process.env.ELEVEN_MODEL ?? 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    const j = (await res.json()) as { audio_base64: string; alignment: Align };
    const f = path.join(dir, 'tmp.mp3');
    writeFileSync(f, Buffer.from(j.audio_base64, 'base64'));
    const b = execFileSync(ffmpeg, ['-v', 'error', '-i', f, '-f', 'f32le', '-ar', String(SR), '-ac', '1', 'pipe:1'], { maxBuffer: 1 << 28 });
    return { pcm: new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4).slice(), align: j.alignment };
  }
  if (!kokoro) {
    const { KokoroTTS } = await import('kokoro-js');
    kokoro = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
  }
  const a = await kokoro.generate(spoken(text), { voice: 'am_michael', speed: 0.95 });
  return { pcm: a.audio as Float32Array };
}

const trimSilence = (x: Float32Array) => {
  let a = 0, b = x.length;
  while (a < b && Math.abs(x[a]) < 0.01) a++;
  while (b > a && Math.abs(x[b - 1]) < 0.01) b--;
  return { x: x.subarray(Math.max(0, a - 120), Math.min(x.length, b + 240)), lead: Math.max(0, a - 120) };
};
const syll = (w: string) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) ?? []).length) + (/[,.;:?!]$/.test(w) ? 0.8 : 0);

async function run() {
  const chunks: Float32Array[] = [new Float32Array(Math.round(0.6 * SR))];
  const outSent: { text: string; start: number; end: number }[] = [];
  const outWords: { w: string; start: number; end: number; s: number }[] = [];
  let t = 0.6;
  for (let i = 0; i < sentences.length; i++) {
    const { text, paragraphEnd } = sentences[i];
    const { pcm, align } = await voice(text);
    const { x, lead } = trimSilence(pcm);
    const dur = x.length / SR;
    const ws = text.split(/\s+/);
    if (align) {
      // word start times of the SPOKEN text (numbers are spelled out), then mapped back onto the caption words
      const sw: number[] = [];
      let inWord = false;
      align.characters.forEach((ch, k) => {
        const space = /\s/.test(ch);
        if (!space && !inWord) sw.push(align.character_start_times_seconds[k]);
        inWord = !space;
      });
      let j = 0;
      ws.forEach((w) => {
        const st = sw[Math.min(j, sw.length - 1)] ?? 0;
        outWords.push({ w, start: t + Math.max(0, st - lead / SR), end: 0, s: i });
        j += Math.max(1, spoken(w).split(/\s+/).filter(Boolean).length);
      });
      const n = outWords.length, k = ws.length;
      for (let q = n - k; q < n; q++) outWords[q].end = q < n - 1 ? outWords[q + 1].start : t + dur;
    } else {
      const wts = ws.map(syll), tot = wts.reduce((a, b) => a + b, 0);
      let acc = 0;
      ws.forEach((w, j) => { outWords.push({ w, start: t + (acc / tot) * dur, end: t + ((acc + wts[j]) / tot) * dur, s: i }); acc += wts[j]; });
    }
    outSent.push({ text, start: t, end: t + dur });
    chunks.push(x);
    const gap = paragraphEnd ? 0.8 : /[?]$/.test(text) ? 0.42 : /:$/.test(text) ? 0.5 : 0.3;
    chunks.push(new Float32Array(Math.round(gap * SR)));
    t += dur + gap;
    console.log(`${i + 1}/${sentences.length} ${t.toFixed(1)}s  ${text.slice(0, 50)}`);
  }
  chunks.push(new Float32Array(Math.round(tail * SR)));
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const all = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  writeFileSync(path.join(dir, 'raw.f32'), Buffer.from(all.buffer));
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', path.join(dir, 'raw.f32'), '-af', 'acompressor,loudnorm=I=-16:TP=-1.5', '-ar', '44100', path.join(dir, 'narration.wav')]);
  writeFileSync(path.join(dir, 'sentences.json'), JSON.stringify({ engine, total: total / SR, sentences: outSent }, null, 1));
  writeFileSync(path.join(dir, 'words.json'), JSON.stringify(outWords, null, 1));
  console.log(`done: chapter ${N} engine=${engine} duration=${(total / SR).toFixed(1)}s sentences=${outSent.length} words=${outWords.length}`);
}
await run();
