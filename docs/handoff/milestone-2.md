# Milestone 2: persistent environment slice

Date: 2026-10-23. Plan: `docs/AI-STICKMAN-ENGINE-PLAN-v3.md` section 14. Read `RULES.md`, `milestone-0.md`, `milestone-1.md` first.

**Status: programmatic gates met. Visual quality is placeholder level and needs your review.**

## Why this milestone exists

Generative video products cannot promise that a car dented in one shot is still dented in the next, or that the water
line on a wall matches the water line on a car seen from another camera. This engine's claim is that it can. This
milestone builds the smallest scene that tests the claim: one street, two cameras, a cut between them, a flood that
wets things, and an impact that damages something, all driven by one shared world state.

## What was built

| Piece | Where | What and why |
|---|---|---|
| Location in metres | `packages/world/src/location.ts` | `harborStreet()`: quay at x = 0, street to x = 34, 7 entities (car, log, lamp, bollard, 3 buildings) each with a lane, footprint, size and base height. Every camera reads the same data. |
| Camera maths | `packages/world/src/camera.ts`, `envcameras.ts` | Pure perspective projection so Node tests can ask "is this visible, and where?". Two cameras (wide, medium) defined once and used by the fixture, the tests and the video app. |
| Flood scenario | `packages/environment/src/flood.ts` | One sea level track and one front advancing over the street. Everything wet derives from these two functions. The level crosses street level (about 2 s) before the front starts, so water never creeps over dry ground (tested). This is the interface the shallow-water solver fills in Milestone 3. |
| Impact bake | `packages/physics/src/impact-bake.ts` | A log carried by the flood (linear drag toward the front speed once the water reaches it) hits a parked car. Contact comes from Rapier collision events; impulse = reduced mass x closing speed x 1.1. Result: impact at t = 4.34 s, closing speed 1.52 m/s, 184 N*s. |
| Damage from the simulation | `packages/world/src/envtimeline.ts` | `damageFromImpulse`: 100 N*s = dented, 600 N*s = wrecked (uncalibrated starting values). The world ledger applies the damage with its cause text; nothing is scripted. |
| Environment timeline | same | Merges location, flood, simulated poses and ledger into one frame-addressable state. Pure and deterministic (state hash `037f9ead08b360a6`). |
| Render | `apps/video/src/EnvScene.tsx` | Buildings with windows (lit windows are hashed from the entity id), car with dent and cracked-glass states, log, lamp, bollard, wet bands with a lighter rim at the wet line, one sea and street flood sheet shared by both cameras. |
| Driver | `apps/engine-cli/src/driver.mts`, `harbor.mts` | Shared render driver with `stills`, `sequence`, `shuffle`, `video` modes. The Milestone 1 `carry.mts` now uses it too. |
| Registry | `packages/world/src/registry.seed.ts` | Three capabilities `validated`: `persistent_world_state@1`, `impact_damage@1`, `wetness_from_flood@1`, each with evidence. |

## Gate results (rerun commands)

| Gate | Command | Result |
|---|---|---|
| All engine tests | `npm run test:engine` | 57 pass, 0 fail |
| Legacy tests and typecheck | `npm test` | 7 pass; `tsc --noEmit` clean |
| No spawning | `env.test.ts` | identical entity ids in all 270 frames, including across the cut |
| Continuity across the cut (frame 104 to 105) | `env.test.ts` | positions move < 5 cm, damage identical, wetness and wet line change < 0.1, water level < 0.1 |
| Damage is caused, timed and local | `env.test.ts` | car intact until the impact frame, then dented; cause text names the log and the impulse; the impact is after the cut; lamp, building and log untouched |
| Damage never reverses | `env.test.ts` | monotonic for every entity over all frames |
| Wetness | `env.test.ts`, `flood.test.ts` | starts only after the front reaches an entity's seaward edge, never decreases; wet line = min(height, water level) on car and building (one water, every camera) |
| Same geography in both cameras | `env.test.ts` | car, log and lamp visible in the wide shot, car in the medium; entities visible in both appear in the same left-to-right order |
| Deterministic | `env.test.ts` | two builds give the same state hash |
| Sequential render equals isolated stills | `npx tsx apps/engine-cli/src/harbor.mts sequence` | 14 frames (including 104/105 at the cut and 130/131 at the impact): 0 mismatches |
| Shuffled stills | `npx tsx apps/engine-cli/src/harbor.mts shuffle` | 14 frames, 0 mismatches |
| Milestone 1 not broken | `npx tsx apps/engine-cli/src/carry.mts sequence` | 15 frames, 0 mismatches |
| Render time | `npx tsx apps/engine-cli/src/harbor.mts video` | 270 frames (9 s) in 11.1 s on the GTX 1050 |

Output: `out/engine/harbor.mp4` (a small label at the top shows camera, time and the car's damage state; it is a review aid, not final design).

## Bugs and corrections found along the way

1. The first flood scenario started the front on the street at 2.5 s while the sea was still below street level. Fixed (level now crosses 0 at about 2 s) and a test pins it.
2. The first wetness code searched for the arrival time in 0.25 s steps; replaced with an exact `arrival(x)` on the scenario.
3. The water was drawn as 9 m deep boxes, so the camera saw their top faces as a huge white slab. Now thin sheets.
4. The camera rig had to learn about field of view: R3F also applies `fov` only once, and the two shots use different lenses (`CameraRig` takes `fov`).
5. A hard-coded impact time in a test broke when the flood timing changed. The test now checks the cause format and separately that the impact falls after the cut.

## Needs your review (rule R7)

- Watch `out/engine/harbor.mp4`. The gates prove the state is consistent; they do not judge looks. Known weak spots: flat colour boxes for buildings, the water is a flat translucent sheet with a straight white front (not a bore with a curling crest), the ground below the street is a dark fill, the car is a simple three-box model.
- Damage thresholds (100 and 600 N*s) are placeholders. Tell me when you want them calibrated against reference footage.

## Not done, and why

- **Building and street damage** (only the car can be damaged in this slice; the ledger supports any entity).
- **Drying** (`wetOf` only soaks; the plan's drying over elapsed time arrives with the drawdown in Milestone 3).
- **Rolling or floating of the log and car** (buoyancy is Milestone 3). The log is moved by a drag stand-in and the car stays parked.
- **Lighting variation** and sound: none.
- **A third camera or an orbit**: out of scope by the 2.5D profile; two lens/position framings only.
- The `Lanes25D` probe from Milestone 0 still has no sequence gate run (it is superseded by the real scenes).

## Decisions taken (and why)

- **One flood scenario feeds everything wet.** Wetness is derived, not painted per camera, so a wall and a car in different shots cannot disagree.
- **Damage from a physics event, not a script.** If the log's speed changes, the damage level changes; this is what "causal events" in the plan means.
- **Cameras defined once in a pure module** so the tests, the fixture and the renderer cannot drift apart.
- **Generic driver** so each new scene is a dozen lines and gets the same gates.

## Next: Milestone 3 (flood slice)

Replace the flood stand-in with the in-repo shallow-water solver (plan 8.1, 8.6): terrain grid with wetting/drying,
HLL fluxes with hydrostatic reconstruction, analytic acceptance tests (still lake, dam break wet and dry, run-up and
drain, mass balance, determinism), then drive the existing log and car from the solver's depth and velocity, with
buoyancy and grounding for one floating object. The interface to fill is `FloodScenario` in
`packages/environment/src/flood.ts` (`level`, `front`, `arrival`); keep `wetOf` and the tests passing against it.
