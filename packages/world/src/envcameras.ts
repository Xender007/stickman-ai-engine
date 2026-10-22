import type { CameraSpec } from './camera.ts';

/** The cameras of the harbor scenes: one source for the Node fixtures, the tests and the video app. */
const ASPECT = 1080 / 1920;
export const CAMERAS: Record<'wide' | 'medium' | 'strand' | 'wideRight' | 'follow' | 'landing', CameraSpec> = {
  wide: { id: 'harbor_wide@1', pos: [8.5, 4.2, 25], fovDeg: 55, aspect: ASPECT },
  medium: { id: 'harbor_medium@1', pos: [8.2, 1.6, 12.5], fovDeg: 50, aspect: ASPECT },
  /** The wide shot shifted right so the stair gantry is in frame (Milestone 4). */
  wideRight: { id: 'harbor_wide_right@1', pos: [11.5, 4.2, 25], fovDeg: 55, aspect: ASPECT },
  /** Base for follow shots: x and y are replaced per frame by the followed entity. */
  follow: { id: 'harbor_follow@1', pos: [14, 1.8, 11], fovDeg: 48, aspect: ASPECT },
  /** From the landing's height over the street, after the water has gone down. */
  landing: { id: 'harbor_landing@1', pos: [17.5, 4.6, 16], fovDeg: 55, aspect: ASPECT },
  /** Frames the street where the crate comes to rest and the puddle stays, after the drawdown. */
  strand: { id: 'harbor_strand@1', pos: [20.2, 1.6, 12.5], fovDeg: 50, aspect: ASPECT },
};
