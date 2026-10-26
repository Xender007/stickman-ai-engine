import React from 'react';
import * as THREE from 'three';
import type { EnvEntityFrame } from '../../../packages/world/src/envtimeline.ts';
import { rnd } from './fx.ts';
import { DISC, mat } from './Figure.tsx';

/**
 * A car in side view facing left (its front is toward the sea). Built from flat polygons cached per shape, with three
 * genuinely different bodies: intact, dented (crumpled hood, smashed lamp, cracked windscreen, hanging bumper) and wrecked
 * (front pushed in, hood torn up, roof dented, glass gone, a wheel knocked out). Effects after an impact (sparks, glass,
 * steam, a rocking settle) are functions of the age of that impact in edit seconds.
 */
type Pt = [number, number];
const SHAPES = new Map<string, THREE.ShapeGeometry>();
const poly = (id: string, pts: Pt[]): THREE.ShapeGeometry => {
  // The key includes the points: shapes that depend on the damage state must not be served from another state's cache entry
  // (a name-only key made the result depend on which frame a browser tab rendered first, breaking rule R8b).
  const key = id + '|' + pts.map((p) => p.join(',')).join(';');
  let g = SHAPES.get(key);
  if (!g) {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    g = new THREE.ShapeGeometry(s);
    SHAPES.set(key, g);
  }
  return g;
};
const BOX = new THREE.BoxGeometry(1, 1, 1);

const Poly: React.FC<{ id: string; pts: Pt[]; c: string; o?: number; z?: number; p?: [number, number]; rz?: number }> = ({ id, pts, c, o = 1, z = 0, p = [0, 0], rz = 0 }) => (
  <mesh geometry={poly(id, pts)} material={mat(c, o)} position={[p[0], p[1], z]} rotation={[0, 0, rz]} />
);
const Line: React.FC<{ a: Pt; b: Pt; w: number; c: string; z: number; o?: number }> = ({ a, b, w, c, z, o = 1 }) => (
  <mesh geometry={BOX} material={mat(c, o)} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])]} scale={[Math.hypot(b[0] - a[0], b[1] - a[1]), w, 0.01]} />
);
const Dot: React.FC<{ p: Pt; r: number; c: string; o?: number; z: number; sy?: number }> = ({ p, r, c, o = 1, z, sy = 1 }) => (
  <mesh geometry={DISC} material={mat(c, o)} position={[p[0], p[1], z]} scale={[r, r * sy, 1]} />
);

const RED = '#b3262c';
const RED_D = '#7e1a20';
const RED_L = '#d8484e';
const GRIME = '#4c1013';
const GLASS = '#6f8fab';
const GLASS_D = '#161d2a';
const CRACK = '#d8e6f2';

const BODY_REAR: Pt[] = [[-0.25, 1.40], [0.85, 1.50], [1.45, 1.02], [2.05, 0.97], [2.24, 0.78], [2.2, 0.36]];
const BODY: Record<EnvEntityFrame['damage'], Pt[]> = {
  intact: [[-2.2, 0.36], [-2.24, 0.7], [-2.0, 0.9], [-1.25, 0.97], [-0.78, 1.3], [-0.4, 1.5], ...BODY_REAR.slice(1)],
  dented: [[-2.1, 0.4], [-2.12, 0.62], [-2.18, 0.8], [-1.95, 0.86], [-1.75, 1.04], [-1.52, 0.9], [-1.32, 1.05], [-0.78, 1.3], [-0.4, 1.5], ...BODY_REAR.slice(1)],
  wrecked: [[-1.78, 0.44], [-1.72, 0.66], [-1.82, 0.82], [-1.56, 0.95], [-1.32, 1.12], [-1.06, 0.98], [-0.9, 1.18], [-0.62, 1.28], [-0.25, 1.4], [0.2, 1.3], [0.6, 1.34], [0.85, 1.43], [1.45, 1.02], [2.05, 0.97], [2.24, 0.78], [2.2, 0.36]],
};

