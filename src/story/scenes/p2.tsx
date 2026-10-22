import type React from 'react';
import {STAND, UNEASY, cling} from '../../rig/pose';
import {LAMP_UP, Mia, Ravi, easePose, paddle} from '../Cast';
import {DoorRaft, FloatingCar} from '../world/Props';
import {GRIP_Y, LAMP, MARK_Y, MAST, MIA_ROOF, onMast} from '../world/geo';
import {CardInsert, RadioInsert} from '../world/Interiors';
import {LOOKS} from '../world/look';
import {World, WaterState, surfaceAt} from '../world/World';
import {PartModule, Plan, SceneFC, camAt, ease, valAt} from './types';

const look = LOOKS.dawn;
const GRIP = onMast(MAST.baseY - GRIP_Y, 0);
/** Where the raft comes alongside Mia's roof, and where each of them stands on it. */
const LANDING_X = MIA_ROOF.x + MIA_ROOF.w + 85;
const RAVI_ON_ROOF = MIA_ROOF.x + MIA_ROOF.w - 40;
const MIA_X = LAMP.x - 30;

/** The lull after the first wave (with a seaward current), then the sea starts draining out again at the end. */
const water = (p: Plan, t: number): WaterState => {
  const s3 = p.wins[2];
  return {
    level: valAt(t, [[p.cue('P2-L22') - 0.2, 1130], [p.total, 1460]]),
    turb: valAt(t, [[0, 0.2], [s3.start, 0.3], [p.cue('P2-L09'), 0.5], [s3.end, 0.25], [p.cue('P2-L22'), 0.35]]),
    flow: valAt(t, [[0, -14], [s3.start, -30], [p.cue('P2-L09'), -70], [s3.end, -20], [p.cue('P2-L22'), -120]]),
  };
};

const dropAt = (p: Plan) => p.cue('P2-L07') + 0.95;
const arriveAt = (p: Plan) => p.wins[3].start + 1.0;

/** The raft's x: drifting toward the mast, then paddled across the drowned city to Mia's roof. */
const raftX = (p: Plan, t: number) => {
  const drop = dropAt(p);
  if (t < drop) return valAt(t, [[p.wins[1].start, MAST.x + 420], [drop, MAST.x - 10]]);
  // Paddling west; the current costs him ground for a moment, then he fights free.
  const k = ease(drop + 0.4, arriveAt(p), t);
  const pull = 90 * ease(p.cue('P2-L09'), p.cue('P2-L10'), t) * (1 - ease(p.cue('P2-L11'), p.cue('P2-L11') + 1.5, t));
  return MAST.x - 10 + (LANDING_X - MAST.x + 10) * k - pull;
};

type W = Parameters<typeof World>[0];
const world = (c: Parameters<SceneFC>[0]['c'], extra: Partial<W> & {cam: W['cam']}): W => ({
  t: c.t, look, lights: 0, wrecked: true, mark: true, mast: 'damaged', water: water(c, c.t), lamp: c.lamp(c.t), clouds: 0.55,
  // A drowned city to the horizon; the harbor tower is only revealed at "Only one building stood taller."
  vista: {flood: valAt(c.t, [[c.cue('P2-L22'), 0.75], [c.total, 0.55]]), lights: 0}, tower: c.t >= c.cue('P2-L20') - 0.2, ...extra,
});

/** Mia on her roof, flashlight up (seen tiny from the mast in the wide shots). */
const MiaOnRoof: React.FC<{light: number; pose?: Parameters<typeof Mia>[0]['pose']; facing?: 1 | -1}> = ({light, pose = LAMP_UP, facing = 1}) => (
  <Mia pose={pose} x={MIA_X} y={MIA_ROOF.roof} scale={0.62} facing={facing} light={light} />
);

// ---------- S1: the light keeps blinking; he knows the code ----------
const S1: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const card = t >= cue('P2-L03') + 0.3 && t < cue('P2-L05') - 0.1;
  if (card) return <CardInsert t={t - cue('P2-L03')} lights={0} />;
  const cam = camAt(t, [
    [w.start, {x: 4090, y: 860, z: 2.0}],
    [w.start + 1.2, {x: 4040, y: 880, z: 1.8}],
    [cue('P2-L02'), {x: 2850, y: 1000, z: 0.42}],
    [cue('P2-L03'), {x: 2850, y: 1000, z: 0.42}],
    [cue('P2-L05'), {x: MIA_ROOF.x + 140, y: 990, z: 1.3}],
  ]);
  return (
    <World {...world(c, {cam})}>
      <MiaOnRoof light={c.lamp(t) ? 1 : 0} />
      <Ravi pose={cling(t)} x={GRIP.x} y={GRIP.y} scale={0.9} facing={-1} state="torn-wet" />
    </World>
  );
};

