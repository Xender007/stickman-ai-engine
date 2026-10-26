import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { EnvEntityFrame, EnvFrame, WaterProfile } from '../../../../packages/world/src/envtimeline.ts';
import { RIG3_ORDER } from '../../../../packages/world/src/envtimeline.ts';
import { shotBed, SHOT, SHOT_STAIRS, SHOT_LAYOUT } from '../../../../packages/environment/src/shot-terrain.ts';
import { proj, pxPerM, path, smoothPath, type Cam, type P2, type P3 } from './cam.ts';
import { rnd } from '../fx.ts';

/**
 * The single locked shot, drawn in SVG to match docs/reference/target-look-harbor-stairs.mp4: painted dusk world, outlined
 * flat colours, a lamp light cone, cartoon water spreading across the street with foam edges, splash columns and puddles.
 * Every element is a function of (frames, frame): no state carries between frames (rules R8, R8b, R8c).
 */
export type ShotProps = { frames: EnvFrame[] };

// --- set constants (metres) ------------------------------------------------------------------------------------------
const STAIRS = SHOT_STAIRS;
const Z_BACK = -22; // the far end of the street, closed by a row of buildings
const Z_FRONT = 15; // the street continues to the bottom of the frame
const LANE_FRONT = 1.2;
const GANTRY_Z = [0.45, 1.95] as const;
const OUTLINE = '#20212b';

const C = {
  skyTop: '#857a92',
  skyMid: '#a48d9d',
  skyLow: '#c39ea0',
  hills: '#55566e',
  seaFar: '#3d5a66',
  sea: '#3f6872',
  bldg: ['#1f2740', '#232c47', '#1c233a'],
  bldgBack: '#3b4361',
  window: '#151b2d',
  windowLit: '#d7a85e',
  road: '#4a4b55',
  roadDark: '#3d3e48',
  kerb: '#5c5d68',
  promenade: '#56575f',
  stone: '#5a5b66',
  stoneDark: '#45464f',
  mortar: '#3a3b44',
  steel: '#2c303c',
  steelLight: '#4b5060',
  car: '#9e2a2f',
  carDark: '#76191e',
  carLight: '#c2464a',
  glass: '#2f3a4e',
  glassHi: '#5d6e86',
  tyre: '#16171c',
  hub: '#8f939c',
  log: '#7b5232',
  logDark: '#5a3a21',
  logEnd: '#c49a6a',
  water: '#4b8e94',
  waterTop: '#4f939a',
  waterDeep: '#2f6c75',
  foam: '#eef8f6',
  limb: '#c7cad3',
  head: '#efdcb9',
  crate: '#ad7b48',
  crateDark: '#86592f',
  plank: '#6a4527',
  lampGlow: '#ffd99a',
};

interface Prim {
  /** world z used for painter's ordering (far first) */
  z: number;
  node: React.ReactNode;
}

const P = (cam: Cam, p: P3) => proj(cam, p).s;
const poly = (cam: Cam, pts: P3[]) => path(pts.map((p) => P(cam, p)));

/**
 * Gradients are drawn as fine stepped bands of flat colour. Chrome dithers SVG gradients, and the dither differed by one level
 * between a frame rendered alone and the same frame inside a long sequence (rule R8c); flat fills rasterise identically.
 */
function bandsVertical(key: string, x: number, y0: number, w: number, h: number, stops: [number, string][], n = 64): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    let c = stops[stops.length - 1][1];
    for (let j = 1; j < stops.length; j++) {
      if (k <= stops[j][0]) {
        c = mix(stops[j - 1][1], stops[j][1], (k - stops[j - 1][0]) / (stops[j][0] - stops[j - 1][0]));
        break;
      }
    }
    out.push(<rect key={`${key}${i}`} x={x} y={Math.floor(y0 + (i * h) / n)} width={w} height={Math.ceil(h / n) + 1} fill={c} />);
  }
  return out;
}
/** Concentric shapes from outside in, each a little more opaque: a soft glow without a gradient. */
function softEllipse(key: string, cx: number, cy: number, rx: number, ry: number, color: string, peak: number, n = 10): React.ReactNode[] {
  return Array.from({ length: n }, (_, i) => {
    const k = 1 - i / n;
    return <ellipse key={`${key}${i}`} cx={cx} cy={cy} rx={rx * k} ry={ry * k} fill={color} opacity={peak / n} />;
  });
}

// --- terrain and world helpers -----------------------------------------------------------------------------------------
const bed = (x: number) => (x < 0 ? 0 : shotBed(x));

/** Street ground: strips across the street that follow the slope and the dips; darker and glossy where it is wet. */
function ground(cam: Cam, wet: (x: number) => number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (let x = 0; x < SHOT.buildingLine; x += 0.25) {
    const x1 = Math.min(SHOT.buildingLine, x + 0.25);
    const w = wet(x + 0.125);
    const col = mix(C.road, '#2e343f', w * 0.8);
    out.push(<path key={`g${x}`} d={poly(cam, [[x, bed(x), Z_BACK], [x1, bed(x1), Z_BACK], [x1, bed(x1), Z_FRONT], [x, bed(x), Z_FRONT]])} fill={col} stroke={col} strokeWidth={0.6} />);
  }
  // a wet road shines: soft light streaks along the street where it is wet
  for (let k = 0; k < 10; k++) {
    const x = 0.4 + rnd(611, k) * 12;
    const w = wet(x);
    if (w < 0.2) continue;
    const z = -14 + rnd(612, k) * 20;
    out.push(<path key={`sheen${k}`} d={poly(cam, [[x, bed(x) + 0.004, z], [x + 0.08, bed(x) + 0.004, z], [x + 0.08, bed(x) + 0.004, z + 2 + rnd(613, k) * 3], [x, bed(x) + 0.004, z + 2 + rnd(613, k) * 3]])} fill="#8fa4b4" opacity={0.25 * w} />);
  }
  // centre line receding along the street, and a drain cover
  for (let z = -20; z < Z_FRONT; z += 2.2) {
    const x = 5.5;
    out.push(<path key={`dash${z}`} d={poly(cam, [[x - 0.07, bed(x) + 0.005, z], [x + 0.07, bed(x) + 0.005, z], [x + 0.07, bed(x) + 0.005, z + 1.1], [x - 0.07, bed(x) + 0.005, z + 1.1]])} fill="#a3a4ab" opacity={0.8} />);
  }
  const mh: P3[] = Array.from({ length: 24 }, (_, i) => [9.8 + 0.45 * Math.cos((i / 24) * Math.PI * 2), bed(9.8) + 0.006, 5.2 + 0.45 * Math.sin((i / 24) * Math.PI * 2)]);
  out.push(<path key="manhole" d={poly(cam, mh)} fill="#34353d" stroke="#25262c" strokeWidth={2} />);
  return out;
}

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * Math.min(1, Math.max(0, k))).toString(16).padStart(2, '0')).join('');
};

