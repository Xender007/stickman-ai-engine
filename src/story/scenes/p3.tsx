import type React from 'react';
import {random} from 'remotion';
import {H, W} from '../../config';
import {FoamBurst} from '../../fx/Wave';
import {Rain} from '../../fx/Storm';
import {DIVE, STAND, UNEASY, cling, run, walk} from '../../rig/pose';
import {LAMP_UP, LOOK_UP, Mia, REACH, Ravi, SIT, easePose, stairs} from '../Cast';
import {DebrisPile, Helicopter} from '../world/Props';
import {DRAWDOWN_Y, ESCAPE, FLOOR_H, MIA_ROOF, STATION, STAIRS_X, TOWN} from '../world/geo';
import {LOOKS, mixLook} from '../world/look';
import {LampGlow, World, WaterState} from '../world/World';
import {SOS_ONSETS, sosOn} from '../sos';
import {PartModule, Plan, SceneFC, camAt, ease, valAt} from './types';

/** Overcast early morning, a little warmer than grey. */
const look = mixLook(LOOKS.dawn, LOOKS.morning, 0.55);
const GROUND = TOWN.ground;
const DOOR_X = STATION.x + STATION.w / 2;
const DOWN_X = MIA_ROOF.x + MIA_ROOF.w + 18; // the drainpipe they climb down
const ROOF_Y = STATION.roof;
const RAVI_ROOF = STATION.x + STATION.w - 80;
const MIA_ROOF_X = STATION.x + STATION.w - 135;

/** The wave slams into the tower as "The wave exploded against the tower." begins. */
const hitAt = (p: Plan) => p.cue('P3-L15') + 0.15;

/** The streets drain; then the second, bigger wave comes in, hits the tower and stops two floors below the roof. */
const water = (p: Plan, t: number): WaterState => {
  const hit = hitAt(p);
  const in0 = p.cue('P3-L07'); // the wave is first seen far out as the horizon turns white
  const front = t >= in0 && t < hit + 4 ? valAt(t, [[in0, -900], [hit - 5, 1300], [hit, STATION.x + 30], [hit + 1.4, STATION.x + STATION.w + 520], [hit + 4, 4700]]) : undefined;
  const level = valAt(t, [[0, 1460], [p.cue('P3-L02') + 1, DRAWDOWN_Y], [in0, DRAWDOWN_Y], [hit - 7, 1350], [hit - 1, 800], [hit + 0.8, 380], [p.cue('P3-L16'), 330], [p.cueEnd('P3-L16') + 0.3, ROOF_Y + 2 * FLOOR_H], [p.cue('P3-L20'), ROOF_Y + 2 * FLOOR_H], [p.cue('P3-L21') + 2, ROOF_Y + 2 * FLOOR_H + 140], [p.total, ROOF_Y + 2 * FLOOR_H + 160]]);
  // The wall's crest climbs as it comes in and tops out one floor below the harbor tower's roof as it sweeps over it.
  const crest = valAt(t, [[in0, 650], [hit - 4, 100], [hit, ROOF_Y + FLOOR_H], [hit + 3, 900]]);
  return {
    front,
    wallH: Math.max(300, level - crest),
    level,
    turb: valAt(t, [[0, 0.3], [p.cue('P3-L02') + 1, 0.1], [in0, 0.9], [in0 + 1, 1], [p.cue('P3-L16'), 0.6], [p.cue('P3-L18'), 0.3], [p.cue('P3-L21'), 0.2]]),
    flow: valAt(t, [[0, -110], [p.cue('P3-L02') + 1, -10], [in0, 120], [in0 + 1, 190], [p.cue('P3-L16'), 60], [p.cue('P3-L18'), 10], [p.cue('P3-L20'), -20]]),
  };
};

/** Mud and wreckage left on the drained street. */
const Mud: React.FC = () => (
  <g>
    <rect x={1300} y={GROUND - 10} width={2000} height={22} fill="#3d3024" />
    {Array.from({length: 14}, (_, i) => (
      <rect key={i} x={1380 + i * 140} y={GROUND - 18 - (i % 3) * 6} width={60 + (i % 4) * 20} height={10} fill="#1a1512" transform={`rotate(${(i % 5) * 9 - 18} ${1400 + i * 140} ${GROUND - 14})`} />
    ))}
  </g>
);

