import type { Lane } from '@engine/contracts/src/scenespec.ts';

/** A location is data in metres: where things are, how big they are, which lane they live in. Same data feeds every camera. */
export interface PlacedEntity {
  id: string;
  kind: 'car' | 'log' | 'crate' | 'building' | 'lamp' | 'bollard' | 'gantry' | 'character';
  lane: Lane;
  /** Centre of the footprint on the ground (x) and the lane's depth is implied by `lane`. */
  x: number;
  /** Size in metres: width (x), height (y). */
  w: number;
  h: number;
  /** Lowest point (m above street level). */
  baseY: number;
}

export interface Location {
  id: string;
  /** Street surface is y = 0. The quay edge (sea side) is at x = quayX. */
  quayX: number;
  streetEndX: number;
  entities: PlacedEntity[];
}

export const harborStreet = (): Location => ({
  id: 'harbor_street@1',
  quayX: 0,
  streetEndX: 34,
  entities: [
    { id: 'car_017', kind: 'car', lane: 'hero', x: 9, w: 4.4, h: 1.5, baseY: 0 },
    { id: 'log_003', kind: 'log', lane: 'hero', x: 3.2, w: 3.2, h: 0.35, baseY: 0 },
    { id: 'crate_02', kind: 'crate', lane: 'hero', x: 13, w: 0.7, h: 0.7, baseY: 0 },
    { id: 'lamp_01', kind: 'lamp', lane: 'hero', x: 5, w: 0.25, h: 5.2, baseY: 0 },
    { id: 'bollard_01', kind: 'bollard', lane: 'hero', x: 1.4, w: 0.35, h: 0.8, baseY: 0 },
    { id: 'bldg_a', kind: 'building', lane: 'near', x: 14, w: 7, h: 13, baseY: 0 },
    { id: 'bldg_b', kind: 'building', lane: 'near', x: 22, w: 8, h: 18, baseY: 0 },
    { id: 'bldg_c', kind: 'building', lane: 'near', x: 30, w: 6, h: 10, baseY: 0 },
  ],
});

/** Milestone 4: the street plus a stair gantry (12 treads to a raised landing), Ravi and the box he carries. */
export const harborStreetWithRavi = (g: { x0: number; run: number; n: number; landingLen: number; rise: number }, xStart: number): Location => {
  const base = harborStreet();
  const w = g.n * g.run + g.landingLen;
  return {
    ...base,
    id: 'harbor_street@2',
    entities: [
      ...base.entities,
      { id: 'gantry_01', kind: 'gantry', lane: 'hero', x: g.x0 + w / 2, w, h: g.n * g.rise, baseY: 0 },
      { id: 'ravi', kind: 'character', lane: 'front', x: xStart, w: 0.5, h: 1.74, baseY: 0 },
      { id: 'box_ravi', kind: 'crate', lane: 'front', x: xStart + 0.8, w: 0.5, h: 0.4, baseY: 0 },
    ],
  };
};