/** Buildings: a row closing the far end of the street, a building line along its right side, a hazier row behind. */
function buildings(cam: Cam): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const zEnd = Z_BACK - 0.5;
  const windowsOn = (key: string, quad: (u: number, v: number) => P3, wU: number, hV: number, seed: number) => {
    const cols = Math.max(2, Math.floor(wU / 1.5));
    for (let r = 0; r < Math.floor((hV - 2.2) / 2.5); r++) {
      for (let c = 0; c < cols; c++) {
        const u = ((c + 0.5) * wU) / cols;
        const v = 2.4 + r * 2.5;
        const lit = rnd(seed, r * 17 + c) > 0.86;
        out.push(<path key={`${key}w${r}-${c}`} d={poly(cam, [quad(u - 0.32, v), quad(u + 0.32, v), quad(u + 0.32, v + 1.05), quad(u - 0.32, v + 1.05)])} fill={lit ? C.windowLit : C.window} opacity={lit ? 0.85 : 1} />);
        out.push(<path key={`${key}s${r}-${c}`} d={path([P(cam, quad(u - 0.4, v - 0.06)), P(cam, quad(u + 0.4, v - 0.06))], false)} stroke="#39415c" strokeWidth={2} />);
      }
    }
  };
  // hazy back row
  [[-10, 0, 10], [13, 30, 14]].forEach(([x0, x1, h], i) => out.push(<path key={`bb${i}`} d={poly(cam, [[x0, 0, zEnd - 14], [x1, 0, zEnd - 14], [x1, h, zEnd - 14], [x0, h, zEnd - 14]])} fill={C.bldgBack} />));
  // far end row
  const row = [
    { x0: -1, x1: 4.2, h: 8.5, roof: 'gable', chimney: [0.6, 3.4] },
    { x0: 4.2, x1: 8.6, h: 6.8, roof: 'flat', chimney: [7.6] },
    { x0: 8.6, x1: 13.2, h: 10.5, roof: 'flat', chimney: [9.6, 12.2] },
  ];
  row.forEach((b, i) => {
    const col = C.bldg[i % 3];
    const top = b.roof === 'gable' ? b.h + 2 : b.h + 0.35;
    const shape: P3[] = b.roof === 'gable'
      ? [[b.x0, 0, zEnd], [b.x1, 0, zEnd], [b.x1, b.h, zEnd], [(b.x0 + b.x1) / 2 + 0.6, top, zEnd], [(b.x0 + b.x1) / 2 - 0.6, top, zEnd], [b.x0, b.h, zEnd]]
      : [[b.x0, 0, zEnd], [b.x1, 0, zEnd], [b.x1, b.h, zEnd], [b.x1 + 0.15, b.h, zEnd], [b.x1 + 0.15, top, zEnd], [b.x0 - 0.15, top, zEnd], [b.x0 - 0.15, b.h, zEnd], [b.x0, b.h, zEnd]];
    out.push(<path key={`b${i}`} d={poly(cam, shape)} fill={col} stroke={OUTLINE} strokeWidth={2} />);
    for (const cx of b.chimney) {
      out.push(<path key={`ch${i}${cx}`} d={poly(cam, [[cx - 0.22, top - 0.6, zEnd], [cx + 0.22, top - 0.6, zEnd], [cx + 0.22, top + 1, zEnd], [cx - 0.22, top + 1, zEnd]])} fill={col} stroke={OUTLINE} strokeWidth={2} />);
      out.push(<path key={`cc${i}${cx}`} d={poly(cam, [[cx - 0.3, top + 1, zEnd], [cx + 0.3, top + 1, zEnd], [cx + 0.3, top + 1.15, zEnd], [cx - 0.3, top + 1.15, zEnd]])} fill={OUTLINE} />);
    }
    windowsOn(`e${i}`, (u, v) => [b.x0 + u, v, zEnd + 0.02], b.x1 - b.x0, b.h, i * 31 + 7);
    out.push(<path key={`door${i}`} d={poly(cam, [[b.x0 + 0.9, 0, zEnd + 0.02], [b.x0 + 1.9, 0, zEnd + 0.02], [b.x0 + 1.9, 2.1, zEnd + 0.02], [b.x0 + 0.9, 2.1, zEnd + 0.02]])} fill="#141a2b" />);
  });
  // right-hand building line: facades in the plane x = buildingLine, receding along the street
  const xr = SHOT.buildingLine;
  const blocks = [
    { z0: Z_BACK, z1: -9, h: 9.5 },
    { z0: -9, z1: 2.6, h: 8 },
    { z0: 2.6, z1: Z_FRONT + 6, h: 10 },
  ];
  blocks.forEach((b, i) => {
    const col = C.bldg[(i + 1) % 3];
    out.push(<path key={`r${i}`} d={poly(cam, [[xr, 0, b.z0], [xr, 0, b.z1], [xr, b.h, b.z1], [xr, b.h, b.z0]])} fill={mix(col, '#000000', 0.12)} stroke={OUTLINE} strokeWidth={2} />);
    out.push(<path key={`rc${i}`} d={poly(cam, [[xr - 0.2, b.h, b.z0], [xr - 0.2, b.h, b.z1], [xr - 0.2, b.h + 0.35, b.z1], [xr - 0.2, b.h + 0.35, b.z0]])} fill={col} stroke={OUTLINE} strokeWidth={1.5} />);
    windowsOn(`rw${i}`, (u, v) => [xr - 0.02, v, b.z0 + u], b.z1 - b.z0, b.h, 300 + i * 13);
  });
  return out;
}

