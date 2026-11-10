import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const paths = { de: '/', en: '/en/' };

async function fillRequired(page: Page) {
  await page.fill('#rfq-name', 'Erika Muster');
  await page.fill('#rfq-company', 'Muster GmbH');
  await page.fill('#rfq-email', 'erika@example.com');
  await page.fill('#rfq-country', 'DE 10115');
  await page.selectOption('#rfq-segment', 'gastro');
  await page.check('input[name="business"]');
  await page.check('input[name="consent"]');
}

test('all sections, one h1, 36 products in the HTML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  for (const id of ['range', 'segments', 'services', 'material', 'quality', 'process', 'projects', 'terms', 'faq', 'rfq']) {
    await expect(page.locator(`section#${id} h2`)).toHaveCount(1);
  }
  await expect(page.locator('[data-card]')).toHaveCount(36);
  await expect(page.locator('#faq details')).toHaveCount(14);
});

test('no third-party requests and no CSP violations, in either locale', async ({ page, baseURL }) => {
  const external: string[] = [];
  const violations: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) external.push(r.url()); });
  page.on('console', (m) => { if (/Content Security Policy|Refused/.test(m.text())) violations.push(m.text()); });
  for (const p of Object.values(paths)) await page.goto(p, { waitUntil: 'networkidle' });
  expect(external).toEqual([]);
  expect(violations).toEqual([]);
});

test('nothing is stored in cookies or local storage', async ({ page, context }) => {
  await page.goto('/');
  await page.click('[data-group="wood"][data-value="oak"]');
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test.describe('axe', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  for (const path of ['/', '/en/', '/impressum/', '/datenschutz/', '/danke/', '/en/thank-you/']) {
    for (const width of [360, 1280]) {
      test(`${path} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        // Language lists overlay what is behind them while open; they get their own audit below.
        await page.locator('details:not(.lang-menu)').evaluateAll((all) => all.forEach((d) => { (d as HTMLDetailsElement).open = true; }));
        // Audit the resting state: axe would otherwise read fades mid-way, and flag whatever the sticky bars cover at its scroll position.
        // Focus under those bars has its own test below.
        // Wait for a settled layout: fonts swapping in during the audit move targets and produce false overlaps.
        await page.evaluate(async () => {
          await document.fonts.ready;
          let last = -1;
          while (last !== document.documentElement.scrollHeight) {
            last = document.documentElement.scrollHeight;
            await new Promise((r) => setTimeout(r, 150));
          }
        });
        await page.locator('.site-header, .mobile-bar, .range-jump').evaluateAll((all) => all.forEach((el) => { (el as HTMLElement).style.position = 'static'; }));
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        expect(violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target).join(' ; ')}`)).toEqual([]);
      });
    }
  }
});

for (const [name, path] of Object.entries(paths)) {
  for (const width of [360, 640, 768, 1024, 1280, 1536]) {
    test(`${name}: no horizontal scroll at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  }
  test(`${name}: h1 words fit at 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    const fits = await page.locator('h1').evaluate((h) => h.scrollWidth <= h.clientWidth);
    expect(fits).toBe(true);
  });
}

test('filters narrow the grid, combine, and reset', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('[data-range-block]').first();
  const visible = block.locator('[data-card]:visible');
  await expect(visible).toHaveCount(8); // the long list starts short
  await expect(block.locator('[data-count]')).toHaveText('15 Modelle');
  await block.locator('[data-value="round"]').click();
  await expect(visible).toHaveCount(3); // barny-round, fabio, verke-round
  await expect(block.locator('[data-count]')).toContainText('Modelle');
  await block.locator('[data-value="beech"]').click();
  await expect(visible).toHaveCount(1);
  await expect(block.locator('[data-count]')).toHaveText('1 Modell');
  await block.locator('[data-reset]').click();
  await expect(visible).toHaveCount(8);
  await block.locator('[data-show-all]').click();
  await expect(visible).toHaveCount(15);
  await expect(block.locator('[data-show-all]')).toBeHidden();
  await expect(visible.nth(8).locator('button')).toBeFocused();
});

