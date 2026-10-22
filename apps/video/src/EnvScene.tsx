import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { LANES } from '@engine/contracts/src/lanes.ts';
import type { EnvEntityFrame, EnvFrame } from '../../../packages/world/src/envtimeline.ts';
import { CameraRig } from './CameraRig.tsx';
import { Skyline } from './Lanes.tsx';
import { StickFigure } from './Figure.tsx';
import { GANTRY as STAIRS } from '../../../packages/motion/src/pilot.ts';

export type EnvProps = { frames: EnvFrame[]; label?: boolean };

// Shared geometry and materials: created once per browser tab, never per render (rule R8b).
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 18);
const DISC = new THREE.CircleGeometry(1, 28);
const MATS = new Map<string, THREE.MeshBasicMaterial>();
const mat = (color: string, opacity = 1): THREE.MeshBasicMaterial => {
  const key = color + opacity;
  let m = MATS.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    MATS.set(key, m);
  }
  return m;
};

type V3 = [number, number, number];
const Box: React.FC<{ p: V3; s: V3; c: string; o?: number; rz?: number }> = ({ p, s, c, o = 1, rz = 0 }) => <mesh geometry={BOX} material={mat(c, o)} position={p} scale={s} rotation={[0, 0, rz]} />;
const Disc: React.FC<{ p: V3; r: number; c: string; o?: number }> = ({ p, r, c, o = 1 }) => <mesh geometry={DISC} material={mat(c, o)} position={p} scale={[r, r, 1]} />;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Wet mark: a dark band up to the wet line, with a lighter rim along its top edge. Opacity follows the soak. */
const WetBand: React.FC<{ e: EnvEntityFrame; z: number }> = ({ e, z }) => {
  if (e.wetLine <= 0.001) return null;
  const base = e.y - e.h / 2;
  const hgt = Math.min(e.h, e.wetLine);
  return (
    <>
      <Box p={[e.x, base + hgt / 2, z]} s={[e.w, hgt, 0.02]} c="#06222f" o={0.55 * e.wetness} />
      <Box p={[e.x, base + hgt, z + 0.01]} s={[e.w, 0.05, 0.02]} c="#9fd3e6" o={0.8 * e.wetness} />
    </>
  );
};

const Building: React.FC<{ e: EnvEntityFrame }> = ({ e }) => {
  const z = LANES[e.lane as 'near'].z;
  const cols = Math.max(2, Math.round(e.w / 2));
  const rows = Math.max(3, Math.round(e.h / 2.6));
  const windows: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = hash(`${e.id}${r}${c}`) % 3 === 0;
      const x = e.x - e.w / 2 + ((c + 0.5) * e.w) / cols;
      const y = e.y - e.h / 2 + 1.6 + r * 2.6;
      if (y > e.y + e.h / 2 - 1) continue;
      windows.push(<Box key={`${r}-${c}`} p={[x, y, z + 0.02]} s={[0.9, 1.3, 0.02]} c={lit ? '#f4c862' : '#171c2e'} />);
    }
  }
  return (
    <>
      <Box p={[e.x, e.y, z]} s={[e.w, e.h, 3]} c="#2a3047" />
      <Box p={[e.x, e.y + e.h / 2 + 0.15, z]} s={[e.w + 0.3, 0.3, 3.2]} c="#1d2236" />
      {windows}
      <WetBand e={e} z={z + 1.55} />
    </>
  );
};

