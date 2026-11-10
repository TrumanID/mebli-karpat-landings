import { track } from './analytics.ts';
import { initRfq, applyPrefill } from './rfq.ts';

const CARD_LIMIT = 8;

/* Filters: AND across groups, OR within a group (progressive enhancement). */
document.querySelectorAll<HTMLElement>('[data-range-block]').forEach((block) => {
  const bar = block.querySelector<HTMLElement>('[data-filters]');
  if (!bar) return;
  bar.hidden = false;
  const chips = [...bar.querySelectorAll<HTMLButtonElement>('button[data-group]')];
  const cards = [...block.querySelectorAll<HTMLElement>('[data-card]')];
  const count = bar.querySelector<HTMLElement>('[data-count]')!;
  const reset = bar.querySelector<HTMLButtonElement>('[data-reset]')!;
  const none = block.querySelector<HTMLElement>('[data-none]')!;
  const grid = block.querySelector<HTMLElement>('[data-grid]')!;
  const rules = new Intl.PluralRules(document.documentElement.lang);
  const toggle = bar.querySelector<HTMLButtonElement>('[data-filter-toggle]')!;
  const activeLabel = toggle.querySelector<HTMLElement>('[data-active]')!;
  toggle.addEventListener('click', () => {
    const open = bar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  const showAll = block.querySelector<HTMLButtonElement>('[data-show-all]')!;
  const showAllWrap = block.querySelector<HTMLElement>('[data-show-all-wrap]')!;
  let expanded = cards.length <= CARD_LIMIT;

  const update = () => {
    const active: Record<string, string[]> = {};
    for (const c of chips) if (c.getAttribute('aria-pressed') === 'true') (active[c.dataset.group!] ??= []).push(c.dataset.value!);
    const filtering = Object.keys(active).length > 0;
    let visible = 0;
    for (const card of cards) {
      const match = Object.entries(active).every(([group, values]) => {
        const own = (card.dataset[group] ?? '').split(' ');
        return values.some((v) => own.includes(v));
      });
      /* With a filter on, every match shows; otherwise the long list starts short. */
      card.hidden = !match || (!expanded && !filtering && cards.indexOf(card) >= CARD_LIMIT);
      if (match) visible++;
    }
    showAllWrap.hidden = expanded || filtering;
    const tpl = rules.select(visible) === 'one' ? bar.dataset.one! : bar.dataset.other!;
    count.textContent = tpl.replace('{count}', String(visible));
    const activeCount = Object.values(active).flat().length;
    activeLabel.textContent = activeCount ? ` (${activeCount})` : '';
    reset.hidden = activeCount === 0;
    none.hidden = visible > 0;
    grid.hidden = visible === 0;
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    update();
  }));
  reset.addEventListener('click', () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    update();
    (chips[0]?.offsetParent ? chips[0] : toggle).focus();
  });
  showAll.addEventListener('click', () => {
    expanded = true;
    update();
    cards[CARD_LIMIT]?.querySelector<HTMLElement>('a, button')?.focus();
  });
  block.addEventListener('range:expand', () => { expanded = true; update(); });
  update();
});

/* Without JS both blocks stay on the page and these are plain anchors. With JS they switch between the blocks. */
const tabs = [...document.querySelectorAll<HTMLAnchorElement>('[data-range-jump] a')];
const blocks = [...document.querySelectorAll<HTMLElement>('[data-range-block]')];
const showBlock = (id: string) => {
  blocks.forEach((b) => { b.hidden = b.id !== id; });
  tabs.forEach((a) => (a.hash === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
};
if (tabs.length && blocks.length) {
  document.getElementById('range')?.classList.add('has-tabs');
  const applyHash = () => {
    const product = location.hash.startsWith('#product-') ? document.querySelector<HTMLElement>(location.hash.replace(/[^#\w-]/g, '')) : null;
    const owner = product?.closest<HTMLElement>('[data-range-block]');
    const asked = blocks.find((b) => `#${b.id}` === location.hash);
    const current = blocks.find((b) => !b.hidden && blocks.some((o) => o.hidden));
    showBlock(owner?.id ?? asked?.id ?? current?.id ?? blocks[0]!.id);
    if (owner && product) {
      owner.dispatchEvent(new Event('range:expand'));
      product.scrollIntoView();
    } else if (asked) {
      asked.scrollIntoView();
    }
  };
  applyHash();
  window.addEventListener('hashchange', applyHash);
  tabs.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.hash.slice(1);
    showBlock(id);
    history.replaceState(null, '', a.hash);
    const block = document.getElementById(id);
    /* Only scroll back if the switch would otherwise land mid-list. */
    if (block && block.getBoundingClientRect().top < 0) block.scrollIntoView();
  }));
}

/* Header nav shows the section being read. */
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-section-nav] a')];
if (navLinks.length) {
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    navLinks.forEach((a) => (a.hash === `#${en.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  }), { rootMargin: '-45% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach((sec) => spy.observe(sec));
}

/* Same-page prefill links: keep the scroll position logic simple and avoid a full reload. */
document.querySelectorAll<HTMLAnchorElement>('a[data-prefill]').forEach((a) => a.addEventListener('click', (e) => {
  if (!document.querySelector('[data-rfq]')) return;
  e.preventDefault();
  const url = new URL(a.href);
  applyPrefill(url.searchParams);
  history.pushState(null, '', url.pathname + url.search + url.hash);
  document.getElementById('rfq')?.scrollIntoView();
}));

/* Close the mobile menu after choosing an anchor. */
document.querySelectorAll<HTMLDetailsElement>('[data-mobile-nav]').forEach((d) => d.addEventListener('click', (e) => {
  if ((e.target as Element).closest('a')) d.open = false;
}));

/* The menu and the language list also close on Escape or a tap outside them. */
const closeNav = (d: HTMLDetailsElement) => { d.open = false; };
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll<HTMLDetailsElement>('[data-dropdown][open]').forEach((d) => { closeNav(d); d.querySelector('summary')?.focus(); });
});
document.addEventListener('click', (e) => {
  document.querySelectorAll<HTMLDetailsElement>('[data-dropdown][open]').forEach((d) => { if (!d.contains(e.target as Node)) closeNav(d); });
});

/* Sticky bar steps aside while the form is on screen, so it never covers a field. */
const bar = document.querySelector<HTMLElement>('[data-mobile-bar]');
const rfq = document.getElementById('rfq');
if (rfq) {
  let seen = false;
  new IntersectionObserver(([entry]) => {
    bar?.classList.toggle('is-away', entry.isIntersecting);
    document.querySelector('[data-selection-dock]')?.classList.toggle('is-away', entry.isIntersecting);
    if (entry.isIntersecting && !seen) { seen = true; track('rfq_view'); }
  }).observe(rfq);
}

document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-event]');
  if (el) track(el.dataset.event!);
});

initRfq();
