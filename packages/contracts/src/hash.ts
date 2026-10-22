import { createHash } from 'node:crypto';

/** Stable stringify: sorted keys, numbers rounded to 9 decimals so equal states hash equally. */
export function canonical(v: unknown): string {
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 1e9) / 1e9) : 'null';
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

export const stateHash = (v: unknown): string => createHash('sha256').update(canonical(v)).digest('hex').slice(0, 16);
