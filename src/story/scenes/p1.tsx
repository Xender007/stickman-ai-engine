import {random} from 'remotion';
import {STAND, UNEASY, climb, cling, run, walk} from '../../rig/pose';
import {FoamBurst} from '../../fx/Wave';
import {BRACE, Ravi, easePose} from '../Cast';
import {BAKERY_X, GRIP_Y, MAST, SEA_Y, TOWN, terrainY} from '../world/geo';
import {Bakery, CardInsert, RadioDisplay, RadioInsert} from '../world/Interiors';
import {LOOKS, mixLook} from '../world/look';
import {World, WaterState} from '../world/World';
import {PartModule, Plan, SceneFC, camAt, ease, valAt} from './types';

/** When the surge hits the hill (and the picture cuts to black a moment later). */
const impactAt = (p: Plan) => p.cue('P1-L17') + 0.55;

/** One water state for the whole part: calm sea, the surge through the low streets, the hit, the lull. */
const water = (p: Plan, t: number): WaterState => {
  const t0 = p.cue('P1-L12') - 1.5;
  const t1 = p.cue('P1-L16');
  const hit = impactAt(p);
  if (t < t0) return {level: SEA_Y, turb: 0.05, flow: 6};
  if (t < hit + 0.05) {
    return {
      level: valAt(t, [[t0, SEA_Y], [p.cue('P1-L13'), 1250], [t1, 1160], [hit, 1100]]),
      front: valAt(t, [[t0, 1250], [p.cue('P1-L13') + 1, 2700], [t1, 3350], [hit, 4520]]),
      turb: 0.95,
      flow: 170,
    };
  }
  const calm = p.cue('P1-L20');
  return {level: valAt(t, [[hit, 1100], [calm, 1130]]), turb: valAt(t, [[hit, 1], [calm, 0.22]]), flow: valAt(t, [[hit, 160], [calm, 10], [p.total, -12]])};
};

/** Sky and the city to the horizon: dry and lit before the quake, drowned after the hit. The tower stays hidden in Part 1. */
const sky = (p: Plan, t: number) => ({
  tower: false,
  clouds: valAt(t, [[0, 0.2], [impactAt(p), 0.65]]),
  vista: {flood: valAt(t, [[p.wins[4].start, 0], [impactAt(p), 0.8], [p.total, 0.75]]), lights: t < p.cue('P1-L07') ? 1 : 0},
});

/** Bakery power: on, flickering through the shaking, dead on "Every light went dark." */
const power = (p: Plan, t: number) => {
  const out = p.cue('P1-L07') + 0.2;
  if (t < p.cue('P1-L06')) return 1;
  if (t >= out) return 0;
  return Math.sin(t * 37) > -0.2 ? 1 : 0.15;
};

// ---------- S1: Ravi opens the bakery ----------
const S1: SceneFC = ({c}) => {
  const {t, cue} = c;
  const inside = cue('P1-L02') - 0.15;
  const insert = cue('P1-L04') - 0.1;
  if (t < inside) {
    const k = ease(c.w.start, inside - 0.2, t);
    const x = BAKERY_X - 220 + 250 * k;
    const dist = 250 * k;
    const pose = k < 1 ? walk(dist / 68) : STAND;
    return (
      <World {...sky(c, t)} cam={{x: BAKERY_X - 20 + 20 * k, y: 1420, z: 2.0}} t={t} look={LOOKS.night} lights={1} mast="intact" water={water(c, t)}>
        <Ravi pose={pose} x={x} y={TOWN.ground} scale={1} state="clean" />
      </World>
    );
  }
  if (t < insert) {
    const lt = t - inside;
    const k = ease(0, 1.2, lt);
    const glance = cue('P1-L03');
    const facing = t > glance + 0.2 && t < glance + 1.6 ? 1 : -1;
    return (
      <Bakery t={t} lights={1} ovens={0.3 + 0.7 * ease(0, 1.5, lt)} shake={0} hum={0} radio="ready">
        <Ravi pose={k < 1 ? walk(lt * 1.1) : STAND} x={900 - 290 * k} y={1500} scale={2.1} facing={facing} state="clean" />
      </Bakery>
    );
  }
  return <CardInsert t={t - insert} lights={1} />;
};

