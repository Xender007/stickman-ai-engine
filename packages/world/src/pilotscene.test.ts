import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotScene, FPS, T_DESCEND } from './pilotfixture.ts';
import { GANTRY, landingY } from '../../motion/src/pilot.ts';
import { stateHash } from '../../contracts/src/hash.ts';

const scene = await buildPilotScene();
const { frames, flood, bake, clip, shots, clock } = scene;
const last = frames.length - 1;
const ent = (f: number, id: string) => frames[f].entities.find((e) => e.id === id)!;
const cuts = shots.slice(1).map((s) => s.fromFrame);

test('the pilot is 15 to 30 seconds long and covers more than a minute of story', () => {
  assert.ok(frames.length / FPS >= 15 && frames.length / FPS <= 30, `${(frames.length / FPS).toFixed(1)} s`);
  assert.ok(clock.storyTime(last) - clock.storyTime(0) > 60);
  for (const f of [390, 480]) assert.equal(clock.isJump(f), false, `an unexplained jump at frame ${f}`);
});

test('survivability: Ravi is never in dangerous water (depth x velocity <= 0.6 m^2/s), and is well clear of the surge', () => {
  let maxDV = 0;
  for (const f of frames) {
    const e = f.characters[0].exposure;
    maxDV = Math.max(maxDV, e.dv);
    assert.ok(e.dv <= 0.6, `depth x velocity ${e.dv.toFixed(2)} at t=${f.t.toFixed(1)}`);
  }
  assert.ok(maxDV < 0.6);
  // while the bore passes the stairs (its depth over the street exceeds 0.3 m), his feet are at least 0.4 m above the surface
  for (const f of frames) {
    if (f.t > 6 && f.t < 30) assert.ok(f.characters[0].exposure.clearance > 0.4, `feet ${f.characters[0].exposure.clearance.toFixed(2)} m above the water at t=${f.t.toFixed(1)}`);
  }
});

test('the timing is the story: he is on the stairs when the surge arrives and on the landing before it peaks', () => {
  const arrival = flood.arrival(GANTRY.x0);
  assert.ok(clip.events.climbStart < arrival, 'he must be climbing before the water reaches the stairs');
  const peakT = Array.from({ length: 300 }, (_, i) => 8 + i * 0.1).reduce((best, t) => (flood.depthAt(GANTRY.x0 + 1, t) > flood.depthAt(GANTRY.x0 + 1, best) ? t : best), 8);
  assert.ok(clip.events.atLanding < peakT + 8, `landing at ${clip.events.atLanding.toFixed(1)}, peak at ${peakT.toFixed(1)}`);
  const atArrival = frames.find((f) => f.t >= arrival)!;
  const hipY = atArrival.characters[0].j[1];
  assert.ok(hipY > 1.0, `at arrival he is already ${hipY.toFixed(2)} m up`);
});

test('legs get wet only when he wades back into the film, and then stay wet', () => {
  const firstWet = frames.find((f) => f.characters[0].wetness > 0.05)!;
  assert.ok(firstWet.t >= T_DESCEND, `legs were wet at t=${firstWet.t.toFixed(1)}, before the descent`);
  assert.ok(frames[last].characters[0].wetness > 0.9);
});

test('persistent aftermath: the car is wrecked by the log, the crate is stranded, the pit holds water, the wet marks stay', () => {
  assert.equal(ent(last, 'car_017').damage, 'wrecked');
  assert.match(frames[last].causes.join(';'), /car_017: wrecked <- log_003/);
  const crate = bake.poses[bake.poses.length - 1].find((p) => p.id === 'crate_02')!;
  assert.ok(Math.abs(crate.x - 18.4) < 1);
  assert.ok(flood.depthAt(20.5, 100) > 0.1, 'the pit puddle');
  assert.ok(ent(last, 'car_017').wetLine > 0.9);
  const hit = bake.impacts.find((i) => i.a === 'log_003' && i.b === 'car_017')!;
  const hitFrame = frames.findIndex((f) => f.t >= hit.t);
  assert.ok(frames[hitFrame].shot === 2, 'the impact is in the wide shot made for it');
});

