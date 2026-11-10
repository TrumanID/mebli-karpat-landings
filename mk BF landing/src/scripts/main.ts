/**
 * Progressive enhancement only: without JavaScript the quantity fields, the form and the server all still work.
 * The quantity inputs on the cards are the single source of truth; everything else mirrors them.
 */
import { solveChallenge, type Challenge } from '../lib/captcha.ts';
import { fromFormData, uah, validateOrder } from '../lib/order.ts';

document.documentElement.classList.add('js');

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

const form = $<HTMLFormElement>('[data-order]');
const cards = $$('[data-card]');
const inputs = () => $$<HTMLInputElement>('[data-qty-input]');
const MAX = Number(inputs()[0]?.max ?? 50);

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(MAX, Math.max(0, Math.round(n))) : 0);
const qtyOf = (input: HTMLInputElement) => clamp(Number(input.value));
const cardOf = (slug: string) => $(`[data-card="${CSS.escape(slug)}"]`);
const inputOf = (slug: string) => $<HTMLInputElement>(`[data-qty-input="${CSS.escape(slug)}"]`);

function setQty(slug: string, n: number, focusAfter?: HTMLElement | null) {
  const input = inputOf(slug);
  if (!input) return;
  input.value = String(clamp(n));
  render();
  focusAfter?.focus();
}

/* ---------- selection, totals, summary ---------- */
function render() {
  let count = 0, total = 0, regular = 0, from = false;
  const picked: { slug: string; qty: number; card: HTMLElement }[] = [];
  for (const input of inputs()) {
    const slug = input.dataset.qtyInput!;
    const card = cardOf(slug)!;
    const qty = qtyOf(input);
    card.classList.toggle('is-picked', qty > 0);
    if (qty === 0) continue;
    picked.push({ slug, qty, card });
    count += qty;
    total += qty * Number(card.dataset.price);
    regular += qty * Number(card.dataset.regular);
    if (card.dataset.from) from = true;
  }
  const saving = regular - total;
  const prefix = from ? 'від ' : '';

  $$('[data-count-badge]').forEach((b) => { b.textContent = String(count); b.hidden = count === 0; });

  const summary = $('[data-summary]');
  if (summary) {
    summary.hidden = count === 0;
    $('[data-sum-empty]')!.hidden = count > 0;
    $('[data-sum-count]')!.textContent = `${count} шт.`;
    $('[data-sum-regular]')!.textContent = uah(regular);
    $('[data-sum-saving]')!.textContent = uah(saving);
    $('[data-sum-total]')!.textContent = prefix + uah(total);
    $('[data-sum-from]')!.hidden = !from;
  }

  const bar = $('[data-cart-bar]');
  if (bar) {
    bar.hidden = count === 0;
    $('[data-bar-count]', bar)!.textContent = String(count);
    $('[data-bar-total]', bar)!.textContent = prefix + uah(total);
    $('[data-bar-saving]', bar)!.textContent = uah(saving);
  }

  renderPickList(picked);
  if (count > 0) clearError('items');
}

/** Rows are kept and updated in place, so a click on − or + is never lost to a rebuild. */
function renderPickList(picked: { slug: string; qty: number; card: HTMLElement }[]) {
  const list = $('[data-pick-list]');
  const empty = $('[data-pick-empty]');
  if (!list || !empty) return;
  empty.hidden = picked.length > 0;
  const keep = new Set(picked.map((p) => p.slug));
  for (const li of $$('li[data-row]', list)) {
    if (keep.has(li.dataset.row!)) continue;
    const hadFocus = li.contains(document.activeElement);
    li.remove();
    if (hadFocus) ($('li[data-row] .qty-btn', list) ?? $('[data-pick-empty] a') ?? $('#order-h'))?.focus();
  }
  picked.forEach(({ slug, qty, card }, i) => {
    const li = $(`li[data-row="${CSS.escape(slug)}"]`, list) ?? pickRow(slug, card);
    if (list.children[i] !== li) list.insertBefore(li, list.children[i] ?? null);
    $('output', li)!.textContent = String(qty);
    $('[data-step="-1"] .sr-only', li)!.textContent = `${qty === 1 ? 'Прибрати' : 'Менше'}: ${card.dataset.name}`;
  });
}

