import RAPIER from '@dimforge/rapier3d-compat';
import { stateHash } from '@engine/contracts/src/hash.ts';
import { laneZ } from '@engine/contracts/src/lanes.ts';
import type { Lane } from '@engine/contracts/src/scenespec.ts';

export interface BodySpec {
  id: string;
  lane: Lane;
  shape: { kind: 'box'; hx: number; hy: number } | { kind: 'ball'; r: number };
  position: [number, number];
  angle?: number;
  mass?: number;
  dynamic?: boolean;
}

export interface BakeFrame {
  frame: number;
  bodies: { id: string; x: number; y: number; angle: number }[];
}

let ready: Promise<void> | undefined;
export const initPhysics = (): Promise<void> => (ready ??= RAPIER.init());

/**
 * Deterministic lane-locked bake. Bodies keep a fixed Z and may only translate in X/Y and rotate about Z,
 * so they behave as 2D bodies inside the 3D world (plan section 5.1). The fixed step divides one frame.
 */
export async function bakeRigid(opts: { fps: number; stepSeconds: number; frames: number; gravity?: number; bodies: BodySpec[]; groundY?: number }): Promise<BakeFrame[]> {
  await initPhysics();
  const stepsPerFrame = Math.round(1 / opts.fps / opts.stepSeconds);
  if (Math.abs(stepsPerFrame * opts.stepSeconds * opts.fps - 1) > 1e-6) throw new Error('stepSeconds must divide one frame');

  const world = new RAPIER.World({ x: 0, y: -(opts.gravity ?? 9.81), z: 0 });
  world.timestep = opts.stepSeconds;

  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, opts.groundY ?? 0, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 0.5, 5).setTranslation(0, -0.5, 0), ground);

  const handles = new Map<string, RAPIER.RigidBody>();
  // Creation order is part of the contract: same order, same result.
  for (const b of opts.bodies) {
    const desc = (b.dynamic === false ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
      .setTranslation(b.position[0], b.position[1], laneZ(b.lane))
      .setRotation({ x: 0, y: 0, z: Math.sin((b.angle ?? 0) / 2), w: Math.cos((b.angle ?? 0) / 2) })
      .enabledTranslations(true, true, false)
      .enabledRotations(false, false, true);
    const body = world.createRigidBody(desc);
    const cd =
      b.shape.kind === 'box' ? RAPIER.ColliderDesc.cuboid(b.shape.hx, b.shape.hy, 0.5) : RAPIER.ColliderDesc.ball(b.shape.r);
    if (b.mass) cd.setMass(b.mass);
    cd.setFriction(0.6).setRestitution(0.1);
    world.createCollider(cd, body);
    handles.set(b.id, body);
  }

  const out: BakeFrame[] = [];
  for (let f = 0; f < opts.frames; f++) {
    out.push({
      frame: f,
      bodies: opts.bodies.map((b) => {
        const body = handles.get(b.id)!;
        const t = body.translation();
        const q = body.rotation();
        return { id: b.id, x: t.x, y: t.y, angle: 2 * Math.atan2(q.z, q.w) };
      }),
    });
    for (let s = 0; s < stepsPerFrame; s++) world.step();
  }
  world.free();
  return out;
}

export const bakeHash = (frames: BakeFrame[]): string => stateHash(frames);
