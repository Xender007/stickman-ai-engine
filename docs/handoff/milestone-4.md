# Milestone 4: integrated survival pilot

Date: 2026-10-23. Plan: `docs/AI-STICKMAN-ENGINE-PLAN-v3.md` sections 14 and 14.1. Read `RULES.md` and milestones 0 to 3 first.

**Status: programmatic gates met. The plan's exit condition also requires human acceptance, which only you can give (see "Needs your review").**

## Why this milestone exists

Milestones 1 to 3 proved single pieces (a character, persistent state, a flood). The plan's exit condition for the pilot is the
combination: character action with contact, an environmental interaction, persistent aftermath and a camera change, in one
edit that someone can watch. The risk the combination exposes is integration: a character that is fine alone can be unsafe,
disconnected from the water, or cut badly when the world is also moving.

## The pilot ("The Drawdown, then the Hit")

29.2 s of video covering 71 s of story. Ravi carries a box along the street toward a stair gantry. The surge reaches the quay at
7.1 s while he is already climbing; a floating log is carried into a parked car (wrecked by the impact), seen from a wide cut;
he reaches the landing, waits while the street drains (a 3 s time-lapse of 45 s), turns on a cut, descends and walks out
through the film of water left on the street, his legs now wet. A crate is stranded where the water left it; the pit keeps its
puddle. Output: `out/engine/pilot.mp4`.

## What was built

| Piece | Where | What and why |
|---|---|---|
| Foothold planner for any height | `packages/motion/src/gait.ts`, `pilot.ts` | Plants carry (x, y). One planner makes the flat approach, 12 stairs, the landing, the descent and the walk-out; the hip is derived from the feet, so planted feet cannot slide on flat ground, a slope or stairs. A stepping-up foot lifts early and a stepping-down foot descends late so the swing clears each riser. |
| Facing either way | `packages/motion/src/rig.ts` | `solveSkeleton(pose, facing)`: mirrored about the hip, solved facing +x, mirrored back. Mirroring preserves every length, so bone lengths stay constant (tested). |
| Gantry | `pilot.ts` (`GANTRY`, `surfaceY`) and `EnvScene.tsx` | One definition of the stairs drives both the footholds and the drawn gantry. |
| Characters in the world state | `packages/world/src/envtimeline.ts` | A character's joints, facing, wetness (from how deeply the feet are *submerged*, not from the street's depth below a landing) and a water exposure record (submerged depth, speed, depth x velocity, foot clearance above the surface) in every frame. |
| Follow cameras | same | Position follows an entity with a centred cosine-weighted average computed offline inside the shot, so every frame stays independent (rule R8b). |
| Front lane | `packages/contracts/src/lanes.ts` | A lane in front of the hero lane so a character passes in front of the car and debris. |
| Pilot fixture | `packages/world/src/pilotfixture.ts` | Assembles the solver field, floating debris, the clip, three clock segments and six shots. |
| Pilot SceneSpec | `pilot/the-drawdown-the-hit.scene.json` | Authored as data, validated by the compiler, and **allowed to render in final mode with zero capability gaps** (a test keeps the JSON equal to the built scene). |
| Shared drawing | `apps/video/src/Figure.tsx` | The stickman, bones and cached materials in one place for both scenes. |
| Registry | `packages/world/src/registry.seed.ts` | New `validated`: `stairs_climb@1`, `character_in_flood_safety@1`, `wet_legs@1`, `follow_camera@1`, `turn_on_cut@1`. |

## Gate results (rerun commands)

| Gate | Command | Result |
|---|---|---|
| All engine tests | `npm run test:engine` | 107 pass, 0 fail |
| Legacy tests and typecheck | `npm test` | 7 pass; `tsc --noEmit` clean |
| Pilot is 15 to 30 s and covers over a minute of story | `pilotscene.test.ts` | 875 frames = 29.2 s, story 0 to 71 s; clock segments join without an unexplained jump |
| Identity | `pilot.test.ts`, `pilotscene.test.ts` | all 9 bone lengths constant to 1e-9 m in every frame facing either way; the same limb lengths in every frame of the built scene |
| Planted feet do not slide (flat, stairs, landing, street) | `pilot.test.ts` | every planted run passes the contact-drift check (1 cm per frame, 3 cm per interval) |
| Feet on the surface | `pilot.test.ts` | planted feet within 1e-6 m of the street, tread or landing; swing feet never more than 2 cm into it |
| Legs reach, knees bend naturally | `pilot.test.ts` | no leg at full stretch in any frame; knee flexion between -1 and 150 deg |
| Hands on the box; box never through the stairs | `pilot.test.ts` | within 5 cm in every frame; no arm at full stretch |
| Smoothness | `pilot.test.ts` | no 5-sigma spike in hip X, hip Y, head Y or box Y in either moving stretch |
| **Survivability** | `pilotscene.test.ts` | depth x velocity at the feet never above 0.6 m^2/s (peak 0.045); feet at least 0.4 m above the surface while the surge is passing (minimum 0.62 m) |
| Timing is the story | same | climbing before the surge reaches the stairs (arrival 9.0 s, climb starts 6.1 s); on the landing by 12.1 s, before the water peaks |
| Wetness | same | legs dry until the descent; first wet at 63.7 s; wet at the end |
| Aftermath | same | car wrecked by the log (cause recorded), crate stranded at x = 18.4 m, pit holds more than 10 cm, car's wet mark above 0.9 m |
| Continuity across all 5 cuts | same | positions, damage and wetness continuous; the box swaps sides only at the turn |
| Turn only on a cut, exactly once | same | one flip, at frame 480 |
| Follow cameras | same | no frame-to-frame jump above 12 cm inside a shot; Ravi on screen in every follow-shot frame |
| SceneSpec | same | `pilot/the-drawdown-the-hit.scene.json` equals the built scene (length, shots, cameras) and resolves with **zero capability gaps in final mode** |
| Deterministic | same | a second full build gives the same state hash (`stateHash` printed by `pilot.mts`) |
| Sequential render equals isolated stills | `npx tsx apps/engine-cli/src/pilot.mts sequence` | 20 frames including every cut and the turn: 0 mismatches |
| Earlier scenes still pass the same gate (shared code changed) | `flood.mts`, `harbor.mts`, `carry.mts sequence` | 0 mismatches each |
| Render time | `pilot.mts video` | 875 frames (29.2 s) at 1080 x 1920 in 33 s on the GTX 1050 |