function pickRow(slug: string, card: HTMLElement) {
  const li = document.createElement('li');
  li.dataset.row = slug;
  const thumb = document.createElement('div');
  thumb.className = 'pick-thumb';
  const img = card.querySelector<HTMLImageElement>('img.card-img:not(.card-img-alt)');
  if (img) {
    const copy = document.createElement('img');
    copy.src = img.currentSrc || img.src;
    copy.alt = '';
    copy.width = 56;
    copy.height = 56;
    thumb.append(copy);
  }
  const info = document.createElement('div');
  info.className = 'pick-info';
  const name = document.createElement('p');
  name.className = 'pick-name';
  name.textContent = card.dataset.name!;
  const price = document.createElement('p');
  price.className = 'pick-price';
  price.textContent = `${card.dataset.from ? 'від ' : ''}${uah(Number(card.dataset.price))} за шт.`;
  info.append(name, price);

  const ctl = document.createElement('div');
  ctl.className = 'pick-qty';
  const btn = (step: number, label: string, sign: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'qty-btn';
    b.dataset.pick = slug;
    b.dataset.step = String(step);
    const mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = sign;
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = `${label}: ${card.dataset.name}`;
    b.append(mark, sr);
    return b;
  };
  const out = document.createElement('output');
  out.setAttribute('aria-label', `Кількість: ${card.dataset.name}`);
  ctl.append(btn(-1, 'Менше', '−'), out, btn(1, 'Більше', '+'));
  li.append(thumb, info, ctl);
  return li;
}

function initCards() {
  for (const card of cards) {
    const slug = card.dataset.card!;
    const input = inputOf(slug)!;
    const add = $<HTMLButtonElement>('[data-add]', card)!;
    const steps = $$<HTMLButtonElement>('[data-step]', card);
    add.hidden = false;
    steps.forEach((b) => { b.hidden = false; });
    add.addEventListener('click', () => {
      setQty(slug, Math.max(1, qtyOf(input)));
      input.focus();
      input.select();
    });
    steps.forEach((b) => b.addEventListener('click', () => {
      const next = qtyOf(input) + Number(b.dataset.step);
      setQty(slug, next, next <= 0 ? add : null);
    }));
    input.addEventListener('input', render);
    input.addEventListener('change', () => { input.value = String(qtyOf(input)); render(); if (qtyOf(input) === 0) add.focus(); });
  }
  $('[data-pick-list]')?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pick]');
    if (!b) return;
    const input = inputOf(b.dataset.pick!)!;
    setQty(b.dataset.pick!, qtyOf(input) + Number(b.dataset.step));
  });
  render();
}