export const Car: React.FC<{ e: EnvEntityFrame; z: number; impactAge: number | null; tEdit: number }> = ({ e, z, impactAge, tEdit }) => {
  const dmg = e.damage;
  const struck = impactAge !== null;
  const a = impactAge ?? 99;
  // after the hit the car rocks on its springs and settles; heavily damaged it sits nose-down
  const rock = struck ? Math.exp(-3.2 * a) * Math.sin(13 * a) * 0.035 : 0;
  const shake = struck ? Math.exp(-5 * a) * Math.sin(38 * a) * 0.05 : 0;
  const tilt = (dmg === 'wrecked' ? 0.045 : dmg === 'dented' ? 0.012 : 0) + rock;
  // when the water is high the car lifts a little and sways with it
  const sway = e.wetLine > 0.5 ? Math.sin(tEdit * 1.3 + e.x) * 0.012 * Math.min(1, e.wetLine) : 0;
  const base = e.y - e.h / 2;
  const front = dmg === 'wrecked' ? -1.72 : dmg === 'dented' ? -2.1 : -2.2;
  return (
    <group position={[e.x + shake, base, z]} rotation={[0, 0, tilt + sway]}>
      {/* wheels sit behind the body, with dark arches */}
      <Dot p={[-1.4, 0.36]} r={0.44} c="#08090c" z={-0.02} />
      <Dot p={[1.4, 0.36]} r={0.44} c="#08090c" z={-0.02} />
      <Dot p={[1.4, 0.34]} r={0.34} c="#101216" z={0.06} />
      <Dot p={[1.4, 0.34]} r={0.17} c="#9aa1af" z={0.07} />
      <Dot p={[1.4, 0.34]} r={0.05} c="#3a3f4a" z={0.08} />
      {dmg !== 'wrecked' ? (
        <>
          <Dot p={[-1.4, 0.34]} r={0.34} c="#101216" z={0.06} />
          <Dot p={[-1.4, 0.34]} r={0.17} c="#9aa1af" z={0.07} />
          <Dot p={[-1.4, 0.34]} r={0.05} c="#3a3f4a" z={0.08} />
        </>
      ) : (
        <>
          {/* the front wheel was knocked out of its arch and rests squashed against the ground, canted */}
          <Dot p={[-1.62, 0.2]} r={0.34} c="#101216" z={0.1} sy={0.62} />
          <Dot p={[-1.62, 0.2]} r={0.15} c="#7d8491" z={0.11} sy={0.62} />
        </>
      )}

      {/* body */}
      <Poly id={`body-${dmg}`} pts={BODY[dmg]} c={dmg === 'wrecked' ? RED_D : RED} z={0.02} />
      <Poly id="lower" pts={[[front, 0.36], [front, 0.62], [2.24, 0.62], [2.2, 0.36]]} c={dmg === 'intact' ? RED_D : GRIME} o={0.85} z={0.03} />
      <Line a={[front + 0.15, 0.9]} b={[1.95, 0.93]} w={0.04} c={RED_L} z={0.04} />
      {/* doors and handles */}
      <Line a={[-0.1, 0.4]} b={[-0.1, 1.02]} w={0.025} c={RED_D} z={0.045} />
      <Line a={[1.1, 0.4]} b={[1.1, 1.0]} w={0.025} c={RED_D} z={0.045} />
      <Line a={[0.0, 0.84]} b={[0.28, 0.84]} w={0.04} c="#2a0d10" z={0.05} />

      {/* glass */}
      {dmg === 'wrecked' ? (
        <>
          <Poly id="glass-w" pts={[[-0.7, 1.02], [-0.45, 1.34], [0.2, 1.28], [0.75, 1.36], [1.25, 1.02]]} c={GLASS_D} z={0.06} />
          {[[[-0.55, 1.1], [-0.4, 1.3]], [[-0.3, 1.05], [0.1, 1.28]], [[0.4, 1.06], [0.7, 1.33]], [[0.9, 1.04], [1.1, 1.2]], [[0.0, 1.1], [0.55, 1.2]]].map((l, i) => (
            <Line key={i} a={l[0] as Pt} b={l[1] as Pt} w={0.018} c={CRACK} z={0.07} o={0.8} />
          ))}
        </>
      ) : (
        <>
          <Poly id="glass" pts={[[-0.7, 1.02], [-0.42, 1.43], [0.78, 1.43], [1.28, 1.02]]} c={GLASS} z={0.06} />
          <Line a={[0.25, 1.02]} b={[0.3, 1.43]} w={0.05} c={RED_D} z={0.07} />
        </>
      )}
      {dmg === 'dented' && (
        <>
          {/* cracked windscreen: spokes from the point of impact and two rings */}
          {[[-0.45, 1.4], [-0.72, 1.33], [-0.6, 1.05], [-0.3, 1.2], [-0.74, 1.14], [-0.5, 1.1]].map((p, i) => (
            <Line key={i} a={[-0.58, 1.2]} b={p as Pt} w={0.016} c={CRACK} z={0.08} />
          ))}
          <Line a={[-0.66, 1.3]} b={[-0.5, 1.33]} w={0.014} c={CRACK} z={0.08} />
          <Line a={[-0.5, 1.33]} b={[-0.42, 1.2]} w={0.014} c={CRACK} z={0.08} />
          <Line a={[-0.66, 1.1]} b={[-0.5, 1.07]} w={0.014} c={CRACK} z={0.08} />
        </>
      )}

      {/* lamps and grille */}
      {dmg === 'intact' && <Dot p={[front + 0.08, 0.78]} r={0.1} c="#ffe9a0" z={0.06} sy={0.7} />}
      {dmg === 'dented' && <Dot p={[front + 0.1, 0.72]} r={0.09} c="#1a1a1e" z={0.06} sy={0.6} />}
      <Poly id="grille" pts={[[front, 0.44], [front + 0.06, 0.62], [front + 0.06, 0.44]]} c="#16181d" z={0.06} />
      <Dot p={[2.16, 0.8]} r={0.07} c={dmg === 'wrecked' ? '#6a1212' : '#ff4d4d'} z={0.06} sy={0.8} />

      {/* damage */}
      {dmg !== 'intact' && (
        <>
          <Poly id="crush" pts={[[front, 0.42], [front + 0.5, 0.5], [front + 0.35, 0.82], [front + 0.05, 0.78]]} c={GRIME} o={0.85} z={0.07} />
          <Line a={[front + 0.3, 0.95]} b={[front + 0.9, 1.04]} w={0.03} c="#2a0d10" z={0.07} />
          <Line a={[front + 0.55, 0.88]} b={[front + 1.1, 0.96]} w={0.025} c="#2a0d10" z={0.07} />
          {/* bumper torn off at one end, hanging */}
          <Poly id="bumper" pts={[[0, 0], [0.9, 0.06], [0.88, 0.16], [0, 0.12]]} c="#2b2e36" z={0.08} p={[front + 0.02, 0.3]} rz={-0.42} />
        </>
      )}
      {dmg === 'wrecked' && (
        <>
          {/* hood torn up and folded back at the windscreen */}
          <Poly id="hood" pts={[[0, 0], [-0.95, 0.04], [-0.92, 0.12], [0, 0.1]]} c={RED} z={0.09} p={[-1.0, 1.0]} rz={-0.78} />
          <Line a={[-1.62, 0.55]} b={[-1.3, 0.62]} w={0.03} c="#e0b050" z={0.08} o={0.9} />
          <Poly id="dent-door" pts={[[0, 0], [0.5, 0.05], [0.42, 0.34], [0.05, 0.3]]} c={GRIME} o={0.7} z={0.07} p={[0.35, 0.55]} />
          {/* fluid leaking onto the road */}
          <Poly id="leak" pts={[[0, 0], [1.2, 0], [1.0, 0.05], [0.2, 0.06]]} c="#0b0b0f" o={0.7} z={0.0} p={[-1.8, 0.01]} />
        </>
      )}

      {/* after the impact: sparks, glass, steam */}
      {struck && a < 0.7 &&
        Array.from({ length: 14 }, (_, i) => {
          const ang = (rnd(11, i) - 0.5) * 2.2;
          const sp = 2.5 + rnd(12, i) * 3;
          const x = front + 0.1 + Math.sin(ang) * sp * a * -0.6;
          const y = 0.8 + Math.cos(ang) * sp * 0.5 * a - 4.9 * a * a;
          return <Dot key={`sp${i}`} p={[x, y]} r={0.03} c={i % 3 ? '#ffb347' : '#fff2c0'} o={Math.max(0, 1 - a / 0.7)} z={0.2} />;
        })}
      {struck && a < 1.6 &&
        Array.from({ length: 10 }, (_, i) => {
          const sp = 1.2 + rnd(21, i) * 2.2;
          const x = -0.6 - rnd(22, i) * 0.4 - sp * a * 0.5;
          const y = 1.3 + rnd(23, i) * 0.2 + sp * 0.4 * a - 4.9 * a * a * 0.8;
          return <mesh key={`gl${i}`} geometry={BOX} material={mat('#cfe6f5', Math.max(0, 1 - a / 1.6))} position={[x, y, 0.2]} rotation={[0, 0, a * (3 + i)]} scale={[0.06, 0.03, 0.01]} />;
        })}
      {dmg !== 'intact' && struck &&
        Array.from({ length: 9 }, (_, i) => {
          const life = 2.6;
          const t0 = (a - 0.3 - i * 0.28) % life;
          if (a < 0.3 + i * 0.28 * 0.0 || t0 < 0) return null;
          const k = t0 / life;
          const fade = Math.max(0, 1 - a / 12) * (1 - k);
          const x = front + 0.8 + (rnd(31, i) - 0.5) * 0.5 + Math.sin(t0 * 2 + i) * 0.12 + k * 0.4;
          const y = 1.05 + k * 1.8;
          return <Dot key={`sm${i}`} p={[x, y]} r={0.14 + k * 0.32} c={dmg === 'wrecked' ? '#59595f' : '#9aa0a8'} o={0.5 * fade} z={0.15} />;
        })}
    </group>
  );
};

/** Bubbles rising from the car's cabin once the water is above the window line. */
export const CarBubbles: React.FC<{ e: EnvEntityFrame; surface: number; tEdit: number; z: number }> = ({ e, surface, tEdit, z }) => {
  if (surface < e.y - e.h / 2 + 1.05) return null;
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const life = 1.6 + rnd(41, i) * 1.2;
    const ph = ((tEdit * 0.9 + rnd(42, i)) % life) / life;
    const x = e.x - 1.6 + rnd(43, i) * 2.8 + Math.sin(tEdit * 3 + i) * 0.05;
    const y0 = e.y - e.h / 2 + 1.1;
    const y = y0 + ph * (surface - y0);
    if (y > surface) continue;
    const r = 0.03 + rnd(44, i) * 0.045;
    parts.push(<Dot key={i} p={[x, y]} r={r} c="#e8f6f8" o={0.7 * (1 - ph * 0.6)} z={z} />);
  }
  return <>{parts}</>;
};
