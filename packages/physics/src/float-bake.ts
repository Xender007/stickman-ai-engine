import RAPIER from '@dimforge/rapier3d-compat';
import { initPhysics } from './rapier.ts';
import { laneZ } from '@engine/contracts/src/lanes.ts';
import type { FloodScenario } from '../../environment/src/flood.ts';
import { harborBed } from '../../environment/src/harbor-field.ts';

export const RHO_WATER = 1000;
export const STREET_SLOPE = 0.01;

export interface FloatBody {
  id: string;
  x: number;
  w: number;
  h: number;
  /** Depth of the body into the page (m); fixes its volume. */
  thickness: number;
  /** kg per m^3. A log is about 600: it floats with 60% of its height under water. */
  density: number;
  /** false = the body does not feel the flow (a parked, braked car in this slice). */
  floats: boolean;
  /** Depth lane (default hero). Bodies only collide with bodies and statics in the same lane. */
  lane?: 'front' | 'hero';
}

/** A fixed obstacle (wall, post) in a lane. x, y are the centre. */
export interface StaticBox {
  /** Name used in impact events (e.g. "gantry_post_1"). */
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lane: 'front' | 'hero';
}

/** The ground the bodies stand on: a street plane through x = 0 with a slope, a building wall, and an optional sea floor. */
export interface GroundSpec {
  bed: (x: number) => number;
  slope: number;
  wallX: number;
  seaFloorY?: number;
}

export interface FloatPose {
  id: string;
  x: number;
  y: number;
  angle: number;
  /** Submerged height (m) at this sample, for the waterline check. */
  submerged: number;
}

export interface FloatBake {
  /** Poses sampled every `sampleDt` story seconds. */
  sampleDt: number;
  poses: FloatPose[][];
  impacts: { t: number; impulse: number; closingSpeed: number; a: string; b: string }[];
}

/**
 * Rigid bodies in a flood, driven by a FloodScenario (plan 8.4): buoyancy from displaced volume, drag from velocity relative to
 * the water, and the street's own slope for grounding. Forces use the field at the body's position and the current story time.
 * Bodies are lane-locked (rule: 2.5D) and rotate only about Z. Deterministic: fixed 1/120 s step, fixed creation order.
 *
 * Documented limits: no torque from offset buoyancy (angular damping stands in), vertical added-mass is ignored, bodies with
 * `floats: false` feel no water force at all (vehicle_flooding stays a planned capability).
 */