const Car: React.FC<{ e: EnvEntityFrame }> = ({ e }) => {
  const z = 0;
  const base = e.y - e.h / 2;
  const wrecked = e.damage === 'wrecked';
  const dented = e.damage !== 'intact';
  const cabinH = wrecked ? 0.5 : 0.7;
  return (
    <group position={[e.x, 0, z]}>
      <Box p={[0, base + 0.55, 0]} s={[e.w, 0.8, 1.7]} c="#2b0f12" />
      <Box p={[0, base + 0.55, 0.01]} s={[e.w - 0.06, 0.74, 1.7]} c="#b3262c" />
      <Box p={[-0.1, base + 1.0 + cabinH / 2 - 0.05, 0]} s={[2.3, cabinH, 1.6]} c="#2b0f12" />
      <Box p={[-0.1, base + 1.0 + cabinH / 2 - 0.05, 0.01]} s={[2.24, cabinH - 0.06, 1.6]} c="#9c2025" />
      <Box p={[-0.1, base + 1.0 + cabinH / 2 - 0.05, 0.85]} s={[2.0, cabinH - 0.2, 0.02]} c={wrecked ? '#2a3140' : '#5f7893'} />
      <Disc p={[-1.4, base + 0.32, 0.9]} r={0.38} c="#0b0b0e" />
      <Disc p={[1.4, base + 0.32, 0.9]} r={0.38} c="#0b0b0e" />
      <Disc p={[-1.4, base + 0.32, 0.92]} r={0.16} c="#8d93a0" />
      <Disc p={[1.4, base + 0.32, 0.92]} r={0.16} c="#8d93a0" />
      {dented && (
        <>
          {/* crumpled front: the log struck the seaward (left) end */}
          <Box p={[-e.w / 2 + 0.28, base + 0.55, 0.9]} s={[0.55, 0.65, 0.02]} c="#4a1216" rz={0.12} />
          <Box p={[-e.w / 2 + 0.2, base + 0.35, 0.91]} s={[0.35, 0.3, 0.02]} c="#2b0f12" rz={-0.3} />
          <Box p={[-e.w / 2 + 0.75, base + 0.62, 0.91]} s={[0.5, 0.05, 0.02]} c="#2b0f12" rz={0.5} />
          <Box p={[-0.9, base + 1.28, 0.87]} s={[0.7, 0.04, 0.02]} c="#dfe6ee" rz={0.6} />
          <Box p={[-0.8, base + 1.26, 0.87]} s={[0.5, 0.04, 0.02]} c="#dfe6ee" rz={-0.5} />
        </>
      )}
      <WetBand e={{ ...e, x: 0, y: e.y }} z={1.0} />
    </group>
  );
};

const Log: React.FC<{ e: EnvEntityFrame }> = ({ e }) => (
  <group position={[e.x, e.y, 0.2]} rotation={[0, 0, e.angle]}>
    <mesh geometry={CYL} material={mat('#5b4026')} scale={[e.h / 2, e.w, e.h / 2]} rotation={[0, 0, Math.PI / 2]} />
    <Box p={[0, 0.03, 0.2]} s={[e.w - 0.1, 0.04, 0.02]} c="#7a5a38" />
    <Disc p={[e.w / 2, 0, 0.18]} r={e.h / 2.2} c="#a98557" />
  </group>
);

const Lamp: React.FC<{ e: EnvEntityFrame }> = ({ e }) => (
  <>
    <Box p={[e.x, e.y, 0]} s={[e.w, e.h, 0.25]} c="#14171f" />
    <Box p={[e.x + 0.45, e.y + e.h / 2, 0]} s={[1.0, 0.18, 0.25]} c="#14171f" />
    <Disc p={[e.x + 0.85, e.y + e.h / 2 - 0.2, 0.1]} r={0.22} c="#ffd98a" />
    <WetBand e={e} z={0.15} />
  </>
);

const Crate: React.FC<{ e: EnvEntityFrame }> = ({ e }) => (
  <group position={[e.x, e.y, LANES[e.lane as 'front' | 'hero'].z + 0.2]} rotation={[0, 0, e.angle]}>
    <Box p={[0, 0, 0]} s={[e.w + 0.04, e.h + 0.04, 0.5]} c="#2b1c0e" />
    <Box p={[0, 0, 0.26]} s={[e.w - 0.04, e.h - 0.04, 0.02]} c="#b07a3a" />
    {[-0.2, 0, 0.2].map((y) => (
      <Box key={y} p={[0, y * (e.h / 0.7), 0.28]} s={[e.w - 0.04, 0.05, 0.01]} c="#6e4a22" />
    ))}
    <Box p={[0, 0, 0.28]} s={[0.06, e.h - 0.04, 0.01]} c="#6e4a22" />
  </group>
);