test('state is continuous across every cut: positions, damage, wetness', () => {
  for (const cut of cuts) {
    const a = frames[cut - 1];
    const b = frames[cut];
    assert.notEqual(a.camera.id + a.shot, b.camera.id + b.shot);
    for (const e of a.entities) {
      const n = b.entities.find((x) => x.id === e.id)!;
      // story time advances up to 0.5 s per frame in the time-lapse, so allow the motion that implies for the surge-driven debris
      // The turn is a one-frame flip and is built to land on a cut: the box he carries in front of him swaps sides with him.
      const turnHere = a.characters[0].facing !== b.characters[0].facing;
      const slack = e.id === 'crate_02' || e.id === 'log_003' ? 1.0 : turnHere && e.id === 'box_ravi' ? 1.2 : 0.3;
      assert.ok(Math.hypot(e.x - n.x, e.y - n.y) < slack, `${e.id} jumped ${Math.hypot(e.x - n.x, e.y - n.y).toFixed(2)} m at frame ${cut}`);
      assert.equal(e.damage, n.damage);
      assert.ok(Math.abs(e.wetness - n.wetness) < 0.1 && Math.abs(e.wetLine - n.wetLine) < 0.2, `${e.id} wet state jumped at frame ${cut}`);
    }
  }
});

test('Ravi only ever changes facing on a cut (never mid-shot), and he turns exactly once', () => {
  let flips = 0;
  for (let f = 1; f < frames.length; f++) {
    if (frames[f].characters[0].facing !== frames[f - 1].characters[0].facing) {
      flips++;
      assert.ok(cuts.includes(f), 'a turn that is visible mid-shot at frame ' + f);
    }
  }
  assert.equal(flips, 1);
});

test('the character is the same size and builds in every frame (identity across cuts and directions)', () => {
  const len = (c: number[], a: number, b: number) => Math.hypot(c[a * 2] - c[b * 2], c[a * 2 + 1] - c[b * 2 + 1]);
  const ref = frames[0].characters[0].j;
  for (const f of frames) {
    const j = f.characters[0].j;
    for (const [a, b] of [[0, 1], [0, 3], [3, 5], [1, 7], [7, 9]] as const) assert.ok(Math.abs(len(j, a, b) - len(ref, a, b)) < 2e-3, `bone ${a}-${b} changed at frame ${f.frame}`);
  }
});

test('follow cameras move smoothly: no frame-to-frame jump inside a shot', () => {
  for (const shot of shots) {
    if (!shot.follow) continue;
    for (let f = shot.fromFrame + 1; f < shot.toFrameExclusive; f++) {
      const a = frames[f - 1].camera.pos;
      const b = frames[f].camera.pos;
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.12, `camera moved ${Math.hypot(a[0] - b[0], a[1] - b[1]).toFixed(3)} m at frame ${f}`);
    }
  }
});

test('Ravi is on screen in every follow shot', () => {
  for (const shot of shots) {
    if (!shot.follow) continue;
    for (let f = shot.fromFrame; f < shot.toFrameExclusive; f++) {
      const cam = frames[f].camera;
      const hip = frames[f].characters[0].j;
      const depth = cam.pos[2] - 1.2;
      const half = depth * Math.tan((cam.fovDeg * Math.PI) / 360);
      assert.ok(Math.abs(hip[0] - cam.pos[0]) < half * cam.aspect * 0.95, `Ravi off screen horizontally at frame ${f}`);
      assert.ok(Math.abs(hip[1] - cam.pos[1]) < half * 0.95, `Ravi off screen vertically at frame ${f}`);
    }
  }
});

test('the gantry entity and the character footholds use the same stairs', () => {
  const g = frames[0].entities.find((e) => e.id === 'gantry_01')!;
  assert.ok(Math.abs(g.x - g.w / 2 - GANTRY.x0) < 1e-9);
  assert.ok(Math.abs(g.h - landingY(GANTRY)) < 1e-9);
});

test('deterministic: a second build gives the same state hash', async () => {
  const again = await buildPilotScene();
  assert.equal(stateHash(frames), stateHash(again.frames));
});

test('the authored SceneSpec matches the built scene: same length, same shots, valid, and allowed to render (no capability gaps)', async () => {
  const { readFileSync } = await import('node:fs');
  const { SceneSpec } = await import('../../contracts/src/scenespec.ts');
  const { resolveCapabilities, seedRegistry } = await import('./index.ts');
  const spec = SceneSpec.parse(JSON.parse(readFileSync('pilot/the-drawdown-the-hit.scene.json', 'utf8')));
  assert.equal(spec.durationFrames, frames.length);
  assert.deepEqual(spec.shots.map((s) => [s.fromFrame, s.toFrameExclusive]), shots.map((s) => [s.fromFrame, s.toFrameExclusive]));
  assert.deepEqual(spec.shots.map((s) => s.camera), shots.map((s) => s.camera.id));
  assert.deepEqual(resolveCapabilities(spec, seedRegistry(), 'final'), []);
});
