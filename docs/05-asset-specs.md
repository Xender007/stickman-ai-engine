# Asset specifications (what to generate, and how)

These are the inputs you create with ChatGPT, Google Flow, Kling or Veo. Keep every source file and record the tool,
prompt and date in `registry/<asset>/source.md` (licensing and reproducibility).

## Character turnaround sheet (Ravi, Mia)
- **Layout:** one image, plain light-grey background, four views in a row: front, three-quarter, side (facing right),
  back. Same scale and same ground line in every view.
- **Pose:** relaxed A-pose, arms slightly away from the body, legs apart, so no limb overlaps the torso.
- **Style:** flat 2D, uniform medium outline, no gradients, no cast shadows, no texture. Stick-figure proportions with
  simple costume shapes. No detailed face.
- **Size:** at least 2048 px wide; the character at least 800 px tall per view.
- **Paper-doll sheet (second image):** the same character with each part drawn separately with gaps between them: head,
  torso, upper arm, forearm, hand, thigh, shin, foot (left and right), and costume overlays (apron, raincoat).
- **Identity anchors:** Ravi has a pale bakery apron over a dark shirt, a torn apron corner and a scraped right sleeve
  (wet/torn variant as a second sheet). Mia is about 10, in a yellow raincoat with a ponytail and a flashlight.

Prompt template:
> Flat 2D cartoon character turnaround sheet of [description], minimalist stick-figure proportions, uniform medium
> outline, flat colours, no gradients, no shadows, plain light grey background, four views (front, three-quarter,
> side facing right, back) on the same ground line, A-pose with arms slightly away from the body, simple face, high
> resolution.

## Props (car, plank, roof section, crate, log, door raft, helicopter)
- One sheet per prop: intact plus damaged states (dented, broken, wreck) in side view, same scale, plain background.
- State the real-world size in the prompt (e.g. "a 4.5 m sedan").

## Drawdown sets (stranded after the sea retreats)
Each item must be a **clear, isolated 2D object**: side view, flat style matching the characters, plain light-grey
background, nothing overlapping, the same lighting direction (light from upper left) across every sheet.

| Set | Items | Variants per item |
|---|---|---|
| Stranded fish | 3 species (silver sardine-type 0.3 m, larger grey fish 0.6 m, flat fish 0.4 m) | wet body; plus a 4-part paper-doll (head, body, tail, fin) so it can flop |
| Rocks | 5 sizes from 0.3 m to 2 m | dry, wet (darker, glossy edge), with seaweed |
| Wrecked cars | sedan, hatchback, pickup, small van | dented, smashed glass, flipped, half-buried in mud |
| Boats aground | small fishing boat, rowboat | upright on keel, tipped on its side |
| Flood debris | planks, roof sheets, tyres, crates, doors, logs, branches, fishing nets, plastic crates | intact, broken, muddy |
| Seabed dressing | seaweed clumps, shells, mud ridges, small puddle shapes | wet, drying |

Prompt template:
> Flat 2D cartoon game asset sheet, side view, [item list with real sizes], minimalist style with uniform medium
> outline and flat colours, wet and muddy after a flood, each object isolated with space around it, plain light grey
> background, light from upper left, no text, no shadows on the background, high resolution.

Also needed: one **exposed harbor floor plate** (wet mud, old shoreline line, distant retreating sea, boats and
debris *not* included; the engine places those) to the background-plate spec below.

## Background plates
- 9:16, at least 2048 px tall (4096 preferred), matching the shot list I provide per scene.
- **Style lock:** reuse the same reference images and style description for every plate; generate in a batch.
- **No characters** in plates. Leave the water band and the area where characters stand clear and readable.
- Depth separation helps: ask for "clear foreground, midground and background layers".

Prompt template:
> Stylised 2D painted background, [scene description], [time of day and weather], vertical 9:16 composition,
> layered depth (foreground, midground, far skyline), no people, cohesive palette of [palette], soft painterly
> texture, high detail, cinematic lighting.

## Hero effect plates (optional)
- 3–6 s clips of the wave rising / crashing / spray, on a dark or plain background, camera locked, no characters,
  9:16, 1080×1920 or larger.

## Motion reference videos (optional but highest value)
- Phone at hip height, **side-on**, whole body in frame, plain wall, good light, 30 or 60 fps, 3–8 s per clip.
- Clips: idle, walk, run and stop, stairs up (or a step box), carry a backpack on your back (stand-in for Mia),
  shield-crouch, stand up, look back, raise a flashlight, wave both arms.
- One take per action is enough; I extract the poses on your PC.
