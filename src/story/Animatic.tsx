import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, W} from '../config';
import {ANTON, MONTSERRAT} from '../fonts';
import {progress, smooth} from '../lib/anim';
import type {StoryPart, StoryTiming} from './schema';
import {sosOn} from './sos';
import {partDuration, sceneWindows} from './timeline';

export type AnimaticProps = {part: StoryPart; timing: StoryTiming; sosAnchor: number | null};

export const calculateAnimaticMetadata: CalculateMetadataFunction<AnimaticProps> = ({props}) => ({
  durationInFrames: Math.ceil(partDuration(props.timing) * FPS),
});

const SKY: Record<string, [string, string]> = {
  night: ['#070d22', '#1b2850'],
  dawn: ['#241a3d', '#b8693f'],
  'early-morning': ['#39405a', '#c4a07a'],
};

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};

const outline = '3px 3px 0 #000,-3px 3px 0 #000,3px -3px 0 #000,-3px -3px 0 #000,0 9px 18px rgba(0,0,0,.55)';

const Lamp: React.FC<{x: number; y: number; r: number; on: boolean; label?: string}> = ({x, y, r, on, label}) => (
  <>
    <div style={{position: 'absolute', left: x - r * 3, top: y - r * 3, width: r * 6, height: r * 6, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,226,150,.75) 0%, rgba(255,226,150,0) 65%)', opacity: on ? 1 : 0}} />
    <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
      background: on ? '#fff3c4' : '#3b3a40', border: '3px solid #111'}} />
    {label ? <div style={{position: 'absolute', left: x - 150, top: y + r + 12, width: 300, textAlign: 'center',
      fontFamily: MONTSERRAT, fontWeight: 700, fontSize: 24, color: '#ffffffaa'}}>{label}</div> : null}
  </>
);

