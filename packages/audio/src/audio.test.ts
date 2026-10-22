import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chunkLine, sosOn, SOS_CYCLE } from './index.ts';

// The packaged pipeline must reproduce the committed Quiet Coast captions exactly.
test('caption chunking reproduces every committed Quiet Coast caption', () => {
  for (const n of [1, 2, 3]) {
    const part = JSON.parse(readFileSync(`story/the-quiet-coast/part-${n}.json`, 'utf8')) as { lines: { id: string; text: string }[] };
    const timing = JSON.parse(readFileSync(`story/the-quiet-coast/part-${n}.timing.json`, 'utf8')) as { captions: { text: string }[] };
    const chunks = part.lines.flatMap((l) => chunkLine(l.text));
    assert.deepEqual(chunks, timing.captions.map((c) => c.text), `part ${n}`);
  }
});

test('SOS cycle is the 204-frame deterministic pattern', () => {
  assert.equal(SOS_CYCLE, 204);
  assert.equal(sosOn(0), sosOn(SOS_CYCLE));
});
