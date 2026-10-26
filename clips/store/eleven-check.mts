/** Checks an ElevenLabs key before spending time on a full re-voice: account, quota, a short test line with timestamps, and the voices you can use.
 *  usage: npx tsx --env-file=.env clips/store/eleven-check.mts [voiceId]
 *  The key goes in .env as ELEVENLABS_API_KEY (the file is git-ignored). */
const key = process.env.ELEVENLABS_API_KEY?.trim();
if (!key) { console.error('No ELEVENLABS_API_KEY in .env'); process.exit(1); }
const headers = { 'xi-api-key': key, 'content-type': 'application/json' };
const get = async (p: string) => { const r = await fetch(`https://api.elevenlabs.io${p}`, { headers }); return { status: r.status, body: await r.json().catch(() => ({})) as any }; };

const sub = await get('/v1/user/subscription');
if (sub.status !== 200) console.log(`account/quota not readable (HTTP ${sub.status}: ${String(sub.body?.detail?.message ?? '').slice(0, 120)}). Create the key with 'All' access or enable user_read, text_to_speech and voices_read.`);
else {
  const used = sub.body.character_count ?? 0, limit = sub.body.character_limit ?? 0;
  console.log(`plan: ${sub.body.tier}  characters used ${used} of ${limit}  (left ${limit - used})`);
  const need = 10000; // script-v4 is about 9,700 characters
  console.log(limit - used >= need ? 'enough quota for the whole film' : `NOT enough quota for the whole film: needs about ${need}, you have ${limit - used}`);
}

const voiceId = process.argv[2] ?? process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';
const t = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
  method: 'POST', headers, body: JSON.stringify({ text: 'Night one. The store intercom says your name.', model_id: process.env.ELEVEN_MODEL ?? 'eleven_multilingual_v2' }),
});
console.log(t.ok ? `test line with timestamps: OK (voice ${voiceId})` : `test line failed: HTTP ${t.status} ${(await t.text()).slice(0, 200)}`);

const v = await get('/v1/voices');
if (v.status === 200) {
  console.log('voices on your account (id  name  labels):');
  for (const x of (v.body.voices ?? []).slice(0, 20)) console.log(`  ${x.voice_id}  ${x.name}  ${Object.values(x.labels ?? {}).join(', ')}`);
}
console.log('\nTo use it:  set ELEVENLABS_VOICE_ID in .env (optional), then  USE_ELEVEN=1 npx tsx --env-file=.env clips/wide/pipeline.mts prepare --revoice');
