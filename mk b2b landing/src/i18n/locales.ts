/** Single source of truth for languages (SPEC §5A.1). */
export const locales = {
  de: { label: 'Deutsch', htmlLang: 'de', ogLocale: 'de_DE', prefix: '', status: 'live', coverage: 'full', source: true },
  en: { label: 'English', htmlLang: 'en', ogLocale: 'en_GB', prefix: '/en', status: 'live', coverage: 'full' },
  nl: { label: 'Nederlands', htmlLang: 'nl', ogLocale: 'nl_NL', prefix: '/nl', status: 'draft', coverage: 'core' },
  pl: { label: 'Polski', htmlLang: 'pl', ogLocale: 'pl_PL', prefix: '/pl', status: 'draft', coverage: 'core' },
  fr: { label: 'Français', htmlLang: 'fr', ogLocale: 'fr_FR', prefix: '/fr', status: 'draft', coverage: 'core' },
  cs: { label: 'Čeština', htmlLang: 'cs', ogLocale: 'cs_CZ', prefix: '/cs', status: 'draft', coverage: 'core' },
} as const;

export type Locale = keyof typeof locales;
export const defaultLocale: Locale = 'de';
export const localeCodes = Object.keys(locales) as Locale[];
const statusOf = (l: Locale): string => locales[l].status;
export const liveLocales = localeCodes.filter((l) => statusOf(l) === 'live');
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && v in locales;

/** One config flag flips AI training bots to Disallow in robots.txt (D6). */
export const ai = { allowTraining: true };
