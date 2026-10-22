import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harborFlood } from './flood.ts';

test('water is never on the street while the sea is below street level', () => {
  const f = harborFlood({ quayX: 0 });
  for (let i = 0; i < 400; i++) {
    const t = i / 30;
    if (Number.isFinite(f.front(t))) assert.ok(f.level(t) > 0, `front on the street at t=${t.toFixed(2)} while level=${f.level(t).toFixed(2)}`);
  }
});

test('level is monotonic non-decreasing and the front only advances', () => {
  const f = harborFlood({ quayX: 0 });
  let l = -Infinity;
  let x = -Infinity;
  for (let i = 0; i < 400; i++) {
    const t = i / 30;
    assert.ok(f.level(t) >= l - 1e-12);
    assert.ok(f.front(t) >= x);
    l = f.level(t);
    x = f.front(t);
  }
});

test('arrival is the inverse of the front', () => {
  const f = harborFlood({ quayX: 0 });
  for (const x of [1, 6.8, 12]) assert.ok(Math.abs(f.front(f.arrival(x)) - x) < 1e-9);
});