/** Quay parapet along the sea edge (x from -0.6 to 0), stone blocks, scupper openings at the base. */
function quay(cam: Cam, splashing: boolean): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const zs = [Z_BACK - 0.5, Z_FRONT + 4];
  out.push(<path key="qtop" d={poly(cam, [[-0.65, 0.92, zs[0]], [0.02, 0.92, zs[0]], [0.02, 0.92, zs[1]], [-0.65, 0.92, zs[1]]])} fill="#6c6d78" stroke={OUTLINE} strokeWidth={2} />);
  out.push(<path key="qface" d={poly(cam, [[0.02, 0, zs[0]], [0.02, 0.92, zs[0]], [0.02, 0.92, zs[1]], [0.02, 0, zs[1]]])} fill={C.stone} stroke={OUTLINE} strokeWidth={2} />);
  // block courses
  for (const y of [0.31, 0.62]) out.push(<path key={`qc${y}`} d={path([P(cam, [0.03, y, zs[0]]), P(cam, [0.03, y, zs[1]])], false)} stroke={C.mortar} strokeWidth={2} />);
  for (let z = zs[0]; z < zs[1]; z += 0.9) {
    for (const [y0, off] of [[0, 0], [0.31, 0.45], [0.62, 0]] as const) {
      const zz = z + off;
      if (zz > zs[1]) continue;
      out.push(<path key={`qj${z}-${y0}`} d={path([P(cam, [0.03, y0, zz]), P(cam, [0.03, y0 + 0.31, zz])], false)} stroke={C.mortar} strokeWidth={1.6} />);
    }
  }
  // scuppers (freeing ports): how the street drains back to the sea
  for (const zc of [-16, -10, -4.6, 0.4, 5.2]) out.push(<path key={`sc${zc}`} d={poly(cam, [[0.035, 0, zc - 0.35], [0.035, 0, zc + 0.35], [0.035, 0.18, zc + 0.35], [0.035, 0.18, zc - 0.35]])} fill="#1c1d24" />);
  // moss at the base
  out.push(<path key="moss" d={path([P(cam, [0.04, 0.03, zs[0]]), P(cam, [0.04, 0.03, zs[1]])], false)} stroke="#4f5f48" strokeWidth={3} opacity={splashing ? 0.6 : 0.8} />);
  return out;
}

/** Lamp: pole, arm, head; the cone and pool of light are drawn later, blended over everything. */
function lamp(cam: Cam): { body: React.ReactNode; light: React.ReactNode } {
  const x = SHOT_LAYOUT.lampX;
  const z = -1.2;
  const top = 4.6;
  const head: P3 = [x - 0.75, top - 0.15, z];
  const body = (
    <g>
      <path d={path([P(cam, [x, 0, z]), P(cam, [x, top, z])], false)} stroke={OUTLINE} strokeWidth={7} strokeLinecap="round" />
      <path d={path([P(cam, [x, 0, z]), P(cam, [x, top, z])], false)} stroke="#3a3e4c" strokeWidth={4} strokeLinecap="round" />
      <path d={smoothPath([P(cam, [x, top, z]), P(cam, [x - 0.35, top + 0.18, z]), P(cam, [x - 0.75, top - 0.05, z])])} stroke="#3a3e4c" strokeWidth={4} fill="none" />
      <path d={poly(cam, [[x - 0.95, top - 0.05, z], [x - 0.55, top - 0.05, z], [x - 0.62, top - 0.2, z], [x - 0.88, top - 0.2, z]])} fill="#2b2e38" stroke={OUTLINE} strokeWidth={1.5} />
      <ellipse cx={P(cam, head)[0]} cy={P(cam, head)[1] + 2} rx={pxPerM(cam, head) * 0.13} ry={pxPerM(cam, head) * 0.05} fill="#fff1c9" />
    </g>
  );
  const hs = P(cam, head);
  const left = P(cam, [head[0] - 1.6, bed(head[0] - 1.6), z + 1.2]);
  const right = P(cam, [head[0] + 1.6, bed(head[0] + 1.6), z + 1.2]);
  const light = (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const k = 1 - i / 9;
        const l: P2 = [hs[0] + (left[0] - hs[0]) * k, hs[1] + (left[1] - hs[1])];
        const r: P2 = [hs[0] + (right[0] - hs[0]) * k, hs[1] + (right[1] - hs[1])];
        return <path key={`cone${i}`} d={path([hs, r, l])} fill={C.lampGlow} opacity={0.045} />;
      })}
      {(() => {
        const c = P(cam, [head[0], bed(head[0]) + 0.01, z + 1.6]);
        const ppm = pxPerM(cam, [head[0], 0, z + 1.6]);
        return softEllipse('pool', c[0], c[1], ppm * 1.9, ppm * 0.55, C.lampGlow, 0.4);
      })()}
      {softEllipse('glow', hs[0], hs[1] + 3, pxPerM(cam, head) * 0.55, pxPerM(cam, head) * 0.55, '#fff3d0', 0.9)}
    </g>
  );
  return { body, light };
}

