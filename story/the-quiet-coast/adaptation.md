# The Quiet Coast: how the spec maps onto the renderer

> **Current story (v3, user's outline, 2026-10-22) replaces Parts 2-3 of the spec.** Part 1 narration unchanged; its light now
> comes from Mia's flashlight on her apartment roof. Part 2 "The Girl on the Roof": Ravi recognises the SOS (coast-watch
> card), drops from the mast onto a drifting door, paddles by hand against a seaward current past a floating car, finds Mia
> (~10, yellow raincoat, flashlight + crank radio; her dad taught her the code), the radio warns of a bigger second wave in
> 20 minutes, the first wave's wet line reaches her roof's edge, only the harbor tower (14 floors) is taller, the sea starts
> pulling back (15:00). Part 3 "Fourteen Floors": they cross the drained, muddy streets, the main door is blocked, the outside
> fire stairs, the horizon turns white, he carries her the last floors, the wave hits as they reach the roof and stops two
> floors below, Mia flashes SOS and a rescue helicopter's searchlight blinks the same code back. Voices: Adam (narrator and
> Ravi's line), Jessica as Mia (MIA_VOICE_ID), Daniel for the radio. Warning text: SOS / 20 MINUTES! / 14 FLOORS / RUN! /
> floor numbers / HOLD ON! slams and a SECOND WAVE mm:ss clock. Sections below describe the earlier versions.

`spec.md` is the story's source of truth. This file records how it is implemented and every decision taken where the spec
left a choice or the measured audio disagreed with its plan.

## Data
| Spec | Implementation |
|---|---|
| Line IDs, narration and dialogue | `part-N.json` → `lines[]`: `id`, `text`, `speaker` (narrator / desk), desk `variant` (recorded / live), optional `pauseAfter` |
| Scene table | `part-N.json` → `scenes[]`: `id`, `fromLine`, `target` window, `location`, `timeOfDay`, `camera`, `beat`, `clues`, `transition` |
| `characterStartState`/`EndState`, `waterState`, `signalState` | `ravi` (clean → dusty → torn-wet), `mast` (intact → damaged → brace-failed), `water`, `signal` (off / sos / carried / answered) |
| `fromFrame`, `durationInFrames` | Not hand-written: derived from the measured voice timing (`part-N.timing.json`); a scene opens 0.25 s before its first line |
| Validation | `src/story/schema.ts`: duplicate IDs, unknown/misordered lines, target gaps, empty windows, Ravi's state or the mast resetting (also across parts), last scene must end the part |

## Captions
Narration and captions are separate. A line over 6 words is split into timed caption groups using the voice's character
alignment (`src/story/captions.ts`): as few groups as possible, balanced, breaking after punctuation or before a
phrase-opening word, never right after "the"/"to"/…, avoiding 1-2 word fragments. A `|` in a line forces the break; used
for three lines where the rule would cut a phrase or bury a punch:
- P2-L03 “Above him, the distant light | blinked again.”
- P2-L09 “Beneath him, a tower brace | tore loose.”
- P3-L11 “She had tried his bakery next. | Only static.”

Radio lines are captioned in amber under a “◉ RADIO · RECORDING / LIVE” tag, and the desk identity and instruction stay whole
(“City warning desk.” → “Hold. Wait for confirmation.”).

## Voices
- Narrator: George (`VOICE_ID`), who also reads Ravi's and Mara's short quotes.
- City warning desk: Daniel “Steady Broadcaster” (`DESK_VOICE_ID`), the same voice for the recording (P3-L09) and the live call
  (P3-L20). A radio filter is applied: the recording sounds like tape (narrower band, more grit), the live call like a receiver.
- Takes are cached by text, voice and context in `.cache/tts`, so re-timing pauses costs nothing.

## Part 1: the locked recording
The recorded narration is **42.2 s**, not 65 s, and runs at about 175 words per minute. As the spec says, it is not re-voiced,
stretched or clipped. Deliberate pauses are inserted only in the silence between lines (cut at the midpoint of each gap), giving
`part-1.edit.wav`: **52.6 s** of audio and **54.1 s** with the closing hold. Pauses: after L02 0.4, L04 1.0 (card hold, the
quiet), L06 0.4, L07 1.2 (blackout), L10 0.4, L11 0.8 (sirens), L12 0.4, L13 1.0 (the water), L14 0.8 (geography wide shot),
L15 0.4, L16 0.8 (climb), L19 0.6, L20 1.2 (time-lapse), L21 1.0 (SOS). The visuals conform to this length.