test('tables and chairs switch in place; deep links open the right block', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#range-chairs')).toBeHidden();
  await page.locator('[data-range-jump] a[href="#range-chairs"]').click();
  await expect(page.locator('#range-chairs')).toBeVisible();
  await expect(page.locator('#range-tables')).toBeHidden();
  await expect(page.locator('[data-range-jump] a[href="#range-chairs"]')).toHaveAttribute('aria-current', 'true');
  await page.goto('/#product-vilnius');
  await expect(page.locator('#product-vilnius')).toBeVisible();
  await expect(page.locator('#product-vilnius')).toBeInViewport();
});

test('header nav marks the section being read', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('faq')!.scrollIntoView(); });
  await expect(page.locator('[data-section-nav] a[href$="#faq"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-section-nav] [aria-current]')).toHaveCount(1);
});

test('selected models stay in view on desktop and step aside at the form', async ({ page }) => {
  await page.goto('/');
  const dock = page.locator('[data-selection-dock]');
  await expect(dock).toBeHidden();
  await page.locator('#product-barny button[data-add]').click();
  await expect(dock).toBeVisible();
  await expect(dock.locator('[data-selection-badge]')).toHaveText('1');
  await dock.click();
  await expect(dock).toHaveClass(/is-away/);
});

test('segment and product links preselect the form without a reload', async ({ page }) => {
  await page.goto('/');
  await page.click('#segments a[href*="segment=oem"]');
  await expect(page.locator('#rfq-segment')).toHaveValue('oem');
});

test('header items stay on one line and inside the pill at every width', async ({ page }) => {
  for (const path of ['/', '/en/']) for (const width of [360, 640, 768, 1024, 1100, 1200, 1280, 1536]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(path);
    const result = await page.locator('.header-pill').evaluate((pill) => {
      const box = pill.getBoundingClientRect();
      const items = [...pill.querySelectorAll('a, summary')].filter((el) => (el as HTMLElement).offsetParent && !el.closest('.nav-sheet, .lang-panel'));
      return { outside: items.filter((el) => { const r = el.getBoundingClientRect(); return r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom; }).map((el) => el.textContent), tall: items.filter((el) => el.getBoundingClientRect().height > 52).map((el) => el.textContent) };
    });
    expect(result, `${path} at ${width}`).toEqual({ outside: [], tall: [] });
  }
});

test('keyboard focus is never hidden by the sticky header or phone bar', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const barTop = await page.locator('[data-mobile-bar]').evaluate((el) => el.getBoundingClientRect().top);
  const headerBottom = await page.locator('.header-pill').evaluate((el) => el.getBoundingClientRect().bottom);
  for (const sel of ['#product-bayden button[data-add]', '#product-barny button[data-add]', '#rfq-name', '#rfq-message', 'input[name="consent"]']) {
    await page.locator(sel).evaluate((el) => (el as HTMLElement).focus());
    await page.waitForTimeout(350);
    const box = await page.locator(sel).evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
    expect(box.top, `${sel} under the header`).toBeGreaterThanOrEqual(headerBottom);
    const away = await page.locator('[data-mobile-bar]').evaluate((el) => el.classList.contains('is-away'));
    if (!away) expect(box.bottom, `${sel} under the phone bar`).toBeLessThanOrEqual(barTop);
  }
});

