/** Milestone 3 scene: solver-driven surge and drawdown, floating debris, two clocks, three cameras. See driver.mts for modes. */
import { buildFloodScene } from '../../../packages/world/src/floodfixture.ts';
import { stateHash } from '../../../packages/contracts/src/hash.ts';
import { runDriver } from './driver.mts';

const scene = await buildFloodScene();
console.log(JSON.stringify({ frames: scene.frames.length, stateHash: stateHash(scene.frames), solver: scene.field.info, impacts: scene.bake.impacts }));

await runDriver(
  { id: 'HarborCuts', name: 'flood', props: { frames: scene.frames }, gateFrames: [0, 44, 45, 59, 60, 80, 100, 130, 180, 224, 225, 300, 344, 345, 420, 539] },
  process.argv.slice(2),
);
