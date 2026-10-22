// Renders stills at given seconds for quick visual review.
//   npx tsx scripts/stills.ts [--props path/to/props.json] 3 12.5 40
// BROWSER=/path/to/chrome-headless-shell reuses an existing browser.
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const pi = args.indexOf('--props');
const inputProps = pi >= 0 ? JSON.parse(fs.readFileSync(args[pi + 1], 'utf8')) : {};
const times = args.filter((a, i) => pi < 0 || (i !== pi && i !== pi + 1)).map(Number).filter((n) => !Number.isNaN(n));
if (!times.length) throw new Error('Pass one or more times in seconds');
const browserExecutable = process.env.BROWSER ?? null;
const tag = process.env.TAG ?? 'still';

async function main() {
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Episode', inputProps, browserExecutable});
fs.mkdirSync('out', {recursive: true});
for (const s of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const output = `out/${tag}-${s}.jpg`;
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', inputProps, browserExecutable});
  console.log(output);
}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
