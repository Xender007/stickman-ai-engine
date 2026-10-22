import type { Lane } from './scenespec.ts';

/** Depth lanes of the constrained 2.5D profile (plan section 5.1). z is metres from the hero plane, negative = away from camera. */
export const LANES: Record<Lane, { zNear: number; zFar: number; z: number }> = {
  /** Characters that must pass in front of vehicles and debris (added in Milestone 4). */
  front: { zNear: 1.2, zFar: 1.2, z: 1.2 },
  hero: { zNear: 0, zFar: 0, z: 0 },
  near: { zNear: -5, zFar: -15, z: -10 },
  mid: { zNear: -30, zFar: -120, z: -60 },
  far: { zNear: -120, zFar: -2000, z: -400 },
};

export const laneZ = (lane: Lane): number => LANES[lane].z;
