/** Colours for the three times of day the story moves through (night -> dawn -> overcast early morning). */
export type Look = {
  skyTop: string; skyBottom: string; glow: string; far: string; ground: string; rock: string; town: string; townLit: string;
  water: string; waterHi: string; foam: string; mud: string; tree: string; steel: string; wall: string; stars: number; sun: number;
};

export const LOOKS = {
  night: {
    skyTop: '#060b1d', skyBottom: '#1b284e', glow: '#5d78c0', far: '#121a33', ground: '#0d111d', rock: '#141a2a', town: '#18213d',
    townLit: '#f4c862', water: '#16232c', waterHi: '#4d6478', foam: '#c9d5e2', mud: '#1b1712', tree: '#0b1322', steel: '#04060b',
    wall: '#1b2132', stars: 1, sun: 0,
  },
  dawn: {
    skyTop: '#2a1f45', skyBottom: '#df8a55', glow: '#ffb070', far: '#3a2b4b', ground: '#1a1221', rock: '#251a2b', town: '#2a1e33',
    townLit: '#f4c862', water: '#241c33', waterHi: '#4b4566', foam: '#eadccb', mud: '#2b2119', tree: '#1a1322', steel: '#0c0910',
    wall: '#2d2230', stars: 0, sun: 1,
  },
  morning: {
    skyTop: '#59606f', skyBottom: '#bdb4a6', glow: '#e9d8bd', far: '#6c717f', ground: '#2a2c32', rock: '#3a3c43', town: '#3c404b',
    townLit: '#f4d38a', water: '#262a36', waterHi: '#4f5a6e', foam: '#efebe3', mud: '#3b342b', tree: '#252a2e', steel: '#15171b',
    wall: '#3a3f49', stars: 0, sun: 0,
  },
} satisfies Record<string, Look>;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mixColor = (a: string, b: string, k: number) => {
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

export const mixLook = (a: Look, b: Look, k: number): Look => {
  const out = {} as Record<string, string | number>;
  for (const key of Object.keys(a) as (keyof Look)[]) {
    const va = a[key];
    const vb = b[key];
    out[key] = typeof va === 'number' ? va + ((vb as number) - va) * k : mixColor(va, vb as string, k);
  }
  return out as Look;
};