/** Steel stair gantry. Returns the far part (drawn behind Ravi) and the near part (in front of him). */
function gantry(cam: Cam): { far: React.ReactNode[]; near: React.ReactNode[] } {
  const far: React.ReactNode[] = [];
  const near: React.ReactNode[] = [];
  const { x0, run, rise, n, landingLen } = STAIRS;
  const top = n * rise;
  const lx = x0 + n * run;
  const [zf, zn] = GANTRY_Z;
  const stringer = (z: number, key: string, out: React.ReactNode[]) => {
    out.push(<path key={key} d={poly(cam, [[x0 - 0.05, 0, z], [lx, top - 0.02, z], [lx, top - 0.3, z], [x0 + 0.2, 0, z]])} fill={C.steel} stroke={OUTLINE} strokeWidth={2} />);
  };
  stringer(zf, 'sf', far);
  for (let j = 1; j <= n; j++) {
    const xa = x0 + (j - 1) * run;
    far.push(<path key={`tr${j}`} d={poly(cam, [[xa, j * rise, zf], [xa + run, j * rise, zf], [xa + run, j * rise, zn], [xa, j * rise, zn]])} fill={j % 2 ? '#3d4251' : '#373b49'} stroke={OUTLINE} strokeWidth={1.4} />);
    far.push(<path key={`tn${j}`} d={path([P(cam, [xa, j * rise, zn]), P(cam, [xa + run, j * rise, zn])], false)} stroke="#7d8394" strokeWidth={2} />);
  }
  // landing deck, posts, cross bracing
  far.push(<path key="deck" d={poly(cam, [[lx, top, zf], [lx + landingLen, top, zf], [lx + landingLen, top, zn], [lx, top, zn]])} fill="#3a3e4c" stroke={OUTLINE} strokeWidth={2} />);
  near.push(<path key="deckface" d={poly(cam, [[lx, top, zn], [lx + landingLen, top, zn], [lx + landingLen, top - 0.22, zn], [lx, top - 0.22, zn]])} fill={C.steel} stroke={OUTLINE} strokeWidth={2} />);
  for (const px of [lx + 0.15, lx + landingLen - 0.15]) {
    far.push(<path key={`pf${px}`} d={path([P(cam, [px, 0, zf]), P(cam, [px, top, zf])], false)} stroke={C.steel} strokeWidth={6} />);
    near.push(<path key={`pn${px}`} d={path([P(cam, [px, 0, zn]), P(cam, [px, top - 0.22, zn])], false)} stroke={OUTLINE} strokeWidth={8} />);
    near.push(<path key={`pn2${px}`} d={path([P(cam, [px, 0, zn]), P(cam, [px, top - 0.22, zn])], false)} stroke={C.steelLight} strokeWidth={4} />);
  }
  near.push(<path key="xb1" d={path([P(cam, [lx + 0.15, 0.2, zn]), P(cam, [lx + landingLen - 0.15, top - 0.3, zn])], false)} stroke={C.steel} strokeWidth={3} />);
  near.push(<path key="xb2" d={path([P(cam, [lx + landingLen - 0.15, 0.2, zn]), P(cam, [lx + 0.15, top - 0.3, zn])], false)} stroke={C.steel} strokeWidth={3} />);
  stringer(zn, 'sn', near);
  // rails: along the stairs (near side) and around the landing
  const rail = (a: P3, b: P3, key: string, out: React.ReactNode[], w = 3) => out.push(<path key={key} d={path([P(cam, a), P(cam, b)], false)} stroke="#6f7586" strokeWidth={w} strokeLinecap="round" />);
  rail([x0, 1.0, zn], [lx, top + 1.0, zn], 'rs', near);
  for (let j = 0; j <= n; j += 3) rail([x0 + j * run, j * rise, zn], [x0 + j * run, j * rise + 1.0, zn], `rp${j}`, near, 2);
  rail([lx, top + 1.05, zn], [lx + landingLen, top + 1.05, zn], 'rl', near);
  rail([lx + landingLen, top + 1.05, zn], [lx + landingLen, top + 1.05, zf], 'rl2', far);
  rail([lx, top + 1.05, zf], [lx + landingLen, top + 1.05, zf], 'rl3', far);
  for (let k = 0; k <= 6; k++) {
    const x = lx + (k * landingLen) / 6;
    rail([x, top, zn], [x, top + 1.05, zn], `lp${k}`, near, 2);
    rail([x, top, zf], [x, top + 1.05, zf], `lpf${k}`, far, 2);
  }
  return { far, near };
}

/** The sedan in side view, facing left, outlined, with glass, trim, wheels and a soft shadow. */
function car(cam: Cam, e: EnvEntityFrame): React.ReactNode {
  const zs = 0.86;
  const b = e.y - e.h / 2;
  const L = (pts: [number, number][]) => poly(cam, pts.map(([x, y]) => [e.x + x, b + y, zs] as P3));
  const body: [number, number][] = [[-2.1, 0.32], [-2.14, 0.62], [-2.02, 0.78], [-1.3, 0.86], [-0.85, 1.32], [-0.5, 1.42], [0.75, 1.42], [1.25, 1.0], [1.95, 0.92], [2.12, 0.74], [2.1, 0.32]];
  const wheel = (wx: number) => {
    const c = P(cam, [e.x + wx, b + 0.34, zs + 0.01]);
    const r = pxPerM(cam, [e.x + wx, b, zs]);
    return (
      <g key={wx}>
        <circle cx={c[0]} cy={c[1]} r={r * 0.36} fill={C.tyre} stroke={OUTLINE} strokeWidth={2} />
        <circle cx={c[0]} cy={c[1]} r={r * 0.17} fill={C.hub} stroke={OUTLINE} strokeWidth={1.5} />
        <circle cx={c[0]} cy={c[1]} r={r * 0.05} fill="#555963" />
      </g>
    );
  };
  return (
    <g>
      <path d={poly(cam, [[e.x - 2.2, bed(e.x - 2.2) + 0.01, -0.9], [e.x + 2.2, bed(e.x + 2.2) + 0.01, -0.9], [e.x + 2.2, bed(e.x + 2.2) + 0.01, 0.95], [e.x - 2.2, bed(e.x - 2.2) + 0.01, 0.95]])} fill="#000" opacity={0.25} />
      <path d={L(body)} fill={C.car} stroke={OUTLINE} strokeWidth={2.5} />
      <path d={L([[-2.1, 0.32], [-2.12, 0.55], [2.11, 0.55], [2.1, 0.32]])} fill={C.carDark} />
      <path d={L([[-1.95, 0.8], [-1.3, 0.86], [1.92, 0.9], [1.9, 0.86], [-1.3, 0.82]])} fill={C.carLight} />
      <path d={L([[-0.72, 0.9], [-0.45, 1.33], [0.68, 1.33], [1.12, 0.9]])} fill={C.glass} stroke={OUTLINE} strokeWidth={1.5} />
      <path d={L([[-0.62, 0.92], [-0.48, 1.12], [-0.3, 1.12], [-0.4, 0.92]])} fill={C.glassHi} opacity={0.7} />
      <path d={L([[0.18, 0.9], [0.24, 1.33], [0.3, 1.33], [0.24, 0.9]])} fill={C.carDark} />
      <path d={L([[-0.1, 0.36], [-0.1, 0.88], [-0.07, 0.88], [-0.07, 0.36]])} fill={C.carDark} />
      <path d={L([[1.05, 0.36], [1.05, 0.86], [1.08, 0.86], [1.08, 0.36]])} fill={C.carDark} />
      <path d={L([[0.0, 0.74], [0.25, 0.74], [0.25, 0.77], [0.0, 0.77]])} fill="#2a0e10" />
      <path d={L([[-2.12, 0.6], [-1.95, 0.62], [-1.95, 0.72], [-2.1, 0.71]])} fill="#ffe7b0" />
      <path d={L([[2.04, 0.66], [2.11, 0.66], [2.11, 0.76], [2.04, 0.76]])} fill="#d33b3b" />
      <path d={L([[-2.16, 0.3], [-1.75, 0.3], [-1.75, 0.4], [-2.16, 0.4]])} fill="#8b8f99" stroke={OUTLINE} strokeWidth={1} />
      {wheel(-1.35)}
      {wheel(1.35)}
    </g>
  );
}

