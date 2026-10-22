import type { CarryClip } from '../../../packages/motion/src/carry.ts';

/** Per-frame data the CarryScene draws. Everything is baked in Node; the composition only reads it (rule R8). */
export type CarryProps = {
  fps: number;
  frames: {
    /** hip, shoulder, head, lKnee, rKnee, lFoot, rFoot, lElbow, rElbow, lHand, rHand as x,y pairs */
    j: number[];
    crate: [number, number, number];
    camX: number;
    planted: [boolean, boolean];
  }[];
};

export function carryProps(clip: CarryClip, fps: number, crate: { x: number; y: number; angle: number }[]): CarryProps {
  const n = Math.floor(clip.duration * fps);
  const samples = Array.from({ length: n }, (_, f) => clip.sampleAt(f / fps));
  // Camera follows the hip with a centred moving average, computed offline so every frame is independent of the others.
  const hipX = samples.map((s) => s.sk.hip[0]);
  const R = Math.round(0.6 * fps);
  const cam = hipX.map((_, i) => {
    let sum = 0;
    let w = 0;
    for (let k = -R; k <= R; k++) {
      const j = Math.min(n - 1, Math.max(0, i + k));
      const wt = 0.5 + 0.5 * Math.cos((Math.PI * k) / (R + 1));
      sum += hipX[j] * wt;
      w += wt;
    }
    return sum / w + 0.5; // keep the figure slightly left of centre so the crate ahead of it is in frame
  });
  return {
    fps,
    frames: samples.map((s, i) => {
      const k = s.sk;
      return {
        j: [k.hip, k.shoulder, k.head, k.lKnee, k.rKnee, k.lFoot, k.rFoot, k.lElbow, k.rElbow, k.lHand, k.rHand].flat(),
        crate: [crate[i].x, crate[i].y, crate[i].angle],
        camX: cam[i],
        planted: [s.planted.L, s.planted.R],
      };
    }),
  };
}
