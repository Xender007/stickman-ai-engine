/**
 * Milestone 0 item 8: run the programmatic checks on the existing Quiet Coast output and record
 * where today's shots sit relative to the starting thresholds.
 * Usage: npx tsx benchmarks/calibrate.mts   (ffmpeg must be on PATH)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { failures, loudness, scaleSanity, THRESHOLDS as T } from '../packages/quality/src/index.ts';

const slug = 'the-quiet-coast';
const report: Record<string, unknown> = { date: new Date().toISOString().slice(0, 10), parts: {} };

// Rig proportions (src/rig/pose.ts BONES) and world scale (src/story/world/geo.ts PERSON, FLOOR_H).
const BONES = { torso: 80, neck: 9, headR: 27, thigh: 58, shin: 58 };
const PERSON = 0.36;
const FLOOR_H = 130;
const personPx = (BONES.thigh + BONES.shin + BONES.torso + BONES.neck + 2 * BONES.headR) * PERSON;
const scale = scaleSanity({ person_to_floor: personPx / FLOOR_H }, { person_to_floor: 1.75 / 3.0 });
report.scale = { personPx, floorPx: FLOOR_H, measuredRatio: personPx / FLOOR_H, intended: 1.75 / 3.0, results: scale };

for (const n of [1, 2, 3]) {
  const timing = JSON.parse(readFileSync(`story/${slug}/part-${n}.timing.json`, 'utf8')) as { captions: { start: number; end: number }[]; duration: number };
  const secs = timing.captions.map((c) => c.end - c.start);
  const short = secs.filter((s) => s < T.captionMinSeconds).length;

  const probe = spawnSync('ffmpeg', ['-nostats', '-i', `out/${slug}/part-${n}.mp4`, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const text = probe.stderr;
  const summary = text.slice(text.lastIndexOf('Summary:'));
  const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
  const peak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);

  (report.parts as Record<string, unknown>)[`part-${n}`] = {
    duration: timing.duration,
    captions: { count: secs.length, shortest: Math.min(...secs), under_min: short, median: [...secs].sort((a, b) => a - b)[Math.floor(secs.length / 2)] },
    loudness: { lufs, truePeakDb: peak, results: loudness(lufs, peak) },
  };
}

const flat = JSON.stringify(report);
const fails = [...failures(scale)].map((f) => f.check);
for (const p of Object.values(report.parts as Record<string, { loudness: { results: ReturnType<typeof loudness> } }>)) fails.push(...failures(p.loudness.results).map((f) => f.check));
report.failing = fails;
writeFileSync('benchmarks/calibration.json', JSON.stringify(report, null, 2));
console.log(flat.length, 'bytes; failing checks:', fails.length ? fails.join(', ') : 'none');
