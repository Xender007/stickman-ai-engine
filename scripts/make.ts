/**
 * One command = one finished episode.
 *
 *   npx tsx scripts/make.ts --auto                 continue the oldest unfinished series, or start a new one
 *   npx tsx scripts/make.ts --new [--idea "..."] [--parts 3]
 *   npx tsx scripts/make.ts --series <slug>        next part of a specific series
 *   Testing/manual: --bible-file <json>  --episode-file <json>  --dry (no voice)  --no-render  --scale 0.5
 *
 * Logs go to stderr; stdout gets exactly one JSON line describing the result (for n8n/cron).
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {EpisodeSchema, Series, SeriesSchema} from '../src/episode/schema';
import {Phrase, estimatePhrases} from '../src/episode/timing';
import type {EpisodeProps} from '../src/episode/EpisodeVideo';
import {callTool} from './lib/llm';
import {EPISODE_SYSTEM, SERIES_SYSTEM, episodePrompt, seriesPrompt} from './lib/prompts';
import {StoredSeries, createSeries, listSeries, partsDone, readEpisode, readSeries, writeJson} from './lib/store';
import {elevenLabs, voiceEpisode} from './lib/vo';

const log = (...m: unknown[]) => console.error('[make]', ...m);
const result = (data: Record<string, unknown>) => process.stdout.write(JSON.stringify(data) + '\n');
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));

const parseArgs = (argv: string[]) => {
  const val = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    auto: argv.includes('--auto'),
    new: argv.includes('--new'),
    series: val('--series'),
    idea: val('--idea'),
    parts: Number(val('--parts') ?? 3),
    bibleFile: val('--bible-file'),
    episodeFile: val('--episode-file'),
    dry: argv.includes('--dry'),
    render: !argv.includes('--no-render'),
    scale: val('--scale'),
  };
};

const run = (cmd: string, args: string[]) => {
  // npx is a .cmd shim on Windows, which only spawns through a shell
  const r = spawnSync(cmd, args, {stdio: ['ignore', process.stderr, process.stderr], shell: process.platform === 'win32'});
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(' ')} failed (exit ${r.status})`);
};

const writeSeries = (idea: string | null, parts: number): Promise<Series> =>
  callTool({
    system: SERIES_SYSTEM,
    prompt: seriesPrompt(idea, parts, listSeries().map((s) => `${s.title}: ${s.premise}`)),
    tool: 'create_series',
    description: 'Submit the new series bible',
    schema: SeriesSchema,
  });

async function main() {
  const a = parseArgs(process.argv.slice(2));

  let series: StoredSeries;
  if (a.bibleFile) series = createSeries(SeriesSchema.parse(readJson(a.bibleFile)));
  else if (a.series) series = readSeries(a.series);
  else if (a.new) series = createSeries(await writeSeries(a.idea ?? null, a.parts));
  else if (a.auto) {
    series = listSeries().find((s) => partsDone(s.slug).length < s.parts) ?? createSeries(await writeSeries(a.idea ?? null, a.parts));
  } else throw new Error('Pass --auto, --new, --series <slug> or --bible-file <json>');

  const done = partsDone(series.slug);
  const part = (done[done.length - 1] ?? 0) + 1;
  if (part > series.parts) return result({status: 'complete', series: series.slug});
  log(`${series.title}: writing part ${part}/${series.parts}`);

  const previous = done.map((p) => {
    const e = readEpisode(series.slug, p);
    return {part: p, title: e.title, summary: e.summary};
  });
  const episode = a.episodeFile
    ? EpisodeSchema.parse(readJson(a.episodeFile))
    : await callTool({
        system: EPISODE_SYSTEM,
        prompt: episodePrompt(series, part, previous),
        tool: 'write_episode',
        description: 'Submit the finished episode script and shot plan',
        schema: EpisodeSchema,
      });
  writeJson(series.slug, `part-${part}.draft.json`, episode);

  const outDir = path.join('out', series.slug);
  fs.mkdirSync(outDir, {recursive: true});
  let phrases: Phrase[];
  let vo: string | null = null;
  const {ELEVENLABS_API_KEY, VOICE_ID, ELEVENLABS_MODEL} = process.env;
  if (!a.dry && ELEVENLABS_API_KEY && VOICE_ID) {
    log('voicing');
    vo = `episodes/${series.slug}/part-${part}.wav`;
    const tts = elevenLabs({apiKey: ELEVENLABS_API_KEY, voiceId: VOICE_ID, modelId: ELEVENLABS_MODEL});
    phrases = await voiceEpisode(episode, path.join('public', vo), tts, path.join(outDir, `part-${part}-vo`));
  } else {
    if (!a.dry) log('ELEVENLABS_API_KEY/VOICE_ID not set: silent preview with estimated timings');
    phrases = estimatePhrases(episode);
  }

  const final = part === series.parts;
  const props: EpisodeProps = {
    episode, phrases, vo, seed: series.slug,
    endCard: final ? {title: 'THE END', subtitle: 'FOLLOW FOR THE NEXT STORY'} : {title: `PART ${part + 1}?`, subtitle: 'FOLLOW TO FIND OUT'},
  };
  const propsFile = writeJson(series.slug, `part-${part}.props.json`, props);

  const video = path.join(outDir, `part-${part}.mp4`);
  if (a.render) {
    log('rendering');
    const raw = path.join(outDir, `part-${part}.raw.mp4`);
    const args = ['remotion', 'render', 'Episode', raw, `--props=${propsFile}`, '--log=error'];
    if (a.scale) args.push(`--scale=${a.scale}`);
    if (process.env.BROWSER) args.push(`--browser-executable=${process.env.BROWSER}`);
    run('npx', args);
    log('mastering loudness');
    run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1:LRA=11', '-ar', '48000', video]);
    fs.rmSync(raw);
  }

  // Commit the part last, so a failed run is simply retried next time.
  writeJson(series.slug, `part-${part}.json`, episode);
  fs.rmSync(path.join('series', series.slug, `part-${part}.draft.json`));
  const meta = {
    status: 'ok', series: series.slug, seriesTitle: series.title, part, parts: series.parts, final,
    title: episode.title, caption: `${episode.postCaption}\n\n${episode.hashtags.join(' ')}`,
    video: a.render ? path.resolve(video) : null, voiced: vo !== null,
  };
  fs.writeFileSync(path.join(outDir, `part-${part}.post.json`), JSON.stringify(meta, null, 2) + '\n');
  result(meta);
}

main().catch((e) => {
  log(e instanceof Error ? e.message : e);
  result({status: 'error', error: String(e instanceof Error ? e.message : e)});
  process.exit(1);
});
