/** Time-driven scene engine for chapters 2-6 (chapter 1 keeps its channel-based choreo in clips/store-ch1).
 *  A scene is a pure function of the scene context (global t, local lt, duration d, progress p and the sentence times),
 *  so nothing has to be seeked in order. Scene cuts are keyed to sentence numbers from assets/sentences.json. */
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Grain, H, Vig, W } from '../store-ch1/props.tsx';

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

/** one frame of the chapter at time t (seconds) as an <svg> element */
export function frame(ch: Chapter, sents: Sent[], total: number, t: number, starts = sceneStarts(ch, sents)) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  let n = 0;
  for (let i = 0; i < starts.length; i++) if (t >= starts[i]) n = i;
  const def = ch.scenes[n];
  const a = starts[n], b = n + 1 < starts.length ? starts[n + 1] : total;
  const ix = (i: number) => sents[Math.min(i, sents.length - 1)];
  const c: Ctx = { t, lt: t - a, d: b - a, p: clamp((t - a) / (b - a)), s: (i) => ix(i).start - a, e: (i) => ix(i).end - a };
  const push = def.push ?? [1, 1.06];
  const z = push[0] + (push[1] - push[0]) * c.p;
  const labelIn = clamp((t - 0.3) / 0.4) * (1 - clamp((t - 3.2) / 0.5));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: '#000' }}>
      <g transform={def.card ? undefined : `translate(${W / 2} ${H * 0.45}) scale(${z}) translate(${-W / 2} ${-H * 0.45})`}>{def.el(c)}</g>
      <Grain />
      {!def.card && <Vig />}
      {ch.n > 1 && labelIn > 0 && (
        <g opacity={labelIn} transform={`translate(0 ${(1 - labelIn) * -14})`}>
          <rect x={110} y={52} width={500} height={92} rx={14} fill="#2a2220" opacity={0.86} />
          <text x={W / 2} y={88} textAnchor="middle" {...FONT} fontSize={26} fill="#d9b04a" letterSpacing={6}>CHAPTER {ch.n}</text>
          <text x={W / 2} y={126} textAnchor="middle" {...FONT} fontSize={38} fill="#f6f1e2" letterSpacing={3}>{ch.label}</text>
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
