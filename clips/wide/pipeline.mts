/** One entry point for the 16:9 supermarket film with a review gate between drafting and rendering.
 *    npx tsx --env-file=.env clips/wide/pipeline.mts prepare [chapters...] [--revoice]
 *        voice (only missing or --revoice), score, build, layout check, preview sheets in scratch/  -> then YOU review
 *    npx tsx clips/wide/pipeline.mts approve
 *        records that the current script + scenes were reviewed
 *    npx tsx clips/wide/pipeline.mts render
 *        refuses unless approved and nothing changed since; renders all chapters (GPU, all threads), joins them, prints chapter times */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SCRIPT = 'story/supermarket/script-v4.md';
const APPROVAL = 'clips/wide/APPROVED.json';
const FF = 'C:/Users/supro/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/';
const [cmd = 'help', ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith('--'));
const chapters = rest.filter((a) => /^[1-6]$/.test(a)).map(Number);
const all = chapters.length ? chapters : [1, 2, 3, 4, 5, 6];

const run = (c: string, env: Record<string, string> = {}, cwd?: string) => {
  console.log(`> ${c}`);
  const r = spawnSync(c, { shell: true, stdio: 'inherit', cwd, env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`step failed (exit ${r.status}): ${c}`); process.exit(r.status ?? 1); }
};
/** fingerprint of everything that decides what the film looks and sounds like */
const fingerprint = () => {
  const h = createHash('sha256');
  const files = [SCRIPT, ...readdirSync('clips/wide/chapters').filter((f) => f.endsWith('.tsx')).map((f) => `clips/wide/chapters/${f}`), 'clips/wide/kit.tsx', 'clips/wide/parts.tsx', 'clips/wide/engine.tsx', 'clips/store/lib.tsx', 'clips/store/common.tsx'];
  for (const f of files) h.update(f).update(readFileSync(f));
  return h.digest('hex');
};

if (cmd === 'prepare') {
  const eleven = process.env.USE_ELEVEN === '1' ? 'with ElevenLabs' : 'with Kokoro';
  for (const n of all) {
    const voiced = existsSync(`clips/w-ch${n}/assets/sentences.json`);
    if (!voiced || flags.includes('--revoice')) { console.log(`voicing chapter ${n} ${eleven}`); run(`npx tsx --env-file=.env clips/store/narration.mts ${n}`); }
    run(`npx tsx clips/wide/score.mts ${n}`);
    run(`npx tsx clips/wide/build.mts ${n}`);
  }
  mkdirSync('scratch', { recursive: true });
  run(`npx tsx clips/wide/check.mts ${chapters.length === 1 ? chapters[0] : 'all'} 10`);
  for (const n of all) run(`npx tsx clips/wide/preview.mts ${n} 0.6`);
  console.log('\nPrepared. Review the contact sheets scratch/preview-chN-*.png (and listen to a chapter if the voice changed), then run:\n  npx tsx clips/wide/pipeline.mts approve');
} else if (cmd === 'approve') {
  writeFileSync(APPROVAL, JSON.stringify({ approvedAt: new Date().toISOString(), fingerprint: fingerprint() }, null, 1));
  console.log('Approved. You can now run: npx tsx clips/wide/pipeline.mts render');
} else if (cmd === 'render') {
  if (!existsSync(APPROVAL)) { console.error('Not approved yet. Run prepare, review the sheets, then approve.'); process.exit(2); }
  const ap = JSON.parse(readFileSync(APPROVAL, 'utf8'));
  if (ap.fingerprint !== fingerprint()) { console.error('The script or scenes changed after approval. Re-run prepare and approve again.'); process.exit(2); }
  const tmp = process.env.RENDER_TMP ?? 'D:\\tmp';
  mkdirSync(tmp, { recursive: true });
  const env = { TEMP: tmp, TMP: tmp, TMPDIR: tmp, HYPERFRAMES_EXTRACT_CACHE_DIR: `${tmp}\\hfcache` };
  const out = 'out/store-hd'; mkdirSync(out, { recursive: true });
  for (const n of all) run(`npx hyperframes render --fps 30 --browser-gpu --gpu --workers 8 --quality delivery -o ../../${out}/ch${n}.mp4`, env, `clips/w-ch${n}`);
  writeFileSync(`${out}/list.txt`, all.map((n) => `file 'ch${n}.mp4'`).join('\n'));
  run(`"${FF}ffmpeg.exe" -y -f concat -safe 0 -i list.txt -c copy oakline-after-dark-1080p.mp4`, {}, out);
  let acc = 0; const lines: string[] = [];
  const titles = ['The Night Shift', 'The Cold Chain', 'The Regulars', 'Forty Seconds', 'Customers', 'Closing Time'];
  for (const n of all) {
    const d = Number(spawnSync(`"${FF}ffprobe.exe" -v error -show_entries format=duration -of csv=p=0 ${out}/ch${n}.mp4`, { shell: true, encoding: 'utf8' }).stdout);
    const s = Math.floor(acc);
    lines.push(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} ${titles[n - 1]}`);
    acc += d;
  }
  console.log(`\nDone: ${out}/oakline-after-dark-1080p.mp4\nYouTube chapters:\n${lines.join('\n')}`);
} else {
  console.log('usage: pipeline.mts prepare [chapters] [--revoice] | approve | render');
}