// ---------- S2: the quake, the radio, the blackout ----------
const radioState = (p: Plan, t: number): RadioDisplay =>
  t >= p.cue('P1-L07') + 0.2 ? 'off' : t >= p.cue('P1-L06') + 0.9 ? 'alert' : t >= p.cue('P1-L06') + 0.2 ? 'static' : 'ready';

const S2: SceneFC = ({c}) => {
  const {t, cue} = c;
  const radio = radioState(c, t);
  const insertFrom = cue('P1-L06') + 0.9;
  const insertTo = cue('P1-L07') + 0.45;
  if (t >= insertFrom && t < insertTo) return <RadioInsert t={t - insertFrom} display={radio} />;
  const hum = ease(cue('P1-L05'), cue('P1-L05') + 0.6, t);
  const shake = ease(cue('P1-L06') - 0.1, cue('P1-L06') + 0.3, t) * (1 - 0.6 * ease(cue('P1-L07') + 0.5, c.w.end, t));
  const lights = power(c, t);
  const pose = shake > 0.05 ? easePose(UNEASY, BRACE, Math.min(1, shake * 1.4)) : easePose(STAND, UNEASY, hum);
  return (
    <Bakery t={t} lights={lights} ovens={lights > 0.5 ? 1 : 0.35} shake={shake} hum={hum} radio={radio} zoom={{x: 660, y: 1080, z: 1.22}}>
      <Ravi pose={pose} x={620 + shake * 20 * Math.sin(t * 9)} y={1500} scale={2.1} facing={-1} state="clean" />
    </Bakery>
  );
};

// ---------- S3: out into the street, running inland ----------
const S3_SPEED = 165;
const raviX3 = (c: {w: {start: number}}, t: number) => BAKERY_X + 90 + S3_SPEED * Math.max(0, t - c.w.start);

const S3: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const x = raviX3(c, t);
  const shake = valAt(t, [[w.start, 0.35], [w.end, 0.06]]);
  const crack = ease(cue('P1-L08'), cue('P1-L08') + 0.6, t);
  const fold = ease(cue('P1-L09'), cue('P1-L09') + 1.4, t);
  // Masonry still falling ahead of and behind him, each piece landing in a puff of dust.
  const chunks = Array.from({length: 12}, (_, i) => {
    const at = w.start + 0.2 + i * 0.55;
    const cx = BAKERY_X + 220 + i * 105 + random(`ch${i}`) * 60;
    const age = t - at;
    if (age < 0) return null;
    const fallY = Math.min(TOWN.ground - 12, TOWN.ground - 330 + 0.5 * 1800 * age * age);
    const landed = fallY >= TOWN.ground - 12;
    const landAge = landed ? age - Math.sqrt((318 * 2) / 1800) : 0;
    return (
      <g key={i}>
        <rect x={cx - 14} y={fallY - 14} width={28} height={22} fill="#1a1f30" transform={`rotate(${age * 140} ${cx} ${fallY})`} />
        {landed && landAge < 1.6 ? <ellipse cx={cx} cy={TOWN.ground - 20} rx={40 + 120 * landAge} ry={20 + 50 * landAge} fill="#8a8fa0" opacity={0.45 * (1 - landAge / 1.6)} /> : null}
      </g>
    );
  });
  const crackPath = `M${BAKERY_X + 140} ${TOWN.ground}l60 ${6 * crack}l50 ${-4 * crack}l70 ${9 * crack}l60 ${-5 * crack}l80 ${7 * crack}l70 ${-3 * crack}l90 ${8 * crack}`;
  return (
    <World {...sky(c, t)} cam={{x: x + 110, y: 1410, z: 1.8}} t={t} look={LOOKS.night} lights={0} mast="intact" water={water(c, t)} shake={shake}
      collapse={[{x: BAKERY_X + 560, k: fold}, {x: BAKERY_X + 980, k: fold * 0.8}]}
      fg={<>{chunks}<path d={crackPath} stroke="#000" strokeWidth={4 + 12 * crack} fill="none" /></>}>
      <Ravi pose={run((x - BAKERY_X) / 108)} x={x} y={TOWN.ground} scale={1} state="dusty" />
    </World>
  );
};

