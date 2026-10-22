# Stickman story factory: writing stories in a Claude Code session

No `ANTHROPIC_API_KEY` is used. When the user asks for a story, a new series, or the next part, **you write the JSON yourself**
and feed it to `scripts/make.ts` with `--bible-file` / `--episode-file`. Never call `make --auto` or `--new` (those need the API).

## Rules for writing
Follow `EPISODE_SYSTEM`, `SERIES_SYSTEM` and the vocabulary in `scripts/lib/prompts.ts`, and validate against `src/episode/schema.ts`.
Examples: `fixtures/demo/bible.json`, `fixtures/demo/part-1.json`.
Key limits: 14-26 lines of 2-6 words (110-160 words total), 4-8 shots, at most one `impact`, at most 2 slams, original characters only, 13+.
Check `ls series/` and read the existing bibles first so a new series does not repeat an existing premise.

## Workflow
1. **New series:** write the bible to `scratch/<slug>-bible.json` (SeriesSchema), then write part 1 to `scratch/<slug>-part-1.json`.
   Run: `npm run make -- --bible-file scratch/<slug>-bible.json --episode-file scratch/<slug>-part-1.json [--dry] [--scale 0.5]`
2. **Next part:** read `series/<slug>/bible.json` and the earlier `part-N.json` summaries, then pick up exactly where the cliffhanger ended.
   Run: `npm run make -- --series <slug> --episode-file scratch/<slug>-part-N.json`
3. Use `--dry` when ElevenLabs keys are absent (otherwise it also falls back to a silent preview). Use `--scale 0.5` for fast drafts.
4. If validation fails, the error lists the exact problems; fix the JSON and rerun. A part is only committed after the video renders.
5. Report the one-line JSON from stdout: title, caption and the video path (`out/<series>/part-N.mp4`).

`ffmpeg`/`ffprobe` must be on PATH (installed via winget; reopen the terminal if missing).

## Scripted (directed) stories: `story/<slug>/`
Hand-directed series such as The Quiet Coast do **not** use the generic episode vocabulary above.
- `spec.md` is the source of truth; `adaptation.md` maps it onto the code. Never change the story without updating them.
- `part-N.json`: lines (id, text, speaker narrator|desk, optional `pauseAfter`; `|` forces a caption break) and the
  locked scene list with continuity state (`src/story/schema.ts` validates it). A part with `recorded` is never re-voiced.
- `npx tsx --env-file=.env scripts/story-voice.ts story/<slug>/part-N.json` voices it (cached in `.cache/tts`) and writes `part-N.timing.json`.
- `npx tsx scripts/story-check.ts story/<slug>` validates continuity and writes `pacing.md` (scene lengths vs targets, SOS fit, captions).
- `npx tsx scripts/story-animatic.ts story/<slug>` renders review animatics to `out/<slug>/animatic-part-N.mp4`.
Workflow gate: script → animatic → user review → build scenes → render. Do not skip the review.