/** Rough storyboard for timing and readability review: real audio, final captions, scene staging, clue text, lamp. */
export const Animatic: React.FC<AnimaticProps> = ({part, timing, sosAnchor}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const total = partDuration(timing);
  const wins = sceneWindows(part, timing);
  const i = Math.max(0, wins.findIndex((w) => t >= w.start && t < w.end));
  const w = wins[i];
  const age = t - w.start;
  const k = (t - w.start) / (w.end - w.start);
  const [top, bottom] = w.timeOfDay === 'night-to-dawn'
    ? [mix(SKY.night[0], SKY.dawn[0], smooth(0.35, 0.8, k)), mix(SKY.night[1], SKY.dawn[1], smooth(0.35, 0.8, k))]
    : SKY[w.timeOfDay];
  // A lamp that starts a fresh cycle in this part is dark until then; a carried lamp is already running.
  const fresh = part.scenes.some((s) => s.sosStart);
  const lampOn = sosAnchor !== null && (!fresh || t >= sosAnchor) && sosOn((t - sosAnchor) * fps);
  const cap = timing.captions.find((c, n) => {
    const next = timing.captions[n + 1];
    return t >= c.start - 0.05 && t < Math.min(next ? next.start - 0.05 : Infinity, c.end + 1.2, total - 0.1);
  });
  const blackout = w.transition === 'blackout' ? smooth(w.end - 0.5, w.end - 0.3, t) : 0;
  const scale = 900 / Math.max(65, total);

  return (
    <AbsoluteFill style={{background: `linear-gradient(${top}, ${bottom})`}}>
      <Html5Audio src={staticFile(timing.audio)} />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: MONTSERRAT, fontWeight: 600, fontSize: 28, color: '#ffffff99', letterSpacing: 2}}>
        ANIMATIC · PART {part.part} · {part.title.toUpperCase()}
      </div>
      <div style={{position: 'absolute', top: 175, width: '100%', textAlign: 'center', fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 36, color: '#fff'}}>
        {w.id} · {w.location.replace(/_/g, ' ')} · {w.camera}
      </div>

      {cap ? (
        <div style={{position: 'absolute', top: 330, left: 70, right: 70, textAlign: 'center'}}>
          {cap.speaker === 'desk' ? (
            <div style={{fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 30, color: '#ffb02e', letterSpacing: 3, marginBottom: 6}}>
              ◉ RADIO · {cap.variant === 'recorded' ? 'RECORDING' : 'LIVE'}
            </div>
          ) : <div style={{height: 42}} />}
          <div style={{fontFamily: ANTON, fontSize: 92, lineHeight: 1.04, textTransform: 'uppercase', textShadow: outline,
            color: cap.speaker === 'desk' ? '#ffd27a' : '#fff', transform: `scale(${0.94 + 0.06 * progress(t, cap.start - 0.05, 0.12)})`}}>
            {cap.text}
          </div>
        </div>
      ) : null}

      <div style={{position: 'absolute', top: 700, left: 90, right: 90, fontFamily: MONTSERRAT, fontWeight: 500, fontSize: 44, lineHeight: 1.3, color: '#ffffffd0', opacity: smooth(0, 0.3, age)}}>
        {w.beat}
      </div>
      <div style={{position: 'absolute', top: 1030, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center'}}>
        {w.clues.filter((c) => c !== 'SOS').map((c, n) => (
          <div key={c} style={{fontFamily: ANTON, fontSize: 64, color: '#fff', background: '#0d0d12d8', border: '4px solid #ffb02e', borderRadius: 10, padding: '6px 26px',
            opacity: smooth(0.2 + n * 0.5, 0.45 + n * 0.5, age)}}>
            {c}
          </div>
        ))}
      </div>

      {w.signal === 'sos' || w.signal === 'answered' ? <Lamp x={880} y={620} r={26} on={lampOn} label="ridge lamp (SOS)" /> : null}
      {w.signal === 'carried' ? <Lamp x={880} y={620} r={18} on label="lamp carried" /> : null}
      {w.signal === 'answered'
        ? [0, 1, 2].map((n) => {
            const at = wins.find((x) => x.signal === 'answered')!.start + 0.4 + n * 1.6;
            return t >= at ? <Lamp key={n} x={150 + n * 150} y={1440 - n * 40} r={14} on={sosOn((t - at) * fps + n * 37)} /> : null;
          })
        : null}

      <div style={{position: 'absolute', top: 1560, left: 90, width: 900, height: 200}}>
        {wins.map((s, n) => (
          <React.Fragment key={s.id}>
            <div style={{position: 'absolute', left: s.target[0] * scale, width: (s.target[1] - s.target[0]) * scale - 2, top: 0, height: 30,
              border: '2px solid #ffffff80', boxSizing: 'border-box', color: '#ffffffa0', fontFamily: MONTSERRAT, fontSize: 18, paddingLeft: 4}}>{n + 1}</div>
            <div style={{position: 'absolute', left: s.start * scale, width: (s.end - s.start) * scale - 2, top: 40, height: 30,
              background: n === i ? '#ffb02e' : n % 2 ? '#ffffff55' : '#ffffff33', color: '#000', fontFamily: MONTSERRAT, fontSize: 18, paddingLeft: 4}}>{n + 1}</div>
          </React.Fragment>
        ))}
        <div style={{position: 'absolute', left: t * scale, top: -6, width: 4, height: 82, background: '#ff3b3b'}} />
        <div style={{position: 'absolute', top: 84, width: 900, fontFamily: MONTSERRAT, fontSize: 22, color: '#ffffffa0', display: 'flex', justifyContent: 'space-between'}}>
          <span>outline = target · filled = measured</span>
          <span>{t.toFixed(1)} / {total.toFixed(1)} s</span>
        </div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: blackout}} />
      <div style={{position: 'absolute', top: 1480, width: W, textAlign: 'center', fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 30, color: '#ff6b6b', opacity: blackout}}>BLACKOUT</div>
    </AbsoluteFill>
  );
};
