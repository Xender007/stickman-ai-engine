import { readFileSync } from 'node:fs';
const md = readFileSync('story/supermarket/script-v4.md', 'utf8');
for (let N = 1; N <= 6; N++) {
  const body = md.split(new RegExp(`^## Chapter ${N}:.*$`, 'm'))[1].split(/^## /m)[0];
  let i = 0; const out: string[] = [];
  body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
    p.replace(/\s+/g, ' ').split(/(?<=[.?!])\s+(?=[A-Z0-9"])/).forEach((s) => out.push(`${i++}: ${s.trim()}`));
    out.push('--');
  });
  console.log(`## CH${N}\n` + out.join('\n'));
}
