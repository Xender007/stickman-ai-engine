/** Animated channels. GSAP tweens these (choreo.ts); scenes only read them. Unknown channels read as 0. */
export const S: Record<string, number> = new Proxy({} as Record<string, number>, {
  get: (t, k: string) => (k in t ? t[k] : 0),
});
