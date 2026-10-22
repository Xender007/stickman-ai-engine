# Strict rules for the engine build (apply to every milestone)

These are binding on any session (human or AI) that continues the work. A rule changes only by editing this file with a
dated entry in the change log at the bottom, and only when the user asks for it.

## Process

- **R1. Handoff before "done".** A milestone is not finished until `docs/handoff/milestone-N.md` exists, states what was
  built and why, lists gate results with evidence, and lists what is NOT done. Read the previous handoff and this file first.
- **R2. Gates are evidence, not opinion.** Every exit condition in the plan (section 14) is checked by a command that can be
  rerun. Record the command and its output in the handoff. If a gate cannot be run, mark it **not met**, never "assumed".
- **R3. Legacy stays frozen.** `src/story/`, `src/episode/`, `src/components/`, `scripts/`, `story/` and `out/` keep
  working unchanged. New code re-exports from legacy; it never copies it, and never edits it, unless the user asks.
  Before finishing any milestone run `npm test`: it must pass. The Quiet Coast parts remain renderable.
- **R4. Tests first-class.** Every package has tests; `npm run test:engine` and `npx tsc --noEmit` pass before a handoff is written.
- **R5. Report faithfully.** Failing checks, skipped steps and known weak spots go in the handoff in plain words.
- **R6. No commit or push without the user's explicit request.** `.env` holds the ElevenLabs key and must never be committed;
  the GitHub repo is public. Commit messages end with the attribution line from the session's current system reminder.
- **R7. User decisions stay with the user.** The user is the art director. No asset, palette, style-bible section or
  hero frame is marked "approved" by the builder. Mark it `draft` and list it under "needs your review".

## Engineering

- **R8. Frame-pure rendering.** Anything in `apps/video` is a pure function of `(props, frame)`. No `Date.now`,
  `Math.random`, `useState`-driven animation, refs carrying state between frames, or timers. Randomness comes from a
  seeded generator. `benchmarks/lanes-shuffle.mts` must stay green (shuffled equals ordered).
- **R8b. Determinism gates must render sequentially.** Isolated stills each get a fresh page and hide state that leaks between frames inside one canvas. React Three Fiber applies the Canvas `camera` prop only once, so a camera driven by that prop freezes per worker chunk; use `CameraRig` (apps/video/src/CameraRig.tsx) for any per-frame camera. Never create Three.js geometry or materials per render: share them at module scope. The gate is `npx tsx apps/engine-cli/src/carry.mts sequence` (sequential PNG render vs isolated stills, bit-identical); it was shown to fail (14 of 15 frames) with the camera rig removed.
- **R9. Determinism of bakes.** Fixed step that divides one frame; fixed creation order; no random inputs; identical
  state hash on reruns. Anything stochastic takes a seed from the SceneSpec. Bakes are stored as tracks; render reads tracks.
- **R10. Units.** Metres, kilograms, seconds, radians; Y up; X/Z ground plane. Convert at the boundary only (legacy
  pixels to metres: 148 px = 1 m at figure scale, see `docs/style-bible.md`).
- **R11. Capability honesty.** A capability is `validated` only when its `evidence` lists a passing test or benchmark.
  Final renders refuse unvalidated capabilities (`npm run engine -- validate <scene>` exits 2). Previews may use them and are labelled.
- **R12. Thresholds.** The numbers in `packages/quality/src/thresholds.ts` change only with a benchmark run, an entry in
  `HISTORY`, and a line in the milestone handoff. Never loosen a threshold to make a failing shot pass; fix the shot.
- **R13. Node-only vs bundle-safe.** `apps/video` is bundled by webpack: it may import `@engine/contracts/src/lanes.ts`
  and `scenespec.ts` (zod) but never `hash.ts`, `node:*` modules, `@engine/physics` or Rapier. Bake in Node, pass tracks as props.
- **R14. Imports.** Cross-package imports use `@engine/<pkg>/src/<file>.ts` with the `.ts` extension. Benchmarks that use
  top-level `await` are `.mts`.
- **R15. Environment.** Caches, installs, bakes and renders go on D: (C: has about 15 GB). Render with the Vulkan backend
  (`remotion.config.ts`; `--gl=vulkan` in the Node API) so the GTX 1050 is used. ffmpeg is at
  `C:\Users\supro\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin`
  (prepend to PATH in a fresh shell).
- **R16. No Anthropic API.** Stories are written inside the session; never call `make --auto` / `--new`.
- **R17. Art provenance.** Every imported or generated asset records tool, prompt, date and licence in its registry entry.
  Rendering and baking never call an image generator.

## Change log

- 2026-10-23: created with Milestone 0.
- 2026-10-23: added R8b after Milestone 1 found a frozen-camera bug that isolated-still gates could not see.