/** A floating log: a rounded trunk with bark lines and a ringed end facing the camera side of the street. */
function logDrawing(cam: Cam, e: EnvEntityFrame): React.ReactNode {
  const z = LANE_FRONT + e.h / 2;
  const ca = Math.cos(e.angle);
  const sa = Math.sin(e.angle);
  const pt = (lx: number, ly: number): P3 => [e.x + lx * ca - ly * sa, e.y + lx * sa + ly * ca, z];
  const hw = e.w / 2;
  const hh = e.h / 2;
  const outline = [pt(-hw, -hh), pt(hw, -hh), pt(hw, hh), pt(-hw, hh)];
  const endC = P(cam, pt(hw, 0));
  const r = pxPerM(cam, pt(hw, 0)) * hh;
  return (
    <g>
      <path d={poly(cam, outline)} fill={C.log} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
      {[-0.4, 0, 0.35].map((k, i) => (
        <path key={i} d={path([P(cam, pt(-hw * 0.9, k * hh)), P(cam, pt(hw * 0.7, (k + 0.1) * hh))], false)} stroke={C.logDark} strokeWidth={2} />
      ))}
      <path d={path([P(cam, pt(-hw * 0.3, hh)), P(cam, pt(-hw * 0.1, hh + 0.12)), P(cam, pt(0, hh))], false)} stroke={C.logDark} strokeWidth={3} fill="none" />
      <ellipse cx={endC[0]} cy={endC[1]} rx={r * 0.55} ry={r} fill={C.logEnd} stroke={OUTLINE} strokeWidth={2} />
      <ellipse cx={endC[0]} cy={endC[1]} rx={r * 0.32} ry={r * 0.6} fill="none" stroke="#9b7247" strokeWidth={1.5} />
    </g>
  );
}

// --- the character ---------------------------------------------------------------------------------------------------
const J = Object.fromEntries(RIG3_ORDER.map((n, i) => [n, i])) as Record<(typeof RIG3_ORDER)[number], number>;

function ravi(cam: Cam, c: EnvFrame['characters'][number]): { prims: Prim[] } {
  const r = c.rig3!;
  const jp = (name: (typeof RIG3_ORDER)[number]): P3 => [r.j[J[name] * 3], r.j[J[name] * 3 + 1], LANE_FRONT + r.j[J[name] * 3 + 2]];
  const prims: Prim[] = [];
  const limbW = (p: P3) => pxPerM(cam, p) * 0.075;
  const seg = (a: P3, b: P3, m: P3, key: string, wet: number) => {
    const w = limbW(a);
    const d = smoothPath([P(cam, a), P(cam, m), P(cam, b)]);
    prims.push({
      z: (a[2] + m[2] + b[2]) / 3,
      node: (
        <g key={key}>
          <path d={d} stroke={OUTLINE} strokeWidth={w + 5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} stroke={mix(C.limb, '#6d99ad', wet)} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ),
    });
  };
  const wet = c.wetness * 0.7;
  seg(jp('hipL'), jp('footL'), jp('kneeL'), 'legL', wet);
  seg(jp('hipR'), jp('footR'), jp('kneeR'), 'legR', wet);
  seg(jp('shL'), jp('handL'), jp('elbowL'), 'armL', 0);
  seg(jp('shR'), jp('handR'), jp('elbowR'), 'armR', 0);
  // contact shadow under the feet, on the surface he stands on
  {
    const fl = jp('footL');
    const fr = jp('footR');
    const cx = (fl[0] + fr[0]) / 2;
    const sy = Math.min(fl[1], fr[1]);
    const sh = P(cam, [cx, sy + 0.005, LANE_FRONT]);
    const ppm = pxPerM(cam, [cx, sy, LANE_FRONT]);
    prims.push({ z: LANE_FRONT - 0.2, node: <ellipse key="shadow" cx={sh[0]} cy={sh[1]} rx={ppm * 0.38} ry={ppm * 0.09} fill="#000" opacity={0.28} /> });
  }
  // torso
  const hip = jp('hip');
  const neck = jp('neck');
  prims.push({
    z: (hip[2] + neck[2]) / 2,
    node: (
      <g key="torso">
        <path d={path([P(cam, hip), P(cam, neck)], false)} stroke={OUTLINE} strokeWidth={limbW(hip) * 1.25 + 5} strokeLinecap="round" />
        <path d={path([P(cam, hip), P(cam, neck)], false)} stroke={C.limb} strokeWidth={limbW(hip) * 1.25} strokeLinecap="round" />
      </g>
    ),
  });
  // head: a stylised large round head (drawn larger than the rig's collision head, as in the reference look)
  const head = jp('head');
  const hs = P(cam, [head[0], head[1] + 0.06, head[2]]);
  const hr = pxPerM(cam, head) * 0.26;
  prims.push({ z: head[2] + 0.05, node: <circle key="head" cx={hs[0]} cy={hs[1]} r={hr} fill={C.head} stroke={OUTLINE} strokeWidth={3} /> });
  // crate: a real box, yawed with the chest; draw the faces turned toward the camera
  const [bx, by, bz, byaw] = r.box;
  const cz = LANE_FRONT + bz;
  const half = { f: 0.2, s: 0.225, h: 0.2 };
  const corner = (sf: number, ss: number, sh: number): P3 => [bx + sf * half.f * Math.cos(byaw) - ss * half.s * Math.sin(byaw), by + sh * half.h, cz + sf * half.f * Math.sin(byaw) + ss * half.s * Math.cos(byaw)];
  const faces: { pts: P3[]; normal: P3; fill: string }[] = [
    { pts: [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)], normal: [Math.cos(byaw), 0, Math.sin(byaw)], fill: C.crate },
    { pts: [corner(-1, -1, -1), corner(-1, 1, -1), corner(-1, 1, 1), corner(-1, -1, 1)], normal: [-Math.cos(byaw), 0, -Math.sin(byaw)], fill: C.crate },
    { pts: [corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)], normal: [-Math.sin(byaw), 0, Math.cos(byaw)], fill: C.crateDark },
    { pts: [corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)], normal: [Math.sin(byaw), 0, -Math.cos(byaw)], fill: C.crateDark },
    { pts: [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)], normal: [0, 1, 0], fill: '#c08e58' },
  ];
  const toCam: P3 = [cam.x - bx, cam.y - by, cam.z - cz];
  const visible = faces.filter((f) => f.normal[0] * toCam[0] + f.normal[1] * toCam[1] + f.normal[2] * toCam[2] > 0);
  prims.push({
    z: cz,
    node: (
      <g key="crate">
        {visible.map((f, i) => {
          const s = f.pts.map((p) => P(cam, p));
          const mid = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
          return (
            <g key={i}>
              <path d={path(s)} fill={f.fill} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
              {f.normal[1] === 0 && (
                <>
                  <path d={path([mid(s[0], s[3], 0.33), mid(s[1], s[2], 0.33)], false)} stroke={C.plank} strokeWidth={1.5} />
                  <path d={path([mid(s[0], s[3], 0.66), mid(s[1], s[2], 0.66)], false)} stroke={C.plank} strokeWidth={1.5} />
                  <path d={path([s[0], s[2]], false)} stroke={C.plank} strokeWidth={1.5} />
                </>
              )}
            </g>
          );
        })}
      </g>
    ),
  });
  return { prims };
}

