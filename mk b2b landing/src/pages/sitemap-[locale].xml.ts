import type { APIContext } from 'astro';
import type { Locale } from '../i18n/locales.ts';
import { localizedPath } from '../i18n/routes.ts';
import { absolute, alternates, getContent, isIndexable, pageKeys, publishedLocales } from '../lib/content.ts';

export const getStaticPaths = () => publishedLocales.map((locale) => ({ params: { locale } }));

export const GET = ({ params }: APIContext) => {
  const locale = params.locale as Locale;
  const lastmod = getContent(locale).landing.meta.lastUpdated;
  const urls = pageKeys.filter(isIndexable).map((page) => {
    const links = alternates(page, locale).map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('\n');
    return `  <url>\n    <loc>${absolute(localizedPath(page, locale))}</loc>\n    <lastmod>${lastmod}</lastmod>\n${links}\n  </url>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'content-type': 'application/xml' } },
  );
};
