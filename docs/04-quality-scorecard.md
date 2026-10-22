# Quality scorecard and benchmark

Viewers judge by the weakest area, so the target is **every area ≥ 9**. That is the practical meaning of 9.5.

## Area scores (rated by you on the benchmark, 1–10)
| Area | Today (estimate) | Pilot target | Production target |
|---|---|---|---|
| Story and pacing | 7 | 7 | 9 |
| Character motion | 3 | 7.5 | 9 |
| Character consistency | 6 | 9 | 9.5 |
| Backgrounds and art | 5 | 8 | 9 |
| Water and physics | 5 | 8 | 9.5 |
| Objects and props | 4 | 8 | 9 |
| Lighting and grade | 3 | 7 | 9 |
| Camera | 5 | 7.5 | 9 |
| Sound and voice | 5 | 7 | 9 |
| Text and UI | 8 | 8.5 | 9 |

## Programmatic checks (pass/fail per shot)
| Check | Threshold |
|---|---|
| Scale sanity | Person:door, person:floor and person:car ratios within 15% of real |
| Foot/hand contact | Planted contact drifts ≤ 1 cm per frame in world units |
| Penetration | No limb or prop overlap beyond 2 cm (except attachments) |
| Joint limits | Zero violations |
| Identity | Limb ratios exact; palette ΔE ≤ 6; embedding similarity ≥ calibrated threshold |
| Temporal jitter | No acceleration spikes beyond 5σ of the shot's motion |
| Physics events | Spray within 1 frame of each impact; floating props at density waterline ±10% |
| Stranding | After water leaves, every object rests on the ground (gap ≤ 2 cm) with tilt matching the contact normal; nothing floats in air or sinks into terrain |
| Audio sync | Each sound cue within 2 frames (67 ms) of its event |
| Text | Captions inside the safe zone (x 90–990, y 220–1500); contrast ≥ 4.5:1; no overlap with slams or clocks |
| Loudness | −14 LUFS ±1, true peak ≤ −1 dB |
| Determinism | Same environment: bit-identical frames; across GPU backends: PSNR ≥ 45 dB |

## Process metrics (tracked per run)
First-pass acceptance rate, corrections per accepted shot, recurring defect categories, render time, generation
spend, cost per accepted second.

## Benchmark suite (fixed; plus unseen variations of each)
1. Walk to a stop on a street
2. Run up a hill, turn and look back
3. Climb a ladder with hand contact
4. Stairs up with a child carried (fire escape)
5. Jump between two roofs
6. Paddle a door raft past floating debris
7. Surge crossing a town; buildings break (wide)
8. Impact on a tower with spray (medium → close)
9. Water rising up a facade and settling
10. **Drawdown:** the sea retreats past the old shoreline; stranded fish flop; wrecked cars, boats aground, rocks,
    debris line and puddles left behind; the horizon whitens
11. Night signal: flashlight SOS and helicopter searchlight
12. Emotional close-up (body-language only)
13. Captions + countdown + slam over a busy scene

## Competitive benchmark (vs Higgsfield, Kling, Seedance)
Same prompt, 9:16, same length, for benchmarks 4, 7, 8 and 10. Competitors get their best of 3 attempts; the engine
gets its first accepted output. Blind A/B with at least 10 viewers per pair on: character consistency, physical
correctness, object clarity, motion realism, overall looks. Record attempts, edits, cost and time to an acceptable
clip. Release target: the engine wins consistency, physics and object clarity in at least 3 of 4 scenes and is rated
at least comparable on looks in 60% of pairs.

A change is promoted only if it improves or holds every benchmark score and passes the unseen variations. Never use
an AI score as the only gate; your review decides benchmark acceptance.
