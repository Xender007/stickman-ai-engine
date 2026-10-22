# Milestone 3: flood slice

Date: 2026-10-23. Plan: `docs/AI-STICKMAN-ENGINE-PLAN-v3.md` sections 8.1 to 8.6 and 14. Read `RULES.md` and milestones 0 to 2 first.

**Status: programmatic gates met. Look and feel are placeholder level and need your review.**

## Why this milestone exists

The previous engine animated water by moving one global level up and down. The plan's key physical claim is that water
is a field (depth and flow over terrain), so a surge arrives in the right order, drains through the street, leaves puddles in
low spots, floats some objects and strands others. This milestone replaces the stand-in flood from Milestone 2 with a real
solver, proves the solver against analytic solutions before anything depends on it, and drives debris from it.

## What was built

| Piece | Where | What and why |
|---|---|---|
| Shallow-water solver | `packages/environment/src/swe1d.ts` | 1D finite volume on a transect. HLL fluxes with dry-aware wave speeds, hydrostatic reconstruction (still water over uneven ground stays still; no negative depths at wet/dry fronts), Manning friction, CFL-limited steps, Float64, fixed loop order, boundary-flux accounting. 1D because the pilot shots are side views; 2D flow around buildings is not built. |
| Solver tests | `swe1d.test.ts` | 8 tests: still lake over bumpy terrain with dry islands, Stoker wet dam break, Ritter dry dam break, run-up and drain, mass balance with open boundaries, closed-domain conservation, determinism, wet front without negative depth. |
| Harbor field | `packages/environment/src/harbor-field.ts` | Terrain (sea floor, vertical quay, 1% street, an 18 cm pit, building line), a surge released from a reservoir into a calm sea 1.2 m below the street, baked at 10 Hz story time. `fieldScenario` exposes it through the same `FloodScenario` interface as the old stand-in. |
| Flood interface | `packages/environment/src/flood.ts` | `FloodScenario` gained `depthAt`, `velocityAt`, `etaAt`. New `WetState`: the wet mark persists after the water leaves, wetness saturates while submerged and dries exponentially afterwards (plan 8.4). |
| Floating debris | `packages/physics/src/float-bake.ts` | Rapier bodies with buoyancy from submerged volume, drag from velocity relative to the water, a sloped street, a wall at the street end, collision events for damage. |
| Two clocks in use | `packages/world/src/floodfixture.ts` | 18 s of video cover 144.5 s of story: calm (1x), the surge (1x), the drawdown (8x), the street drying (16x). Physical state follows story time. |
| Environment timeline | `packages/world/src/envtimeline.ts` | Now takes a story-time function, a pose source and an optional water profile per frame. |
| Render | `apps/video/src/EnvScene.tsx` | Water drawn from the solver profile as columns with foam where it moves fast or steepens; a crate; a third camera (`strand`). |
| Driver | `apps/engine-cli/src/flood.mts` | `npx tsx apps/engine-cli/src/flood.mts stills|sequence|shuffle|video`. |
| Registry | `packages/world/src/registry.seed.ts` | Four capabilities moved to `validated`: `swe_ts@1`, `urban_flood_wet_dry@1`, `floating_debris@1`, `two_clock_timeline@1`. |

## Gate results (rerun commands)

| Gate | Command | Result |
|---|---|---|
| All engine tests | `npm run test:engine` | 84 pass, 0 fail |
| Legacy tests and typecheck | `npm test` | 7 pass; `tsc --noEmit` clean |
| Still lake over bumpy terrain | `swe1d.test.ts` | max velocity < 1e-6 m/s after 600 s; surface unchanged to 1e-9 |
| Stoker wet dam break | same | L1 depth error **0.23%** (limit 3%) |
| Ritter dry dam break | same | L1 error **0.46%** (limit 5%); front where depth = 1% of h0 at 36.35 m vs exact 37.65 m (3.5% off, limit 5%) |
| Run-up and drain | same | no negative depth; mass conserved to 1e-9; the only water not connected to the sea is the closed pool |
| Mass balance | same and `floodscene.test.ts` | volume change equals integrated boundary flux; the harbor field's error is 1.8e-14 relative |
| Determinism | same, `floodscene.test.ts` | identical state hashes on two runs |
| Waterline | `float-bake.test.ts` | a log (density 600) in still water floats 60% submerged within 10% and sits where Archimedes says, within 2 cm |
| Grounding | same | after the water leaves: gap <= 2 cm, tilt <= 5 degrees of the street slope, at rest |
| Refloating | same | returning water lifts a grounded log by more than 0.5 m |
| Scene: surge order | `floodscene.test.ts` | dry street, then arrival at the quay at about 7.1 s, then inland later; peak 0.7 to 1.6 m at the car |
| Scene: drawdown | same | sea falls below the street; street under 3 cm at 140 s; the pit holds more than its surroundings |
| Scene: damage is caused | same | the log is lifted, carried into the car at 8.08 s (closing 3.7 m/s, 933 N*s); the car is **wrecked** (above the 600 N*s threshold). Nobody scripted the level; the impulse did. It happens after the cut to the medium shot. |
| Scene: persistence and drying | same | the building's wet line stays at its maximum after the water leaves; wetness peaks at 1.0 and is falling at the end |
| Scene: floating only on water | same | every submerged sample has water at its position |
| Scene: stranding | same | the crate ends at x = 18.4 m: gap <= 2 cm, tilt <= 5 degrees, at rest for the last 2 s; the log is swept into the sea and not stranded on the street |
| Scene: continuity | same | across both cuts (frames 59/60, 344/345): positions < 0.3 m, damage identical, wetness steps small |
| Sequential render equals isolated stills | `flood.mts sequence` | 16 frames including both cuts and the clock joins: 0 mismatches |
| Milestones 1 and 2 still pass | `carry.mts sequence`, `harbor.mts sequence` | 0 mismatches |
| Render time | `flood.mts video` | 540 frames (18 s) in 18.8 s on the GTX 1050 |

