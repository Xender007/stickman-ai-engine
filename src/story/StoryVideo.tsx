import React, {useMemo} from 'react';
import {AbsoluteFill, CalculateMetadataFunction, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, H, W} from '../config';
import {ANTON, MONTSERRAT} from '../fonts';
import {progress, smooth} from '../lib/anim';
import {ClockBadge, Countdown, EndCard} from '../components/Overlay';
import {Slam} from '../components/Effects';
import type {StoryPart, StoryTiming} from './schema';
import {sosOn} from './sos';
import {partDuration, sceneWindows} from './timeline';
import type {PartModule, Plan} from './scenes/types';
import {part1} from './scenes/p1';
import {part2} from './scenes/p2';
import {part3} from './scenes/p3';

const MODULES: Record<number, PartModule> = {1: part1, 2: part2, 3: part3};
export const END_CARD_HOLD = 3.2;

export type StoryVideoProps = {part: StoryPart; timing: StoryTiming; sosAnchor: number | null};

export const calculateStoryMetadata: CalculateMetadataFunction<StoryVideoProps> = ({props}) => ({
  durationInFrames: Math.ceil((partDuration(props.timing) + END_CARD_HOLD) * FPS),
});

const outline = '3px 3px 0 #000,-3px 3px 0 #000,3px -3px 0 #000,-3px -3px 0 #000,0 9px 18px rgba(0,0,0,.55)';