test('with reduced motion nothing animates and all content is in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().duration !== 0.01).length);
  expect(running).toBe(0);
  for (const sel of ['.hero-rise', '[data-card]', '.tile', '.service']) {
    expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  }
  expect(await page.locator('.strip ul').evaluate((el) => getComputedStyle(el).translate)).toBe('none');
  expect(await page.locator('.faq-q').first().evaluate((el) => getComputedStyle(el, '::details-content').transitionProperty)).toBe('none');
  expect(await page.locator('.captcha-icon').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('scroll-linked motion really runs, and ends with content fully visible', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const running = (sel: string) => page.locator(sel).first().evaluate((el) => el.getAnimations().filter((a) => a.timeline?.constructor.name !== 'DocumentTimeline').length);
  for (const sel of ['.scroll-progress', '.tile', '[data-card]', '.service', '.strip ul', '.reveal']) expect(await running(sel), sel).toBe(1);

  const progress = () => page.locator('.scroll-progress').evaluate((el) => el.getBoundingClientRect().width);
  expect(await progress()).toBeLessThan(5);
  const tile = page.locator('.tile').first();
  expect(Number(await tile.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.05);

  const strip = () => page.locator('.strip ul').evaluate((el) => el.getBoundingClientRect().left);
  await page.locator('.strip').evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight));
  await page.waitForTimeout(200);
  const before = await strip();
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(200);
  expect(await strip()).toBeLessThan(before);

  await tile.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 200));
  await page.waitForTimeout(300);
  expect(await tile.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  expect(await progress()).toBeGreaterThan(5);
});

test('models can be collected from the range without leaving it', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const before = await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; return location.href; });
  await page.locator('#product-barny button[data-add]').click();
  await page.locator('[data-range-jump] a[href="#range-chairs"]').click();
  await page.locator('#range-chairs [data-show-all]').click();
  await page.locator('#product-milan button[data-add]').click();
  expect(page.url().split('#')[0]).toBe(before.split('#')[0]);
  await expect(page.locator('#product-milan button[data-add]')).toHaveClass(/is-added/);
  await expect(page.locator('input[name="products"][value="milan"]')).toBeChecked();
  await expect(page.locator('[data-mobile-bar] [data-selection-badge]')).toHaveText('2');
  await expect(page.locator('[data-selection-live]')).toContainText('Milan');
  await expect(page.locator('[data-selection-list] button')).toHaveCount(2);
  await page.locator('[data-remove-product="barny"]').click();
  await expect(page.locator('input[name="products"][value="barny"]')).not.toBeChecked();
  await expect(page.locator('#product-barny button[data-add]')).not.toHaveClass(/is-added/); // state survives the tab being hidden
  await expect(page.locator('[data-mobile-bar] [data-selection-badge]')).toHaveText('1');
});

test('phone cards stay compact in one column and filters start collapsed', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const cards = page.locator('#range-tables [data-card]');
  const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
  expect(b!.x).toBe(a!.x);
  expect(a!.height).toBeLessThan(300);
  const chip = page.locator('#range-tables [data-value="oak"]');
  await expect(chip).toBeHidden();
  await page.locator('#range-tables [data-filter-toggle]').click();
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.locator('#range-tables [data-filter-toggle]')).toContainText('(1)');
});

test('mobile menu closes on Escape and on an outside tap', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const link = page.locator('[data-mobile-nav] a').first();
  await page.click('[data-mobile-nav] summary');
  await expect(link).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(link).toBeHidden();
  await page.click('[data-mobile-nav] summary');
  await page.mouse.click(180, 790);
  await expect(link).toBeHidden();
});

test('deep link preselects, canonical ignores the parameter', async ({ page }) => {
  await page.goto('/en/?segment=trade&product=frankfurt#rfq');
  await expect(page.locator('#rfq-segment')).toHaveValue('trade');
  await expect(page.locator('input[value="frankfurt"]')).toBeChecked();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://b2b.meblikarpat.com.ua/en/');
});

test('client validation shows localised inline errors and moves focus', async ({ page }) => {
  await page.goto('/en/#rfq');
  await page.fill('#rfq-email', 'nope');
  await page.click('#rfq-form button[type="submit"]');
  await expect(page.locator('[data-form-status]')).toHaveText('Please check the marked fields.');
  await expect(page.locator('#err-email')).toHaveText('Please enter a valid email address.');
  await expect(page.locator('#rfq-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#rfq-segment')).toBeFocused(); // first invalid field in reading order
});