// ---------- S4: he turns toward the sea ----------
const S4: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const x = raviX3({w: c.wins[2]}, w.start); // where the run stopped
  const turn = ease(w.start, w.start + 0.5, t);
  const pose = easePose(run((x - BAKERY_X) / 108), UNEASY, turn);
  // The tsunami rises behind the skyline, spanning the whole view, taller and taller while he watches.
  const wall = valAt(t, [[w.start, 1500], [cue('P1-L13'), 1020], [cue('P1-L13') + 1.6, 680], [w.end, 600]]);
  const cam = camAt(t, [[w.start, {x: x - 90, y: 1455, z: 2.5}], [cue('P1-L13'), {x: x - 200, y: 1410, z: 1.9}], [w.end, {x: x - 220, y: 1400, z: 1.8}]]);
  return (
    <World {...sky(c, t)} cam={cam} t={t} look={LOOKS.night} lights={0} mast="intact" water={{level: SEA_Y, turb: 0.2, flow: 6}} shake={0.05 + 0.25 * ease(cue('P1-L13'), w.end, t)} wall={wall}>
      <Ravi pose={pose} x={x} y={TOWN.ground} scale={1} facing={turn > 0.5 ? -1 : 1} state="dusty" />
    </World>
  );
};

// ---------- S5: uphill run; the wide shows the drowned-to-be town, the harbor tower and the mast ----------
const S5: SceneFC = ({c}) => {
  const {t, w} = c;
  const x0 = raviX3({w: c.wins[2]}, c.wins[3].start);
  const k = ease(w.start, w.end + 0.3, t);
  const x = x0 + (MAST.x - 60 - x0) * k;
  return (
    <World {...sky(c, t)} cam={camAt(t, [[w.start, {x: 3650, y: 1000, z: 0.36}], [w.end, {x: 3750, y: 980, z: 0.35}]])} t={t} look={LOOKS.night} lights={0}
      mast="intact" water={water(c, t)}>
      <Ravi pose={run((x - x0) / 94)} x={x} y={terrainY(x)} scale={1} state="dusty" />
    </World>
  );
};

// ---------- S6: the climb and the hit ----------
const S6: SceneFC = ({c}) => {
  const {t, w} = c;
  const hit = impactAt(c);
  const arrive = ease(w.start, w.start + 0.5, t);
  const up = ease(w.start + 0.4, hit - 0.2, t);
  const y = MAST.baseY - (MAST.baseY - GRIP_Y) * up;
  const after = t > hit;
  const shake = after ? 1.1 * Math.exp(-(t - hit) * 2) : 0.08 + 0.25 * ease(hit - 2, hit, t);
  const thrown = ease(hit - 1.4, hit, t); // a wrecked car carried into the lower mast
  return (
    <World {...sky(c, t)} cam={camAt(t, [[w.start, {x: 4060, y: 1090, z: 1.3}], [hit, {x: 4080, y: 1040, z: 1.5}]])} t={t} look={LOOKS.night} lights={0}
      mast={after ? 'damaged' : 'intact'} water={water(c, t)} shake={shake}
      fg={
        <>
          {thrown > 0 && !after ? (
            <path transform={`translate(${3650 + 400 * thrown} ${1110 - 60 * Math.sin(thrown * Math.PI)}) rotate(${thrown * 70})`}
              d="M-45 0L-40 -20L-18 -34L22 -34L36 -18L48 -16L48 0Z" fill="#0c0b0d" />
          ) : null}
          <FoamBurst t={t} at={hit} x={MAST.x - 40} y={1110} />
        </>
      }>
      <Ravi pose={up > 0.02 ? climb(up * 6) : run(arrive * 2)} x={MAST.x - 60 + 60 * arrive} y={y} scale={0.9} state={after ? 'torn-wet' : 'dusty'} />
    </World>
  );
};

// ---------- S7: still holding on; time-lapse to dawn; a light on the harbor tower's roof ----------
const S7: SceneFC = ({c}) => {
  const {t, cue, w} = c;
  const look = mixLook(LOOKS.night, LOOKS.dawn, ease(cue('P1-L18'), cue('P1-L21'), t));
  const cam = camAt(t, [
    [w.start, {x: 4120, y: 870, z: 1.7}],
    [cue('P1-L20') - 0.3, {x: 4110, y: 880, z: 1.5}],
    [cue('P1-L20') + 1.0, {x: 3350, y: 1290, z: 0.45}],
    [cue('P1-L21') - 0.1, {x: 3450, y: 1270, z: 0.45}],
    [cue('P1-L21') + 1.3, {x: 2850, y: 1000, z: 0.4}],
  ]);
  return (
    <World {...sky(c, t)} cam={cam} t={t} look={look} lights={0} wrecked mark mast="damaged" water={water(c, t)} lamp={c.lamp(t)}>
      <Ravi pose={cling(t)} x={MAST.x} y={GRIP_Y} scale={0.9} facing={-1} state="torn-wet" />
    </World>
  );
};