const Captions: React.FC<{timing: StoryTiming; keyLines: PartModule['keyLines']; t: number; until: number}> = ({timing, keyLines, t, until}) => {
  const lineOf = (start: number) => timing.lines.find((l) => start >= l.start - 0.01 && start <= l.end + 0.01)?.id ?? '';
  return (
    <AbsoluteFill>
      {timing.captions.map((c, i) => {
        const next = timing.captions[i + 1];
        const inAt = c.start - 0.05;
        const outAt = Math.min(next ? next.start - 0.05 : Infinity, c.end + 1.2, until - 0.1);
        const opacity = Math.min(smooth(inAt, inAt + 0.1, t), 1 - smooth(outAt, outAt + 0.12, t));
        if (opacity <= 0) return null;
        const desk = c.speaker === 'desk';
        const kind = desk ? 'signal' : keyLines[lineOf(c.start)];
        const key = Boolean(kind);
        const [fill, glow] = kind === 'warn' ? ['#ff4a3d', '255,60,40'] : ['#ffd27a', '255,176,46'];
        const pulse = 0.75 + 0.25 * Math.sin((t - c.start) * 6);
        return (
          <div key={i} style={{position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', opacity}}>
            {desk ? (
              <div style={{fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 34, color: '#ffb02e', letterSpacing: 4, marginBottom: 8,
                textShadow: `0 0 18px rgba(255,176,46,${0.8 * pulse})`}}>
                ◉ RADIO · {c.variant === 'recorded' ? 'RECORDING' : 'LIVE'}
              </div>
            ) : c.speaker === 'mia' ? (
              <div style={{fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 34, color: '#8fd3ff', letterSpacing: 4, marginBottom: 8,
                textShadow: '0 0 16px rgba(120,200,255,.8)'}}>MIA</div>
            ) : <div style={{height: 50}} />}
            <div style={{
              fontFamily: ANTON, fontSize: key ? 122 : 92, lineHeight: 1.02, textTransform: 'uppercase',
              transform: `scale(${0.94 + 0.06 * progress(t, inAt, 0.12)})`,
            }}>
              {c.text.split(' ').map((word, wi, all) => {
                // Words light up as they are spoken: the one being said pops, the rest of the line is dimmer.
                const total = all.reduce((a, x) => a + x.length + 1, 0);
                const before = all.slice(0, wi).reduce((a, x) => a + x.length + 1, 0);
                const p = Math.min(1, Math.max(0, (t - c.start) / Math.max(0.2, c.end - c.start)));
                const state = p * total >= before + word.length ? 'done' : p * total >= before ? 'now' : 'next';
                const base = c.speaker === 'mia' ? '#cfeeff' : key ? fill : '#ffffff';
                return (
                  <span key={wi} style={{
                    display: 'inline-block', marginRight: 26, color: state === 'now' ? (key ? '#ffffff' : '#ffe27a') : base,
                    opacity: state === 'next' ? 0.58 : 1,
                    transform: state === 'now' ? 'scale(1.04) translateY(-3px)' : 'none',
                    textShadow: key ? `${outline},0 0 28px rgba(${glow},${0.95 * pulse}),0 0 70px rgba(${glow},${0.6 * pulse})` : outline,
                  }}>{word}</span>
                );
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** "SECOND WAVE 15:00": minutes left, stepping through time jumps; red, turning amber in the last minute. */
const WaveClock: React.FC<{label: string; keys: [number, number][]; from: number; until: number; t: number; hide: boolean}> = ({label, keys, from, until, t, hide}) => {
  if (t < from || t >= until || hide) return null;
  let left = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t >= keys[i][0]) left = keys[i][1];
    else {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      left = t < t0 ? v0 : v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
      break;
    }
  }
  const s = Math.max(0, Math.ceil(left));
  const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const pop = 1 + 0.08 * Math.max(0, 1 - ((t - from) % 1) / 0.2);
  const color = s <= 60 ? '#ffb02e' : '#ff3b30';
  return (
    <div style={{position: 'absolute', top: 690, width: '100%', display: 'flex', justifyContent: 'center', opacity: smooth(from, from + 0.3, t) * (1 - smooth(until - 0.3, until, t))}}>
      <div style={{
        padding: '10px 44px 4px', borderRadius: 30, textAlign: 'center', background: 'rgba(8,6,12,.62)',
        border: `3px solid ${color}88`, boxShadow: `0 0 40px ${color}44, inset 0 0 30px rgba(0,0,0,.4)`,
      }}>
        <div style={{fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: '#ffd9d4'}}>⚠ {label}</div>
        <div style={{fontFamily: ANTON, fontSize: 150, lineHeight: 1.05, color, transform: `scale(${pop})`, textShadow: `0 0 30px ${color}aa`}}>{text}</div>
      </div>
    </div>
  );
};

/** A calm amber card that fades in and out, e.g. "DAY 2". */
const Card: React.FC<{text: string; at: number; dur: number; t: number}> = ({text, at, dur, t}) => {
  const o = smooth(at, at + 0.3, t) * (1 - smooth(at + dur - 0.4, at + dur, t));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, transform: `scale(${0.92 + 0.08 * o})`}}>
      <div style={{padding: '14px 56px', borderRadius: 30, background: 'rgba(8,6,12,.6)', border: '3px solid #ffd27a88', boxShadow: '0 0 40px #ffb02e44',
        fontFamily: ANTON, fontSize: 120, letterSpacing: 6, color: '#ffd27a', textShadow: '0 0 26px #ffb02eaa'}}>{text}</div>
    </div>
  );
};

/** "PART 2 · THE GIRL ON THE ROOF": a small chip that slides in at the start and out after a few seconds. */
const PartChip: React.FC<{n: number; title: string; t: number}> = ({n, title, t}) => {
  const o = smooth(0.2, 0.6, t) * (1 - smooth(3.4, 4, t));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 172, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * -14}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 28px', borderRadius: 40, background: 'rgba(8,6,12,.6)', border: '2px solid rgba(255,255,255,.22)',
        fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: '#fff'}}>
        <span style={{color: '#ff6a4d'}}>PART {n}</span><span style={{opacity: 0.5}}>·</span><span>{title.toUpperCase()}</span>
      </div>
    </div>
  );
};

/** Under the end card: which part of three this was, and what comes next. */
const EndExtras: React.FC<{n: number; next?: string; age: number}> = ({n, next, age}) => (
  <div style={{position: 'absolute', top: 1200, left: 0, right: 0, textAlign: 'center', opacity: smooth(0.5, 1, age)}}>
    <div style={{display: 'flex', justifyContent: 'center', gap: 18}}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{width: 22, height: 22, borderRadius: 11, background: i <= n ? '#ff6a4d' : 'transparent', border: '3px solid #ff6a4d', boxShadow: i === n ? '0 0 16px #ff6a4d' : 'none'}} />
      ))}
    </div>
    {next ? <div style={{marginTop: 28, fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 36, letterSpacing: 3, color: '#ffd9d4'}}>{next}</div> : null}
  </div>
);

