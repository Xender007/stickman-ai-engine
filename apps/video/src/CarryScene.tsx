import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { RIG } from '../../../packages/motion/src/rig.ts';
import type { CarryProps } from './carryProps.ts';
import { Skyline } from './Lanes.tsx';
import { CameraRig } from './CameraRig.tsx';

import { Bone, DISC, J, mat, NEAR, FAR, OUTLINE, pt } from './Figure.tsx';

const PLANK = '#6e4a22';

export const CarryScene: React.FC<CarryProps> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const f = frames[Math.min(frame, frames.length - 1)];
  const { j, crate, camX } = f;
  const hip = pt(j, J.hip);
  const sh = pt(j, J.shoulder);
  const head = pt(j, J.head);
  const feetMid = (pt(j, J.lFoot)[0] + pt(j, J.rFoot)[0]) / 2;
  const R = 0.034;

  const limb = (a: number, b: number, c: number, color: string, z: number) => (
    <>
      <Bone a={pt(j, a)} b={pt(j, b)} r={R + 0.012} color={OUTLINE} z={z - 0.02} />
      <Bone a={pt(j, b)} b={pt(j, c)} r={R + 0.012} color={OUTLINE} z={z - 0.02} />
      <Bone a={pt(j, a)} b={pt(j, b)} r={R} color={color} z={z} />
      <Bone a={pt(j, b)} b={pt(j, c)} r={R} color={color} z={z} />
    </>
  );

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#242b45,#aa8c88 78%)' }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [camX, 1.55, 7.2], rotation: [0, 0, 0], fov: 40, near: 0.1, far: 3000 }}>
        <CameraRig position={[camX, 1.55, 7.2]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[-6, 10, 8]} intensity={1.2} />
        <Skyline lane="far" color="#3a4260" count={30} seed={3} height={34} />
        <Skyline lane="mid" color="#2b3150" count={16} seed={9} height={15} />
        <mesh position={[camX, -0.25, -2]}>
          <boxGeometry args={[60, 0.5, 8]} />
          <meshBasicMaterial color="#1a1d2a" />
        </mesh>
        <mesh position={[camX, 0.01, 1.2]}>
          <boxGeometry args={[60, 0.02, 0.05]} />
          <meshBasicMaterial color="#555d78" />
        </mesh>
        {/* contact shadow under the feet */}
        <mesh position={[feetMid, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.55 + hip[1] * 0.2, 0.16, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} />
        </mesh>
        {/* far-side limbs, then body and head, then the crate, then near-side limbs */}
        {limb(J.hip, J.rKnee, J.rFoot, FAR, -0.05)}
        {limb(J.shoulder, J.rElbow, J.rHand, FAR, -0.05)}
        <Bone a={hip} b={sh} r={0.075} color={OUTLINE} z={-0.09} />
        <Bone a={hip} b={sh} r={0.062} color="#d6cdb4" z={0} />
        <mesh geometry={DISC} material={mat(OUTLINE)} position={[head[0], head[1], 0]} scale={[RIG.headR + 0.014, RIG.headR + 0.014, 1]} />
        <mesh geometry={DISC} material={mat("#f0d5b0")} position={[head[0], head[1], 0.01]} scale={[RIG.headR, RIG.headR, 1]} />
        <group position={[crate[0], crate[1], 0.12]} rotation={[0, 0, crate[2]]}>
          <mesh>
            <boxGeometry args={[0.52, 0.42, 0.3]} />
            <meshBasicMaterial color={OUTLINE} />
          </mesh>
          <mesh position={[0, 0, 0.16]}>
            <boxGeometry args={[0.48, 0.38, 0.02]} />
            <meshBasicMaterial color="#b07a3a" />
          </mesh>
          {[0, 0.11, -0.11].map((y) => (
            <mesh key={y} position={[0, y, 0.175]}>
              <boxGeometry args={[0.48, 0.03, 0.01]} />
              <meshBasicMaterial color={PLANK} />
            </mesh>
          ))}
        </group>
        {limb(J.hip, J.lKnee, J.lFoot, NEAR, 0.2)}
        {limb(J.shoulder, J.lElbow, J.lHand, NEAR, 0.25)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
