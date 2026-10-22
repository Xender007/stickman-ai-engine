import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bakeFloodBodies, STREET_SLOPE, type FloatBody } from './float-bake.ts';
import { bakeHash } from './rapier.ts';
import { harborBed } from '../../environment/src/harbor-field.ts';
import type { FloodScenario } from '../../environment/src/flood.ts';

/** A controlled flood: water surface at absolute elevation L(t) over the street, still (or with a constant current). */
const stub = (L: (t: number) => number, u = 0): FloodScenario => ({
  level: L,
  front: () => 0,
  arrival: () => 0,
  depthAt: (x, t) => (x >= 0 ? Math.max(0, L(t) - harborBed(x)) : 0),
  velocityAt: (x, t) => (x >= 0 && L(t) - harborBed(x) > 0.005 ? u : 0),
  etaAt: (x, t) => (x >= 0 && L(t) - harborBed(x) > 0.005 ? L(t) : harborBed(x)),
});

const log: FloatBody = { id: 'log', x: 5, w: 3.2, h: 0.35, thickness: 0.35, density: 600, floats: true };
const rest = (bake: Awaited<ReturnType<typeof bakeFloodBodies>>, t: number, id = 'log') => bake.poses[Math.round(t * 60)].find((p) => p.id === id)!;
const ground = (x: number) => harborBed(x);

test('a log in still water floats at its density ratio: 60% submerged within 10%', async () => {
  const bake = await bakeFloodBodies({ flood: stub(() => 1.0), tEnd: 20, bodies: [log] });
  const p = rest(bake, 19);
  const frac = p.submerged / log.h;
  assert.ok(Math.abs(frac - 0.6) / 0.6 < 0.1, `submerged fraction ${frac.toFixed(3)}`);
  // and it sits where Archimedes says: surface minus draft
  assert.ok(Math.abs(p.y - log.h / 2 - (1.0 - 0.6 * log.h)) < 0.02, `bottom at ${(p.y - log.h / 2).toFixed(3)}`);
});

test('after the water leaves, the log rests on the ground: gap <= 2 cm, tilt <= 5 degrees from the street slope', async () => {
  const L = (t: number) => (t < 10 ? 1.0 : Math.max(-0.5, 1.0 - 0.15 * (t - 10)));
  const bake = await bakeFloodBodies({ flood: stub(L), tEnd: 40, bodies: [log] });
  const p = rest(bake, 39);
  const gap = p.y - log.h / 2 - ground(p.x);
  assert.ok(Math.abs(gap) <= 0.02, `gap ${(gap * 100).toFixed(2)} cm`);
  const tilt = Math.abs((p.angle * 180) / Math.PI - (Math.atan(STREET_SLOPE) * 180) / Math.PI);
  assert.ok(tilt <= 5, `tilt error ${tilt.toFixed(2)} deg`);
  const before = rest(bake, 39);
  const after = rest(bake, 39.5);
  assert.ok(Math.abs(after.x - before.x) < 0.01, 'still moving');
});

test('refloat: water that returns lifts a grounded log again', async () => {
  const L = (t: number) => (t < 6 ? 1.0 : t < 20 ? -0.5 : 1.0);
  const bake = await bakeFloodBodies({ flood: stub(L), tEnd: 40, bodies: [log] });
  const grounded = rest(bake, 18);
  const refloated = rest(bake, 39);
  assert.ok(Math.abs(grounded.y - log.h / 2 - ground(grounded.x)) < 0.02, 'it should be on the ground before the second rise');
  assert.ok(refloated.y - grounded.y > 0.5, `lifted only ${(refloated.y - grounded.y).toFixed(2)} m`);
});

test('a body that does not float feels no water force', async () => {
  const car: FloatBody = { id: 'car', x: 9, w: 4.4, h: 1.5, thickness: 1.7, density: 1276, floats: false };
  const bake = await bakeFloodBodies({ flood: stub(() => 2.0, 4), tEnd: 15, bodies: [car] });
  assert.ok(Math.abs(rest(bake, 14, 'car').x - 9) < 0.05);
});

test('a current carries a floating body downstream and drag stays bounded', async () => {
  const bake = await bakeFloodBodies({ flood: stub(() => 1.0, 2), tEnd: 12, bodies: [{ ...log, x: 4 }] });
  const a = rest(bake, 8);
  const b = rest(bake, 10);
  const speed = (b.x - a.x) / 2;
  assert.ok(speed > 1.2 && speed < 2.2, `speed ${speed.toFixed(2)} m/s in a 2 m/s current`);
});

test('no body is ever below the ground on the street', async () => {
  const L = (t: number) => 1.2 * Math.sin(t / 3);
  const bake = await bakeFloodBodies({ flood: stub(L, 1), tEnd: 40, bodies: [log, { ...log, id: 'b', x: 12 }] });
  for (const frame of bake.poses) for (const p of frame) if (p.x > 0.5 && p.x < 33) assert.ok(p.y - log.h / 2 - ground(p.x) > -0.03, `${p.id} below ground at x=${p.x.toFixed(1)}`);
});

test('deterministic', async () => {
  const a = await bakeFloodBodies({ flood: stub((t) => Math.sin(t / 4)), tEnd: 20, bodies: [log] });
  const b = await bakeFloodBodies({ flood: stub((t) => Math.sin(t / 4)), tEnd: 20, bodies: [log] });
  assert.equal(bakeHash(a.poses.map((f, i) => ({ frame: i, bodies: f }))), bakeHash(b.poses.map((f, i) => ({ frame: i, bodies: f }))));
});