type W = Parameters<typeof World>[0];
const world = (c: Parameters<SceneFC>[0]['c'], extra: Partial<W> & {cam: W['cam']}): W => ({
  t: c.t, look, lights: 0, wrecked: true, mark: true, mast: 'damaged', water: water(c, c.t), lamp: false, clouds: 0.65,
  vista: {flood: valAt(c.t, [[0, 0.5], [c.cue('P3-L02') + 1, 0.2], [c.cue('P3-L07'), 0.2], [hitAt(c) - 1, 0.6], [hitAt(c) + 1.5, 0.95]]), lights: 0},
  behind: c.t < hitAt(c) ? <Mud /> : null, ...extra,
});

// ---------- where they are ----------
/** Ravi along the street: down the drainpipe, across the mud, to the blocked door, round to the stairs. */
const streetX = (p: Plan, t: number) =>
  valAt(t, [[p.cue('P3-L02') + 0.8, DOWN_X], [p.wins[2].start, DOOR_X - 90], [p.cue('P3-L06'), DOOR_X - 60], [p.cueEnd('P3-L06') + 1.2, STAIRS_X]]);
/** Floor reached on the fire stairs (time jumps between shots). */
const floorAt = (p: Plan, t: number) => valAt(t, [[p.wins[4].start, 4.6], [p.cue('P3-L12'), 12], [p.cue('P3-L13'), 14]]);
const carried = (p: Plan, t: number) => t >= p.cue('P3-L10') + 0.5;

/**
 * On the fire escape at fractional floor f: up the flight (treads in step with the feet), then a short walk across the
 * landing and a turn for the next flight, which climbs the other way.
 */
const onStairs = (floor: number) => {
  const i = Math.max(0, Math.floor(floor));
  const u = floor - i;
  const right = i % 2 === 0;
  const [sx, ex] = right ? [ESCAPE.x0 + 26, ESCAPE.x1 - 26] : [ESCAPE.x1 - 26, ESCAPE.x0 + 26];
  const yA = GROUND - i * FLOOR_H;
  const k = Math.min(1, u / 0.82);
  const turned = u > 0.93;
  return {
    x: sx + (ex - sx) * k + (right ? 1 : -1) * 16 * Math.max(0, (u - 0.82) / 0.18),
    y: yA - FLOOR_H * k,
    facing: (right !== turned ? 1 : -1) as 1 | -1,
    pose: k < 1 ? stairs((i + k) * 4.5) : walk(u * 3),
  };
};

/** Mia riding on Ravi's back. */
const MiaOnBack: React.FC<{x: number; y: number; facing: 1 | -1; t: number}> = ({x, y, facing, t}) => (
  <Mia pose={{...cling(t), lean: 30}} x={x - 9 * facing} y={y - 34} scale={0.6} facing={facing} />
);

// ---------- S1: the streets drain; down from her roof ----------
const S1: SceneFC = ({c}) => {
  const {t, cue} = c;
  const k = ease(cue('P3-L01') + 0.4, cue('P3-L02') + 0.8, t);
  const km = ease(cue('P3-L01') + 1.0, cue('P3-L02') + 1.4, t);
  return (
    <World {...world(c, {cam: {x: DOWN_X - 40, y: 1330, z: 1.2}})}>
      <Ravi pose={k > 0 && k < 1 ? cling(t * 2) : STAND} x={DOWN_X + 10} y={MIA_ROOF.roof + (GROUND - MIA_ROOF.roof) * k} scale={0.9} facing={-1} state="torn-wet" />
      <Mia pose={km > 0 && km < 1 ? cling(t * 2) : STAND} x={DOWN_X - 30 + 30 * km} y={MIA_ROOF.roof + (GROUND - MIA_ROOF.roof) * km} scale={0.6} facing={-1} />
    </World>
  );
};

// ---------- S2: knee-deep mud; Mia slips ----------
const S2: SceneFC = ({c}) => {
  const {t, cue} = c;
  const x = streetX(c, t);
  const slip = t >= cue('P3-L04') && t < cue('P3-L04') + 0.9;
  const help = t >= cue('P3-L04') + 0.3 && t < cue('P3-L04') + 1.2;
  return (
    <World {...world(c, {cam: {x: x + 30, y: GROUND - 90, z: 2.2}})}>
      <Ravi pose={help ? REACH : walk((x - DOWN_X) / 50)} x={x} y={GROUND + 8} scale={0.9} facing={help ? -1 : 1} state="torn-wet" />
      <Mia pose={slip ? DIVE : walk((x - DOWN_X) / 43)} x={x - 60} y={GROUND + 6} scale={0.6} facing={1} />
    </World>
  );
};

