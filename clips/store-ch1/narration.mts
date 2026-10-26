/** Chapter 1 narration: voices every sentence separately (ElevenLabs if the key works, otherwise Kokoro),
 *  joins them with small gaps, and writes assets/narration.wav, assets/sentences.json and assets/words.json.
 *  Word times: ElevenLabs gives character timestamps; Kokoro words are spread over the sentence by syllable weight. */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FF = 'C:/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/';
const ffmpeg = FF + 'ffmpeg.exe';
const dir = path.resolve('clips/store-ch1/assets');
mkdirSync(dir, { recursive: true });
const SR = 24000;

const md = readFileSync('story/supermarket/script.md', 'utf8');
const body = md.split('## Chapter 1: The Night Shift')[1].split('## Chapter 2')[0].replace(/^\s*\(.*\)\s*$/m, '');
const paragraphs = body.split(/\n\s*\n/).map((p) => p.replace(/^[^\n]*\)\n/, '').trim()).filter((p) => p && !p.startsWith('('));
const sentences: { text: string; paragraphEnd: boolean }[] = [];
paragraphs.forEach((p) => {
  const ss = p.replace(/\s+/g, ' ').split(/(?<=[.?!])\s+(?=[A-Z0-9"])/);
  ss.forEach((s, i) => sentences.push({ text: s.trim(), paragraphEnd: i === ss.length - 1 }));
});

// closing hype line (not part of the script chapter text)
[['The fire exit is open.', true], ['That was only day one.', false], ['Twenty-seven days to go.', false], ['Part two is coming soon.', false], ["Don't blink.", true]].forEach(([t, e]) => sentences.push({ text: t as string, paragraphEnd: e as boolean }));

const key = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || 'pNInz6obpgDQGcFmaJgB';
type Align = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
let engine = key ? 'elevenlabs' : 'kokoro';
let kokoro: any;

/** spoken form for the TTS engines only; captions keep the original text */
const spoken = (t: string) => t
  .replace(/\b3:07\b/g, 'three oh seven').replace(/\b5:23\b/g, 'five twenty-three').replace(/\b25,000\b/g, 'twenty-five thousand')
  .replace(/\b7,300\b/g, 'seven thousand three hundred').replace(/\baisle 5\b/gi, 'aisle five').replace(/\b12 security\b/g, 'twelve security').replace(/\b12 days\b/g, 'twelve days')
  .replace(/\b35 seconds\b/g, 'thirty-five seconds').replace(/\b4 years\b/g, 'four years').replace(/\bday 28\b/g, 'day twenty-eight').replace(/\bat 3\./g, 'at three.');

async function voice(text: string): Promise<{ pcm: Float32Array; align?: Align }> {
  if (engine === 'elevenlabs') {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': key!, 'content-type': 'application/json' },
      body: JSON.stringify({ text: spoken(text), model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true } }),
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
  const chunks: Float32Array[] = [];
  const outSent: { text: string; start: number; end: number }[] = [];
  const outWords: { w: string; start: number; end: number; s: number }[] = [];
  let t = 0.5;
  chunks.push(new Float32Array(Math.round(0.5 * SR)));
  for (let i = 0; i < sentences.length; i++) {
    const { text, paragraphEnd } = sentences[i];
    const { pcm, align } = await voice(text);
    const { x, lead } = trimSilence(pcm);
    const dur = x.length / SR;
    const words = text.split(/\s+/);
    if (align) {
      // map words to characters of the original text (spoken() only changes numbers, so fall back to weights if lengths differ)
      const chars = align.characters.join('');
      let c = 0;
      words.forEach((w) => {
        const idx = chars.indexOf(w[0], c);
        const s = Math.max(0, (align.character_start_times_seconds[Math.max(0, idx)] ?? 0) - lead / SR);
        c = idx + 1;
        outWords.push({ w, start: t + s, end: 0, s: i });
      });
      const n = outWords.length, k = words.length;
      for (let j = n - k; j < n; j++) outWords[j].end = j < n - 1 ? outWords[j + 1].start : t + dur;
    } else {
      const wts = words.map(syll), tot = wts.reduce((a, b) => a + b, 0);
      let acc = 0;
      words.forEach((w, j) => {
        outWords.push({ w, start: t + (acc / tot) * dur, end: t + ((acc + wts[j]) / tot) * dur, s: i });
        acc += wts[j];
      });
    }
    outSent.push({ text, start: t, end: t + dur });
    chunks.push(x);
    const gap = paragraphEnd ? 0.75 : /[?]$/.test(text) ? 0.42 : 0.3;
    chunks.push(new Float32Array(Math.round(gap * SR)));
    t += dur + gap;
    console.log(`${i + 1}/${sentences.length} ${t.toFixed(1)}s  ${text.slice(0, 50)}`);
  }
  chunks.push(new Float32Array(Math.round(1.2 * SR)));
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const all = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  writeFileSync(path.join(dir, 'raw.f32'), Buffer.from(all.buffer));
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', path.join(dir, 'raw.f32'), '-af', 'acompressor,loudnorm=I=-16:TP=-1.5', '-ar', '44100', path.join(dir, 'narration.wav')]);
  writeFileSync(path.join(dir, 'sentences.json'), JSON.stringify({ engine, total: total / SR, sentences: outSent }, null, 1));
  writeFileSync(path.join(dir, 'words.json'), JSON.stringify(outWords, null, 1));
  console.log(`done: engine=${engine} duration=${(total / SR).toFixed(1)}s sentences=${outSent.length} words=${outWords.length}`);
}

try { await run(); } catch (e) {
  if (engine === 'elevenlabs') { console.warn(`ElevenLabs failed (${(e as Error).message}); redoing everything with Kokoro`); engine = 'kokoro'; await run(); } else throw e;
}
void spawnSync;
