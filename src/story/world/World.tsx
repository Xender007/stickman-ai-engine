import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {H, W} from '../../config';
import {ANTON, MONTSERRAT} from '../../fonts';
import type {StoryScene} from '../schema';
import {BAKERY_X, ESCAPE, FLOOR_H, LAMP, LANDING, MARK_Y, MAST, PERSON, STATION, TALL, TOWN, terrainY} from './geo';
import {PersonScale} from '../Cast';
import {WaveWall} from '../../fx/Wave';
import {Clouds, Vista} from './Vista';
import {Look, mixColor} from './look';

export type Cam = {x: number; y: number; z: number};
/** Screen point the camera centre maps to. */
const CX = W / 2;
const CY = 1150;

export type WaterState = {
  level: number; // surface height (world y)
  front?: number; // an advancing surge: no water right of this x
  turb: number; // 0 calm .. 1 violent
  wallH?: number; // height of the surge wall above the water level (default: derived from the slope)
  flow: number; // debris drift, px/s (+ inland, - seaward)
};

export type WorldProps = {
  cam: Cam;
  t: number;
  look: Look;
  lights?: number; // town power, 1 on .. 0 off
  wrecked?: boolean;
  mark?: boolean; // the first surge's wet line on the mast and trees
  mast: StoryScene['mast'];
  lean?: number; // degrees, negative = toward the sea
  braceFall?: number | null; // seconds since the brace tore loose
  water: WaterState;
  lamp?: boolean; // ridge lamp lit right now
  children?: React.ReactNode; // actors, in world coordinates
  fg?: React.ReactNode; // world-space effects drawn over the actors
  shake?: number;
  collapse?: {x: number; k: number}[]; // buildings over these points fold (0..1)
  behind?: React.ReactNode; // world-space structures drawn behind the water (refuges on high ground)
  wall?: number | null; // crest height (screen y) of a tsunami rising behind the skyline
  vista?: {flood: number; lights: number} | null; // the city spreading to the horizon behind the world
  clouds?: number; // storm clouds, 0..1
  tower?: boolean; // the harbor tower (hidden until the story reveals it)
};

export const WorldDefs: React.FC<{look: Look; level: number; surge?: boolean}> = ({look, level, surge = false}) => (
  <defs>
    <linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={look.skyTop} />
      <stop offset="1" stopColor={look.skyBottom} />
    </linearGradient>
    <linearGradient id="wWater" gradientUnits="userSpaceOnUse" x1="0" y1={level - 300} x2="0" y2={level + 600}>
      <stop offset="0" stopColor={surge ? '#5fb0b6' : mixColor(look.waterHi, look.foam, 0.12)} />
      <stop offset="0.35" stopColor={surge ? '#3b8a92' : look.waterHi} />
      <stop offset="0.7" stopColor={surge ? '#1a4a52' : look.water} />
      <stop offset="1" stopColor={mixColor(look.water, '#000000', 0.45)} />
    </linearGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3b8a92" />
      <stop offset="1" stopColor="#0f2a33" />
    </linearGradient>
    <linearGradient id="wSurge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#5fb0b6" />
      <stop offset="0.35" stopColor="#3b8a92" />
      <stop offset="1" stopColor="#0f2a33" />
    </linearGradient>
    <linearGradient id="wFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
      <stop offset="0.6" stopColor={look.foam} stopOpacity={0.55} />
      <stop offset="1" stopColor={look.foam} stopOpacity={0.15} />
    </linearGradient>
    <radialGradient id="wGlow">
      <stop offset="0" stopColor="#fff1c4" stopOpacity={0.95} />
      <stop offset="0.35" stopColor="#ffd98a" stopOpacity={0.45} />
      <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="wVignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.6} />
    </radialGradient>
    <filter id="glowWide" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={10} /></filter>
    <filter id="glowTight" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={2.5} /></filter>
    <filter id="wSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
  </defs>
);

// ---------- town ----------
type Bld = {x: number; w: number; h: number; seed: string; bakery?: boolean};
const BUILDINGS: Bld[] = (() => {
  const out: Bld[] = [];
  let x = TOWN.from;
  let i = 0;
  while (x < TOWN.to) {
    if (Math.abs(x - BAKERY_X) < 200 && !out.some((b) => b.bakery)) {
      out.push({x: BAKERY_X - 95, w: 190, h: 215, seed: 'bakery', bakery: true});
      x = BAKERY_X + 95 + 24;
      continue;
    }
    const s = `b${i++}`;
    const w = 150 + random(s + 'w') * 110;
    if (x + w > TOWN.to) break;
    const clear = [{x: BAKERY_X - 120, w: 240}, {x: STATION.x - 20, w: STATION.w + 80}, ...TALL.map((b) => ({x: b.x - 20, w: b.w + 40}))];
    if (!clear.some((c) => x + w > c.x && x < c.x + c.w)) out.push({x, w, h: 230 + random(s + 'h') * 240, seed: s});
    x += w + 14 + random(s + 'g') * 26;
  }
  return out;
})();