// --- water -------------------------------------------------------------------------------------------------------------

function waterPrims(cam: Cam, p: WaterProfile, tEdit: number): Prim[] {
  const prims: Prim[] = [];
  const n = p.depth.length;
  const xs = (i: number) => p.x0 + i * p.step;
  const zSlices: number[] = [];
  for (let z = Z_BACK; z < Z_FRONT - 1e-9; z += 0.5) zSlices.push(z);
  // street water: one polygon per (z slab, wet run); shallow water only where the puddle pattern allows
  zSlices.forEach((z0) => {
    const z1 = Math.min(Z_FRONT, z0 + 0.5);
    const zm = (z0 + z1) / 2;
    let run: number[] = [];
    const flush = (k: string) => {
      if (run.length < 1) return;
      const top: P3[] = [];
      const ia = run[0];
      const ib = run[run.length - 1];
      const x0 = xs(ia) - p.step / 2;
      const x1 = xs(ib) + p.step / 2;
      for (const i of run) top.push([xs(i), p.eta[i], z0]);
      const back = [...top].reverse().map((q) => [q[0], q[1], z1] as P3);
      const surface: P3[] = [[x0, p.eta[ia], z0], ...top, [x1, p.eta[ib], z0], [x1, p.eta[ib], z1], ...back, [x0, p.eta[ia], z1]];
      for (const [xe, ie, dir] of [[x0, ia, -1], [x1, ib, 1]] as const) {
        const wob = (zz: number) => Math.sin(zz * 2.3 + tEdit * 3 + ie) * 0.08 * dir;
        prims.push({ z: zm + 0.01, node: <path key={`fe${z0}-${k}-${dir}`} d={smoothPath([P(cam, [xe + wob(z0), p.eta[ie] + 0.01, z0]), P(cam, [xe + wob(zm), p.eta[ie] + 0.01, zm]), P(cam, [xe + wob(z1), p.eta[ie] + 0.01, z1])])} stroke={C.foam} strokeWidth={4} opacity={0.9} fill="none" strokeLinecap="round" /> });
      }
      const far = Math.min(1, Math.max(0, (Z_FRONT - zm) / (Z_FRONT - Z_BACK)));
      const wc = mix(mix(C.waterDeep, C.waterTop, 0.55), '#86b3b6', far * far * 0.85);
      prims.push({ z: zm, node: <path key={`w${z0}-${k}`} d={poly(cam, surface)} fill={wc} opacity={0.95} stroke={wc} strokeWidth={0.8} /> });
      run = [];
    };
    for (let i = 0; i < n; i++) {
      const x = xs(i);
      if (x < 0.02 || x > SHOT.buildingLine) {
        flush(`${i}`);
        continue;
      }
      const d = p.depth[i];
      const ok = d > 0.1;
      if (ok) run.push(i);
      else flush(`${i}`);
    }
    flush('end');
  });
  // the front face of the water (at the street's front edge), darker, with a foam line along its top
  const front: P3[] = [];
  const frontTop: P2[] = [];
  for (let i = 0; i < n; i++) {
    const x = xs(i);
    if (x < 0.02 || x > SHOT.buildingLine || p.depth[i] < 0.12) continue;
    front.push([x, p.eta[i], Z_FRONT]);
    frontTop.push(P(cam, [x, p.eta[i], Z_FRONT]));
  }
  if (front.length > 1) {
    const bottom = [...front].reverse().map((q) => [q[0], bed(q[0]), Z_FRONT] as P3);
    prims.push({ z: Z_FRONT - 0.01, node: <path key="wfront" d={poly(cam, [...front, ...bottom])} fill={C.waterDeep} opacity={0.92} /> });
    prims.push({ z: Z_FRONT, node: <path key="wfrontfoam" d={smoothPath(frontTop)} stroke={C.foam} strokeWidth={4} fill="none" strokeLinecap="round" /> });
  }
  // foam lace on the surface: short wavy strokes that drift with the current
  for (let k = 0; k < 140; k++) {
    const r0 = rnd(901, k);
    const z = Z_FRONT - 0.3 - Math.pow(r0, 1.6) * (Z_FRONT - Z_BACK - 0.6);
    const base = rnd(902, k) * 14;
    const i = Math.round((base - p.x0) / p.step);
    if (i < 1 || i >= n - 1 || p.depth[i] < 0.15) continue;
    const u = p.u[i];
    const x = base + ((u * tEdit * 0.45 + rnd(903, k) * 3) % 3) - 1.5;
    const j = Math.round((x - p.x0) / p.step);
    if (j < 1 || j >= n - 1 || p.depth[j] < 0.15 || x < 0.1 || x > SHOT.buildingLine - 0.2) continue;
    const len = 0.6 + rnd(904, k) * 1.2;
    const pts: P2[] = [];
    for (let s = 0; s <= 6; s++) {
      const xx = x + (s / 6) * len;
      const jj = Math.min(n - 1, Math.max(0, Math.round((xx - p.x0) / p.step)));
      pts.push(P(cam, [xx, p.eta[jj] + 0.005, z + Math.sin(s * 1.3 + k + tEdit * 1.5) * 0.12]));
    }
    const lw = Math.max(1.4, pxPerM(cam, [x, p.eta[j], z]) * 0.035);
    prims.push({ z: z + 0.01, node: <path key={`lace${k}`} d={smoothPath(pts)} stroke={C.foam} strokeWidth={lw} opacity={0.8} fill="none" strokeLinecap="round" /> });
  }
  // the leading edge: a white roll across the street where the water front is, and foam wherever depth steps up fast
  for (let i = 2; i < n - 2; i++) {
    const x = xs(i);
    if (x < 0.1 || x > SHOT.buildingLine) continue;
    const d0 = p.depth[i];
    const d1 = p.depth[i + 1];
    const edge = d0 > 0.08 && d1 < 0.03 && p.u[i] > 0.4;
    if (!edge) continue;
    const pts: P2[] = [];
    for (let z = Z_BACK; z <= Z_FRONT; z += 0.5) pts.push(P(cam, [x + Math.sin(z * 2.1 + tEdit * 6) * 0.12, p.eta[i] + 0.04, z]));
    prims.push({ z: 0, node: <path key={`edge${i}`} d={smoothPath(pts)} stroke={C.foam} strokeWidth={9} opacity={0.95} fill="none" strokeLinecap="round" /> });
  }
  return prims;
}

