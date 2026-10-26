import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { H, W } from '../zombie-break/common.tsx';
import { Clip1 } from './scenes/clip1.tsx';
import { Clip2, Clip3 } from './scenes/clip23.tsx';
import { Clip4, Clip5, Clip6 } from './scenes/clip456.tsx';
import { buildChoreo } from './choreo.ts';

const CLIPS = [Clip1, Clip2, Clip3, Clip4, Clip5, Clip6];
const CLIP_FRAMES = 240;

(window as any).buildChoreo = buildChoreo;

/** Frame-pure renderer: the GSAP timeline sets the S channels and then calls draw(f); the DOM is rewritten synchronously. */
(window as any).mountScenes = (el: HTMLElement) => {
  const root = createRoot(el);
  return (f: number) => {
    // fractional frames: the page renders at 60 fps, the choreography is authored in 24-fps frame units
    const frame = Math.max(0, Math.min(CLIPS.length * CLIP_FRAMES - 0.001, f));
    const Comp = CLIPS[Math.floor(frame / CLIP_FRAMES)];
    flushSync(() => root.render(
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: '#000' }}>
        <Comp f={frame % CLIP_FRAMES} />
      </svg>,
    ));
  };
};
