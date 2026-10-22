import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SceneSpec } from './scenespec.ts';
import { stateHash } from './hash.ts';

export const sample = {
  schemaVersion: 3,
  sceneId: 'harbor_retreat_detail',
  fps: 30,
  durationFrames: 450,
  seed: 'harbor-pilot-001',
  units: { length: 'm', mass: 'kg', time: 's' },
  coordinates: { upAxis: 'y', groundPlane: 'xz' },
  staging: { profile: 'lanes_2_5d@1', maxCameraYawDeg: 15 },
  world: 'harbor@3',
  storyTime: { startSeconds: 720, endSeconds: 735, mode: 'continuous' },
  style: 'drawn_survival@1',
  artwork: { allowExternalGeneration: false, requireApprovedAssets: true },
  requiredCapabilities: ['walk_on_mud@1'],
  simulation: { rigidBodyEngine: 'rapier3d', rigidStepSeconds: 1 / 120, waterSolver: 'swe_ts@1', coupling: 'static_obstacles_and_registered_major_events' },
  entities: [
    { id: 'hero', passport: 'hero@2', restoreFromState: true },
    { id: 'car_017', asset: 'sedan@3', lane: 'near' },
  ],
  actions: [{ actor: 'hero', motion: 'walk_mud@1', startFrame: 180 }],
  shots: [
    { fromFrame: 0, toFrameExclusive: 180, camera: 'harbor_wide@1' },
    { fromFrame: 180, toFrameExclusive: 450, camera: 'harbor_medium@1' },
  ],
  checks: ['persistent_entity_identity'],
};

test('the plan example validates', () => {
  assert.doesNotThrow(() => SceneSpec.parse(sample));
});

test('shots must tile the duration', () => {
  const bad = structuredClone(sample);
  bad.shots[1].fromFrame = 200;
  assert.throws(() => SceneSpec.parse(bad), /starts at 200, expected 180/);
  const short = structuredClone(sample);
  short.shots[1].toFrameExclusive = 400;
  assert.throws(() => SceneSpec.parse(short), /durationFrames/);
});

test('actions need a declared actor', () => {
  const bad = structuredClone(sample);
  bad.actions[0].actor = 'ghost';
  assert.throws(() => SceneSpec.parse(bad), /not an entity/);
});

test('rigid step must divide a frame', () => {
  const bad = structuredClone(sample);
  bad.simulation.rigidStepSeconds = 0.007;
  assert.throws(() => SceneSpec.parse(bad), /divide one frame/);
});

test('refs need versions', () => {
  const bad = structuredClone(sample);
  bad.world = 'harbor';
  assert.throws(() => SceneSpec.parse(bad), /name@version/);
});

test('state hash is order independent and rounds noise', () => {
  assert.equal(stateHash({ a: 1, b: [1, 2] }), stateHash({ b: [1, 2], a: 1.0000000000001 }));
  assert.notEqual(stateHash({ a: 1 }), stateHash({ a: 2 }));
});
