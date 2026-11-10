import { locales, defaultLocale, type Locale } from './locales.ts';

/** Route map (SPEC §5A.2). Components never hard-code paths: they call localizedPath(). */
export const routes = {
  tables: { de: 'tische', en: 'tables', nl: 'tafels', pl: 'stoly', fr: 'tables', cs: 'stoly' },
  chairs: { de: 'stuehle', en: 'chairs', nl: 'stoelen', pl: 'krzesla', fr: 'chaises', cs: 'zidle' },
  thanks: { de: 'danke', en: 'thank-you', nl: 'bedankt', pl: 'dziekujemy', fr: 'merci', cs: 'dekujeme' },
  imprint: { de: 'impressum', en: 'imprint', nl: 'bedrijfsgegevens', pl: 'dane-firmy', fr: 'mentions-legales', cs: 'provozovatel' },
  privacy: { de: 'datenschutz', en: 'privacy', nl: 'privacy', pl: 'polityka-prywatnosci', fr: 'confidentialite', cs: 'ochrana-osobnich-udaju' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = 'home' | keyof typeof routes;

export function localizedPath(key: RouteKey, locale: Locale): string {
  const prefix = locales[locale].prefix;
  return key === 'home' ? `${prefix}/` : `${prefix}/${routes[key][locale]}/`;
}

export const homePath = (locale: Locale = defaultLocale) => localizedPath('home', locale);
