/** Pure perspective camera maths (no Three.js) so continuity checks can run in Node. Looks along -Z, no rotation (2.5D profile). */
export interface CameraSpec {
  id: string;
  /** Position in metres. The hero lane is z = 0, the camera sits at positive z. */
  pos: [number, number, number];
  fovDeg: number;
  aspect: number;
}

export interface Projected {
  /** -1 (left) .. 1 (right) */
  u: number;
  /** -1 (bottom) .. 1 (top) */
  v: number;
  depth: number;
  visible: boolean;
}

export function project(cam: CameraSpec, p: [number, number, number]): Projected {
  const depth = cam.pos[2] - p[2];
  if (depth <= 0.01) return { u: 0, v: 0, depth, visible: false };
  const t = Math.tan((cam.fovDeg * Math.PI) / 360);
  const u = (p[0] - cam.pos[0]) / (depth * t * cam.aspect);
  const v = (p[1] - cam.pos[1]) / (depth * t);
  return { u, v, depth, visible: Math.abs(u) <= 1 && Math.abs(v) <= 1 };
}

/** Width and height in metres of the slice of the plane at `z` that the camera sees. */
export function visibleSize(cam: CameraSpec, z = 0): { w: number; h: number } {
  const depth = cam.pos[2] - z;
  const h = 2 * depth * Math.tan((cam.fovDeg * Math.PI) / 360);
  return { w: h * cam.aspect, h };
}