// ---------- S2: a door drifts by; he lets go and drops onto it ----------
const S2: SceneFC = ({c}) => {
  const {t} = c;
  const drop = dropAt(c);
  const x = raftX(c, t);
  const surf = surfaceAt(water(c, t), x, t);
  const fall = t < drop ? 0 : Math.min(1, ((t - drop) / 0.45) ** 2);
  const ry = t < drop ? GRIP.y : GRIP.y + (surf - 10 - GRIP.y) * fall;
  const rx = t < drop ? GRIP.x : GRIP.x + (x - GRIP.x) * fall;
  const pose = t < drop ? cling(t) : fall < 1 ? easePose(cling(t), STAND, fall) : paddle(0);
  return (
    <World {...world(c, {cam: {x: MAST.x - 60, y: 1010, z: 1.6}, shake: fall >= 1 && t - drop < 0.8 ? 0.2 : 0})}
      fg={fall >= 1 && t - drop < 1.4 ? <circle cx={x} cy={surf} r={80 + 160 * (t - drop - 0.45)} fill="none" stroke="#efe6d6" strokeWidth={10} opacity={Math.max(0, 1 - (t - drop))} /> : null}>
      <DoorRaft x={x} y={surf - 8} t={t} />
      <Ravi pose={pose} x={rx} y={fall >= 1 ? surf - 8 : ry} scale={0.9} facing={-1} state="torn-wet" />
    </World>
  );
};

// ---------- S3: paddling across the drowned city; the current; the car ----------
const S3: SceneFC = ({c}) => {
  const {t, cue} = c;
  const x = raftX(c, t);
  const w = water(c, t);
  const surf = surfaceAt(w, x, t);
  const struggle = ease(cue('P2-L09'), cue('P2-L09') + 0.4, t) * (1 - ease(cue('P2-L11'), cue('P2-L11') + 0.6, t));
  const carK = ease(cue('P2-L10') - 0.6, cue('P2-L10') + 1.6, t);
  const carX = x - 520 + 1000 * carK;
  return (
    <World {...world(c, {cam: {x: x - 80, y: surf - 90, z: 1.7}, shake: 0.1 * struggle})}>
      {carK > 0 && carK < 1 ? <FloatingCar x={carX} y={surfaceAt(w, carX, t) + 6} spin={carK * 140} /> : null}
      <DoorRaft x={x} y={surf - 8} t={t} />
      <Ravi pose={paddle(t * (1.1 + 1.2 * struggle))} x={x} y={surf - 8} scale={0.9} facing={-1} state="torn-wet" />
      <MiaOnRoof light={c.lamp(t) ? 1 : 0} />
    </World>
  );
};

// ---------- S4: the girl on the roof ----------
const S4: SceneFC = ({c}) => {
  const {t, w} = c;
  const x = raftX(c, t);
  const surf = surfaceAt(water(c, t), x, t);
  const up = ease(arriveAt(c), arriveAt(c) + 0.9, t);
  const rx = x + (RAVI_ON_ROOF - x) * up;
  const ry = surf - 8 + (MIA_ROOF.roof - surf + 8) * up;
  const lowered = ease(w.start + 0.4, w.start + 1.2, t);
  return (
    <World {...world(c, {cam: {x: MIA_ROOF.x + MIA_ROOF.w - 50, y: MIA_ROOF.roof - 70, z: 2.6}, lamp: false})}
      fg={<circle cx={MIA_X + 14} cy={MIA_ROOF.roof - 40} r={60} fill="url(#wGlow)" opacity={0.45} />}>
      <DoorRaft x={x} y={surf - 8} t={t} />
      <Ravi pose={up < 1 ? easePose(paddle(0), STAND, up) : STAND} x={rx} y={ry} scale={1} facing={-1} state="torn-wet" />
      <MiaOnRoof light={1} pose={easePose(LAMP_UP, STAND, lowered)} />
    </World>
  );
};

// ---------- S5: the crank radio: second wave in twenty minutes ----------
const S5: SceneFC = ({c}) => {
  const {t, cue, cueEnd} = c;
  const from = cue('P2-L16') + 0.3;
  const to = cueEnd('P2-L17') + 0.3;
  if (t >= from && t < to) return <RadioInsert t={t - from} display={t < cue('P2-L17') ? 'static' : 'warning'} />;
  return (
    <World {...world(c, {cam: {x: MIA_ROOF.x + MIA_ROOF.w - 70, y: MIA_ROOF.roof - 70, z: 2.6}, lamp: false})}>
      <Ravi pose={UNEASY} x={RAVI_ON_ROOF} y={MIA_ROOF.roof} scale={1} facing={-1} state="torn-wet" />
      <MiaOnRoof light={0} pose={UNEASY} />
    </World>
  );
};

