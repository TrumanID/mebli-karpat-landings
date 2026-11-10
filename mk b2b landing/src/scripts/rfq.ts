import { fromFormData, validateRfq } from '../lib/rfq-schema.ts';
import { track } from './analytics.ts';
import { solveChallenge, type Challenge } from '../lib/captcha.ts';

const form = document.querySelector<HTMLFormElement>('[data-rfq]');

/** Pre-selects segment and product from a URL or a clicked link (SPEC §12). */
export function applyPrefill(params: URLSearchParams) {
  if (!form) return;
  const segment = params.get('segment');
  const select = form.elements.namedItem('segment') as HTMLSelectElement;
  if (segment && [...select.options].some((o) => o.value === segment)) select.value = segment;
  const product = params.get('product');
  if (product) {
    const box = form.querySelector<HTMLInputElement>(`input[name="products"][value="${CSS.escape(product)}"]`);
    if (box) {
      box.checked = true;
      syncSelection();
    }
  }
}

const boxes = () => [...(form?.querySelectorAll<HTMLInputElement>('input[name="products"]') ?? [])];
const nameOf = (box: HTMLInputElement) => box.closest('label')?.textContent?.trim() ?? box.value;

/** The form's checkboxes hold the selection; everything else on the page mirrors them. */
function syncSelection() {
  if (!form) return;
  const picked = boxes().filter((b) => b.checked);
  const panel = form.querySelector<HTMLElement>('[data-selection]')!;
  const list = form.querySelector<HTMLElement>('[data-selection-list]')!;
  panel.hidden = picked.length === 0;
  list.replaceChildren(...picked.map((box) => {
    const li = document.createElement('li');
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'selection-chip';
    chip.dataset.removeProduct = box.value;
    const label = document.createElement('span');
    label.textContent = nameOf(box);
    const cross = document.createElement('span');
    cross.textContent = '×';
    cross.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = `: ${form!.dataset.remove}`;
    chip.append(label, hint, cross);
    li.append(chip);
    return li;
  }));
  form.querySelector<HTMLElement>('[data-products-summary]')!.textContent = picked.length
    ? form.dataset.count!.replace('{count}', String(picked.length))
    : form.dataset.productsDefault!;
  document.querySelectorAll<HTMLElement>('[data-selection-badge]').forEach((b) => {
    b.textContent = String(picked.length);
    b.hidden = picked.length === 0;
  });
  const dock = document.querySelector<HTMLElement>('[data-selection-dock]');
  if (dock) {
    dock.hidden = picked.length === 0;
    dock.querySelector('[data-dock-label]')!.textContent = form.dataset.dockLabel!;
  }
  document.querySelectorAll<HTMLButtonElement>('button[data-add]').forEach((btn) => {
    const on = picked.some((b) => b.value === btn.dataset.add);
    btn.classList.toggle('is-added', on);
    btn.querySelector('[data-label]')!.textContent = on ? btn.dataset.labelAdded! : btn.dataset.labelAdd!;
  });
}

function announce(template: string, name: string) {
  const live = document.querySelector('[data-selection-live]');
  if (live) live.textContent = template.replace('{name}', name);
}

/** Card links become toggles, so a buyer can collect several models without leaving the range. */
function initSelection(f: HTMLFormElement) {
  document.querySelectorAll<HTMLAnchorElement>('a[data-add]').forEach((a) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = a.className;
    Object.assign(btn.dataset, a.dataset);
    const label = document.createElement('span');
    label.dataset.label = '';
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = `: ${a.dataset.name}`;
    btn.append(label, hint);
    a.replaceWith(btn);
    btn.addEventListener('click', () => {
      const box = f.querySelector<HTMLInputElement>(`input[name="products"][value="${CSS.escape(btn.dataset.add!)}"]`);
      if (!box) return;
      box.checked = !box.checked;
      syncSelection();
      announce(box.checked ? f.dataset.added! : f.dataset.removed!, btn.dataset.name!);
    });
  });
  f.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'products') syncSelection();
  });
  f.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLButtonElement>('[data-remove-product]');
    if (!chip) return;
    const box = boxes().find((b) => b.value === chip.dataset.removeProduct);
    if (!box) return;
    box.checked = false;
    syncSelection();
    announce(f.dataset.removed!, nameOf(box));
  });
  /* Browsers restore checkboxes on reload and back navigation. */
  syncSelection();
  window.addEventListener('pageshow', syncSelection);
}

