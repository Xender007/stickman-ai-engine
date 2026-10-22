import type { V2 } from './rig.ts';

export const clamp01 = (u: number) => Math.min(1, Math.max(0, u));
export const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Inverse of `smooth` on [0,1] by bisection (deterministic, 50 iterations). */
export function invSmooth(y: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (smooth(mid) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface Swing {
  tA: number;
  tB: number;
  xFrom: number;
  xTo: number;
  yFrom: number;
  yTo: number;
}

/**
 * One foot: planted at (x0, y0), then a time-ordered list of swings. Between swings it is planted exactly where the last swing
 * ended. Plants carry a height so the same planner walks flat ground, a slope or stairs (Milestone 4).
 */
export class FootTrack {
  readonly swings: Swing[] = [];
  private lastX: number;
  private lastY: number;
  constructor(readonly x0: number, readonly clearance = 0.09, readonly y0 = 0) {
    this.lastX = x0;
    this.lastY = y0;
  }
  get plantedX(): number {
    return this.lastX;
  }
  get plantedY(): number {
    return this.lastY;
  }
  addSwing(tA: number, tB: number, xTo: number, yTo = 0): void {
    const prev = this.swings[this.swings.length - 1];
    if (prev && tA < prev.tB - 1e-9) throw new Error(`overlapping swings at t=${tA}`);
    this.swings.push({ tA, tB, xFrom: this.lastX, xTo, yFrom: this.lastY, yTo });
    this.lastX = xTo;
    this.lastY = yTo;
  }
  /** Foot position (contact point) and whether it is planted. Pure function of t. `x0` is kept for older callers; the constructor value wins. */
  at(t: number, _x0?: number): { p: V2; planted: boolean } {
    let x = this.x0;
    let y = this.y0;
    for (const sw of this.swings) {
      if (t < sw.tA) break;
      if (t >= sw.tB) {
        x = sw.xTo;
        y = sw.yTo;
        continue;
      }
      const u = (t - sw.tA) / (sw.tB - sw.tA);
      const s = smooth(u);
      // Stepping up, the foot lifts early so it clears the edge of the next riser; stepping down it descends late.
      const sy = sw.yTo > sw.yFrom + 1e-9 ? smooth(u * 3) : sw.yTo < sw.yFrom - 1e-9 ? smooth((u - 0.4) / 0.6) : s;
      return { p: [lerp(sw.xFrom, sw.xTo, s), lerp(sw.yFrom, sw.yTo, sy) + this.clearance * Math.pow(Math.sin(Math.PI * s), 1.5)], planted: false };
    }
    return { p: [x, y], planted: true };
  }
}

export interface WalkPlan {
  t0: number;
  /** Walk duration; the hip eases in and out over it. */
  Tw: number;
  x0: number;
  D: number;
  n: number;
  stepLen: number;
  /** Time at which the walk has covered fraction u of D. */
  timeAtU: (u: number) => number;
  hipAt: (t: number) => number;
}

export function walkPlan(t0: number, x0: number, D: number, speed: number, stepLenWanted: number): WalkPlan {
  const n = Math.max(2, Math.round(D / stepLenWanted));
  const Tw = D / speed;
  return {
    t0,
    Tw,
    x0,
    D,
    n,
    stepLen: D / n,
    timeAtU: (u) => t0 + Tw * invSmooth(clamp01(u)),
    hipAt: (t) => x0 + D * smooth((t - t0) / Tw),
  };
}

/**
 * Schedules alternating steps for a walk. Step i swings during hip progress [i/n, (i+0.75)/n]; the planting foot lands
 * 0.625 step lengths ahead of the hip, so a planted foot spans +0.625 to -0.625 step lengths around the hip (symmetric)
 * and there is a short double-support overlap. Returns the planted x of the leading foot and of the trailing foot.
 */
export function scheduleWalk(w: WalkPlan, feet: { L: FootTrack; R: FootTrack }, firstFoot: 'L' | 'R'): { front: 'L' | 'R'; frontX: number; rearX: number; tEnd: number } {
  let foot: 'L' | 'R' = firstFoot;
  const lead = 0.625 * w.stepLen;
  for (let i = 0; i < w.n; i++) {
    const tA = w.timeAtU(i / w.n);
    const tB = w.timeAtU((i + 0.75) / w.n);
    feet[foot].addSwing(tA, tB, w.x0 + (w.D * (i + 0.75)) / w.n + lead);
    foot = foot === 'L' ? 'R' : 'L';
  }
  const front: 'L' | 'R' = foot === 'L' ? 'R' : 'L'; // the foot that stepped last
  const rear: 'L' | 'R' = foot;
  return { front, frontX: feet[front].plantedX, rearX: feet[rear].plantedX, tEnd: w.t0 + w.Tw };
}

/** After a walk: the trailing foot closes to stand `gap` behind the leading foot while the hip drifts to their midpoint. */
export function scheduleSettle(tStart: number, dur: number, feet: { L: FootTrack; R: FootTrack }, rear: 'L' | 'R', frontX: number, gap: number): { hipFinal: number } {
  feet[rear].addSwing(tStart, tStart + dur, frontX - gap);
  return { hipFinal: frontX - gap / 2 };
}
