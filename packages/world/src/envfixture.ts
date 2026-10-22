import { harborStreet } from './location.ts';
import { harborFlood } from '../../environment/src/flood.ts';
import { bakeLogImpact } from '../../physics/src/impact-bake.ts';
import { CAMERAS } from './envcameras.ts';
import { buildEnvTimeline, type EnvFrame } from './envtimeline.ts';

/** The Milestone 2 scene: one street, two cameras, a flood front, a log that hits a car after the cut. */
export const FPS = 30;
export const FRAMES = 270;
export const CUT_FRAME = 105;
export { CAMERAS };

export async function buildHarborScene(): Promise<{ frames: EnvFrame[]; impacts: { t: number; impulse: number; a: string; b: string }[] }> {
  const location = harborStreet();
  const flood = harborFlood({ quayX: location.quayX });
  const car = location.entities.find((e) => e.id === 'car_017')!;
  const log = location.entities.find((e) => e.id === 'log_003')!;
  const bake = await bakeLogImpact({
    fps: FPS,
    stepSeconds: 1 / 120,
    frames: FRAMES,
    bodies: { car: { x: car.x, w: car.w, h: car.h, mass: 1300 }, log: { x: log.x, w: log.w, h: log.h, mass: 120 } },
    logTouchedAt: flood.arrival(log.x - log.w / 2),
    currentSpeed: 3,
    dragNsPerM: 400,
  });
  const frames = buildEnvTimeline({
    fps: FPS,
    frames: FRAMES,
    location,
    flood,
    shots: [
      { fromFrame: 0, toFrameExclusive: CUT_FRAME, camera: CAMERAS.wide },
      { fromFrame: CUT_FRAME, toFrameExclusive: FRAMES, camera: CAMERAS.medium },
    ],
    poseAt: (frame) => bake.frames[frame].bodies,
    impacts: bake.impacts,
  });
  return { frames, impacts: bake.impacts };
}
