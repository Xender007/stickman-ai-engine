import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './config';
import {EpisodeProps, EpisodeVideo, calculateEpisodeMetadata} from './episode/EpisodeVideo';
import {EpisodeSchema} from './episode/schema';
import {estimatePhrases} from './episode/timing';
import demo from '../fixtures/demo/part-1.json';
import {Animatic, AnimaticProps, calculateAnimaticMetadata} from './story/Animatic';
import {StoryVideo, calculateStoryMetadata} from './story/StoryVideo';
import {StoryPartSchema, StoryTiming} from './story/schema';
import storyPart from '../story/the-quiet-coast/part-1.json';
import storyTiming from '../story/the-quiet-coast/part-1.timing.json';

// Studio preview uses the demo episode with estimated timings; renders pass real props via --props.
const episode = EpisodeSchema.parse(demo);
const defaultProps: EpisodeProps = {
  episode,
  phrases: estimatePhrases(episode),
  vo: null,
  seed: 'demo',
  endCard: {title: 'PART 2?', subtitle: 'FOLLOW TO FIND OUT'},
};

// Scripted stories: renders pass the part, its measured timing and the lamp phase via --props.
const animaticProps: AnimaticProps = {part: StoryPartSchema.parse(storyPart), timing: storyTiming as StoryTiming, sosAnchor: null};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Episode"
      component={EpisodeVideo}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={1}
      defaultProps={defaultProps}
      calculateMetadata={calculateEpisodeMetadata}
    />
    <Composition
      id="StoryPart"
      component={StoryVideo}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={1}
      defaultProps={animaticProps}
      calculateMetadata={calculateStoryMetadata}
    />
    <Composition
      id="StoryAnimatic"
      component={Animatic}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={1}
      defaultProps={animaticProps}
      calculateMetadata={calculateAnimaticMetadata}
    />
  </>
);
