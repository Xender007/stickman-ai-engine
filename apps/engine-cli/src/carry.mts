/** Milestone 1 scene: walk, pick up, carry, put down a crate. `npx tsx apps/engine-cli/src/carry.mts <mode> ...` (see driver.mts). */
import { buildCarryClip } from '../../../packages/motion/src/carry.ts';
import { bakeCarryCrate } from '../../../packages/physics/src/carry-bake.ts';
import { stateHash } from '../../../packages/contracts/src/hash.ts';
import { carryProps } from '../../video/src/carryProps.ts';
import { runDriver } from './driver.mts';

const clip = buildCarryClip({ massKg: 25, crateX: 3, carryDistance: 3 });
const baked = await bakeCarryCrate(clip, { fps: 30, stepSeconds: 1 / 120, massKg: 25 });
const props = carryProps(clip, 30, baked.frames.map((f) => f.bodies[0]));
console.log(JSON.stringify({ frames: props.frames.length, bakeHash: stateHash(baked.frames), tGrasp: clip.tGrasp, tRelease: clip.tRelease }));

await runDriver({ id: 'CarryClip', name: 'carry', props, gateFrames: [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350] }, process.argv.slice(2));
