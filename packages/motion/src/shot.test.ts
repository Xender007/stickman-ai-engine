import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShotClip } from './shot.ts';
import { boneLengths3, dist3 } from './rig3.ts';
import { RIG } from './rig.ts';
import { surfaceY } from './pilot.ts';
import { shotBed, SHOT_STAIRS, SHOT_LAYOUT } from '../../environment/src/shot-terrain.ts';
import { contactDrift, failures, temporalJitter } from '../../quality/src/checks.ts';

const S = { ...SHOT_STAIRS };
const clip = buildShotClip({ stairs: S, ground: shotBed, xStart: SHOT_LAYOUT.raviStartX, boxKg: 12 });
const FPS = 30;
const samples = Array.from({ length: Math.floor(clip.duration * FPS) }, (_, f) => clip.sampleAt(f / FPS));

test("beats match the prompt: stop near 2 s, look 2 to 3.5 s, landing near 7 s, turn after", () => {
  const e = clip.events;
  assert.ok(e.stop > 1.7 && e.stop < 2.5);
  assert.ok(e.lookStart >= e.stop && e.lookEnd <= 3.6);
  assert.ok(e.atLanding > 6.3 && e.atLanding < 7.3, `landing at ${e.atLanding}`);
  assert.ok(e.turnStart > e.atLanding && e.turnEnd < 9);
});

test('identity in 3D: every bone keeps its length through both turns', () => {
  const ref = boneLengths3(samples[0].sk);
  for (const s of samples) {
    const b = boneLengths3(s.sk);
    for (const k of Object.keys(ref) as (keyof typeof ref)[]) assert.ok(Math.abs(b[k] - ref[k]) < 1e-9, `${k} at t=${s.t.toFixed(2)}`);
  }
  assert.ok(Math.abs(ref.thighL - RIG.thigh) < 1e-9 && Math.abs(ref.torso - RIG.torso) < 1e-9);
});

test('planted feet do not slide (x, y and z) and stand exactly on the street, tread or landing', () => {
  for (const foot of ['L', 'R'] as const) {
    let run: [number, number][] = [];
    let zs: number[] = [];
    const flush = () => {
      if (run.length >= 3) assert.deepEqual(failures(contactDrift(run, FPS)), [], `${foot} planted run of ${run.length} frames`);
      if (zs.length >= 2) assert.ok(Math.max(...zs) - Math.min(...zs) < 1e-9, `${foot} planted foot moved sideways`);
      run = [];
      zs = [];
    };
    for (const s of samples) {
      const p = foot === 'L' ? s.sk.footL : s.sk.footR;
      if (s.planted[foot]) {
        run.push([p[0], p[1]]);
        zs.push(p[2]);
        assert.ok(Math.abs(p[1] - surfaceY(S, shotBed, p[0])) < 1e-6, `${foot} off the surface at t=${s.t.toFixed(2)}`);
      } else {
        flush();
        assert.ok(p[1] - surfaceY(S, shotBed, p[0]) > -0.02, `${foot} swing foot through the surface at t=${s.t.toFixed(2)} x=${p[0].toFixed(2)}`);
      }
    }
    flush();
  }
});

test('legs and arms always reach; the knees bend forward', () => {
  for (const s of samples) {
    const c = s.sk.clamped;
    assert.ok(!c.legL && !c.legR && !c.armL && !c.armR, `a limb at full stretch at t=${s.t.toFixed(2)}`);
    // knee in front of the hip-foot line, measured along the hips' facing direction
    const f = [Math.cos(s.hipYaw), 0, Math.sin(s.hipYaw)];
    for (const [h, k, ft] of [[s.sk.hipL, s.sk.kneeL, s.sk.footL], [s.sk.hipR, s.sk.kneeR, s.sk.footR]] as const) {
      const midLine = [(h[0] + ft[0]) / 2, (h[1] + ft[1]) / 2, (h[2] + ft[2]) / 2];
      const ahead = (k[0] - midLine[0]) * f[0] + (k[2] - midLine[2]) * f[2];
      assert.ok(ahead > -1e-6, `knee bends backward at t=${s.t.toFixed(2)}`);
    }
  }
});

test('both hands stay on the crate (sides of the crate, within 3 cm) at all times, through both turns', () => {
  for (const s of samples) {
    const dl = dist3(s.sk.handL, s.box.c);
    const dr = dist3(s.sk.handR, s.box.c);
    assert.ok(Math.abs(dl - dr) < 0.03 && dl < 0.3 && dr < 0.3, `hands ${dl.toFixed(3)} / ${dr.toFixed(3)} m from the crate at t=${s.t.toFixed(2)}`);
  }
});

test('turns are continuous: yaw never jumps between frames, and he ends facing the sea', () => {
  for (let i = 1; i < samples.length; i++) {
    assert.ok(Math.abs(samples[i].hipYaw - samples[i - 1].hipYaw) < 0.25, `hip yaw jumped at t=${samples[i].t.toFixed(2)}`);
    assert.ok(Math.abs(samples[i].chestYaw - samples[i - 1].chestYaw) < 0.25, `chest yaw jumped at t=${samples[i].t.toFixed(2)}`);
  }
  const end = samples[samples.length - 1];
  assert.ok(Math.abs(end.hipYaw - Math.PI) < 1e-9 && Math.abs(end.chestYaw - Math.PI) < 1e-9);
  const mid = samples.find((s) => s.t > (clip.events.lookStart + clip.events.lookEnd) / 2)!;
  assert.ok(mid.chestYaw > 1.5 && mid.hipYaw === 0, 'during the look only the torso turns');
});

test('smooth: no 5-sigma spike in the hip, head or crate during the moving part of the shot', () => {
  const moving = samples.filter((s) => s.t <= clip.events.turnEnd + 0.2);
  for (const [name, tr] of [['hipX', moving.map((s) => s.sk.hip[0])], ['hipY', moving.map((s) => s.sk.hip[1])], ['headY', moving.map((s) => s.sk.head[1])], ['crateY', moving.map((s) => s.box.c[1])]] as const) {
    const r = temporalJitter(tr);
    assert.ok(r.pass, `${name}: ${r.detail} at frame ${r.frame}`);
  }
});

test('the crate never goes through the stairs or the street', () => {
  for (const s of samples) assert.ok(s.box.c[1] - 0.2 > surfaceY(S, shotBed, s.box.c[0]) - 0.01, `crate into the surface at t=${s.t.toFixed(2)}`);
});
