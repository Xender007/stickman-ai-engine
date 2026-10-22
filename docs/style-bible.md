# Style bible (DRAFT v0.1, awaiting art director approval)

Status: **draft**. Derived from what the current engine already renders (`src/story/world/look.ts`, `src/rig/pose.ts`,
`src/story/StoryVideo.tsx`) so the new engine starts visually continuous with The Quiet Coast. Nothing here is approved
until the art director (the project owner) signs it off in this file's "Approval" section. Plan section 2.4.

## 1. Palette per mood (hex)

| Token | Night | Dawn | Morning (overcast) |
|---|---|---|---|
| sky top | `#060b1d` | `#2a1f45` | `#59606f` |
| sky bottom | `#1b284e` | `#df8a55` | `#bdb4a6` |
| far skyline | `#121a33` | `#3a2b4b` | `#6c717f` |
| town | `#18213d` | `#2a1e33` | `#3c404b` |
| lit window | `#f4c862` | `#f4c862` | `#f4d38a` |
| water | `#16232c` | `#241c33` | `#262a36` |
| water highlight | `#4d6478` | `#4b4566` | `#4f5a6e` |
| foam | `#c9d5e2` | `#eadccb` | `#efebe3` |
| mud | `#1b1712` | `#2b2119` | `#3b342b` |

Water ramp (shallow to deep): mix `water` with `#000000` at 0%, 25%, 45%. Floodwater is sediment-laden: no clear-water caustics
by default (plan section 8.3). Warning red `#ff2d2d`, signal amber `#ffb02e`, Mia's coat `#f2c230` (named, fixed).

## 2. Line and body

- Stick figure proportions in rig units (px at scale 1): torso 80, upper arm 44, forearm 42, thigh 58, shin 58, neck 9, head radius 27, stroke 12. Total standing height 259 units.
- Real-world mapping: 1.75 m adult = 259 units, so 1 m = 148 units at figure scale. Child (Mia, about 1.35 m) = 0.77 of the adult.
- Outline weight by depth lane: hero 100%, near 80%, mid 55%, far 0% (flat silhouette).
- Joint style: rounded caps and joins.

## 3. Light and depth

- One key light from upper left in every scene. Contact shadows are soft ellipses under hero-lane bodies only.
- Atmospheric depth: each lane further away mixes 18% toward the sky-bottom colour.
- Detail density: hero lane full detail; near lane simplified (no small parts); mid lane shapes and lit windows only; far lane flat silhouettes.

## 4. Overlay rules carried over from the current engine

- Slams: big, red (`#ff2d2d`), glow filter, at most 2 per part, centred around y 930 of 1920.
- Key caption lines coloured: warning red or signal amber; karaoke word highlight on the spoken word.
- Safe zone: x 90 to 990, y 220 to 1500 (1080 by 1920).
- Countdown and wave-clock panels: dark panel at y 690, hidden during slams.

## 5. Scale reference (a measured problem to fix)

Calibration on today's output (benchmarks/calibration.json): the figure is 93 px tall and one floor is 130 px, a person:floor
ratio of 0.72 against a real 0.58 (1.75 m person, 3.0 m floor): 23% too large, over the 15% tolerance. New-engine assets
must be built in metres and use the real ratio. For the same screen height of building, the figure shrinks to 0.58/0.72 = 81% of today's size.

## 6. Three approved example frames (to produce)

One wide, one medium, one close, rendered by the new engine from Milestone 1 onwards and approved by the art director
before any asset library expansion. Until then, the Quiet Coast frames from `out/the-quiet-coast/part-*.mp4` are the reference.

## Approval

- [ ] Art director approved palette
- [ ] Art director approved line and body rules
- [ ] Art director approved three example frames

Date and initials: _pending_
