import React from 'react';
import { Composition, Sequence, registerRoot, useCurrentFrame } from 'remotion';
import { Caption, FPS, H, W, clamp, prog } from './common.tsx';
import { Clip1 } from './clip1.tsx';
import { Clip2, Clip3 } from './clip23.tsx';
import { Clip4, Clip5, Clip6 } from './clip456.tsx';

export type Phrase = { text: string; start: number; end: number };
export type Props = { captions: Phrase[][]; overlays: boolean };

const CLIP = 240;
const clips = [Clip1, Clip2, Clip3, Clip4, Clip5, Clip6];

const Inner: React.FC<{ Comp: React.FC<{ f: number }> }> = ({ Comp }) => {
  const f = useCurrentFrame();
  return <Comp f={f} />;
};

const Overlay: React.FC<{ text: string; y: number; a: number; b: number; size?: number; color?: string }> = ({ text, y, a, b, size = 64, color = '#fff' }) => {
  const f = useCurrentFrame() / FPS;
  if (f < a || f > b) return null;
  const o = clamp(Math.min((f - a) / 0.15, (b - f) / 0.2));
  return <text x={W / 2 - 20} y={y} textAnchor="middle" opacity={o} fontFamily="Arial Black, Impact, sans-serif" fontWeight={900} fontSize={size}
    fill={color} stroke="#000" strokeWidth={10} paintOrder="stroke" strokeLinejoin="round">{text}</text>;
};

const Part1: React.FC<Props> = ({ captions, overlays }) => {
  const f = useCurrentFrame();
  const fade = f < 3 ? f / 3 : 1;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ background: '#000' }}>
      <g opacity={fade}>
        {clips.map((C, i) => (
          <Sequence key={i} from={i * CLIP} durationInFrames={CLIP} layout="none">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><Inner Comp={C} /></svg>
          </Sequence>
        ))}
      </g>
      {/* captions (middle third) */}
      {captions.map((ph, i) => ph.map((p, k) => {
        const t = f / FPS - i * 10;
        if (t < p.start || t > p.end) return null;
        const lines = wrap(p.text, 18);
        return <g key={`${i}-${k}`}>{lines.map((ln, j) => <Caption key={j} text={ln} y={760 + j * 54 - ((lines.length - 1) * 27)} />)}</g>;
      }))}
      {overlays && (
        <g>
          <Sequence from={0} durationInFrames={2 * FPS}><Overlay text="WHO'S KNOCKING?" y={190} a={0} b={2} size={62} color="#ffe14a" /></Sequence>
          <Overlay text="DAY 1" y={190} a={3} b={6} color="#ff4a4a" />
          <Overlay text="DAY 2" y={190} a={30} b={33} color="#ff4a4a" />
          <Overlay text="NIGHT 3" y={190} a={40} b={43} color="#ff4a4a" />
          <Overlay text="PART 2 →" y={300} a={57.5} b={60} size={72} color="#ffe14a" />
          <text x={560} y={72} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={28} fill="#fff" stroke="#000" strokeWidth={6} paintOrder="stroke">PART 1/5</text>
        </g>
      )}
    </svg>
  );
};

function wrap(text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

const Root: React.FC = () => (
  <Composition id="Part1" component={Part1} width={W} height={H} fps={FPS} durationInFrames={CLIP * 6}
    defaultProps={{ captions: [[], [], [], [], [], []], overlays: true } as Props} />
);

registerRoot(Root);
export { prog };