## SOS
`src/story/sos.ts` implements the spec's cycle exactly (6/18-frame pulses, 6/18/42-frame gaps, 204 frames = 6.8 s).
- P1: a fresh cycle starts on “Then, far away, a light blinked.” One full cycle fits in P1-S7.
- P2: the lamp continues P1's phase (6.3 s into its cycle at P2's first frame) and is carried, not reset.
- P3: Mara starts a fresh cycle on “Three short. Three long. Three short.” The pause after that line (2.3 s) is what lets one
  full cycle complete inside P3-S5. Answering lamps each run their own phase.

## Decisions where the spec left a choice
- Radio display text: the ledger says “AWAITING CONFIRMATION”, the P1-S2 table says “ALERT PENDING”. **ALERT PENDING** is used:
  it is shorter and readable at phone size.
- Second roster name (P3-S2): “HARBOR 2 · DEV”. It carries no later twist.
- No countdown in this series.

## Changes directed by the user after the spec (2026-10-22)
- **Slam words are back** (overrides the spec): huge red glowing “RUN!” and “TSUNAMI!” in Part 1, “RUN!” in Part 2, each in the
  silent beat right after its line, with a hit.
- **Highlighted captions** are bigger and coloured: red glow for warnings, amber glow for the signal, names and radio.
- **No crowd**: Ravi runs alone (a crowd running ahead of him was tried and removed: it ruins the scene).
- **The tsunami as in the reference video**: on “He turned toward the sea / The sea was standing up” a teal wall with a white
  churning crest rises behind the whole skyline while he watches; its curling front then chases him up the hill.
- **Story change: the signal comes from the harbor tower, not a ridge shelter.** The harbor tower is the one building in town
  taller than every surge; the coast-watch station is its rooftop radio room and Mara's SOS lamp is on that roof, seen across
  the water from the mast. Part 2 is rewritten: the light comes “from the roof of the harbor tower”; the mast is failing (“He
  couldn't stay.”), so in the drawdown Ravi climbs down into the mud, runs across the drained streets to the tower, and races
  the returning, higher sea up the fire stairs while it climbs the tower floor by floor behind him; Mara meets him on the roof.
  Part 3 happens in the rooftop radio room; the answering lights shine from survivors on the roofs of two other tall drowned
  buildings. The spec's ridge, ridge trail and shelter are gone; its rules on a sea-ward escape no longer apply to Part 2.
- **The whole city goes under**: the first surge stands up as a wall of turbulent water and rises above the tallest roof
  (level 1100 against a tallest roof at 1135; the wet mark sits at that height). The next surge in Part 2 goes higher still.
- **Voice**: segment joins get short fades so no take clicks or starts abruptly.
- **Deeper narrator, matched to the user's reference video**: the reference voice measures a median 120 Hz with a wide
  84-182 Hz range. Of the account's voices, Adam (pNInz6obpgDQGcFmaJgB) matches best (118 Hz median, 70-180 Hz) and now
  narrates all three parts. **Part 1 was re-voiced** with the same text, as the user asked for one deep voice throughout,
  so the "locked recording" section above no longer applies (its impact gap is now a 1.8 s written pause). Pauses in Parts 2
  and 3 were trimmed for Adam's slower read. Lengths: 59.3 s, 66.5 s, 72.5 s.
- **Warning texts as in the reference**: slams land in the beat after their line, and a TIME TO IMPACT countdown
  (0:08 → 0:01, red then amber) runs over the uphill run and climb, reaching zero on the hit.
- **The wave restyled after the reference**: a towering teal wall with a white curling crest, foam at its foot and spray.

## Measured pacing (see `pacing.md`)
| Part | Length | Speech rate |
|---|---|---|
| 1 | 54.1 s (locked audio) | 175 wpm (as recorded) |
| 2 | 63.2 s | 164 wpm |
| 3 | 67.1 s | 153 wpm |

Scenes that differ from their targets by more than 2.5 s, and how the animation will absorb it:
- P1-S6 (−3.7 s), P1-S4 (−2.4 s): the action is fast in the recording; keep it fast and do not pad the action.
- P2-S1 (+5.6 s): five lines of narration. Staged as three beats inside one continuous shot (grip → roofs below → the light above).
- P2-S3 (−2.7 s), P2-S5 (−3.1 s): short beats between longer ones; the creak and the look back carry them.
- P3-S7 (+4.1 s): the climax: radio, request, the answer, the closing line and the hold. Staged in two framings.

## Still to build (after the animatic is approved)
Shared geography in world coordinates (harbor, town, hill shoulder, mast, landing, ridge trail, shelter); terrain-clipped water
with one shared water-level state; Ravi's costume (apron, torn corner, scraped sleeve) and Mara; props (radio, ID card,
roster, logbook, recorder, signal lamp, receiver, microphone); bakery and shelter interiors; ladder climb and descent with hand
contact; new sound cues (window hum, radio static, creak, surge roar, bootstep, tape click) and ducking under radio lines.
