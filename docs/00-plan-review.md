# Review of "AI Stickman Engine — Architecture & Implementation Plan" v1.0 (23 Oct 2026)

**Verdict:** the plan is a sound engineering skeleton (deterministic rendering, versioned assets, bounded repair,
benchmark-gated learning). It is **not yet a plan to beat Kling on looks, physics or character consistency**: those
three goals have no concrete mechanism in it. It also front-loads platform infrastructure that adds no visual quality.
Version 2 (`01-architecture-v2.md`) keeps the skeleton and adds the missing engines; the pilot (`02-pilot-plan.md`) proves
them on one 20-second scene before any platform work.

## How well v1.0 covers each goal

| Area | v1.0 | Why |
|---|---|---|
| Deterministic rendering | **9/10** | Frame as the time unit, baked physics, seeded randomness, paused tickers, shuffled-frame test. Exactly right. |
| Scene contracts | **8/10** | Zod-validated SceneSpec with pinned asset versions. Missing: real-world units, a continuity state ledger, shot grammar. |
| Quality gate and repair | **8/10** | Defect records with frame ranges, smallest-patch repair, attempt budget, no AI score as sole gate. Needs numeric thresholds. |
| Learning loop | **7/10** | Separating diagnostics from approved knowledge and promotion with rollback is excellent. pgvector is premature. |
| Character consistency | **5/10** | "Rigs and turnarounds" are named, but there is no ingestion path from generated art to a rig and no identity check at render time. |
| Objects and props | **4/10** | "Damaged prop variants" only. No physical metadata, scale contract, waterline behaviour or damage states. |
| Physics | **5/10** | Rapier 2D with buoyancy is the right core, but "god-like" physics needs a water model, spray/foam, collapse and verification tests. Defers fluid entirely. |
| Motion authoring | **3/10** | "Five motion clips" but no method to create them: video-to-pose, retargeting, cleanup and contact annotation are absent. Motion is today's weakest area (about 3/10). |
| Visual richness vs Kling | **2/10** | No plan for painted backgrounds, lighting, colour grade or hybrid generated plates. Code-drawn art alone will not reach generative-model looks. |
| Audio | **2/10** | Only "sound-effect cues". No effects library, music stems, ducking or voice direction. Audio carries much of the perceived quality in shorts. |
| Feasibility on your hardware | **3/10** | Not addressed. GTX 1050 (4 GB) renders 2D WebGL well but cannot run image/video models or training locally. |
| Build order for one person | **4/10** | Next.js + NestJS + BullMQ + Redis + PostgreSQL + object storage before the engine proves itself is months of plumbing with zero visual gain. |

## What v1.0 gets right (keep all of this)
1. AI director produces **data**, never code; the engine executes it. Generated code never reaches production unreviewed.
2. Frames are canonical; physics is **baked** to tracks before parallel rendering.
3. Every attempt records inputs, versions, seed, cost and decision; failures are diagnostics, not lessons.
4. Improvements are promoted only after a fixed benchmark plus unseen variations; rollback is always possible.
5. Defer custom model training, many physics engines, microservices and free-form generated code.

## Gaps and the fix for each (detailed in v2)

| # | Gap | Fix in v2 |
|---|---|---|
| 1 | No world units | **Metres are canonical.** A person is 1.7 m and a floor is 3.2 m. A scale validator fails any scene where doors, cars or floors contradict people. This bug really happened: our figures were four floors tall until fixed. |
| 2 | No continuity model | A **World State Ledger** (time of day, water level, damage, costume, injuries, prop ownership) with monotonic rules, validated across scenes and parts. A small version already exists in `src/story/schema.ts`. |
| 3 | No path from generated art to a rig | **Character Passport**: turnaround sheet → part segmentation → joint/pivot annotation → rig → identity fingerprint (limb ratios, palette, silhouette) checked on rendered frames. |
| 4 | Props are pictures, not objects | **Prop Registry**: each prop has size in metres, mass, density (buoyancy), collision shape, attach points, damage states (intact, broken, wreck), waterline behaviour and sprite layers. |
| 5 | Physics is one sentence | **Four physics tiers**: rigid bodies (Rapier, deterministic build); a water heightfield with obstacles; baked spray/foam particles; generated hero plates. Each has verification tests (buoyancy equilibrium, no tunnelling, energy decay, wave speed). |
| 6 | No motion-creation pipeline | **Motion Foundry**: acted reference video → 2D pose (runs on CPU) → retarget to the rig → foot/hand contact annotation → filtering → clip registry with blend tags. |
| 7 | Looks cannot compete | **Hybrid plates**: style-locked generated backgrounds split into depth layers; generated hero water clips matted and composited. Code owns characters, props, physics, text and timing. |
| 8 | Audio missing | **Sound layer**: event-bound effects library, music stems with ducking, voice takes with emotion tags, loudness mastering. |
| 9 | Infra before value | **File-first pilot**: a CLI, JSON manifests and a local `runs/` folder. API, queue and databases come only after the engine passes its gates. |
| 10 | Gates are qualitative | Numeric thresholds in `04-quality-scorecard.md` (foot slide, scale, identity, jitter, sync, contrast, loudness, determinism). |

## Reality check: competing with Kling and Higgsfield on 2D stickman

| Where we can win | Where they lead (and how to close the gap) |
|---|---|
| The same character in every shot, every episode | Painterly textures and lighting → generated, style-locked plates + a WebGL lighting and grade pass |
| Physically correct, directable action (contact, buoyancy, scale) | Organic, subtle motion → a motion library acted by real people, plus secondary physics |
| Exact timing to voice, captions, warning text, countdowns | Natural fluid look → water shaders + generated hero water plates |
| Change one shot without regenerating everything; cost per iteration | Instant "type and get video" → AI director + capability registry (phase 3) |

"Perfect" and "god-like" are not testable, so v2 turns them into measured gates. The realistic target: **win on
consistency, control and physical correctness; reach parity on looks through hybrid plates.**
