import { locales, localeCodes, liveLocales, defaultLocale, type Locale } from '../i18n/locales.ts';
import { localizedPath, type RouteKey } from '../i18n/routes.ts';
import { site } from './site.ts';
import type deLanding from '../content/landing/de.json';
import type deUi from '../i18n/ui/de.json';
import type deLegal from '../content/legal/de.json';

const byLocale = <T,>(mods: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(mods).map(([p, m]) => [p.match(/([a-z-]+)\.json$/)![1], (m as { default: T }).default])) as Partial<Record<Locale, T>>;

const landing = byLocale<typeof deLanding>(import.meta.glob('../content/landing/*.json', { eager: true }));
const faq = byLocale<Array<{ q: string; a: string }>>(import.meta.glob('../content/faq/*.json', { eager: true }));
const legal = byLocale<typeof deLegal>(import.meta.glob('../content/legal/*.json', { eager: true }));
const ui = byLocale<typeof deUi>(import.meta.glob('../i18n/ui/*.json', { eager: true }));

/** A page is never served in another language's text: no content, no build (SPEC §5A.5). */
export const builtLocales = localeCodes.filter((l) => {
  const status: string = locales[l].status;
  return status !== 'off' && landing[l] && faq[l] && legal[l] && ui[l];
});
export const publishedLocales = liveLocales.filter((l) => builtLocales.includes(l));

export const getContent = (l: Locale) => ({ landing: landing[l]!, faq: faq[l]!, legal: legal[l]!, ui: ui[l]! });

export const pageKeys = ['home', 'thanks', 'imprint', 'privacy'] as const satisfies readonly RouteKey[];
export type PageKey = (typeof pageKeys)[number];
export const isIndexable = (p: PageKey) => p !== 'thanks';

export const absolute = (path: string) => site.url + path;
const isLive = (l: Locale) => (publishedLocales as readonly Locale[]).includes(l);

/** hreflang alternates (SPEC §5A.3): live locales only, plus x-default. Drafts list none. */
export function alternates(page: PageKey, locale: Locale) {
  if (!isLive(locale) || !isIndexable(page)) return [];
  return [
    ...publishedLocales.map((l) => ({ hreflang: locales[l].htmlLang as string, href: absolute(localizedPath(page, l)) })),
    { hreflang: 'x-default', href: absolute(localizedPath(page, defaultLocale)) },
  ];
}

export const format = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
