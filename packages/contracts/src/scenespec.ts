import { z } from 'zod';

/** "name@version" reference to an immutable registry entry. */
export const Ref = z.string().regex(/^[a-z][a-z0-9_]*@\d+$/, 'expected name@version, e.g. sedan@3');
export type Ref = z.infer<typeof Ref>;

export const Id = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const StoryTime = z
  .object({
    startSeconds: z.number().min(0),
    endSeconds: z.number().min(0),
    mode: z.enum(['continuous', 'elapsed']),
  })
  .refine((t) => t.endSeconds >= t.startSeconds, 'storyTime ends before it starts');

export const Entity = z.object({
  id: Id,
  asset: Ref.optional(),
  passport: Ref.optional(),
  lane: z.enum(['front', 'hero', 'near', 'mid', 'far']).default('hero'),
  restoreFromState: z.boolean().default(false),
});

export const Action = z.object({
  actor: Id,
  motion: Ref,
  startFrame: z.number().int().min(0),
  path: Ref.optional(),
});

export const Shot = z.object({
  fromFrame: z.number().int().min(0),
  toFrameExclusive: z.number().int().min(1),
  camera: Ref,
});

export const SceneSpec = z
  .object({
    schemaVersion: z.literal(3),
    sceneId: Id,
    fps: z.number().int().min(1).max(120),
    durationFrames: z.number().int().min(1),
    seed: z.string().min(1),
    units: z.object({ length: z.literal('m'), mass: z.literal('kg'), time: z.literal('s') }),
    coordinates: z.object({ upAxis: z.literal('y'), groundPlane: z.literal('xz') }),
    staging: z.object({ profile: Ref, maxCameraYawDeg: z.number().min(0).max(180) }),
    world: Ref,
    stateIn: Ref.optional(),
    storyTime: StoryTime,
    style: Ref,
    artwork: z.object({ allowExternalGeneration: z.boolean(), requireApprovedAssets: z.boolean() }),
    requiredCapabilities: z.array(Ref),
    simulation: z.object({
      rigidBodyEngine: z.literal('rapier3d'),
      rigidStepSeconds: z.number().positive(),
      waterSolver: Ref.optional(),
      waterField: Ref.optional(),
      coupling: z.string(),
    }),
    entities: z.array(Entity),
    actions: z.array(Action),
    shots: z.array(Shot).min(1),
    checks: z.array(z.string()),
  })
  .superRefine((s, ctx) => {
    const issue = (message: string, path: (string | number)[]) => ctx.addIssue({ code: 'custom', message, path });

    // Shots must tile [0, durationFrames) with no gap or overlap.
    let at = 0;
    s.shots.forEach((shot, i) => {
      if (shot.fromFrame !== at) issue(`shot ${i} starts at ${shot.fromFrame}, expected ${at}`, ['shots', i, 'fromFrame']);
      if (shot.toFrameExclusive <= shot.fromFrame) issue(`shot ${i} has no frames`, ['shots', i, 'toFrameExclusive']);
      at = shot.toFrameExclusive;
    });
    if (at !== s.durationFrames) issue(`shots end at ${at}, durationFrames is ${s.durationFrames}`, ['shots']);

    // Every actor must be a declared entity; ids are unique.
    const ids = new Set<string>();
    s.entities.forEach((e, i) => {
      if (ids.has(e.id)) issue(`duplicate entity id ${e.id}`, ['entities', i, 'id']);
      ids.add(e.id);
      if (!e.asset && !e.passport) issue(`entity ${e.id} needs an asset or a passport`, ['entities', i]);
    });
    s.actions.forEach((a, i) => {
      if (!ids.has(a.actor)) issue(`action actor ${a.actor} is not an entity`, ['actions', i, 'actor']);
      if (a.startFrame >= s.durationFrames) issue(`action starts after the scene ends`, ['actions', i, 'startFrame']);
    });

    // The fixed rigid step must divide one frame, so bakes land exactly on frames.
    const perFrame = 1 / s.fps / s.simulation.rigidStepSeconds;
    if (Math.abs(perFrame - Math.round(perFrame)) > 1e-6) {
      issue(`rigidStepSeconds must divide one frame (${perFrame.toFixed(4)} steps per frame)`, ['simulation', 'rigidStepSeconds']);
    }
  });

export type SceneSpec = z.infer<typeof SceneSpec>;
export type Entity = z.infer<typeof Entity>;
export type Lane = Entity['lane'];

export function parseSceneSpec(raw: unknown): SceneSpec {
  return SceneSpec.parse(raw);
}
