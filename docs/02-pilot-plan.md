# Pilot plan: "The Drawdown → The Hit" (30 seconds)

**Goal:** prove on two short scenes that the v2 engine beats today's hand-coded scenes, and can stand next to
Higgsfield, Kling and Seedance clips on consistency, physics, objects and control, before building any platform
infrastructure.

**Scene A, The Drawdown (10 s):** before the second wave the sea pulls back past the old shoreline. Streets and the
harbor floor are exposed: fish flop on wet mud, wrecked cars lie tilted where the water dropped them, boats rest on
their keels, rocks and a debris line mark where the water stood, puddles remain in low spots, the ground dries in
patches. Ravi and Mia cross the mud; the horizon turns white. Proves retreat, settling and stranding physics, fish
flopping, walking in mud, and clear, consistent wreck/debris assets.

**Scene B, The Hit (20 s):** contains the other hard problems: a character carrying another, stair and roof contacts,
a giant surge with buoyant debris, an impact with spray, a camera move from wide to close, text and sound synced to an
impact frame. We already have baselines of both scenes (Part 2 S7 / Part 3 S1–S2 for the drawdown, Part 3 S6–S7 for
the hit).

## Scope

| In the pilot | Out of the pilot |
|---|---|
| Scene A (10 s, 2 shots): the sea retreats across the harbor and streets, leaving stranded fish, wrecked cars, boats aground, rocks, debris, puddles; Ravi and Mia cross the mud; the horizon whitens | Next.js editor, NestJS API, queue, databases, pgvector |
| Scene B (20 s, 4 shots): wave crossing the city (wide); Ravi carrying Mia onto the roof (medium); Ravi shields Mia as the wave hits (medium→close); water climbs the facade and stops two floors below | |
| Drawdown physics: seaward heightfield drain, settling/stranding of floating bodies, fish flop rig, puddles, wrack line, wet-to-dry ground shading | |
| Prop & Debris Registry: stranded fish (3 species), rocks (5), wrecked cars (4), boats aground (2), flood debris set, seabed dressing | |
| SceneSpec v2 + compiler + scale validator + world state ledger | AI director (the pilot scene is hand-authored as data) |
| Character Passport for Ravi and Mia (from your generated sheets) | Faces and lip sync |
| Motion Foundry: 7 clips (idle, walk-mud, stairs-up, carry-child, shield-crouch, stand-up, look-back) | Full motion library |
| Physics tiers 1–3: debris rigid bodies + buoyancy, water heightfield, spray/foam/mud splashes | Fluid simulation beyond the heightfield; building fracture beyond 2 props |
| Plate Studio: 3 style-locked plates (city far, city mid, sky) + 1 optional hero wave plate | Style-model training |
| Quality gate v1: the 10 programmatic checks + benchmark run | Automatic repair loop (manual patches only) |
| Sound: layered impact, surge bed, music stem with ducking | Music composition |

## Timeline (about 7 working weeks; calendar depends on your hours)

| Week | Build | You provide | Done when |
|---|---|---|---|
| 1 | Baseline metrics of the current versions of both scenes; SceneSpec v2 schema; units + scale validator; ledger; `engine/` scaffold; benchmark corpus defined | Approve the 30 s shot list | Both scenes' scale and timing are expressed as SceneSpec data and validated |
| 2 | Character Passport: segmentation, pivots, rig, IK, foot/hand locks; identity fingerprint | Ravi and Mia turnaround sheets (spec in `05-asset-specs.md`) | Both rigs render in 6 test poses; limb ratios constant across poses |
| 3 | Motion Foundry: pose extraction, retarget, contact annotation, blending; the 7 clips | 7 short phone videos of the actions (optional: I can key them by hand) | Stairs, carry and mud walk keep foot contact within threshold |
| 4 | Physics bake: Rapier deterministic, buoyancy, debris; water heightfield with surge and drawdown; settling and stranding; fish flop rig; puddles and wrack line | Prop & debris sheets (fish, rocks, wrecked cars, boats, debris; spec in `05-asset-specs.md`) | Physics tests pass; floats sit at their waterline; every stranded object rests on the ground with the right tilt |
| 5 | PixiJS render layer (water shader, waterline clipping, wet-to-dry ground, rim light, grade); Plate Studio (depth split, parallax) | 4 plates from my prompts (harbor floor exposed, city far, city mid, sky) + optional hero wave clip | Plates match style; parallax has no tearing |
| 6 | Assemble Scene A and Scene B; quality gate v1 | Nothing | All programmatic checks pass on both scenes |
| 7 | Benchmark run; competitive benchmark vs Higgsfield, Kling, Seedance | Generate the competitor clips from my prompts; 10 viewers for blind A/B | Go/no-go review |

## Acceptance gates (go / no-go)
1. **Reproducible:** re-rendering any frame, in shuffled order, is bit-identical on your PC.
2. **Programmatic:** zero critical defects (scale, penetration, identity, floating-in-air objects) and all thresholds
   in `04-quality-scorecard.md` met.
3. **Better than baseline:** on your scorecard, both scenes beat today's versions by at least 2 points in motion,
   physics and art, and your corrections per accepted shot drop to ≤ 1.
4. **Competitive:** against Higgsfield, Kling and Seedance clips made from the same prompts, viewers prefer the pilot
   on consistency, physics and object clarity in at least 2 of 3 pairs per scene, and rate looks as at least
   comparable in 40% or more (60% is the later release target).
5. **Cost and time:** total generation spend recorded; full 30 s render ≤ 8 min on the GTX 1050.

**If gates 1–3 pass but 4 fails on looks:** invest next in Plate Studio and lighting (phase 4 of the roadmap) before
anything else. **If gate 3 fails:** the rig/motion approach needs rework before scaling; stop and review.

## Folder layout during the pilot
```
engine/
  spec/        SceneSpec v2 schema, units, ledger, compiler, validators
  passport/    character ingestion, rig, IK, fingerprints
  motion/      foundry pipeline, clip format, blending, contacts
  physics/     rapier bake, buoyancy, heightfield, particles, tests
  render/      PixiJS layers, water shader, lighting, grade (inside Remotion)
  plates/      depth split, layer fill, parallax camera
  qa/          programmatic checks, sampler, benchmark runner, scorecard
registry/      versioned characters, props, motions, plates (+ manifest.json)
pilot/         the-hit.scene.json, shot list, notes
runs/          one folder per render attempt: manifest, preview, defects (git-ignored)
```
The current `src/story/` engine keeps working unchanged until the pilot passes; then scenes migrate one by one.

## Your PC
- **On your PC:** rendering (Remotion + PixiJS on the GTX 1050 via Vulkan), physics baking, pose extraction,
  depth split, QA.
- **In the cloud:** image and video generation (ChatGPT, Google Flow, Kling or Veo); optional style-model training
  later. The GTX 1050's 4 GB cannot run these.
- **Disk:** C: has about 14 GB free. Keep Node, model and render caches on D:.

## Risks
| Risk | Mitigation |
|---|---|
| Generated character sheets aren't separable into clean parts | Strict sheet spec; ask for a paper-doll layout; manual cleanup of the first two characters |
| Pose extraction is noisy on phone video | Film side-on, good light, plain background; filtering + contact locks; keyframe fallback |
| Rapier determinism differs across machines | Deterministic build, fixed step, bake once and store tracks; render only from tracks |
| WebGL memory on 4 GB | Texture atlases, plates ≤ 4096 px, one PixiJS app per frame render |
| Scope creep toward the platform | Platform work starts only after the go decision |
