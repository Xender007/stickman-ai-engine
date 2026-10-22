import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EpisodeSchema, SeriesSchema} from '../src/episode/schema';
import {compile} from '../src/episode/compile';
import {IMPACT_GAP, LEAD_IN, estimatePhrases, segments} from '../src/episode/timing';
import {buildCaptions, type Alignment} from './lib/captions';
import {callTool, toolSchema} from './lib/llm';
import {voiceEpisode} from './lib/vo';

const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, fn: () => void | Promise<void>) => tests.push([name, fn]);
const fixture = (p: string) => JSON.parse(fs.readFileSync(`fixtures/demo/${p}`, 'utf8'));
const fakeAlign = (text: string, dt = 0.05): Alignment => {
  const characters = [...text];
  return {characters, character_start_times_seconds: characters.map((_, i) => i * dt), character_end_times_seconds: characters.map((_, i) => (i + 1) * dt)};
};

test('captions map onto alignment and fail loudly on changed text', () => {
  const lines = ['Then the ground...', 'breathed.', 'Once.'];
  const caps = buildCaptions(lines, fakeAlign(lines.join(' ')));
  assert.deepEqual(caps[1], {text: 'breathed.', start: 0.95, end: 1.4});
  assert.equal(buildCaptions(lines, fakeAlign(lines.join('   ')))[2].text, 'Once.');
  assert.throws(() => buildCaptions(lines, fakeAlign('Then the ground... breathes. Once.')), /mismatch/);
  assert.throws(() => buildCaptions(lines, fakeAlign(lines.join(' ') + ' More.')), /extra/);
});

test('demo fixtures are valid', () => {
  SeriesSchema.parse(fixture('bible.json'));
  EpisodeSchema.parse(fixture('part-1.json'));
  EpisodeSchema.parse(fixture('part-2.json'));
});

test('schema rejects impossible shots with actionable messages', () => {
  const ep = fixture('part-1.json');
  ep.shots[0].action = 'climb';
  ep.shots[6].action = 'run';
  ep.shots[2].fromLine = 3;
  const r = EpisodeSchema.safeParse(ep);
  assert.ok(!r.success);
  const msg = r.error.issues.map((i) => i.message).join('\n');
  assert.match(msg, /"climb" is not possible in "city"/);
  assert.match(msg, /"run" is not possible in "flood"/);
  assert.match(msg, /strictly increasing/);
});

test('tool schema is generated from zod (enums, no $schema)', () => {
  const js = toolSchema(EpisodeSchema) as {type: string; $schema?: string; properties: Record<string, any>};
  assert.equal(js.type, 'object');
  assert.equal(js.$schema, undefined);
  assert.deepEqual(js.properties.shots.items.properties.setting.enum, ['city', 'forest', 'hill_tower', 'flood']);
});

test('compile: contiguous shots, impact gap, events inside the video', () => {
  const ep = EpisodeSchema.parse(fixture('part-1.json'));
  const ph = estimatePhrases(ep);
  const c = compile(ep, ph);
  assert.equal(c.shots[0].start, 0);
  c.shots.forEach((s, i) => {
    assert.ok(s.end > s.start, `shot ${i} has positive length`);
    if (i) assert.equal(s.start, c.shots[i - 1].end);
  });
  assert.equal(c.shots.at(-1)!.end, c.endCard);
  const afterImpact = ep.shots[ep.shots.findIndex((s) => s.impact) + 1].fromLine;
  assert.ok(ph[afterImpact].start - ph[afterImpact - 1].end >= IMPACT_GAP, 'silence after impact');
  c.slams.forEach((s) => assert.ok(s.at > 0 && s.at < c.endCard));
  assert.ok(c.duration > 30 && c.duration < 90);
});

test('callTool retries with the validation errors, then returns parsed data', async () => {
  const bodies: any[] = [];
  const good = fixture('part-2.json');
  const bad = {...good, shots: good.shots.map((s: any, i: number) => (i === 0 ? {...s, action: 'run'} : s))};
  const replies = [bad, good];
  const fakeFetch = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    const input = replies.shift();
    return new Response(JSON.stringify({content: [{type: 'tool_use', id: `t${bodies.length}`, name: 'write_episode', input}]}), {status: 200});
  }) as typeof fetch;
  const ep = await callTool({system: 's', prompt: 'p', tool: 'write_episode', description: 'd', schema: EpisodeSchema, apiKey: 'k', model: 'm', fetchImpl: fakeFetch});
  assert.equal(ep.title, good.title);
  assert.equal(bodies.length, 2);
  assert.deepEqual(bodies[0].tool_choice, {type: 'tool', name: 'write_episode'});
  const retry = bodies[1].messages.at(-1).content[0];
  assert.equal(retry.type, 'tool_result');
  assert.equal(retry.is_error, true);
  assert.match(retry.content, /"run" is not possible in "flood"/);
});

test('voiceEpisode joins segments with lead-in and exact impact gaps', async () => {
  const ep = EpisodeSchema.parse(fixture('part-1.json'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vo-'));
  const fakeTts = async (text: string) => {
    const dur = text.length * 0.05;
    const file = path.join(dir, `tts-${dur}.mp3`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=220:duration=${dur}`, '-ac', '1', file]);
    return {audio: fs.readFileSync(file), alignment: fakeAlign(text)};
  };
  const out = path.join(dir, 'vo.wav');
  const ph = await voiceEpisode(ep, out, fakeTts, path.join(dir, 'work'));
  const segs = segments(ep);
  assert.equal(segs.length, 2);
  assert.equal(ph.length, ep.lines.length);
  assert.equal(ph[0].start, LEAD_IN);
  const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
  const seg0 = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, 'work', 'seg-0.audio')]).toString());
  const seg1 = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, 'work', 'seg-1.audio')]).toString());
  assert.ok(Math.abs(total - (LEAD_IN + seg0 + IMPACT_GAP + seg1)) < 0.03, `joined length ${total}`);
  const second = segs[0].length;
  assert.ok(Math.abs(ph[second].start - (LEAD_IN + seg0 + IMPACT_GAP)) < 0.001, 'segment 2 offset');
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`  ok  ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL  ${name}\n${e instanceof Error ? e.stack : e}`);
    }
  }
  console.log(failed ? `${failed} failed` : `all ${tests.length} passed`);
  process.exit(failed ? 1 : 0);
})();
