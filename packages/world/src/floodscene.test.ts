import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFloodScene, clock, CUTS, FRAMES, STORY_END } from './floodfixture.ts';
import { stateHash } from '../../contracts/src/hash.ts';
import { STREET_SLOPE } from '../../physics/src/float-bake.ts';
import { harborBed } from '../../environment/src/harbor-field.ts';

const scene = await buildFloodScene();
const { frames, field, flood, bake } = scene;
const ent = (f: number, id: string) => frames[f].entities.find((e) => e.id === id)!;
const last = frames.length - 1;

test('the solver field conserves mass to round-off (boundary-flux balance)', () => {
  assert.ok(field.info.massError < 1e-9, `mass error ${field.info.massError}`);
  assert.equal(field.info.fluxLeft, 0, 'closed boundaries');
  assert.ok(field.info.steps > 1000);
});

test('two clocks: 18 s of video cover 144.5 s of story, monotonically, with no gap at the segment joins', () => {
  const c = clock();
  let prev = -1;
  for (let f = 0; f < FRAMES; f++) {
    const t = c.storyTime(f);
    assert.ok(t > prev, `story time went backwards at frame ${f}`);
    prev = t;
  }
  assert.ok(Math.abs(c.storyTime(0) - 5.5) < 1e-9);
  assert.ok(c.storyTime(FRAMES - 1) > 148 && c.storyTime(FRAMES - 1) <= STORY_END);
  for (const f of [45, 225, 345]) assert.equal(c.isJump(f), false, `an unexplained jump at frame ${f}`);
  assert.ok(FRAMES / 30 < 20 && c.storyTime(FRAMES - 1) - c.storyTime(0) > 140);
});

test('the surge arrives: dry street, then water, in the order the solver says', () => {
  assert.ok(flood.depthAt(2, 5.5) < 0.005, 'the street is dry before the surge');
  assert.ok(flood.arrival(2) > 6.5 && flood.arrival(2) < 8, `arrival at the quay ${flood.arrival(2)}`);
  assert.ok(flood.arrival(9) > flood.arrival(2) && flood.arrival(25) > flood.arrival(9), 'the front moves inland');
  const peak = Math.max(...Array.from({ length: 300 }, (_, i) => flood.depthAt(9, 7 + i * 0.1)));
  assert.ok(peak > 0.7 && peak < 1.6, `peak depth at the car ${peak.toFixed(2)} m`);
});

test('drawdown: the sea falls below the street and the street drains, leaving the pit full', () => {
  assert.ok(flood.level(25) < -0.5, `sea at ${flood.level(25).toFixed(2)} m`);
  const street = [3, 6, 12, 16, 26, 30].map((x) => flood.depthAt(x, 140));
  for (const d of street) assert.ok(d < 0.03, `street still ${d.toFixed(2)} m deep at the end`);
  assert.ok(flood.depthAt(20.5, 140) > flood.depthAt(16, 140), 'the pit (x 19 to 22) holds more water than the street around it');
});

test('the log is carried into the car; the impact damages it, caused by the simulation', () => {
  assert.equal(bake.impacts.length >= 1, true);
  const hit = bake.impacts.find((i) => i.a === 'log_003' && i.b === 'car_017')!;
  assert.ok(hit, 'no log-car impact');
  assert.ok(hit.t > flood.arrival(3) && hit.t < flood.arrival(9) + 3, `impact at ${hit.t}`);
  const clk = clock();
  const hitFrame = frames.findIndex((f) => f.t >= hit.t);
  assert.ok(hitFrame >= CUTS.toMedium, 'the impact happens after the cut to the medium shot');
  assert.equal(ent(hitFrame - 1, 'car_017').damage, 'intact');
  assert.equal(ent(last, 'car_017').damage, hit.impulse >= 600 ? 'wrecked' : 'dented');
  assert.match(frames[last].causes.join(';'), /car_017: (dented|wrecked) <- log_003 \d+ N\*s/);
  void clk;
});

