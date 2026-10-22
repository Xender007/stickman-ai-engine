import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Swe1D } from './swe1d.ts';
import { stateHash } from '../../contracts/src/hash.ts';

const g = 9.81;

test('lake at rest over bumpy terrain with dry islands stays at rest (velocity < 1e-6 m/s after 600 s)', () => {
  const bump = (x: number) => -3 + 2.4 * Math.exp(-((x - 20) ** 2) / 30) + 3.6 * Math.exp(-((x - 60) ** 2) / 20) + 0.4 * Math.sin(x / 3);
  const s = new Swe1D({ x0: 0, dx: 0.5, cells: 160, bed: bump, eta0: () => 0.5 });
  const v0 = s.volume();
  s.run(600);
  let vmax = 0;
  for (let i = 0; i < s.n; i++) vmax = Math.max(vmax, Math.abs(s.velocity(i)));
  assert.ok(vmax < 1e-6, `max velocity ${vmax}`);
  assert.ok(Math.abs(s.volume() - v0) / v0 < 1e-12);
  // surface unchanged where there is water
  for (let i = 0; i < s.n; i++) if (s.h[i] > 1e-9) assert.ok(Math.abs(s.eta(i) - 0.5) < 1e-9, `eta drifted at ${i}`);
});

/** Exact Stoker solution of the wet dam break: depth at (x - xd) / t. */
function stoker(hL: number, hR: number, xi: number): number {
  const cL = Math.sqrt(g * hL);
  // Solve for the middle state hm: 2(cL - sqrt(g hm)) = (hm - hR) sqrt(g/2 (1/hm + 1/hR))
  let hm = 0.5 * (hL + hR);
  for (let k = 0; k < 100; k++) {
    const f = 2 * (cL - Math.sqrt(g * hm)) - (hm - hR) * Math.sqrt((g / 2) * (1 / hm + 1 / hR));
    const e = 1e-7;
    const hm2 = hm + e;
    const f2 = 2 * (cL - Math.sqrt(g * hm2)) - (hm2 - hR) * Math.sqrt((g / 2) * (1 / hm2 + 1 / hR));
    hm -= f / ((f2 - f) / e);
  }
  const um = 2 * (cL - Math.sqrt(g * hm));
  const shock = (hm * um) / (hm - hR);
  const cm = Math.sqrt(g * hm);
  if (xi < -cL) return hL;
  if (xi < um - cm) return ((2 * cL - xi) ** 2) / (9 * g);
  if (xi < shock) return hm;
  return hR;
}

/** Exact Ritter solution of the dry-bed dam break. */
function ritter(h0: number, xi: number): number {
  const c0 = Math.sqrt(g * h0);
  if (xi < -c0) return h0;
  if (xi < 2 * c0) return ((2 * c0 - xi) ** 2) / (9 * g);
  return 0;
}

function l1Error(s: Swe1D, exact: (xi: number) => number, xd: number, t: number): number {
  let err = 0;
  let tot = 0;
  for (let i = 0; i < s.n; i++) {
    const e = exact((s.xc(i) - xd) / t);
    err += Math.abs(s.h[i] - e) * s.dx;
    tot += e * s.dx;
  }
  return err / tot;
}

test('dam break on a wet bed matches the Stoker solution within 3% (L1 depth error)', () => {
  const s = new Swe1D({ x0: -50, dx: 0.1, cells: 1000, bed: () => 0, eta0: (x) => (x < 0 ? 2 : 1), left: 'open', right: 'open' });
  s.run(5);
  const e = l1Error(s, (xi) => stoker(2, 1, xi), 0, 5);
  assert.ok(e < 0.03, `L1 error ${(e * 100).toFixed(2)}%`);
});

test('dam break on a dry bed matches Ritter: front (at 1% of h0) within 5%, depth L1 error within 5%', () => {
  const h0 = 2;
  const s = new Swe1D({ x0: -50, dx: 0.1, cells: 1000, bed: () => 0, eta0: (x) => (x < 0 ? h0 : 0), left: 'open', right: 'open' });
  s.run(5);
  // The exact tip is a sub-centimetre parabolic film that no first-order grid resolves (1.8 cm at x = 38, 0.8 cm at x = 40),
  // so the front is compared where the depth falls to 1% of h0, evaluated on the exact solution at the same threshold.
  const thresh = 0.01 * h0;
  const c0 = Math.sqrt(g * h0);
  const exactFront = (2 * c0 - Math.sqrt(9 * g * thresh)) * 5;
  let front = -Infinity;
  for (let i = 0; i < s.n; i++) if (s.h[i] > thresh) front = s.xc(i);
  assert.ok(Math.abs(front - exactFront) / exactFront < 0.05, `front ${front.toFixed(2)} vs exact ${exactFront.toFixed(2)}`);
  const e = l1Error(s, (xi) => ritter(h0, xi), 0, 5);
  assert.ok(e < 0.05, `L1 error ${(e * 100).toFixed(2)}%`);
});

