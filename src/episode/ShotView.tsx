import React from 'react';
import {AbsoluteFill} from 'remotion';
import {noise2D} from '@remotion/noise';
import {GROUND_Y, W} from '../config';
import {smooth} from '../lib/anim';
import {Stickman} from '../components/Stickman';
import {Debris, DustBursts, Embers, SmokePlumes} from '../components/Effects';
import {Defs, Ground, Lights, Sky, Tower, Vignette} from '../world/Common';
import {BuildingLayer, Lamps, cityFor} from '../world/City';
import {ForestBack} from '../world/Forest';
import {FLOOD_TOWER, Flood, Hill, ROOF, Ripples, Rooftop, TOWER_X, WATER_Y, hillY} from '../world/HillFlood';
import {PALETTES} from '../world/palettes';
import {FoamBurst, WaveFront, WaveWall} from '../fx/Wave';
import {Bolts, Rain, flashAt} from '../fx/Storm';
import {collapseTimes, lightningTimes} from '../fx/times';
import type {CompiledShot} from './compile';
import {HILL_TOWER_HEIGHT, TrackBase, cameraX, placeHero} from './hero';

/** Seconds before the end of an impact shot when the hit lands. */
export const IMPACT_LEAD = 1.3;

const SHAKE = {none: 0, quake: 0, collapse: 0.65, fire: 0.06, wave: 0, storm: 0.03} as const;

