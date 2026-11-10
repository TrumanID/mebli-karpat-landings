import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://b2b.meblikarpat.com.ua',
  trailingSlash: 'always',
  // No inline JS or CSS, so the CSP in public/_headers stays strict (SPEC §13).
  build: { format: 'directory', inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
