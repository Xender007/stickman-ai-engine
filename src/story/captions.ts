/** Captions are at most this many words; longer narration lines are split into timed chunks. */
export const MAX_CAPTION_WORDS = 6;

const words = (s: string) => s.split(/\s+/).filter(Boolean);

// Words that open a phrase: a good place to start a new caption. Never end a caption on one of the first group.
const LEADS = new Set(['the', 'a', 'an', 'his', 'her', 'its', 'their', 'my', 'our', 'your', 'to', 'of', 'in', 'on', 'at', 'onto', 'into',
  'toward', 'towards', 'through', 'from', 'with', 'for', 'by', 'beneath', 'below', 'above', 'behind', 'beyond', 'across', 'over', 'under']);
const STARTERS = new Set([...LEADS, 'still', 'then', 'and', 'but', 'or', 'as', 'when', 'while', 'who', 'that', 'where', 'before', 'after', 'until']);
const bare = (w: string) => w.toLowerCase().replace(/[^a-z'-]/g, '');

/** Cost of starting a new caption before word i. */
const breakCost = (ws: string[], i: number) =>
  /[.,?!;:…]["”’]?$/.test(ws[i - 1]) ? 0 : LEADS.has(bare(ws[i - 1])) ? 10 : STARTERS.has(bare(ws[i])) ? 1 : 3;

/**
 * Splits one narration line into caption chunks of at most MAX_CAPTION_WORDS: as few chunks as possible, balanced in
 * length, breaking after punctuation or before a phrase-opening word, never right after "the"/"to"/... and avoiding
 * one- or two-word fragments. A "|" in the text forces the breaks instead. Joined, the chunks are the line.
 */
export const chunkLine = (text: string): string[] => {
  if (text.includes('|')) return text.split('|').map((c) => words(c).join(' ')).filter(Boolean);
  const ws = words(text);
  const n = ws.length;
  if (n <= MAX_CAPTION_WORDS) return [ws.join(' ')];
  const avg = n / Math.ceil(n / MAX_CAPTION_WORDS);
  const best: {cost: number; from: number}[] = [{cost: 0, from: -1}];
  for (let i = 1; i <= n; i++) {
    best[i] = {cost: Infinity, from: -1};
    for (let j = Math.max(0, i - MAX_CAPTION_WORDS); j < i; j++) {
      const len = i - j;
      const cost = best[j].cost + 4 + 0.5 * (len - avg) ** 2 + (len < 3 ? 2 : 0) + (i < n ? breakCost(ws, i) : 0);
      if (cost < best[i].cost) best[i] = {cost, from: j};
    }
  }
  const out: string[] = [];
  for (let i = n; i > 0; i = best[i].from) out.unshift(ws.slice(best[i].from, i).join(' '));
  return out;
};

/** What is sent to text-to-speech (quote marks and caption breaks change nothing in the read). */
export const speakable = (text: string) => text.replace(/[“”"|]/g, '').replace(/\s+/g, ' ').trim();