// ---------- S3: the main door is blocked: the fire stairs ----------
const S3: SceneFC = ({c}) => {
  const {t, cueEnd} = c;
  const x = streetX(c, t);
  const running = t >= cueEnd('P3-L06');
  return (
    <World {...world(c, {cam: {x: DOOR_X + 120, y: GROUND - 160, z: 1.5}})} fg={<DebrisPile x={DOOR_X} y={GROUND} />}>
      <Ravi pose={running ? run((x - DOOR_X) / 94) : UNEASY} x={x} y={GROUND} scale={0.9} facing={1} state="torn-wet" />
      <Mia pose={running ? run((x - DOOR_X) / 72) : UNEASY} x={x - 50} y={GROUND} scale={0.6} facing={1} />
    </World>
  );
};

// ---------- S4: far out, the horizon turns white; "Don't look back." ----------
const S4: SceneFC = ({c}) => {
  const {t, cue} = c;
  if (t < cue('P3-L08') - 0.1) {
    return <World {...world(c, {cam: camAt(t, [[c.w.start, {x: 700, y: 560, z: 0.3}], [cue('P3-L08'), {x: 760, y: 520, z: 0.32}]])})} />;
  }
  return (
    <World {...world(c, {cam: {x: STAIRS_X - 30, y: GROUND - 90, z: 2.4}})}>
      <Ravi pose={easePose(STAND, REACH, ease(cue('P3-L08'), cue('P3-L08') + 0.5, t))} x={STAIRS_X - 20} y={GROUND} scale={0.9} facing={-1} state="torn-wet" />
      <Mia pose={UNEASY} x={STAIRS_X - 70} y={GROUND} scale={0.6} facing={1} />
    </World>
  );
};

// ---------- S5: up the fire stairs; floor numbers; he carries her ----------
const S5: SceneFC = ({c}) => {
  const {t, cue} = c;
  const f = floorAt(c, t);
  const r = onStairs(f);
  const m = onStairs(Math.max(0.1, f - 0.35));
  const cut = t >= cue('P3-L10') - 0.2 && t < cue('P3-L10') + 2.6; // the wave, wide, while they climb
  if (cut) return <World {...world(c, {cam: camAt(t, [[cue('P3-L10') - 0.2, {x: 1450, y: 440, z: 0.36}], [cue('P3-L10') + 2.6, {x: 1650, y: 400, z: 0.36}]]), shake: 0.15})} />;
  return (
    <World {...world(c, {cam: {x: (ESCAPE.x0 + ESCAPE.x1) / 2 - 70, y: r.y - 60, z: 1.6}})}>
      <Ravi pose={r.pose} x={r.x} y={r.y} scale={0.9} facing={r.facing} state="torn-wet" />
      {carried(c, t) ? <MiaOnBack x={r.x} y={r.y} facing={r.facing} t={t} /> : <Mia pose={m.pose} x={m.x} y={m.y} scale={0.6} facing={m.facing} />}
    </World>
  );
};

// ---------- S6: wide: the giant wave crosses the drowned city; they reach the roof as it arrives ----------
const S6: SceneFC = ({c}) => {
  const {t, w} = c;
  const f = floorAt(c, t);
  const onRoof = f >= 14;
  const arrived = ease(c.cue('P3-L13'), c.cueEnd('P3-L13'), t);
  const r = onRoof ? {x: ESCAPE.x0 - 10 + (RAVI_ROOF - ESCAPE.x0 + 10) * arrived, y: ROOF_Y, facing: -1 as const, pose: arrived < 1 ? walk(t * 2) : UNEASY} : onStairs(f);
  const shake = 0.12 + 0.2 * ease(w.start, w.end, t);
  return (
    <World {...world(c, {cam: camAt(t, [[w.start, {x: STATION.x - 700, y: 300, z: 0.36}], [w.end, {x: STATION.x - 420, y: 280, z: 0.4}]]), shake})}
      fg={<>
        <circle cx={r.x} cy={r.y - 40} r={26 + 8 * Math.sin(t * 8)} fill="url(#wGlow)" opacity={0.9} />
      </>}>
      <Ravi pose={r.pose} x={r.x} y={r.y} scale={0.9} facing={r.facing} state="torn-wet" />
      <MiaOnBack x={r.x} y={r.y} facing={r.facing} t={t} />
    </World>
  );
};

