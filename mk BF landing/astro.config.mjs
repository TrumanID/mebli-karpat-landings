import { defineConfig } from 'astro/config';

export default defineConfig({
  // Absolute URL of the published page (canonical and og:image). Set SITE_URL at build time until the final address is chosen.
  site: process.env.SITE_URL ?? 'https://meblikarpat.com.ua',
  trailingSlash: 'always',
  // No inline JS or CSS, so the CSP in public/_headers stays strict.
  build: { format: 'directory', inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
