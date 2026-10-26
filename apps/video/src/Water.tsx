import React from 'react';
import * as THREE from 'three';
import type { WaterProfile } from '../../../packages/world/src/envtimeline.ts';
import { rnd, type ActiveFx } from './fx.ts';
import { DISC, mat } from './Figure.tsx';

/**
 * Water for the harbor scenes. A smooth surface strip (one shared geometry whose vertices are rewritten every render from the
 * baked profile, never re-created) shaded by a fragment shader: depth colour, flowing streaks, foam, bubbles. On top of it:
 * a curling crest and spray along any bore front, and ripples / splash crowns where something enters the water.
 * Every animated value is a function of (profile, edit time, effect age): nothing carries over between frames (rule R8b).
 */
const MAXN = 170;
const POS = new Float32Array(MAXN * 2 * 3);
const SD = new Float32Array(MAXN * 2);
const DEPTH = new Float32Array(MAXN * 2);
const VEL = new Float32Array(MAXN * 2);
const STEEP = new Float32Array(MAXN * 2);
const GEOM = new THREE.BufferGeometry();
GEOM.setAttribute('position', new THREE.BufferAttribute(POS, 3).setUsage(THREE.DynamicDrawUsage));
GEOM.setAttribute('aSD', new THREE.BufferAttribute(SD, 1).setUsage(THREE.DynamicDrawUsage));
GEOM.setAttribute('aDepth', new THREE.BufferAttribute(DEPTH, 1).setUsage(THREE.DynamicDrawUsage));
GEOM.setAttribute('aU', new THREE.BufferAttribute(VEL, 1).setUsage(THREE.DynamicDrawUsage));
GEOM.setAttribute('aSteep', new THREE.BufferAttribute(STEEP, 1).setUsage(THREE.DynamicDrawUsage));
{
  const idx: number[] = [];
  for (let i = 0; i < MAXN - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  GEOM.setIndex(idx);
}

const VERT = /* glsl */ `
attribute float aSD; attribute float aDepth; attribute float aU; attribute float aSteep;
varying float vSD; varying float vDepth; varying float vU; varying float vSteep; varying float vX;
void main() {
  vSD = aSD; vDepth = aDepth; vU = aU; vSteep = aSteep; vX = position.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
uniform float uTime;
varying float vSD; varying float vDepth; varying float vU; varying float vSteep; varying float vX;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float alpha = smoothstep(0.004, 0.05, vDepth);
  float dep = clamp(vDepth / 3.0, 0.0, 1.0);
  vec3 shallow = vec3(0.17, 0.52, 0.58);
  vec3 deep = vec3(0.035, 0.17, 0.24);
  vec3 col = mix(shallow, deep, clamp(vSD * 0.55 + dep * 0.35, 0.0, 1.0));
  // sunlit skin just under the surface
  col += vec3(0.10, 0.20, 0.20) * exp(-vSD * 2.4);
  // streaks of current: they drift with the flow and lean with depth
  float flow = vU;
  float s = vnoise(vec2(vX * 1.1 - uTime * flow * 0.45 + vSD * 0.8, vSD * 5.0 + uTime * 0.15));
  col += 0.07 * smoothstep(0.58, 0.92, s) * exp(-vSD * 0.9);
  // foam at the surface, thicker where the water is fast or steep
  float fast = clamp(abs(flow) / 3.5 + vSteep, 0.0, 1.0);
  float fn = vnoise(vec2(vX * 4.0 - uTime * flow * 0.7, uTime * 0.9));
  float band = 0.05 + 0.20 * fast;
  float foam = smoothstep(band, 0.0, vSD + (fn - 0.5) * 0.10);
  col = mix(col, vec3(0.94, 0.98, 0.99), foam * (0.55 + 0.45 * fast));
  // aeration: bubbles and froth in fast water, deeper than the foam band
  float b = step(0.90, vnoise(vec2(vX * 8.0 - uTime * flow * 1.3, vSD * 9.0 - uTime * 1.8))) * fast * exp(-vSD * 0.8);
  col = mix(col, vec3(0.86, 0.95, 0.97), b * 0.75);
  gl_FragColor = vec4(col, alpha * 0.82);
}`;

const WATER_MAT = new THREE.ShaderMaterial({
  vertexShader: VERT,
  fragmentShader: FRAG,
  uniforms: { uTime: { value: 0 } },
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});

/** Surface chop: travels with the flow, grows with speed and steepness. */
const chop = (x: number, t: number, u: number, steep: number, depth: number): number => {
  if (depth < 0.05) return 0;
  const a = (0.02 + 0.045 * Math.min(1, Math.abs(u) / 4) + 0.05 * steep) * Math.min(1, depth / 0.4);
  return a * (0.6 * Math.sin(x * 2.1 - t * 2.4 - u * t * 0.25) + 0.4 * Math.sin(x * 4.3 + t * 1.7 + u * t * 0.2));
};

export const WaterSurface: React.FC<{ p: WaterProfile; tEdit: number; z: number }> = ({ p, tEdit, z }) => {
  const n = Math.min(p.depth.length, MAXN - 1);
  // column 0 is a far-left extension so the sea continues past the sampled region
  const put = (col: number, x: number, eta: number, depth: number, u: number, steep: number) => {
    const top = eta + chop(x, tEdit, u, steep, depth);
    const bot = eta - depth;
    const a = col * 2;
    POS.set([x, top, z], a * 3);
    POS.set([x, bot, z], (a + 1) * 3);
    SD[a] = 0;
    SD[a + 1] = depth;
    DEPTH[a] = DEPTH[a + 1] = depth;
    VEL[a] = VEL[a + 1] = u;
    STEEP[a] = STEEP[a + 1] = steep;
  };
  put(0, p.x0 - 40, p.eta[0], p.depth[0], 0, 0);
  for (let i = 0; i < n; i++) {
    const g = ((p.depth[Math.min(n - 1, i + 1)] ?? 0) - (p.depth[Math.max(0, i - 1)] ?? 0)) / (2 * p.step);
    put(i + 1, p.x0 + i * p.step, p.eta[i], p.depth[i], p.u[i], Math.min(1, Math.abs(g) / 0.5));
  }
  // collapse the unused tail onto the last column
  for (let col = n + 1; col < MAXN; col++) {
    const a = col * 2;
    POS.copyWithin(a * 3, (n * 2) * 3, (n * 2) * 3 + 6);
    SD[a] = SD[n * 2];
    SD[a + 1] = SD[n * 2 + 1];
    DEPTH[a] = DEPTH[a + 1] = 0;
    VEL[a] = VEL[a + 1] = 0;
    STEEP[a] = STEEP[a + 1] = 0;
  }
  for (const name of ['position', 'aSD', 'aDepth', 'aU', 'aSteep']) (GEOM.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
  WATER_MAT.uniforms.uTime.value = tEdit;
  return <mesh geometry={GEOM} material={WATER_MAT} frustumCulled={false} renderOrder={10} />;
};

// ---------------------------------------------------------------------------------------------------------------------
// Crest and spray at bore fronts

const CURL = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.15, 0);
  s.quadraticCurveTo(0.05, 0.55, 0.30, 0.95); // the back face rising
  s.quadraticCurveTo(0.55, 1.12, 0.78, 0.92); // the crest leaning over
  s.quadraticCurveTo(0.90, 0.78, 0.80, 0.66); // the lip curling down
  s.quadraticCurveTo(0.62, 0.74, 0.48, 0.70); // the hollow under it
  s.quadraticCurveTo(0.40, 0.45, 0.45, 0);
  s.closePath();
  return new THREE.ShapeGeometry(s, 12);
})();

