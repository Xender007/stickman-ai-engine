/**
 * The Quiet Coast in one side-view world (y grows downward). The sea is to the left; inland rises to the right:
 * harbor -> town -> hill shoulder with the mast -> maintenance landing -> ridge trail -> ridge shelter.
 * Every outdoor shot is a camera on this world, so places, water and the lamp never move between shots.
 */

const TERRAIN: [number, number][] = [
  [-3000, 1790], [500, 1772], [1150, 1700], [1250, 1640], // harbor floor and beach
  [1300, 1585], [3300, 1585], // quay and town on the coastal plain
  [3700, 1505], [4100, 1300], [4300, 1180], [4400, 1060], // hill shoulder, mast, landing meets the slope
  [4700, 960], [5200, 800], [5650, 690], [6000, 650], [8000, 630], // ridge trail, ridge, shelter
];

/** Ground height at world x (cosine-eased between the points above). */
export const terrainY = (x: number): number => {
  if (x <= TERRAIN[0][0]) return TERRAIN[0][1];
  for (let i = 1; i < TERRAIN.length; i++) {
    const [x1, y1] = TERRAIN[i];
    if (x <= x1) {
      const [x0, y0] = TERRAIN[i - 1];
      const k = (1 - Math.cos(((x - x0) / (x1 - x0)) * Math.PI)) / 2;
      return y0 + (y1 - y0) * k;
    }
  }
  return TERRAIN[TERRAIN.length - 1][1];
};

export const SEA_Y = 1600; // normal sea level
export const DRAWDOWN_Y = 1745; // the retreat between surges exposes the harbor floor
export const TOWN = {from: 1320, to: 3260, ground: 1585};
export const BAKERY_X = 2050;
export const MAST = {x: 4100, baseY: terrainY(4100), height: 760};
export const MAST_TOP = MAST.baseY - MAST.height;
export const LANDING = {y: 1060, from: MAST.x, to: 4400};
/** Where Ravi clings on the mast (feet), above the first surge. */
export const GRIP_Y = 900;
/** Highest point of the first surge: leaves a wet mark on the mast and trees. */
export const MARK_Y = 1100;
/** The harbor tower: fourteen floors, the one building taller than both surges. Fire stairs zig-zag up its inland side. */
/** Outdoors a person is drawn at this scale (about 90 px tall), so a floor (130 px) is about one and a half people. */
export const PERSON = 0.36;
export const FLOOR_H = 130;
export const STATION = {x: 2440, w: 430, roof: 1585 - 14 * FLOOR_H};
/** Fire escape on the tower's inland side: flight i climbs from floor i to i+1, alternating direction. */
export const ESCAPE = {x0: STATION.x + STATION.w + 22, x1: STATION.x + STATION.w + 170};
export const STAIRS_X = ESCAPE.x0;
/** Where Ravi and Mia end up on the tower roof. */
export const ROOF_STOP = STATION.x + 150;
/** Mia's apartment block: after the first wave only its roof is above the water. Her flashlight is the light Ravi sees. */
export const MIA_ROOF = {x: 1500, w: 280, roof: 1040};
export const LAMP = {x: MIA_ROOF.x + 150, y: MIA_ROOF.roof - 138}; // her flashlight, held up
/** Buildings drawn individually (kept clear of the generic town). */
export const TALL = [MIA_ROOF];

/** Mast lean in degrees (negative = toward the sea). */
export const mastLean = (state: 'intact' | 'damaged' | 'brace-failed', k = 1) => (state === 'brace-failed' ? -4.5 * k : 0);

/** Position of a point on the mast at height h above its base, after the lean. */
export const onMast = (h: number, lean: number) => {
  const a = (lean * Math.PI) / 180;
  return {x: MAST.x + Math.sin(a) * h, y: MAST.baseY - Math.cos(a) * h};
};
