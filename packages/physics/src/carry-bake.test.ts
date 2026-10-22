import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bakeCarryCrate } from './carry-bake.ts';
import { bakeHash } from './rapier.ts';
import { buildCarryClip, CRATE } from '../../motion/src/carry.ts';

const clip = buildCarryClip({ massKg: 25, crateX: 3, carryDistance: 3 });
const opts = { fps: 30, stepSeconds: 1 / 120, massKg: 25 };

test('crate bake is deterministic', async () => {
  const a = await bakeCarryCrate(clip, opts);
  const b = await bakeCarryCrate(clip, opts);
  assert.equal(bakeHash(a.frames), bakeHash(b.frames));
});

test('ownership: physics before the grasp, animation while held, physics after the release', async () => {
  const { owner } = await bakeCarryCrate(clip, opts);
  const at = (t: number) => owner[Math.floor(t * 30)];
  assert.equal(at(1), 'physics');
  assert.equal(at(clip.tGrasp - 0.1), 'physics');
  assert.equal(at((clip.tGrasp + clip.tRelease) / 2), 'animation');
  assert.equal(at(clip.tRelease + 0.5), 'physics');
});

test('the crate rests on the ground before the grasp and after the release', async () => {
  const { frames } = await bakeCarryCrate(clip, opts);
  const before = frames[Math.floor((clip.tGrasp - 0.2) * 30)].bodies[0];
  assert.ok(Math.abs(before.y - CRATE.h / 2) < 0.01, `rests at y=${before.y}`);
  assert.ok(Math.abs(before.x - 3) < 0.01);
  const after = frames[frames.length - 1].bodies[0];
  assert.ok(Math.abs(after.y - CRATE.h / 2) < 0.01, `ends at y=${after.y}`);
});

test('while held the baked crate follows the animation to within 1 cm', async () => {
  const { frames, owner } = await bakeCarryCrate(clip, opts);
  let worst = 0;
  frames.forEach((fr, i) => {
    if (owner[i] !== 'animation') return;
    const nominal = clip.sampleAt(i / 30).crate;
    worst = Math.max(worst, Math.hypot(fr.bodies[0].x - nominal.x, fr.bodies[0].y - nominal.y));
  });
  assert.ok(worst < 0.01, `crate lags the hands by ${(worst * 100).toFixed(2)} cm`);
});

test('no jump at the two hand-overs, and never faster than 2.5 m/s', async () => {
  const { frames } = await bakeCarryCrate(clip, opts);
  const dist = (i: number) => Math.hypot(frames[i].bodies[0].x - frames[i - 1].bodies[0].x, frames[i].bodies[0].y - frames[i - 1].bodies[0].y);
  for (const tSwitch of [clip.tGrasp, clip.tRelease]) {
    const f0 = Math.round(tSwitch * 30);
    for (let i = f0 - 2; i <= f0 + 2; i++) assert.ok(dist(i) < 0.02, `crate moved ${(dist(i) * 100).toFixed(1)} cm at frame ${i} next to the hand-over at t=${tSwitch.toFixed(2)}`);
  }
  for (let i = 1; i < frames.length; i++) assert.ok(dist(i) * 30 < 2.5, `crate speed ${(dist(i) * 30).toFixed(2)} m/s at frame ${i}`);
});
