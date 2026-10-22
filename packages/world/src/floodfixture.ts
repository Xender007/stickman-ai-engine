import { CAMERAS } from './envcameras.ts';
import { harborStreet } from './location.ts';
import { WorldClock } from './clocks.ts';
import { buildEnvTimeline, type EnvFrame } from './envtimeline.ts';
import { bakeHarborField, fieldScenario, type FloodField } from '../../environment/src/harbor-field.ts';
import type { FloodScenario } from '../../environment/src/flood.ts';
import { bakeFloodBodies, type FloatBake } from '../../physics/src/float-bake.ts';

/** The Milestone 3 scene: solver-driven surge and drawdown, floating debris, two clocks, three cameras. 18 s of video covers 144.5 s of story. */
export const FPS = 30;
export const FRAMES = 540;
export const STORY_END = 150;
export const CUTS = { toMedium: 60, toStrand: 345 };

export const clock = () =>
  new WorldClock(FPS, [
    { fromFrame: 0, toFrameExclusive: 45, storyStart: 5.5, rate: 1 }, // calm before the surge
    { fromFrame: 45, toFrameExclusive: 225, storyStart: 7, rate: 1 }, // the surge, in real time
    { fromFrame: 225, toFrameExclusive: 345, storyStart: 13, rate: 8 }, // the drawdown, compressed (32 s of story in 4 s)
    { fromFrame: 345, toFrameExclusive: 540, storyStart: 45, rate: 105 / (195 / FPS) }, // the street drying out (105 s of story in 6.5 s)
  ]);

export interface FloodScene {
  field: FloodField;
  flood: FloodScenario;
  bake: FloatBake;
  frames: EnvFrame[];
}

export async function buildFloodScene(): Promise<FloodScene> {
  const location = harborStreet();
  const field = bakeHarborField({ tEnd: STORY_END });
  const flood = fieldScenario(field);
  const spec = (id: string) => location.entities.find((e) => e.id === id)!;
  const car = spec('car_017');
  const log = spec('log_003');
  const crate = spec('crate_02');
  const bake = await bakeFloodBodies({
    flood,
    tEnd: STORY_END,
    bodies: [
      // A parked, braked car: heavy, and in this slice it feels no water force (vehicle_flooding stays planned).
      { id: car.id, x: car.x, w: car.w, h: car.h, thickness: 1.7, density: 1276, floats: false },
      { id: log.id, x: log.x, w: log.w, h: log.h, thickness: 0.35, density: 600, floats: true },
      { id: crate.id, x: crate.x, w: crate.w, h: crate.h, thickness: 0.7, density: 450, floats: true },
    ],
  });
  const c = clock();
  const frames = buildEnvTimeline({
    fps: FPS,
    frames: FRAMES,
    location,
    flood,
    storyTime: (f) => c.storyTime(f),
    shots: [
      { fromFrame: 0, toFrameExclusive: CUTS.toMedium, camera: CAMERAS.wide },
      { fromFrame: CUTS.toMedium, toFrameExclusive: CUTS.toStrand, camera: CAMERAS.medium },
      { fromFrame: CUTS.toStrand, toFrameExclusive: FRAMES, camera: CAMERAS.strand },
    ],
    poseAt: (_f, t) => posesAt(bake, t),
    impacts: bake.impacts,
    profile: { x0: -30, x1: 44, step: 0.5 },
  });
  return { field, flood, bake, frames };
}

/** Linear interpolation of the baked poses at story time t (a pure function of t). */
export function posesAt(bake: FloatBake, t: number) {
  const s = Math.min(bake.poses.length - 1.000001, Math.max(0, t / bake.sampleDt));
  const i = Math.floor(s);
  const k = s - i;
  return bake.poses[i].map((p, j) => {
    const q = bake.poses[i + 1][j];
    return { id: p.id, x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, angle: p.angle + (q.angle - p.angle) * k };
  });
}
