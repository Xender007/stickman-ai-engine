import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorldClock } from './clocks.ts';
import { CapabilityRegistry, resolveCapabilities } from './capabilities.ts';
import { WorldLedger } from './ledger.ts';

test('clock maps frames to story time and flags jumps', () => {
  const c = new WorldClock(30, [
    { fromFrame: 0, toFrameExclusive: 90, storyStart: 720, rate: 1 },
    { fromFrame: 90, toFrameExclusive: 150, storyStart: 3 * 86400, rate: 1 }, // three days later
  ]);
  assert.equal(c.storyTime(0), 720);
  assert.equal(c.storyTime(30), 721);
  assert.equal(c.isJump(90), true);
  assert.equal(c.isJump(30), false);
  assert.ok(Math.abs(c.storyTime(100) - 3 * 86400 - 10 / 30) < 1e-6);
});

test('clock rejects gaps', () => {
  assert.throws(() => new WorldClock(30, [{ fromFrame: 0, toFrameExclusive: 10, storyStart: 0, rate: 1 }, { fromFrame: 12, toFrameExclusive: 20, storyStart: 0, rate: 1 }]), /gap/);
});

test('storyTime is a pure function of the frame', () => {
  const c = new WorldClock(30, [{ fromFrame: 0, toFrameExclusive: 300, storyStart: 0, rate: 60 }]);
  const forward = [10, 200, 50].map((f) => c.storyTime(f));
  const shuffled = [50, 10, 200].map((f) => c.storyTime(f));
  assert.deepEqual([forward[2], forward[0], forward[1]], shuffled);
});

const car = { id: 'car_017', asset: 'sedan@3', position: [0, 0, 0] as [number, number, number], rotationZ: 0, damage: 'intact' as const, wetness: 0, present: true };

test('ledger: damage only gets worse, and needs a cause', () => {
  const l = new WorldLedger([car]);
  l.apply({ kind: 'damage', id: 'car_017', to: 'dented', cause: 'hit by log' });
  assert.throws(() => l.apply({ kind: 'damage', id: 'car_017', to: 'intact', cause: 'x' }), /repair event/);
  assert.throws(() => l.apply({ kind: 'damage', id: 'car_017', to: 'wrecked', cause: '' }), /cause/);
  l.apply({ kind: 'repair', id: 'car_017', cause: 'mechanic' });
  assert.equal(l.get('car_017').damage, 'intact');
});

test('ledger: no spawning from nothing', () => {
  const l = new WorldLedger([car]);
  assert.throws(() => l.get('wreck_099'), /never in the world/);
  const off = new WorldLedger([{ ...car, present: false }]);
  off.apply({ kind: 'arrive', id: 'car_017', cause: 'carried in by the first wave' });
  assert.equal(off.get('car_017').present, true);
});

test('capability gaps', () => {
  const reg = new CapabilityRegistry([
    { ref: 'walk_on_mud@1', summary: '', status: 'validated', needs: [], limits: [], evidence: ['t1'] },
    { ref: 'fish_stranding@1', summary: '', status: 'planned', needs: [], limits: [], evidence: [] },
    { ref: 'a@1', summary: '', status: 'validated', needs: [], limits: [], evidence: [], excludes: ['b@1'] },
    { ref: 'b@1', summary: '', status: 'validated', needs: [], limits: [], evidence: [] },
  ]);
  assert.deepEqual(resolveCapabilities({ requiredCapabilities: ['walk_on_mud@1'] }, reg), []);
  const gaps = resolveCapabilities({ requiredCapabilities: ['fish_stranding@1', 'rope_tension@1', 'a@1', 'b@1'] }, reg);
  assert.deepEqual(gaps.map((g) => g.reason).sort(), ['excluded_combination', 'missing', 'not_validated']);
  assert.equal(resolveCapabilities({ requiredCapabilities: ['fish_stranding@1'] }, reg, 'preview').length, 0);
});
