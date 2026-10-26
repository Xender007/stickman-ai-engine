import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Grain, H, Vig, W } from './props.tsx';
import { Sc1, Sc2, Sc3, Sc4, Sc5, Sc6, Sc7, Sc8, Sc9, Sc10 } from './scenesA.tsx';
import { Sc11, Sc12, Sc13, Sc14, Sc15, Sc16, Sc17, Sc18, Sc19, Sc20 } from './scenesB.tsx';
import { buildChoreo, sceneStarts } from './choreo.ts';

const SCENES = [Sc1, Sc2, Sc3, Sc4, Sc5, Sc6, Sc7, Sc8, Sc9, Sc10, Sc11, Sc12, Sc13, Sc14, Sc15, Sc16, Sc17, Sc18, Sc19, Sc20];
const CARDS = new Set([9, 10, 14]); // infographic cards: no vignette

(window as any).buildChoreo = buildChoreo;
(window as any).sceneStarts = sceneStarts;

/** draw(t): t in seconds on the composition timeline. */
(window as any).mountScenes = (el: HTMLElement, starts: number[]) => {
  const root = createRoot(el);
  return (t: number) => {
    let n = 0;
    for (let i = 0; i < starts.length; i++) if (t >= starts[i]) n = i;
    const Sc = SCENES[n];
    flushSync(() => root.render(
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: '#000' }}>
        <Sc />
        <Grain />
        {!CARDS.has(n) && <Vig />}
      </svg>,
    ));
  };
};
