import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCarryClip, CRATE } from './carry.ts';
import { boneLengths, kneeFlexionDeg, RIG, STAND_HEIGHT } from './rig.ts';
import { contactDrift, failures, temporalJitter } from '../../quality/src/checks.ts';
import { THRESHOLDS as T } from '../../quality/src/thresholds.ts';

const clip = buildCarryClip({ massKg: 25, crateX: 3, carryDistance: 3 });
const FPS = 30;
const N = Math.floor(clip.duration * FPS);
const samples = Array.from({ length: N }, (_, f) => clip.sampleAt(f / FPS));

test('standing height matches the legacy rig in metres', () => {
  assert.ok(Math.abs(STAND_HEIGHT - 1.74) < 0.01);
});

test('identity: every bone length is constant in every frame (IK never stretches a limb)', () => {
  const ref = boneLengths(samples[0].sk);
  for (const s of samples) {
    const b = boneLengths(s.sk);
    for (const k of Object.keys(ref) as (keyof typeof ref)[]) {
      assert.ok(Math.abs(b[k] - ref[k]) < 1e-9, `${k} changed at t=${s.t.toFixed(2)}: ${b[k]} vs ${ref[k]}`);
    }
  }
  assert.ok(Math.abs(ref.lThigh - RIG.thigh) < 1e-9 && Math.abs(ref.torso - RIG.torso) < 1e-9);
});

test('planted feet do not slide: every planted interval passes the contact-drift check', () => {
  for (const foot of ['L', 'R'] as const) {
    let run: [number, number][] = [];
    const flush = () => {
      if (run.length >= 3) {
        const bad = failures(contactDrift(run, FPS));
        assert.deepEqual(bad, [], `${foot} planted run of ${run.length} frames`);
      }
      run = [];
    };
    for (const s of samples) {
      if (s.planted[foot]) run.push(foot === 'L' ? s.sk.lFoot : s.sk.rFoot);
      else flush();
    }
    flush();
  }
});

test('planted feet are on the ground (no float, no penetration); swing feet never go below it', () => {
  for (const s of samples) {
    for (const foot of ['L', 'R'] as const) {
      const p = foot === 'L' ? s.sk.lFoot : s.sk.rFoot;
      assert.ok(p[1] > -T.penetrationM, `${foot} foot below ground at t=${s.t.toFixed(2)}`);
      if (s.planted[foot]) assert.ok(Math.abs(p[1]) < 1e-9, `${foot} planted foot off the ground at t=${s.t.toFixed(2)}`);
    }
  }
});

test('the legs can always reach where the feet are (IK never clamps a leg)', () => {
  const clamped = samples.filter((s) => s.sk.clamped.lLeg || s.sk.clamped.rLeg);
  assert.equal(clamped.length, 0, `legs clamped at t=${clamped[0]?.t.toFixed(2)}`);
});

test('joint limits: knees only bend the natural way, up to 150 degrees', () => {
  for (const s of samples) {
    for (const [k, f] of [[s.sk.lKnee, s.sk.lFoot], [s.sk.rKnee, s.sk.rFoot]] as const) {
      const flex = kneeFlexionDeg(s.sk.hip, k, f);
      assert.ok(flex > -1 && flex < 150, `knee flexion ${flex.toFixed(1)} at t=${s.t.toFixed(2)}`);
    }
  }
});

test('hands stay on the crate for the whole hold (grip within 5 cm)', () => {
  const held = samples.filter((s) => s.t > clip.tGrasp + 0.05 && s.t < clip.tRelease - 0.05);
  assert.ok(held.length > 100);
  for (const s of held) {
    const grip: [number, number] = [s.crate.x - 0.2, s.crate.y + 0.05];
    const d = Math.hypot(s.sk.lHand[0] - grip[0], s.sk.lHand[1] - grip[1]);
    assert.ok(d < 0.05, `left hand is ${(d * 100).toFixed(1)} cm off the crate at t=${s.t.toFixed(2)}`);
    assert.ok(!s.sk.clamped.lArm, `arm at full stretch at t=${s.t.toFixed(2)}`);
  }
});

test('the crate is never below the ground and never moves through the body', () => {
  for (const s of samples) {
    assert.ok(s.crate.y >= CRATE.h / 2 - 1e-9, `crate under the ground at t=${s.t.toFixed(2)}`);
    // The crate's near face must stay ahead of the torso: torso line is hip -> shoulder.
    if (s.held) assert.ok(s.crate.x - CRATE.w / 2 > s.sk.shoulder[0] - 0.05, `crate overlaps the chest at t=${s.t.toFixed(2)}`);
  }
});

test('motion is smooth: no acceleration spike in hip or head tracks', () => {
  for (const [name, track] of [['hipX', samples.map((s) => s.sk.hip[0])], ['hipY', samples.map((s) => s.sk.hip[1])], ['headY', samples.map((s) => s.sk.head[1])]] as const) {
    const r = temporalJitter(track);
    assert.ok(r.pass, `${name}: ${r.detail} at frame ${r.frame}`);
  }
});

test('weight shows in posture and pace: heavier load leans back more and walks slower', () => {
  const light = buildCarryClip({ massKg: 5, crateX: 3, carryDistance: 3 });
  const heavy = buildCarryClip({ massKg: 40, crateX: 3, carryDistance: 3 });
  assert.ok(heavy.leanBackDeg > light.leanBackDeg);
  assert.ok(heavy.speeds.carry < light.speeds.carry);
  assert.ok(heavy.duration > light.duration, 'heavier carry takes longer');
});

test('a pure function of time: sampling in any order gives identical results', () => {
  const ts = [7.3, 1.1, 4.4, 9.9, 0, 4.4];
  const a = ts.map((t) => JSON.stringify(clip.sampleAt(t)));
  const b = [...ts].reverse().map((t) => JSON.stringify(clip.sampleAt(t))).reverse();
  assert.deepEqual(a, b);
});