/** Spray thrown over the roof when the wave explodes against the tower, falling back as heavy drops. */
const SprayFall: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const age = t - at;
  if (age < 0 || age > 3.4) return null;
  return (
    <g>
      {Array.from({length: 70}, (_, i) => {
        const s = `spf${i}`;
        const delay = random(s + 'd') * 0.7;
        const a = age - delay;
        if (a < 0) return null;
        const vx = (random(s + 'x') - 0.7) * 380;
        const vy = -(700 + random(s + 'y') * 900);
        const px = x + (random(s + 'o') - 0.5) * 520 + vx * a;
        const py = y + vy * a + 0.5 * 2100 * a * a;
        if (py > y + 30) return null;
        return <circle key={s} cx={px} cy={py} r={4 + random(s + 'r') * 9} fill="#ffffff" opacity={Math.max(0, 0.85 - age * 0.22)} />;
      })}
    </g>
  );
};

/** Ravi curled over Mia, bracing against the blast. */
const SHIELD = {lean: 64, lUA: 72, lFA: 28, rUA: 58, rFA: 30, lTh: 34, lSh: -54, rTh: 22, rSh: -44};

// ---------- S7: Ravi throws himself over Mia; the wave explodes against the tower; the water climbs the facade ----------
const S7: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const hit = hitAt(c);
  // The tower shakes harder as the wave closes in, then violently on impact, then settles.
  const shake = t < hit ? 0.2 + 0.4 * ease(w.start, hit, t) : Math.max(0.12, 1.4 * Math.exp(-(t - hit) * 0.8));
  const shield = ease(cue('P3-L14'), cue('P3-L14') + 0.5, t);
  const up = ease(cue('P3-L17') + 0.2, cue('P3-L17') + 1.1, t);
  const medium = {x: RAVI_ROOF - 260, y: ROOF_Y - 50, z: 0.95};
  const close = {x: RAVI_ROOF - 40, y: ROOF_Y - 70, z: 2.2};
  const facade = {x: STATION.x + 150, y: ROOF_Y + 260, z: 1.1};
  const cam = camAt(t, [[w.start, medium], [hit, {x: RAVI_ROOF - 240, y: ROOF_Y - 50, z: 1.05}], [hit + 1.1, close], [cue('P3-L16') - 0.5, close], [cue('P3-L16') + 0.7, facade], [w.end, facade]]);
  return (
    <World {...world(c, {cam, shake})}
      fg={<>
        <FoamBurst t={t} at={hit} x={STATION.x - 12} y={ROOF_Y + FLOOR_H + 30} />
        <SprayFall t={t} at={hit} x={RAVI_ROOF - 120} y={ROOF_Y} />
      </>}>
      <Mia pose={easePose(easePose(UNEASY, SIT, shield), STAND, up)} x={RAVI_ROOF - 22} y={ROOF_Y} scale={0.6} facing={-1} />
      <Ravi pose={easePose(easePose(UNEASY, SHIELD, shield), STAND, up)} x={RAVI_ROOF + 6} y={ROOF_Y} scale={0.9} facing={-1} state="torn-wet" />
    </World>
  );
};

/** The sky through three days and nights; u in days: 0 = dawn of day one. */
const dayLook = (u: number) => {
  const f = ((u % 1) + 1) % 1;
  if (f < 0.12) return mixLook(LOOKS.night, LOOKS.dawn, f / 0.12);
  if (f < 0.45) return mixLook(LOOKS.dawn, LOOKS.morning, (f - 0.12) / 0.33);
  if (f < 0.7) return mixLook(LOOKS.morning, LOOKS.dawn, (f - 0.45) / 0.25);
  return mixLook(LOOKS.dawn, LOOKS.night, Math.min(1, (f - 0.7) / 0.2));
};
const lin = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * ((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
  return keys[keys.length - 1][1];
};

const RainLayer: React.FC<{t: number; count: number}> = ({t, count}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Rain t={t} count={count} />
  </svg>
);

// ---------- S8: three days and nights on the roof: DAY 1 / DAY 2 / DAY 3 ----------
const S8: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const u = lin(t, [[w.start, 0.22], [cue('P3-L20'), 1.0], [cue('P3-L21'), 2.0], [w.end, 3.12]]);
  const cam = camAt(t, [[w.start, {x: RAVI_ROOF - 50, y: ROOF_Y - 62, z: 1.55}], [w.end, {x: RAVI_ROOF - 70, y: ROOF_Y - 70, z: 1.85}]]);
  const breath = Math.sin(t * 1.6) * 1.2;
  return (
    <>
      <World {...world(c, {cam, look: dayLook(u), clouds: 0.9})}>
        <Mia pose={{...SIT, lean: SIT.lean + 8 + breath}} x={RAVI_ROOF - 24} y={ROOF_Y} scale={0.6} facing={-1} />
        <Ravi pose={{...SIT, lean: SIT.lean + breath * 0.6}} x={RAVI_ROOF + 4} y={ROOF_Y} scale={0.9} facing={-1} state="torn-wet" />
      </World>
      <RainLayer t={t} count={130} />
    </>
  );
};

