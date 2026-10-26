/**
 * A pitched perspective camera for the SVG renderer. World: x along the street, y up, z toward the camera.
 * The camera looks toward -z, tilted down by `pitch` radians, so the street reads as a ground plane (as in the reference look).
 * Pure maths: the same world point gives the same pixel on every render.
 */
export interface Cam {
  x: number;
  y: number;
  z: number;
  /** Downward tilt in radians (positive looks down). */
  pitch: number;
  /** Vertical field of view in degrees. */
  fov: number;
  W: number;
  H: number;
}

export type P3 = [number, number, number];
export type P2 = [number, number];

export function proj(c: Cam, p: P3): { s: P2; depth: number } {
  const dx = p[0] - c.x;
  const dy = p[1] - c.y;
  const dz = p[2] - c.z;
  const ca = Math.cos(c.pitch);
  const sa = Math.sin(c.pitch);
  const yc = dy * ca - dz * sa;
  const zc = -dy * sa - dz * ca;
  const F = c.H / 2 / Math.tan((c.fov * Math.PI) / 360);
  const z = Math.max(0.05, zc);
  return { s: [c.W / 2 + (dx / z) * F, c.H / 2 - (yc / z) * F], depth: zc };
}

/** Pixels per metre at a world point (for line widths and radii that should shrink with distance). */
export function pxPerM(c: Cam, p: P3): number {
  const F = c.H / 2 / Math.tan((c.fov * Math.PI) / 360);
  return F / Math.max(0.05, proj(c, p).depth);
}

export const path = (pts: P2[], close = true): string => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');

/** Smooth open path through points (Catmull-Rom converted to cubic Beziers). */
export function smoothPath(pts: P2[], close = false): string {
  if (pts.length < 3) return path(pts, close);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (close ? 'Z' : '');
}
