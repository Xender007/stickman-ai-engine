import type { CameraSpec } from './camera.ts';
import { WorldLedger, type Damage, type EntityState } from './ledger.ts';
import type { Location } from './location.ts';
import { WetState, type FloodScenario } from '../../environment/src/flood.ts';

/** Damage from a collision impulse (N*s). Starting values, uncalibrated: change only with a benchmark (rule R12). */
export const DAMAGE_THRESHOLDS = { dented: 100, wrecked: 600 } as const;
export const damageFromImpulse = (impulse: number): Damage | null => (impulse >= DAMAGE_THRESHOLDS.wrecked ? 'wrecked' : impulse >= DAMAGE_THRESHOLDS.dented ? 'dented' : null);

export interface EnvShot {
  fromFrame: number;
  toFrameExclusive: number;
  camera: CameraSpec;
  /** If set, the camera follows an entity (smoothed offline, inside this shot only, so every frame stays independent). */
  follow?: { entity: string; dx: number; dy: number; ky: number; windowFrames: number };
}

/** A posed character: joints as x,y pairs (hip, shoulder, head, lKnee, rKnee, lFoot, rFoot, lElbow, rElbow, lHand, rHand). */
export interface CharacterInput {
  id: string;
  j: number[];
  facing: 1 | -1;
  /** x of the left and right foot, for the water they stand in. */
  feetX: [number, number];
  feetY: [number, number];
}

export interface CharacterFrame {
  id: string;
  j: number[];
  facing: 1 | -1;
  wetness: number;
  /** Submerged depth (m) of the deeper foot, the water speed there (m/s), their product (depth x velocity, m^2/s, the standard flood-danger measure) and the height of the lowest foot above the water surface. */
  exposure: { depth: number; speed: number; dv: number; clearance: number };
}

export interface EnvEntityFrame {
  id: string;
  kind: string;
  lane: string;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  damage: Damage;
  wetness: number;
  wetLine: number;
}

/** Water surface sampled along the street for rendering: surface elevation, depth and velocity at x0 + i * step. */
export interface WaterProfile {
  x0: number;
  step: number;
  eta: number[];
  depth: number[];
  u: number[];
}

export interface EnvFrame {
  frame: number;
  characters: CharacterFrame[];
  /** Story seconds at this frame (the two clocks: edit time is `frame / fps`). */
  t: number;
  shot: number;
  camera: CameraSpec;
  entities: EnvEntityFrame[];
  water: { level: number; front: number; profile?: WaterProfile };
  /** Damage events applied so far, with their cause: the log that explains why the state is what it is. */
  causes: string[];
}