/** Puddles in the low spots once the water is shallow: organic shapes sized by how much water the solver keeps there. */
function puddles(cam: Cam, p: WaterProfile): Prim[] {
  const prims: Prim[] = [];
  SHOT.dips.forEach((dip, di) => {
    const xc = (dip.x0 + dip.x1) / 2;
    const i = Math.round((xc - p.x0) / p.step);
    const d = p.depth[i];
    if (d < 0.01 || d > 0.1) return;
    const fill = Math.min(1, d / dip.depth);
    const eta = p.eta[i];
    for (let k = 0; k < 10; k++) {
      const seed = di * 100 + k;
      const cz = Z_BACK + 2 + rnd(seed, 1) * (Z_FRONT - Z_BACK - 5);
      const rx = ((dip.x1 - dip.x0) / 2) * (0.55 + 0.45 * rnd(seed, 2)) * Math.sqrt(fill);
      const rz = (0.5 + rnd(seed, 3) * 1.3) * Math.sqrt(fill);
      if (rx < 0.08) continue;
      const pts: P2[] = [];
      for (let a = 0; a < 16; a++) {
        const th = (a / 16) * Math.PI * 2;
        const wob = 1 + 0.16 * Math.sin(3 * th + seed) + 0.08 * Math.sin(5 * th + seed * 2);
        pts.push(P(cam, [xc + rx * wob * Math.cos(th), eta + 0.004, cz + rz * wob * Math.sin(th)]));
      }
      const nearLamp = Math.abs(xc - (SHOT_LAYOUT.lampX - 0.75)) < 3 && Math.abs(cz - 0.4) < 4;
      const c = P(cam, [xc, eta + 0.005, cz]);
      const ppm = pxPerM(cam, [xc, eta, cz]);
      prims.push({
        z: cz - rz,
        node: (
          <g key={`pud${di}-${k}`}>
            <path d={smoothPath(pts, true)} fill="#4d7480" stroke="#8fb2b6" strokeWidth={2} />
            <path d={smoothPath(pts.slice(2, 7))} stroke="#a8c4cc" strokeWidth={3} fill="none" opacity={0.7} />
            {nearLamp && <ellipse cx={c[0]} cy={c[1]} rx={ppm * rx * 0.35} ry={ppm * 0.08} fill="#ffd99a" opacity={0.75} />}
          </g>
        ),
      });
    }
  });
  return prims;
}

/** The sea beyond the quay: a plane at the current sea level from the horizon to the front, with streaks. */
function sea(cam: Cam, eta: number, tEdit: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  out.push(<path key="sea" d={poly(cam, [[-200, eta, -400], [-0.62, eta, -400], [-0.62, eta, 30], [-200, eta, 30]])} fill={C.sea} />);
  for (let k = 0; k < 30; k++) {
    const z = -60 + rnd(71, k) * 85;
    const x = -18 + rnd(72, k) * 17 + ((tEdit * 0.3 + rnd(73, k)) % 1) * 0.8;
    out.push(<path key={`st${k}`} d={path([P(cam, [x, eta + 0.01, z]), P(cam, [x + 0.9 + rnd(74, k), eta + 0.01, z])], false)} stroke="#6b929a" strokeWidth={1.6} opacity={0.6} />);
  }
  return out;
}

/** The spray column when the bore slams the quay: a tall jagged white burst that rises, hangs and falls, with droplets. */
function slamColumn(cam: Cam, age: number): React.ReactNode {
  if (age < 0 || age > 2.6) return null;
  const rise = Math.min(1, age / 0.45);
  const fall = age > 1.1 ? Math.min(1, (age - 1.1) / 1.4) : 0;
  const hgt = 5.2 * rise * (1 - 0.7 * fall);
  const fade = 1 - fall;
  const base: P3 = [-0.5, 0.9, 0.5];
  const pts: P2[] = [];
  const nSpikes = 9;
  for (let k = 0; k <= nSpikes * 2; k++) {
    const u = k / (nSpikes * 2);
    const z = -12 + u * 18;
    const spike = k % 2 ? 1 : 0.55 + 0.25 * rnd(55, k);
    const h = hgt * spike * (0.55 + 0.45 * Math.sin(u * Math.PI));
    pts.push(P(cam, [base[0] + Math.sin(k * 1.7) * 0.25, base[1] + h, z]));
  }
  const left = P(cam, [base[0], base[1], 6]);
  const right = P(cam, [base[0], base[1], -12]);
  const drops: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const a = age - rnd(56, i) * 0.4;
    if (a <= 0) continue;
    const vx = 0.5 + rnd(57, i) * 2.2;
    const vy = 4 + rnd(58, i) * 5;
    const z = -12 + rnd(59, i) * 18;
    const y = base[1] + vy * a - 4.9 * a * a;
    if (y < 0.2) continue;
    const s = P(cam, [base[0] + vx * a, y, z]);
    drops.push(<circle key={i} cx={s[0]} cy={s[1]} r={2 + rnd(60, i) * 4} fill={C.foam} opacity={0.9 * fade} />);
  }
  return (
    <g opacity={fade}>
      <path d={smoothPath([right, ...pts.reverse(), left], true)} fill={C.foam} stroke="#cde6e6" strokeWidth={2} />
      {drops}
    </g>
  );
}

