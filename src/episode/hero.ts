import {GROUND_Y, HERO_X} from '../config';
import {smooth} from '../lib/anim';
import {DIVE, Joints, Pose, STAND, UNEASY, climb, cling, mixPose, run, solve, walk} from '../rig/pose';
import {FLOOD_TOWER, ROOF, TOWER_X, WATER_Y, hillY} from '../world/HillFlood';
import type {CompiledShot} from './compile';
import type {Action} from './schema';

export const HILL_TOWER_HEIGHT = 860;
const WALK = 165; // px/s, matched to the walk stride
const RUN = 430;

export const tracks = (s: CompiledShot) => s.setting === 'city' || s.setting === 'forest';

const speedAt = (a: Action, lt: number) =>
  a === 'walk' ? WALK : a === 'run' ? RUN : a === 'dive' ? RUN * (1 - smooth(0.45, 1.0, lt)) : 0;

/** Ground covered since the shot started. */
export const travel = (a: Action, lt: number): number => {
  if (a === 'walk' || a === 'run') return speedAt(a, 0) * lt;
  if (a !== 'dive') return 0;
  let x = 0;
  for (let u = 0; u < lt; u += 1 / 60) x += speedAt(a, u) * Math.min(1 / 60, lt - u);
  return x;
};

/** How far the camera moves over the first `lt` seconds of a tracking shot (a still hero lets the world drift slowly). */
const camTravel = (s: CompiledShot, lt: number) =>
  tracks(s) ? travel(s.action, lt) + (speedAt(s.action, 0) === 0 ? 14 * lt : 0) : 0;

/**
 * Where each shot starts in the world. A shot that continues the same stretch of street/forest picks up exactly
 * where the previous one stopped (camera and walk cycle), so cuts never teleport the hero or restart the stride.
 */
export type TrackBase = {cam: number; dist: number};
export const trackBases = (shots: CompiledShot[]): TrackBase[] => {
  const out: TrackBase[] = [];
  shots.forEach((s, i) => {
    const p = shots[i - 1];
    if (p && tracks(p) && tracks(s) && p.setting === s.setting) {
      const b = out[i - 1];
      out.push({cam: b.cam + camTravel(p, p.end - p.start), dist: b.dist + travel(p.action, p.end - p.start)});
    } else out.push({cam: i * 700, dist: 0});
  });
  return out;
};

/** Camera position in ground pixels. */
export const cameraX = (s: CompiledShot, base: TrackBase, lt: number) => base.cam + camTravel(s, lt);

/** Whether the next shot can follow the previous one without a fade (same place, light and framing). */
export const seamless = (p: CompiledShot, s: CompiledShot) =>
  p.setting === s.setting && p.mood === s.mood && p.camera === s.camera && !p.impact;

const poseFor = (a: Action, lt: number, dist: number, timePhase: boolean): Pose => {
  switch (a) {
    case 'walk': return walk(timePhase ? lt * 0.9 : dist / 189);
    case 'run': return run(timePhase ? lt * 1.45 : dist / 300);
    case 'stand': return {...STAND, lean: STAND.lean + Math.sin(lt * 2) * 1.5};
    case 'uneasy': return {...UNEASY, lUA: UNEASY.lUA + Math.sin(lt * 9) * 3, rUA: UNEASY.rUA - Math.sin(lt * 9) * 3};
    case 'dive': return mixPose(run(dist / 300), DIVE, smooth(0.45, 0.8, lt));
    case 'climb': return climb(lt * 0.9);
    case 'cling': return cling(lt);
  }
};

export type HeroPlacement = {j: Joints; x: number; y: number; scale: number};

const BLEND = 0.4; // seconds to ease from the previous shot's pose into this one

export const placeHero = (s: CompiledShot, lt: number, dur: number, base: TrackBase = {cam: 0, dist: 0}, prev?: CompiledShot): HeroPlacement => {
  const scale = s.camera === 'close' ? 1.9 : s.camera === 'wide' ? 0.75 : 1;
  const a = s.action;
  if (s.setting === 'city' || s.setting === 'forest') {
    let pose = poseFor(a, lt, base.dist + travel(a, lt), false);
    if (prev && prev.setting === s.setting && lt < BLEND) {
      const pdur = prev.end - prev.start;
      const before = poseFor(prev.action, pdur + lt, base.dist - travel(prev.action, pdur) + travel(prev.action, pdur + lt), false);
      pose = mixPose(before, pose, smooth(0, BLEND, lt));
    }
    const j = solve(pose);
    const lift = a === 'dive' && lt > 0.45 && lt < 0.85 ? 70 * Math.sin((Math.PI * (lt - 0.45)) / 0.4) : 0;
    if (s.camera === 'close') return {j, x: 600, y: GROUND_Y + 170 - lift * scale, scale};
    return {j, x: HERO_X, y: GROUND_Y - lift * scale, scale};
  }
  if (s.setting === 'hill_tower') {
    const base = hillY(TOWER_X);
    const top = base - HILL_TOWER_HEIGHT;
    if (a === 'climb') {
      // pick up where the run up the hill ended, then reach the tower and start climbing
      const reach = smooth(0, 0.7, lt);
      const x = TOWER_X - 160 + 154 * reach;
      const up = base - 10 - (base - 10 - (top + 330)) * smooth(0, dur, lt);
      return {j: solve(poseFor(a, lt, 0, true)), x, y: hillY(x) * (1 - reach) + up * reach, scale: 0.85};
    }
    if (a === 'cling') return {j: solve(poseFor(a, lt, 0, true)), x: TOWER_X, y: top + 300 + Math.sin(lt * 1.6) * 4, scale: 0.85};
    const x = a === 'walk' || a === 'run' ? 140 + (TOWER_X - 160 - 140) * smooth(0, Math.max(dur, 1.3), lt) : 560;
    return {j: solve(poseFor(a, lt, 0, true)), x, y: hillY(x), scale: Math.min(scale, 1)};
  }
  // flood
  if (a === 'climb' || a === 'cling') {
    const top = FLOOD_TOWER.baseY - FLOOD_TOWER.height;
    const y = a === 'cling' ? top + 300 + Math.sin(lt * 1.6) * 4 : WATER_Y - 20 - (WATER_Y - 20 - (top + 330)) * smooth(0, dur, lt);
    return {j: solve(poseFor(a, lt, 0, true)), x: FLOOD_TOWER.x, y, scale: 0.85};
  }
  return {j: solve(poseFor(a, lt, 0, true)), x: ROOF.x + ROOF.w * 0.45, y: ROOF.y, scale: Math.min(scale, 1.2)};
};
