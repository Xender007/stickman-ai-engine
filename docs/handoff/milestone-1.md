# Milestone 1: character and object slice

Date: 2026-10-23. Plan: `docs/AI-STICKMAN-ENGINE-PLAN-v3.md` section 14. Read `RULES.md` and `milestone-0.md` first.

**Status: programmatic gates met. The "believable" part of the exit condition needs your eyes** (see "Needs your review").

## Why this milestone exists

The plan's exit condition is "believable contacts, identity and weight in a short clip". Before water, cities or art,
one character must move through the world without the failures that make generated video look wrong: feet sliding on the
ground, limbs changing length, hands drifting off a prop, a prop teleporting when it changes hands. This milestone builds
the smallest scene that can show those failures (walk, stop, crouch, grip, lift, carry, put down) and measures each one.

## What was built

| Piece | Where | What and why |
|---|---|---|
| Rig in metres | `packages/motion/src/rig.ts` | Stick figure with the Quiet Coast proportions (legacy bone units / 148 = metres; 1.74 m standing). Two-bone IK for legs and arms. Bone lengths never change, which is the identity check. |
| Gait planner | `packages/motion/src/gait.ts` | Feet are planted, then swing, then plant. A planted foot's position is stored, not recomputed, so it cannot slide. Steps are driven by distance travelled (not time), so slowing to a stop shortens the steps naturally. |
| Carry clip | `packages/motion/src/carry.ts` | Walk to a crate, stop, crouch, grip, lift, carry 3 m, stop, crouch, put down, stand up. 12.1 s. A pure function of time: any frame can be computed alone. |
| Weight | same | A heavier load leans the torso back further, sits the hips lower and slows the walk (25 kg: 6.3 deg back, 0.95 m/s; 5 kg: 1.3 deg, 1.19 m/s; 40 kg: 10 deg, 0.77 m/s). |
| Ownership hand-over | `packages/physics/src/carry-bake.ts` | The crate has exactly one owner at a time: physics (resting), then animation (kinematic, following the hands) from the grasp, then physics again from the release. The switch happens at a substep boundary. |
| Render | `apps/video/src/CarryScene.tsx`, `carryProps.ts`, `CameraRig.tsx` | Three.js scene in four depth lanes: figure, crate, contact shadow, parallax skylines, camera following the hip (smoothed offline). Everything is baked in Node and read as props. |
| Driver | `apps/engine-cli/src/carry.mts` | `stills`, `shuffle`, `sequence`, `video` modes. Bakes, renders on the Vulkan backend (GTX 1050). |
| Registry | `packages/world/src/registry.seed.ts` | Four capabilities moved to `validated`, each with its evidence: `walk_planted_feet@1`, `carry_prop@1`, `transform_handoff@1`, `sequence_render_identical@1`. |

## Gate results (rerun commands)

| Gate | Command | Result |
|---|---|---|
| All engine tests | `npm run test:engine` | 40 pass, 0 fail |
| Legacy tests and typecheck | `npm test` | 7 pass; `tsc --noEmit` clean |
| Planted feet do not slide | `carry.test.ts` ("planted feet do not slide") | every planted interval passes `contactDrift` (limits: 1 cm per frame, 3 cm per interval) |
| Feet on the ground | `carry.test.ts` | planted feet at y = 0 within 1e-9 m; no foot below the ground |
| Identity | `carry.test.ts` | all 9 bone lengths identical to 1e-9 m in every frame |
| Joint limits | `carry.test.ts` | knee flexion between -1 and 150 deg in every frame; legs never at full stretch (IK never clamped) |
| Hands on the crate | `carry.test.ts` | left hand within 5 cm of the grip point for the whole hold; arms never clamped |
| Smooth motion | `carry.test.ts` | no acceleration spike above 5 sigma in hip X, hip Y or head Y |
| Ownership | `carry-bake.test.ts` | physics, animation, physics at the right times; crate follows the hands within 1 cm; no jump near either hand-over (under 2 cm per frame) |
| Deterministic | `carry-bake.test.ts` | identical hash on two runs (`92387684aed2ce56`) |
| Sequential render equals isolated stills | `npx tsx apps/engine-cli/src/carry.mts sequence` | 15 frames, 0 mismatches (bit-identical) |
| Shuffled stills | `npx tsx apps/engine-cli/src/carry.mts shuffle` | 12 frames, 0 mismatches |
| Render time | `npx tsx apps/engine-cli/src/carry.mts video` | 363 frames (12.1 s) at 1080 x 1920 in about 14 s on the GTX 1050 |

