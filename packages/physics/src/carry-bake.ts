import RAPIER from '@dimforge/rapier3d-compat';
import { initPhysics, type BakeFrame } from './rapier.ts';
import type { CarryClip } from '../../motion/src/carry.ts';
import { CRATE } from '../../motion/src/carry.ts';
import { laneZ } from '@engine/contracts/src/lanes.ts';

/**
 * Transform ownership (plan 7.1) for one prop. The crate has exactly one owner at any instant:
 *   t < tGrasp            physics (resting on the ground)
 *   tGrasp <= t < tRelease animation (kinematic body following the hands)
 *   t >= tRelease          physics again, released at rest (the put-down is gentle by design; the release frame has the crate on the ground)
 * The switch happens at a substep boundary, so nothing both drives and simulates it.
 */
export async function bakeCarryCrate(clip: CarryClip, opts: { fps: number; stepSeconds: number; massKg: number }): Promise<{ frames: BakeFrame[]; owner: ('physics' | 'animation')[] }> {
  await initPhysics();
  const stepsPerFrame = Math.round(1 / opts.fps / opts.stepSeconds);
  const frames = Math.floor(clip.duration * opts.fps);

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = opts.stepSeconds;
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 0.5, 5).setTranslation(0, -0.5, 0), ground);

  const start = clip.sampleAt(0).crate;
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x, start.y + 0.0005, laneZ('hero')).enabledTranslations(true, true, false).enabledRotations(false, false, true),
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(CRATE.w / 2, CRATE.h / 2, 0.25).setMass(opts.massKg).setFriction(0.8).setRestitution(0.05), body);

  const out: BakeFrame[] = [];
  const owner: ('physics' | 'animation')[] = [];
  let kinematic = false;
  for (let f = 0; f < frames; f++) {
    const t0 = f / opts.fps;
    const q = body.rotation();
    const tr = body.translation();
    out.push({ frame: f, bodies: [{ id: 'crate', x: tr.x, y: tr.y, angle: 2 * Math.atan2(q.z, q.w) }] });
    owner.push(kinematic ? 'animation' : 'physics');

    for (let s = 0; s < stepsPerFrame; s++) {
      const t = t0 + s * opts.stepSeconds;
      const held = t >= clip.tGrasp && t < clip.tRelease;
      if (held && !kinematic) {
        body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
        kinematic = true;
      } else if (!held && kinematic) {
        body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        kinematic = false;
      }
      if (kinematic) {
        const next = clip.sampleAt(t + opts.stepSeconds).crate;
        body.setNextKinematicTranslation({ x: next.x, y: next.y, z: laneZ('hero') });
      }
      world.step();
    }
  }
  world.free();
  return { frames: out, owner };
}

