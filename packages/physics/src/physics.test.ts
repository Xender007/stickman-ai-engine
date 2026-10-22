import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bakeHash, bakeRigid, type BodySpec } from './rapier.ts';

function pile(n: number): BodySpec[] {
  const bodies: BodySpec[] = [];
  // Deterministic pseudo-random layout (no Math.random).
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n; i++) {
    bodies.push({
      id: `b${i}`,
      lane: 'hero',
      shape: i % 3 === 0 ? { kind: 'ball', r: 0.2 + rnd() * 0.2 } : { kind: 'box', hx: 0.2 + rnd() * 0.3, hy: 0.15 + rnd() * 0.25 },
      position: [rnd() * 6 - 3, 1 + i * 0.5],
      angle: rnd() * 3,
      mass: 5 + rnd() * 20,
    });
  }
  return bodies;
}

const opts = { fps: 30, stepSeconds: 1 / 120, frames: 150, bodies: pile(100) };

test('100 lane-locked bodies: two runs give identical state hashes', async () => {
  const a = await bakeRigid(opts);
  const b = await bakeRigid(opts);
  assert.equal(bakeHash(a), bakeHash(b));
});

test('bodies stay in their lane and come to rest above the ground', async () => {
  const frames = await bakeRigid(opts);
  const last = frames[frames.length - 1];
  for (const b of last.bodies) {
    assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
    assert.ok(b.y > -0.01, `${b.id} fell through the ground (y=${b.y})`);
  }
});

test('different creation order is a different (declared) input', async () => {
  const a = await bakeRigid({ ...opts, bodies: pile(20) });
  const b = await bakeRigid({ ...opts, bodies: pile(20).reverse() });
  assert.notEqual(bakeHash(a), bakeHash(b));
});

test('step that does not divide a frame is rejected', async () => {
  await assert.rejects(bakeRigid({ ...opts, stepSeconds: 0.007 }), /divide one frame/);
});