/** The solver's water: one thin translucent column per cell, foam where it moves fast or steepens (bore fronts, overfalls). */
const ProfileWater: React.FC<{ f: EnvFrame }> = ({ f }) => {
  const p = f.water.profile!;
  const cols: React.ReactNode[] = [];
  for (let i = 0; i < p.depth.length; i++) {
    const d = p.depth[i];
    if (d < 0.004) continue;
    const x = p.x0 + i * p.step;
    const eta = p.eta[i];
    const steep = Math.abs(d - (p.depth[i - 1] ?? d)) > 0.25 || Math.abs(d - (p.depth[i + 1] ?? d)) > 0.25;
    const fast = Math.abs(p.u[i]) > 3;
    cols.push(<Box key={`w${i}`} p={[x, eta - d / 2, 2.3]} s={[p.step + 0.02, d, 0.4]} c="#1c4a60" o={0.68} />);
    cols.push(<Box key={`t${i}`} p={[x, eta, 2.35]} s={[p.step + 0.02, 0.08, 0.45]} c="#cfe9f2" o={0.95} />);
    if (steep || fast) cols.push(<Box key={`f${i}`} p={[x, eta + 0.08, 2.4]} s={[p.step + 0.02, 0.28, 0.45]} c="#f2fafc" o={0.85} />);
  }
  // beyond the sampled region the sea continues at the level of the first cell
  const seaEta = p.eta[0];
  cols.push(<Box key="sea" p={[p.x0 - 20, (seaEta - 30) / 2, 2.3]} s={[40, seaEta + 30, 0.4]} c="#1c4a60" o={0.68} />);
  return <>{cols}</>;
};

/** Stair gantry: 12 treads up to a raised landing on posts, with a rail. Geometry comes from the entity: width = stairs + landing. */
const GANTRY = STAIRS; // one source: the same numbers drive the character's footholds
const Gantry: React.FC<{ e: EnvEntityFrame }> = ({ e }) => {
  const x0 = e.x - e.w / 2;
  const landing0 = x0 + GANTRY.n * GANTRY.run;
  const top = GANTRY.n * GANTRY.rise;
  const z = 0.9;
  const parts: React.ReactNode[] = [];
  for (let j = 1; j <= GANTRY.n; j++) {
    const xc = x0 + (j - 0.5) * GANTRY.run;
    parts.push(<Box key={'t' + j} p={[xc, (j * GANTRY.rise) / 2 - 0.0, z]} s={[GANTRY.run, j * GANTRY.rise, 1.6]} c={j % 2 ? '#4a4f5e' : '#434857'} />);
    parts.push(<Box key={'n' + j} p={[xc, j * GANTRY.rise + 0.012, z + 0.81]} s={[GANTRY.run, 0.03, 0.02]} c="#c9cfdc" />);
  }
  const lw = e.w - GANTRY.n * GANTRY.run;
  parts.push(<Box key="deck" p={[landing0 + lw / 2, top - 0.09, z]} s={[lw, 0.18, 1.6]} c="#3c4150" />);
  parts.push(<Box key="deckTop" p={[landing0 + lw / 2, top + 0.01, z + 0.81]} s={[lw, 0.03, 0.02]} c="#c9cfdc" />);
  for (const px of [landing0 + 0.2, landing0 + lw - 0.2]) parts.push(<Box key={'p' + px} p={[px, top / 2 - 0.09, z]} s={[0.22, top - 0.18, 0.22]} c="#2a2e3a" />);
  for (let i = 0; i <= 8; i++) parts.push(<Box key={'r' + i} p={[landing0 + (i * lw) / 8, top + 0.55, z + 0.78]} s={[0.05, 1.1, 0.05]} c="#8b91a3" />);
  parts.push(<Box key="rail" p={[landing0 + lw / 2, top + 1.1, z + 0.78]} s={[lw, 0.06, 0.06]} c="#8b91a3" />);
  parts.push(<Box key="srail" p={[x0 + (GANTRY.n * GANTRY.run) / 2, top / 2 + 1.1, z + 0.78]} s={[Math.hypot(GANTRY.n * GANTRY.run, top), 0.06, 0.06]} c="#8b91a3" rz={Math.atan2(top, GANTRY.n * GANTRY.run)} />);
  return (
    <>
      {parts}
      <WetBand e={{ ...e, w: GANTRY.n * GANTRY.run, x: x0 + (GANTRY.n * GANTRY.run) / 2, h: top }} z={z + 0.83} />
    </>
  );
};

