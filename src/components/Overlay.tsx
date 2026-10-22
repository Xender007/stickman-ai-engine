import React from 'react';
import {AbsoluteFill} from 'remotion';
import {RED} from '../config';
import {ANTON, MONTSERRAT} from '../fonts';
import {progress, smooth} from '../lib/anim';
import type {Phrase} from '../episode/timing';

const outline = (px: number) =>
  [
    `${px}px ${px}px 0 #000`, `-${px}px ${px}px 0 #000`, `${px}px -${px}px 0 #000`, `-${px}px -${px}px 0 #000`,
    `0 ${px + 2}px 0 #000`, `0 ${px * 3}px ${px * 6}px rgba(0,0,0,.55)`,
  ].join(',');

/** One phrase at a time, top third, held until the next phrase (max 1.2s after it is spoken), crossfaded. */
export const Captions: React.FC<{phrases: Phrase[]; t: number; until: number}> = ({phrases, t, until}) => (
  <AbsoluteFill>
    {phrases.map((p, i) => {
      const next = phrases[i + 1];
      const inAt = p.start - 0.05;
      const outAt = Math.min(next ? next.start - 0.05 : Infinity, p.end + 1.2, until - 0.1);
      const opacity = Math.min(smooth(inAt, inAt + 0.1, t), 1 - smooth(outAt, outAt + 0.12, t));
      if (opacity <= 0) return null;
      return (
        <div key={i} style={{
          position: 'absolute', top: 360, left: 70, right: 70, textAlign: 'center',
          fontFamily: ANTON, fontSize: 92, lineHeight: 1.04, color: '#fff', textTransform: 'uppercase',
          opacity, transform: `scale(${0.94 + 0.06 * progress(t, inAt, 0.12)})`, textShadow: outline(3),
        }}>
          {p.text}
        </div>
      );
    })}
  </AbsoluteFill>
);

/** "● 5:58 AM" badge with a blinking record dot. */
export const ClockBadge: React.FC<{text: string; t: number; until: number}> = ({text, t, until}) => {
  const opacity = 1 - smooth(until, until + 0.5, t);
  if (opacity <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 262, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: 14, opacity, fontFamily: MONTSERRAT, fontWeight: 700, fontSize: 40, color: '#fff',
      textShadow: '0 2px 6px rgba(0,0,0,.6)',
    }}>
      <span style={{width: 16, height: 16, borderRadius: 8, background: '#ff2b2b', opacity: t % 1 < 0.55 ? 1 : 0.25}} />
      {text}
    </div>
  );
};

/** TIME TO IMPACT countdown: pops on every tick, red → amber for the last three. */
export const Countdown: React.FC<{t: number; start: number; from: number}> = ({t, start, from}) => {
  const age = t - start;
  if (age < 0 || age >= from) return null;
  const n = from - Math.floor(age);
  const pop = 1.18 - 0.18 * progress(age % 1, 0, 0.18);
  return (
    <div style={{position: 'absolute', top: 690, width: '100%', display: 'flex', justifyContent: 'center', opacity: smooth(0, 0.2, age)}}>
      <div style={{padding: '10px 44px 4px', borderRadius: 30, textAlign: 'center', background: 'rgba(8,6,12,.62)',
        border: `3px solid ${n <= 3 ? '#ffb02e88' : '#e8202a88'}`, boxShadow: `0 0 40px ${n <= 3 ? '#ffb02e44' : '#e8202a44'}`}}>
        <div style={{fontFamily: MONTSERRAT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: '#f3d4d4'}}>⚠ TIME TO IMPACT</div>
        <div style={{fontFamily: ANTON, fontSize: 150, lineHeight: 1.05, color: n <= 3 ? '#ffb02e' : RED, transform: `scale(${pop})`, textShadow: `0 0 28px ${n <= 3 ? '#ffb02e' : '#e8202a'}aa`}}>
          0:{String(n).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

/** "PART 2?" card over the dimmed last frame. */
export const EndCard: React.FC<{t: number; at: number; title: string; subtitle: string}> = ({t, at, title, subtitle}) => {
  const age = t - at;
  if (age < 0) return null;
  const bar = progress(age, 0.15, 0.35);
  return (
    <AbsoluteFill style={{backgroundColor: `rgba(6,4,6,${0.78 * smooth(0, 0.35, age)})`}}>
      <div style={{
        position: 'absolute', top: 740, width: '100%', textAlign: 'center', fontFamily: ANTON, fontSize: 250,
        lineHeight: 1, color: '#fff', textShadow: outline(6), opacity: Math.min(1, age / 0.08),
        transform: `scale(${1.25 - 0.25 * progress(age, 0, 0.2)})`,
      }}>
        {title}
      </div>
      <div style={{position: 'absolute', top: 1035, left: 540 - 170 * bar, width: 340 * bar, height: 12, background: RED, borderRadius: 3}} />
      <div style={{
        position: 'absolute', top: 1085, width: '100%', textAlign: 'center', fontFamily: MONTSERRAT, fontWeight: 800,
        fontSize: 46, letterSpacing: 1, color: '#fff', opacity: smooth(0.7, 1, age),
      }}>
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
