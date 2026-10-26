/** The user's 10 s single-shot prompt, rendered by our engine for a side-by-side with the reference. See driver.mts for modes. */
import { buildShotScene } from '../../../packages/world/src/shotfixture.ts';
import { stateHash } from '../../../packages/contracts/src/hash.ts';
import { runDriver } from './driver.mts';

const scene = await buildShotScene();
console.log(JSON.stringify({ frames: scene.frames.length, stateHash: stateHash(scene.frames), impacts: scene.bake.impacts, events: scene.clip.events }));

await runDriver({ id: 'HarborShot', name: 'shot', similarity: { minPsnr: 60, maxBadPixels: 200, badLevel: 8 }, props: { frames: scene.frames }, gateFrames: [0, 30, 66, 67, 90, 120, 150, 180, 210, 240, 263, 264, 280, 291, 299] }, process.argv.slice(2));