test('run-up and drain: depths never negative, mass conserved, perched water only in the closed depression', () => {
  // sea floor -3 for x < 80, beach rising 5% all the way (no plateau: a flat top cannot drain), a 0.4 m deep pool at x 150-156
  const beach = (x: number) => (x < 80 ? -3 : -3 + 0.05 * (x - 80)) - (x >= 150 && x <= 156 ? 0.4 : 0);
  // a 0.3 m sheet of flood water lying on the beach above the sea level, plus the sea at eta = 0
  const s = new Swe1D({ x0: 0, dx: 0.5, cells: 360, bed: beach, eta0: (x) => (x >= 100 ? Math.max(0, beach(x)) + 0.3 : 0), manning: 0.03 });
  const v0 = s.volume();
  let minH = Infinity;
  for (let k = 0; k < 900; k++) {
    s.run(k + 1);
    for (let i = 0; i < s.n; i++) minH = Math.min(minH, s.h[i]);
  }
  assert.ok(minH >= 0, `negative depth ${minH}`);
  assert.ok(Math.abs(s.volume() - v0) / v0 < 1e-9, 'mass not conserved');
  // Connectivity, not a level comparison (the sea basin is still sloshing): wet cells must belong to the one body that
  // runs from the left wall (the sea and whatever film is still draining into it) or to the closed pool.
  let seaEnd = 0;
  while (seaEnd < s.n && s.h[seaEnd] > 0.005) seaEnd++;
  assert.ok(seaEnd > 200 && seaEnd < 360, `the sea body ends at cell ${seaEnd}`);
  const stray: number[] = [];
  let poolDepth = 0;
  for (let i = seaEnd; i < s.n; i++) {
    const x = s.xc(i);
    // The pool fills to its seaward rim (0.475 m), so its wet margin laps about 1 m past the depression itself.
    if (x >= 148 && x <= 158) poolDepth = Math.max(poolDepth, s.h[i]);
    else if (s.h[i] > 0.005) stray.push(x);
  }
  assert.deepEqual(stray, [], 'stray puddles outside the sea body and the pool');
  assert.ok(poolDepth > 0.05, `the pool emptied (depth ${poolDepth})`);
  assert.ok(s.xc(seaEnd) < 148, 'the draining film must have separated from the pool');
});

test('mass balance with open boundaries: volume change equals the integrated boundary flux (1e-9)', () => {
  const s = new Swe1D({ x0: 0, dx: 0.5, cells: 200, bed: (x) => -1 + 0.01 * x, eta0: (x) => (x < 30 ? 2 : 0), left: 'open', right: 'open', manning: 0.02 });
  const v0 = s.volume();
  s.run(60);
  const change = s.volume() - v0;
  const flux = s.fluxLeft - s.fluxRight;
  assert.ok(Math.abs(change - flux) / v0 < 1e-9, `change ${change} vs flux ${flux}`);
  assert.ok(Math.abs(s.fluxRight) > 1e-3, 'the test should actually move water through a boundary');
});

test('closed domain conserves volume to round-off', () => {
  const s = new Swe1D({ x0: 0, dx: 0.5, cells: 200, bed: (x) => -2 + 0.02 * x, eta0: (x) => (x < 40 ? 1.5 : -0.5), manning: 0.03 });
  const v0 = s.volume();
  s.run(120);
  assert.ok(Math.abs(s.volume() - v0) / v0 < 1e-12);
});

test('deterministic: two runs give identical state hashes', () => {
  const make = () => new Swe1D({ x0: 0, dx: 0.5, cells: 200, bed: (x) => -1 + 0.01 * x + 0.2 * Math.sin(x / 4), eta0: (x) => (x < 30 ? 2 : 0), manning: 0.025 });
  const a = make();
  const b = make();
  a.run(40);
  b.run(40);
  assert.equal(stateHash({ h: Array.from(a.h), hu: Array.from(a.hu), t: a.t }), stateHash({ h: Array.from(b.h), hu: Array.from(b.hu), t: b.t }));
  assert.equal(a.steps, b.steps);
});

test('a wet front advances over a dry bed without negative depth', () => {
  const s = new Swe1D({ x0: 0, dx: 0.25, cells: 400, bed: (x) => 0.01 * x, eta0: (x) => (x < 10 ? 1.5 : 0), left: 'wall', right: 'open' });
  let minH = Infinity;
  for (let k = 1; k <= 200; k++) {
    s.run(k * 0.1);
    for (let i = 0; i < s.n; i++) minH = Math.min(minH, s.h[i]);
  }
  assert.ok(minH >= 0, `min depth ${minH}`);
});