const Bollard: React.FC<{ e: EnvEntityFrame }> = ({ e }) => (
  <>
    <Box p={[e.x, e.y, 0.3]} s={[e.w, e.h, 0.35]} c="#c9a227" />
    <WetBand e={e} z={0.5} />
  </>
);

export const EnvScene: React.FC<EnvProps> = ({ frames, label = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const f = frames[Math.min(frame, frames.length - 1)];
  const cam = f.camera;
  const level = f.water.level;
  const flooded = Number.isFinite(f.water.front) && f.water.front > 0;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#1c2340,#9b7f7c 80%)' }}>
      <ThreeCanvas width={width} height={height} camera={{ position: cam.pos, rotation: [0, 0, 0], fov: cam.fovDeg, near: 0.1, far: 3000 }}>
        <CameraRig position={cam.pos} fov={cam.fovDeg} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[-6, 10, 8]} intensity={1.2} />
        <Skyline lane="far" color="#3a4260" count={30} seed={3} height={34} />
        <Skyline lane="mid" color="#2b3150" count={16} seed={9} height={15} />
        {/* street, quay wall and ground fill so no camera ever sees the background below the world */}
        <Box p={[19, -0.5, -2]} s={[42, 1, 16]} c="#23262f" />
        <Box p={[19, 0.01, 5.8]} s={[42, 0.04, 0.25]} c="#555d78" />
        <Box p={[19, -20, 4]} s={[160, 40, 60]} c="#171a22" />
        <Box p={[-3, -15, -2]} s={[6, 30, 16]} c="#363b4c" />
        {f.entities.map((e) => {
          if (e.kind === 'building') return <Building key={e.id} e={e} />;
          if (e.kind === 'car') return <Car key={e.id} e={e} />;
          if (e.kind === 'gantry') return <Gantry key={e.id} e={e} />;
          if (e.kind === 'character') return null; // drawn from f.characters (joints), below
          if (e.kind === 'log') return <Log key={e.id} e={e} />;
          if (e.kind === 'crate') return <Crate key={e.id} e={e} />;
          if (e.kind === 'lamp') return <Lamp key={e.id} e={e} />;
          return <Bollard key={e.id} e={e} />;
        })}
        {f.characters.map((c) => (
          <StickFigure key={c.id} j={c.j} z={LANES.front.z} wetness={c.wetness} />
        ))}
        {/* one water for every camera */}
        {f.water.profile && <ProfileWater f={f} />}
        {!f.water.profile && <Box p={[-33, (level - 30) / 2, 2.3]} s={[54, level + 30, 0.4]} c="#1c4a60" o={0.68} />}
        {!f.water.profile && <Box p={[-33, level, 2.35]} s={[54, 0.1, 0.45]} c="#cfe9f2" o={0.95} />}
        {!f.water.profile && flooded && level > 0 && (
          <>
            <Box p={[f.water.front / 2, level / 2, 2.3]} s={[f.water.front, level, 0.4]} c="#1c4a60" o={0.68} />
            <Box p={[f.water.front / 2, level, 2.35]} s={[f.water.front, 0.1, 0.45]} c="#cfe9f2" o={0.95} />
            <Box p={[f.water.front, level / 2, 2.35]} s={[0.3, level + 0.1, 0.45]} c="#e8f4f8" o={0.9} />
          </>
        )}
      </ThreeCanvas>
      {label && (
        <div style={{ position: 'absolute', left: 36, top: 40, padding: '10px 18px', background: 'rgba(0,0,0,0.55)', color: '#e6e9f2', fontFamily: 'monospace', fontSize: 34, borderRadius: 8 }}>
          {cam.id.split('@')[0].replace('harbor_', '').toUpperCase()} · t={f.t.toFixed(1)}s · car:{f.entities.find((e) => e.id === 'car_017')?.damage}
        </div>
      )}
    </AbsoluteFill>
  );
};