const Sound: React.FC<{m: PartModule; plan: Plan; timing: StoryTiming; fps: number}> = ({m, plan, timing, fps}) => {
  const cues = useMemo(() => m.sound(plan), [m, plan]);
  // Beds dip under every spoken line, and further under radio voices and key lines so they stay intelligible.
  const duck = (t: number) => {
    const l = timing.lines.find((x) => t >= x.start - 0.15 && t <= x.end + 0.2);
    if (!l) return 1;
    const cap = timing.captions.find((c) => c.start >= l.start - 0.01 && c.start <= l.end);
    return cap?.speaker === 'desk' || m.keyLines[l.id] ? 0.3 : 0.55;
  };
  return (
    <>
      <Html5Audio src={staticFile(timing.audio)} />
      {(m.slams?.(plan) ?? []).map((s, i) => (
        <Sequence key={`slam${i}`} from={Math.round(s.at * fps)} layout="none"><Html5Audio src={staticFile('sfx/boom.wav')} volume={0.9} /></Sequence>
      ))}
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * fps))} durationInFrames={c.dur ? Math.max(1, Math.round(c.dur * fps)) : undefined} layout="none">
          <Html5Audio src={staticFile(`sfx/${c.name}.wav`)} loop={c.loop}
            volume={(f) => {
              const t = c.at + f / fps;
              const v = typeof c.volume === 'number' ? c.volume : c.volume(t);
              return Math.max(0, Math.min(1, v * (c.duck ? duck(t) : 1)));
            }} />
        </Sequence>
      ))}
    </>
  );
};

/** One part of a scripted story: scenes on the measured voice timeline, captions, sound, blackout and end card. */
export const StoryVideo: React.FC<StoryVideoProps> = ({part, timing, sosAnchor}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = MODULES[part.part];
  const total = partDuration(timing);
  const t = frame / fps;
  const st = Math.min(t, total - 1 / fps); // the picture holds under the end card
  const plan: Plan = useMemo(() => {
    const wins = sceneWindows(part, timing);
    const find = (id: string) => {
      const l = timing.lines.find((x) => x.id === id);
      if (!l) throw new Error(`no cue ${id}`);
      return l;
    };
    return {wins, total, cue: (id) => find(id).start, cueEnd: (id) => find(id).end};
  }, [part, timing, total]);
  const i = Math.max(0, plan.wins.findIndex((w) => st >= w.start && st < w.end));
  const w = plan.wins[i];
  const fresh = part.scenes.some((s) => s.sosStart);
  const lamp = (tt: number) => sosAnchor !== null && (!fresh || tt >= sosAnchor) && sosOn((tt - sosAnchor) * fps);
  const Scene = m.scenes[w.id];
  // Blackout: cut to black at the hit, then the next scene fades up.
  const outs = m.blackouts?.(plan) ?? [];
  let black = 0;
  for (const at of outs) {
    const back = plan.wins.find((x) => x.start > at)?.start ?? total;
    black = Math.max(black, smooth(at, at + 0.08, st) * (1 - smooth(back, back + 0.6, st)));
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sound m={m} plan={plan} timing={timing} fps={fps} />
      {Scene ? <Scene c={{...plan, t: st, lt: st - w.start, w, lamp}} /> : null}
      <AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />
      {m.clock ? <ClockBadge text={m.clock.text} t={t} until={m.clock.until(plan)} /> : null}
      {m.waveClock ? <WaveClock {...m.waveClock(plan)} t={t} hide={(m.slams?.(plan) ?? []).some((s) => t >= s.at - 0.05 && t < s.at + 2)} /> : null}
      {(m.cards?.(plan) ?? []).map((cd, k) => <Card key={k} {...cd} t={t} />)}
      {m.countdown ? <Countdown t={t} start={m.countdown(plan).start} from={m.countdown(plan).seconds} /> : null}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="slamGlow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={16} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g filter="url(#slamGlow)">{(m.slams?.(plan) ?? []).map((s, k) => <Slam key={k} text={s.text} t={t} at={s.at} hold={1.1} cy={930} />)}</g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 640, background: 'linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,0))', pointerEvents: 'none'}} />
      <Captions timing={timing} keyLines={m.keyLines} t={t} until={total} />
      <PartChip n={part.part} title={part.title} t={t} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 150, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.18)', opacity: 1 - smooth(total, total + 0.4, t)}}>
        <div style={{width: `${Math.min(1, t / total) * 100}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#ff8a3d,#ffd27a)', boxShadow: '0 0 12px rgba(255,170,70,.7)'}} />
      </div>
      <EndCard t={t} at={total} title={m.endCard.title} subtitle={m.endCard.subtitle} />
      {t >= total ? <EndExtras n={part.part} next={m.endCard.next} age={t - total} /> : null}
    </AbsoluteFill>
  );
};
