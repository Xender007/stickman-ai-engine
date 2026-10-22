# AI Stickman Engine: docs

Goal: an engine that turns a story into stick-figure animation able to compete with Higgsfield, Kling and Seedance,
winning on consistent characters, realistic motion, correct physics, clear objects and exact control.

**Start here: [AI-STICKMAN-ENGINE-PLAN-v3.md](AI-STICKMAN-ENGINE-PLAN-v3.md)**, the current plan (v3.1): Three.js in constrained
2.5D, a two-clock world model, a capability registry, an in-repo flood solver, numeric quality gates, reuse of the
current pipeline and the Milestone 0 checklist. The v2 documents below are kept for reference; where they disagree
(PixiJS, the 7-week pilot schedule), v3.1 wins.

| Doc | What it is |
|---|---|
| [AI-STICKMAN-ENGINE-PLAN-v3.md](AI-STICKMAN-ENGINE-PLAN-v3.md) | **Current plan (v3.1).** Architecture, world model, assets and art direction, physics and water, SceneSpec v3, quality gates, milestones 0–8, repository layout and reuse map, pilot machine setup, review score |
| [FINAL-PLAN.md](FINAL-PLAN.md) | v2 plan (superseded by v3.1): goal and positioning, architecture, engine design (units, SceneSpec v2, continuity ledger, Character Passport, Prop & Debris Registry, physics tiers incl. drawdown and stranding, Motion Foundry, Plate Studio, render, sound), quality and competitive benchmark, pilot, roadmap, operations, hardware, risks |
| [00-plan-review.md](00-plan-review.md) | Review of the v1.0 PDF plan: strengths, gaps, reality check vs Kling (why v2 exists) |
| [01-architecture-v2.md](01-architecture-v2.md) | v2 engine design in more detail |
| [02-pilot-plan.md](02-pilot-plan.md) | **Pilot:** "The Drawdown → The Hit", 30 s, about 7 weeks, weekly plan, gates, go/no-go |
| [03-roadmap.md](03-roadmap.md) | Phases after the pilot; mapping from the current code to v2 modules |
| [04-quality-scorecard.md](04-quality-scorecard.md) | Area scores, programmatic thresholds, benchmark suite, competitive benchmark |
| [05-asset-specs.md](05-asset-specs.md) | What to generate: character sheets, props, drawdown sets (fish, rocks, wrecked cars, boats, debris), plates, hero clips, motion references |

**Status (23 Oct 2026):** the current engine (`src/story`) renders The Quiet Coast parts 1–3 on the GPU. Milestone 0
of v3.1 has not started; the new engine will run alongside the current one as npm workspaces (`apps/`, `packages/`).
