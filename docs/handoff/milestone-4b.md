# Milestone 4b: the reference shot (look upgrade)

Date: 2026-10-23. Read `RULES.md`, `milestone-4.md` and `docs/style-bible.md` (section 0) first.

**Status: programmatic gates met. Looks are better but still behind the target; your review decides what is next.**

## Why this exists

You compared our pilot with a clip another engine generated from your 10 s prompt (now kept as the quality bar at
`docs/reference/target-look-harbor-stairs.mp4`) and found ours far behind on looks. You asked for realistic and best look, and
then: "keep this video as your target perfection. I want all videos with same animation quality." This milestone rebuilds
**the same prompt** in our engine so the two can be compared shot for shot, and raises our look toward that bar while keeping
what the other engine gets wrong (floating feet, a crate that swaps sides, eyes on a faceless figure) out of ours.

## What was built

| Piece | Where | What and why |
|---|---|---|
| SVG shot renderer | `apps/video/src/shot/HarborShot.tsx`, `cam.ts` | A small depth-sorted polygon renderer: every world point is projected through a pitched perspective camera into SVG. Flat outlined colours, gradients, blend modes and glows suit the target's look better than the Three.js toon scenes. |
| The set | same, `packages/environment/src/shot-terrain.ts` | The street recedes from the camera like the reference: quay wall along the left with stone courses and freeing ports (scuppers), a row of buildings with gables, chimneys and lit windows closing the far end, a building line on the right, dusk sky with soft cloud banks, the sea to the horizon, hills, a lamp with a light cone and a warm pool, a steel gantry with stringers, treads, nosings, cross bracing and rails, a centre line and a drain cover. |
| Water across the street | same | The 1D solver's depth is drawn across the street's width as depth slabs interleaved with the objects (so the sedan is submerged to the right height), with foam edges where water meets dry road, drifting foam lace (denser near the camera), sky-tinted far water, a white bore roll at the leading edge. |
| Quay effects | same | A tall splash column when the bore hits the wall (timed from the field), an overtopping sheet with streaks and splashes while the sea is above the wall top, streams back through the scuppers during the drain. |
| Puddles and wet road | same | Organic puddle shapes in the low spots sized by the water the solver keeps there, with sky sheen and the lamp's reflection; the road stays darker and glossy where water stood recently. |
| 3D stick rig | `packages/motion/src/rig3.ts` | Joints in 3D, two-bone IK with a pole, yaw for hips and chest separately. The prompt needs **visible** turns with no cut ("turns his torso toward the sea", "turns to face the sea"); the projection foreshortens the limbs correctly while every bone keeps its length. |
| The shot clip | `packages/motion/src/shot.ts` | Walk with the crate, stop near 2 s, torso twist toward the sea and back with feet planted, 12 steps one per footfall, onto the landing near 7 s, a 0.9 s turn with two pivot steps, breathing on the edit clock. |
| Flood for the shot | `bakeField` in `harbor-field.ts` | The solver generalised to any terrain. Surge 1.4 m: the sea tops the 0.9 m wall, about 0.5 to 0.6 m reaches the sedan (door sills), the foot of the stairs floods, then the street drains to the sea and the low spots keep puddles. |
| Debris against fixed things | `float-bake.ts` | Lanes, static obstacles (wall, gantry posts) and collisions with them; the log is lifted, carried uphill, knocks the gantry post, then the backflow strands it in the kerb puddle. |
| Hardness | `envtimeline.ts` | Damage now depends on what is hit (a steel gantry or a stone wall is 25 to 60 times harder than a car), so a log knock does not "dent" the gantry. |
| Two clocks in one shot | `shotfixture.ts` | Real time for 8.8 s, then the drain compressed into 0.9 s (a street really takes about a minute), then a 0.3 s hold; Ravi's breathing uses the edit clock so it reads naturally during the compression. |
| Tests | `shot.test.ts`, `shotscene.test.ts` | The prompt's beats as checks: one locked 10 s shot, slam at 2 to 3.5 s over the parapet, stop near 2 s, torso turn with planted feet, landing near 7 s, a visible turn of at least 15 frames, door-sill depth at the car, flooded stair foot, safety, the log's knock and stranding, the sedan planted and undamaged, drained street with puddles, determinism, 3D bone lengths, feet on treads, hands on the crate through both turns. |

## Gate results

| Gate | Command | Result |
|---|---|---|
| All engine tests | `npm run test:engine` | 124 pass, 0 fail (17 of them new for this shot) |
| Legacy tests | `npm test` | 7 pass |
| The prompt's beats | `shotscene.test.ts` | one locked 10 s shot; slam at edit 2.2 s, sea 1.37 m over a 0.9 m wall; stop near 2 s; torso turn with feet planted; landing at 6.7 s; a visible turn over 21 frames (0.9 s, 7.6 to 8.5 s); 0.47 to 0.60 m at the sedan; foot of the stairs flooded; log knocks the gantry at 5.4 s and strands in the kerb puddle; sedan planted and undamaged; street drained with puddles in both dips; deterministic |
| Safety | same | depth x velocity at the feet never above 0.6 m^2/s; never more than 5 cm over a foot |
| Character | `shot.test.ts` | 3D bone lengths constant to 1e-9 through both turns; planted feet fixed in x, y and z and on the tread surface; legs and arms never at full stretch; knees bend forward; both hands on the crate through both turns; no 5-sigma spikes; yaw never jumps |
| Frame consistency (rule R8d) | `npx tsx apps/engine-cli/src/shot.mts sequence` | 15 gate frames, two chunkings and isolated stills: worst PSNR 95.8 dB, 0 pixels over 8 levels (limits 60 dB, 200 pixels) |
| Negative control | planted a render counter that nudges the lamp each render | the gate failed on 14 of 15 frames (PSNR down to 34.7 dB, up to 51,712 bad pixels); leak removed afterwards |
| Shuffled stills | `shot.mts shuffle` | 15 frames, bit-identical |
| Earlier scenes unchanged | `pilot`, `flood`, `harbor`, `carry` `.mts sequence` | bit-identical (WebGL scenes, rule R8b) |
| Render time | `shot.mts video` | 300 frames in 17 s on the GTX 1050 |