interface Front {
  x: number;
  eta: number;
  height: number;
  dir: 1 | -1;
  speed: number;
}

/** Bore fronts: places where the depth steps up sharply while the water moves fast. */
export function findFronts(p: WaterProfile): Front[] {
  const out: Front[] = [];
  for (let i = 2; i < p.depth.length - 2; i++) {
    const rise = p.depth[i + 1] - p.depth[i - 1];
    const dir: 1 | -1 = p.u[i] >= 0 ? 1 : -1;
    // the front is where depth rises in the direction of travel
    if (Math.abs(p.u[i]) > 1.2 && rise * dir < -0.25 && p.depth[i - dir] > 0.15) {
      const prev = out[out.length - 1];
      const x = p.x0 + i * p.step;
      if (!prev || x - prev.x > 2) out.push({ x, eta: p.eta[i - dir], height: Math.min(2.2, p.depth[i - dir]), dir, speed: Math.abs(p.u[i]) });
    }
  }
  return out;
}

export const BoreFx: React.FC<{ p: WaterProfile; tEdit: number; z: number }> = ({ p, tEdit, z }) => {
  const fronts = findFronts(p);
  const parts: React.ReactNode[] = [];
  fronts.forEach((f, fi) => {
    const h = Math.max(0.35, f.height);
    // curling crest: white lip over a translucent teal body
    parts.push(<mesh key={`c${fi}`} geometry={CURL} material={mat('#e9f6f8', 0.95)} position={[f.x - f.dir * 0.1, f.eta - h * 0.95, z + 0.06]} scale={[f.dir * h * 0.95, h * 0.95, 1]} renderOrder={12} />);
    parts.push(<mesh key={`d${fi}`} geometry={CURL} material={mat('#2a8aa0', 0.55)} position={[f.x - f.dir * 0.1, f.eta - h * 0.95, z + 0.04]} scale={[f.dir * h * 0.8, h * 0.8, 1]} renderOrder={12} />);
    // spray thrown ahead of the crest: 22 droplets, each on its own repeating ballistic arc
    for (let k = 0; k < 14; k++) {
      const life = 0.7 + rnd(fi * 977 + 5, k) * 0.7;
      const ph = ((tEdit * 1.25 + rnd(fi * 977 + 11, k)) % life) / life;
      const age = ph * life;
      const vx = f.dir * (0.8 + rnd(fi * 977 + 17, k) * 2.2 + f.speed * 0.25);
      const vy = 1.2 + rnd(fi * 977 + 23, k) * 1.8 + h * 0.6;
      const x = f.x + f.dir * 0.5 * h + vx * age + (rnd(fi * 977 + 29, k) - 0.5) * 0.3;
      const y = f.eta + 0.05 + vy * age - 4.9 * age * age;
      if (y < f.eta - 0.02) continue;
      const r = (0.025 + rnd(fi * 977 + 31, k) * 0.035) * (1 - ph * 0.5);
      parts.push(<mesh key={`s${fi}-${k}`} geometry={DISC} material={mat('#eef9fb', 0.9 * (1 - ph))} position={[x, y, z + 0.1]} scale={[r, r, 1]} renderOrder={12} />);
    }
  });
  return <>{parts}</>;
};

