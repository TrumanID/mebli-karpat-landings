/**
 * Self-hosted proof-of-work captcha: no third party, no cookies, no user puzzle.
 * The server signs a hash of salt + secret number; the browser finds the number by trying candidates.
 * Stateless apart from a best-effort, per-isolate replay guard.
 */
/** About 1 s at worst on a desktop and 4 s on a slow phone, in the background (measured 2026-11-06). */
export const CAPTCHA_MAX = 200_000;
export const CAPTCHA_TTL_MS = 30 * 60 * 1000;
/** Fallback for browsers without JavaScript, shown in <noscript>. Weak on purpose: it only stops untargeted bots. */
export const NOSCRIPT_QUESTION = { a: 4, b: 3 };

export interface Challenge { salt: string; challenge: string; signature: string; max: number }
export interface Solution { salt: string; number: number; challenge: string; signature: string }

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function hmac(secret: string, s: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(s)));
}

export async function createChallenge(secret: string, now: number): Promise<Challenge> {
  const random = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const salt = `${now + CAPTCHA_TTL_MS}.${random}`;
  const number = crypto.getRandomValues(new Uint32Array(1))[0]! % (CAPTCHA_MAX + 1);
  const challenge = await sha256(salt + number);
  return { salt, challenge, signature: await hmac(secret, challenge), max: CAPTCHA_MAX };
}

/** Runs in the browser. Awaiting each digest keeps the page responsive. */
export async function solveChallenge(c: Challenge): Promise<Solution> {
  for (let number = 0; number <= c.max; number++) {
    if (await sha256(c.salt + number) === c.challenge) return { salt: c.salt, number, challenge: c.challenge, signature: c.signature };
  }
  throw new Error('captcha: no solution');
}

const used = new Map<string, number>();
export const resetCaptchaReplay = () => used.clear();

/** Accepts a solved challenge or the no-JS answer. Returns the challenge to burn once the request is accepted. */
export async function verifyCaptcha(raw: Record<string, unknown>, secret: string, now: number): Promise<{ ok: boolean; burn?: { challenge: string; expires: number } }> {
  if (raw.captcha === undefined || raw.captcha === '') {
    return { ok: String(raw.captchaAnswer ?? '').trim() === String(NOSCRIPT_QUESTION.a + NOSCRIPT_QUESTION.b) };
  }
  if (typeof raw.captcha !== 'string' || raw.captcha.length > 1000) return { ok: false };
  let s: Partial<Solution>;
  try { s = JSON.parse(raw.captcha); } catch { return { ok: false }; }
  if (typeof s.salt !== 'string' || typeof s.challenge !== 'string' || typeof s.signature !== 'string' || !Number.isInteger(s.number)) return { ok: false };
  const expires = Number(s.salt.split('.')[0]);
  if (!(expires > now) || used.has(s.challenge)) return { ok: false };
  if (await sha256(s.salt + s.number) !== s.challenge) return { ok: false };
  if (await hmac(secret, s.challenge) !== s.signature) return { ok: false };
  return { ok: true, burn: { challenge: s.challenge, expires } };
}

export function burnCaptcha(burn: { challenge: string; expires: number } | undefined, now: number) {
  if (!burn) return;
  for (const [k, exp] of used) if (exp <= now) used.delete(k);
  used.set(burn.challenge, burn.expires);
}