/* ---------- countdown ---------- */
function initCountdown() {
  const box = $('[data-countdown]');
  if (!box) return;
  const start = Date.parse(box.dataset.start!);
  const end = Date.parse(box.dataset.end!);
  const label = $('[data-countdown-label]', box)!;
  const grid = $('[data-countdown-grid]', box)!;
  const units = Object.fromEntries($$('[data-unit]', box).map((el) => [el.dataset.unit!, el]));
  const period = box.dataset.period!;
  const tick = () => {
    const now = Date.now();
    const target = now < start ? start : end;
    if (now >= end) { label.textContent = 'Акцію завершено. Запитайте менеджера про актуальні ціни.'; grid.hidden = true; return false; }
    label.textContent = now < start ? `До старту Black Friday · ${period}` : `До кінця акції · ${period}`;
    grid.hidden = false;
    let s = Math.max(0, Math.floor((target - now) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    units.d!.textContent = String(d);
    units.h!.textContent = String(h).padStart(2, '0');
    units.m!.textContent = String(m).padStart(2, '0');
    units.s!.textContent = String(s).padStart(2, '0');
    return true;
  };
  // The ticking numbers are aria-hidden: screen readers get the label with the dates instead of a clock.
  if (tick()) setInterval(tick, 1000);
}

/* ---------- sticky bar hides near the form ---------- */
function initBar() {
  const bar = $('[data-cart-bar]');
  const order = $('#order');
  const hero = $('.hero');
  if (!bar || !order || !('IntersectionObserver' in window)) return;
  let nearOrder = false, inHero = true;
  const sync = () => bar.classList.toggle('is-away', nearOrder || inHero);
  new IntersectionObserver(([e]) => { nearOrder = e!.isIntersecting; sync(); }, { rootMargin: '0px 0px -30% 0px' }).observe(order);
  if (hero) new IntersectionObserver(([e]) => { inHero = e!.isIntersecting; sync(); }, { threshold: 0.35 }).observe(hero);
}

/* ---------- form ---------- */
let messages: Record<string, string> = {};

function errorSlot(name: string) { return form?.querySelector<HTMLElement>(`[data-error-for="${name}"]`) ?? null; }
function fieldsFor(name: string) {
  if (!form) return [];
  if (name === 'items') return inputs();
  return $$<HTMLInputElement>(`[name="${name}"]`, form);
}
function setError(name: string, code?: string) {
  const slot = errorSlot(name);
  if (!slot) return;
  slot.textContent = code ? messages[code] ?? code : '';
  slot.hidden = !code;
  fieldsFor(name).forEach((el) => {
    if (code) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    if (name === 'items') return;
    const ids = new Set((el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean));
    ids.add(slot.id);
    el.setAttribute('aria-describedby', [...ids].join(' '));
  });
}
const clearError = (name: string) => setError(name);

function showErrors(errors: Record<string, string>) {
  for (const slot of $$('[data-error-for]', form!)) setError(slot.dataset.errorFor!, errors[slot.dataset.errorFor!]);
  const firstSlot = $$('[data-error-for]', form!).find((s) => !s.hidden);
  if (!firstSlot) return;
  const name = firstSlot.dataset.errorFor!;
  if (name === 'items') {
    const target = $('[data-pick-empty]', form!)!.hidden ? inputs()[0] : $('[data-pick-empty] a', form!);
    (target ?? firstSlot).focus();
    firstSlot.scrollIntoView({ block: 'center' });
    return;
  }
  const target = fieldsFor(name)[0] ?? firstSlot;
  target.focus();
}

function initCaptcha(f: HTMLFormElement) {
  const box = $('[data-captcha]', f)!;
  const status = $('[data-captcha-status]', box)!;
  const retry = $<HTMLButtonElement>('[data-captcha-retry]', box)!;
  const field = f.elements.namedItem('captcha') as HTMLInputElement;
  box.hidden = false;
  let work: Promise<void> | null = null;
  const state = (name: 'waiting' | 'solving' | 'done' | 'failed') => {
    box.dataset.state = name;
    status.textContent = box.dataset[name]!;
    retry.hidden = name !== 'failed';
  };
  const run = async () => {
    state('solving');
    try {
      const res = await fetch('/api/captcha', { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (!res.ok) throw new Error(`captcha ${res.status}`);
      field.value = JSON.stringify(await solveChallenge(await res.json() as Challenge));
      state('done');
    } catch (err) {
      work = null;
      field.value = '';
      state('failed');
      throw err;
    }
  };
  const start = () => (work ??= run());
  f.addEventListener('focusin', () => { start().catch(() => {}); });
  // Picking a product signals intent: start early so the check is done before the buyer reaches "Send".
  inputs().forEach((i) => i.addEventListener('change', () => { if (qtyOf(i) > 0) start().catch(() => {}); }));
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => { start().catch(() => {}); }));
  retry.addEventListener('click', () => { start().catch(() => {}); });
  return {
    ready: start,
    renew: () => { work = null; field.value = ''; return start(); },
  };
}

function initForm() {
  if (!form) return;
  const f = form;
  messages = JSON.parse(f.dataset.errors!);
  const status = $('[data-form-status]', f)!;
  const button = $<HTMLButtonElement>('[data-submit]', f)!;
  const say = (text: string) => { status.textContent = text; status.hidden = !text; if (text) status.focus(); };
  const data = () => fromFormData(new FormData(f));

  (f.elements.namedItem('ts') as HTMLInputElement).value = String(Date.now());
  f.noValidate = true;
  const captcha = initCaptcha(f);

  const recheck = (name?: string) => {
    if (!name || !errorSlot(name)) return;
    const check = validateOrder(data());
    setError(name, check.ok ? undefined : check.errors[name]);
  };
  const isInvalid = (el: EventTarget | null) => (el as Element | null)?.getAttribute?.('aria-invalid') === 'true';
  f.addEventListener('focusout', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.value && el.type !== 'checkbox' && el.type !== 'radio') recheck(el.name);
  });
  f.addEventListener('input', (e) => { if (isInvalid(e.target)) recheck((e.target as HTMLInputElement).name); });
  f.addEventListener('change', (e) => { if (isInvalid(e.target)) recheck((e.target as HTMLInputElement).name); });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const check = validateOrder(data());
    if (!check.ok) {
      showErrors(check.errors);
      return;
    }
    showErrors({});
    status.hidden = true;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = button.dataset.sending!;
    try {
      const send = async () => {
        const res = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { accept: 'application/json' } });
        return await res.json() as { ok: boolean; redirect?: string; errors?: Record<string, string>; error?: string };
      };
      await captcha.ready();
      let json = await send();
      if (json.errors?.captcha) {
        await captcha.renew();
        json = await send();
      }
      if (json.ok && json.redirect) {
        location.assign(json.redirect);
        return;
      }
      if (json.errors) {
        showErrors(json.errors);
        if (json.errors.captcha) say(messages.captcha!);
      } else {
        say(`Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.`);
      }
    } catch {
      say('Не вдалося надіслати заявку: перевірте з’єднання з інтернетом і спробуйте ще раз.');
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
}

/* ---------- thank-you page reference ---------- */
function initThanks() {
  const box = $('[data-ref]');
  const ref = new URLSearchParams(location.search).get('ref');
  if (box && ref && /^BF-\d{8}-[A-F0-9]{6}$/.test(ref)) {
    $('[data-ref-value]', box)!.textContent = ref;
    box.hidden = false;
  }
}

initCards();
initCountdown();
initBar();
initForm();
initThanks();
