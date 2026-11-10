import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://meblikarpat.com.ua',
  trailingSlash: 'always',
  // No inline JS or CSS, so the CSP in public/_headers stays strict.
  build: { format: 'directory', inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
