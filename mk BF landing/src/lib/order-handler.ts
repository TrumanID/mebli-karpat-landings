/** Server side of the order form. Runs as a Cloudflare Pages Function and inside the local preview server. */
import { DELIVERY, MESSAGES, fromFormData, orderText, totals, validateOrder, type Order } from './order.ts';
import { burnCaptcha, createChallenge, verifyCaptcha } from './captcha.ts';
import { company } from '../data/offer.ts';

export interface OrderEnv {
  ORDER_TO_EMAIL?: string;
  ORDER_FROM_EMAIL?: string;
  BREVO_API_KEY?: string;
  CAPTCHA_SECRET?: string;
}
export interface Deps { fetch?: typeof fetch; now?: () => number }

const MIN_FILL_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
/** Per isolate, so best effort: add a Cloudflare rate-limiting rule on /api/order as well. */
const hits = new Map<string, number[]>();
export function isRateLimited(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}
export const resetRateLimit = () => hits.clear();

const THANKS = '/dyakuyemo/';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function reference(now: number) {
  const d = new Date(now).toISOString().slice(0, 10).replaceAll('-', '');
  const rand = [...crypto.getRandomValues(new Uint8Array(3))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `BF-${d}-${rand.toUpperCase()}`;
}

async function sendMail(env: OrderEnv, f: typeof fetch, to: string, subject: string, text: string, replyTo?: string) {
  const res = await f('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: env.ORDER_FROM_EMAIL, name: company.name },
      to: [{ email: to }],
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`mail provider responded ${res.status}`);
}

export function salesText(o: Order, ref: string) {
  const line = (label: string, v?: string) => (v ? `${label}: ${v}\n` : '');
  return `Заявка Black Friday ${ref}\n\n${orderText(o)}\n\n` +
    line('Ім’я', o.name) + line('Телефон', o.phone) + line('E-mail', o.email) + line('Населений пункт', o.city) +
    line('Отримання', DELIVERY[o.delivery]) + line('Побажання', o.comment) +
    `\nЗгода на обробку даних: так\nЦіни розраховано на сервері за src/data/offer.ts.\n`;
}

export function customerText(o: Order, ref: string) {
  return `Добрий день, ${o.name}!\n\nДякуємо за заявку ${ref}. Ми отримали ваш вибір:\n\n${orderText(o)}\n\n` +
    `Це ще не замовлення і не рахунок. Менеджер зв’яжеться з вами, щоб узгодити колір, тканину, розмір і строк, ` +
    `а потім надішле договір і рахунок на передоплату 50 %.\n\n${company.name}\n${company.phoneDisplay}\n${company.email}\n`;
}

export async function handleChallenge(env: OrderEnv, now = Date.now()): Promise<Response> {
  if (!env.CAPTCHA_SECRET) {
    console.error('order: captcha is not configured');
    return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }
  return Response.json(await createChallenge(env.CAPTCHA_SECRET, now), { headers: { 'cache-control': 'no-store' } });
}

export async function handleOrder(request: Request, env: OrderEnv, deps: Deps = {}): Promise<Response> {
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

  const success = (ref?: string) => {
    const to = ref ? `${THANKS}?ref=${encodeURIComponent(ref)}` : THANKS;
    return wantsJson
      ? Response.json({ ok: true, reference: ref, redirect: to })
      : new Response(null, { status: 303, headers: { location: new URL(to, request.url).href } });
  };
  const page = (status: number, title: string, items: string[] = []) =>
    new Response(`<!doctype html><html lang="uk"><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><body><main><h1>${esc(title)}</h1><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul><p><a href="/#order">Повернутися до форми</a></p></main></body></html>`,
      { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
  const failure = (status: number, code: string, title: string, items: string[] = [], errors?: object) =>
    wantsJson ? Response.json({ ok: false, error: code, errors }, { status }) : page(status, title, items);
  const sendError = `Не вдалося надіслати заявку. Зателефонуйте нам: ${company.phoneDisplay}.`;

  // Spam: answer as if accepted, so bots learn nothing.
  const startedAt = Number(raw.ts);
  if (raw.website || (startedAt && now - startedAt < MIN_FILL_MS)) return success();

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  if (ip && isRateLimited(ip, now)) return failure(429, 'rate_limited', 'Забагато заявок. Спробуйте за кілька хвилин.');

  if (!env.CAPTCHA_SECRET) {
    console.error('order: captcha is not configured');
    return failure(503, 'not_configured', sendError);
  }
  const captcha = await verifyCaptcha(raw, env.CAPTCHA_SECRET, now);
  const result = validateOrder(raw);
  if (!result.ok || !captcha.ok) {
    const errors: Record<string, string> = { ...(result.ok ? {} : result.errors), ...(captcha.ok ? {} : { captcha: 'captcha' }) };
    return failure(422, 'validation', 'Перевірте форму', Object.values(errors).map((c) => MESSAGES[c]!), errors);
  }
  if (!env.BREVO_API_KEY || !env.ORDER_TO_EMAIL || !env.ORDER_FROM_EMAIL) {
    console.error('order: email is not configured');
    return failure(503, 'not_configured', sendError);
  }

  burnCaptcha(captcha.burn, now);
  const o = result.data;
  const ref = reference(now);
  const t = totals(o.lines);
  try {
    await sendMail(env, f, env.ORDER_TO_EMAIL, `[Black Friday] ${o.name}, ${t.count} шт. (${ref})`, salesText(o, ref), o.email);
  } catch (err) {
    console.error('order: sales email failed', (err as Error).message); // no personal data in logs
    return failure(502, 'send_failed', sendError);
  }
  if (o.email) {
    await sendMail(env, f, o.email, `Ваша заявка ${ref}: ${company.name}, Black Friday`, customerText(o, ref))
      .catch((err) => console.error('order: confirmation email failed', err.message));
  }
  return success(ref);
}