// ---------------------------------------------------------------------------------------------------------------------
// Where things enter the water: ripples, a splash crown, a foam burst, droplets

export const SplashFx: React.FC<{ e: ActiveFx; z: number }> = ({ e, z }) => {
  const dur = e.kind === 'impact' ? 1.6 : e.kind === 'entry' ? 2.0 : 0.9;
  if (e.age > dur) return null;
  const k = e.age / dur;
  const parts: React.ReactNode[] = [];
  const P = Math.max(0.3, e.power);
  // ripples: thin bars on the surface expanding both ways, three rings a beat apart
  for (let r = 0; r < 3; r++) {
    const a = e.age - r * 0.18;
    if (a <= 0) continue;
    const reach = (0.25 + a * (1.4 + 0.5 * P)) * (1 + r * 0.2);
    const fade = Math.max(0, 1 - a / (dur * 0.9));
    for (const sgn of [-1, 1]) parts.push(<mesh key={`r${r}${sgn}`} geometry={DISC} material={mat('#f2fbfc', 0.8 * fade)} position={[e.x + sgn * reach, e.y + 0.02, z + 0.12]} scale={[0.22 + 0.1 * P, 0.025, 1]} renderOrder={12} />);
  }
  // splash crown: droplets on ballistic arcs
  const n = Math.round(10 + 14 * P);
  for (let i = 0; i < n; i++) {
    const ang = (rnd(e.seed, i) - 0.5) * 2.4; // fan around the vertical
    const sp = (1.6 + rnd(e.seed, i + 100) * 2.2) * (0.55 + 0.35 * Math.min(P, 1.7));
    const vx = Math.sin(ang) * sp * 0.7;
    const vy = Math.cos(ang) * sp;
    const x = e.x + vx * e.age;
    const y = e.y + vy * e.age - 4.9 * e.age * e.age;
    if (y < e.y - 0.01) continue;
    const r = (0.03 + rnd(e.seed, i + 200) * 0.05) * (1 - k * 0.5);
    parts.push(<mesh key={`d${i}`} geometry={DISC} material={mat('#f2fbfc', 0.9 * (1 - k))} position={[x, y, z + 0.14]} scale={[r, r, 1]} renderOrder={12} />);
  }
  // foam clumps that open along the surface and fade where it landed
  if (e.kind !== 'step') {
    for (let i = 0; i < 5; i++) {
      const dir = (rnd(e.seed, 300 + i) - 0.5) * 2;
      const rad = (0.07 + 0.09 * rnd(e.seed, 310 + i)) * (0.5 + P * 0.5) * Math.min(1, e.age * 4);
      parts.push(<mesh key={`f${i}`} geometry={DISC} material={mat('#f7fdfe', 0.85 * (1 - k))} position={[e.x + dir * (0.15 + 0.7 * P * Math.min(1, e.age * 1.5)), e.y + 0.03, z + 0.09]} scale={[rad * 1.8, rad * 0.7, 1]} renderOrder={12} />);
    }
  }
  return <>{parts}</>;
};
