/** Narration: ElevenLabs when ELEVENLABS_API_KEY is set (falls back on any error), otherwise Kokoro (local, free).
 *  Writes assets/narr-N.wav (fitted to the 10 s slot) and assets/captions.json (sentence timings). */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const FFMPEG_DIR = 'C:/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin';
const ffmpeg = path.join(FFMPEG_DIR, 'ffmpeg.exe'), ffprobe = path.join(FFMPEG_DIR, 'ffprobe.exe');
const dir = path.resolve('clips/zombie-hf/assets');
mkdirSync(dir, { recursive: true });
const texts: string[] = JSON.parse(readFileSync('clips/zombie-hf/narration.json', 'utf8'));
const FIT = 9.3; // seconds of speech per 10 s clip (0.35 s lead-in)

const key = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || 'pNInz6obpgDQGcFmaJgB'; // "Adam": deep male
type Align = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };

async function eleven(text: string): Promise<{ file: string; align: Align }> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key!, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  const j = (await res.json()) as { audio_base64: string; alignment: Align };
  const file = path.join(dir, 'raw.mp3');
  writeFileSync(file, Buffer.from(j.audio_base64, 'base64'));
  return { file, align: j.alignment };
}

let kokoro: any;
async function kokoroSpeak(text: string): Promise<string> {
  if (!kokoro) {
    const { KokoroTTS } = await import('kokoro-js');
    kokoro = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
  }
  const audio = await kokoro.generate(text, { voice: 'am_michael', speed: 0.9 });
  const file = path.join(dir, 'raw.wav');
  await audio.save(file);
  return file;
}

const splitSentences = (t: string) => t.split(/(?<=[.?!])\s+/).reduce<string[]>((a, x) => {
  if (a.length && a[a.length - 1].length < 16) a[a.length - 1] += ' ' + x; else a.push(x);
  return a;
}, []);

const captions: { text: string; start: number; end: number }[][] = [];
let engine = key ? 'elevenlabs' : 'kokoro';
for (let i = 0; i < texts.length; i++) {
  const text = texts[i];
  let raw: string, align: Align | undefined;
  if (engine === 'elevenlabs') {
    try { ({ file: raw, align } = await eleven(text)); } catch (e) {
      // never mix two narrators: if ElevenLabs fails at any point, redo every clip with Kokoro
      console.warn(`ElevenLabs failed (${(e as Error).message}); redoing all clips with Kokoro`);
      engine = 'kokoro'; captions.length = 0; i = -1; continue;
    }
  } else raw = await kokoroSpeak(text);
  const dur = Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw]).toString());
  const tempo = Math.max(1, dur / FIT);
  const chain = tempo > 1.9 ? `atempo=${Math.sqrt(tempo).toFixed(3)},atempo=${Math.sqrt(tempo).toFixed(3)}` : `atempo=${tempo.toFixed(3)}`;
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', raw, '-af', `${chain},aresample=44100`, '-ac', '1', path.join(dir, `narr-${i}.wav`)]);
  const fitted = dur / tempo;
  const sentences = splitSentences(text);
  const total = sentences.reduce((a, s) => a + s.length, 0);
  // Without word timestamps (Kokoro) measure the real pauses in the fitted audio and cut sentences at them.
  let bounds: number[] | undefined;
  if (!align) {
    const r = spawnSync(ffmpeg, ['-v', 'info', '-i', path.join(dir, `narr-${i}.wav`), '-af', 'silencedetect=noise=-38dB:d=0.1', '-f', 'null', '-'], { encoding: 'utf8' });
    const sil: { s: number; e: number }[] = [];
    let open = 0;
    for (const line of (r.stderr ?? '').split('\n')) {
      const a = line.match(/silence_start: ([\d.]+)/), b = line.match(/silence_end: ([\d.]+)/);
      if (a) open = Number(a[1]);
      if (b) sil.push({ s: open, e: Number(b[1]) });
    }
    const lead = sil.length && sil[0].s < 0.05 ? sil.shift()!.e : 0;
    const end = sil.length && fitted - sil[sil.length - 1].e < 0.05 ? sil.pop()!.s : fitted;
    // each boundary = the pause closest to where the sentence lengths say it should be (pauses also occur inside sentences)
    const centres = sil.map((g) => (g.s + g.e) / 2);
    let acc = 0, lastIdx = -1;
    bounds = [lead];
    for (let k = 0; k < sentences.length - 1; k++) {
      acc += sentences[k].length;
      const expected = lead + (acc / total) * (end - lead);
      let best = -1, bestD = 0.9;
      centres.forEach((cc, j) => { const d = Math.abs(cc - expected); if (j > lastIdx && d < bestD) { best = j; bestD = d; } });
      if (best >= 0) { bounds.push(centres[best]); lastIdx = best; } else bounds.push(expected);
    }
    bounds.push(end);
  }
  let c = 0, t = 0;
  captions.push(sentences.map((s, k) => {
    let start: number, end: number;
    if (align) {
      start = c === 0 ? 0 : align.character_start_times_seconds[Math.min(c, align.characters.length - 1)] / tempo;
      c += s.length + 1;
      end = align.character_end_times_seconds[Math.min(c - 2, align.characters.length - 1)] / tempo;
    } else if (bounds) { start = bounds[k]; end = bounds[k + 1]; }
    else { start = t; end = t + (s.length / total) * fitted; t = end; }
    return { text: s, start: start + 0.35, end: end + 0.35 };
  }));
  console.log(`clip ${i + 1}: ${engine} ${dur.toFixed(1)}s -> ${fitted.toFixed(1)}s`);
}
writeFileSync(path.join(dir, 'captions.json'), JSON.stringify({ engine, captions }, null, 1));
