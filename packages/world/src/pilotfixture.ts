import { CAMERAS } from './envcameras.ts';
import { harborStreetWithRavi } from './location.ts';
import { WorldClock } from './clocks.ts';
import { buildEnvTimeline, type EnvFrame, type EnvShot } from './envtimeline.ts';
import { bakeHarborField, fieldScenario, type FloodField } from '../../environment/src/harbor-field.ts';
import type { FloodScenario } from '../../environment/src/flood.ts';
import { bakeFloodBodies, type FloatBake } from '../../physics/src/float-bake.ts';
import { buildPilotClip, GANTRY, type PilotClip } from '../../motion/src/pilot.ts';
import { posesAt, STORY_END } from './floodfixture.ts';

/**
 * Milestone 4 pilot: "The Drawdown, then the Hit" in one edit. Ravi carries a box toward a stair gantry; the surge arrives as
 * he climbs; the log wrecks the car; he waits on the landing while the street drains (time-lapse), turns, descends and
 * walks out across the wet street. 29 s of video cover about 70 s of story.
 */
export const FPS = 30;
export const X_START = 10.4;
export const T_DESCEND = 58;
export const street = (x: number) => 0.01 * x;

export interface PilotScene {
  field: FloodField;
  flood: FloodScenario;
  bake: FloatBake;
  clip: PilotClip;
  frames: EnvFrame[];
  shots: EnvShot[];
  clock: WorldClock;
}

export async function buildPilotScene(): Promise<PilotScene> {
  const location = harborStreetWithRavi(GANTRY, X_START);
  const field = bakeHarborField({ tEnd: STORY_END });
  const flood = fieldScenario(field);
  const spec = (id: string) => location.entities.find((e) => e.id === id)!;
  const [car, log, crate] = [spec('car_017'), spec('log_003'), spec('crate_02')];
  const bake = await bakeFloodBodies({
    flood,
    tEnd: STORY_END,
    bodies: [
      { id: car.id, x: car.x, w: car.w, h: car.h, thickness: 1.7, density: 1276, floats: false },
      { id: log.id, x: log.x, w: log.w, h: log.h, thickness: 0.35, density: 600, floats: true },
      { id: crate.id, x: crate.x, w: crate.w, h: crate.h, thickness: 0.7, density: 450, floats: true },
    ],
  });
  const clip = buildPilotClip({ stairs: GANTRY, ground: street, boxKg: 12, xStart: X_START, xExit: 9.5, tDescend: T_DESCEND });

  const seg3 = Math.ceil((clip.duration - T_DESCEND) * FPS);
  const frames3 = seg3;
  const total = 390 + 90 + frames3;
  const clock = new WorldClock(FPS, [
    { fromFrame: 0, toFrameExclusive: 390, storyStart: 0, rate: 1 }, // approach, the surge, the climb (13 s, real time)
    { fromFrame: 390, toFrameExclusive: 480, storyStart: 13, rate: 15 }, // the wait on the landing: 45 s in 3 s
    { fromFrame: 480, toFrameExclusive: total, storyStart: T_DESCEND, rate: 1 }, // the descent and the walk out
  ]);

  const follow = (dx: number) => ({ entity: 'ravi', dx, dy: 1.2, ky: 0.85, windowFrames: 24 });
  const shots: EnvShot[] = [
    { fromFrame: 0, toFrameExclusive: 150, camera: CAMERAS.wideRight },
    { fromFrame: 150, toFrameExclusive: 237, camera: CAMERAS.follow, follow: follow(0.9) },
    { fromFrame: 237, toFrameExclusive: 288, camera: CAMERAS.wide }, // the impact, seen from the street
    { fromFrame: 288, toFrameExclusive: 390, camera: CAMERAS.follow, follow: follow(0.9) },
    { fromFrame: 390, toFrameExclusive: 480, camera: CAMERAS.landing },
    { fromFrame: 480, toFrameExclusive: total, camera: CAMERAS.follow, follow: follow(-0.9) },
  ];

  const frames = buildEnvTimeline({
    fps: FPS,
    frames: total,
    location,
    flood,
    storyTime: (f) => clock.storyTime(f),
    shots,
    poseAt: (_f, t) => {
      const s = clip.sampleAt(t);
      return [
        ...posesAt(bake, t),
        { id: 'ravi', x: s.sk.hip[0], y: s.sk.hip[1], angle: 0 },
        { id: 'box_ravi', x: s.box.x, y: s.box.y, angle: s.box.angle },
      ];
    },
    charactersAt: (_f, t) => {
      const s = clip.sampleAt(t);
      const k = s.sk;
      return [
        {
          id: 'ravi',
          j: [k.hip, k.shoulder, k.head, k.lKnee, k.rKnee, k.lFoot, k.rFoot, k.lElbow, k.rElbow, k.lHand, k.rHand].flat(),
          facing: s.facing,
          feetX: [k.lFoot[0], k.rFoot[0]],
          feetY: [k.lFoot[1], k.rFoot[1]],
        },
      ];
    },
    impacts: bake.impacts,
    profile: { x0: -30, x1: 44, step: 0.5 },
  });
  return { field, flood, bake, clip, frames, shots, clock };
}
