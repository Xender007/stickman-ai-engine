/** 16:9 time-driven scene engine (1280x720). A scene is a pure function of its context, so seeking is order-independent.
 *  Scene cuts are keyed to sentence numbers from assets/sentences.json. The caption band (y>=600) is reserved for the narration. */
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

export const W = 1280, H = 720;
/** drawing is done in 1280x720 units; the svg is output at 1.5x so the composition is full HD (1920x1080) */
const OUT = 1.5;
export type Ctx = {
  t: number; lt: number; d: number; p: number;
  /** local seconds (relative to the scene start) when chapter sentence i starts / ends */
  s: (i: number) => number; e: (i: number) => number;
};
export type SceneDef = { at: number; el: (c: Ctx) => React.ReactNode; push?: [number, number]; card?: boolean };
export type Cue = [sentence: number, offset: number, kind: string, a?: number];
export type Chapter = { n: number; label: string; scenes: SceneDef[]; cues: Cue[]; ending?: boolean };
export type Sent = { text: string; start: number; end: number };

const FONT = { fontFamily: 'Patrick Hand, sans-serif', fontWeight: 700 } as const;
export function sceneStarts(ch: Chapter, sents: Sent[]): number[] {
  return ch.scenes.map((s, i) => (i === 0 ? 0 : sents[Math.min(s.at, sents.length - 1)].start - 0.12));
}

const Grain: React.FC = () => (
  <>
    <defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.22 0" /></filter></defs>
    <rect width={W} height={H} filter="url(#grain)" opacity={0.45} style={{ mixBlendMode: 'multiply' }} />
  </>
);
const Vig: React.FC = () => (
  <>
    <defs>
      <radialGradient id="vg" cx="0.5" cy="0.45" r="0.8"><stop offset="0.55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#1a1020" stopOpacity={0.45} /></radialGradient>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0610" stopOpacity={0} /><stop offset="1" stopColor="#0a0610" stopOpacity={0.62} /></linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#vg)" />
  </>
);

/** one frame of the chapter at time t (seconds) as an <svg> element */
export function frame(ch: Chapter, sents: Sent[], total: number, t: number, starts = sceneStarts(ch, sents)) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  let n = 0;
  for (let i = 0; i < starts.length; i++) if (t >= starts[i]) n = i;
  const def = ch.scenes[n];
  const a = starts[n], b = n + 1 < starts.length ? starts[n + 1] : total;
  const ix = (i: number) => sents[Math.min(i, sents.length - 1)];
  const c: Ctx = { t, lt: t - a, d: b - a, p: clamp((t - a) / (b - a)), s: (i) => ix(i).start - a, e: (i) => ix(i).end - a };
  const push = def.push ?? [1, 1.04];
  const z = push[0] + (push[1] - push[0]) * c.p;
  const labelIn = clamp((t - 0.3) / 0.4) * (1 - clamp((t - 3.4) / 0.5));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W * OUT} height={H * OUT} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: '#000' }}>
      <g transform={def.card ? undefined : `translate(${W / 2} ${H * 0.4}) scale(${z}) translate(${-W / 2} ${-H * 0.4})`}>{def.el(c)}</g>
      <Grain />
      {!def.card && <Vig />}
      <rect y={560} width={W} height={160} fill="url(#scrim)" />
      {ch.n > 0 && labelIn > 0 && (
        <g opacity={labelIn} transform={`translate(${(1 - labelIn) * -30} 0)`}>
          <rect x={24} y={22} width={400} height={74} rx={12} fill="#2a2220" opacity={0.88} />
          <text x={44} y={50} textAnchor="start" {...FONT} fontSize={20} fill="#d9b04a" letterSpacing={5}>CHAPTER {ch.n}</text>
          <text x={44} y={84} textAnchor="start" {...FONT} fontSize={32} fill="#f6f1e2" letterSpacing={2}>{ch.label}</text>
        </g>
      )}
      {t < 0.5 && <rect width={W} height={H} fill="#0e0a1c" opacity={1 - t / 0.5} />}
    </svg>
  );
}

export function mountChapter(el: HTMLElement, ch: Chapter, sents: Sent[], total: number) {
  const starts = sceneStarts(ch, sents);
  const root = createRoot(el);
  return (t: number) => { flushSync(() => root.render(frame(ch, sents, total, t, starts))); };
}
