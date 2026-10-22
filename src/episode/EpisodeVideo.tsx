import React, {useMemo} from 'react';
import {AbsoluteFill, CalculateMetadataFunction, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, W} from '../config';
import {smooth} from '../lib/anim';
import {Captions, ClockBadge, Countdown, EndCard} from '../components/Overlay';
import {Slam} from '../components/Effects';
import {seamless, trackBases} from './hero';
import {compile} from './compile';
import type {Episode} from './schema';
import {ShotView, IMPACT_LEAD} from './ShotView';
import {EpisodeSound} from './Sound';
import type {Phrase} from './timing';

export type EpisodeProps = {
  episode: Episode;
  phrases: Phrase[];
  /** Narration file in public/, or null for a silent preview. */
  vo: string | null;
  /** Series seed: keeps the same city/forest layout across every part. */
  seed: string;
  endCard: {title: string; subtitle: string};
};

const XFADE = 0.5;

export const calculateEpisodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({props}) => ({
  durationInFrames: Math.ceil(compile(props.episode, props.phrases).duration * FPS),
});

export const EpisodeVideo: React.FC<EpisodeProps> = ({episode, phrases, vo, seed, endCard}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const c = useMemo(() => compile(episode, phrases), [episode, phrases]);
  const st = Math.min(t, c.endCard - 1 / fps); // the world freezes under the end card
  const bases = useMemo(() => trackBases(c.shots), [c]);
  const index = Math.max(0, c.shots.findIndex((s) => st >= s.start && st < s.end));

  // Shots that change place, light or framing dissolve into each other; the previous shot keeps moving underneath.
  const prev = index > 0 ? c.shots[index - 1] : undefined;
  const cur = c.shots[index];
  const dissolve = prev && !prev.impact && !seamless(prev, cur);
  const fade = dissolve ? smooth(cur.start, cur.start + XFADE, st) : 1;
  const fadeFrom = dissolve && fade < 1 ? prev : undefined;

  // Impact: white-out as the hit lands, a beat of black, then the next shot fades up.
  let white = 0;
  let black = 0;
  for (const s of c.shots) {
    if (!s.impact) continue;
    const hit = s.end - IMPACT_LEAD;
    const cut = smooth(s.end - 0.35, s.end - 0.3, t);
    white = Math.max(white, smooth(hit + 0.15, hit + 0.6, t) * (1 - cut));
    black = Math.max(black, cut * (1 - smooth(s.end + 0.6, s.end + 1.3, t)));
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <EpisodeSound c={c} vo={vo} seed={seed} fps={fps} />
      {fadeFrom ? <ShotView shot={fadeFrom} index={index - 1} t={st} seed={seed} base={bases[index - 1]} prev={c.shots[index - 2]} /> : null}
      <AbsoluteFill style={{opacity: fade}}>
        <ShotView shot={c.shots[index]} index={index} t={st} seed={seed} base={bases[index]} prev={prev} />
      </AbsoluteFill>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{position: 'absolute', inset: 0}}>
        {c.slams.map((sl, i) => <Slam key={i} text={sl.text} t={t} at={sl.at} hold={1.3} />)}
      </svg>
      <AbsoluteFill style={{backgroundColor: '#f4f6fa', opacity: white}} />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />
      {episode.clock ? <ClockBadge text={episode.clock} t={t} until={c.clockUntil} /> : null}
      {c.countdown ? <Countdown t={t} start={c.countdown.start} from={c.countdown.seconds} /> : null}
      <Captions phrases={phrases} t={t} until={c.endCard} />
      <EndCard t={t} at={c.endCard} title={endCard.title} subtitle={endCard.subtitle} />
    </AbsoluteFill>
  );
};