### Why the 2D renderer is not bit-identical (and what the gate checks instead)

Chrome rasterises SVG through its 2D path renderer, which draws small shapes via a coverage atlas whose layout depends on what
the tab drew before; a still and a sequence also capture DOM colours through paths that round by one level. Measured: one level
on most frames, and up to 16 pixels over 8 levels on spray droplets, with identical content. Gradients, a blur filter and a blend
mode were removed on the way (they made it worse); CPU rasterisation did not help. Rule R8d therefore gates this renderer on
the exact state hash plus measured frame similarity, and the negative control shows it still catches a real frame-order leak.

## Bugs found and fixed along the way

1. **The sedan looked sunk to its roof.** The painter's order used the car's centre; water slabs behind its camera-facing side were painted over it. Sorting by the side that faces the camera fixed it (the depth there is about 0.6 m, at the door sills, as the prompt asks).
2. **The log hung on the parapet** when it started in the sea (realistic, but not the prompt's beat). It now starts as driftwood on the street and the surge picks it up.
3. **A static collision named something that is not an entity** (`gantry_post_foot`); the ledger refused it. Posts are now named as parts of the gantry entity.
4. **Turns were too fast** (0.27 rad per frame); retimed to 0.45 s for the look and 0.9 s for the landing turn.
5. **The trailing foot sat 5.2 cm in water** once the stairs moved closer to the sea; the look was shortened by 0.15 s (still inside the prompt's window) instead of loosening the 5 cm bound.

## Honest differences from your prompt

- The quay wall is drawn 0.9 m high, but the 1D solver treats it as permeable at street level (freeing ports), because a 1D transect cannot route water through gaps in a wall and the prompt needs the street to drain back to the sea. Overtopping is drawn when the sea surface is above the wall top.
- The drain is compressed (about 45 s of story into 0.9 s of video). Physically a street does not drain in 3 s.
- The water reaches the stairs about a second earlier than the prompt's "near the eighth step"; the timing comes from the solver, not from the prompt.

## Where we still fall short of the target (my own comparison)

See the side-by-side `out/engine/compare-target.mp4`. Behind: hand-painted texture (the reference has brushy gradients and grain everywhere), richer cloud forms, the sea's swell and waves behind the wall, the massiveness of the splash column, water flowing over and around the car's body, and the figure's line quality. Ahead: feet on every tread, a crate that never changes, no face as specified, the log knocking the post, puddles where the water really stays, a determinism gate.

## Next

Bring the same renderer to the other scenes (the pilot, the flood), add paper/grain texture and brush gradients, and a second
character design pass with you.

## Update 2026-10-24: the hybrid route (your decision)

After the side-by-side you said the animation was still not close and the reference is super realistic. A code-drawn renderer
will not reach an AI video model's painted look in reasonable time, so you chose the **hybrid route**: our engine renders a
physically correct *guide* video, and an AI video model restyles it into the reference look (video-to-video). You chose **not**
to spend credits on the connected ViewMax/Everygen service; you will run the restyle in your own generator.

Done for that:
- **Framing matched to the reference** (the restyle keeps our framing): car, lamp and stairs packed like the reference
  (`SHOT_LAYOUT` and `SHOT_STAIRS` in `packages/environment/src/shot-terrain.ts`, one source for physics, tests and drawing),
  camera closer. Ravi now starts at x = 2.8 so the beats still fit the prompt (stop 1.9 s, look 1.9 to 2.8 s with the slam at
  2.2 s inside it, landing 6.3 s, turn 7.3 to 8.2 s) and his feet stay dry when the water reaches the moved stairs.
- **Restyle kit** in `out/restyle-kit/`: the guide at 30 and 24 fps (720 x 1280), first and last frames, three style frames
  from your reference, a structure-locking prompt, a negative prompt, and settings notes (`README.md`).
- **Check-back tool**: `npx tsx apps/engine-cli/src/restyle-check.mts <restyled.mp4>` writes a side-by-side, an overlay of our
  guide's outlines on the restyled video, and a contact sheet, so drift (feet, crate, car, water timing) can be checked frame by frame.
- Gates after the change: 124 engine tests and 7 legacy tests pass; the shot's frame-consistency gate passes (worst PSNR 98.9 dB,
  0 pixels over 8 levels); the vignette was removed (its stepped edges were visible).

Waiting on you: the restyled video from your tool.