Output: `out/engine/carry.mp4`.

## Bugs found and fixed (read these before touching rendering)

1. **Frozen camera in video renders.** React Three Fiber applies the Canvas `camera` prop once. In a video render each worker reuses one canvas, so the camera stayed at the first frame of the worker's chunk and the figure walked out of view after about 2 seconds. Isolated stills (fresh page each) looked perfect, and so did the Milestone 0 shuffle gate, so it was invisible to every gate until the full video was viewed. Fix: `CameraRig` re-applies the pose every render. New gate: the `sequence` mode, which was shown to fail (14 of 15 frames mismatch) with the rig removed. Recorded as rule R8b. The Milestone 0 `Lanes25D` probe received the same fix but was not re-gated.
2. **Per-frame Three.js allocations.** Geometry with changing `args` and new materials per render accumulate in one canvas. Geometry and materials are now shared at module scope.
3. **Two real defects found by the new tests.** The arm stretched fully while the hips rose before the crate left the ground (fixed by lifting first, then standing). The hip path had a kink where a different foot became the reach limit (fixed with a prescribed bob plus a soft minimum as a safety net). A third issue, the first step, started from a stance too narrow for its geometry; the clip now starts with the feet 0.36 m apart.
4. **My own test was wrong once:** "crate never moves more than 5 cm per frame" failed on ordinary carrying (about 1.5 m/s). It now checks the two hand-over moments and a 2.5 m/s speed cap.

## Needs your review (rule R7)

- **Does it look believable?** Watch `out/engine/carry.mp4`. The checks prove no sliding, constant limb length, and a smooth hand-over; they cannot judge acting quality. Known weak spots I can see: the torso is a single stick (no shoulders or chest), the head has no turn, the crouch is deep and a little stiff, and the scene is a flat colour set with no art. Tell me what to change before Milestone 2 builds on it.
- The figure's **colours and outline weight** are placeholders taken from the style-bible draft; they are not approved.

## Not done, and why

- The plan lists "pick up/release" and "one prop": done for one box-shaped prop. A different prop shape (bag, plank) is not built; the hand-over code is not specific to a crate but the grip points are.
- **Mud and soft ground** (`walk_on_mud@1`) stays `planned`; this milestone is flat ground.
- Ground **shadows** are a flat ellipse, not a lit shadow.
- No sound; footstep cues from the planted-foot events are a Milestone 3 or 4 item (events exist in the data: `planted` per frame).
- The weight model is posture and pace only (no muscle effort or timing hesitation). It is monotonic and tested, not calibrated against reference footage.

## Decisions taken (and why)

- **Distance-driven gait** instead of a time-driven cycle, so a stop does not need a special case and feet never slide.
- **Planned and stored plants:** a foot's world position is data, not a result of IK, so the slide check is exact.
- **Prescribed hip bob plus reach safety net:** pure reach-limited bob has a visible kink.
- **Bake in Node, render from tracks (again),** now including the character: the video app never runs IK or physics.

## Next: Milestone 2 (persistent environment slice)

One detailed location, two cameras, damage and wetness state; the same geography and object state across cuts. Start by reading `packages/world/src/ledger.ts` (entities, damage, wetness are already modelled and tested) and the `lanes` contract; the new work is a location asset, a second camera (`camera_orbit` stays out of scope; use a different lane framing) and wetness/damage as render state.