export interface EnvInput {
  fps: number;
  frames: number;
  location: Location;
  flood: FloodScenario;
  shots: EnvShot[];
  /** Story seconds at an edit frame. Default: frame / fps (story time runs at edit speed). */
  storyTime?: (frame: number) => number;
  /** Simulated rigid-body poses at a frame (entities not returned are static at their placement). */
  poseAt: (frame: number, storyT: number) => { id: string; x: number; y: number; angle: number }[];
  /** Collisions with story time `t`. */
  impacts: { t: number; impulse: number; a: string; b: string }[];
  /** Posed characters at a frame (their wetness and water exposure are derived here from the flood field). */
  charactersAt?: (frame: number, storyT: number) => CharacterInput[];
  /** If set, every frame carries the water surface sampled on this grid (for rendering). */
  profile?: { x0: number; x1: number; step: number };
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Merge location, flood, simulation and ledger into one frame-addressable state. Pure and deterministic. */
export function buildEnvTimeline(input: EnvInput): EnvFrame[] {
  const initial: EntityState[] = input.location.entities.map((e) => ({
    id: e.id,
    asset: `${e.kind}@1`,
    position: [e.x, e.baseY + e.h / 2, 0],
    rotationZ: 0,
    damage: 'intact',
    wetness: 0,
    present: true,
  }));
  const ledger = new WorldLedger(initial);
  const wet = new Map(input.location.entities.map((e) => [e.id, new WetState()]));
  const pending = [...input.impacts].sort((a, b) => a.t - b.t);
  const causes: string[] = [];
  const out: EnvFrame[] = [];
  const storyTime = input.storyTime ?? ((f: number) => f / input.fps);
  let prevT = storyTime(0);

  for (let f = 0; f < input.frames; f++) {
    const t = storyTime(f);
    const dt = f === 0 ? 0 : Math.max(0, t - prevT);
    prevT = t;
    while (pending.length && pending[0].t <= t) {
      const ev = pending.shift()!;
      const to = damageFromImpulse(ev.impulse);
      if (to && ledger.get(ev.b).damage !== to) {
        ledger.apply({ kind: 'damage', id: ev.b, to, cause: `${ev.a} hit ${ev.b}: ${ev.impulse.toFixed(0)} N*s at t=${ev.t.toFixed(2)}` });
        causes.push(`${ev.b}: ${to} <- ${ev.a} ${ev.impulse.toFixed(0)} N*s at t=${ev.t.toFixed(2)}`);
      }
    }
    const shotIndex = input.shots.findIndex((s) => f >= s.fromFrame && f < s.toFrameExclusive);
    if (shotIndex < 0) throw new Error(`frame ${f} is not covered by any shot`);
    const posed = new Map(input.poseAt(f, t).map((p) => [p.id, p]));

    const entities = input.location.entities.map((e) => {
      const p = posed.get(e.id);
      const x = p?.x ?? e.x;
      const w = wet.get(e.id)!.step(input.flood.depthAt(x - e.w / 2, t), dt, e);
      return {
        id: e.id,
        kind: e.kind,
        lane: e.lane,
        x,
        y: p?.y ?? e.baseY + e.h / 2,
        angle: p?.angle ?? 0,
        w: e.w,
        h: e.h,
        damage: ledger.get(e.id).damage,
        wetness: w.wetness,
        wetLine: w.wetLine,
      };
    });

    const characters: CharacterFrame[] = (input.charactersAt?.(f, t) ?? []).map((c) => {
      // A character's legs have their own wetness (submersion of the feet); the entity's wet state (street depth at its edge) is separate.
      const ws = wet.get('char:' + c.id) ?? new WetState();
      wet.set('char:' + c.id, ws);
      // How deep each foot is *submerged*: the water surface above the foot, not the depth of the street below a landing.
      const sub = [0, 1].map((i) => (input.flood.depthAt(c.feetX[i], t) > 0.005 ? Math.max(0, input.flood.etaAt(c.feetX[i], t) - c.feetY[i]) : 0));
      const k = sub[0] >= sub[1] ? 0 : 1;
      const speed = input.flood.depthAt(c.feetX[k], t) > 0.005 ? Math.abs(input.flood.velocityAt(c.feetX[k], t)) : 0;
      const clearance = Math.min(...[0, 1].map((i) => c.feetY[i] - (input.flood.depthAt(c.feetX[i], t) > 0.005 ? input.flood.etaAt(c.feetX[i], t) : -Infinity)));
      const w = ws.step(sub[k], dt, { h: 1, baseY: 0 });
      return { id: c.id, j: c.j.map(r3), facing: c.facing, wetness: w.wetness, exposure: { depth: sub[k], speed, dv: sub[k] * speed, clearance: Number.isFinite(clearance) ? clearance : 99 } };
    });

    let profile: WaterProfile | undefined;
    if (input.profile) {
      const { x0, x1, step } = input.profile;
      const n = Math.round((x1 - x0) / step) + 1;
      const xs = Array.from({ length: n }, (_, i) => x0 + i * step);
      profile = {
        x0,
        step,
        eta: xs.map((x) => r3(input.flood.etaAt(x, t))),
        depth: xs.map((x) => r3(input.flood.depthAt(x, t))),
        u: xs.map((x) => r3(input.flood.velocityAt(x, t))),
      };
    }

    out.push({
      frame: f,
      characters,
      t,
      shot: shotIndex,
      camera: input.shots[shotIndex].camera,
      entities,
      water: { level: input.flood.level(t), front: input.flood.front(t), profile },
      causes: [...causes],
    });
  }
  // Follow cameras: a centred, cosine-weighted moving average of the followed entity, clamped to the shot.
  input.shots.forEach((shot, si) => {
    const fo = shot.follow;
    if (!fo) return;
    const R = fo.windowFrames;
    const pos = (fr: number) => out[fr].entities.find((e) => e.id === fo.entity)!;
    for (let fr = shot.fromFrame; fr < shot.toFrameExclusive; fr++) {
      let sx = 0;
      let sy = 0;
      let w = 0;
      for (let k = -R; k <= R; k++) {
        const j = Math.min(shot.toFrameExclusive - 1, Math.max(shot.fromFrame, fr + k));
        const wt = 0.5 + 0.5 * Math.cos((Math.PI * k) / (R + 1));
        sx += pos(j).x * wt;
        sy += pos(j).y * wt;
        w += wt;
      }
      const c = shot.camera;
      out[fr].camera = { ...c, pos: [r3(sx / w + fo.dx), r3(fo.dy + fo.ky * (sy / w)), c.pos[2]] };
    }
    void si;
  });
  return out;
}
