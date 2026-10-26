import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShotScene, FPS, FRAMES, OFFSET, STAIRS } from './shotfixture.ts';
import { SHOT, SHOT_LAYOUT } from '../../environment/src/shot-terrain.ts';
import { stateHash } from '../../contracts/src/hash.ts';

const scene = await buildShotScene();
const { frames, flood, bake, clip } = scene;
const last = frames.length - 1;
const ent = (f: number, id: string) => frames[f].entities.find((e) => e.id === id)!;
const edit = (storyT: number) => frames.findIndex((f) => f.t >= storyT) / FPS;

test('one continuous 10 s shot: 300 frames, one locked camera, no cuts', () => {
  assert.equal(frames.length, FRAMES);
  assert.equal(new Set(frames.map((f) => JSON.stringify(f.camera))).size, 1);
});

test('the bore slams the quay wall in the 2 to 3.5 s window, and the water tops the 0.9 m parapet', () => {
  let slam = -1;
  for (let t = OFFSET; t < OFFSET + 8; t += 0.05) if (flood.etaAt(-0.8, t) > -0.2) { slam = t; break; }
  assert.ok(slam > 0);
  const e = slam - OFFSET;
  assert.ok(e > 1.8 && e < 3.5, `slam at edit ${e.toFixed(2)} s`);
  let peak = -9;
  for (let t = OFFSET; t < OFFSET + 10; t += 0.05) peak = Math.max(peak, flood.etaAt(-0.4, t));
  assert.ok(peak > SHOT.parapetTop, `sea peaks at ${peak.toFixed(2)} m, wall top ${SHOT.parapetTop}`);
});

test('Ravi stops near 2 s, turns his torso to the sea with feet planted, climbs, is on the landing near 7 s, then turns to face the sea', () => {
  const e = clip.events;
  assert.ok(e.stop > 1.7 && e.stop < 2.6);
  const mid = clip.sampleAt((e.lookStart + e.lookEnd) / 2);
  assert.ok(mid.planted.L && mid.planted.R, 'both feet planted during the look');
  assert.ok(mid.chestYaw > 1.5 && mid.hipYaw === 0, 'only the torso turns toward the sea');
  assert.ok(e.atLanding > 6.3 && e.atLanding < 7.3);
  const end = frames[last].characters[0].rig3!;
  assert.ok(Math.abs(end.hipYaw - Math.PI) < 1e-9, 'he ends facing the sea');
  // the turn is visible: it happens inside the shot (there are no cuts), over many frames
  const turning = frames.filter((f) => f.characters[0].rig3!.hipYaw > 0.1 && f.characters[0].rig3!.hipYaw < Math.PI - 0.1).length;
  assert.ok(turning >= 15, `the turn lasts only ${turning} frames`);
});

test('water reaches the sedan up to about the door sills, and floods the foot of the stairs', () => {
  let carPeak = 0;
  let stairPeak = 0;
  for (let t = OFFSET; t < OFFSET + 8.8; t += 0.05) {
    carPeak = Math.max(carPeak, flood.depthAt(SHOT_LAYOUT.carX, t));
    stairPeak = Math.max(stairPeak, flood.depthAt(STAIRS.x0 + 0.1, t));
  }
  assert.ok(carPeak > 0.35 && carPeak < 0.8, `peak at the car ${carPeak.toFixed(2)} m`);
  assert.ok(stairPeak > 0.3, `peak at the stairs ${stairPeak.toFixed(2)} m`);
});

test('Ravi is never in dangerous water: depth x velocity <= 0.6 and at most 5 cm over a foot', () => {
  for (const f of frames) {
    const e = f.characters[0].exposure;
    assert.ok(e.dv <= 0.6, `dv ${e.dv.toFixed(2)} at edit ${(f.frame / FPS).toFixed(2)}`);
    assert.ok(e.depth <= 0.05, `${(e.depth * 100).toFixed(1)} cm over a foot at edit ${(f.frame / FPS).toFixed(2)}`);
  }
});

test('the log is carried uphill, knocks the gantry (which is not damaged), and ends stranded in the kerb puddle', () => {
  const xs = bake.poses.map((p) => p.find((b) => b.id === 'log_003')!.x);
  assert.ok(Math.max(...xs) > 4.5, `log only reached x=${Math.max(...xs).toFixed(2)}`);
  const knock = bake.impacts.find((i) => i.a === 'log_003' && i.b === 'gantry_01');
  assert.ok(knock, 'no knock on the gantry');
  assert.ok(edit(knock!.t) < 8.8, `the knock happens at edit ${edit(knock!.t).toFixed(2)} s, outside the real-time part`);
  assert.equal(ent(last, 'gantry_01').damage, 'intact');
  const log = ent(last, 'log_003');
  const dip = SHOT.dips[0];
  assert.ok(log.x >= dip.x0 - 0.9 && log.x <= dip.x1 + 0.9, `log ended at x=${log.x.toFixed(2)}`);
  const endPoses = bake.poses.slice(-120).map((p) => p.find((b) => b.id === 'log_003')!);
  assert.ok(Math.abs(endPoses[0].x - endPoses[endPoses.length - 1].x) < 0.01, 'log still moving at the end');
});

test('the sedan stays planted and undamaged (the prompt: water swirls around it and does not lift it)', () => {
  const car = frames.map((f) => ent(f.frame, 'car_017'));
  assert.ok(Math.max(...car.map((c) => Math.abs(c.x - SHOT_LAYOUT.carX))) < 0.05);
  assert.equal(ent(last, 'car_017').damage, 'intact');
  assert.ok(ent(last, 'car_017').wetLine > 0.3, 'the car keeps its water mark');
});

test('the street has drained by the final frame, leaving puddles only in the low spots', () => {
  const t = frames[last].t;
  for (const x of [2.5, 4, 6, 10, 12]) assert.ok(flood.depthAt(x, t) < 0.03, `still ${flood.depthAt(x, t).toFixed(3)} m at x=${x}`);
  for (const d of SHOT.dips) assert.ok(flood.depthAt((d.x0 + d.x1) / 2, t) > 0.01, `no puddle at x=${(d.x0 + d.x1) / 2}`);
});

test('deterministic', async () => {
  const again = await buildShotScene();
  assert.equal(stateHash(frames), stateHash(again.frames));
});