test('captcha solves itself in the background and the request carries it', async ({ page }) => {
  await page.goto('/en/#rfq');
  const box = page.locator('[data-captcha]');
  await expect(box).toBeVisible();
  await expect(box).not.toHaveAttribute('data-state', /./); // no work until someone starts
  await page.locator('#rfq-name').focus();
  await expect(box).toHaveAttribute('data-state', 'done', { timeout: 15000 });
  await expect(box.locator('[data-captcha-status]')).toHaveText('Checked. No cookies and no third parties.');
  const token = JSON.parse(await page.locator('input[name="captcha"]').inputValue());
  expect(Object.keys(token).sort()).toEqual(['challenge', 'number', 'salt', 'signature']);
});

test('if the captcha service fails, the form says so and can retry', async ({ page }) => {
  let down = true;
  await page.route('**/api/captcha', (route) => (down ? route.abort() : route.continue()));
  await page.goto('/#rfq');
  await fillRequired(page);
  await page.waitForTimeout(3100);
  await page.click('#rfq-form button[type="submit"]');
  await expect(page.locator('[data-captcha]')).toHaveAttribute('data-state', 'failed');
  await expect(page.locator('[data-form-status]')).toContainText('E-Mail');
  await expect(page.locator('#rfq-form button[type="submit"]')).toBeEnabled();
  down = false;
  await page.locator('[data-captcha-retry]').click();
  await expect(page.locator('[data-captcha]')).toHaveAttribute('data-state', 'done', { timeout: 15000 });
  await page.click('#rfq-form button[type="submit"]');
  await expect(page).toHaveURL(/\/danke\/$/);
});

test('an expired token is renewed without asking the visitor', async ({ page }) => {
  await page.goto('/#rfq');
  await fillRequired(page);
  await expect(page.locator('[data-captcha]')).toHaveAttribute('data-state', 'done', { timeout: 15000 });
  await page.locator('input[name="captcha"]').evaluate((el) => { (el as HTMLInputElement).value = '{"bad":true}'; });
  await page.waitForTimeout(3100);
  await page.click('#rfq-form button[type="submit"]');
  await expect(page).toHaveURL(/\/danke\/$/, { timeout: 15000 });
});

test('field errors clear once fixed; errors in the folded section open it', async ({ page }) => {
  await page.goto('/en/#rfq');
  await page.click('#rfq-form button[type="submit"]');
  await expect(page.locator('#err-name')).toBeVisible();
  await page.fill('#rfq-name', 'A Buyer');
  await expect(page.locator('#err-name')).toBeHidden();
  await page.fill('#rfq-email', 'nope');
  await page.locator('#rfq-company').focus();
  await expect(page.locator('#err-email')).toHaveText('Please enter a valid email address.');
  await page.fill('#rfq-email', 'a@example.com');
  await expect(page.locator('#err-email')).toBeHidden();
  await page.locator('details:has(#rfq-drawings) summary').click();
  await page.fill('#rfq-drawings', 'not a url');
  await page.locator('details:has(#rfq-drawings) summary').click();
  await page.fill('#rfq-name', 'A Buyer');
  await page.fill('#rfq-company', 'Co');
  await page.fill('#rfq-country', 'DE 10115');
  await page.selectOption('#rfq-segment', 'trade');
  await page.check('input[name="business"]');
  await page.check('input[name="consent"]');
  await page.click('#rfq-form button[type="submit"]');
  await expect(page.locator('#rfq-drawings')).toBeFocused();
});