Output: `out/engine/flood.mp4` (the label shows camera, story time and the car's damage state).

## Bugs and corrections found along the way (read before changing the solver or the bake)

1. **Test definitions, not solver bugs, caused three first-run failures.** (a) The Ritter "front" at a 1 mm depth lagged 13%: the exact solution has a sub-centimetre parabolic tip no first-order grid resolves (1.8 cm at x = 38, 0.8 cm at x = 40); the front is now compared at 1% of h0, with the exact value evaluated at the same threshold. (b) The beach test's "wet above the shoreline" cells were the sea itself (it rose 0.2 m absorbing the flood sheet) and its flat plateau cannot drain; the test now uses a continuous slope and checks connectivity (stray puddles) instead of a level. (c) Three more "perched" cells were a film still draining into the sea. None of the solver's code changed for these; the criteria were wrong.
2. **Buoyancy on dry cells.** The field's surface elevation for a dry cell equals the ground, which on the building ramp is 5.7 m, so a crate "floated" there. Buoyancy now applies only where the field has water (> 5 mm).
3. **Reflection from the domain's far wall** created a second surge after about 85 s. The sea domain was extended from 400 m to 900 m; the window is now clean to 200 s (checked to 200 s; the scene uses 150 s).
4. **Streets drain slower than expected.** At 70 s a 3 to 9 cm film remained; the original 70 s window therefore showed no drying. With the longer clean window the street is under 1 cm at 150 s. Manning n = 0.025 and the 1% slope are why; both are tunable.
5. **Wet state was a snapshot, not a history.** `wetOf` (Milestone 2) could not keep a mark after the water left or dry slowly; replaced by `WetState`.

## Needs your review (rule R7)

- Watch `out/engine/flood.mp4`. Weak spots I can see: the water is stair-stepped columns with blocky foam, no curling crest; the ground does not darken when wet; the wide shot has a large dark foreground fill; buildings are flat boxes; the log's end-over-end tumble over the quay edge is not drawn (it leaves frame).
- The flood scenario's numbers (surge height 3.5 m, Manning 0.025, 1% street slope, car braked in place) are my choices to make a plausible event, not calibrated to any real harbor.

## Not done, and why

- **2D flow** (water routing around buildings, down side streets): the transect is 1D.
- **Tides, a leading depression before the surge, a second wave**: the scenario is one surge into a closed basin; the plan's "retreat, then return" sequence needs forcing at the sea boundary (Milestone 3b if wanted).
- **A floating or swept car** (`vehicle_flooding@1` stays planned): the car is braked and feels no water force. At about 1 m depth and 4 to 5 m/s a real car would move.
- **Fish stranding** (`fish_stranding@1` stays planned), splash particles, spray.
- **GeoClaw cross-check** (plan 8.6): not run; Docker has no Linux image pulled. The analytic tests above are the validation until then.
- **Pit geometry in physics:** the 18 cm pit exists in the field and its water, but the Rapier ground is a flat sloped plane, so debris does not sit lower in it.

## Decisions taken (and why)

- **1D first.** Side-view shots need a transect; 2D is a large step with no shot that needs it yet.
- **Validate before depending.** The solver passed its analytic tests before the harbor field existed, so later oddities could be blamed on scenario choices, not numerics.
- **One interface, two implementations** (`FloodScenario`): wetness, damage and rendering did not change when the solver replaced the stand-in; Milestone 2's tests still pass on it.
- **Story time is the physics clock.** Everything physical (solver, bake, wetness) runs in story seconds; the edit clock only chooses which story second each frame shows.

## Next: Milestone 4 (integrated survival pilot)

Per the plan: a 15 to 30 s edit with character action, an environmental interaction, persistent aftermath and a camera change,
reviewed by you. What is still missing for it, in order: (1) the character in water (wading: slower pace, drag, wet clothes),
`walk_on_mud@1`, and running; (2) a character interacting with the flood field (knocked or carried); (3) the scene authored as
`pilot/*.scene.json` and validated; (4) lighting and a first art pass from your style bible approval. See `milestone-4.md`.
