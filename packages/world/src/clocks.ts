/**
 * Two clocks (plan section 5.2). Edit time is what the viewer sees (frames).
 * Story time is when things happen in the fictional world (seconds).
 * A segment maps an interval of edit frames onto an interval of story seconds;
 * a jump is just two adjacent segments whose story intervals do not touch.
 */
export interface ClockSegment {
  fromFrame: number;
  toFrameExclusive: number;
  storyStart: number;
  /** Story seconds per edit second. 1 = real time, 3600 = one hour per second. */
  rate: number;
}

export class WorldClock {
  readonly segments: readonly ClockSegment[];
  constructor(readonly fps: number, segments: ClockSegment[]) {
    const sorted = [...segments].sort((a, b) => a.fromFrame - b.fromFrame);
    let at = sorted[0]?.fromFrame ?? 0;
    for (const s of sorted) {
      if (s.fromFrame !== at) throw new Error(`clock gap/overlap at frame ${at}: next segment starts at ${s.fromFrame}`);
      if (s.toFrameExclusive <= s.fromFrame) throw new Error('clock segment has no frames');
      if (s.rate <= 0) throw new Error('clock rate must be positive');
      at = s.toFrameExclusive;
    }
    this.segments = sorted;
  }

  get endFrame(): number {
    return this.segments[this.segments.length - 1]?.toFrameExclusive ?? 0;
  }

  private segmentAt(frame: number): ClockSegment {
    const s = this.segments.find((x) => frame >= x.fromFrame && frame < x.toFrameExclusive);
    if (!s) throw new Error(`frame ${frame} is outside the clock`);
    return s;
  }

  /** Story seconds at an edit frame. Pure function of the frame: render order cannot matter. */
  storyTime(frame: number): number {
    const s = this.segmentAt(frame);
    return s.storyStart + ((frame - s.fromFrame) / this.fps) * s.rate;
  }

  /** True when the world must be advanced by a declared transition rather than simulated continuously. */
  isJump(frame: number): boolean {
    const s = this.segments.find((x) => x.fromFrame === frame);
    if (!s || frame === this.segments[0].fromFrame) return false;
    const prev = this.segmentAt(frame - 1);
    const prevEnd = prev.storyStart + ((prev.toFrameExclusive - prev.fromFrame) / this.fps) * prev.rate;
    return Math.abs(prevEnd - s.storyStart) > 1e-9;
  }

  /** Story seconds elapsed inside the segments [fromFrame, toFrame). */
  storyElapsed(fromFrame: number, toFrame: number): number {
    return this.storyTime(toFrame - 1) - this.storyTime(fromFrame) + 1 / this.fps;
  }
}