/** Water pouring over the parapet onto the street while the sea is above its top; streams back through the scuppers later. */
function quayFlows(cam: Cam, seaEta: number, p: WaterProfile, tEdit: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const iStreet = Math.round((0.4 - p.x0) / p.step);
  const streetEta = p.eta[iStreet];
  const streetDepth = p.depth[iStreet];
  if (seaEta > 0.92) {
    const over = Math.min(0.6, seaEta - 0.9);
    const bottom = Math.max(streetEta, 0.02);
    const zA = -18;
    const zB = 9;
    const top: P2[] = [];
    const foot: P2[] = [];
    for (let z = zA; z <= zB; z += 1) {
      top.push(P(cam, [-0.3, 0.92 + over * (0.6 + 0.4 * Math.sin(z * 1.7 + tEdit * 5)), z]));
      foot.push(P(cam, [0.35 + over * 1.2, bottom + 0.02, z]));
    }
    out.push(<path key="sheet" d={path([...top, ...foot.reverse()])} fill="#d6eeee" opacity={0.92} stroke={C.foam} strokeWidth={3} />);
    for (let k = 0; k < 22; k++) {
      const z = zA + (k + rnd(84, k)) * ((zB - zA) / 22);
      const ph = (tEdit * 2.5 + rnd(85, k)) % 1;
      const a2 = P(cam, [-0.15, 0.92 + over * 0.5, z]);
      const b2 = P(cam, [0.3 + over, bottom, z]);
      out.push(<path key={`streak${k}`} d={path([[a2[0] + (b2[0] - a2[0]) * ph * 0.5, a2[1] + (b2[1] - a2[1]) * ph * 0.5], [a2[0] + (b2[0] - a2[0]) * (ph * 0.5 + 0.35), a2[1] + (b2[1] - a2[1]) * (ph * 0.5 + 0.35)]], false)} stroke="#9fcfd2" strokeWidth={2.5} />);
      out.push(<circle key={`splash${k}`} cx={b2[0] + Math.sin(k * 3 + tEdit * 9) * 6} cy={b2[1] - 4 - ph * 14} r={2.5 + rnd(86, k) * 2.5} fill={C.foam} opacity={0.9 - ph * 0.6} />);
    }
  } else if (streetDepth > 0.03 && p.u[iStreet] < -0.2) {
    // draining back to the sea through the scuppers: streams spilling off the quay edge
    for (const zc of [-16, -10, -4.6, 0.4, 5.2]) {
      const a = P(cam, [-0.6, 0.06, zc]);
      const b = P(cam, [-1.2, seaEta, zc + 0.3]);
      out.push(<path key={`str${zc}`} d={smoothPath([a, [a[0] - 6, a[1] + 6], b])} stroke="#bfe1e1" strokeWidth={5 + 40 * Math.min(0.2, streetDepth)} opacity={0.85} fill="none" strokeLinecap="round" />);
      const ph = (tEdit * 2 + zc) % 1;
      out.push(<circle key={`sd${zc}`} cx={b[0]} cy={b[1] - 4 - ph * 10} r={3} fill={C.foam} opacity={0.8} />);
    }
  }
  return out;
}

// --- the composition -------------------------------------------------------------------------------------------------
export const SHOT_CAM = (W: number, H: number): Cam => ({ x: 5.4, y: 5.2, z: 15, pitch: (9 * Math.PI) / 180, fov: 62, W, H });

export const HarborShot: React.FC<ShotProps> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fi = Math.min(frame, frames.length - 1);
  const f = frames[fi];
  const cam = SHOT_CAM(W, H);
  const tEdit = frame / fps;
  const p = f.water.profile!;
  const seaEta = p.eta[Math.max(0, Math.round((-3 - p.x0) / p.step))];
  // the moment the bore first reaches the wall (scanning earlier frames keeps this a pure function of the frame)
  let slamFrame = -1;
  for (let k = 0; k <= fi; k++) {
    const pk = frames[k].water.profile!;
    if (pk.eta[Math.round((-0.8 - pk.x0) / pk.step)] > -0.2) {
      slamFrame = k;
      break;
    }
  }
  // ground wetness: how recently water stood at x (story time), so the street stays dark and glossy after it drains
  const wetAt = (x: number) => {
    let w = 0;
    for (let k = fi; k >= 0 && k > fi - 300; k -= 3) {
      const pk = frames[k].water.profile!;
      const i = Math.round((x - pk.x0) / pk.step);
      if (pk.depth[i] > 0.01) {
        w = Math.max(w, Math.exp(-(f.t - frames[k].t) / 120));
        break;
      }
    }
    return w;
  };

  const ents = new Map(f.entities.map((e) => [e.id, e]));
  const g = gantry(cam);
  const l = lamp(cam);
  const ch = f.characters[0];
  const prims: Prim[] = [
    { z: -1.2, node: <g key="lamp">{l.body}</g> },
    // sort by the side that faces the camera, not the centre: water behind that side must not paint over it
    { z: 0.87, node: <g key="car">{car(cam, ents.get('car_017')!)}</g> },
    { z: GANTRY_Z[0], node: <g key="gfar">{g.far}</g> },
    { z: LANE_FRONT + 0.17, node: <g key="log">{logDrawing(cam, ents.get('log_003')!)}</g> },
    ...ravi(cam, ch).prims.map((pr) => ({ ...pr, z: Math.min(GANTRY_Z[1] - 0.05, Math.max(GANTRY_Z[0] + 0.05, pr.z)) })),
    { z: GANTRY_Z[1], node: <g key="gnear">{g.near}</g> },
    ...waterPrims(cam, p, tEdit),
    ...puddles(cam, p),
  ].sort((a, b) => a.z - b.z);

  const horizon = proj(cam, [0, -1, -2000]).s[1];
  return (
    <AbsoluteFill style={{ background: C.skyTop }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {bandsVertical('sky', 0, 0, W, horizon + 2, [[0, C.skyTop], [0.6, C.skyMid], [1, C.skyLow]])}
        {/* soft cloud banks */}
        {[0.18, 0.3, 0.42].flatMap((y, i) => softEllipse(`cloud${i}`, W * (0.3 + 0.25 * i), H * y * 0.6, W * 0.5, 40 + i * 8, '#b7a2b0', 0.5, 8))}
        {/* distant hills across the bay */}
        <path d={`M0 ${horizon} L0 ${horizon - 40} C ${W * 0.12} ${horizon - 70}, ${W * 0.22} ${horizon - 30}, ${W * 0.34} ${horizon - 22} L ${W * 0.4} ${horizon} Z`} fill={C.hills} />
        {sea(cam, seaEta, tEdit)}
        {buildings(cam)}
        {ground(cam, wetAt)}
        {quay(cam, slamFrame >= 0)}
        {prims.map((pr, i) => (
          <React.Fragment key={i}>{pr.node}</React.Fragment>
        ))}
        {quayFlows(cam, seaEta, p, tEdit)}
        {slamFrame >= 0 && slamColumn(cam, (fi - slamFrame) / fps)}
        {l.light}
      </svg>
    </AbsoluteFill>
  );
};
