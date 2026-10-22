import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { LANES } from '@engine/contracts/src/lanes.ts';
import { CameraRig } from './CameraRig.tsx';

export type LaneTracks = {
  fps: number;
  frames: { frame: number; bodies: { id: string; x: number; y: number; angle: number }[] }[];
};
export type LanesProps = {
  tracks: LaneTracks;
};

// One material per colour per browser tab: building a new one on every render leaks GPU resources in long renders.
const TOONS = new Map<string, THREE.MeshToonMaterial>();
const toon = (color: string): THREE.MeshToonMaterial => {
  let m = TOONS.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color });
    TOONS.set(color, m);
  }
  return m;
};
const WATER = new THREE.MeshToonMaterial({ color: '#2a5d73', transparent: true, opacity: 0.8 });

/** Pure function of the frame: no clocks, no refs to previous frames. */
function walkPose(t: number) {
  const s = Math.sin(t * 6);
  return { legL: s * 0.6, legR: -s * 0.6, armL: -s * 0.5, armR: s * 0.5, bob: Math.abs(s) * 0.03 };
}

const Limb: React.FC<{ from: [number, number]; angle: number; len: number; color: string; r?: number }> = ({ from, angle, len, color, r = 0.035 }) => (
  <group position={[from[0], from[1], 0]} rotation={[0, 0, angle]}>
    <mesh position={[0, -len / 2, 0]} material={toon(color)}>
      <capsuleGeometry args={[r, len - r * 2, 4, 8]} />
    </mesh>
  </group>
);

const Figure: React.FC<{ x: number; t: number; groundY: number }> = ({ x, t, groundY }) => {
  const p = walkPose(t);
  const hipY = groundY + 0.9 + p.bob;
  return (
    <group position={[x, 0, LANES.hero.z]}>
      <Limb from={[0, hipY]} angle={p.legL} len={0.9} color="#1d1d24" />
      <Limb from={[0, hipY]} angle={p.legR} len={0.9} color="#1d1d24" />
      <mesh position={[0, hipY + 0.35, 0]} material={toon('#d9d3c2')}>
        <capsuleGeometry args={[0.13, 0.5, 4, 10]} />
      </mesh>
      <Limb from={[0, hipY + 0.6]} angle={p.armL} len={0.65} color="#1d1d24" r={0.03} />
      <Limb from={[0, hipY + 0.6]} angle={p.armR} len={0.65} color="#1d1d24" r={0.03} />
      <mesh position={[0, hipY + 0.95, 0]} material={toon('#f0d5b0')}>
        <sphereGeometry args={[0.14, 16, 12]} />
      </mesh>
    </group>
  );
};

export const Skyline: React.FC<{ lane: keyof typeof LANES; color: string; count: number; seed: number; height: number }> = ({ lane, color, count, seed, height }) => {
  const blocks = useMemo(() => {
    let s = seed;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    return Array.from({ length: count }, (_, i) => ({ x: -90 + (i / count) * 200 + rnd() * 3, w: 4 + rnd() * 7, h: height * (0.4 + rnd() * 0.9) }));
  }, [count, seed, height]);
  const z = LANES[lane].z;
  return (
    <group position={[0, 0, z]}>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]} material={toon(color)}>
          <boxGeometry args={[b.w, b.h, 2]} />
        </mesh>
      ))}
    </group>
  );
};

export const Lanes: React.FC<LanesProps> = ({ tracks }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const f = tracks.frames[Math.min(frame, tracks.frames.length - 1)];
  const crate = f.bodies.find((b) => b.id === 'crate');
  const camX = 2 + t * 0.8; // slow dolly: parallax between lanes shows the depth
  const waterY = 0.15 + Math.max(0, t - 2) * 0.35;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#3a4358,#8a8fa0)' }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [camX, 2.4, 17], rotation: [0, 0, 0], fov: 46, near: 0.1, far: 3000 }}>
        <CameraRig position={[camX, 2.4, 17]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[-6, 10, 8]} intensity={1.6} />
        <Skyline lane="far" color="#4b5468" count={26} seed={3} height={34} />
        <Skyline lane="mid" color="#39404f" count={14} seed={9} height={14} />
        <mesh position={[0, -0.25, 0]} material={toon('#2c2f38')}>
          <boxGeometry args={[300, 0.5, 12]} />
        </mesh>
        {crate && (
          <mesh position={[crate.x, crate.y, LANES.hero.z]} rotation={[0, 0, crate.angle]} material={toon('#a9712f')}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
          </mesh>
        )}
        <Figure x={camX - 3 + t * 0.2} t={t} groundY={0} />
        <mesh position={[camX, waterY / 2 - 0.1, LANES.near.z]} material={WATER}>
          <boxGeometry args={[80, waterY + 0.2, 8]} />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
