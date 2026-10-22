import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHarborScene, CAMERAS, CUT_FRAME } from './envfixture.ts';
import { project } from './camera.ts';
import { stateHash } from '../../contracts/src/hash.ts';
import { damageFromImpulse } from './envtimeline.ts';

const scene = await buildHarborScene();
const frames = scene.frames;
const ent = (f: number, id: string) => frames[f].entities.find((e) => e.id === id)!;

test('no entity appears or disappears: the same ids in every frame, including across the cut', () => {
  const ids = frames[0].entities.map((e) => e.id).join(',');
  for (const f of frames) assert.equal(f.entities.map((e) => e.id).join(','), ids);
});

test('state is continuous across the cut: positions, damage, water and wetness', () => {
  const a = frames[CUT_FRAME - 1];
  const b = frames[CUT_FRAME];
  assert.notEqual(a.camera.id, b.camera.id, 'there is a cut here');
  for (const e of a.entities) {
    const n = b.entities.find((x) => x.id === e.id)!;
    assert.ok(Math.hypot(e.x - n.x, e.y - n.y) < 0.05, `${e.id} jumped across the cut`);
    assert.equal(e.damage, n.damage, `${e.id} changed damage at the cut`);
    assert.ok(Math.abs(e.wetness - n.wetness) < 0.1, `${e.id} wetness jumped`);
    assert.ok(Math.abs(e.wetLine - n.wetLine) < 0.1, `${e.id} wet line jumped`);
  }
  assert.ok(Math.abs(a.water.level - b.water.level) < 0.1);
});

test('the car is damaged by the impact and not before: cause, timing, level', () => {
  assert.equal(scene.impacts.length, 1);
  const hitFrame = Math.ceil(scene.impacts[0].t * 30);
  assert.ok(hitFrame > CUT_FRAME, 'the impact happens in the second shot, after the cut');
  assert.equal(ent(hitFrame - 1, 'car_017').damage, 'intact');
  assert.equal(ent(hitFrame, 'car_017').damage, damageFromImpulse(scene.impacts[0].impulse));
  assert.equal(ent(frames.length - 1, 'car_017').damage, 'dented');
  assert.match(frames[frames.length - 1].causes.join(';'), /car_017: dented <- log_003 \d+ N\*s at t=\d+\.\d\d/);
  for (const id of ['lamp_01', 'bldg_a', 'log_003']) assert.equal(ent(frames.length - 1, id).damage, 'intact', `${id} must be untouched`);
});

test('damage never reverses over the whole timeline', () => {
  const order = ['intact', 'dented', 'wrecked'];
  for (const id of frames[0].entities.map((e) => e.id)) {
    let worst = 0;
    for (const f of frames) {
      const k = order.indexOf(f.entities.find((e) => e.id === id)!.damage);
      assert.ok(k >= worst, `${id} damage went backwards at frame ${f.frame}`);
      worst = k;
    }
  }
});

test('wetness rises only after the flood front arrives, and never goes backwards', () => {
  for (const id of ['car_017', 'bldg_a', 'bldg_b']) {
    const first = frames.findIndex((f) => f.entities.find((e) => e.id === id)!.wetness > 0);
    assert.ok(first > 0, `${id} is wet from the start`);
    const e0 = ent(first, id);
    assert.ok(frames[first].water.front >= e0.x - e0.w / 2 - 0.2, `${id} got wet before the front reached it`);
    let prev = 0;
    for (const f of frames) {
      const w = f.entities.find((e) => e.id === id)!.wetness;
      assert.ok(w >= prev - 1e-9, `${id} wetness fell at frame ${f.frame}`);
      prev = w;
    }
  }
});

test('the wet line on the car equals the shared water level (one water, every camera)', () => {
  const last = frames[frames.length - 1];
  const car = last.entities.find((e) => e.id === 'car_017')!;
  assert.ok(Math.abs(car.wetLine - Math.min(car.h, last.water.level)) < 1e-9);
  const bldg = last.entities.find((e) => e.id === 'bldg_a')!;
  assert.ok(Math.abs(bldg.wetLine - Math.min(bldg.h, last.water.level)) < 1e-9, 'building and car share one water level');
});

test('same geography in both cameras: the entities visible in both appear in the same left-to-right order', () => {
  const f = frames[CUT_FRAME];
  const order = (cam: typeof CAMERAS.wide) =>
    f.entities
      .map((e) => ({ id: e.id, p: project(cam, [e.x, e.y, e.lane === 'near' ? -10 : 0]) }))
      .filter((o) => o.p.visible)
      .sort((a, b) => a.p.u - b.p.u)
      .map((o) => o.id);
  const wide = order(CAMERAS.wide);
  const medium = order(CAMERAS.medium);
  const both = wide.filter((id) => medium.includes(id));
  assert.ok(both.length >= 2, `only ${both.length} entities visible in both cameras`);
  assert.deepEqual(both, medium.filter((id) => both.includes(id)));
  for (const id of ['car_017', 'log_003', 'lamp_01']) assert.ok(wide.includes(id), `${id} not visible in the wide shot`);
  for (const id of ['car_017']) assert.ok(medium.includes(id), `${id} not visible in the medium shot`);
});

test('the same water level maps to the same world height through both cameras', () => {
  const f = frames[frames.length - 1];
  for (const cam of [CAMERAS.wide, CAMERAS.medium]) {
    const p = project(cam, [9, f.water.level, 0]);
    const back = cam.pos[1] + p.v * (cam.pos[2] - 0) * Math.tan((cam.fovDeg * Math.PI) / 360);
    assert.ok(Math.abs(back - f.water.level) < 1e-9);
  }
});

test('deterministic timeline: two builds hash identically', async () => {
  const again = await buildHarborScene();
  assert.equal(stateHash(frames), stateHash(again.frames));
});
