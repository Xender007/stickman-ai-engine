import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captionsInSafeZone, contactDrift, failures, loudness, scaleSanity, stranding, temporalJitter } from './checks.ts';

test('a planted foot that slides fails, one that holds passes', () => {
  const held = Array.from({ length: 30 }, () => [1, 0] as [number, number]);
  assert.equal(failures(contactDrift(held, 30)).length, 0);
  const slide = Array.from({ length: 30 }, (_, i) => [1 + i * 0.004, 0] as [number, number]); // 4 mm/frame, 11.6 cm total
  const f = failures(contactDrift(slide, 30));
  assert.deepEqual(f.map((x) => x.check), ['contact_drift_interval']);
});

test('scale sanity catches a door that is too small', () => {
  const bad = scaleSanity({ door: 1.0, car: 2.7 }, { door: 1.2, car: 2.6 });
  assert.deepEqual(failures(bad).map((r) => r.check), ['scale_door']);
});

test('jitter spike is found with its frame', () => {
  const smooth = Array.from({ length: 60 }, (_, i) => Math.sin(i / 8));
  assert.equal(temporalJitter(smooth).pass, true);
  const popped = [...smooth];
  popped[30] += 0.8;
  const r = temporalJitter(popped);
  assert.equal(r.pass, false);
  assert.ok(Math.abs(r.frame! - 30) <= 2);
});

test('floating and sunk objects fail stranding', () => {
  const rs = failures(stranding([{ id: 'car', gapM: 0.3, tiltErrorDeg: 2 }, { id: 'rock', gapM: -0.1, tiltErrorDeg: 1 }, { id: 'boat', gapM: 0.01, tiltErrorDeg: 9 }]));
  assert.deepEqual(rs.map((r) => r.check), ['strand_gap_car', 'strand_gap_rock', 'strand_tilt_boat']);
});

test('captions: safe zone, contrast, duration, overlap', () => {
  const ok = { id: 'c1', x0: 100, y0: 1300, x1: 980, y1: 1450, seconds: 1.2, contrast: 8 };
  assert.equal(failures(captionsInSafeZone([ok])).length, 0);
  const bad = { ...ok, id: 'c2', x1: 1070, seconds: 0.3, contrast: 3 };
  assert.equal(failures(captionsInSafeZone([bad], [{ id: 'slam', x0: 0, y0: 1400, x1: 1080, y1: 1500 }])).length, 4);
});

test('loudness', () => {
  assert.equal(failures(loudness(-14.2, -1.5)).length, 0);
  assert.equal(failures(loudness(-9, 0.3)).length, 2);
});
