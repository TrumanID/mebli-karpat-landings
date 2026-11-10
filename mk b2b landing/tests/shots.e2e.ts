import { test } from '@playwright/test';
const sizes = [360, 768, 1024, 1440];
for (const [name, path] of [['de', '/'], ['en', '/en/']] as const) for (const w of sizes) {
  test(`screenshot ${name} ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(path);
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { (i as HTMLImageElement).loading = 'eager'; });
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    });
    await page.screenshot({ path: `docs/qa/${name}-${w}.jpg`, fullPage: true, type: 'jpeg', quality: 60 });
    await page.screenshot({ path: `docs/qa/${name}-${w}-fold.jpg`, type: 'jpeg', quality: 70 });
  });
}