// ---------- S9: the third night: a sound in the sky; the SOS; a red helicopter answers ----------
const S9: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const night = mixLook(LOOKS.night, LOOKS.morning, 0.08);
  const hears = ease(cue('P3-L22') + 0.9, cue('P3-L23') + 0.3, t);
  const lift = ease(cue('P3-L25'), cue('P3-L25') + 0.7, t);
  const on = c.lamp(t);
  const flyFrom = {x: RAVI_ROOF + 1100, y: ROOF_Y - 1250};
  const flyTo = {x: RAVI_ROOF - 140, y: ROOF_Y - 560};
  const k = ease(cue('P3-L27'), cue('P3-L29') + 0.6, t);
  const hx = flyFrom.x + (flyTo.x - flyFrom.x) * k;
  const hy = flyFrom.y + (flyTo.y - flyFrom.y) * k + 14 * Math.sin(t * 2.4) * k;
  const blink = t >= cue('P3-L28') && sosOn((t - cue('P3-L28')) * 30);
  const beam = ease(cue('P3-L29') - 0.1, cue('P3-L29') + 0.7, t);
  const cam = camAt(t, [
    [w.start, {x: RAVI_ROOF - 50, y: ROOF_Y - 62, z: 1.8}],
    [cue('P3-L23'), {x: RAVI_ROOF - 50, y: ROOF_Y - 160, z: 1.4}],
    [cue('P3-L25') + 0.2, {x: RAVI_ROOF - 50, y: ROOF_Y - 70, z: 2.2}],
    [cue('P3-L27') + 0.2, {x: RAVI_ROOF - 20, y: ROOF_Y - 420, z: 1.0}],
    [cue('P3-L29'), {x: RAVI_ROOF - 80, y: ROOF_Y - 300, z: 1.1}],
    [w.end, {x: RAVI_ROOF - 80, y: ROOF_Y - 290, z: 1.0}],
  ]);
  const hand = {x: MIA_ROOF_X + 12, y: ROOF_Y - 56};
  const cloudOut = 1 - ease(cue('P3-L27') + 0.2, cue('P3-L28') + 0.4, t);
  return (
    <>
      <World {...world(c, {cam, look: night, clouds: 0.9, lamp: false})}
        fg={<>
          <LampGlow x={hand.x} y={hand.y} on={on} z={cam.z} />
          {k > 0 ? (
            <>
              <Helicopter x={hx} y={hy} t={t} blink={blink} beam={beam} groundY={ROOF_Y} scale={1.5} color="#c42b2b" />
              {/* it comes out of the cloud bank: dark puffs hide it, then drift away */}
              {Array.from({length: 7}, (_, i) => (
                <ellipse key={i} cx={hx + 120 + (i - 3) * 150 + 60 * k} cy={hy - 40 + (i % 2) * 40} rx={260} ry={110} fill="#0a0e1a" opacity={0.95 * cloudOut} filter="url(#wSoft)" />
              ))}
            </>
          ) : null}
        </>}>
        <Mia pose={easePose(easePose(SIT, LOOK_UP, hears), LAMP_UP, lift)} x={MIA_ROOF_X} y={ROOF_Y} scale={0.6} facing={1} light={on ? 1 : 0} />
        <Ravi pose={easePose(SIT, STAND, ease(cue('P3-L24'), cue('P3-L24') + 0.6, t))} x={RAVI_ROOF} y={ROOF_Y} scale={0.9} facing={-1} state="torn-wet" />
      </World>
      <RainLayer t={t} count={40} />
    </>
  );
};

