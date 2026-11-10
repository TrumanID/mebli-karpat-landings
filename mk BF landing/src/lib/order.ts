/** Shared by the browser and the server: one set of rules, one price calculation. */
import { bfPrice, offer, products, type Product } from '../data/offer.ts';

export const DELIVERY = {
  pickup: 'Самовивіз з фірмового магазину у Львові',
  lviv: 'Доставка по Львову та Львівській області',
  carrier: 'Службою доставки в інше місто',
} as const;
export type Delivery = keyof typeof DELIVERY;

export const MESSAGES: Record<string, string> = {
  items: 'Оберіть хоча б одну модель і вкажіть кількість.',
  qty: `Кількість: ціле число від 0 до ${offer.maxQty}.`,
  name: 'Вкажіть ваше ім’я.',
  phone: 'Вкажіть номер телефону, наприклад +380 67 123 45 67.',
  email: 'Перевірте адресу e-mail або залиште поле порожнім.',
  city: 'Вкажіть населений пункт.',
  delivery: 'Оберіть спосіб отримання.',
  comment: 'Коментар задовгий: до 2000 символів.',
  consent: 'Потрібна ваша згода на обробку даних, щоб ми могли зв’язатися з вами.',
  captcha: 'Не вдалося перевірити, що ви не робот. Спробуйте ще раз.',
};

export interface Line { product: Product; qty: number; unit: number; regular: number; total: number; saving: number }
export interface Order {
  lines: Line[];
  name: string;
  phone: string;
  email?: string;
  city: string;
  delivery: Delivery;
  comment?: string;
}

export const qtyField = (slug: string) => `qty_${slug}`;
export const uah = (n: number) => `${new Intl.NumberFormat('uk-UA').format(n).replace(/ /g, ' ')} ₴`;

export function linesFrom(raw: Record<string, unknown>): { lines: Line[]; bad: boolean } {
  let bad = false;
  const lines: Line[] = [];
  for (const product of products) {
    const v = String(raw[qtyField(product.slug)] ?? '').trim();
    if (v === '') continue;
    const qty = Number(v);
    if (!Number.isInteger(qty) || qty < 0 || qty > offer.maxQty) { bad = true; continue; }
    if (qty === 0) continue;
    const unit = bfPrice(product);
    lines.push({ product, qty, unit, regular: product.regular, total: unit * qty, saving: (product.regular - unit) * qty });
  }
  return { lines, bad };
}

export const totals = (lines: Line[]) => ({
  count: lines.reduce((s, l) => s + l.qty, 0),
  total: lines.reduce((s, l) => s + l.total, 0),
  saving: lines.reduce((s, l) => s + l.saving, 0),
  from: lines.some((l) => l.product.from),
});

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateOrder(raw: Record<string, unknown>):
  { ok: true; data: Order } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const { lines, bad } = linesFrom(raw);
  if (bad) errors.items = 'qty';
  else if (lines.length === 0) errors.items = 'items';

  const name = str(raw.name);
  if (name.length < 2 || name.length > 100) errors.name = 'name';
  const phone = str(raw.phone);
  const digits = phone.replace(/\D/g, '');
  if (!/^[+\d\s()-]+$/.test(phone) || digits.length < 9 || digits.length > 15) errors.phone = 'phone';
  const email = str(raw.email);
  if (email && (email.length > 200 || !EMAIL.test(email))) errors.email = 'email';
  const city = str(raw.city);
  if (city.length < 2 || city.length > 100) errors.city = 'city';
  const delivery = str(raw.delivery);
  if (!(delivery in DELIVERY)) errors.delivery = 'delivery';
  const comment = str(raw.comment);
  if (comment.length > 2000) errors.comment = 'comment';
  if (raw.consent !== 'on' && raw.consent !== true) errors.consent = 'consent';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: { lines, name, phone, email: email || undefined, city, delivery: delivery as Delivery, comment: comment || undefined },
  };
}

export function fromFormData(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string') out[k] = v;
  return out;
}

/** Plain-text summary used in both e-mails. */
export function orderText(o: Order) {
  const t = totals(o.lines);
  const rows = o.lines.map((l) =>
    `• ${l.product.kind} «${l.product.name}»: ${l.qty} × ${l.product.from ? 'від ' : ''}${uah(l.unit)} = ${uah(l.total)}  (звичайна ціна ${uah(l.regular)})`);
  return `${rows.join('\n')}\n\nРазом: ${t.from ? 'від ' : ''}${uah(t.total)}\nЕкономія: ${uah(t.saving)}`;
}
