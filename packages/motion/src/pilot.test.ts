import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotClip, GANTRY, landingY, surfaceY, treadX, treadY } from './pilot.ts';
import { boneLengths, kneeFlexionDeg, RIG } from './rig.ts';
import { contactDrift, failures, temporalJitter } from '../../quality/src/checks.ts';
import { THRESHOLDS as T } from '../../quality/src/thresholds.ts';

const ground = (x: number) => 0.01 * x;
const clip = buildPilotClip({ stairs: GANTRY, ground, boxKg: 12, xStart: 10.4, xExit: 9.5, tDescend: 58 });
const FPS = 30;
const N = Math.floor(clip.duration * FPS);
const samples = Array.from({ length: N }, (_, f) => clip.sampleAt(f / FPS));
const { turn } = clip.events;

test('the clip tells the story in order, inside 35 s of story time', () => {
  const e = clip.events;
  assert.ok(e.climbStart > 4 && e.climbStart < 9, `climb starts at ${e.climbStart}`);
  assert.ok(e.atLanding - e.climbStart > 5 && e.atLanding - e.climbStart < 7.5, 'the climb takes about 6 s');
  assert.ok(e.atLanding < 14, `at the landing by ${e.atLanding}`);
  assert.ok(e.turn >= 57 && e.descentStart >= e.turn);
  assert.ok(e.onStreet > e.descentStart + 4 && e.end > e.onStreet + 3);
  assert.ok(clip.duration < 75, `duration ${clip.duration}`);
});

test('identity: every bone length is constant in every frame, facing either way', () => {
  const ref = boneLengths(samples[0].sk);
  for (const s of samples) {
    const b = boneLengths(s.sk);
    for (const k of Object.keys(ref) as (keyof typeof ref)[]) assert.ok(Math.abs(b[k] - ref[k]) < 1e-9, `${k} changed at t=${s.t.toFixed(2)} (facing ${s.facing})`);
  }
  assert.ok(Math.abs(ref.torso - RIG.torso) < 1e-9);
});

test('planted feet do not slide: every planted run on flat ground and on stairs passes the contact-drift check', () => {
  for (const foot of ['L', 'R'] as const) {
    let run: [number, number][] = [];
    const flush = () => {
      if (run.length >= 3) assert.deepEqual(failures(contactDrift(run, FPS)), [], `${foot} planted run of ${run.length} frames`);
      run = [];
    };
    for (const s of samples) {
      if (s.planted[foot]) run.push(foot === 'L' ? s.sk.lFoot : s.sk.rFoot);
      else flush();
    }
    flush();
  }
});

test('planted feet stand exactly on the surface (street, tread or landing); swing feet never pass through it', () => {
  for (const s of samples) {
    for (const foot of ['L', 'R'] as const) {
      const p = foot === 'L' ? s.sk.lFoot : s.sk.rFoot;
      const surf = surfaceY(GANTRY, ground, p[0]);
      if (s.planted[foot]) assert.ok(Math.abs(p[1] - surf) < 1e-6, `${foot} planted ${((p[1] - surf) * 100).toFixed(2)} cm off the surface at t=${s.t.toFixed(2)} x=${p[0].toFixed(2)}`);
      else assert.ok(p[1] - surf > -T.penetrationM, `${foot} swing foot ${(-(p[1] - surf) * 100).toFixed(1)} cm into the surface at t=${s.t.toFixed(2)} x=${p[0].toFixed(2)}`);
    }
  }
});

test('the legs always reach where the feet are, and the knees only bend the natural way', () => {
  for (const s of samples) {
    assert.ok(!s.sk.clamped.lLeg && !s.sk.clamped.rLeg, `a leg is at full stretch at t=${s.t.toFixed(2)}`);
    for (const [k, f] of [[s.sk.lKnee, s.sk.lFoot], [s.sk.rKnee, s.sk.rFoot]] as const) {
      // mirror into the facing frame so the same limits apply to both directions
      const m = (v: [number, number]): [number, number] => [s.sk.hip[0] + (v[0] - s.sk.hip[0]) * s.facing, v[1]];
      const flex = kneeFlexionDeg(m(s.sk.hip), m(k), m(f));
      assert.ok(flex > -1 && flex < 150, `knee flexion ${flex.toFixed(1)} at t=${s.t.toFixed(2)}`);
    }
  }
});

test('both hands stay on the box throughout, with no arm at full stretch', () => {
  for (const s of samples) {
    const grip: [number, number] = [s.box.x + -0.2 * s.facing, s.box.y + 0.05];
    const d = Math.hypot(s.sk.lHand[0] - grip[0], s.sk.lHand[1] - grip[1]);
    assert.ok(d < 0.05, `hand ${(d * 100).toFixed(1)} cm off the box at t=${s.t.toFixed(2)}`);
    assert.ok(!s.sk.clamped.lArm && !s.sk.clamped.rArm, `arm at full stretch at t=${s.t.toFixed(2)}`);
  }
});

test('the box never goes through the stairs, the landing or the street', () => {
  for (const s of samples) {
    const surf = surfaceY(GANTRY, ground, s.box.x);
    assert.ok(s.box.y - 0.2 > surf - 0.01, `box ${((surf - (s.box.y - 0.2)) * 100).toFixed(1)} cm into the surface at t=${s.t.toFixed(2)}`);
  }
});

test('smooth motion within each moving stretch (the 40 s wait is excluded: standing still makes sigma meaningless; the turn is a declared flip)', () => {
  const going = samples.filter((s) => s.t <= clip.events.atLanding + 1.6);
  const coming = samples.filter((s) => s.t >= turn + 0.3);
  for (const [label, set] of [['going', going], ['coming back', coming]] as const) {
    for (const [name, track] of [['hipX', set.map((s) => s.sk.hip[0])], ['hipY', set.map((s) => s.sk.hip[1])], ['headY', set.map((s) => s.sk.head[1])], ['boxY', set.map((s) => s.box.y)]] as const) {
      const r = temporalJitter(track);
      assert.ok(r.pass, `${label} ${name}: ${r.detail} at frame ${r.frame} (t=${((r.frame ?? 0) / FPS + (label === 'going' ? 0 : turn + 0.3)).toFixed(2)})`);
    }
  }
});

test('the climb reaches the landing height and the descent returns to the street', () => {
  const top = samples.find((s) => s.t >= clip.events.atLanding + 0.1)!;
  assert.ok(Math.abs(top.sk.lFoot[1] - landingY(GANTRY)) < 0.3);
  const end = samples[samples.length - 1];
  assert.ok(Math.abs(end.sk.lFoot[1] - ground(end.sk.lFoot[0])) < 1e-6);
  assert.ok(end.sk.hip[0] < GANTRY.x0 - 2, `ended at x=${end.sk.hip[0].toFixed(1)}`);
  assert.equal(end.facing, -1);
  assert.ok(Math.abs(treadX(GANTRY, 1) - (GANTRY.x0 + 0.14)) < 1e-9 && Math.abs(treadY(GANTRY, 12) - landingY(GANTRY)) < 1e-9);
});

test('a pure function of time: sampling in any order gives identical results', () => {
  const ts = [20.3, 1.1, 7.4, 61.9, 0, 7.4];
  const a = ts.map((t) => JSON.stringify(clip.sampleAt(t)));
  const b = [...ts].reverse().map((t) => JSON.stringify(clip.sampleAt(t))).reverse();
  assert.deepEqual(a, b);
});
