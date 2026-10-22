import { Swe1D } from './swe1d.ts';
import type { FloodScenario } from './flood.ts';

/**
 * Terrain of the harbor transect (metres, street level = 0): sea floor sloping up to a vertical quay wall at x = 0, a street
 * rising 1% inland with a shallow pit (the puddle that must remain after the drain), and a building line at x > 34.
 */
export const PIT = { x0: 19, x1: 22, depth: 0.18 } as const;
export function harborBed(x: number): number {
  if (x < 0) return Math.max(-6, -3.5 + x * 0.0833);
  if (x <= 34) return 0.01 * x - (x >= PIT.x0 && x <= PIT.x1 ? PIT.depth : 0);
  return 0.34 + 0.5 * (x - 34);
}

export interface FloodField {
  /** Sampled region: cell centres at x0 + (i + 0.5) * dx. */
  x0: number;
  dx: number;
  cells: number;
  /** Story-time spacing of snapshots and their count. */
  dt: number;
  snapshots: number;
  /** snapshots * cells values each: depth (m) and depth-averaged velocity (m/s). */
  depth: Float32Array;
  u: Float32Array;
  /** Solver diagnostics for the handoff: steps, boundary fluxes, mass check. */
  info: { steps: number; volume0: number; volumeEnd: number; fluxLeft: number; fluxRight: number; massError: number };
}

export interface HarborFieldOptions {
  /** Seconds of story time to simulate. */
  tEnd: number;
  /** Surface elevation (m) of the surge reservoir; the sea starts at -1.2 m (1.2 m below the quay lip). */
  surgeEta?: number;
  dtSample?: number;
  manning?: number;
}

/** Bake the surge: a reservoir at x in [-100, -60] released into a calm sea 1.2 m below the street. Deterministic. */
export function bakeHarborField(o: HarborFieldOptions): FloodField {
  const surge = o.surgeEta ?? 3.5;
  const dx = 0.5;
  const solverX0 = -900;
  const cells = 1890; // to x = 45; the long sea keeps the far-wall reflection out of the first 200 s
  const sim = new Swe1D({
    x0: solverX0,
    dx,
    cells,
    bed: harborBed,
    eta0: (x) => (x >= -100 && x < -60 ? surge : -1.2),
    manning: o.manning ?? 0.025,
    left: 'wall',
    right: 'wall',
  });
  const v0 = sim.volume();

  // Keep only the region the camera can see and the objects can reach: x in [-30, 45].
  const keepFrom = Math.round((-30 - solverX0) / dx);
  const keep = cells - keepFrom;
  const dtSample = o.dtSample ?? 0.1;
  const snapshots = Math.round(o.tEnd / dtSample) + 1;
  const depth = new Float32Array(snapshots * keep);
  const u = new Float32Array(snapshots * keep);
  for (let s = 0; s < snapshots; s++) {
    sim.run(s * dtSample);
    for (let i = 0; i < keep; i++) {
      depth[s * keep + i] = sim.h[keepFrom + i];
      u[s * keep + i] = sim.velocity(keepFrom + i);
    }
  }
  const volumeEnd = sim.volume();
  return {
    x0: solverX0 + keepFrom * dx,
    dx,
    cells: keep,
    dt: dtSample,
    snapshots,
    depth,
    u,
    info: { steps: sim.steps, volume0: v0, volumeEnd, fluxLeft: sim.fluxLeft, fluxRight: sim.fluxRight, massError: Math.abs(volumeEnd - v0 - (sim.fluxLeft - sim.fluxRight)) / v0 },
  };
}

/** Read a baked field as a FloodScenario. Surface elevation is interpolated (continuous across wet/dry fronts); depth follows from the exact ground. */
export function fieldScenario(f: FloodField): FloodScenario {
  const tMax = (f.snapshots - 1) * f.dt;
  const xc = (i: number) => f.x0 + (i + 0.5) * f.dx;
  const bedCell = Float64Array.from({ length: f.cells }, (_, i) => harborBed(xc(i)));
  const snap = (t: number) => {
    const s = Math.min(f.snapshots - 1.000001, Math.max(0, t / f.dt));
    const i = Math.floor(s);
    return { i, k: s - i };
  };
  const cellPos = (x: number) => {
    const c = (x - f.x0) / f.dx - 0.5;
    const i = Math.min(f.cells - 2, Math.max(0, Math.floor(c)));
    return { i, k: Math.min(1, Math.max(0, c - i)) };
  };
  const etaCell = (s: number, i: number) => bedCell[i] + f.depth[s * f.cells + i];
  const etaAt = (x: number, t: number) => {
    const { i: s, k: ks } = snap(t);
    const { i, k } = cellPos(x);
    const e = (ss: number) => etaCell(ss, i) * (1 - k) + etaCell(ss, i + 1) * k;
    return e(s) * (1 - ks) + e(s + 1) * ks;
  };
  const depthAt = (x: number, t: number) => Math.max(0, etaAt(x, t) - harborBed(x));
  const velocityAt = (x: number, t: number) => {
    if (depthAt(x, t) < 0.02) return 0;
    const { i: s, k: ks } = snap(t);
    const { i, k } = cellPos(x);
    const v = (ss: number) => f.u[ss * f.cells + i] * (1 - k) + f.u[ss * f.cells + i + 1] * k;
    return v(s) * (1 - ks) + v(s + 1) * ks;
  };
  const streetFrom = Math.ceil((0.25 - f.x0) / f.dx - 0.5);
  const front = (t: number) => {
    const { i: s } = snap(t);
    // contiguous wet street from the quay; -Infinity if the quay edge is dry
    let last = -Infinity;
    for (let i = streetFrom; i < f.cells && xc(i) <= 34; i++) {
      if (f.depth[s * f.cells + i] > 0.02) last = xc(i);
      else break;
    }
    return last;
  };
  const arrivalCache = new Map<number, number>();
  const arrival = (x: number) => {
    const key = Math.round(x * 4);
    const hit = arrivalCache.get(key);
    if (hit !== undefined) return hit;
    let tFirst = Infinity;
    for (let s = 0; s < f.snapshots; s++) {
      if (depthAt(x, s * f.dt) > 0.05) {
        tFirst = s * f.dt;
        break;
      }
    }
    arrivalCache.set(key, tFirst);
    return tFirst;
  };
  return {
    level: (t) => Math.min(etaAt(-6, Math.min(t, tMax)), 99),
    front: (t) => front(Math.min(t, tMax)),
    arrival,
    depthAt: (x, t) => depthAt(x, Math.min(t, tMax)),
    velocityAt: (x, t) => velocityAt(x, Math.min(t, tMax)),
    etaAt: (x, t) => etaAt(x, Math.min(t, tMax)),
  };
}