function setError(f: HTMLFormElement, slot: HTMLElement, code: string | undefined, messages: Record<string, string>) {
  slot.textContent = code ? messages[code] ?? messages.invalid : '';
  slot.hidden = !code;
  const input = f.elements.namedItem(slot.dataset.errorFor!);
  if (input instanceof HTMLElement) code ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid');
}

function showErrors(f: HTMLFormElement, errors: Record<string, string>, messages: Record<string, string>) {
  const slots = [...f.querySelectorAll<HTMLElement>('[data-error-for]')];
  slots.forEach((slot) => setError(f, slot, errors[slot.dataset.errorFor!], messages));
  /* First in reading order, which is not the schema's order. */
  const first = slots.find((slot) => errors[slot.dataset.errorFor!])?.dataset.errorFor;
  const target = first && f.elements.namedItem(first);
  if (target instanceof HTMLElement) {
    const fold = target.closest('details');
    if (fold) fold.open = true;
    target.focus();
  }
}

/** Solves the proof-of-work challenge once, in the background, as soon as someone starts on the form. */
function initCaptcha(f: HTMLFormElement) {
  const box = f.querySelector<HTMLElement>('[data-captcha]')!;
  const status = box.querySelector<HTMLElement>('[data-captcha-status]')!;
  const retry = box.querySelector<HTMLButtonElement>('[data-captcha-retry]')!;
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
  retry.addEventListener('click', () => { start().catch(() => {}); });
  return {
    ready: start,
    /** A token can expire or be used up; the server then asks for a fresh one. */
    renew: () => { work = null; field.value = ''; return start(); },
  };
}

export function initRfq() {
  if (!form) return;
  const f = form;
  const messages: Record<string, string> = JSON.parse(f.dataset.errors!);
  const status = f.querySelector<HTMLElement>('[data-form-status]')!;
  const button = f.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const say = (text: string) => { status.textContent = text; status.hidden = !text; };

  (f.elements.namedItem('ts') as HTMLInputElement).value = String(Date.now());
  f.noValidate = true;
  initSelection(f);
  const captcha = initCaptcha(f);
  applyPrefill(new URLSearchParams(location.search));

  /* Inline validation: flag a filled field on leaving it, and clear an error as soon as it is fixed. */
  const recheck = (el: EventTarget | null) => {
    const name = (el as HTMLInputElement | null)?.name;
    const slot = name ? f.querySelector<HTMLElement>(`[data-error-for="${name}"]`) : null;
    if (!slot) return;
    const { ts: _t, website: _w, ...fields } = fromFormData(new FormData(f));
    const check = validateRfq(fields);
    setError(f, slot, check.ok ? undefined : check.errors[name!], messages);
    if (!f.querySelector('[aria-invalid="true"]')) say('');
  };
  const isInvalid = (el: EventTarget | null) => (el as Element | null)?.getAttribute?.('aria-invalid') === 'true';
  f.addEventListener('focusout', (e) => { if ((e.target as HTMLInputElement).value && (e.target as HTMLInputElement).type !== 'checkbox') recheck(e.target); });
  f.addEventListener('input', (e) => { if (isInvalid(e.target)) recheck(e.target); });
  f.addEventListener('change', (e) => { if (isInvalid(e.target)) recheck(e.target); });

  let started = false;
  f.addEventListener('focusin', () => { if (!started) { started = true; track('rfq_start'); } });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { ts: _t, website: _w, captcha: _c, ...fields } = fromFormData(new FormData(f));
    const check = validateRfq(fields);
    if (!check.ok) {
      say(f.dataset.summary!);
      showErrors(f, check.errors, messages);
      return;
    }
    showErrors(f, {}, messages);
    say('');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = f.dataset.sending!;
    try {
      const send = async () => {
        const res = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { accept: 'application/json' } });
        return await res.json() as { ok: boolean; redirect?: string; errors?: Record<string, string> };
      };
      await captcha.ready();
      let json = await send();
      if (json.errors?.captcha) {
        await captcha.renew();
        json = await send();
      }
      if (json.ok && json.redirect) {
        track('rfq_submit');
        location.assign(json.redirect);
        return;
      }
      say(json.errors ? f.dataset.summary! : f.dataset.sendError!);
      if (json.errors) showErrors(f, json.errors, messages);
    } catch {
      say(f.dataset.sendError!);
    }
    button.disabled = false;
    button.textContent = label;
  });
}