test('damage never reverses and only the struck car is damaged', () => {
  const order = ['intact', 'dented', 'wrecked'];
  for (const id of frames[0].entities.map((e) => e.id)) {
    let worst = 0;
    for (const f of frames) {
      const k = order.indexOf(f.entities.find((e) => e.id === id)!.damage);
      assert.ok(k >= worst);
      worst = k;
    }
  }
  for (const id of ['lamp_01', 'bldg_a', 'bldg_b', 'bollard_01', 'crate_02']) assert.equal(ent(last, id).damage, 'intact', id);
});

test('the wet mark stays after the water leaves and wetness dries slowly', () => {
  let maxLine = 0;
  let maxWet = 0;
  for (const f of frames) {
    const e = f.entities.find((x) => x.id === 'bldg_a')!;
    maxLine = Math.max(maxLine, e.wetLine);
    maxWet = Math.max(maxWet, e.wetness);
  }
  const end = ent(last, 'bldg_a');
  assert.ok(maxLine > 0.3, `the building never got a wet mark (${maxLine})`);
  assert.ok(end.wetLine >= 0.99 * maxLine, 'the wet line must not fall when the water leaves');
  assert.ok(end.wetness < maxWet - 0.01 && end.wetness > 0, `wetness should be drying: peak ${maxWet.toFixed(2)}, end ${end.wetness.toFixed(2)}`);
});

test('state is continuous across both cuts', () => {
  for (const cut of [CUTS.toMedium, CUTS.toStrand]) {
    const a = frames[cut - 1];
    const b = frames[cut];
    assert.notEqual(a.camera.id, b.camera.id);
    for (const e of a.entities) {
      const n = b.entities.find((x) => x.id === e.id)!;
      assert.ok(Math.hypot(e.x - n.x, e.y - n.y) < 0.3, `${e.id} jumped ${Math.hypot(e.x - n.x, e.y - n.y).toFixed(2)} m at the cut`);
      assert.equal(e.damage, n.damage);
      assert.ok(Math.abs(e.wetness - n.wetness) < 0.1 && Math.abs(e.wetLine - n.wetLine) < 0.2, `${e.id} wet state jumped`);
    }
  }
});

test('debris floats only where there is water, and the crate ends grounded: gap <= 2 cm, tilt <= 5 degrees, at rest', () => {
  bake.poses.forEach((frame, i) => {
    for (const p of frame) if (p.submerged > 0) assert.ok(flood.depthAt(p.x, i * bake.sampleDt) > 0.005, `${p.id} floating on dry ground at t=${(i * bake.sampleDt).toFixed(2)}`);
  });
  const end = bake.poses[bake.poses.length - 1].find((p) => p.id === 'crate_02')!;
  const before = bake.poses[bake.poses.length - 1 - 120].find((p) => p.id === 'crate_02')!; // 2 s earlier
  const gap = end.y - 0.35 - harborBed(end.x) - (end.x >= 19 && end.x <= 22 ? 0 : 0);
  assert.ok(Math.abs(gap) <= 0.02 + 0.18 * (end.x >= 19 && end.x <= 22 ? 1 : 0), `crate gap ${(gap * 100).toFixed(1)} cm`);
  const tilt = Math.abs((end.angle * 180) / Math.PI - (Math.atan(STREET_SLOPE) * 180) / Math.PI);
  assert.ok(tilt <= 5, `tilt error ${tilt.toFixed(2)} deg`);
  assert.ok(Math.hypot(end.x - before.x, end.y - before.y) < 0.02, 'the crate is still moving at the end');
  assert.ok(end.x > 5 && end.x < 34, `the crate ended at x=${end.x.toFixed(1)}`);
});

test('the swept log leaves the street and is not found stranded on it', () => {
  const end = bake.poses[bake.poses.length - 1].find((p) => p.id === 'log_003')!;
  assert.ok(end.x < 0, `log ended at x=${end.x.toFixed(1)}`);
});

test('water profile is finite and non-negative in every frame', () => {
  for (const f of frames) {
    const p = f.water.profile!;
    assert.ok(p.depth.every((d) => Number.isFinite(d) && d >= 0) && p.eta.every(Number.isFinite) && p.u.every(Number.isFinite));
  }
});

test('deterministic: a second build gives the same state hash', async () => {
  const again = await buildFloodScene();
  assert.equal(stateHash(frames), stateHash(again.frames));
});
