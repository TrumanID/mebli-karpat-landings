import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleChallenge, handleRfq, resetRateLimit } from '../src/lib/rfq-handler.ts';
import { CAPTCHA_TTL_MS, resetCaptchaReplay, solveChallenge, type Challenge } from '../src/lib/captcha.ts';

const load = (l: string) => JSON.parse(readFileSync(`src/i18n/ui/${l}.json`, 'utf8'));
const ui = { de: load('de'), en: load('en') };
const env = { BREVO_API_KEY: 'k', RFQ_TO_EMAIL: 'sales@example.com', RFQ_FROM_EMAIL: 'from@example.com', RFQ_CAPTCHA_SECRET: 'test-secret' };
const good = { name: 'A B', company: 'C GmbH', segment: 'gastro', email: 'a@example.com', country: 'DE 10115', business: 'on', consent: 'on', locale: 'en', submitted_via: 'web', captchaAnswer: '7' };
const NOW = 1_800_000_000_000;

function mailer(status = 200) {
  const calls: Array<{ url: string; body: any }> = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null });
    return Response.json({ isValid: true }, { status });
  }) as typeof globalThis.fetch;
  return { calls, fetch };
}
const post = (fields: Record<string, string>, headers: Record<string, string> = {}) =>
  new Request('https://x.test/api/rfq', { method: 'POST', body: new URLSearchParams(fields), headers });
const json = { accept: 'application/json' };

beforeEach(() => { resetRateLimit(); resetCaptchaReplay(); });