/** Ordinary buildings on the harbor tower's plot, shown while the story keeps the tower out of sight. */
const GAP: Bld[] = [
  {x: STATION.x - 10, w: 210, h: 400, seed: 'gap0'},
  {x: STATION.x + 220, w: 230, h: 320, seed: 'gap1'},
];

const Building: React.FC<{b: Bld; look: Look; lights: number; wrecked: boolean; t: number; fall: number; smash?: number}> = ({b, look, lights, wrecked, t, fall, smash = 0}) => {
  const base = TOWN.ground;
  const h = (wrecked && !b.bakery ? b.h * (0.42 + 0.35 * random(b.seed + 'r')) : wrecked ? b.h * 0.7 : b.h) * (1 - (0.4 + 0.45 * smash) * fall);
  const tilt = (wrecked ? (random(b.seed + 't') - 0.5) * 9 : 0) + fall * (random(b.seed + 'f') < 0.5 ? -1 : 1) * (13 + 22 * smash);
  const cols = Math.max(2, Math.floor((b.w - 20) / 34));
  const rows = Math.max(1, Math.floor((h - 40) / 44));
  const wins: React.ReactNode[] = [];
  if (!b.bakery) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = `${b.seed}w${r}-${c}`;
        const on = random(s) < 0.42 && lights > noise2D(s, t * 3, 0) * 0.5 + 0.5 * (1 - lights);
        wins.push(<rect key={s} x={b.x + 14 + c * 34} y={base - h + 22 + r * 44} width={18} height={24} fill={on && lights > 0.02 ? look.townLit : '#00000040'} />);
      }
    }
  }
  return (
    <g transform={`rotate(${tilt} ${b.x + b.w / 2} ${base})`}>
      <rect x={b.x} y={base - h} width={b.w} height={h + 4} fill={look.town} />
      {wrecked ? <path d={`M${b.x} ${base - h}l${b.w * 0.3} -18l${b.w * 0.25} 22l${b.w * 0.2} -12l${b.w * 0.25} 8`} fill={look.town} /> : null}
      {wins}
      {b.bakery ? (
        <g>
          <rect x={b.x + 18} y={base - 120} width={70} height={116} fill={lights > 0.02 ? '#ffcf86' : '#00000050'} opacity={0.35 + 0.65 * lights} />
          <rect x={b.x + 110} y={base - 110} width={58} height={106} fill="#0a0a0f" />
          <path d={`M${b.x - 8} ${base - 150}h${b.w + 16}l-16 24h${-(b.w - 16)}z`} fill="#7a2b2b" />
          {!wrecked ? <text x={b.x + b.w / 2} y={base - 165} textAnchor="middle" fontFamily={ANTON} fontSize={34} fill="#f1e2c4">BAKERY 4</text> : null}
        </g>
      ) : null}
    </g>
  );
};

const StreetLamps: React.FC<{look: Look; lights: number}> = ({look, lights}) => (
  <g>
    {Array.from({length: 8}, (_, i) => {
      const x = TOWN.from + 120 + i * 260;
      return (
        <g key={i}>
          <rect x={x - 3} y={TOWN.ground - 150} width={6} height={150} fill={look.steel} />
          <rect x={x - 3} y={TOWN.ground - 150} width={34} height={6} fill={look.steel} />
          {lights > 0.02 ? <circle cx={x + 30} cy={TOWN.ground - 140} r={60} fill="url(#wGlow)" opacity={0.5 * lights} /> : null}
        </g>
      );
    })}
  </g>
);

// ---------- hills, trees, structures ----------
const TREES = [
  ...Array.from({length: 16}, (_, i) => ({x: 3360 + i * 64 + random(`tg${i}`) * 30, h: 150 + random(`th${i}`) * 110})),
  ...Array.from({length: 9}, (_, i) => ({x: 4560 + i * 115 + random(`tt${i}`) * 50, h: 130 + random(`tu${i}`) * 90})),
  ...Array.from({length: 18}, (_, i) => ({x: 6150 + i * 90 + random(`tr${i}`) * 40, h: 170 + random(`ts${i}`) * 120})),
];

