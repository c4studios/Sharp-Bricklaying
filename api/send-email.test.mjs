// Offline smoke test for the contact-form function. No network, no real email.
//   node api/send-email.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const handler = require('./send-email.js');

function mockRes() {
  return {
    statusCode: 0, body: '', headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    end(s) { this.body = s; },
  };
}
async function run(req, { apiKey, fetchImpl } = {}) {
  if (apiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = apiKey;
  const realFetch = global.fetch;
  if (fetchImpl) global.fetch = fetchImpl;
  const res = mockRes();
  await handler(req, res);
  global.fetch = realFetch;
  return res;
}

const okFetch = async () => ({ ok: true, json: async () => ({}) });
const failFetch = async () => ({ ok: false, json: async () => ({ message: 'bad key' }) });
const valid = { name: 'Test Customer', email: 'test@example.com', phone: '0400', service: 'Retaining wall', message: 'Quote please' };

const cases = [
  ['GET is rejected', { method: 'GET' }, { apiKey: 'x' }, 405],
  ['missing API key -> 500', { method: 'POST', body: valid }, { apiKey: undefined }, 500],
  ['missing fields -> 400', { method: 'POST', body: { name: '', email: '', message: '' } }, { apiKey: 'x', fetchImpl: okFetch }, 400],
  ['bad email -> 400', { method: 'POST', body: { ...valid, email: 'nope' } }, { apiKey: 'x', fetchImpl: okFetch }, 400],
  ['valid + Resend ok -> 200', { method: 'POST', body: valid }, { apiKey: 'x', fetchImpl: okFetch }, 200],
  ['valid + Resend fails -> 502', { method: 'POST', body: valid }, { apiKey: 'x', fetchImpl: failFetch }, 502],
  ['string body is parsed', { method: 'POST', body: JSON.stringify(valid) }, { apiKey: 'x', fetchImpl: okFetch }, 200],
];

let pass = 0, fail = 0;
for (const [label, req, opts, expected] of cases) {
  const res = await run(req, opts);
  const ok = res.statusCode === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  -> ${res.statusCode} (expected ${expected})`);
  ok ? pass++ : fail++;
}
let captured = null;
await run({ method: 'POST', body: valid }, { apiKey: 'x', fetchImpl: async (url, o) => { captured = JSON.parse(o.body); return { ok: true, json: async () => ({}) }; } });
const payloadOk = captured && /Service: Retaining wall/.test(captured.text) && captured.to[0] === 'luke@sharpbricklaying.com.au';
console.log(`${payloadOk ? 'PASS' : 'FAIL'}  service field + recipient land in the email payload`);
payloadOk ? pass++ : fail++;

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
