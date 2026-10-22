import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {curve, smooth} from '../lib/anim';
import {collapseTimes, lightningTimes} from '../fx/times';
import type {Compiled, CompiledShot} from './compile';
import {IMPACT_LEAD} from './ShotView';
import type {Threat} from './schema';

const BED: Record<Threat, string | null> = {none: 'pad', quake: 'rumble', collapse: 'rumble', fire: 'crackle', wave: 'roar', storm: 'rain'};

const At: React.FC<{s: number; fps: number; dur?: number; children: React.ReactNode}> = ({s, fps, dur, children}) => (
  <Sequence from={Math.max(0, Math.round(s * fps))} durationInFrames={dur === undefined ? undefined : Math.max(1, Math.round(dur * fps))} layout="none">
    {children}
  </Sequence>
);

const sfx = (name: string) => staticFile(`sfx/${name}.wav`);

/** Beds follow the shot's threat; one-shots sit on the same event times the picture uses. */
const ShotSound: React.FC<{shot: CompiledShot; index: number; seed: string; fps: number}> = ({shot, index, seed, fps}) => {
  const dur = shot.end - shot.start;
  const sseed = `${seed}-s${index}`;
  const stop = shot.impact ? dur - 0.3 : dur; // everything cuts right after the hit
  const calm = shot.threat === 'none';
  const bed = calm ? (shot.mood === 'storm' || shot.mood === 'disaster' ? null : BED.none) : BED[shot.threat];
  const volume = (lt: number) => {
    switch (shot.threat) {
      case 'none': return curve(lt, [[0, 0], [0.8, 0.4]]);
      case 'quake': return 0.2 + 0.75 * smooth(0, dur, lt);
      case 'wave': return 0.25 + 0.75 * smooth(0, dur, lt);
      case 'storm': return 0.55;
      case 'fire': return 0.6;
      case 'collapse': return 0.9;
    }
  };
  return (
    <>
      {bed ? (
        <At s={shot.start} fps={fps} dur={stop}>
          <Html5Audio src={sfx(bed)} loop volume={(fr) => volume(fr / fps)} />
        </At>
      ) : null}
      {shot.threat === 'wave' && shot.setting === 'city' ? (
        <At s={shot.start} fps={fps} dur={stop}><Html5Audio src={sfx('siren')} loop volume={0.3} /></At>
      ) : null}
      {shot.threat === 'collapse'
        ? collapseTimes(dur, sseed).map((at, i) => <At key={`c${i}`} s={shot.start + at} fps={fps}><Html5Audio src={sfx('crash')} volume={0.45} /></At>)
        : null}
      {shot.threat === 'storm'
        ? lightningTimes(dur, sseed).map((at, i) => <At key={`t${i}`} s={shot.start + at + 0.25} fps={fps}><Html5Audio src={sfx('thunder')} volume={0.8} /></At>)
        : null}
      {shot.impact ? (
        <>
          <At s={shot.end - IMPACT_LEAD} fps={fps}><Html5Audio src={sfx('crash')} volume={1} /></At>
          <At s={shot.end - IMPACT_LEAD} fps={fps}><Html5Audio src={sfx('boom')} volume={1} /></At>
          <At s={shot.end - 0.3} fps={fps}><Html5Audio src={sfx('ring')} volume={0.6} /></At>
        </>
      ) : null}
    </>
  );
};

export const EpisodeSound: React.FC<{c: Compiled; vo: string | null; seed: string; fps: number}> = ({c, vo, seed, fps}) => (
  <>
    {vo ? <Html5Audio src={staticFile(vo)} /> : null}
    {c.shots.map((s, i) => <ShotSound key={i} shot={s} index={i} seed={seed} fps={fps} />)}
    {c.slams.map((s, i) => <At key={`slam${i}`} s={s.at} fps={fps}><Html5Audio src={sfx('boom')} volume={0.9} /></At>)}
    <At s={c.endCard} fps={fps}><Html5Audio src={sfx('boom')} volume={0.8} /></At>
  </>
);