export async function bakeFloodBodies(opts: { flood: FloodScenario; tEnd: number; sampleDt?: number; stepSeconds?: number; bodies: FloatBody[]; dragCd?: number; ground?: GroundSpec; statics?: StaticBox[] }): Promise<FloatBake> {
  await initPhysics();
  const dt = opts.stepSeconds ?? 1 / 120;
  const sampleDt = opts.sampleDt ?? 1 / 60;
  const every = Math.round(sampleDt / dt);
  const cd = opts.dragCd ?? 1.2;

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = dt;
  const queue = new RAPIER.EventQueue(true);
  const g: GroundSpec = opts.ground ?? { bed: harborBed, slope: STREET_SLOPE, wallX: 34 };
  const slope = Math.atan(g.slope);
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setRotation({ x: 0, y: 0, z: Math.sin(slope / 2), w: Math.cos(slope / 2) }));
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 0.5, 5).setTranslation(500, -0.5, 0).setFriction(0.8), ground);
  // The building line closing the street (the field's bed rises there).
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 6, 5).setTranslation(g.wallX + 0.5, 6, 0).setFriction(0.5), fixed);
  if (g.seaFloorY !== undefined) world.createCollider(RAPIER.ColliderDesc.cuboid(200, 0.5, 5).setTranslation(-200, g.seaFloorY - 0.5, 0).setFriction(0.6), fixed);
  // Lane-specific obstacles: a thin collider at the lane's depth so only bodies in that lane can touch it.
  const staticByHandle = new Map<number, string>();
  (opts.statics ?? []).forEach((st, i) => {
    const c = world.createCollider(RAPIER.ColliderDesc.cuboid(st.w / 2, st.h / 2, 0.3).setTranslation(st.x, st.y, laneZ(st.lane)).setFriction(0.5).setRestitution(0.2).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), fixed);
    staticByHandle.set(c.handle, st.id ?? `static_${i}`);
  });

  // A floating body that starts in water starts at its floating draft, not on the sea floor.
  const startFloat = (b: FloatBody) => (b.floats && opts.flood.depthAt(b.x, 0) > b.h ? opts.flood.etaAt(b.x, 0) - (b.density / RHO_WATER) * b.h + b.h / 2 : -Infinity);
  const sim = opts.bodies.map((b) => {
    const mass = b.density * b.w * b.h * b.thickness;
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(b.x, Math.max(g.bed(b.x) + b.h / 2 + 0.0005, startFloat(b)), laneZ(b.lane ?? 'hero'))
        .enabledTranslations(true, true, false)
        .enabledRotations(false, false, true)
        .setAngularDamping(3),
    );
    const collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(b.w / 2, b.h / 2, b.thickness / 2).setMass(mass).setFriction(0.7).setRestitution(0.1).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    return { spec: b, body, collider, mass };
  });
  const byHandle = new Map(sim.map((s) => [s.collider.handle, s]));

  const poses: FloatPose[][] = [];
  const impacts: FloatBake['impacts'] = [];
  const hit = new Set<string>();
  const steps = Math.round(opts.tEnd / dt);
  const lastSub = new Map<string, number>();

  for (let step = 0; step <= steps; step++) {
    const t = step * dt;
    if (step % every === 0) {
      poses.push(
        sim.map((s) => {
          const p = s.body.translation();
          const q = s.body.rotation();
          return { id: s.spec.id, x: p.x, y: p.y, angle: 2 * Math.atan2(q.z, q.w), submerged: lastSub.get(s.spec.id) ?? 0 };
        }),
      );
    }
    if (step === steps) break;

    const preV = new Map(sim.map((s) => [s.spec.id, s.body.linvel().x]));
    for (const s of sim) {
      s.body.resetForces(true);
      if (!s.spec.floats) continue;
      const p = s.body.translation();
      const v = s.body.linvel();
      const bottom = p.y - s.spec.h / 2;
      // Only where the field actually has water: for a dry cell the field's surface equals the ground (5.7 m up the ramp).
      const wet = opts.flood.depthAt(p.x, t) > 0.005;
      const surface = wet ? opts.flood.etaAt(p.x, t) : -Infinity;
      const sub = Math.min(s.spec.h, Math.max(0, surface - bottom));
      lastSub.set(s.spec.id, sub);
      if (sub <= 0) continue;
      const buoy = RHO_WATER * 9.81 * sub * s.spec.w * s.spec.thickness;
      const uw = opts.flood.velocityAt(p.x, t);
      const rel = uw - v.x;
      const drag = 0.5 * RHO_WATER * cd * (sub * s.spec.thickness) * rel * Math.abs(rel);
      const dragY = -0.5 * RHO_WATER * 1.5 * (s.spec.w * s.spec.thickness) * v.y * Math.abs(v.y);
      s.body.addForce({ x: drag, y: buoy + dragY, z: 0 }, true);
    }
    world.step(queue);
    queue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      const a = byHandle.get(h1);
      const b = byHandle.get(h2);
      // a body against a fixed obstacle (post, wall): the impulse is the body's own momentum change
      const stName = staticByHandle.get(h1) ?? staticByHandle.get(h2);
      const body = a ?? b;
      if (stName && body && !(a && b)) {
        const key = body.spec.id + '|' + stName;
        if (hit.has(key)) return;
        hit.add(key);
        const closing = Math.abs(preV.get(body.spec.id) ?? 0);
        if (closing > 0.2) impacts.push({ t: t + dt, impulse: body.mass * closing * 1.1, closingSpeed: closing, a: body.spec.id, b: stName });
        return;
      }
      if (!a || !b) return;
      const key = [a.spec.id, b.spec.id].sort().join('|');
      if (hit.has(key)) return;
      hit.add(key);
      const closing = Math.abs((preV.get(a.spec.id) ?? 0) - (preV.get(b.spec.id) ?? 0));
      const mu = (a.mass * b.mass) / (a.mass + b.mass);
      // The lighter, floating body is the striker; the other is struck.
      const [striker, struck] = a.spec.floats && !b.spec.floats ? [a, b] : b.spec.floats && !a.spec.floats ? [b, a] : [a, b];
      impacts.push({ t: t + dt, impulse: mu * closing * 1.1, closingSpeed: closing, a: striker.spec.id, b: struck.spec.id });
    });
  }
  world.free();
  return { sampleDt, poses, impacts };
}
