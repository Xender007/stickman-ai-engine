/**
 * Starting thresholds from plan section 12.1. Milestone 0 calibrates each against the
 * Quiet Coast shots (see docs/handoff/milestone-0.md and benchmarks/calibration.json).
 * Changing a value requires a benchmark run and an entry in `history`.
 */
export const THRESHOLDS = {
  scaleRatioTolerance: 0.15,
  contactDriftPerFrameM: 0.01,
  contactDriftIntervalM: 0.03,
  contactDriftProjectedPx: 2,
  penetrationM: 0.02,
  jointLimitViolations: 0,
  paletteDeltaE: 6,
  jitterSigma: 5,
  minVisibleFrames: 3,
  waterlineStepPx: 4,
  eventSyncFrames: 1,
  floaterWaterlineTolerance: 0.1,
  strandGapM: 0.02,
  strandTiltDeg: 5,
  audioSyncFrames: 2,
  captionSafeZone: { x0: 90, x1: 990, y0: 220, y1: 1500 },
  captionContrast: 4.5,
  captionMinSeconds: 0.6,
  loudnessLufs: { target: -14, tolerance: 1 },
  truePeakDb: -1,
  frameAcrossBackendsPsnr: 45,
  renderBudgetMinutes: 8,
  videoMemoryGb: 3.2,
} as const;

export type Thresholds = typeof THRESHOLDS;

export const HISTORY: { date: string; key: keyof Thresholds; from: unknown; to: unknown; evidence: string }[] = [];
