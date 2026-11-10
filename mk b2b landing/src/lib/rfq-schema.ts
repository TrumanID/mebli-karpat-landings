import { z } from 'zod/mini';

/** Shared by the browser and the Pages Function (SPEC §12). Error messages are codes, looked up in ui.form.errors. */
export const segments = ['gastro', 'trade', 'oem', 'planner', 'other'] as const;
export type ErrorCode = 'required' | 'email' | 'url' | 'checked' | 'invalid';

const req = (max = 200) => z.string({ error: 'required' }).check(z.trim(), z.minLength(1, { error: 'required' }), z.maxLength(max, { error: 'invalid' }));
const opt = (max = 200) => z.optional(z.string({ error: 'invalid' }).check(z.trim(), z.maxLength(max, { error: 'invalid' })));

export const rfqSchema = z.object({
  name: req(),
  company: req(),
  segment: z.enum(segments, { error: 'required' }),
  email: z.string({ error: 'required' }).check(z.trim(), z.minLength(1, { error: 'required' }), z.email({ error: 'email' }), z.maxLength(254, { error: 'email' })),
  phone: opt(50),
  country: req(),
  products: z.optional(z.array(z.string().check(z.maxLength(80))).check(z.maxLength(36))),
  productsFree: opt(500),
  quantity: opt(100),
  deliveryDate: opt(50),
  custom: z.optional(z.enum(['yes', 'no'], { error: 'invalid' })),
  message: opt(5000),
  drawings: z.optional(z.url({ protocol: /^https?$/, error: 'url' })),
  vatId: opt(20),
  business: z.literal(true, { error: 'checked' }),
  consent: z.literal(true, { error: 'checked' }),
  locale: z.string({ error: 'invalid' }).check(z.regex(/^[a-z]{2}$/, { error: 'invalid' })),
  submitted_via: z.optional(z.enum(['web', 'agent', 'mcp'], { error: 'invalid' })),
});
export type RfqData = z.infer<typeof rfqSchema>;

const FLAGS = ['business', 'consent'];

/** Normalises a form post: empty strings become absent, checkboxes become booleans. */
export function fromFormData(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const value = String(form.get(key) ?? '').trim();
    if (key === 'products') out.products = form.getAll('products').map(String);
    else if (FLAGS.includes(key)) out[key] = value !== '';
    else if (value !== '') out[key] = value;
  }
  return out;
}

export function validateRfq(input: unknown) {
  const result = z.safeParse(rfqSchema, input);
  if (result.success) return { ok: true as const, data: result.data };
  const errors: Record<string, ErrorCode> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= (['required', 'email', 'url', 'checked', 'invalid'].includes(issue.message) ? issue.message : 'invalid') as ErrorCode;
  }
  return { ok: false as const, errors };
}
