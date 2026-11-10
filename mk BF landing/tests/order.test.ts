import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { bfPrice, offer, products } from '../src/data/offer.ts';
import { validateOrder, linesFrom, totals, uah } from '../src/lib/order.ts';
import { handleChallenge, handleOrder, resetRateLimit } from '../src/lib/order-handler.ts';
import { createChallenge, solveChallenge, NOSCRIPT_QUESTION, resetCaptchaReplay } from '../src/lib/captcha.ts';

const SECRET = 'test-secret';
const env = { BREVO_API_KEY: 'k', ORDER_TO_EMAIL: 'sales@example.com', ORDER_FROM_EMAIL: 'noreply@example.com', CAPTCHA_SECRET: SECRET };
const NOW = Date.parse('2026-11-27T10:00:00Z');

const valid = (extra: Record<string, string> = {}) => ({
  qty_sydney: '4', qty_grand: '1', name: 'Олена', phone: '+380 67 123 45 67', city: 'Львів',
  delivery: 'pickup', consent: 'on', ts: String(NOW - 60_000), ...extra,
});

function mailSpy() {
  const sent: { to: string; subject: string; text: string }[] = [];
  const f = (async (_url: string | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    sent.push({ to: body.to[0].email, subject: body.subject, text: body.textContent });
    return Response.json({ messageId: 'x' });
  }) as typeof fetch;
  return { sent, f };
}

async function post(fields: Record<string, string>, opts: { json?: boolean; f?: typeof fetch; e?: object; ip?: string } = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const headers: Record<string, string> = opts.json ? { accept: 'application/json' } : {};
  if (opts.ip) headers['cf-connecting-ip'] = opts.ip;
  const req = new Request('https://example.com/api/order', { method: 'POST', body: fd, headers });
  return handleOrder(req, { ...env, ...opts.e }, { fetch: opts.f ?? mailSpy().f, now: () => NOW });
}
const noJsCaptcha = { captchaAnswer: String(NOSCRIPT_QUESTION.a + NOSCRIPT_QUESTION.b) };

beforeEach(() => { resetRateLimit(); resetCaptchaReplay(); });

test('Black Friday price is the regular price minus the discount, rounded down to tens', () => {
  for (const p of products) {
    const price = bfPrice(p);
    assert.equal(price % 10, 0);
    assert.ok(price <= p.regular * (100 - offer.discountPercent) / 100, p.slug);
    assert.ok(price > p.regular * (100 - offer.discountPercent) / 100 - 10, p.slug);
  }
});

test('three chairs and three tables are on offer', () => {
  assert.equal(products.filter((p) => p.category === 'chairs').length, 3);
  assert.equal(products.filter((p) => p.category === 'tables').length, 3);
});

test('totals add up lines and savings', () => {
  const { lines } = linesFrom({ qty_sydney: '4', qty_grand: '1' });
  const t = totals(lines);
  const sydney = products.find((p) => p.slug === 'sydney')!;
  const grand = products.find((p) => p.slug === 'grand')!;
  assert.equal(t.count, 5);
  assert.equal(t.total, 4 * bfPrice(sydney) + bfPrice(grand));
  assert.equal(t.saving, 4 * (sydney.regular - bfPrice(sydney)) + grand.regular - bfPrice(grand));
  assert.equal(uah(43570), '43 570 ₴');
});

test('validation: needs at least one product, contacts and consent', () => {
  const r = validateOrder({});
  assert.equal(r.ok, false);
  if (!r.ok) for (const k of ['items', 'name', 'phone', 'city', 'delivery', 'consent']) assert.ok(k in r.errors, k);
  assert.equal(validateOrder(valid()).ok, true);
});

test('validation: rejects bad quantities, phones and e-mails', () => {
  for (const q of ['-1', '1.5', 'abc', String(offer.maxQty + 1)]) {
    const r = validateOrder(valid({ qty_sydney: q }));
    assert.equal(r.ok, false, q);
  }
  assert.equal(validateOrder(valid({ phone: '12' })).ok, false);
  assert.equal(validateOrder(valid({ phone: 'call me' })).ok, false);
  assert.equal(validateOrder(valid({ email: 'nope' })).ok, false);
  assert.equal(validateOrder(valid({ email: 'olena@example.com' })).ok, true);
  assert.equal(validateOrder(valid({ delivery: 'drone' })).ok, false);
});

