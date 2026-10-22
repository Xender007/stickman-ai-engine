/** Milestone 4 pilot: Ravi, the surge, the gantry, the drawdown. See driver.mts for modes. */
import { buildPilotScene } from '../../../packages/world/src/pilotfixture.ts';
import { stateHash } from '../../../packages/contracts/src/hash.ts';
import { runDriver } from './driver.mts';

const scene = await buildPilotScene();
console.log(JSON.stringify({ frames: scene.frames.length, seconds: scene.frames.length / 30, stateHash: stateHash(scene.frames), events: scene.clip.events, impacts: scene.bake.impacts }));

await runDriver(
  { id: 'HarborCuts', name: 'pilot', props: { frames: scene.frames }, gateFrames: [0, 60, 149, 150, 200, 236, 237, 262, 287, 288, 340, 389, 390, 440, 479, 480, 540, 640, 760, 874] },
  process.argv.slice(2),
);
