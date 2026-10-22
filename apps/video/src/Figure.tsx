import React from 'react';
import * as THREE from 'three';
import { RIG } from '../../../packages/motion/src/rig.ts';

export type P = [number, number];
/** hip, shoulder, head, lKnee, rKnee, lFoot, rFoot, lElbow, rElbow, lHand, rHand */
export const J = { hip: 0, shoulder: 1, head: 2, lKnee: 3, rKnee: 4, lFoot: 5, rFoot: 6, lElbow: 7, rElbow: 8, lHand: 9, rHand: 10 } as const;
export const pt = (j: number[], i: number): P => [j[i * 2], j[i * 2 + 1]];

// Geometry and materials are created once per browser tab and reused by every frame: creating them per render leaked
// until the hero meshes stopped drawing in long renders (rule R8b).
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
export const DISC = new THREE.CircleGeometry(1, 28);
const MATS = new Map<string, THREE.MeshBasicMaterial>();
export const mat = (color: string, opacity = 1): THREE.MeshBasicMaterial => {
  const key = color + opacity;
  let m = MATS.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
    MATS.set(key, m);
  }
  return m;
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number): string => {
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

export const Bone: React.FC<{ a: P; b: P; r: number; color: string; z?: number }> = ({ a, b, r, color, z = 0 }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  return (
    <>
      <mesh geometry={CYL} material={mat(color)} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]} scale={[r, Math.max(0.001, len), r]} />
      <mesh geometry={DISC} material={mat(color)} position={[a[0], a[1], z]} scale={[r, r, 1]} />
      <mesh geometry={DISC} material={mat(color)} position={[b[0], b[1], z]} scale={[r, r, 1]} />
    </>
  );
};

export const NEAR = '#e6e9f2';
export const FAR = '#8e97ad';
export const OUTLINE = '#0a0d16';
const WET = '#5f8ea6';

/** The stickman: far-side limbs, torso and head, then near-side limbs. `wetness` tints the legs toward the water colour. */
export const StickFigure: React.FC<{ j: number[]; z?: number; wetness?: number }> = ({ j, z = 0, wetness = 0 }) => {
  const hip = pt(j, J.hip);
  const sh = pt(j, J.shoulder);
  const head = pt(j, J.head);
  const R = 0.034;
  const limb = (a: number, b: number, c: number, color: string, zz: number) => (
    <>
      <Bone a={pt(j, a)} b={pt(j, b)} r={R + 0.012} color={OUTLINE} z={z + zz - 0.02} />
      <Bone a={pt(j, b)} b={pt(j, c)} r={R + 0.012} color={OUTLINE} z={z + zz - 0.02} />
      <Bone a={pt(j, a)} b={pt(j, b)} r={R} color={color} z={z + zz} />
      <Bone a={pt(j, b)} b={pt(j, c)} r={R} color={color} z={z + zz} />
    </>
  );
  return (
    <>
      {limb(J.hip, J.rKnee, J.rFoot, mix(FAR, WET, wetness * 0.8), -0.05)}
      {limb(J.shoulder, J.rElbow, J.rHand, FAR, -0.05)}
      <Bone a={hip} b={sh} r={0.075} color={OUTLINE} z={z - 0.09} />
      <Bone a={hip} b={sh} r={0.062} color="#d6cdb4" z={z} />
      <mesh geometry={DISC} material={mat(OUTLINE)} position={[head[0], head[1], z]} scale={[RIG.headR + 0.014, RIG.headR + 0.014, 1]} />
      <mesh geometry={DISC} material={mat('#f0d5b0')} position={[head[0], head[1], z + 0.01]} scale={[RIG.headR, RIG.headR, 1]} />
      {limb(J.hip, J.lKnee, J.lFoot, mix(NEAR, WET, wetness * 0.8), 0.2)}
      {limb(J.shoulder, J.lElbow, J.lHand, NEAR, 0.25)}
    </>
  );
};
