/**
 * Terrain of the "single locked shot" set (the user's 10 s prompt): a quay with freeing ports at x <= 0, a street rising 3%
 * uphill to a building line at x = 13.2, and two shallow dips that keep puddles after the water drains.
 *
 * The quay parapet (0.9 m) is drawn but treated by the solver as permeable at street level (freeing ports / scuppers), so the
 * street can drain back to the sea "in streams" as the prompt asks; a 1D transect cannot route water through gaps in a wall.
 * Overtopping is drawn wherever the sea surface is above the parapet top. Documented in docs/handoff/milestone-4b.md.
 */
export const SHOT = {
  parapetTop: 0.9,
  parapetX0: -0.6,
  slope: 0.03,
  buildingLine: 13.2,
  dips: [
    { x0: 0.3, x1: 1.9, depth: 0.07 }, // along the quay kerb: where the backflow leaves the log
    { x0: 8.0, x1: 9.3, depth: 0.09 },
  ],
} as const;

export function shotBed(x: number): number {
  if (x < 0) return Math.max(-5, -2.8 + x * 0.06);
  if (x <= SHOT.buildingLine) {
    let b = SHOT.slope * x;
    for (const d of SHOT.dips) if (x >= d.x0 && x <= d.x1) b -= d.depth * Math.sin((Math.PI * (x - d.x0)) / (d.x1 - d.x0));
    return b;
  }
  return SHOT.slope * SHOT.buildingLine + 0.6 * (x - SHOT.buildingLine);
}

/** The stair gantry of the shot: one definition for the character's footholds, the physics posts and the drawing. */
export const SHOT_STAIRS = { x0: 5.6, run: 0.28, rise: 0.21, n: 12, landingLen: 2.3 } as const;

/** Where the props stand: packed like the reference (quay, sedan, lamp, stairs within about 11 m). One source for all code. */
export const SHOT_LAYOUT = { carX: 2.6, lampX: 5.15, logX: 1.0, raviStartX: 2.8 } as const;
