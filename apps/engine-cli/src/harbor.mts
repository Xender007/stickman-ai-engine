/** Milestone 2 scene: one street, two cameras, a flood and a log that damages a car after the cut. See driver.mts for modes. */
import { buildHarborScene } from '../../../packages/world/src/envfixture.ts';
import { stateHash } from '../../../packages/contracts/src/hash.ts';
import { runDriver } from './driver.mts';

const scene = await buildHarborScene();
console.log(JSON.stringify({ frames: scene.frames.length, stateHash: stateHash(scene.frames), impacts: scene.impacts }));

await runDriver({ id: 'HarborCuts', name: 'harbor', props: { frames: scene.frames }, gateFrames: [0, 30, 60, 90, 104, 105, 120, 130, 131, 140, 170, 200, 230, 269] }, process.argv.slice(2));
