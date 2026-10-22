import { THRESHOLDS as T } from './thresholds.ts';

export interface CheckResult {
  check: string;
  pass: boolean;
  /** Worst measured value and the limit it was compared with. */
  value: number;
  limit: number;
  detail: string;
  /** First failing frame, when the check is per-frame. */
  frame?: number;
}

const result = (check: string, pass: boolean, value: number, limit: number, detail: string, frame?: number): CheckResult => ({ check, pass, value, limit, detail, frame });

/** Planted contact: positions (metres, x/y) of a foot or hand over a planted interval, one per frame. */
export function contactDrift(points: [number, number][], fps: number): CheckResult[] {
  let worstStep = 0;
  let stepFrame = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (d > worstStep) {
      worstStep = d;
      stepFrame = i;
    }
  }
  let worstTotal = 0;
  for (const p of points) worstTotal = Math.max(worstTotal, Math.hypot(p[0] - points[0][0], p[1] - points[0][1]));
  return [
    result('contact_drift_per_frame', worstStep <= T.contactDriftPerFrameM, worstStep, T.contactDriftPerFrameM, `planted contact moved ${(worstStep * 100).toFixed(2)} cm in one frame at ${fps} fps`, stepFrame),
    result('contact_drift_interval', worstTotal <= T.contactDriftIntervalM, worstTotal, T.contactDriftIntervalM, `planted contact slid ${(worstTotal * 100).toFixed(2)} cm over the interval`),
  ];
}

/** Ratios of object heights to the person, each checked against the design's intended ratio. */
export function scaleSanity(actual: Record<string, number>, intended: Record<string, number>): CheckResult[] {
  return Object.keys(intended).map((k) => {
    const err = Math.abs(actual[k] / intended[k] - 1);
    return result(`scale_${k}`, err <= T.scaleRatioTolerance, err, T.scaleRatioTolerance, `${k}: ratio ${actual[k].toFixed(3)} vs intended ${intended[k].toFixed(3)}`);
  });
}

/** Acceleration spikes: second difference of a 1D track, compared with sigma of the track's own motion. */
export function temporalJitter(track: number[]): CheckResult {
  const acc: number[] = [];
  for (let i = 2; i < track.length; i++) acc.push(track[i] - 2 * track[i - 1] + track[i - 2]);
  if (acc.length < 3) return result('temporal_jitter', true, 0, T.jitterSigma, 'too short to judge');
  const mean = acc.reduce((a, b) => a + b, 0) / acc.length;
  const sd = Math.sqrt(acc.reduce((a, b) => a + (b - mean) ** 2, 0) / acc.length);
  if (sd < 1e-12) return result('temporal_jitter', true, 0, T.jitterSigma, 'constant acceleration');
  let worst = 0;
  let frame = 0;
  acc.forEach((a, i) => {
    const z = Math.abs(a - mean) / sd;
    if (z > worst) {
      worst = z;
      frame = i + 2;
    }
  });
  return result('temporal_jitter', worst <= T.jitterSigma, worst, T.jitterSigma, `largest acceleration spike is ${worst.toFixed(1)} sigma`, frame);
}

/** Objects that rest on terrain after the water leaves. */
export function stranding(objs: { id: string; gapM: number; tiltErrorDeg: number }[]): CheckResult[] {
  const out: CheckResult[] = [];
  for (const o of objs) {
    out.push(result(`strand_gap_${o.id}`, Math.abs(o.gapM) <= T.strandGapM, Math.abs(o.gapM), T.strandGapM, o.gapM > 0 ? `${o.id} floats ${(o.gapM * 100).toFixed(1)} cm above ground` : `${o.id} sinks ${(-o.gapM * 100).toFixed(1)} cm into terrain`));
    out.push(result(`strand_tilt_${o.id}`, Math.abs(o.tiltErrorDeg) <= T.strandTiltDeg, Math.abs(o.tiltErrorDeg), T.strandTiltDeg, `${o.id} tilt differs from the contact normal by ${o.tiltErrorDeg.toFixed(1)} degrees`));
  }
  return out;
}

export interface CaptionBox {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  seconds: number;
  contrast: number;
}

const overlaps = (a: CaptionBox, b: { x0: number; y0: number; x1: number; y1: number }) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

export function captionsInSafeZone(boxes: CaptionBox[], keepOut: { id: string; x0: number; y0: number; x1: number; y1: number }[] = []): CheckResult[] {
  const z = T.captionSafeZone;
  const out: CheckResult[] = [];
  for (const b of boxes) {
    const inside = b.x0 >= z.x0 && b.x1 <= z.x1 && b.y0 >= z.y0 && b.y1 <= z.y1;
    out.push(result(`caption_safe_${b.id}`, inside, inside ? 0 : 1, 0, `${b.id} box ${b.x0},${b.y0}-${b.x1},${b.y1} vs safe zone`));
    out.push(result(`caption_contrast_${b.id}`, b.contrast >= T.captionContrast, b.contrast, T.captionContrast, `contrast ${b.contrast.toFixed(2)}:1`));
    out.push(result(`caption_duration_${b.id}`, b.seconds >= T.captionMinSeconds, b.seconds, T.captionMinSeconds, `shown ${b.seconds.toFixed(2)} s`));
    for (const k of keepOut) {
      if (overlaps(b, k)) out.push(result(`caption_overlap_${b.id}_${k.id}`, false, 1, 0, `${b.id} overlaps ${k.id}`));
    }
  }
  return out;
}

export function loudness(lufs: number, truePeakDb: number): CheckResult[] {
  return [
    result('loudness', Math.abs(lufs - T.loudnessLufs.target) <= T.loudnessLufs.tolerance, lufs, T.loudnessLufs.target, `${lufs.toFixed(1)} LUFS`),
    result('true_peak', truePeakDb <= T.truePeakDb, truePeakDb, T.truePeakDb, `${truePeakDb.toFixed(1)} dBTP`),
  ];
}

export function reproducibility(hashA: string, hashB: string): CheckResult {
  return result('state_hash_identical', hashA === hashB, hashA === hashB ? 0 : 1, 0, hashA === hashB ? `both ${hashA}` : `${hashA} != ${hashB}`);
}

export const failures = (rs: CheckResult[]): CheckResult[] => rs.filter((r) => !r.pass);