## Bugs found and fixed along the way

1. **The first swing foot clipped a stair riser by 3.9 cm** (then 5.3 cm after a first fix). The foot started only 14 cm before the edge, so it must be at the new height almost at once: it now reaches full height by one third of the swing. The clearance test now covers every frame.
2. **Smoothness is a per-motion-stretch measure.** The 5-sigma jitter check failed on a clip that is 40 s of standing still: the sigma was tiny and ordinary stepping looked like spikes. The check now runs on the moving stretches (going, coming back); the threshold is unchanged (rule R12).
3. **Wetness leaked between two meanings of "wet".** The entity's wet mark (depth at its edge) and the character's leg wetness (depth over the feet) shared one state, so the street's water under the landing made Ravi "wet" at 9 s. They are separate states now; he first gets wet at 63.7 s, when he steps into the film.
4. **"Depth at the feet" was the wrong quantity on a landing.** It reported 0.6 m of water while he stood 1.8 m above the street. Exposure now uses the submersion of the foot (water surface minus foot height); depth x velocity, the standard danger measure, peaks at 0.045 m^2/s (limit 0.6).
5. **The turn.** Facing is a one-frame flip and the carried box swaps sides with him (1.0 m). It is built to land on a cut (frame 480), and a test requires that facing changes only on a cut and exactly once.

## Needs your review (rule R7)

This is the milestone where the plan asks for **human acceptance**. Watch `out/engine/pilot.mp4` and tell me, shot by shot, what you accept and what you want changed. What I can see:

- The acting is functional, not expressive: no face, no head turn, no reaction to the surge, the climb is a repeated cycle, the turn is hidden by a cut.
- The art is placeholder: flat boxes for buildings, blocky foam steps on the water, a dark foreground fill, no lighting, no weather. The style bible is still a draft awaiting your approval.
- The cuts and timing (when the wide shot cuts in for the impact, how long the time-lapse is) are my choices.
- The story logic is mine: he climbs because he saw the water coming; nothing in the video says so yet (no sound, no captions, no voice).

## Not done, and why

- **Sound, voice, captions, slams** (the legacy pipeline has all of these; connecting it to the new scenes is the next integration step).
- **Lighting and art pass**: blocked on your style bible approval (rule R7) and on assets.
- **Wading** (`walk_on_mud@1` stays planned): the character is above the surge by design, and the final walk is in a 7 cm film, which only tints the legs. Real wading (slower pace, drag, splash) is not built.
- **Running, falling, being swept, a rescue**: not built; the safety check is what keeps the story inside what the engine can do.
- **A visible turn**, hand-rail contact, expression.
- **The competitive benchmark** against Higgsfield, Kling and Seedance (plan 14.2): needs the clips and a panel of viewers; not something I can run.

## Decisions taken (and why)

- **Safety check instead of a rescue animation.** The engine cannot yet animate a person being swept away, so the scene is written so that he never needs to be, and a measured check (depth x velocity at the feet, clearance above the surface, every frame) fails the build if a change to the flood puts him in danger.
- **The gantry instead of a fire escape on a building** so one definition drives geometry and footholds.
- **One planner for every phase** instead of a special case per phase.

## Next: Milestone 5 (capability breadth)

The plan lists vehicles, weather, animals, flexible objects and material responses, each as a bounded module with tests.
Before adding any, the biggest decision is yours: the genre doc (`docs/genre-capabilities.md`) lists what a zombie or
end-of-the-world story needs; a crowd slice (20 instanced characters on the 4 GB GPU) is the largest unknown and I recommend
it first. See `milestone-5.md` if it exists.
