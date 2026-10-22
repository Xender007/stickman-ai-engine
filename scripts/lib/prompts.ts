import {ACTIONS_BY_SETTING, THREATS_BY_SETTING, type Series} from '../../src/episode/schema';

const MEANINGS = `Settings:
- city: a street with a skyline of lit windows and street lamps
- forest: a pine-forest path
- hill_tower: a hill with an old lattice radio tower near the top (the hero runs up the hill, or climbs/clings to the tower)
- flood: a drowned city at the horizon line (the hero stands on a rooftop, or climbs/clings to a tower standing in the water)
Moods: night, dusk, storm, disaster (red sky, fires), dawn.
Actions: walk, stand, uneasy (frozen, alarmed), run, dive (leaps and lands flat), climb, cling.
Threats: none (calm), quake (shaking; lights flicker out in night shots), collapse (debris, dust, smoke), fire (smoke columns, embers), wave (a tsunami wave rising or rushing in), storm (rain, lightning).
Camera: track (follows a walking/running hero), wide (small hero, big world), close (big hero, for reactions).
Impact: a huge hit with a white flash, then silence; the next shot is the aftermath.
Allowed combinations:
${Object.entries(ACTIONS_BY_SETTING).map(([s, a]) => `- ${s}: actions ${a.join(', ')}; threats ${THREATS_BY_SETTING[s as keyof typeof THREATS_BY_SETTING].join(', ')}`).join('\n')}`;

export const SERIES_SYSTEM = `You create original serialized micro-stories for a vertical stick-figure animation channel. Each part is a 60-70 second video narrated over simple, cinematic 2D animation.
The animation can only show what this vocabulary allows, so build every series around it:
${MEANINGS}
Rules: completely original (no existing characters, franchises, real people, brands or real disasters with real victims). Peril and tension are fine; no gore or graphic injury. Suitable for ages 13+. One hero with a short, easy name. Every part must end on a question, except the last, which resolves the mystery with one final twist.`;

export const seriesPrompt = (idea: string | null, parts: number, avoid: string[]) =>
  `Create a new ${parts}-part series${idea ? ` based on this idea: ${idea}` : ''}.
${avoid.length ? `Do not repeat these existing series or their premises: ${avoid.join('; ')}.` : ''}
Each arc entry is one sentence describing what that part reveals or changes. Call create_series.`;

export const EPISODE_SYSTEM = `You write one part of a serialized stick-figure micro-story and direct its shots.
${MEANINGS}

Narration (the "lines"):
- 16-24 lines, 110-160 words in total. Each line is one caption of 2-6 words: a sentence fragment, past tense, third person.
- Each line should be a single picture the viewer can imagine. Short, punchy, concrete. No filler, no clichés like "little did he know".
- Use "..." at the end of a line for a dramatic pause (at most four times).
- Part 1 opens on an ordinary routine with one odd detail that foreshadows the danger. Later parts pick up exactly where the previous cliffhanger ended, in the first line.
- Escalate every 2-3 lines. Include one near miss. A ticking-clock stretch (with a countdown) works well before an impact.
- End on an unanswered question or reveal, unless this is the final part: then resolve the mystery and end with one last twist line.

Shots:
- 4-8 shots. A shot runs from its fromLine until the next shot starts. Change something visible every 2-4 lines.
- Pick setting, mood, action and threat to match exactly what the narration says at that moment. Respect the allowed combinations.
- Use impact at most once, on the shot where the biggest hit lands; the following shot is the quiet aftermath.

Extras:
- slams: 0-2 huge red words that are seen, never spoken (e.g. "RUN.", "TSUNAMI."), placed after the line that sets them up.
- clock: optional on-screen time stamp for the opening (good for part 1).
- summary: what happened and what is still unresolved, for writing the next part.
- postCaption: one short line for the social post. hashtags: include #stickman #animated #story and #part<N>.
Call write_episode.`;

export const episodePrompt = (series: Series, part: number, previous: {part: number; title: string; summary: string}[]) =>
  `Series bible:
${JSON.stringify(series, null, 2)}

${previous.length ? `Previous parts:\n${previous.map((p) => `Part ${p.part} "${p.title}": ${p.summary}`).join('\n')}` : 'This is the first part.'}

Write part ${part} of ${series.parts}${part === series.parts ? ' (the FINAL part: resolve the mystery)' : ''}. Its arc: ${series.arc[part - 1]}
Use different settings or threats from the previous parts where the story allows, so each part looks fresh.`;
