import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bakeLogImpact } from './impact-bake.ts';
import { bakeHash } from './rapier.ts';

const opts = {
  fps: 30,
  stepSeconds: 1 / 120,
  frames: 270,
  bodies: { car: { x: 9, w: 4.4, h: 1.5, mass: 1300 }, log: { x: 3.2, w: 3.2, h: 0.35, mass: 120 } },
  logTouchedAt: 3.03,
  currentSpeed: 3,
  dragNsPerM: 400,
};

test('the log hits the car once, after the water reaches it, with a plausible impulse', async () => {
  const { impacts } = await bakeLogImpact(opts);
  assert.equal(impacts.length, 1);
  assert.ok(impacts[0].t > opts.logTouchedAt && impacts[0].t < 5, `impact at ${impacts[0].t}`);
  assert.ok(impacts[0].closingSpeed > 1.5 && impacts[0].closingSpeed < 3.2, `closing speed ${impacts[0].closingSpeed}`);
  assert.ok(impacts[0].impulse > 100 && impacts[0].impulse < 600, `impulse ${impacts[0].impulse}`);
});

test('nothing moves before the water reaches the log', async () => {
  const { frames } = await bakeLogImpact(opts);
  const f = frames[Math.floor(2.9 * 30)].bodies;
  assert.ok(Math.abs(f[1].x - 3.2) < 0.01, `log moved to ${f[1].x}`);
  assert.ok(Math.abs(f[0].x - 9) < 0.01);
});

test('a heavier car barely moves; the log stops against it', async () => {
  const { frames } = await bakeLogImpact(opts);
  const last = frames[frames.length - 1].bodies;
  assert.ok(Math.abs(last[0].x - 9) < 0.6, `car moved to ${last[0].x}`);
  assert.ok(last[1].x < last[0].x, 'log passed through the car');
});

test('deterministic: same inputs, same hash and same impact', async () => {
  const a = await bakeLogImpact(opts);
  const b = await bakeLogImpact(opts);
  assert.equal(bakeHash(a.frames), bakeHash(b.frames));
  assert.deepEqual(a.impacts, b.impacts);
});

test('no water, no impact', async () => {
  const { impacts } = await bakeLogImpact({ ...opts, logTouchedAt: 1e9 });
  assert.equal(impacts.length, 0);
});