export const ShotView: React.FC<{shot: CompiledShot; index: number; t: number; seed: string; base: TrackBase; prev?: CompiledShot}> = ({
  shot, index, t, seed, base, prev,
}) => {
  const lt = t - shot.start;
  const dur = shot.end - shot.start;
  const prog = Math.min(1, lt / dur);
  const pal = PALETTES[shot.mood];
  const sseed = `${seed}-s${index}`;
  const camX = cameraX(shot, base, lt);
  const hero = placeHero(shot, lt, dur, base, prev);
  const impactAt = shot.impact ? dur - IMPACT_LEAD : Infinity;
  const bolts = shot.threat === 'storm' ? lightningTimes(dur, sseed) : [];
  const flash = flashAt(lt, bolts);
  const lights: Lights | null =
    shot.threat === 'quake' && pal.litChance > 0 ? {flickerStart: dur * 0.45, lightsOut: Math.max(dur * 0.45 + 0.6, dur - 0.2)} : null;

  const shake =
    SHAKE[shot.threat] +
    (shot.threat === 'quake' ? 0.12 + 0.55 * prog : 0) +
    (shot.threat === 'wave' ? 0.12 + 0.35 * prog : 0) +
    (lt > impactAt ? 1.1 * Math.exp(-(lt - impactAt) * 1.5) : 0) +
    flash * 0.3;
  const amp = shake * 36 * smooth(0, 0.3, lt + 0.3);
  const sx = noise2D(`${sseed}x`, lt * 14, 0) * amp;
  const sy = noise2D(`${sseed}y`, lt * 14, 0) * amp;

  const heroEl = <Stickman j={hero.j} x={hero.x} y={hero.y} scale={hero.scale} />;
  const burning = shot.threat === 'fire' || shot.threat === 'collapse';
  const embers = burning || shot.mood === 'disaster' ? <Embers t={lt} from={0} count={40} /> : null;
  const storm = shot.threat === 'storm' ? (<><Rain t={lt} /><Bolts t={lt} times={bolts} seed={sseed} /></>) : null;
  const debris = shot.threat === 'quake' ? <Debris t={lt} from={0.8} to={dur} count={12} seed={`${sseed}d`} />
    : shot.threat === 'collapse' ? <Debris t={lt} from={0} to={dur} count={60} seed={`${sseed}d`} /> : null;
  const bursts = shot.threat === 'collapse'
    ? collapseTimes(dur, sseed).map((at, i) => ({at, worldX: cameraX(shot, base, at) - 150 + ((i * 173) % 400), size: 170 + ((i * 37) % 80)}))
    : [];
  if (shot.impact && shot.threat !== 'wave') bursts.push({at: impactAt, worldX: camX + hero.x, size: 320});
  const wallCrest = GROUND_Y - 300 - 850 * smooth(0, dur, lt);

  let world: React.ReactNode;
  if (shot.setting === 'city') {
    const city = cityFor(seed);
    const plumes = city.mid.filter((_, i) => i % 2 === 1).map((b) => ({x: b.x + b.w / 2, y: GROUND_Y - b.h + 20}));
    world = (
      <>
        <Sky pal={pal} t={lt} />
        <BuildingLayer blds={city.far} camX={camX} depth={0.2} fill={pal.far} pal={pal} t={lt} lights={lights} />
        {shot.threat === 'wave' ? <WaveWall crestY={wallCrest} t={lt} seed={sseed} /> : null}
        <BuildingLayer blds={city.mid} camX={camX} depth={0.45} fill={pal.mid} pal={pal} t={lt} lights={lights} />
        {burning ? <SmokePlumes t={lt} start={0} camX={camX} depth={0.45} plumes={plumes} /> : null}
        <Lamps camX={camX} t={lt} lights={lights} pal={pal} />
        <Ground camX={camX} pal={pal} />
        <DustBursts t={lt} camX={camX} bursts={bursts} />
        {heroEl}
        {debris}
        {embers}
      </>
    );
  } else if (shot.setting === 'forest') {
    const plumes = Array.from({length: 14}, (_, i) => ({x: 200 + i * 520, y: GROUND_Y - 520}));
    world = (
      <>
        <Sky pal={pal} t={lt} />
        {shot.threat === 'wave' ? <WaveWall crestY={wallCrest} t={lt} seed={sseed} /> : null}
        <ForestBack seed={seed} camX={camX} far={pal.treeFar} near={pal.tree} />
        {burning ? <SmokePlumes t={lt} start={0} camX={camX} depth={0.55} plumes={plumes} /> : null}
        <Ground camX={camX} pal={pal} lanes={false} />
        <DustBursts t={lt} camX={camX} bursts={bursts} />
        {heroEl}
        {debris}
        {embers}
      </>
    );
  } else if (shot.setting === 'hill_tower') {
    // Non-impact shots show the wave closing in at the left; the impact shot carries it to the tower,
    // with the crest just under the hero so he stays visible above the water.
    const [from, to] = shot.impact ? [80, TOWER_X + 120] : [-420, 80];
    const front = from + (to - from) * Math.pow(smooth(0, Math.min(dur, impactAt + 0.1), lt), 1.4);
    const crestY = shot.impact ? Math.max(GROUND_Y - 1050, hero.y + 60) : GROUND_Y - 700;
    world = (
      <>
        <Sky pal={pal} t={lt} horizonY={GROUND_Y - 120} />
        <Hill pal={pal} seed={seed} />
        {shot.threat === 'wave' ? <WaveFront frontX={front} crestY={crestY} baseY={GROUND_Y + 100} t={lt} seed={sseed} /> : null}
        <Tower x={TOWER_X} baseY={hillY(TOWER_X)} height={HILL_TOWER_HEIGHT} t={lt} />
        {heroEl}
        {debris}
        {shot.impact && shot.threat === 'wave' ? <FoamBurst t={lt} at={impactAt} x={TOWER_X - 40} y={hero.y + 40} /> : null}
        <DustBursts t={lt} camX={0} bursts={bursts.map((b) => ({...b, worldX: b.worldX - camX}))} />
        {embers}
      </>
    );
  } else {
    const onTower = shot.action === 'climb' || shot.action === 'cling';
    world = (
      <>
        <Sky pal={pal} t={lt} horizonY={WATER_Y} />
        <Flood pal={pal} seed={seed} t={lt} />
        {onTower ? <Tower x={FLOOD_TOWER.x} baseY={FLOOD_TOWER.baseY} height={FLOOD_TOWER.height} t={lt} /> : <Rooftop x={ROOF.x} y={ROOF.y} w={ROOF.w} fill={pal.mid} />}
        <Ripples x={onTower ? FLOOD_TOWER.x : ROOF.x + ROOF.w / 2} y={WATER_Y + 12} t={lt} color={pal.waterLine} />
        {heroEl}
      </>
    );
  }

  return (
    <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{overflow: 'visible'}}>
        <Defs pal={pal} />
        {world}
        {storm}
        <Vignette />
        {flash > 0 ? <rect x={-200} y={-200} width={W + 400} height={2400} fill="#dfe8ff" opacity={flash * 0.55} /> : null}
      </svg>
    </AbsoluteFill>
  );
};
