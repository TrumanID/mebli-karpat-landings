import { publishedLocales } from '../lib/content.ts';
import { site } from '../lib/site.ts';

export const GET = () => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publishedLocales.map((l) => `  <sitemap><loc>${site.url}/sitemap-${l}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`,
  { headers: { 'content-type': 'application/xml' } },
);
