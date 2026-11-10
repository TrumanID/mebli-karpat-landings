import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

async function ready(page: Page, path = '/') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

for (const [name, width, height] of [['small phone', 320, 640], ['phone', 360, 780], ['tablet', 768, 1024], ['desktop', 1440, 900]] as const) {
  test(`${name}: no horizontal scroll, no errors, passes axe`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await axe(page);
    await page.locator('[data-card="lounge"] [data-add]').click();
    await page.locator('.faq details').first().locator('summary').click();
    await axe(page);
    expect(errors).toEqual([]);
  });
}

test('shows 3 chairs and 3 tables with old and new prices', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#chairs [data-card]')).toHaveCount(3);
  await expect(page.locator('#tables [data-card]')).toHaveCount(3);
  for (const card of await page.locator('[data-card]').all()) {
    await expect(card.locator('.price-now')).toContainText('₴');
    await expect(card.locator('.price-was s')).toContainText('₴');
    await expect(card.locator('.badge-sale')).toContainText('%');
  }
  await expect(page.locator('h1')).toContainText('Купуйте в Чорну п’ятницю');
  await expect(page.locator('h1')).toContainText('Користуйтеся на Різдво');
});

test('choosing models updates the summary, badge and pick list', async ({ page }) => {
  await ready(page);
  const sydney = page.locator('[data-card="sydney"]');
  const price = Number(await sydney.getAttribute('data-price'));
  const regular = Number(await sydney.getAttribute('data-regular'));
  await sydney.locator('[data-add]').click();
  await expect(sydney).toHaveClass(/is-picked/);
  await expect(sydney.locator('input')).toBeFocused();
  await sydney.locator('[data-step="1"]').click();
  await sydney.locator('[data-step="1"]').click();
  await expect(sydney.locator('input')).toHaveValue('3');
  const fmt = (n: number) => `${new Intl.NumberFormat('uk-UA').format(n).replace(/ /g, ' ')} ₴`;
  await expect(page.locator('[data-sum-total]')).toHaveText(fmt(3 * price));
  await expect(page.locator('[data-sum-saving]')).toHaveText(fmt(3 * (regular - price)));
  await expect(page.locator('[data-count-badge]')).toHaveText('3');
  await expect(page.locator('[data-pick-list] li')).toHaveCount(1);

  // Typing works too, and the pick list controls the same quantity.
  await sydney.locator('input').fill('7');
  await expect(page.locator('[data-sum-count]')).toHaveText('7 шт.');
  await page.locator('[data-pick-list] [data-step="-1"]').click();
  await expect(sydney.locator('input')).toHaveValue('6');

  // Down to zero brings back "Add" and focuses it.
  await sydney.locator('input').fill('1');
  await sydney.locator('[data-step="-1"]').click();
  await expect(sydney.locator('[data-add]')).toBeFocused();
  await expect(page.locator('[data-pick-empty]')).toBeVisible();
  await expect(page.locator('[data-count-badge]')).toBeHidden();
});

test('table "from" prices are labelled as such in the summary', async ({ page }) => {
  await ready(page);
  await page.locator('[data-card="gdansk"] [data-add]').click();
  await expect(page.locator('[data-sum-total]')).toContainText('від');
  await expect(page.locator('[data-sum-from]')).toBeVisible();
});

test('empty form shows errors and focuses the first problem', async ({ page }) => {
  await ready(page);
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-error-for="items"]')).toBeVisible();
  await expect(page.locator('[data-error-for="name"]')).toBeVisible();
  await expect(page.locator('[data-error-for="consent"]')).toBeVisible();
  await expect(page.locator('[data-pick-empty] a').first()).toBeFocused();
  await page.locator('[data-card="fabio"] [data-add]').click();
  await expect(page.locator('[data-error-for="items"]')).toBeHidden();
  await page.locator('[data-submit]').click();
  await expect(page.locator('#f-name')).toBeFocused();
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
});

test('full order: pick, fill, captcha, send, thank-you page with reference', async ({ page }) => {
  await ready(page);
  await page.locator('[data-card="forte-01"] [data-add]').click();
  await page.locator('[data-card="forte-01"] [data-step="1"]').click();
  await page.locator('[data-card="grand"] [data-add]').click();
  await page.fill('#f-name', 'Олена Тест');
  await page.fill('#f-phone', '+380 67 123 45 67');
  await page.fill('#f-email', 'olena@example.com');
  await page.fill('#f-city', 'Львів');
  await page.locator('label.choice', { hasText: 'Службою доставки' }).click();
  await page.fill('#f-comment', 'Сіра тканина');
  await page.locator('input[name="consent"]').check();
  await expect(page.locator('[data-captcha]')).toHaveAttribute('data-state', 'done', { timeout: 20_000 });
  await page.waitForTimeout(3000); // the server ignores forms filled faster than a human could
  await page.locator('[data-submit]').click();
  await expect(page).toHaveURL(/\/dyakuyemo\/\?ref=BF-\d{8}-[A-F0-9]{6}$/);
  await expect(page.locator('[data-ref]')).toBeVisible();
  await expect(page.locator('h1')).toContainText('Дякуємо');
  await axe(page);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('quantities and the form still work and reach the server', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-card="sydney"] input')).toBeVisible();
    await expect(page.locator('[data-card="sydney"] [data-add]')).toBeHidden();
    await page.locator('[data-card="sydney"] input').fill('2');
    await page.fill('#f-name', 'Олена');
    await page.fill('#f-phone', '+380671234567');
    await page.fill('#f-city', 'Львів');
    await page.locator('input[name="consent"]').check();
    await page.fill('#f-captcha', '7');
    await page.waitForTimeout(3000);
    await page.locator('[data-submit]').click();
    await expect(page).toHaveURL(/\/dyakuyemo\//);
  });
});

test('sticky bar appears after picking, hides at the form', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const bar = page.locator('[data-cart-bar]');
  await expect(bar).toBeHidden();
  await page.locator('[data-card="sydney"] [data-add]').click();
  await expect(bar).toBeVisible();
  await expect(bar).not.toHaveClass(/is-away/);
  await page.locator('#order-h').scrollIntoViewIfNeeded();
  await expect(bar).toHaveClass(/is-away/);
});

test('privacy page and 404 render', async ({ page }) => {
  await ready(page, '/privacy/');
  await expect(page.locator('h1')).toHaveText('Політика конфіденційності');
  await axe(page);
  const res = await page.goto('/nope/');
  expect(res?.status()).toBe(404);
});

test('screenshots for review', async ({ page }) => {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await ready(page);
    await page.locator('[data-card="sydney"] [data-add]').click();
    await page.locator('[data-card="grand"] [data-add]').click();
    await page.screenshot({ path: `docs/qa/landing-${w}.png`, fullPage: true });
  }
});
