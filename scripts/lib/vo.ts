import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {Episode} from '../../src/episode/schema';
import {IMPACT_GAP, LEAD_IN, Phrase, joinSegments, segments} from '../../src/episode/timing';
import {Alignment, buildCaptions} from './captions';
import type {Fetch} from './llm';

export type Tts = (text: string, ctx: {previousText?: string; nextText?: string}) => Promise<{audio: Buffer; alignment: Alignment}>;

export const elevenLabs = (o: {apiKey: string; voiceId: string; modelId?: string; fetchImpl?: Fetch}): Tts => async (text, ctx) => {
  const res = await (o.fetchImpl ?? fetch)(
    `https://api.elevenlabs.io/v1/text-to-speech/${o.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {'xi-api-key': o.apiKey, 'content-type': 'application/json'},
      body: JSON.stringify({
        text,
        model_id: o.modelId ?? 'eleven_multilingual_v2',
        previous_text: ctx.previousText, // keeps delivery continuous across the impact gap
        next_text: ctx.nextText,
        voice_settings: {stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true},
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {audio_base64: string; alignment: Alignment};
  return {audio: Buffer.from(data.audio_base64, 'base64'), alignment: data.alignment};
};

const probe = (file: string) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

/** Voices each segment separately, then joins them with a lead-in and exact silent gaps after impacts. */
export async function voiceEpisode(ep: Episode, outFile: string, tts: Tts, workDir: string): Promise<Phrase[]> {
  fs.mkdirSync(workDir, {recursive: true});
  const segs = segments(ep);
  const parts: {file: string; duration: number; phrases: Phrase[]}[] = [];
  for (let i = 0; i < segs.length; i++) {
    const {audio, alignment} = await tts(segs[i].join(' '), {previousText: segs[i - 1]?.join(' '), nextText: segs[i + 1]?.join(' ')});
    const file = path.join(workDir, `seg-${i}.audio`);
    fs.writeFileSync(file, audio);
    parts.push({file, duration: probe(file), phrases: buildCaptions(segs[i], alignment)});
  }
  const chains = parts.map((p, i) => {
    const lead = i === 0 ? LEAD_IN : 0;
    const gap = i < parts.length - 1 ? IMPACT_GAP : 0;
    return `[${i}:a]aformat=sample_rates=44100:channel_layouts=mono,atrim=0:${p.duration},asetpts=N/SR/TB,` +
      `adelay=${Math.round(lead * 1000)}:all=1,apad=whole_dur=${lead + p.duration + gap}[a${i}]`;
  });
  const filter = `${chains.join(';')};${parts.map((_, i) => `[a${i}]`).join('')}concat=n=${parts.length}:v=0:a=1[out]`;
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...parts.flatMap((p) => ['-i', p.file]), '-filter_complex', filter, '-map', '[out]', outFile]);
  return joinSegments(parts.map((p) => ({phrases: p.phrases, duration: p.duration})));
}
