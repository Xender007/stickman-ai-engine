# Milestone 0: style and technical baseline

Date: 2026-10-23. Plan: `docs/AI-STICKMAN-ENGINE-PLAN-v3.md` (v3.1), section 14.0. Read `RULES.md` first.

**Status: code gates met. Three items wait on you or on a running install (marked below).**

## Why this milestone exists

The plan proposes Three.js, Rapier, a world model and numeric quality gates on a 4 GB GPU. Before building characters or
water on top of that, this milestone proves the foundations hold: the stack runs on the GTX 1050, frames render
identically in any order, physics bakes are deterministic, the scene contract rejects bad scenes, and the quality
thresholds are tested against the existing Quiet Coast output instead of being guesses.

## What was built

| Item | Where | What and why |
|---|---|---|
| Workspaces | root `package.json` (`workspaces`), `tsconfig.json` | `packages/*` and `apps/*` beside the untouched legacy `src/`. `allowImportingTsExtensions` so packages import `.ts` files directly (no build step). |
| SceneSpec v3 | `packages/contracts/src/scenespec.ts` | Zod schema from plan section 9. Beyond structure it enforces: shots tile `[0, durationFrames)` with no gap or overlap, actors are declared entities, entity ids unique, every entity has an asset or passport, and `rigidStepSeconds` divides one frame (so bakes land on frames). |
| Lanes, hashing | `contracts/src/lanes.ts`, `hash.ts` | Depth lanes hero/near/mid/far with fixed Z. `stateHash` = canonical JSON (sorted keys, 9-decimal rounding) then SHA-256, the equality test for bakes. `hash.ts` is Node-only (rule R13). |
| Two clocks | `packages/world/src/clocks.ts` | `WorldClock` maps edit frames to story seconds in segments with a rate; jumps (three days later) are detected. `storyTime(frame)` is a pure function of the frame. |
| Persistent ledger | `world/src/ledger.ts` | Entities never spawn from nothing; damage only gets worse (needs an explicit repair event); every change needs a cause; wetness is 0..1. |
| Capability registry | `world/src/capabilities.ts`, `registry.seed.ts` | Capabilities carry status, limits, evidence. Final renders refuse anything not `validated`; previews allow it. Seed has 3 validated (rigid lane bake, frame-pure render, caption chunking) and 4 planned. |
| Quality checks | `packages/quality/src/` | All thresholds from plan 12.1 as data (`thresholds.ts`) and checks for contact drift, scale, jitter, stranding, captions (safe zone, contrast, duration, overlap), loudness, reproducibility. |
| Deterministic physics | `packages/physics/src/rapier.ts` | Rapier 3D bake with bodies locked to a lane (Z translation off; rotation about Z only), fixed 1/120 s step, explicit creation order, output as per-frame tracks. |
| Reused pipeline | `packages/audio/src/index.ts` | Thin re-exports of the legacy caption, SOS and timeline modules (rule R3). A test proves the packaged `chunkLine` reproduces every committed caption of Quiet Coast parts 1 to 3. |
| 2.5D test scene | `apps/video/src/{Lanes,Root,index}.tsx` | Remotion composition `Lanes25D` using `@remotion/three`: far and mid skylines, ground, a Rapier-baked crate (hero lane), a walking cutout figure, a rising water volume in the near lane, a dollying camera for parallax. It is a probe, not final art. |
| CLI | `apps/engine-cli/src/cli.ts` | `npm run engine -- validate <scene.json> [--preview]` and `capabilities`. Exit 0 ok, 1 invalid, 2 capability gaps. |
| Sample scene | `pilot/harbor-retreat-detail.scene.json` | The plan's example, validating against SceneSpec v3. |
| Benchmarks | `benchmarks/lanes-shuffle.mts`, `render-baseline.mts`, `calibrate.mts`, `calibration.json` | Shuffle determinism test, render timing with GPU-memory sampling, threshold calibration. |
| Style bible | `docs/style-bible.md` | **Draft**, derived from the palette and rig the current engine uses. |

Dependencies added (exact versions): `three@0.170.0`, `@remotion/three@4.0.537`, `@dimforge/rapier3d-compat@0.14.0`, `@types/three@0.170.0`.

## Gate results (rerun commands)

| Gate | Command | Result |
|---|---|---|
| Unit tests | `npm run test:engine` | 24 pass, 0 fail |
| Legacy tests and typecheck | `npm test` | 7 pass; `tsc --noEmit` clean |
| Scene validates | `npm run engine -- validate pilot/harbor-retreat-detail.scene.json --preview` | exit 0, hash `b1e1bb23ac3ccfd9`; without `--preview` exit 2 with two named gaps (as designed) |
| Shuffled frames identical (GTX 1050, Vulkan) | `npx tsx benchmarks/lanes-shuffle.mts` | 8 frames, 0 mismatches, about 1.4 s per still |
| Physics determinism | in the unit tests | 100 bodies, 150 frames: identical hash on two runs (hash for the benchmark crate: `a20a7d14009e1911`) |
| Render and memory baseline | `npx tsx benchmarks/render-baseline.mts vulkan` | 90 frames in 45 s including bundling (the earlier 150-frame software/GPU probe measured 0.11 s per frame without bundling); peak GPU memory 490 MiB of 4096 MiB |

## Calibration findings (benchmarks/calibration.json)

Today's Quiet Coast output run through the new checks. **No threshold was changed**: the checks fail known-bad values and pass good ones.

1. **Scale: person is 23% too large for the floor height** (0.717 person:floor vs 0.583 real; limit 15%). Consistent with the earlier "buildings feel small" feedback. New assets must be built in metres at the real ratio.
2. **True peak overshoots in parts 1 and 3** (−0.8 and −0.7 dBTP; limit −1). Part 2 is exactly −1.0. Cause: mastering targets −1 dBTP, then the AAC encode adds overshoot. Fix when the audio package is next touched: master to −1.5 dBTP. Loudness (−14.3 / −14.8 / −14.5 LUFS) is inside ±1 of −14.
3. Captions: none under 0.6 s; the shortest is 0.66 s (part 2), so that limit is tight but met. Median caption is 1.5 to 2.0 s.

The legacy engine was not changed to fix these (rule R3). They are recorded as targets the new engine must beat.

## Not done, and why

- **Item 1, environment:** Python 3.11, Blender and Krita were started with winget into `D:\tools\...`. At the time of writing the Python installer was still running; check `python --version` and the Blender and Krita folders. Nothing in Milestones 0 to 2 needs them to run.
- **Item 9, style bible:** draft only. It needs the art director's approval (rule R7). Three example frames follow in Milestone 1, because they need the new character.
- **Item 10, first approved character and prop:** Milestone 1 builds the first character and prop in code (vector rig). They stay `draft` until you approve them.
- The old 150-frame GPU probe composition used in the earlier measurement was a throwaway and is not in the repo; `render-baseline.mts` and `lanes-shuffle.mts` replace it. The Three.js scene is light (490 MiB), so the real 4 GB test happens with plates and textures from Milestone 2.
- The test scene looks plain. That is deliberate; looks come with assets and the style bible.

## Decisions taken (and why)

- **Re-export, don't move, the legacy pipeline.** Moving files would break the Quiet Coast pipeline for no gain now.
- **Bake in Node, render from tracks.** Rapier WASM stays out of the webpack bundle; this is also the "bake once" principle of the plan.
- **Capabilities default to `planned`.** The registry is honest from day one, so the final-render gate means something.

## Next: Milestone 1 (character and object slice)

Walk/stop, pick up and release, one prop, ground contact and shadows, in a short clip. See `milestone-1.md` when it exists.
