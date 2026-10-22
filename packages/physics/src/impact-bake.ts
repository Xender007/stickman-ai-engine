import RAPIER from '@dimforge/rapier3d-compat';
import { initPhysics, type BakeFrame } from './rapier.ts';
import { laneZ } from '@engine/contracts/src/lanes.ts';

export interface ImpactEvent {
  /** Simulation time of first contact (s). */
  t: number;
  /** Impulse of the collision in N*s, from reduced mass and closing speed (restitution included). */
  impulse: number;
  closingSpeed: number;
  a: string;
  b: string;
}

export interface ImpactBake {
  frames: BakeFrame[];
  impacts: ImpactEvent[];
}

export interface ImpactBodies {
  car: { x: number; w: number; h: number; mass: number };
  log: { x: number; w: number; h: number; mass: number };
}

/**
 * A log carried by the flood front hits a parked car. The flood is not simulated here (Milestone 3): the log feels a
 * linear drag toward the front speed once the front reaches it (documented limit: debris only, the car is not pushed).
 * Contact comes from Rapier's collision events, so the damage the world applies is caused by the simulation, not scripted.
 */
export async function bakeLogImpact(opts: {
  fps: number;
  stepSeconds: number;
  frames: number;
  bodies: ImpactBodies;
  /** Time at which the water first touches the log, and the speed it carries it toward. */
  logTouchedAt: number;
  currentSpeed: number;
  dragNsPerM: number;
}): Promise<ImpactBake> {
  await initPhysics();
  const stepsPerFrame = Math.round(1 / opts.fps / opts.stepSeconds);
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = opts.stepSeconds;
  const queue = new RAPIER.EventQueue(true);

  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 0.5, 5).setTranslation(0, -0.5, 0), ground);

  const make = (b: { x: number; w: number; h: number; mass: number }, friction: number) => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(b.x, b.h / 2 + 0.0005, laneZ('hero')).enabledTranslations(true, true, false).enabledRotations(false, false, true),
    );
    const collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(b.w / 2, b.h / 2, 0.5).setMass(b.mass).setFriction(friction).setRestitution(0.1).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    return { body, collider };
  };
  // Creation order is part of the contract (rule R9).
  const car = make(opts.bodies.car, 0.9);
  const log = make(opts.bodies.log, 0.5);

  const frames: BakeFrame[] = [];
  const impacts: ImpactEvent[] = [];
  let hit = false;

  for (let f = 0; f < opts.frames; f++) {
    const pose = (id: string, b: RAPIER.RigidBody) => {
      const t = b.translation();
      const q = b.rotation();
      return { id, x: t.x, y: t.y, angle: 2 * Math.atan2(q.z, q.w) };
    };
    frames.push({ frame: f, bodies: [pose('car_017', car.body), pose('log_003', log.body)] });

    for (let s = 0; s < stepsPerFrame; s++) {
      const t = (f * stepsPerFrame + s) * opts.stepSeconds;
      log.body.resetForces(true);
      if (t >= opts.logTouchedAt) {
        const vx = log.body.linvel().x;
        log.body.addForce({ x: opts.dragNsPerM * (opts.currentSpeed - vx), y: 0, z: 0 }, true);
      }
      const vLog = log.body.linvel().x;
      const vCar = car.body.linvel().x;
      world.step(queue);
      queue.drainCollisionEvents((h1, h2, started) => {
        if (!started || hit) return;
        const pair = new Set([h1, h2]);
        if (!(pair.has(car.collider.handle) && pair.has(log.collider.handle))) return;
        hit = true;
        const closing = Math.abs(vLog - vCar);
        const mu = (opts.bodies.car.mass * opts.bodies.log.mass) / (opts.bodies.car.mass + opts.bodies.log.mass);
        impacts.push({ t: t + opts.stepSeconds, impulse: mu * closing * 1.1, closingSpeed: closing, a: 'log_003', b: 'car_017' });
      });
    }
  }
  world.free();
  return { frames, impacts };
}