export const part3: PartModule = {
  scenes: {'P3-S1': S1, 'P3-S2': S2, 'P3-S3': S3, 'P3-S4': S4, 'P3-S5': S5, 'P3-S6': S6, 'P3-S7': S7, 'P3-S8': S8, 'P3-S9': S9},
  keyLines: {
    'P3-L02': 'warn', 'P3-L06': 'warn', 'P3-L07': 'warn', 'P3-L12': 'warn', 'P3-L13': 'warn', 'P3-L14': 'warn', 'P3-L15': 'warn',
    'P3-L17': 'signal', 'P3-L19': 'signal', 'P3-L20': 'signal', 'P3-L21': 'warn', 'P3-L22': 'signal', 'P3-L26': 'signal',
    'P3-L27': 'signal', 'P3-L28': 'signal', 'P3-L29': 'signal', 'P3-L30': 'signal',
  },
  slams: (p) => [
    {text: 'RUN!', at: p.cueEnd('P3-L06') + 0.1},
    {text: '5', at: p.cue('P3-L09') + 0.05},
    {text: '6', at: p.cue('P3-L09') + 0.85},
    {text: '12', at: p.cue('P3-L12') + 0.05},
    {text: 'HOLD ON!', at: p.cue('P3-L14') - 0.2},
  ],
  cards: (p) => [
    {text: 'DAY 1', at: p.cue('P3-L19') - 0.1, dur: 1.9},
    {text: 'DAY 2', at: p.cue('P3-L20') - 0.1, dur: 1.9},
    {text: 'DAY 3', at: p.cue('P3-L21') - 0.1, dur: 1.9},
  ],
  waveClock: (p) => ({
    label: 'SECOND WAVE',
    keys: [[0, 900], [p.cue('P3-L03'), 840], [p.cue('P3-L05'), 600], [p.cue('P3-L07'), 420], [p.cue('P3-L09'), 240], [p.cue('P3-L12'), 60], [hitAt(p), 0]],
    from: 0,
    until: hitAt(p) + 1.2,
  }),
  endCard: {title: 'THE END', subtitle: 'FOLLOW FOR THE NEXT STORY'},
  sound: (p) => {
    const hit = hitAt(p);
    const sos = p.cue('P3-L26');
    const heliFar = p.cue('P3-L22');
    return [
      {name: 'water', at: 0, dur: p.cue('P3-L03'), loop: true, volume: 0.3, duck: true},
      ...Array.from({length: 14}, (_, i) => ({name: 'step', at: p.wins[1].start + 0.2 + i * 0.5, volume: 0.25})),
      {name: 'rumble', at: p.cue('P3-L07') - 0.3, dur: hit - p.cue('P3-L07') + 0.3, loop: true, volume: (t) => 0.15 + 0.4 * ease(p.cue('P3-L07'), hit, t), duck: true},
      ...Array.from({length: 18}, (_, i) => ({name: 'click', at: p.wins[4].start + i * ((p.cue('P3-L13') - p.wins[4].start) / 18), volume: 0.22})),
      {name: 'roar', at: p.cue('P3-L11'), dur: hit + 1.5 - p.cue('P3-L11'), loop: true, volume: (t) => 0.2 + 0.8 * ease(p.cue('P3-L11'), hit, t), duck: true},
      {name: 'crash', at: hit, volume: 1},
      {name: 'boom', at: hit, volume: 1},
      {name: 'crash', at: hit + 0.45, volume: 0.8},
      {name: 'rumble', at: hit, dur: 4.5, volume: 0.8},
      {name: 'water', at: hit + 1, dur: p.cue('P3-L19') - hit, loop: true, volume: 0.5, duck: true},
      {name: 'rain', at: p.cue('P3-L19') - 0.3, dur: p.total - p.cue('P3-L19') + 3.5, loop: true, volume: 0.32, duck: true},
      {name: 'thunder', at: p.cue('P3-L21') + 0.6, volume: 0.5},
      {name: 'heli', at: heliFar, dur: p.total - heliFar + 4.7, loop: true,
        volume: (t) => 0.04 + 0.12 * ease(heliFar, p.cue('P3-L27'), t) + 0.5 * ease(p.cue('P3-L27'), p.cue('P3-L29') + 0.6, t), duck: true},
      ...SOS_ONSETS.map((f) => ({name: 'shutter', at: sos + f / 30, volume: 0.6})),
      {name: 'pad', at: p.cue('P3-L29'), dur: p.total - p.cue('P3-L29') + 3, loop: true, volume: 0.25, duck: true},
    ];
  },
};
