import { CAMERAS } from './envcameras.ts';
import { shotLocation } from './location.ts';
import { WorldClock } from './clocks.ts';
import { buildEnvTimeline, RIG3_ORDER, type EnvFrame, type EnvShot } from './envtimeline.ts';
import { bakeField, fieldScenario, type FloodField } from '../../environment/src/harbor-field.ts';
import { shotBed, SHOT, SHOT_STAIRS, SHOT_LAYOUT } from '../../environment/src/shot-terrain.ts';
import type { FloodScenario } from '../../environment/src/flood.ts';
import { bakeFloodBodies, type FloatBake } from '../../physics/src/float-bake.ts';
import { buildShotClip, type ShotClip } from '../../motion/src/shot.ts';
import type { Stairs } from '../../motion/src/pilot.ts';
import { posesAt } from './floodfixture.ts';

/**
 * The single locked 10 s shot from the user's prompt (docs/reference/target-look-harbor-stairs.mp4 is what another engine made
 * from the same prompt). Locked camera, no cuts. Story time runs at edit speed for 8.8 s, then the drain is compressed into
 * 0.9 s, then a 0.3 s hold.
 */
export const FPS = 30;
export const FRAMES = 300;
/** Story seconds at the first frame: the bore slams the quay wall at about edit 2.25 s. */
export const OFFSET = 6.1;
export const STAIRS: Stairs = { ...SHOT_STAIRS };
export const X_START = SHOT_LAYOUT.raviStartX;

export interface ShotScene {
  field: FloodField;
  flood: FloodScenario;
  bake: FloatBake;
  clip: ShotClip;
  frames: EnvFrame[];
  shots: EnvShot[];
  clock: WorldClock;
}

export const shotClock = () =>
  new WorldClock(FPS, [
    { fromFrame: 0, toFrameExclusive: 264, storyStart: OFFSET, rate: 1 },
    { fromFrame: 264, toFrameExclusive: 291, storyStart: OFFSET + 8.8, rate: (60 - (OFFSET + 8.8)) / 0.9 },
    { fromFrame: 291, toFrameExclusive: FRAMES, storyStart: 60, rate: 1 },
  ]);

export async function buildShotScene(): Promise<ShotScene> {
  const location = shotLocation(STAIRS, X_START);
  const field = bakeField({ bed: shotBed, tEnd: 90, surgeEta: 1.4, seaEta: -1.0, xEnd: 20, keepFrom: -20 });
  const flood = fieldScenario(field, shotBed, SHOT.buildingLine, -3);
  const top = STAIRS.n * STAIRS.rise;
  const lx = STAIRS.x0 + STAIRS.n * STAIRS.run;
  const bake = await bakeFloodBodies({
    flood,
    tEnd: 90,
    ground: { bed: shotBed, slope: SHOT.slope, wallX: SHOT.buildingLine, seaFloorY: -2.8 },
    statics: [
      { id: 'quay_wall', x: -0.3, y: 0.45, w: 0.6, h: 0.9, lane: 'front' },
      { id: 'gantry_01', x: STAIRS.x0 + 0.1, y: 0.6, w: 0.1, h: 1.2, lane: 'front' },
      { id: 'gantry_01', x: lx + 0.15, y: top / 2, w: 0.14, h: top, lane: 'front' },
      { id: 'gantry_01', x: lx + STAIRS.landingLen - 0.15, y: top / 2, w: 0.14, h: top, lane: 'front' },
    ],
    bodies: [
      { id: 'car_017', x: SHOT_LAYOUT.carX, w: 4.2, h: 1.5, thickness: 1.7, density: 1276, floats: false, lane: 'hero' },
      { id: 'log_003', x: SHOT_LAYOUT.logX, w: 1.8, h: 0.32, thickness: 0.32, density: 600, floats: true, lane: 'front' },
    ],
  });
  const clip = buildShotClip({ stairs: STAIRS, ground: shotBed, xStart: X_START, boxKg: 12 });
  const clock = shotClock();
  const shots: EnvShot[] = [{ fromFrame: 0, toFrameExclusive: FRAMES, camera: CAMERAS.locked }];
  // Ravi's own time follows story time until he is standing still on the landing; after that he only breathes (edit time).
  const clipTime = (storyT: number) => Math.min(storyT - OFFSET, clip.duration);

  const frames = buildEnvTimeline({
    fps: FPS,
    frames: FRAMES,
    location,
    flood,
    storyTime: (f) => clock.storyTime(f),
    shots,
    poseAt: (f, t) => {
      const s = clip.sampleAt(clipTime(t), f / FPS);
      return [...posesAt(bake, t), { id: 'ravi', x: s.sk.hip[0], y: s.sk.hip[1], angle: 0 }, { id: 'box_ravi', x: s.box.c[0], y: s.box.c[1], angle: 0 }];
    },
    charactersAt: (f, t) => {
      const s = clip.sampleAt(clipTime(t), f / FPS);
      const k = s.sk;
      return [
        {
          id: 'ravi',
          j: [k.hip, k.neck, k.head, k.kneeL, k.kneeR, k.footL, k.footR, k.elbowL, k.elbowR, k.handL, k.handR].flatMap((v) => [v[0], v[1]]),
          facing: Math.cos(s.hipYaw) >= 0 ? 1 : -1,
          feetX: [k.footL[0], k.footR[0]],
          feetY: [k.footL[1], k.footR[1]],
          planted: [s.planted.L, s.planted.R],
          rig3: {
            j: RIG3_ORDER.flatMap((name) => (k as unknown as Record<string, [number, number, number]>)[name].map((v) => Math.round(v * 1e4) / 1e4)),
            hipYaw: s.hipYaw,
            chestYaw: s.chestYaw,
            box: [s.box.c[0], s.box.c[1], s.box.c[2], s.box.yaw],
          },
        },
      ];
    },
    impacts: bake.impacts,
    profile: { x0: -20, x1: 18, step: 0.25 },
  });
  return { field, flood, bake, clip, frames, shots, clock };
}