export const part1: PartModule = {
  scenes: {'P1-S1': S1, 'P1-S2': S2, 'P1-S3': S3, 'P1-S4': S4, 'P1-S5': S5, 'P1-S6': S6, 'P1-S7': S7},
  blackouts: (p) => [impactAt(p) + 0.45],
  keyLines: {'P1-L07': 'warn', 'P1-L11': 'warn', 'P1-L13': 'warn', 'P1-L16': 'warn', 'P1-L17': 'warn', 'P1-L21': 'signal', 'P1-L22': 'signal'},
  slams: (p) => [{text: 'RUN!', at: p.cueEnd('P1-L07') + 0.3}, {text: 'TSUNAMI!', at: p.cueEnd('P1-L13') + 0.15}],
  clock: {text: '4:02 AM', until: (p) => p.cue('P1-L04') - 0.2},
  countdown: (p) => ({start: impactAt(p) - 8, seconds: 8}),
  endCard: {title: 'PART 2?', subtitle: 'FOLLOW FOR THE NEXT WAVE', next: 'NEXT · THE GIRL ON THE ROOF'},
  sound: (p) => {
    const hit = impactAt(p);
    const s3 = p.wins[2].start;
    return [
      {name: 'pad', at: 0, dur: p.cue('P1-L05') + 0.5, loop: true, volume: (t) => 0.22 * ease(0, 1, t), duck: true},
      {name: 'hum', at: p.cue('P1-L05'), dur: p.cue('P1-L06') + 0.6 - p.cue('P1-L05'), loop: true, volume: (t) => 0.2 + 0.4 * ease(p.cue('P1-L05'), p.cue('P1-L06'), t)},
      {name: 'rumble', at: p.cue('P1-L06') - 0.1, dur: p.cue('P1-L10') + 1 - p.cue('P1-L06'), loop: true,
        volume: (t) => 0.95 - 0.65 * ease(p.cue('P1-L08'), p.cue('P1-L10'), t), duck: true},
      {name: 'static', at: p.cue('P1-L06') + 0.2, dur: p.cue('P1-L07') - p.cue('P1-L06'), loop: true, volume: 0.4, duck: true},
      ...Array.from({length: 12}, (_, i) => ({name: 'crash', at: s3 + 0.2 + i * 0.55 + 0.6, volume: 0.22 + 0.1 * (i % 3), duck: true})),
      {name: 'crash', at: p.cue('P1-L09'), volume: 0.7, duck: true},
      {name: 'siren', at: p.cue('P1-L11'), dur: hit - p.cue('P1-L11'), loop: true, volume: (t) => 0.12 + 0.25 * ease(p.cue('P1-L11'), p.cue('P1-L13'), t), duck: true},
      {name: 'roar', at: p.cue('P1-L12') - 1.5, dur: hit + 0.3 - (p.cue('P1-L12') - 1.5), loop: true,
        volume: (t) => 0.2 + 0.8 * ease(p.cue('P1-L12') - 1.5, hit, t), duck: true},
      {name: 'crash', at: hit, volume: 1},
      {name: 'boom', at: hit, volume: 1},
      {name: 'ring', at: hit + 0.3, volume: 0.45},
      {name: 'roar', at: hit + 0.4, dur: p.wins[6].start - hit + 0.6, loop: true, volume: 0.18},
      {name: 'water', at: p.wins[6].start, loop: true, dur: p.total - p.wins[6].start, volume: (t) => 0.35 * ease(p.wins[6].start, p.wins[6].start + 1, t), duck: true},
      {name: 'pad', at: p.cue('P1-L21') - 0.5, dur: p.total - p.cue('P1-L21') + 0.5, loop: true, volume: 0.22, duck: true},
    ];
  },
};
