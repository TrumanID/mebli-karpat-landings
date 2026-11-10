import { locales, type Locale } from '../i18n/locales.ts';
import { site } from './site.ts';
import { absolute } from './content.ts';
import { hasTodo } from './stage.ts';

const orgId = `${site.url}/#org`;
const siteId = `${site.url}/#website`;

export function baseGraph(opts: { locale: Locale; path: string; title: string; description: string; orgDescription: string; knowsAbout: string[]; crumbs: Array<{ name: string; path: string }> }) {
  const inLanguage = locales[opts.locale].htmlLang;
  const url = absolute(opts.path);
  return [
    {
      '@type': 'Organization', '@id': orgId, name: site.name, alternateName: site.alternateName, url: `${site.url}/`,
      logo: `${site.url}/img/logo.png`, foundingDate: site.foundingDate, description: opts.orgDescription,
      address: { '@type': 'PostalAddress', streetAddress: 'Kn. Olhy St. 95', addressLocality: 'Lviv', addressCountry: 'UA' },
      contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: site.email, telephone: site.phone, areaServed: ['DE', 'AT', 'CH'] }],
      sameAs: site.social.map((s) => s.href), knowsAbout: opts.knowsAbout,
    },
    { '@type': 'WebSite', '@id': siteId, url: `${site.url}/`, name: site.name, inLanguage, publisher: { '@id': orgId } },
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: opts.title, description: opts.description, inLanguage, isPartOf: { '@id': siteId }, about: { '@id': orgId } },
    {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`,
      itemListElement: opts.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absolute(c.path) })),
    },
  ];
}

export const servicesGraph = (names: string[], path: string) => names.map((name, i) => ({
  '@type': 'Service', '@id': `${absolute(path)}#service-${i + 1}`, name, serviceType: name, provider: { '@id': orgId }, areaServed: 'DE',
}));

export const itemListGraph = (path: string, items: Array<{ slug: string; name: string }>) => ({
  '@type': 'ItemList', '@id': `${absolute(path)}#range`, numberOfItems: items.length,
  itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `${absolute(path)}#product-${p.slug}` })),
});

/** Only finished answers go into markup: marked-up facts must match what a reader can rely on (SPEC §10.3). */
export const faqGraph = (locale: Locale, path: string, faq: Array<{ q: string; a: string }>) => ({
  '@type': 'FAQPage', '@id': `${absolute(path)}#faq`, inLanguage: locales[locale].htmlLang,
  mainEntity: faq.filter((f) => !hasTodo(f.a)).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const serialize = (graph: object[]) => JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
