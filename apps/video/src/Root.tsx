import React from 'react';
import { Composition } from 'remotion';
import { Lanes, type LanesProps } from './Lanes.tsx';
import { CarryScene } from './CarryScene.tsx';
import { carryProps, type CarryProps } from './carryProps.ts';
import { EnvScene, type EnvProps } from './EnvScene.tsx';
import { buildEnvTimeline } from '../../../packages/world/src/envtimeline.ts';
import { harborStreet } from '../../../packages/world/src/location.ts';
import { harborFlood } from '../../../packages/environment/src/flood.ts';
import { CAMERAS } from '../../../packages/world/src/envcameras.ts';
import { buildCarryClip } from '../../../packages/motion/src/carry.ts';

// Studio default for Lanes25D: a resting crate. Real renders pass baked tracks via --props.
const defaultProps: LanesProps = {
  tracks: { fps: 30, frames: Array.from({ length: 90 }, (_, frame) => ({ frame, bodies: [{ id: 'crate', x: 4, y: 0.4, angle: 0 }] })) },
};

// Studio default for CarryClip: the nominal animation, crate placed by the animation alone (no physics bake).
const carryClip = buildCarryClip({ massKg: 25, crateX: 3, carryDistance: 3 });
const carryDefault: CarryProps = carryProps(
  carryClip,
  30,
  Array.from({ length: Math.floor(carryClip.duration * 30) }, (_, f) => carryClip.sampleAt(f / 30).crate),
);

// Studio default for HarborCuts: the static location, no physics bake (real renders pass the baked frames).
const harborDefault: EnvProps = {
  frames: buildEnvTimeline({
    fps: 30,
    frames: 60,
    location: harborStreet(),
    flood: harborFlood({ quayX: 0 }),
    shots: [{ fromFrame: 0, toFrameExclusive: 60, camera: CAMERAS.wide }],
    poseAt: () => [],
    impacts: [],
  }),
};

export const EngineRoot: React.FC = () => (
  <>
    <Composition id="Lanes25D" component={Lanes} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={defaultProps} />
    <Composition
      id="CarryClip"
      component={CarryScene}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={carryDefault.frames.length}
      defaultProps={carryDefault}
      calculateMetadata={({ props }) => ({ durationInFrames: props.frames.length })}
    />
    <Composition
      id="HarborCuts"
      component={EnvScene}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={harborDefault.frames.length}
      defaultProps={harborDefault}
      calculateMetadata={({ props }) => ({ durationInFrames: props.frames.length })}
    />
  </>
);
