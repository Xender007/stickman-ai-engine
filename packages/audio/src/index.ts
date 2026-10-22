/**
 * Plan section 15.1: the working Quiet Coast voice/caption/timing pipeline, exposed through the new package layout.
 * These are thin re-exports: the legacy files stay the single source until the legacy engine is retired
 * (docs/handoff/milestone-0.md, rule R3). Do not copy code here.
 */
export { chunkLine, speakable, MAX_CAPTION_WORDS } from '../../../src/story/captions.ts';
export { SOS_CYCLE, SOS_ONSETS, sosOn } from '../../../src/story/sos.ts';
export { END_HOLD, SCENE_LEAD, partDuration, sceneWindows } from '../../../src/story/timeline.ts';
