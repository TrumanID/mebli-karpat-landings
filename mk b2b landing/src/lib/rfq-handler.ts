import { fromFormData, validateRfq, type RfqData } from './rfq-schema.ts';
import { locales, isLocale, type Locale } from '../i18n/locales.ts';
import { localizedPath } from '../i18n/routes.ts';
import { burnCaptcha, createChallenge, verifyCaptcha } from './captcha.ts';

export interface RfqEnv {
  RFQ_TO_EMAIL?: string;
  RFQ_FROM_EMAIL?: string;
  BREVO_API_KEY?: string;
  RFQ_WEBHOOK_URL?: string;
  RFQ_CAPTCHA_SECRET?: string;
}
interface FormUi {
  form: { errorSummary: string; errorSend: string; back: string; errors: Record<string, string>; segments: Record<string, string> };
  email: { ackSubject: string; ackBody: string };
}
export interface Deps {
  ui: Record<string, FormUi>;
  fetch?: typeof fetch;
  now?: () => number;
}

const MIN_FILL_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
/** Per-isolate, so best effort: pair it with a Cloudflare rate-limiting rule on /api/rfq (see docs/decisions.md). */
const hits = new Map<string, number[]>();

export function isRateLimited(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}
export const resetRateLimit = () => hits.clear();

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

function reference(now: number) {
  const d = new Date(now).toISOString().slice(0, 10).replaceAll('-', '');
  const rand = crypto.getRandomValues(new Uint8Array(3));
  return `MK-${d}-${[...rand].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

async function checkVat(vatId: string | undefined, f: typeof fetch) {
  const m = vatId?.replace(/[\s.-]/g, '').toUpperCase().match(/^([A-Z]{2})([A-Z0-9]{2,12})$/);
  if (!m) return vatId ? 'not checked (format)' : 'not given';
  try {
    const res = await f(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${m[1]}/vat/${m[2]}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return 'not checked (VIES unavailable)';
    return (await res.json() as { isValid?: boolean }).isValid ? 'valid (VIES)' : 'NOT valid (VIES)';
  } catch {
    return 'not checked (VIES unavailable)';
  }
}

async function sendMail(env: RfqEnv, f: typeof fetch, to: string, subject: string, text: string, replyTo?: string) {
  const res = await f('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: env.RFQ_FROM_EMAIL, name: 'Mebli Karpat' },
      to: [{ email: to }],
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`mail provider responded ${res.status}`);
}

function salesText(d: RfqData, ref: string, ui: FormUi, vat: string) {
  const line = (label: string, v?: string) => (v ? `${label}: ${v}\n` : '');
  return `Reference: ${ref}\nLocale: ${d.locale}\nVia: ${d.submitted_via ?? 'web'}\n\n` +
    line('Name', d.name) + line('Company', d.company) + line('Segment', ui.form.segments[d.segment]) +
    line('Email', d.email) + line('Phone', d.phone) + line('Country/postcode', d.country) +
    line('Products', d.products?.join(', ')) + line('Other products', d.productsFree) + line('Quantity', d.quantity) +
    line('Delivery date', d.deliveryDate) + line('Custom', d.custom) + line('Drawings', d.drawings) +
    line('VAT ID', d.vatId && `${d.vatId}: ${vat}`) + line('Message', d.message) +
    `\nBusiness use confirmed: yes\nConsent given: yes\n`;
}

export async function handleChallenge(env: RfqEnv, now = Date.now()): Promise<Response> {
  if (!env.RFQ_CAPTCHA_SECRET) {
    console.error('rfq: captcha is not configured');
    return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }
  return Response.json(await createChallenge(env.RFQ_CAPTCHA_SECRET, now), { headers: { 'cache-control': 'no-store' } });
}

export async function handleRfq(request: Request, env: RfqEnv, deps: Deps): Promise<Response> {
  const f = deps.fetch ?? fetch;
  const now = (deps.now ?? Date.now)();
  const type = request.headers.get('content-type') ?? '';
  const isJsonBody = type.includes('application/json');
  const wantsJson = isJsonBody || (request.headers.get('accept') ?? '').includes('application/json');

  let raw: Record<string, unknown>;
  try {
    raw = isJsonBody ? await request.json() as Record<string, unknown> : fromFormData(await request.formData());
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const locale: Locale = isLocale(raw.locale) ? raw.locale : 'de';
  const ui = deps.ui[locale] ?? deps.ui.en!;
  const home = localizedPath('home', locale);
  const thanks = localizedPath('thanks', locale);
  const success = (reference?: string) => wantsJson
    ? Response.json({ ok: true, reference, redirect: thanks })
    : new Response(null, { status: 303, headers: { location: new URL(thanks, request.url).href } });
  const page = (status: number, title: string, items: string[] = []) =>
    new Response(`<!doctype html><html lang="${locales[locale].htmlLang}"><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><body><main><h1>${esc(title)}</h1><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul><p><a href="${home}#rfq">${esc(ui.form.back)}</a></p></main></body></html>`,
      { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
  const failure = (status: number, code: string, title: string, items: string[] = [], errors?: object) =>
    wantsJson ? Response.json({ ok: false, error: code, errors }, { status }) : page(status, title, items);

  // Spam: answer as if accepted, so bots learn nothing.
  const startedAt = Number(raw.ts);
  if (raw.website || (startedAt && now - startedAt < MIN_FILL_MS)) return success();

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  if (ip && isRateLimited(ip, now)) return failure(429, 'rate_limited', ui.form.errorSend);

  if (!env.RFQ_CAPTCHA_SECRET) {
    console.error('rfq: captcha is not configured');
    return failure(503, 'not_configured', ui.form.errorSend);
  }
  const captcha = await verifyCaptcha(raw, env.RFQ_CAPTCHA_SECRET, now);
  const { ts: _ts, website: _website, captcha: _captcha, captchaAnswer: _answer, ...fields } = raw;
  const result = validateRfq({ ...fields, locale });
  if (!result.ok || !captcha.ok) {
    const errors: Record<string, string> = { ...(result.ok ? {} : result.errors), ...(captcha.ok ? {} : { captcha: 'captcha' }) };
    const items = Object.entries(errors).map(([k, c]) => `${k}: ${ui.form.errors[c]}`);
    return failure(422, 'validation', ui.form.errorSummary, items, errors);
  }
  const d = result.data;
  if (!env.BREVO_API_KEY || !env.RFQ_TO_EMAIL || !env.RFQ_FROM_EMAIL) {
    console.error('rfq: email is not configured');
    return failure(503, 'not_configured', ui.form.errorSend);
  }

  burnCaptcha(captcha.burn, now);
  const ref = reference(now);
  const vat = await checkVat(d.vatId, f);
  try {
    await sendMail(env, f, env.RFQ_TO_EMAIL, `[RFQ][${d.locale.toUpperCase()}] ${d.company} (${ref})`, salesText(d, ref, ui, vat), d.email);
  } catch (err) {
    console.error('rfq: sales email failed', (err as Error).message); // no personal data in logs
    return failure(502, 'send_failed', ui.form.errorSend);
  }
  await sendMail(env, f, d.email, fill(ui.email.ackSubject, { ref }), fill(ui.email.ackBody, { ref, name: d.name }))
    .catch((err) => console.error('rfq: autoresponder failed', err.message));
  if (env.RFQ_WEBHOOK_URL) {
    await f(env.RFQ_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reference: ref, ...d }) })
      .catch((err) => console.error('rfq: webhook failed', err.message));
  }
  return success(ref);
}
