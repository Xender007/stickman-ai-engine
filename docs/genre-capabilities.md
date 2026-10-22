# Other genres: what the engine can and cannot do today

Written 2026-10-23 in response to: "can the story be totally different, like a zombie outbreak or end-of-the-world survival?"

**Answer:** yes by design (stories are data; the plan's capability registry marks what is missing), but each genre needs
its own capabilities before a *final* render. Today only the ones marked "have" exist. `npm run engine -- validate <scene>`
refuses a final render that needs a capability that is not validated, and names it.

| Capability a zombie / apocalypse story needs | Status | Notes |
|---|---|---|
| One character walking, stopping, crouching with foot contact | **have** (`walk_planted_feet@1`) | Flat ground, side view. |
| Carrying and putting down a prop (child, bag, crate) | **have** (`carry_prop@1`, `transform_handoff@1`) | Box-shaped prop; a child on the back is a new grip. |
| Running, sprinting, stumbling, falling, getting up | planned | Gait planner supports other speeds; needs run clip and fall transitions. |
| Climbing (stairs, ladders, fences, rooftops) | planned | Foot-lock IK exists; hand-hold contacts do not. |
| Many characters at once (a horde of 20 to 200) | planned | Needs instanced rigs, per-agent variation (seeded), crowd steering, level of detail. Biggest gap for zombies. |
| Zombie locomotion and behaviour (shambling, lunging, reaching) | planned | A second rig and motion set with its own passport. |
| Melee and impacts on bodies (hit, knock back, ragdoll) | planned | Rapier ragdolls; contact events already feed damage. |
| Doors, barricades, breakable walls, vehicles crashing | partly | Impact to damage exists for one car; fracture and joints do not. |
| Fire, smoke, explosions | planned | Weather/material state module; not started. |
| Day and night, lighting changes, flashlights, darkness | planned | Lighting is a placeholder; the legacy engine has a working look system to port. |
| Persistent world state (damage, who is where, what burned) | **have** | `WorldLedger`, damage only worsens, no spawning. |
| Camera cuts that keep the same geography | **have** | Two cameras proven; orbit is a later capability. |
| Captions, slams, countdown, voice with word timing | **have** (legacy pipeline) | Works for any story text. |
| Weather, collapse of buildings, wildfire, radiation | planned | Each its own module (plan section 7.2). |

## How a new genre is added (the rule)

1. Write the scene as data and run `validate`: it lists the missing capabilities.
2. Build one capability at a time with its tests and a gate (rule R11), register it as `validated` with evidence.
3. Only then does a final render accept it. Previews may use placeholders, labelled as such.

## What I recommend

Finish the flood slice (Milestone 3), then add a short **horde slice** before the engine is judged on zombies: 20
instanced characters walking with seeded variation, one reaching a barricade. That tests the largest unknown (crowds on
a 4 GB GPU) early, the same way Milestone 0 tested the GPU.
