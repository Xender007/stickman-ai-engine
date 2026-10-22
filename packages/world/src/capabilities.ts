import type { SceneSpec } from '@engine/contracts/src/scenespec.ts';

/** Plan section 5.4. Each capability states what it needs, its limits, and the evidence that it works. */
export interface Capability {
  ref: string; // name@version
  summary: string;
  status: 'planned' | 'implemented' | 'validated';
  needs: string[];
  limits: string[];
  /** Id of the test or benchmark that proves it. Empty until validated. */
  evidence: string[];
  /** Capabilities that must not be combined with this one yet. */
  excludes?: string[];
}

export class CapabilityRegistry {
  private readonly byRef = new Map<string, Capability>();
  constructor(caps: Capability[] = []) {
    caps.forEach((c) => this.add(c));
  }
  add(c: Capability): void {
    if (this.byRef.has(c.ref)) throw new Error(`capability ${c.ref} already registered`);
    this.byRef.set(c.ref, c);
  }
  get(ref: string): Capability | undefined {
    return this.byRef.get(ref);
  }
  all(): Capability[] {
    return [...this.byRef.values()];
  }
}

export interface CapabilityGap {
  ref: string;
  reason: 'missing' | 'not_validated' | 'excluded_combination';
  detail: string;
}

/** Resolve a scene's required capabilities. A render needs zero blocking gaps; a diagnostic preview may proceed with them. */
export function resolveCapabilities(spec: Pick<SceneSpec, 'requiredCapabilities'>, reg: CapabilityRegistry, mode: 'final' | 'preview' = 'final'): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];
  const wanted = new Set(spec.requiredCapabilities);
  for (const ref of spec.requiredCapabilities) {
    const c = reg.get(ref);
    if (!c) {
      gaps.push({ ref, reason: 'missing', detail: 'not in the capability registry' });
      continue;
    }
    if (mode === 'final' && c.status !== 'validated') {
      gaps.push({ ref, reason: 'not_validated', detail: `status is ${c.status}` });
    }
    for (const ex of c.excludes ?? []) {
      if (wanted.has(ex)) gaps.push({ ref, reason: 'excluded_combination', detail: `cannot combine with ${ex}` });
    }
  }
  return gaps;
}