// ---------- S6: the wet line reaches her roof's edge; only the harbor tower is taller ----------
const S6: SceneFC = ({c}) => {
  const {t, cue} = c;
  const pulse = 0.6 + 0.4 * Math.sin(t * 7);
  const cam = camAt(t, [
    [c.w.start, {x: MIA_ROOF.x + MIA_ROOF.w / 2, y: MARK_Y - 40, z: 2.2}],
    [cue('P2-L20') - 0.2, {x: MIA_ROOF.x + MIA_ROOF.w / 2, y: MARK_Y - 40, z: 2.1}],
    [cue('P2-L20') + 1.4, {x: 2150, y: 700, z: 0.55}],
  ]);
  return (
    <World {...world(c, {cam, lamp: false})}
      fg={t < cue('P2-L20') + 0.6 ? <rect x={MIA_ROOF.x - 6} y={MARK_Y - 5} width={MIA_ROOF.w + 12} height={10} fill="#ff3b30" opacity={pulse} filter="url(#glowTight)" /> : null}>
      <Ravi pose={STAND} x={RAVI_ON_ROOF} y={MIA_ROOF.roof} scale={1} facing={1} state="torn-wet" />
      <MiaOnRoof light={0} pose={STAND} />
    </World>
  );
};

// ---------- S7: the sea starts pulling back: the next wave is coming ----------
const S7: SceneFC = ({c}) => (
  <World {...world(c, {cam: camAt(c.t, [[c.w.start, {x: 2150, y: 820, z: 0.52}], [c.w.end, {x: 2100, y: 840, z: 0.5}]]), lamp: false})}>
    <Ravi pose={UNEASY} x={RAVI_ON_ROOF} y={MIA_ROOF.roof} scale={1} facing={-1} state="torn-wet" />
    <MiaOnRoof light={0} pose={UNEASY} facing={-1} />
  </World>
);

export const part2: PartModule = {
  scenes: {'P2-S1': S1, 'P2-S2': S2, 'P2-S3': S3, 'P2-S4': S4, 'P2-S5': S5, 'P2-S6': S6, 'P2-S7': S7},
  keyLines: {'P2-L02': 'signal', 'P2-L05': 'signal', 'P2-L09': 'warn', 'P2-L10': 'warn', 'P2-L14': 'signal', 'P2-L19': 'warn', 'P2-L21': 'signal', 'P2-L22': 'warn'},
  slams: (p) => [
    {text: 'SOS', at: p.cue('P2-L02') + 0.4},
    {text: '20 MINUTES!', at: p.cueEnd('P2-L17') + 0.15},
    {text: '14 FLOORS', at: p.cueEnd('P2-L21') + 0.1},
  ],
  waveClock: (p) => ({
    label: 'SECOND WAVE',
    keys: [[p.cueEnd('P2-L17') + 1.4, 1200], [p.cue('P2-L22'), 1020], [p.total - 0.6, 900]],
    from: p.cueEnd('P2-L17') + 1.4,
    until: p.total,
  }),
  endCard: {title: 'PART 3?', subtitle: 'FOLLOW: 15 MINUTES TO SURVIVE', next: 'NEXT · FOURTEEN FLOORS'},
  sound: (p) => [
    {name: 'water', at: 0, dur: p.total, loop: true, volume: (t) => 0.3 + 0.25 * ease(p.wins[2].start, p.wins[2].start + 1, t) * (1 - ease(p.wins[3].start, p.wins[3].start + 1, t)), duck: true},
    {name: 'crash', at: dropAt(p) + 0.45, volume: 0.55, duck: true},
    {name: 'roar', at: p.cue('P2-L09') - 0.3, dur: p.cue('P2-L11') + 1.5 - p.cue('P2-L09'), loop: true, volume: 0.35, duck: true},
    {name: 'crash', at: p.cue('P2-L10') + 0.3, volume: 0.4, duck: true},
    {name: 'pad', at: p.wins[3].start, dur: p.wins[4].start - p.wins[3].start + 0.5, loop: true, volume: 0.22, duck: true},
    {name: 'static', at: p.cue('P2-L16') + 0.3, dur: p.cue('P2-L17') - p.cue('P2-L16'), volume: 0.45},
    {name: 'rumble', at: p.cue('P2-L22') - 0.3, dur: p.total - p.cue('P2-L22') + 0.3, loop: true, volume: (t) => 0.2 + 0.4 * ease(p.cue('P2-L22'), p.total, t), duck: true},
  ],
};
