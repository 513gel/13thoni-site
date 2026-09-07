import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import worker from '../dist/server/index.js';
const context = { waitUntil() {}, passThroughOnException() {} };
const configured = { REVIEW_PIN: '2468', REVIEW_ACCESS_TOKEN: 'synthetic-only-token', ASSETS: {fetch: async () => new Response('synthetic image', {headers: {'content-type':'image/png'}})} };
const call = (path, env = configured, init = {}) => worker.fetch(new Request('https://example.test'+path, init), env, context);

test('retired Bassliquid routes return gone, including its old assets', async () => {
  for (const path of ['/BASSLIQUID','/BASSLIQUID/','/BASSLIQUID/assets/old.js']) assert.equal((await call(path)).status,410);
});
test('private delivery fails closed without configuration and never enters image optimization', async () => {
  assert.equal((await call('/review-drop/media/fixture.png',{ASSETS:configured.ASSETS})).status,401);
  assert.equal((await call('/api/review-unlock',{ASSETS:configured.ASSETS},{method:'POST',body:'{}'})).status,503);
  const image = await call('/_vinext/image?url=%2Freview-drop%2Fmedia%2Ffixture.png&w=640&q=75');
  assert.equal(image.status,404);
  const direct = await call('/review-drop/media/fixture.png',configured,{headers:{cookie:'oni_review_access=synthetic-only-token'}});
  assert.equal(direct.status,200);
  assert.equal(direct.headers.get('cache-control'),'private, no-store');
});
test('unlock rejects foreign origin and honors rate limiting', async () => {
  assert.equal((await call('/api/review-unlock', configured,{method:'POST',headers:{origin:'https://other.test'},body:'{}'})).status,403);
  const limited={...configured,REVIEW_RATE_LIMITER:{limit:async()=>({success:false})}};
  assert.equal((await call('/api/review-unlock',limited,{method:'POST',body:'{}'})).status,429);
});
test('deployment runs authorization before matching static assets', async () => {
  const config=JSON.parse(await readFile(new URL('../dist/server/wrangler.json',import.meta.url),'utf8'));
  assert.equal(config.assets.run_worker_first,true);
  assert.equal(config.assets.binding,'ASSETS');
  assert.ok(config.ratelimits.some(r=>r.name==='REVIEW_RATE_LIMITER'));
});
