import { readFileSync } from 'node:fs';
import { SceneSpec } from '@engine/contracts/src/scenespec.ts';
import { stateHash } from '@engine/contracts/src/hash.ts';
import { resolveCapabilities, seedRegistry } from '@engine/world/src/index.ts';

const [cmd, file, flag] = process.argv.slice(2);

function validate(path: string, mode: 'final' | 'preview') {
  const parsed = SceneSpec.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    parsed.error.issues.forEach((i) => console.error(`  ${i.path.join('.') || '(root)'}: ${i.message}`));
    process.exit(1);
  }
  const gaps = resolveCapabilities(parsed.data, seedRegistry(), mode);
  console.log(JSON.stringify({ scene: parsed.data.sceneId, hash: stateHash(parsed.data), mode, gaps }));
  process.exit(gaps.length ? 2 : 0);
}

switch (cmd) {
  case 'validate':
    validate(file, flag === '--preview' ? 'preview' : 'final');
    break;
  case 'capabilities':
    seedRegistry().all().forEach((c) => console.log(`${c.status.padEnd(11)} ${c.ref.padEnd(26)} ${c.summary}`));
    break;
  default:
    console.log('usage: npm run engine -- validate <scene.json> [--preview] | capabilities');
    process.exit(cmd ? 1 : 0);
}
