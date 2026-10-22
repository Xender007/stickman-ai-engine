import type {Phrase} from '../../src/episode/timing';

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

const r3 = (s: number) => Math.round(s * 1000) / 1000;

/**
 * Maps each caption line onto TTS character alignment by walking non-whitespace characters in order,
 * so spacing differences don't matter. Throws if the characters themselves differ.
 */
export function buildCaptions(lines: string[], alignment: Alignment): Phrase[] {
  const {characters: chars, character_start_times_seconds: starts, character_end_times_seconds: ends} = alignment;
  const solid: number[] = [];
  chars.forEach((c, i) => {
    if (!/\s/.test(c)) solid.push(i);
  });
  let k = 0;
  const caps = lines.map((line) => {
    const want = line.replace(/\s+/g, '');
    const seg = solid.slice(k, k + want.length);
    const got = seg.map((i) => chars[i]).join('');
    if (got !== want) throw new Error(`Alignment mismatch at "${line}" (got "${got}")`);
    k += want.length;
    return {text: line, start: r3(starts[seg[0]]), end: r3(ends[seg[seg.length - 1]])};
  });
  if (k !== solid.length) throw new Error(`Alignment has ${solid.length - k} extra characters after the script`);
  return caps;
}
