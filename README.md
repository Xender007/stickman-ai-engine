# Stickman story factory (Remotion)

One command writes, voices, animates and renders the next episode of a serialized stick-figure story
(9:16, 1080×1920, 30 fps), and starts a new series when the current one is finished.

```
npm install
cp .env.example .env        # add ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, VOICE_ID
npm run make -- --auto      # → out/<series>/part-N.mp4 + part-N.post.json
```

## How it works
1. **Series bible** (Claude): title, hero, world, number of parts, one-line arc per part → `series/<slug>/bible.json`
2. **Episode** (Claude, structured tool output): narration lines + shot plan using a fixed visual vocabulary,
   validated with zod; invalid output is sent back to Claude with the exact errors (up to 2 retries).
   Previous parts' summaries are passed in for continuity.
3. **Voice** (ElevenLabs with timestamps): voiced in segments so there is real silence after the big impact;
   per-line timings become captions and drive every beat.
4. **Render** (Remotion): shots are composed from the library below; sound effects sit on the same event times as the picture.
5. **Master**: loudness normalised to −14 LUFS. `part-N.post.json` holds the title, caption and hashtags.
6. A part is committed (`series/<slug>/part-N.json`) only after the video exists, so a failed run is just retried.

## Commands
| | |
|---|---|
| `npm run make -- --auto` | next part of the oldest unfinished series, or a new series |
| `npm run make -- --new --idea "a lighthouse keeper" --parts 4` | start a series from an idea |
| `npm run make -- --series <slug>` | next part of a specific series |
| `--dry` / `--no-render` / `--scale 0.5` | no voice / story only / fast low-res render |
| `--bible-file f.json --episode-file f.json` | use hand-written JSON instead of Claude (see `fixtures/demo`) |
| `npm run studio` | preview the demo episode with a live timeline |
| `npm run stills -- --props series/<slug>/part-1.props.json 5 20` | review frames |
| `npm test` | unit tests + type-check |
| `npm run sfx` | regenerate placeholder sounds (Python 3 + numpy/scipy/soundfile) |

stdout of `make` is a single JSON line (`status`, `series`, `part`, `final`, `title`, `caption`, `video`),
logs go to stderr, exit code 1 on error — ready for cron or an n8n Execute Command node.

## Visual vocabulary (what stories can use)
Settings: city, forest, hill_tower, flood · Moods: night, dusk, storm, disaster, dawn ·
Actions: walk, stand, uneasy, run, dive, climb, cling · Threats: none, quake, collapse, fire, wave, storm ·
Cameras: track, wide, close · plus impact (white-out + silence), slam words, countdown, clock, end card.
Allowed combinations live in `src/episode/schema.ts`. To grow the library: add the value there, render it in
`src/episode/ShotView.tsx` (+ `hero.ts` for poses, `Sound.tsx` for audio), and the writer can use it immediately.

## Sound
`public/sfx/*.wav` are synthesized placeholders. Replace each with a library sound of the same name
(pad, rumble, roar, rain, crackle, siren, boom, crash, thunder, ring).

Fonts: Anton and Montserrat (SIL Open Font License, `public/fonts/`).
Remotion is free for individuals and companies of up to 3 people; larger companies need a company licence.