test('valid form post sends two mails and redirects to the locale thank-you page', async () => {
  const m = mailer();
  const res = await handleRfq(post(good), env, { ui, fetch: m.fetch, now: () => NOW });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://x.test/en/thank-you/');
  assert.equal(m.calls.length, 2);
  assert.match(m.calls[0].body.subject, /^\[RFQ\]\[EN\] C GmbH \(MK-/);
  assert.equal(m.calls[0].body.replyTo.email, 'a@example.com');
  assert.equal(m.calls[1].body.to[0].email, 'a@example.com');
  assert.match(m.calls[1].body.textContent, /reference number is MK-/);
});

test('German post redirects to /danke/ and the autoresponder is German', async () => {
  const m = mailer();
  const res = await handleRfq(post({ ...good, locale: 'de' }), env, { ui, fetch: m.fetch, now: () => NOW });
  assert.equal(new URL(res.headers.get('location')!).pathname, '/danke/');
  assert.match(m.calls[1].body.textContent, /Guten Tag/);
});

test('missing required fields return field codes; no mail goes out', async () => {
  const m = mailer();
  const res = await handleRfq(post({ locale: 'de', email: 'nope' }, json), env, { ui, fetch: m.fetch, now: () => NOW });
  assert.equal(res.status, 422);
  const body = await res.json() as { errors: Record<string, string> };
  assert.equal(body.errors.email, 'email');
  assert.equal(body.errors.name, 'required');
  assert.equal(body.errors.segment, 'required');
  assert.equal(body.errors.consent, 'checked');
  assert.equal(body.errors.business, 'checked');
  assert.equal(m.calls.length, 0);
});

test('no-JS validation failure returns an escaped, localised HTML page', async () => {
  const res = await handleRfq(post({ ...good, locale: 'de', drawings: 'javascript:alert(1)' }), env, { ui, fetch: mailer().fetch, now: () => NOW });
  assert.equal(res.status, 422);
  const html = await res.text();
  assert.match(html, /lang="de"/);
  assert.match(html, /vollständige URL/);
  assert.doesNotMatch(html, /javascript:alert/);
});

test('honeypot and time trap look like success and send nothing', async () => {
  for (const extra of [{ website: 'x' }, { ts: String(NOW - 500) }] as Array<Record<string, string>>) {
    const m = mailer();
    const res = await handleRfq(post({ ...good, ...extra }), env, { ui, fetch: m.fetch, now: () => NOW });
    assert.equal(res.status, 303);
    assert.equal(m.calls.length, 0);
  }
});

test('rate limit answers 429 after five posts from one IP', async () => {
  const m = mailer();
  const headers = { 'cf-connecting-ip': '192.0.2.1', ...json };
  for (let i = 0; i < 5; i++) assert.equal((await handleRfq(post(good, headers), env, { ui, fetch: m.fetch, now: () => NOW })).status, 200);
  assert.equal((await handleRfq(post(good, headers), env, { ui, fetch: m.fetch, now: () => NOW })).status, 429);
});

test('provider failure on the sales mail is reported, not hidden', async () => {
  const res = await handleRfq(post(good, json), env, { ui, fetch: mailer(500).fetch, now: () => NOW });
  assert.equal(res.status, 502);
});

test('missing email configuration answers 503', async () => {
  const res = await handleRfq(post(good, json), {}, { ui, fetch: mailer().fetch, now: () => NOW });
  assert.equal(res.status, 503);
});

test('agents can post JSON', async () => {
  const m = mailer();
  const body = JSON.stringify({ ...good, business: true, consent: true, submitted_via: 'agent', products: ['milan'] });
  const res = await handleRfq(new Request('https://x.test/api/rfq', { method: 'POST', body, headers: { 'content-type': 'application/json' } }), env, { ui, fetch: m.fetch, now: () => NOW });
  assert.equal(res.status, 200);
  assert.match(m.calls[0].body.textContent, /Via: agent/);
  assert.match(m.calls[0].body.textContent, /Products: milan/);
});

const { captchaAnswer: _a, ...noCaptcha } = good;
const issue = async (now = NOW) => await (await handleChallenge(env, now)).json() as Challenge;
const solved = async (now = NOW) => JSON.stringify(await solveChallenge(await issue(now)));
const captchaError = async (fields: Record<string, string>, now = NOW) => {
  const m = mailer();
  const res = await handleRfq(post(fields, json), env, { ui, fetch: m.fetch, now: () => now });
  assert.equal(m.calls.length, res.status === 200 ? 2 : 0);
  return { status: res.status, errors: (await res.clone().json() as { errors?: Record<string, string> }).errors };
};

test('captcha: a request without it is refused and sends nothing', async () => {
  const r = await captchaError(noCaptcha);
  assert.equal(r.status, 422);
  assert.equal(r.errors?.captcha, 'captcha');
});

test('captcha: a solved challenge passes', async () => {
  assert.equal((await captchaError({ ...noCaptcha, captcha: await solved() })).status, 200);
});

test('captcha: a solution cannot be used twice', async () => {
  const captcha = await solved();
  assert.equal((await captchaError({ ...noCaptcha, captcha })).status, 200);
  assert.equal((await captchaError({ ...noCaptcha, captcha })).status, 422);
});

test('captcha: a form error does not use up the solution', async () => {
  const captcha = await solved();
  assert.equal((await captchaError({ ...noCaptcha, email: 'nope', captcha })).status, 422);
  assert.equal((await captchaError({ ...noCaptcha, captcha })).status, 200);
});

test('captcha: expired solutions are refused', async () => {
  const captcha = await solved();
  assert.equal((await captchaError({ ...noCaptcha, captcha }, NOW + CAPTCHA_TTL_MS + 1)).errors?.captcha, 'captcha');
});

test('captcha: tampered, forged and malformed tokens are refused', async () => {
  const real = JSON.parse(await solved());
  const forged = await (await handleChallenge({ ...env, RFQ_CAPTCHA_SECRET: 'other' }, NOW)).json() as Challenge;
  const tokens = [
    JSON.stringify({ ...real, number: real.number + 1 }),
    JSON.stringify({ ...real, salt: `${NOW + 10 * CAPTCHA_TTL_MS}.abc` }),
    JSON.stringify({ ...real, signature: '00' }),
    JSON.stringify(await solveChallenge(forged)),
    'not json',
    '{}',
    'x'.repeat(2000),
  ];
  for (const captcha of tokens) assert.equal((await captchaError({ ...noCaptcha, captcha })).errors?.captcha, 'captcha', captcha.slice(0, 40));
});

test('captcha: the no-JS question needs the right answer', async () => {
  assert.equal((await captchaError({ ...noCaptcha, captchaAnswer: '8' })).errors?.captcha, 'captcha');
  assert.equal((await captchaError({ ...noCaptcha, captchaAnswer: ' 7 ' })).status, 200);
});

test('captcha: without a configured secret nothing is issued or accepted', async () => {
  const noSecret = { ...env, RFQ_CAPTCHA_SECRET: undefined };
  assert.equal((await handleChallenge(noSecret)).status, 503);
  const m = mailer();
  assert.equal((await handleRfq(post(good, json), noSecret, { ui, fetch: m.fetch, now: () => NOW })).status, 503);
  assert.equal(m.calls.length, 0);
});

test('captcha: challenges are never cached and do not reveal the number', async () => {
  const res = await handleChallenge(env, NOW);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(await res.json() as object).sort(), ['challenge', 'max', 'salt', 'signature']);
});