const Pine: React.FC<{x: number; h: number; fill: string; mark: boolean; t: number; sway: number}> = ({x, h, fill, mark, t, sway}) => {
  const y = terrainY(x);
  const lean = sway * noise2D(`p${x}`, t * 0.8, 0) * 4;
  return (
    <g transform={`rotate(${lean} ${x} ${y})`}>
      <rect x={x - 5} y={y - h * 0.3} width={10} height={h * 0.3 + 6} fill={fill} />
      {[0, 1, 2].map((k) => {
        const ty = y - h * (0.22 + k * 0.26);
        const tw = (h * 0.42) * (1 - k * 0.24);
        return <path key={k} d={`M${x - tw} ${ty + h * 0.12}L${x} ${ty - h * 0.3}L${x + tw} ${ty + h * 0.12}Z`} fill={fill} />;
      })}
      {mark && y > MARK_Y ? <rect x={x - 7} y={MARK_Y - 2} width={14} height={5} fill="#00000088" /> : null}
    </g>
  );
};

const Mast: React.FC<{look: Look; t: number; state: StoryScene['mast']; lean: number; mark: boolean; braceFall: number | null}> = ({
  look, t, state, lean, mark, braceFall,
}) => {
  const {x, baseY, height} = MAST;
  const top = baseY - height;
  const half = (y: number) => 12 + 58 * ((y - top) / height);
  const seg = 64;
  const d: string[] = [`M${x - half(baseY)} ${baseY}L${x - 12} ${top}`, `M${x + half(baseY)} ${baseY}L${x + 12} ${top}`];
  const broken = (i: number) => state !== 'intact' && (i === 1 || i === 2);
  const tornBrace = 4; // the member that tears loose in Part 2
  for (let i = 0; i < Math.floor(height / seg); i++) {
    const y1 = baseY - i * seg;
    const y2 = y1 - seg;
    if (broken(i)) {
      d.push(`M${x - half(y1)} ${y1}L${x - half(y1) * 0.2} ${y1 - seg * 0.45}`, `M${x + half(y1)} ${y1}L${x + half(y1) * 0.35} ${y1 - seg * 0.3}`);
    } else if (!(state === 'brace-failed' && i === tornBrace)) {
      d.push(`M${x - half(y1)} ${y1}L${x + half(y2)} ${y2}`, `M${x + half(y1)} ${y1}L${x - half(y2)} ${y2}`);
    }
    d.push(`M${x - half(y2)} ${y2}L${x + half(y2)} ${y2}`);
  }
  // Ladder up the centre.
  const rungs: string[] = [`M${x - 9} ${baseY}L${x - 9} ${top + 20}`, `M${x + 9} ${baseY}L${x + 9} ${top + 20}`];
  for (let y = baseY - 20; y > top + 20; y -= 26) rungs.push(`M${x - 9} ${y}L${x + 9} ${y}`);
  const blink = t % 1.6 < 0.5;
  const y1 = baseY - tornBrace * seg;
  const fall = braceFall ?? -1;
  return (
    <g>
      <g transform={`rotate(${lean} ${x} ${baseY})`}>
        <path d={d.join('')} stroke={look.steel} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={rungs.join('')} stroke={look.steel} strokeWidth={4} fill="none" />
        <rect x={x - 60} y={top + height * 0.2} width={120} height={9} fill={look.steel} />
        <rect x={x - 3} y={top - 110} width={6} height={112} fill={look.steel} />
        <circle cx={x} cy={top - 112} r={7} fill={blink ? '#ff3b3b' : '#4a1414'} />
        {mark ? <rect x={x - half(MARK_Y) - 6} y={MARK_Y - 3} width={half(MARK_Y) * 2 + 12} height={6} fill="#00000070" /> : null}
      </g>
      {fall >= 0 ? (
        <g transform={`translate(${-60 * fall} ${Math.min(500, 260 * fall * fall)}) rotate(${-50 * fall} ${x} ${y1})`} opacity={Math.max(0, 1 - fall / 2.4)}>
          <path d={`M${x - half(y1)} ${y1}L${x + half(y1 - seg)} ${y1 - seg}`} stroke={look.steel} strokeWidth={7} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

const Landing: React.FC<{look: Look}> = ({look}) => {
  const {y, from, to} = LANDING;
  return (
    <g>
      <rect x={from + 30} y={y} width={to - from - 10} height={12} fill={look.steel} />
      {Array.from({length: 6}, (_, i) => <rect key={i} x={from + 50 + i * 52} y={y - 46} width={5} height={46} fill={look.steel} />)}
      <rect x={from + 50} y={y - 48} width={to - from - 40} height={5} fill={look.steel} />
      {Array.from({length: 3}, (_, i) => <rect key={`s${i}`} x={from + 80 + i * 100} y={y + 10} width={6} height={terrainY(from + 80 + i * 100) - y} fill={look.steel} />)}
    </g>
  );
};

/** The fire escape: a landing at every floor, flights with treads, a handrail and posts, brackets into the wall. */
const FireEscape: React.FC<{look: Look}> = ({look}) => {
  const base = TOWN.ground;
  const {x0, x1} = ESCAPE;
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const yA = base - i * FLOOR_H;
    const yB = yA - FLOOR_H;
    const [sx, ex] = i % 2 === 0 ? [x0 + 26, x1 - 26] : [x1 - 26, x0 + 26];
    const treads = Array.from({length: 9}, (_, k) => {
      const q = (k + 0.5) / 9;
      return `M${sx + (ex - sx) * q - 9} ${yA + (yB - yA) * q}h18`;
    }).join('');
    parts.push(
      <g key={i}>
        <path d={`M${sx} ${yA}L${ex} ${yB}`} stroke={look.steel} strokeWidth={7} />
        <path d={treads} stroke={look.steel} strokeWidth={5} />
        <path d={`M${sx} ${yA - 46}L${ex} ${yB - 46}`} stroke={look.steel} strokeWidth={3} opacity={0.9} />
      </g>,
    );
  }
  for (let i = 1; i <= 14; i++) {
    const y = base - i * FLOOR_H;
    parts.push(
      <g key={`l${i}`}>
        <rect x={x0 - 8} y={y - 2} width={x1 - x0 + 16} height={8} fill={look.steel} />
        <path d={`M${x0 - 8} ${y - 46}H${x1 + 8}M${x0 - 6} ${y}V${y - 46}M${x1 + 6} ${y}V${y - 46}M${(x0 + x1) / 2} ${y}V${y - 46}`} stroke={look.steel} strokeWidth={3} />
        <path d={`M${STATION.x + STATION.w} ${y + 4}L${x0 - 8} ${y + 4}M${STATION.x + STATION.w} ${y + 30}L${x0} ${y + 4}`} stroke={look.steel} strokeWidth={4} />
      </g>,
    );
  }
  return <g>{parts}</g>;
};

/** A tall building that stays above the water: a window row per floor. The harbor tower also has the fire escape. */
const Tall: React.FC<{x: number; w: number; roof: number; look: Look; lights: number; mark: boolean; t: number; station?: boolean}> = ({
  x, w, roof, look, lights, mark, t, station = false,
}) => {
  const base = TOWN.ground;
  const floors = Math.floor((base - roof) / FLOOR_H);
  const cols = Math.floor((w - 30) / 52);
  const body = mixColor(look.town, '#ffffff', station ? 0.1 : 0.07);
  return (
    <g>
      <rect x={x} y={roof} width={w} height={base - roof + 4} fill={body} />
      <rect x={x - 10} y={roof - 14} width={w + 20} height={16} fill={body} />
      {Array.from({length: floors}, (_, fl) => (
        <g key={fl}>
          <rect x={x} y={base - (fl + 1) * FLOOR_H} width={w} height={3} fill="#00000030" />
          {Array.from({length: cols}, (_, cc) => {
            const s2 = `tw${x}-${fl}-${cc}`;
            const on = random(s2) < 0.4 && lights > 0.5;
            return <rect key={cc} x={x + 22 + cc * 52} y={base - (fl + 1) * FLOOR_H + 34} width={30} height={60} fill={on ? look.townLit : '#00000045'} />;
          })}
        </g>
      ))}
      {mark && roof < MARK_Y ? <rect x={x - 2} y={MARK_Y - 4} width={w + 4} height={8} fill="#00000070" /> : null}
      {!station ? (
        <g>
          <rect x={x - 10} y={roof - 30} width={w + 20} height={16} fill={body} stroke="#e8dccb" strokeOpacity={0.35} strokeWidth={3} />
          <rect x={x + 30} y={roof - 110} width={70} height={80} fill={body} />
          <rect x={x + 44} y={roof - 92} width={26} height={62} fill="#0a0a0d" />
          <ellipse cx={x + w - 60} cy={roof - 120} rx={34} ry={44} fill={mixColor(body, '#000000', 0.25)} />
          <path d={`M${x + w - 86} ${roof - 30}V${roof - 82}M${x + w - 34} ${roof - 30}V${roof - 82}`} stroke={look.steel} strokeWidth={6} />
        </g>
      ) : null}
      {station ? (
        <g>
          <FireEscape look={look} />
          <text x={x + w / 2} y={roof + 40} textAnchor="middle" fontFamily={MONTSERRAT} fontWeight={800} fontSize={34} fill="#d8c79c" opacity={0.8}>HARBOR TOWER</text>
          <rect x={x + w / 2 - 55} y={base - 150} width={110} height={150} fill="#0a0a0d" />
          <rect x={x + w - 60} y={roof - 230} width={7} height={230} fill={look.steel} />
          <circle cx={x + w - 57} cy={roof - 232} r={8} fill={t % 1.6 < 0.5 ? '#ff3b3b' : '#4a1414'} />
        </g>
      ) : null}
    </g>
  );
};

/** One SOS lamp's light, drawn in world space so it reads at every zoom. */
export const LampGlow: React.FC<{x: number; y: number; on: boolean; z: number}> = ({x, y, on, z}) => {
  if (!on) return null;
  // Sized in screen pixels so the signal reads as clearly in a wide shot as in a close one.
  const px = (n: number) => n / z;
  return (
    <g>
      <circle cx={x} cy={y} r={px(150)} fill="url(#wGlow)" />
      {[0, 45, 90, 135].map((a) => (
        <rect key={a} x={x - px(110)} y={y - px(3)} width={px(220)} height={px(6)} fill="#fff1c4" opacity={0.5} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={px(16)} fill="#fffbe8" />
    </g>
  );
};

// ---------- water ----------
/** Height of a surge wall at its front, where the water is deep; it shrinks as the front runs up a slope. */
const BORE = 760;
const faceK = (a: number, b: number, x: number) => Math.pow(Math.min(1, Math.max(0, (x - a) / (b - a))), 2.4);
const boreHeight = (w: WaterState) =>
  w.front === undefined ? 0 : w.wallH !== undefined ? w.wallH : BORE * w.turb * Math.min(1, Math.max(0.3, (terrainY(w.front) - w.level) / 330));
/** Width of the wall's sloping back: wider for taller walls. */
const rampOf = (w: WaterState) => 400 + 0.45 * boreHeight(w);

export const surfaceAt = (w: WaterState, x: number, t: number) =>
  w.level + (6 + 18 * w.turb) * noise2D('wsurf', x * 0.006 - t * 0.25 * Math.sign(w.flow || 1), t * 0.5) -
  (w.front !== undefined ? boreHeight(w) * faceK(w.front - rampOf(w), w.front - 60, x) : 0);

const hasWater = (w: WaterState, x: number, t: number) => terrainY(x) > surfaceAt(w, x, t) && (w.front === undefined || x < w.front);

const Water: React.FC<{w: WaterState; t: number; x0: number; x1: number; look: Look}> = ({w, t, x0, x1, look}) => {
  const step = 14;
  const runs: number[][] = [];
  let run: number[] | null = null;
  for (let x = x0; x <= x1; x += step) {
    if (hasWater(w, x, t)) {
      if (!run) runs.push((run = []));
      run.push(x);
    } else run = null;
  }
  const debris = Array.from({length: 16}, (_, i) => {
    const s = `deb${i}`;
    const span = 5200;
    const x = ((((random(s) * span + w.flow * t) % span) + span) % span) - 400;
    return {i, x, kind: Math.floor(random(s + 'k') * 6), size: 0.9 + random(s + 'z') * 0.4, car: ['#7e3a34', '#3d5579', '#9a9a92', '#3d6b4b'][Math.floor(random(s + 'c') * 4)], s};
  }).filter((d) => d.x > x0 && d.x < x1 && hasWater(w, d.x, t) && (w.front === undefined || d.x < w.front - 40));
  return (
    <g>
      {/* Wreckage, drawn before the water so it sits half-sunk: only what is above the surface shows. */}
      {debris.map((d) => {
        const y = surfaceAt(w, d.x, t) + 14;
        const rot = noise2D(d.s + 'rot', t * 0.7, 0) * (8 + 20 * w.turb) + (d.kind === 3 ? 18 : d.kind === 5 ? -12 : 0);
        const wood = {fill: '#7a5230', stroke: '#2a1a0e', strokeWidth: 3};
        const shape =
          d.kind === 0 ? (
            <g>{/* splintered plank */}
              <path d="M-80 -14L60 -16L70 -10L62 -6L78 -2L66 2L74 8L-70 10L-84 4L-76 -2L-88 -6Z" {...wood} />
              <path d="M-60 -6h50M-20 2h60" stroke="#4a2e16" strokeWidth={3} /><circle cx={-50} cy={-4} r={3} fill="#c9c9c9" /></g>
          ) : d.kind === 1 ? (
            <g>{/* broken beams, crossed */}
              <path d="M-90 -40L70 10L78 0L86 14L-84 -26Z" {...wood} />
              <path d="M-70 14L60 -48L72 -40L62 -34L76 -30L-60 28Z" fill="#8a6038" stroke="#2a1a0e" strokeWidth={3} /></g>
          ) : d.kind === 2 ? (
            <g>{/* roof fragment, tiles missing, ragged lower edge */}
              <path d="M-110 -10L-60 -66L76 -66L114 -10L84 -2L70 -14L40 0L10 -16L-20 0L-50 -12L-80 2Z" fill="#8e3b2e" stroke="#3a1510" strokeWidth={3} />
              <path d="M-82 -32h150M-68 -50h128" stroke="#5e2219" strokeWidth={4} /><rect x={-20} y={-60} width={30} height={20} fill="#2a1a14" /></g>
          ) : d.kind === 3 ? (
            <g>{/* wrecked car: dented, windows smashed, tilted and half-sunk */}
              <path d="M-112 0L-102 -38L-58 -64L-10 -70L20 -62L48 -70L84 -38L114 -32L114 0Z" fill={d.car} stroke="#1a1a1c" strokeWidth={4} />
              <path d="M-50 -58L-10 -62L-8 -40L-84 -40Z M2 -60L40 -64L70 -40L2 -40Z" fill="#1d2a33" />
              <path d="M-40 -56L-24 -44M-30 -60L-18 -42M14 -58L30 -44L44 -58M50 -50L58 -42" stroke="#cfe3ee" strokeWidth={2} />
              <path d="M-70 -20h30M30 -18l20 6" stroke="#00000066" strokeWidth={4} />
              <circle cx={66} cy={4} r={22} fill="#141416" /></g>
          ) : d.kind === 4 ? (
            <g>{/* uprooted tree */}
              <path d="M-110 -6L80 -12L84 0L-104 8Z" fill="#5a3e26" stroke="#2a1a0e" strokeWidth={3} />
              <path d="M80 -6l40 -30M84 -4l36 10M60 -10l20 -36M-104 0l-26 -16M-104 4l-30 10M-104 2l-24 18" stroke="#5a3e26" strokeWidth={6} strokeLinecap="round" />
              <circle cx={118} cy={-40} r={16} fill="#2f3a26" opacity={0.9} /><circle cx={84} cy={-48} r={12} fill="#2f3a26" opacity={0.9} /></g>
          ) : (
            <g>{/* broken door / furniture panel */}
              <path d="M-50 -60L46 -60L50 -20L36 -14L52 0L-50 0Z" fill="#b9b0a0" stroke="#3a342c" strokeWidth={3} />
              <rect x={-36} y={-50} width={30} height={34} fill="#00000025" /><circle cx={30} cy={-30} r={4} fill="#6a6050" /></g>
          );
        return <g key={d.i} transform={`translate(${d.x} ${y}) rotate(${rot}) scale(${d.size})`}>{shape}</g>;
      })}
      {runs.map((r, k) => {
        const top = r.map((x) => `${x} ${surfaceAt(w, x, t)}`);
        const bottom = [...r].reverse().map((x) => `${x} ${terrainY(x) + 4}`);
        const edge = r[r.length - 1];
        return (
          <g key={k}>
            <path d={`M${top.join('L')}L${bottom.join('L')}Z`} fill="url(#wWater)" />
            {/* churning streaks carried by the flow */}
            {[40, 90, 150, 230, 330].map((d, j) => (
              <path key={j} d={`M${r.filter((_, n) => n % 3 === 0).map((x) => `${x} ${Math.min(terrainY(x) - 6, surfaceAt(w, x, t) + d + 10 * noise2D(`sk${j}`, x * 0.004, t * 0.3))}`).join('L')}`}
                fill="none" stroke={look.foam} strokeOpacity={0.08 + 0.14 * w.turb} strokeWidth={4} strokeDasharray="70 110" strokeDashoffset={-w.flow * t * (1 - j * 0.12)} />
            ))}
            <path d={`M${top.join('L')}`} fill="none" stroke={look.foam} strokeOpacity={0.45 + 0.45 * w.turb} strokeWidth={6 + 8 * w.turb} strokeLinejoin="round" />
            {r.filter((_, n) => n % 9 === 4).map((x, n) => {
              const cy = surfaceAt(w, x, t) + 24 + (n % 3) * 46;
              const sz = 26 + (n % 4) * 10;
              return <path key={`cap${n}`} d={`M${x - sz} ${cy}q${sz} ${-sz * 0.45} ${sz * 2} 0`} fill="none" stroke={look.foam} strokeOpacity={0.5} strokeWidth={4} />;
            })}
            {w.turb > 0.15
              ? Array.from({length: 9}, (_, f) => {
                  const fx = edge - 30 + noise2D(`ff${f}`, t * 2, k) * 50;
                  const fy = Math.min(surfaceAt(w, fx, t), terrainY(fx)) - 10 - Math.abs(noise2D(`fy${f}`, t * 3, k)) * 60 * w.turb;
                  return <circle key={f} cx={fx} cy={fy} r={(16 + 18 * Math.abs(noise2D(`fr${f}`, t * 2, 0))) * (0.6 + w.turb)} fill={look.foam} opacity={0.8} />;
                })
              : null}
          </g>
        );
      })}
      {debris.map((d) => (
        <ellipse key={d.i} cx={d.x} cy={surfaceAt(w, d.x, t) + 2} rx={(70 + 30 * Math.sin(t * 2 + d.i)) * d.size} ry={8} fill="none" stroke={look.foam} strokeOpacity={0.55} strokeWidth={4} />
      ))}
      {w.front !== undefined && w.front > x0 - 300 && w.front < x1 + 800 ? <SurgeFront w={w} t={t} look={look} /> : null}
    </g>
  );
};

/**
 * The front of an advancing surge, styled as a towering teal wall: a white crest curling over its lip,
 * foam boiling at its foot and spray thrown ahead.
 */
const SurgeFront: React.FC<{w: WaterState; t: number; look: Look}> = ({w, t}) => {
  const f = w.front!;
  const ramp = rampOf(w);
  const sc = Math.max(1, boreHeight(w) / 760); // a taller wall gets a proportionally bigger lip, foam and spray
  const top = surfaceAt(w, f - 140 * sc, t);
  const ground = terrainY(f);
  const h = ground - top;
  const lip = `C${f + 40 * sc} ${top - 50 * sc} ${f + 120 * sc} ${top + 70 * sc} ${f + 40 * sc} ${top + 150 * sc}`;
  const faceLine = Array.from({length: 18}, (_, i) => {
    const fx = f - ramp + ((ramp - 140 * sc) * i) / 17;
    return `${fx} ${surfaceAt(w, fx, t)}`;
  }).join('L');
  const body = `M${faceLine}${lip}C${f + 10 * sc} ${top + h * 0.45} ${f - 10 * sc} ${top + h * 0.75} ${f - 20} ${ground + 6}L${f - ramp} ${ground + 6}Z`;
  const curl = `M${faceLine}${lip}`;
  const foam = Array.from({length: 16}, (_, i) => {
    const s2 = `fb${i}`;
    const r = (18 + random(s2) * 34) * sc * (0.85 + 0.15 * Math.sin(t * 5 + i));
    return <circle key={s2} cx={f - 30 + (random(s2 + 'x') - 0.5) * 170 * sc} cy={ground - 20 - random(s2 + 'y') * 90 * sc} r={r} fill="#f4f6f8" opacity={0.9} />;
  });
  const lipFoam = Array.from({length: 10}, (_, i) => (
    <circle key={`lf${i}`} cx={f + 20 * sc + noise2D(`lx${i}`, t * 2, 0) * 40 * sc} cy={top + (30 + i * 14) * sc + noise2D(`ly${i}`, t * 2, 0) * 10}
      r={(10 + 10 * Math.abs(noise2D(`lr${i}`, t * 3, 0))) * sc} fill="#ffffff" opacity={0.8} />
  ));
  const spray = Array.from({length: 60}, (_, i) => {
    const s2 = `sp${i}`;
    const k = ((t * (0.9 + random(s2)) + random(s2 + 'o')) % 1 + 1) % 1;
    const sx = f - 260 * sc + random(s2 + 'x') * 320 * sc;
    const sy = surfaceAt(w, sx, t);
    return <circle key={s2} cx={sx + k * 200 * sc} cy={sy - k * 240 * sc + k * k * 160 * sc} r={(3 + random(s2 + 'r') * 8) * sc} fill="#ffffff" opacity={0.85 * (1 - k) * w.turb} />;
  });
  const streaks = Array.from({length: 9}, (_, i) => (
    <line key={`st${i}`} x1={f - ramp + 40 + i * (ramp / 9)} y1={top + 40 + i * 8} x2={f - ramp + 50 + i * (ramp / 9)} y2={ground - 30} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={4 * sc} />
  ));
  return (
    <g>
      <path d={body} fill="url(#wSurge)" />
      {streaks}
      <path d={curl} fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      {lipFoam}
      {foam}
      {spray}
    </g>
  );
};

const Boats: React.FC<{w: WaterState; t: number}> = ({w, t}) => (
  <g>
    {[[720, 8], [960, -11], [1170, 5]].map(([x, crooked], i) => {
      const floatY = surfaceAt(w, x, t);
      const ground = terrainY(x) - 4;
      const aground = floatY > ground - 8;
      const y = Math.min(floatY, ground);
      const rot = aground ? crooked : noise2D(`boat${i}`, t * 0.6, 0) * 4;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d="M-80 -30L80 -30L58 6L-62 6Z" fill="#141217" />
          <rect x={-30} y={-62} width={50} height={32} fill="#141217" />
          <rect x={-4} y={-120} width={5} height={60} fill="#141217" />
        </g>
      );
    })}
  </g>
);

// ---------- the view ----------
export const World: React.FC<WorldProps> = ({
  cam, t, look, lights = 0, wrecked = false, mark = false, mast, lean = 0, braceFall = null, water, lamp = false, children, fg, shake = 0, collapse = [], behind, wall = null, vista = null, clouds = 0, tower = true,
}) => {
  const {x, y, z} = cam;
  const smash = Math.min(1, Math.max(0, (boreHeight(water) - 700) / 700)); // 0 for ordinary surges, 1 for the giant wave
  const x0 = x - CX / z - 200;
  const x1 = x + (W - CX) / z + 200;
  const ground: string[] = [];
  for (let gx = x0; gx <= x1; gx += 16) ground.push(`${gx} ${terrainY(gx)}`);
  const sx = noise2D('shx', t * 14, 0) * shake * 30;
  const sy = noise2D('shy', t * 14, 0) * shake * 30;
  // Far hills: a slow parallax band behind everything.
  const farBase = CY + (1150 - y) * z * 0.45;
  const far: string[] = [];
  for (let fx = -100; fx <= W + 100; fx += 30) {
    const wx = fx / (z * 0.35) + x * 0.35;
    far.push(`${fx} ${farBase - 140 - 120 * (noise2D('far', wx * 0.0012, 0) + 1) - (wx > 3200 ? Math.min(260, (wx - 3200) * 0.12) : 0)}`);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <WorldDefs look={look} level={water.level} surge={water.front !== undefined} />
      <rect x={0} y={0} width={W} height={H} fill="url(#wSky)" />
      {look.stars > 0.02
        ? Array.from({length: 50}, (_, i) => (
            <circle key={i} cx={random(`st${i}x`) * W} cy={60 + random(`st${i}y`) * 900} r={1.2 + random(`st${i}r`) * 1.6} fill="#fff"
              opacity={look.stars * (0.25 + 0.35 * Math.abs(noise2D(`st${i}`, t * 0.6, 0)))} />
          ))
        : null}
      {look.sun > 0.02 ? <circle cx={820} cy={farBase - 230} r={90} fill="#ffd28a" opacity={look.sun * 0.85} filter="url(#wSoft)" /> : null}
      <ellipse cx={W / 2} cy={farBase - 200} rx={900} ry={420} fill={look.glow} opacity={0.18} filter="url(#wSoft)" />
      <Clouds look={look} t={t} amount={clouds} />
      <path d={`M-100 ${H}L${far.join('L')}L${W + 100} ${H}Z`} fill={look.far} />
      {wall !== null ? <WaveWall crestY={wall} t={t} seed="wall" /> : null}
      {vista ? (
        <Vista look={look} t={t} camX={x} horizon={farBase - 150} flood={vista.flood} lights={vista.lights}
          elevation={Math.min(1, Math.max(0.12, (TOWN.ground - 250 - y) / 650))}
          bottom={Math.min(H, CY + ((vista.flood > 0.02 ? water.level : TOWN.ground) - y) * z)} />
      ) : null}
      <g transform={`translate(${CX + sx} ${CY + sy}) scale(${z}) translate(${-x} ${-y})`}>
        <path d={`M${x0} ${terrainY(x0) + 3000}L${ground.join('L')}L${x1} ${terrainY(x1) + 3000}Z`} fill={look.ground} />
        {x0 < 1300 ? <path d={`M${ground.filter((_, i) => x0 + i * 16 < 1300).join('L')}`} stroke={look.mud} strokeWidth={30} fill="none" /> : null}
        {BUILDINGS.filter((b) => b.x + b.w > x0 && b.x < x1).map((b) => <Building key={b.seed} b={b} look={look} lights={lights} wrecked={wrecked} t={t}
          fall={Math.max(0, ...collapse.filter((c) => c.x >= b.x && c.x <= b.x + b.w).map((c) => c.k),
            water.front !== undefined ? Math.min(1, Math.max(0, (water.front - b.x - b.w) / (450 - 150 * smash)) * (0.3 + 0.5 * random(b.seed + 'q') + 0.5 * smash)) : 0)}
          smash={smash} />)}
        {!tower ? GAP.map((b) => <Building key={b.seed} b={b} look={look} lights={lights} wrecked={wrecked} t={t} fall={0} />) : null}
        {!wrecked ? <StreetLamps look={look} lights={lights} /> : null}
        {TALL.map((b) => <Tall key={b.x} {...b} look={look} lights={lights} mark={mark} t={t} />)}
        {tower ? <Tall {...STATION} look={look} lights={lights} mark={mark} t={t} station /> : null}
        {TREES.filter((tr) => tr.x > x0 - 200 && tr.x < x1 + 200).map((tr) => (
          <Pine key={tr.x} x={tr.x} h={tr.h} fill={look.tree} mark={mark} t={t} sway={water.turb} />
        ))}
        <Landing look={look} />
        <Mast look={look} t={t} state={mast} lean={lean} mark={mark} braceFall={braceFall} />
        {behind}
        <Water w={water} t={t} x0={x0} x1={x1} look={look} />
        <Boats w={water} t={t} />
        <PersonScale.Provider value={PERSON}>{children}</PersonScale.Provider>
        <LampGlow x={LAMP.x} y={LAMP.y} on={lamp} z={z} />
        {fg}
      </g>
      <rect x={0} y={0} width={W} height={H} fill="url(#wVignette)" />
    </svg>
  );
};