test('unknown products are ignored: the server prices only what is on offer', () => {
  const r = validateOrder(valid({ qty_sydney: '0', qty_grand: '0', qty_other: '5', price_sydney: '1' }));
  assert.equal(r.ok, false);
});

test('a valid order e-mails sales with server-side prices and confirms to the buyer', async () => {
  const { sent, f } = mailSpy();
  const res = await post({ ...valid({ email: 'olena@example.com', comment: 'Тканина сіра' }), ...noJsCaptcha, price: '1' }, { f });
  assert.equal(res.status, 303);
  assert.match(res.headers.get('location')!, /\/dyakuyemo\/\?ref=BF-20261127-[A-F0-9]{6}$/);
  assert.equal(sent.length, 2);
  const sydney = products.find((p) => p.slug === 'sydney')!;
  assert.equal(sent[0]!.to, 'sales@example.com');
  assert.match(sent[0]!.text, new RegExp(`Стілець «Сідней»: 4 × ${uah(bfPrice(sydney))}`));
  assert.match(sent[0]!.text, /Тканина сіра/);
  assert.match(sent[0]!.text, /Самовивіз/);
  assert.equal(sent[1]!.to, 'olena@example.com');
  assert.match(sent[1]!.text, /не замовлення/);
});

test('without an e-mail only sales get a message', async () => {
  const { sent, f } = mailSpy();
  const res = await post({ ...valid(), ...noJsCaptcha }, { f, json: true });
  assert.equal(res.status, 200);
  const json = await res.json() as { ok: boolean; reference: string; redirect: string };
  assert.equal(json.ok, true);
  assert.match(json.redirect, /^\/dyakuyemo\/\?ref=BF-/);
  assert.equal(sent.length, 1);
});

test('validation errors come back as codes (JSON) or an escaped page (no JS)', async () => {
  const res = await post({ ...valid({ name: '<b>', qty_sydney: '0', qty_grand: '0' }), ...noJsCaptcha }, { json: true });
  assert.equal(res.status, 422);
  const json = await res.json() as { errors: Record<string, string> };
  assert.equal(json.errors.items, 'items');
  const page = await post({ ...valid({ city: '' }), ...noJsCaptcha });
  assert.equal(page.status, 422);
  const html = await page.text();
  assert.match(html, /Вкажіть населений пункт/);
  assert.doesNotMatch(html, /<b>/);
});

test('captcha: wrong no-JS answer is refused, a solved challenge is accepted once', async () => {
  const wrong = await post({ ...valid(), captchaAnswer: '8' }, { json: true });
  assert.equal(wrong.status, 422);
  assert.equal((await wrong.json() as { errors: Record<string, string> }).errors.captcha, 'captcha');

  const c = await createChallenge(SECRET, NOW);
  const solution = JSON.stringify(await solveChallenge({ ...c, max: c.max }));
  const ok = await post({ ...valid(), captcha: solution }, { json: true });
  assert.equal(ok.status, 200);
  const replay = await post({ ...valid(), captcha: solution }, { json: true });
  assert.equal(replay.status, 422);
});

test('without a captcha secret or mail settings the form refuses instead of losing orders', async () => {
  assert.equal((await post({ ...valid(), ...noJsCaptcha }, { e: { CAPTCHA_SECRET: '' } })).status, 503);
  assert.equal((await handleChallenge({})).status, 503);
  assert.equal((await post({ ...valid(), ...noJsCaptcha }, { e: { BREVO_API_KEY: '' } })).status, 503);
});

test('mail provider failure is reported, not hidden', async () => {
  const failing = (async () => new Response('', { status: 500 })) as unknown as typeof fetch;
  const res = await post({ ...valid(), ...noJsCaptcha }, { f: failing, json: true });
  assert.equal(res.status, 502);
});

test('spam: honeypot and instant submits look accepted but send nothing', async () => {
  const { sent, f } = mailSpy();
  assert.equal((await post({ ...valid({ website: 'x' }), ...noJsCaptcha }, { f })).status, 303);
  assert.equal((await post({ ...valid({ ts: String(NOW - 500) }), ...noJsCaptcha }, { f })).status, 303);
  assert.equal(sent.length, 0);
});

test('rate limit: the sixth request from one address in ten minutes is refused', async () => {
  for (let i = 0; i < 5; i++) await post({ ...valid(), ...noJsCaptcha }, { ip: '1.2.3.4' });
  assert.equal((await post({ ...valid(), ...noJsCaptcha }, { ip: '1.2.3.4' })).status, 429);
});