test('form submits with JS and lands on the thank-you page', async ({ page }) => {
  await page.goto('/#rfq');
  await fillRequired(page);
  await page.waitForTimeout(3100); // time trap
  await page.click('#rfq-form button[type="submit"]');
  await expect(page).toHaveURL(/\/danke\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all content is present; filters stay hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-card]:visible')).toHaveCount(36);
    await expect(page.locator('[data-filters]').first()).toBeHidden();
    await expect(page.locator('[data-show-all]').first()).toBeHidden();
    await expect(page.locator('[data-captcha]')).toBeHidden();
  });

  test('form posts and redirects to the locale thank-you page', async ({ page }) => {
    await page.goto('/en/#rfq');
    await fillRequired(page);
    await page.fill('#rfq-captchaAnswer', '7');
    await page.click('#rfq-form button[type="submit"]');
    await expect(page).toHaveURL(/\/en\/thank-you\/$/);
  });

  test('a wrong answer to the security question is refused', async ({ page }) => {
    await page.goto('/en/#rfq');
    await fillRequired(page);
    await page.fill('#rfq-captchaAnswer', '9');
    await page.click('#rfq-form button[type="submit"]');
    await expect(page.locator('body')).toContainText('The security check did not succeed');
  });

  test('language dropdown works without JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.locator('header .lang-menu summary').click();
    await page.locator('header .lang-menu a[hreflang="en"]').click();
    await expect(page).toHaveURL(/\/en\/$/);
  });

  test('mobile menu opens with a native details element', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.click('[data-mobile-nav] summary');
    await expect(page.locator('[data-mobile-nav] a').first()).toBeVisible();
  });
});

test('sticky bar leaves the form area on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const bar = page.locator('[data-mobile-bar]');
  await expect(bar).toBeVisible();
  await page.locator('#rfq-name').scrollIntoViewIfNeeded();
  await expect(bar).toHaveClass(/is-away/);
});

test('language switcher links to the same page in the other locale', async ({ page }) => {
  await page.goto('/impressum/');
  const en = page.locator('header a[hreflang="en"]').first();
  await expect(en).toHaveAttribute('href', '/en/imprint/');
  await expect(page.locator('header a[hreflang="de"]').first()).toHaveAttribute('aria-current', 'true');
});

test('language dropdown shows two-letter codes, lists every language and switches', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('header .lang-menu');
  const summary = menu.locator('summary');
  await expect(summary.locator('span').first()).toHaveText('DE');
  const en = menu.locator('a[hreflang="en"]');
  await expect(en).toBeHidden();
  await summary.click();
  await expect(en).toBeVisible();
  await expect(menu.locator('a')).toHaveCount(2);
  await expect(menu.locator('a[hreflang="de"]')).toHaveAttribute('aria-current', 'true');
  await en.click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('header .lang-menu summary span').first()).toHaveText('EN');
});

test('language dropdown closes on Escape and outside clicks, and fits on phones', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/impressum/');
  const summary = page.locator('header .lang-menu summary');
  const en = page.locator('header .lang-menu a[hreflang="en"]');
  await summary.click();
  await expect(en).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(en).toBeHidden();
  await expect(summary).toBeFocused();
  await summary.click();
  await page.mouse.click(180, 500);
  await expect(en).toBeHidden();
  await summary.click();
  await page.locator('[data-mobile-nav] summary').click();
  await expect(en).toBeHidden(); // opening the menu closes the language list
  await expect(page.locator('[data-mobile-nav] a').first()).toBeVisible();
});

test('open language dropdowns pass axe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    for (const scope of ['header .lang-menu', 'footer .lang-menu']) {
      await page.locator(`${scope} summary`).click();
      const { violations } = await new AxeBuilder({ page }).include(scope).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      expect(violations.map((v) => `${scope} at ${width}: ${v.id}: ${v.nodes.map((n) => n.target).join(' ; ')}`)).toEqual([]);
      await page.keyboard.press('Escape');
    }
  }
});

test('footer language dropdown opens fully on screen', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('footer .lang-menu');
  await menu.locator('summary').scrollIntoViewIfNeeded();
  await menu.locator('summary').click();
  await expect(menu.locator('a[hreflang="en"]')).toBeInViewport({ ratio: 1 });
});

test('head metadata: canonical, reciprocal hreflang, og:locale', async ({ page }) => {
  await page.goto('/');
  const href = (lang: string) => page.locator(`link[hreflang="${lang}"]`).getAttribute('href');
  expect(await href('de')).toBe('https://b2b.meblikarpat.com.ua/');
  expect(await href('en')).toBe('https://b2b.meblikarpat.com.ua/en/');
  expect(await href('x-default')).toBe('https://b2b.meblikarpat.com.ua/');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'de_DE');
  await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveAttribute('content', 'en_GB');
});
