# Roadmap after the pilot

Phases follow plan v1.0's dependency order, with v2 additions. Each phase ends at its gate; nothing is automated
before the thing it automates is good.

| Phase | Deliverable | Gate |
|---|---|---|
| **0. Pilot** | `02-pilot-plan.md`: "The Drawdown → The Hit" (30 s) on the v2 engine | Pilot go decision |
| **1. Baseline extraction** | Migrate The Quiet Coast parts 1–3 to SceneSpec v2 data; versioned characters, props, plates, motions; baseline metrics | Re-renders from pinned inputs with no scene-code edits |
| **2. Engine breadth** | Motion library to ~20 clips; full Prop Registry; collapse/fracture; camera shot grammar; audio layer with stems | Benchmark suite passes all programmatic thresholds |
| **3. AI director** | Capability registry; story → beats → shots → SceneSpec; voice timing before motion planning; continuity ledger enforced | A new story inside the supported capabilities produces a valid, coherent preview first time |
| **4. Looks** | Plate Studio at full scale (style model in the cloud); hero plates; lighting and grade presets per mood | Blind comparison vs Kling: looks at least comparable in ≥ 60% of pairs |
| **5. QA and repair loop** | Visual AI review; automatic bounded repair (budget 3); keep best candidate | Seeded defects found; repairs stay local; spend limits enforced |
| **6. Learning memory** | Feedback records; approved-example retrieval (files, then database); benchmark-gated promotion and rollback | Unseen comparable scenes need fewer corrections; no regression |
| **7. Platform** | v1.0 platform: Next.js editor, NestJS API, BullMQ + Redis, PostgreSQL (+ pgvector), object storage, render workers | Restarts resume safely; idempotent provider calls; cost per accepted second tracked |

## Current code → v2 modules

| Today (`src/`, `scripts/`) | Becomes |
|---|---|
| `story/schema.ts` (continuity checks), `timeline.ts`, `captions.ts` | `engine/spec` (SceneSpec v2, ledger, captions) |
| `story/world/geo.ts`, `World.tsx` (terrain, town, tower, water surface) | `engine/physics` (heightfield, surge) + `engine/render` (layers) |
| `story/world/Vista.tsx`, `look.ts` | `engine/plates` (replaced by generated plates + grade presets) |
| `story/world/Props.tsx`, debris in `World.tsx` | `registry/props` + `engine/physics` rigid bodies |
| `story/Cast.tsx`, `rig/pose.ts` (9-angle figures) | `engine/passport` (rigs from character sheets, IK) |
| `story/scenes/p*.tsx` (hand-coded scenes) | `pilot/*.scene.json` and migrated SceneSpec files |
| `scripts/story-voice.ts` | kept: voice + alignment (adds takes and emotion tags) |
| `scripts/story-check.ts` | `engine/qa` (pacing + programmatic checks) |
| `scripts/story-render.ts`, `StoryVideo.tsx` | `engine/render` entry + overlays (captions, slams, clocks, cards) |

## Defer (from v1.0, still valid)
Custom model training, more than one physics engine, a microservice fleet, full fluid simulation, unrestricted
generated code. Add each only when a measured limitation justifies it.
