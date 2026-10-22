/**
 * Flood description consumed by the rest of the engine. A single coherent scenario (plan 8.2): every wet thing in any camera
 * derives from it. Two implementations: the analytic Milestone 2 stand-in (`harborFlood`) and the field baked from the
 * shallow-water solver (`harbor-field.ts`). Both satisfy `FloodScenario`, so wetness, damage and rendering do not care which.
 */
export const smooth = (u: number) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};

export interface FloodScenario {
  /** Sea/flood surface elevation (m above street level) at the quay at time t (story seconds). */
  level: (t: number) => number;
  /** x of the flood front on the street at time t (m); -Infinity when there is no water on the street. */
  front: (t: number) => number;
  /** First time at which the water on the street at x is deeper than 5 cm; Infinity if it never is. */
  arrival: (x: number) => number;
  /** Water depth (m above the local ground) at x, t. */
  depthAt: (x: number, t: number) => number;
  /** Depth-averaged horizontal velocity (m/s, +x) at x, t; 0 where dry. */
  velocityAt: (x: number, t: number) => number;
  /** Water surface elevation (m above street level) at x, t; equals the ground where dry. */
  etaAt: (x: number, t: number) => number;
}

type Key = [number, number];
const keyed = (keys: Key[]) => (t: number): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
  }
  return keys[keys.length - 1][1];
};

/**
 * Milestone 2 stand-in. Sea level rises past the quay lip (street level, 0 m) at about t = 2 s, then keeps rising. The surge
 * front starts on the street only once the level is above the street, so water never creeps over dry ground (tested).
 */
export const harborFlood = (opts: { quayX: number; tFront0?: number; frontSpeed?: number } = { quayX: 0 }): FloodScenario => {
  const tf = opts.tFront0 ?? 2.2;
  const speed = opts.frontSpeed ?? 3;
  const level = keyed([[0, -1], [1, -1], [2.5, 0.4], [8, 1.3]]);
  const front = (t: number) => (t < tf ? Number.NEGATIVE_INFINITY : opts.quayX + speed * (t - tf));
  return {
    level,
    front,
    arrival: (x) => tf + (x - opts.quayX) / speed,
    depthAt: (x, t) => (x >= opts.quayX && x <= front(t) ? Math.max(0, level(t)) : 0),
    velocityAt: (x, t) => (x >= opts.quayX && x <= front(t) ? speed : 0),
    etaAt: (x, t) => (x < opts.quayX || x <= front(t) ? level(t) : 0),
  };
};

export interface WetTrack {
  /** Story-time spacing of the samples. */
  dt: number;
  wetness: Float64Array;
  wetLine: Float64Array;
}

export interface WetParams {
  /** Seconds (story time) to soak to saturation once submerged. */
  soakSeconds: number;
  /** Seconds (story time) for wetness to fall by a factor e once the water has left. */
  dryingSeconds: number;
}

/**
 * Wetness and wet-line history of one entity over [0, tEnd], from the local depth at its seaward edge.
 * - The wet line is the highest water mark reached so far (capped at the entity's height). It stays after the water leaves.
 * - Wetness saturates while submerged (depth > 2 cm) and decays exponentially after the water has gone (plan 8.4: wet ground
 *   dries over elapsed time rather than instantly).
 * Pure function of the scenario and the entity, so every camera reads the same history.
 */
export const DEFAULT_WET: WetParams = { soakSeconds: 1.5, dryingSeconds: 60 };

/** Incremental wetness of one entity. Feed it the depth at the entity's seaward edge each step (story time). */
export class WetState {
  private raw = 0;
  private mark = 0;
  step(depthAtEdge: number, dt: number, e: { h: number; baseY: number }, p: WetParams = DEFAULT_WET): { wetness: number; wetLine: number } {
    if (depthAtEdge > 0.02) {
      this.raw = Math.min(1, this.raw + dt / p.soakSeconds);
      this.mark = Math.max(this.mark, Math.min(e.h, depthAtEdge - e.baseY));
    } else {
      this.raw *= Math.exp(-dt / p.dryingSeconds);
    }
    return { wetness: smooth(this.raw), wetLine: this.mark };
  }
}

export function wetTrack(flood: FloodScenario, e: { x: number; w: number; h: number; baseY: number }, tEnd: number, dt = 0.1, p: WetParams = DEFAULT_WET): WetTrack {
  const n = Math.ceil(tEnd / dt) + 2;
  const wetness = new Float64Array(n);
  const wetLine = new Float64Array(n);
  const edge = e.x - e.w / 2; // the water meets the entity's seaward edge first
  const state = new WetState();
  for (let i = 0; i < n; i++) {
    const r = state.step(flood.depthAt(edge, i * dt), dt, e, p);
    wetness[i] = r.wetness;
    wetLine[i] = r.wetLine;
  }
  return { dt, wetness, wetLine };
}

export function sampleTrack(track: WetTrack, t: number): { wetness: number; wetLine: number } {
  const f = Math.max(0, t) / track.dt;
  const i = Math.min(track.wetness.length - 2, Math.floor(f));
  const k = Math.min(1, f - i);
  return {
    wetness: track.wetness[i] + (track.wetness[i + 1] - track.wetness[i]) * k,
    wetLine: track.wetLine[i] + (track.wetLine[i + 1] - track.wetLine[i]) * k,
  };
}
