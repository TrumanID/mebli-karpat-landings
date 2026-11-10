# SPEC — German B2B landing site for Mebli Karpat (tables & chairs)

| | |
|---|---|
| Version | 1.2 — 2026-11-05 (multilingual architecture §5A, planned locales nl/pl/fr/cs, constraints register) |
| Companion | [CONSTRAINTS.md](CONSTRAINTS.md): legal, standards and certification register per market (DE, NL, PL, FR, CZ) |
| Owner | Mebli Karpat (Lviv, UA) — main site: https://meblikarpat.com.ua/ |
| Audience for this file | Claude Code, working in VS Code, in an empty repository |
| Output | A static, multilingual B2B landing site (German source language and English at launch; Dutch, Polish, French and Czech as planned locales; further languages by configuration, §5A): one long-form landing page, two category pages, one page per product (tables, chairs), legal pages, and an agent-readable layer |

**How to read this file.** Sections 1–4 are context and decisions. Sections 5–13 are requirements (MUST / SHOULD / COULD). Section 14 is the build plan, with a kickoff prompt. Appendices hold templates. Where an input is missing, do not invent it: use a visible placeholder `TODO(client)` and keep going (see §3.3).

---

## 1. Goal, audience, success

**Goal.** Win B2B partners in Germany for Mebli Karpat's solid-wood **tables** and **chairs**. Germany is the launch market; the site is built so that further language markets can be added without rework (§5A). The page must convert a German buyer into a quote request (RFQ), and must be easy for search engines and AI agents to find, read and cite.

**Buyer segments** (each gets its own copy block and CTA wording):

| Segment | Who | What they want to see |
|---|---|---|
| Gastronomie & Hotellerie | Restaurant/hotel operators, Objekteinrichter (contract fit-out firms), interior architects | Durability, stackability/seat comfort, finishes, lead times, project references, Maßanfertigung |
| Möbelhandel | Independent solid-wood stores, buying groups (Verbundgruppen), online shops | Collection, trade conditions, MOQ, samples, delivery terms, EUDR/compliance documents |
| OEM / Private Label | German brands and designers that source production abroad | Custom design, own branding, capacity, quality control, tooling |
| Planer / Architekten | Architects, designers | Spec sheets, CAD/3D files, finish samples |

**Success metrics** (set up measurement in Phase 1, review monthly):
- RFQ submissions, split by segment, source and locale.
- Qualified leads (sales marks an RFQ qualified).
- Organic impressions and clicks for the keyword clusters in Appendix F, per locale (Search Console).
- Agent visibility: a monthly manual test of the prompts in §11.6, logged in `docs/agent-visibility-log.md`.
- Lighthouse and accessibility gates in §15 stay green.

---

## 2. Scope

**In scope (Phase 1–2):** the 15 tables and 21 chairs listed in Appendix A; German and English at launch, on a locale framework that makes further languages a content task, not a code change (§5A); RFQ form; privacy-friendly analytics; the SEO and agent layer in §10–11.

**Out of scope:** sofas, e-commerce checkout and online payment, price lists behind a login, user accounts, a blog (planned for Phase 3), changes to the Magento main site (recommendations only, see §4.3).

---

## 3. Inputs and open decisions

### 3.1 Decisions (use the default unless the client says otherwise)

| # | Decision | Default |
|---|---|---|
| D1 | Domain | `b2b.meblikarpat.com.ua` (separate static site, no coupling to Magento). A German ccTLD can be added later with 301s |
| D2 | Stack | Astro (static output) + TypeScript (strict) + Tailwind CSS driven by the tokens in §8.1. Substitute only with a written reason in `docs/decisions.md` |
| D3 | Hosting | Cloudflare Pages + Pages Functions (EU-friendly, edge functions for RFQ and MCP). Netlify or Vercel acceptable |
| D4 | Fonts | Montserrat only, self-hosted. The main site also uses Open Sans on buttons, which looks like a Magento default. Do not carry it over |
| D5 | Catalogue PDF | Client-provided PDF if available; otherwise hide the CTA until Phase 2 (build it from a print stylesheet with Playwright) |
| D6 | AI crawlers | Allow search/retrieval bots **and** training bots (goal is to be known and recommended). One config flag flips training bots to `Disallow` |
| D7 | Prices | **Do not publish UAH retail prices.** Show "Preis auf Anfrage" unless the client supplies EUR trade prices (then "ab … € netto") |
| D8 | Analytics | Cookieless, EU-hosted (Plausible, Umami or self-hosted Matomo in cookieless mode). Counsel confirms no consent banner is needed |
| D9 | Spam protection on RFQ | Honeypot + time trap + server-side rate limit. Add Turnstile only if spam appears |
| D10 | Locales | `de` (source language, default) and `en` are live at launch. `nl`, `pl`, `fr` and `cs` are the first additional locales: built as `draft` and activated one by one (§5A.1), each gated by the market rows in CONSTRAINTS.md |
| D11 | URL scheme | Language subdirectories on one domain (`/` is German, `/en/`, later `/nl/`, …) with translated path segments. No ccTLDs, no subdomain per language |
| D12 | Language selection | No automatic redirect by IP or `Accept-Language`. Visitors choose with the language switcher; `x-default` points to the German root |
| D13 | Translation workflow | German written natively first; other locales drafted (machine allowed), reviewed by a native speaker, approved by the client (§5A.4) |
| D14 | Partial locales | `nl`, `pl`, `fr` and `cs` start with `coverage: core` (landing, categories, RFQ, legal) while product pages are still being translated (§5A.5); switch to `full` per locale when the 36 product texts are reviewed |
| D15 | Constraints register | [CONSTRAINTS.md](CONSTRAINTS.md) is binding. Rows gated `SITE` must be closed before launch, rows gated `LOCALE` before that locale goes `live`; status is tracked in `docs/constraints-status.csv` |

### 3.2 Inputs needed from the client

Collect these in `docs/client-inputs.md` as a checklist. Phase 1 can start without them.

| Input | Why it matters |
|---|---|
| Legal entity name, address, registration number, VAT ID, managing director | Impressum and `Organization` data |
| German-speaking contact (name, role, email, phone, WhatsApp) and a B2B mailbox | Trust, `ContactPoint`, RFQ routing |
| Certificates and test reports: FSC/PEFC (if held), REACH Entry 77 formaldehyde report, finish and glue safety data sheets, EN 16139 (non-domestic seating) and EN 15372 (non-domestic tables) tests, EN 12520 / EN 12521 for domestic lines | Buyers in every market ask first. The main site shows none (CONSTRAINTS.md X-02, S-01 to S-07) |
| EUDR documentation approach: wood species, origin (Lviv region per the main site), harvest geolocation data, legality documents | EUDR applies to wood products placed on the EU market from 30 Dec 2026 for medium and large operators and traders, and from 30 Jun 2027 for micro and small primary operators; the product scope was reportedly amended on 18 Sep 2026, so check Annex I for your CN codes (CONSTRAINTS.md X-01). The EU importer files the due-diligence statement and will need your data |
| Capacity per month, MOQ, standard lead times, sample policy and cost | RFQ expectations, FAQ |
| Incoterms and payment terms for Germany (main site: 50% prepayment, 50% before dispatch) | FAQ, trade terms block |
| EUR trade prices or "from" prices per product | `offers` markup (optional) |
| Variant data per product: sizes, heights, extension options, wood, finishes, upholstery | Spec tables, `ProductGroup` |
| Original high-resolution photos (not the cached thumbnails), factory photos, project photos, licence to use | Hero, galleries, E-E-A-T |
| EU/German references (projects or customers, with permission) | Trust section. If none, use Ukrainian HoReCa projects and label them honestly |
| Native-level German reviewer for all copy | The main site's `/de/` section is mostly untranslated Ukrainian with German UI strings and lorem ipsum. Do not repeat that |
| One native-speaking reviewer per additional locale, and the languages sales can answer in | Translation review (§5A.4), contact block per locale, RFQ autoresponder language |
| Approval of the terminology glossary (`docs/i18n/glossary.csv`) | Consistent product and trade terms in every language |
| Legal review for each additional target country | Legal pages differ by country (§13, CONSTRAINTS.md Part B) |
| EU representative (GDPR Art. 27) and EU economic operator (GPSR): an importer or a paid representative per market | Privacy notice, product labels (W-02, X-04) |
| Sales model per market: sell to an importer, or ship to the end customer yourself | Decides who carries packaging and furniture producer-responsibility duties (X-09, FR-03, PL-04, CZ-04) |
| Product-liability insurance covering EU sales; ISPM 15 packaging supplier; customs broker and test-lab contacts | Trade terms, shipping, HS codes and test reports (X-06, X-08, T-02 to T-04, S-08) |
| Domain DNS access, email provider, analytics account, Search Console access | Launch |

### 3.3 Handling gaps

- Unknown fact → write `TODO(client): <what is needed>` in the content, never a guess.
- `npm run check:todos` lists every `TODO(client)`. In CI on the `main` branch, `--strict` must fail if any remain in published (indexable) content.
- **Claims register.** Keep `docs/claims.md`: every marketing claim (e.g. "water-based lacquers without formaldehyde", "since 2002", "own production") with its source (main-site URL or client document) and approval status. Only approved claims go live.

---

## 4. Evidence from the main site (what shaped this spec)

Collected on 2026-11-05 from https://meblikarpat.com.ua/ with a browser.

### 4.1 Brand and style facts

- Montserrat family, self-hosted TTFs (Light, Regular, Medium, SemiBold, Bold, Black). Body text is Montserrat **Light**. H1 is Montserrat **Black**, uppercase, colour `#343434`. Buttons use Open Sans 700.
- Colours in use: ink `#171616` (body text), charcoal `#343434` (headings, footer), grey `#575757`, light grey `#D6D6D6`, white, **green `#6AAB4D`** (primary CTA, logo), red `#C84242` (sale/alert), hairlines `rgba(52,52,52,.1)`.
- Square corners (border-radius 0). Large photography of light-toned oak furniture in neutral interiors. Slim header (about 69 px), charcoal footer. Light theme only.
- Logo: `https://meblikarpat.com.ua/media/logo/websites/1/_5.png` (get the vector original from the client).

### 4.2 Catalogue and business facts

- 15 tables, 21 chairs (plus 2 sofas, out of scope). The HoReCa category already tags 29 products, including 6 tables and all chairs, as hospitality-suited.
- Materials: oak (дуб) and beech (бук). Finishes mentioned: clear oil, oil + tint, clear lacquer, enamel. Tables can be configured by length, height and material; some have extension systems. "Own colour combination" costs +10%.
- Production: raw material sourced in Lviv region, own production there; two-component glue, water-based lacquers (company states: no resins, formaldehyde or phenols), European hardware. Founded 2002; "sold in Ukraine and Europe for almost 20 years"; works with distributors; offers custom/design work and HoReCa. The partner page offers four partner intents (retail, sales agent, designer ordering, designer sketching).
- Payment on the main site: 50% at order, 50% before dispatch. Delivery within Ukraine via Nova Poshta. Nothing on export logistics.

### 4.3 Gaps this project must not inherit

- No FSC/PEFC, no test reports, no EUDR information, no capacity or lead times, no OEM terms on the main site.
- Product JSON-LD is minimal and partly invalid: `brand` is typed as `Thing` named after the product, `itemOffered: 999`, and `priceValidUntil` is in the past (2025-10-02). Do not copy this pattern.
- `sitemap.xml` is a 2022 Screaming Frog export; there is no `llms.txt`.
- The `/de/` pages are mixed-language with lorem ipsum, yet `hreflang="de"` points to them. **Recommendation to the client (out of scope here):** `noindex` or fix those pages, and point the main site's `de` alternate to this new site once live.

---

## 5. Information architecture and URLs

German is the default locale at the root; every other locale lives under its own prefix (`/en/`, later `/nl/`, `/pl/`, …). Path segments are translated per locale and ASCII-transliterated (route map in §5A.2). The table shows the launch locales.

| URL (DE) | URL (EN) | Page | Indexable |
|---|---|---|---|
| `/` | `/en/` | Landing hub (all sections in §6) | Yes |
| `/tische/` | `/en/tables/` | Table category page | Yes |
| `/stuehle/` | `/en/chairs/` | Chair category page | Yes |
| `/tische/{slug}/` | `/en/tables/{slug}/` | Product page | Yes, once enriched (§7.3) |
| `/stuehle/{slug}/` | `/en/chairs/{slug}/` | Product page | Same |
| `/impressum/`, `/datenschutz/` | `/en/imprint/`, `/en/privacy/` | Legal | Yes (low priority) |
| `/danke/` | `/en/thank-you/` | RFQ confirmation | **No** (`noindex`) |
| `/llms.txt`, `/llms-full.txt`, `/catalog.json`, `/catalog.csv`, `/openapi.json`, `/mcp` | — | Agent layer (§11) | n/a |

Phase 3 candidates: `/gastronomie-hotel/`, `/handel/`, `/private-label/`, `/massanfertigung/`, and buyer guides (Appendix F).

Rules: trailing slashes, lowercase, no query-string state in indexable URLs (filters use `#` or non-indexed state), every page has a self-referencing canonical and reciprocal `hreflang` alternates (§5A.3).

---

## 5A. Multilingual architecture

Goal: adding a language is a content task, not a code change. German is the source language, English is live at launch, and further languages are switched on by configuration once their content has been reviewed. This section overrides any single-language assumption elsewhere in the spec.

### 5A.1 Locale model and activation

`src/i18n/locales.ts` is the single source of truth. Routes, hreflang, sitemaps, the language switcher, `llms.txt`, `catalog.json` and the MCP `lang` values all read from it.

```ts
export const locales = {
  de: { label: 'Deutsch',    htmlLang: 'de', ogLocale: 'de_DE', prefix: '',     status: 'live', coverage: 'full', source: true },
  en: { label: 'English',    htmlLang: 'en', ogLocale: 'en_GB', prefix: '/en',  status: 'live', coverage: 'full' },
  nl: { label: 'Nederlands', htmlLang: 'nl', ogLocale: 'nl_NL', prefix: '/nl',  status: 'draft', coverage: 'core' },
  pl: { label: 'Polski',     htmlLang: 'pl', ogLocale: 'pl_PL', prefix: '/pl',  status: 'draft', coverage: 'core' },
  fr: { label: 'Français',   htmlLang: 'fr', ogLocale: 'fr_FR', prefix: '/fr',  status: 'draft', coverage: 'core' },
  cs: { label: 'Čeština',    htmlLang: 'cs', ogLocale: 'cs_CZ', prefix: '/cs',  status: 'draft', coverage: 'core' },
} as const;
```

- `status`: `off` (nothing built), `draft` (built and `noindex`; not in the switcher or any hreflang list; for review on preview URLs), `live`.
- `coverage`: `full` (all page types) or `core` (landing, categories, RFQ, legal; product pages per §5A.5).
- hreflang values are language-only (`de`, `en`, `nl`). Add a region (`de-CH`) only when two variants of one language genuinely exist. `x-default` is the German root.

**Activation checklist** (all true before a locale goes `live`): a native reviewer is assigned; sales can answer in that language, or the page states the English fallback; glossary entries approved; style guide written; keyword research done for that language; landing, categories and RFQ at `reviewed` or better; legal pages reviewed for the target country; every `LOCALE` row of that country in [CONSTRAINTS.md](CONSTRAINTS.md) closed or accepted in writing (`pnpm check:constraints`); `check:i18n` clean.

**Planned locales and later candidates.** The client has chosen `nl`, `pl`, `fr` and `cs` as the first additional locales after `de` and `en`. They are configured as `draft` with `coverage: core` and go `live` one at a time through the activation checklist and the market rows in [CONSTRAINTS.md](CONSTRAINTS.md) (Part C). State-backed Ukrainian furniture exports in H1 2026 went to Germany first, then the UAE, the Netherlands, Poland and Hungary ([InteriorDaily](https://www.interiordaily.com/article/9860679/ukrainian-furniture-exports-lead-government-backed-trade-growth/)). That shows where Ukrainian makers sell today, not demand for solid-wood tables in each market, so check demand before investing in more languages. Further candidates: `hu`, `it`. The UAE is served in English; Arabic would need right-to-left support, which is out of scope (the CSS rules in §5A.6 keep it cheap to add later). A review-only `uk` locale in `draft` status could let Ukrainian-speaking staff compare against the source text.

### 5A.2 Route map and slugs

`src/i18n/routes.ts` maps each route key to a path segment per locale. Components never hard-code paths: they call `localizedPath(routeKey, locale, params)`. The language switcher and the hreflang alternates are generated from the same map.

| Route key | de | en | nl | pl | fr | cs |
|---|---|---|---|---|---|---|
| `tables` | `tische` | `tables` | `tafels` | `stoly` | `tables` | `stoly` |
| `chairs` | `stuehle` | `chairs` | `stoelen` | `krzesla` | `chaises` | `zidle` |
| `thanks` | `danke` | `thank-you` | `bedankt` | `dziekujemy` | `merci` | `dekujeme` |
| `imprint` | `impressum` | `imprint` | `bedrijfsgegevens` | `dane-firmy` | `mentions-legales` | `provozovatel` |
| `privacy` | `datenschutz` | `privacy` | `privacy` | `polityka-prywatnosci` | `confidentialite` | `ochrana-osobnich-udaju` |

Segments are lowercase ASCII, and the native reviewer confirms each one (all `nl`, `pl`, `fr` and `cs` values are proposals). Product slugs are the brand name and stay identical in every locale (`/tische/frankfurt/`, `/en/tables/frankfurt/`).

### 5A.3 hreflang, canonical, sitemaps, metadata

- Every page lists alternates for each `live` locale in which that exact page exists and is published (§7.3), itself included, plus `x-default` pointing to the German URL. Alternates are reciprocal. Example in Appendix G.
- The canonical is always self-referencing within the locale. Never canonicalise one language to another, and never list a page in hreflang that is not built.
- Per page: `<html lang>`, `og:locale` and `og:locale:alternate`, JSON-LD `inLanguage`, and the markdown-twin `<link rel="alternate" type="text/markdown">`.
- Sitemaps: an index plus one sitemap per `live` locale; every URL carries `xhtml:link` alternates. `draft` locales are excluded.
- No automatic redirect by IP address or `Accept-Language`: crawlers do not send those signals reliably, and visitors dislike being moved. The visitor chooses with the switcher (§5A.6).

### 5A.4 Content model and translation workflow

- Language-dependent fields sit under `i18n.{locale}` in each content entity (§14.3). Dimensions, woods, SKUs and image files are stored once.
- Each locale entry has a status: `machine_draft` → `reviewed` → `approved`. `stale` is set automatically when the German source changed after the translation was made (compared through `sourceHash`), and `missing` means there is no entry. The entry records `reviewedBy` and `reviewedAt`.
- German is the source and is written natively. English is adapted, not literally translated. Other locales are translated from German, with English as a reference.
- Machine translation (DeepL, an LLM or similar) may produce `machine_draft` text. A native-speaking reviewer promotes it; nothing below `reviewed` is published, and the client approves marketing claims in every language. Unreviewed machine translation is also a quality risk and, at scale, a possible search-spam issue: check Google's current spam policies and keep the human step regardless.
- `docs/i18n/glossary.csv` holds approved terms per locale (Massivholz, Maßanfertigung, Private Label, geölt, lackiert, EUDR, finish names, trade terms), with a "do not translate" flag for brand and product names. `docs/i18n/style/{locale}.md` sets formality (Sie / you / u / Państwo / vous / Vy), number formats, tone and forbidden words.
- Titles, meta descriptions, slugs, alt text and FAQ are written per locale. Keyword research per locale (`docs/keyword-map.{locale}.md`) drives them; do not translate keywords one-to-one.
- `scripts/i18n-draft.ts` (optional) may call a translation API with the glossary to produce drafts. It writes `machine_draft` only.

### 5A.5 Partial locales (`coverage: core`)

A `core` locale ships landing, category, RFQ and legal pages first; `nl`, `pl`, `fr` and `cs` start this way (D14). There, a product card shows its key facts and a "request a quote for this model" call to action in the locale's language, which opens the RFQ with the product preselected. A second link, "Details (English)", carries `hreflang="en"` and `lang="en"` and goes to the English product page. The same fallback applies to any single page not yet published in a `full` locale.

A page is never served in another language's text under a locale URL: if a translation is missing, the page is not built in that locale. UI strings fall back to English only in `draft` locales; in `live` locales a missing UI key fails `check:i18n`.

### 5A.6 UI, layout and formatting

- **Language switcher** in header and footer: native language names (Deutsch, English, Nederlands), not flags (flags stand for countries, not languages). Each link has `hreflang` and `lang`; it goes to the same page in the other locale, or to that locale's landing page if the page does not exist there; `aria-current` marks the active language. It works without JavaScript and stores nothing in cookies or local storage.
- **Suggestion bar** (COULD): a dismissible note when the browser language differs from the page language. Client-side only, never redirects, stores nothing.
- **Text expansion:** German and Dutch strings are often much longer than English. Design for the longest locale; add a pseudo-locale in development (+40% length) and a visual snapshot at 360 px.
- **Formatting:** use `Intl` with the page locale for numbers, EUR currency, dates, lists and plural rules. Use ICU message syntax for UI strings with variables; never concatenate translated fragments.
- **CSS:** logical properties (`margin-inline`, `padding-block`, `text-align: start`) throughout, so a right-to-left locale can be added later at low cost. RTL itself is out of scope.
- **Fonts:** Montserrat covers Latin, Latin-Extended and Cyrillic; load subsets through `unicode-range` so a visitor downloads only what the page needs.
- **No text inside images** (banners, infographics): live text can be translated, indexed and read by agents. Alt text is per locale.
- **Contact block** states, per locale, the languages sales can answer in (client input) and the time zone.

### 5A.7 `pnpm check:i18n`

- UI key parity across `live` locales: no missing or extra keys, identical placeholders.
- Every published page in a `live` locale has status `reviewed` or `approved`, and none is `stale`.
- No hard-coded internal paths in components; no foreign-language text without a `lang` attribute.
- hreflang reciprocity verified by crawling the built `dist/`.
- A language-detection pass flags pages whose body text is not in the page's language.
- Layout snapshot at 360 px for the longest locale and for the pseudo-locale.

---

## 6. Landing page (`/`) — sections in order

Every section is a `<section>` with a unique `id` and an `<h2>` (hero has the only `<h1>`). All content is in the HTML at load: no content depends on JavaScript, hover or infinite scroll. Section ids are language-neutral so deep links work in every locale: `range`, `segments`, `services`, `material`, `quality`, `process`, `projects`, `terms`, `faq`, `rfq`. Copy in this section is described in German as the reference; each locale gets its own written copy (§5A.4).

1. **Header (sticky).** Logo, anchor nav (Sortiment, Leistungen, Qualität, Ablauf, FAQ, Kontakt), language switcher (§5A.6), primary CTA ("Angebot anfragen" in German; labels per locale). Collapses to a menu button below 1024 px.
2. **Hero.** H1 and one-sentence subline. Draft H1: "Massivholz-Stühle und -Tische für Gastronomie, Hotellerie und Handel – direkt vom Hersteller". Two CTAs: "Angebot anfragen" (primary), "Katalog herunterladen" (secondary, see D5). Large oak-furniture photo on a neutral background (the main site's hero style). LCP image: preloaded, AVIF/WebP, explicit dimensions.
3. **Trust bar.** 4 facts, each backed by the claims register, e.g. "Seit 2002", "Eigene Produktion in der Westukraine", "Eiche und Buche massiv", "Maßanfertigung und Private Label". Add certificate badges only if the client holds them.
4. **Sortiment (range).** Two blocks (Tische, Stühle), each with a card grid (all 36 products are in the HTML). Card: photo, name, one-line descriptor, wood chips, "Details" link. Progressive-enhancement filter chips: use case (Gastronomie, Hotel, Wohnen), wood (Eiche, Buche), type (Esstisch, Bistro/Bar, rund, ausziehbar; Stuhl, Barstuhl, gepolstert, mit Armlehnen). Each category block links to its category page.
5. **Für wen (segments).** Four cards from §1 with a segment-specific line and a CTA that pre-selects the segment in the RFQ form (`?segment=gastro#rfq`; the canonical URL ignores the parameter).
6. **Leistungen (services).** Maßanfertigung (dimensions, wood, finishes); Private Label / OEM; Muster und Mustertisch; Projektberatung with spec sheets and CAD/3D files (the main site already offers 3D models via greatcatalog.net); Logistik nach Deutschland (Incoterms, transit time); Zertifikate und Dokumente (EUDR, tests); Service und Ersatzteile. Each is a short card with a "Mehr dazu" disclosure (native `<details>` so it works without JS).
7. **Material und Oberflächen.** Oak vs. beech (visual comparison, hardness/colour/typical use), finish options with swatch photos, care notes for hospitality use. Copy must be factual and reviewed.
8. **Qualität und Compliance.** Production facts from the claims register; certificate and test-report downloads; an EUDR block ("Was wir Importeuren liefern": species, origin, geolocation data, legality documents — wording approved by the client); EN test references only if reports exist.
9. **Ablauf (process).** Five steps: Anfrage → Angebot → Muster und Freigabe → Produktion → Lieferung. Times only from client inputs.
10. **Referenzen (projects).** Gallery with captions (venue type, location, products used). Label honestly where projects are in Ukraine.
11. **Handelskonditionen (trade terms).** MOQ, lead time, payment terms, Incoterms, sample policy. If unknown, hide the block rather than show placeholders on production.
12. **FAQ.** 12–14 questions (Appendix E), `<details>` elements, mirrored in `FAQPage` JSON-LD.
13. **Anfrage (RFQ form).** See §12. Next to it: named German-speaking contact, phone, email, WhatsApp, office address, opening hours and time zone.
14. **Footer.** Charcoal background, address, legal links, social links, language links.
15. **Mobile sticky bar** (below 768 px): "Anrufen · WhatsApp · Angebot". Must not cover form fields or cause layout shift.

---

## 7. Category and product pages

### 7.1 Category pages (`/tische/`, `/stuehle/`)

H1 with the category keyword, a 120–200-word intro written for buyers (not the consumer buying guide on the main site), the filterable grid, a comparison table of key specs, a short FAQ (3–4 questions), RFQ CTA, `ItemList` + `BreadcrumbList` JSON-LD.

### 7.2 Product pages

Order: breadcrumbs → H1 (product name + type, e.g. "Esstisch Frankfurt – Massivholz Eiche oder Buche") → gallery (4+ images, keyboard-operable) → key facts → spec table (real `<table>`) → variants and finishes → "Geeignet für" (use cases) → downloads (spec PDF, CAD/3D if available) → RFQ block pre-filled with the product → related products.

Key facts and spec table fields (source: `src/content/products`): wood, finishes, dimensions per variant (length × width × height, mm), extension option, seat height and upholstery (chairs), weight, stackable, load rating if tested, test reports (standard, level, lab, report number: EN 16139 / EN 15372 for hospitality use), surface resistance (EN 12720 / EN 12721 / EN 12722), upholstery ignitability (EN 1021-1/-2) where relevant, formaldehyde emission report, lead time, MOQ, customisation options, country of origin.

### 7.3 Indexing governance (avoid thin pages)

Publication is decided per product **per locale** from the translation status in §5A.4. In a `live` locale a product page is published (and indexable) only if its text there has status `reviewed` or `approved` and it has: a description of ≥ 150 words (unique, written or adapted by a native speaker, not translated boilerplate), ≥ 3 images with alt text in that locale, a complete spec table, and no `TODO(client)`. Otherwise it is built only in preview deployments, with `noindex, follow`; in production the card uses the fallback of §5A.5 and the page stays out of the sitemaps and hreflang alternates. `hold: true` on a product forces this state in every locale. The build **fails** if a published page has status `machine_draft`, `stale` or `missing`.

---

## 8. Design system (aligned with the main site)

Principle: same identity, cleaner execution. Dark charcoal + white + one green, square corners, big photography, uppercase black headings.

### 8.1 Tokens (`src/styles/tokens.css`; Tailwind reads these via `@theme`)

```css
:root {
  /* brand — measured from meblikarpat.com.ua */
  --color-ink:        #171616;  /* body text */
  --color-charcoal:   #343434;  /* headings, footer, dark sections */
  --color-grey-600:   #575757;
  --color-grey-300:   #d6d6d6;
  --color-hairline:   rgba(52, 52, 52, 0.1);
  --color-white:      #ffffff;
  --color-green:      #6aab4d;  /* brand green: fills, icons, focus ring on dark */
  --color-red:        #c84242;  /* alerts/errors only */

  /* derived for accessibility — verify with a contrast checker */
  --color-green-strong: #3f7a2a; /* 5.21:1 on white, 4.78:1 on #f5f5f4: links, buttons with white text */
  --color-on-green:     #171616; /* ink on brand green: 6.49:1 */

  --font-sans: "Montserrat", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  --radius: 0;                    /* square corners like the main site */
  --container: 1280px;
  --header-h: 72px;
}
```

Why the derived greens: white text on the brand green `#6AAB4D` is 2.78:1 (below the 4.5:1 AA minimum for normal text), which is how the main site's button works today. Charcoal `#343434` on brand green is 4.47:1, just under the line. On the new site use either `--color-green-strong` with white text, or brand green with `--color-on-green` text. The ratios above were computed with the WCAG formula on 2026-11-05; keep an automated contrast check in CI.

### 8.2 Typography

- Self-host Montserrat WOFF2 (variable font preferred), Latin + Latin-Extended subsets (covers de, en, nl, pl, hu, fr, it, cs), plus a Cyrillic subset loaded through `unicode-range` only for locales that need it, `font-display: swap`, preload only the body and heading weights used above the fold. **No requests to Google Fonts** (third-party font loading before consent is a known German GDPR risk).
- H1/H2: Montserrat 800–900, uppercase, `--color-charcoal`, tight tracking; H3–H4: SemiBold sentence case. Body: Regular 400 at 16–18 px, line-height 1.6. The main site's Light 300 body text is too thin for small sizes; use Light only for large lead paragraphs (≥ 20 px).
- Fluid scale with `clamp()`: H1 36→64 px, H2 28→44 px, body 16→18 px.
- Long words (German and Dutch compounds, Polish and Hungarian inflections): set `hyphens: auto` with the correct `lang` on each page, `overflow-wrap: anywhere` on narrow cards, and test every heading at 360 px in the longest locale (§5A.6).

### 8.3 Components

Buttons (primary solid green-strong/white; secondary outlined charcoal; square; min height 48 px; label in Montserrat SemiBold, sentence case), cards (photo-first, hairline border, no shadows beyond a subtle hover), chips, tabs/filters, spec table, disclosure (`<details>`), form fields (visible labels, 48 px height, clear error text), gallery (CSS scroll-snap carousel with buttons), sticky header, language switcher (§5A.6), sticky mobile bar, toast-free confirmation (redirect to `/danke/`).

### 8.4 Layout and responsiveness

Mobile-first. Breakpoints: 360 (min supported), 640, 768, 1024, 1280, 1536. Container max 1280 px with 16/24/32 px gutters. Card grids: 1 column ≤ 480, 2 columns ≤ 1024, 3–4 above. Sections alternate white and light-grey (`#f5f5f4`) with charcoal for the RFQ band. Touch targets ≥ 44×44 px. No horizontal scroll at any width.

### 8.5 Imagery and motion

- Photography: light, neutral backgrounds, natural oak colour, real interiors for hospitality. No stock photos of other brands' furniture.
- Pipeline: originals in `assets/originals/` (not served), generated AVIF + WebP + JPEG fallback at 480/800/1200/1600 px, `srcset` + `sizes`, explicit `width`/`height`, `loading="lazy"` except the LCP image, `fetchpriority="high"` on the hero image.
- Alt text in German (and English on `/en/`), describing product and context, not keyword lists.
- Motion: subtle fades and hover states only; honour `prefers-reduced-motion`; no scroll-jacking, no autoplay video above the fold.

### 8.6 Accessibility

WCAG 2.2 AA. Skip link, landmarks (`header`, `nav`, `main`, `footer`), visible focus ring, logical heading order, labelled controls, `lang` attributes (including inline English), form errors announced, carousel and filters operable by keyboard. Accessibility matters twice here: browser-based agents read the accessibility tree as their main view of a page.

---

## 9. Content and copy rules

- Write German first, by a person who writes native German. English is an adaptation for English-speaking buyers, not a literal translation. Every further locale follows §5A.4: machine translation is allowed only as a draft with status `machine_draft`, and nothing goes live without native review.
- Tone: factual, calm, craftsmanship-led (Handwerk, Massivholz, Maßanfertigung). Avoid superlatives and unprovable claims ("beste", "garantiert").
- Be transparent about origin. German buyers will ask; the page should say plainly where the furniture is made and how continuity is handled (buffer stock, lead times, contract terms), using client-supplied facts.
- Formality, number and date formats follow each locale's style guide (`docs/i18n/style/{locale}.md`): German uses "Sie" and `1.234,00 €`; English uses `€1,234.00`. Dimensions stay in `mm` in every locale. Product names stay as brand names (Frankfurt, Milan) in every language.
- Every claim traces to `docs/claims.md`. Never invent certifications, capacity, references, customer names, awards or prices.
- Draft meta copy, German (illustrative; client approves; each locale gets its own natively written title and description, not a translation; keep titles ≤ 60 characters and descriptions ≤ 155 and check pixel width):
  - `/` title: "Massivholzstühle & -tische vom Hersteller | Mebli Karpat"
  - `/` description: "Stühle und Tische aus massiver Eiche und Buche direkt vom Hersteller. Für Gastronomie, Hotellerie und Handel. Maßanfertigung und Private Label."

---

## 10. SEO requirements

### 10.1 Technical (MUST)

- Static pre-rendered HTML for every page; content visible with JavaScript disabled.
- HTTPS, HSTS, one canonical host (no `www` duplicate), 301s for any retired URL, a useful 404.
- `<html lang>` set per locale; unique `<title>` and meta description per page and locale; one `<h1>`; logical `h2`/`h3`.
- Canonical and `hreflang` as specified in §5A.3.
- `sitemap.xml` (index + per-language), with real `lastmod` (from content change dates, not build time) and `xhtml:link` alternates; only indexable URLs. `robots.txt` per Appendix C.
- Open Graph and Twitter card tags with a 1200×630 image per page type.
- Internal linking: landing → categories → products → related products; product → landing RFQ; breadcrumbs everywhere below the root.
- Core Web Vitals field targets: LCP ≤ 2.0 s, INP ≤ 200 ms, CLS ≤ 0.05 (lab budgets in §15).
- Verify the site in Google Search Console and Bing Webmaster Tools; submit the sitemaps; optionally ping IndexNow on deploy.

### 10.2 On-page (MUST)

- Page ↔ keyword map per locale in `docs/keyword-map.{locale}.md`. The German map is seeded from Appendix F; other locales get their own research. One primary intent per page; the landing page targets the broad B2B cluster, categories the "Massivholzstühle/-tische" cluster, products the model-level terms.
- No keyword stuffing; headings and first paragraphs state the keyword naturally in the page's language.
- Descriptive link text and image file names (`stuhl-milan-eiche-natur.avif`).
- Product pages follow §7.3.

### 10.3 Structured data (MUST)

JSON-LD generated from the content collections (single source of truth), validated at build. Templates in Appendix B.

| Page | Types |
|---|---|
| All | `Organization` (shared `@id`), `WebSite`, `WebPage`, `BreadcrumbList` |
| Landing | `ItemList` of products, `FAQPage`, `Service` entries for custom manufacturing and private label |
| Category | `CollectionPage` + `ItemList` |
| Product | `Product` (or `ProductGroup` + `hasVariant` when variants exist) with `manufacturer`, `brand`, `material`, `additionalProperty` (dimensions etc.), `image`, `sku`; `offers` **only** if a real EUR price is supplied (`eligibleCustomerType` Business, `areaServed` DE, honest `availability` such as `MadeToOrder`; no `priceValidUntil` unless it is real and in the future) |

Build checks: JSON-LD parses; required properties present; no `priceValidUntil` in the past; marked-up facts match visible content. Every node carries `inLanguage` matching the page; text properties (`description`, service names) are localised per page; the `@id` of `Organization` is shared across locales.

### 10.4 Off-page (SHOULD; tracked in `docs/offpage.md`)

Agents and search engines cross-check facts. Publish the same name, address and description (NAP) on: LinkedIn company page, Europages, Kompass, wlw.de, Architonic/Archiproducts (for architects), Google Business Profile for the Lviv office, and the main site. Link each profile to the landing page of the matching locale. For each additional locale, add that country's main B2B directories to `docs/offpage.md`.

---

## 11. Agent discoverability

Layers, from cheapest and most useful to experimental. Build in this order.

### 11.1 Tier 1 — crawl access and clean pages (MUST)

- `robots.txt` permits search and retrieval agents; names the user-triggered fetchers too (note: user-triggered fetchers may ignore robots.txt, so the page must also be safe to fetch freely). Template in Appendix C. Verify each bot's token against the vendor's current documentation at build time.
- Server-rendered semantic HTML; no content behind JS, tabs without markup, hover or login; specs in `<table>`; real `<button>`/`<a>` elements with text labels; form fields with `name`, `id`, `<label>`, `autocomplete`.
- Layout stability: image dimensions, no late-injected banners (agents click elements by position).

### 11.2 Tier 2 — structured data (MUST)

§10.3 is the main machine-readable layer and the one search engines actually use.

### 11.3 Tier 3 — markdown twins and `llms.txt` (SHOULD)

- Every page, in every `live` locale, also exists as `…/index.md` under its own locale path (clean markdown of the main content, spec tables as markdown tables, product facts in front matter). Add `<link rel="alternate" type="text/markdown" href="…">`. If the host allows, also answer `Accept: text/markdown` with the twin and send `Vary: Accept`.
- `/llms.txt` (H1, one-paragraph summary, linked sections) is one file for the whole site, with a section listing each `live` locale. `llms-full.txt` (all key facts in one file) exists per locale: `/llms-full.txt` for German, `/en/llms-full.txt`, and so on. Template in Appendix C.
- Reality check to keep expectations honest: Google says it does not use `llms.txt` for Search or AI features and that having one neither helps nor hurts rankings; studies found AI crawlers rarely fetch it. Chrome's Lighthouse "Agentic Browsing" category does look for it. Cost is near zero, so ship it, but do not count on it as a ranking lever.

### 11.4 Tier 4 — machine-readable catalogue and RFQ API (SHOULD)

- `/catalog.json` and `/catalog.csv`, generated from the same content as the pages, with a JSON Schema at `/catalog.schema.json`. Each item has `slug`, `name`, `category`, `woods`, `finishes`, `variants[]` (mm), `use_cases`, `lead_time_days`, `moq`, `image`, `last_updated`, plus text and URL per locale as objects keyed by locale code (`descriptor`, `description` and `url`, e.g. `{"de": …, "en": …}`), listing only locales where the page is published.
- `/openapi.json` describing `POST /api/rfq` (same schema and validation as the web form, including a `locale` field that selects the autoresponder language). Agents may submit an RFQ on a buyer's behalf. Safeguards: required buyer email, rate limit, same spam checks, a field `submitted_via: web|agent|mcp`, and a note in the description that the calling agent must have the buyer's explicit confirmation first. Sales answers by email; nothing is binding.

### 11.5 Tier 5 — MCP and WebMCP (COULD; Phase 3, behind feature flags)

Both are young and moving. Keep all code in one module each so it can follow spec changes.

- **Remote MCP server** at `/mcp` (Streamable HTTP, stateless, read-only except `create_quote_request`). Tools (Appendix D): `search_products`, `get_product`, `list_options`, `get_company_profile`, `get_compliance_info`, `create_quote_request`. Every tool accepts a `lang` parameter (any `live` locale code) and returns text in that language; every response carries `source_url` and `last_updated`. Publish a server card at `/.well-known/mcp/server-card.json` (path and status of the card spec are still unsettled in the sources checked; re-check the MCP spec before building).
- **WebMCP** (browser-side, Chrome): register the same tools in the page with feature detection and an adapter, because the API location was reported inconsistently (`navigator.modelContext` in Chrome's May 2026 docs; one later guide says `document.modelContext`). Annotate the RFQ `<form>` for the declarative API per the current Chrome docs. Never break the page if the API is absent.
- **Not building:** an A2A agent card. There is no agent behind the site to talk to.

### 11.6 Acceptance tests for agent readiness

1. Lighthouse (version with the Agentic Browsing category) run on `/` and one product page: record the pass ratio in `docs/agent-readiness.md`; fix failures that are in our control.
2. Fact-extraction test: give an LLM with web access only the landing URL and ask 10 questions (woods, finishes, custom sizes, how to request a quote, where it is produced, contact). At least 9 correct, each answer traceable to the page. Repeat for every `live` locale, asking the questions in that language.
3. RFQ test: an agent finds the RFQ endpoint from `/llms.txt` or `/openapi.json` and drafts a valid request without help.
4. Monthly visibility prompts (German shown; each `live` locale gets natively written equivalents from its reviewer), logged with date, tool and whether Mebli Karpat appears: "Wer liefert Massivholzstühle für Restaurants direkt vom Hersteller in Osteuropa?", "Eichentische nach Maß für ein Hotel – Hersteller, Lieferung nach Deutschland", "Private-Label-Hersteller für Massivholzstühle".

---

## 12. RFQ form and backend

**Fields.** Name*, Firma*, Segment* (Gastronomie/Hotel · Möbelhandel · OEM/Private Label · Planer/Architekt · Sonstiges), E-Mail*, Telefon, Land und PLZ*, Produkte (multi-select from the 36, or free text), Menge (ca.), Wunsch-Liefertermin, Maßanfertigung gewünscht (ja/nein), Nachricht, link to drawings (URL field; file upload is Phase 2), business-use confirmation checkbox* ("commercial customers only", CONSTRAINTS.md W-01), VAT ID (optional, checked against VIES on the server for EU numbers), consent checkbox* linking to the privacy page. Labels are visible, fields use `autocomplete`, errors are inline and announced.

**Behaviour.** Works without JavaScript (plain POST to `/api/rfq`, redirect to `/danke/`); enhanced with `fetch` and inline validation when JS is available. Pre-fills `segment` and `product` from the URL. Validation with Zod, shared between client and server.

**Backend.** Pages Function: validate → spam checks (honeypot, minimum fill time, rate limit per IP) → email to `RFQ_TO_EMAIL` through an EU-region transactional email provider → autoresponder to the buyer in their locale (reference number, what happens next; English if the locale has no template) → optional webhook to a CRM (`RFQ_WEBHOOK_URL`). No database in Phase 1; do not log personal data beyond what the provider needs. Secrets only in environment variables (`.env.example` documents them).

**Locale.** The form posts a hidden `locale` field (the page's locale, never inferred from the buyer's country). It selects the validation messages, the segment labels, the autoresponder template and a locale tag in the subject line of the email to sales, so sales sees which language to answer in. Templates and consent text exist per `live` locale.

**Events** (cookieless analytics), each with a `locale` property: `rfq_view`, `rfq_start`, `rfq_submit`, `catalog_download`, `phone_click`, `email_click`, `whatsapp_click`, `lang_switch`.

---

## 13. Privacy, legal, compliance

*Not legal advice: counsel must review before launch (German counsel for DE, local counsel for each additional market). Do not ship generated legal text as-is. The full register of legal, standards and certification constraints per market is [CONSTRAINTS.md](CONSTRAINTS.md); where it is stricter than this section, it wins.*

- **Impressum** (provider identification under the German Digital Services Act §5 duty for commercial online services) and **Datenschutzerklärung** (GDPR Art. 13) in every `live` locale, linked from every footer. The German pair is mandatory for the German market. For each additional locale, counsel for that target country reviews the legal pages: provider-identification and B2B rules differ by country.
- No third-party requests before consent: self-hosted fonts, no tag manager, no embedded YouTube/Maps iframes (use a click-to-load facade, or a static image with a link).
- Cookieless analytics (D8). If any cookie or local storage is used for non-essential purposes, add a consent banner with equal-weight accept/reject.
- Contact form: state purpose, retention period and processor (email provider) in the privacy page; consent checkbox not pre-ticked.
- B2B only: say in every locale that offers are for commercial customers (CONSTRAINTS.md W-01); no consumer pricing.
- GDPR Art. 27: a non-EU company that targets people in the EU and runs analytics probably needs an EU representative; name it in the privacy notice (W-02). Prefer EU-hosted email and processing; counsel decides on the transfer mechanism for data that reaches Ukraine (W-03).
- Product claims: no CE mark or "CE-certified" wording (X-05); no generic environmental claims and no FSC/PEFC logo without a licence (X-11, C-01).
- Provider identification per locale follows the country rows in CONSTRAINTS.md (DE-01, NL-01, PL-02, FR-02, CZ-02).
- Marketing claims: only from the claims register; EUDR and certification wording approved by the client.
- Security headers via `_headers`: CSP (no inline scripts except hashed JSON-LD), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

---

## 14. Tech stack, repository, data, build

### 14.1 Stack

Astro (static, using its i18n routing for the locale prefixes) · TypeScript strict · Tailwind CSS with tokens · Astro content collections with Zod schemas (JSON/MDX) · `astro:assets` + sharp · Cloudflare Pages Functions for `/api/rfq` and `/mcp` · Playwright + axe for tests · Lighthouse CI · GitHub Actions. Node LTS, pnpm or npm (pick one, commit the lockfile).

### 14.2 Repository layout

```
.
├─ CLAUDE.md                 # generated in Phase 0 from this spec: commands, conventions, guardrails
├─ SPEC.md                   # this file
├─ CONSTRAINTS.md            # legal, standards and certification register per market (companion to this file)
├─ docs/                     # decisions.md, claims.md, client-inputs.md, keyword-map.{locale}.md, agent-readiness.md, offpage.md, i18n/ (glossary.csv, style/{locale}.md, workflow.md), constraints-status.csv
├─ public/                   # fonts/, favicon, _headers, _redirects, static agent files that are not generated
├─ assets/originals/         # source photos (not served)
├─ scripts/
│  ├─ import-catalog.ts      # scrape the 36 main-site product pages into draft content (Appendix A)
│  ├─ check-todos.ts         # lists/fails on TODO(client)
│  ├─ check-structured-data.ts
│  ├─ check-i18n.ts          # key parity, translation status, hreflang reciprocity, hard-coded paths
│  ├─ check-constraints.ts   # fails on open SITE rows and on open LOCALE rows of live locales (docs/constraints-status.csv)
│  ├─ i18n-draft.ts          # optional: machine-translation drafts using the glossary (machine_draft only)
│  └─ build-agent-files.ts   # llms.txt, llms-full.txt, catalog.json/csv, *.md twins, openapi.json
├─ functions/                # api/rfq.ts, mcp.ts
└─ src/
   ├─ content/               # products/*.json (neutral data + i18n per locale), pages/{locale}/*.mdx, faq/{locale}.json
   ├─ components/ layouts/ pages/ (de at root, en under /en/)
   ├─ i18n/                  # locales.ts, routes.ts, helpers (localizedPath, alternates), ui/{locale}.json
   └─ styles/tokens.css, global.css
```

### 14.3 Product data model (Zod schema in `src/content/config.ts`)

```ts
{
  slug: string,                       // ASCII, language-neutral base
  category: 'tables' | 'chairs',
  sourceUrl: string,                  // main-site page the draft came from
  name: string,                       // brand name, unchanged
  i18n: Record<Locale, {              // one entry per locale; absent = not published there
    descriptor: string,               // e.g. "Esstisch, ausziehbar"
    description: string,              // >= 150 words to be indexable
    features: string[],
    imageAlt: string[],               // parallel to images[]
    status: 'machine_draft' | 'reviewed' | 'approved',   // 'stale' and 'missing' are derived
    sourceHash: string,               // hash of the German source fields this text was derived from
    reviewedBy?: string, reviewedAt?: string
  }>,
  woods: Array<'oak' | 'beech'>,
  finishes: Array<'oil' | 'oil_tint' | 'lacquer' | 'enamel'>,
  useCases: Array<'gastro' | 'hotel' | 'home'>,
  variants: Array<{ id: string, lengthMm?: number, widthMm?: number, heightMm?: number,
                    wood?: string, extension?: boolean, upholstery?: string }>,
  // language-dependent text lives only under i18n above; everything else is language-neutral
  images: Array<{ src: string, width: number, height: number }>,   // alt text: i18n[locale].imageAlt
  compliance?: {                      // shown only when a document exists; every entry needs a report reference
    tests: Array<{ standard: string, level?: string, lab: string, reportRef: string, date: string }>,
    emissions?: { standard: string, formaldehydeMgM3: number, lab: string, reportRef: string, date: string },
    certificates?: Array<{ scheme: 'FSC' | 'PEFC' | 'ISO9001' | 'ISO14001' | 'NF_ENV' | 'BLAUER_ENGEL' | 'DGM' | 'OTHER',
                           licenceNo: string, validUntil: string }>
  },
  downloads?: { specPdf?: string, cad?: string, model3d?: string },
  leadTimeDays?: number, moq?: number,
  hsCode?: string,                    // confirmed by the customs broker (CONSTRAINTS.md T-03)
  tradePriceFromEur?: number,         // omit unless supplied; never UAH
  hold?: boolean,                     // editorial override: keep out of the index in every locale
  lastUpdated: string                 // ISO date, drives sitemap lastmod
}
```

### 14.4 Build pipeline

`pnpm build` → import/validate content → generate pages for every `live` and `draft` locale → optimise images → generate JSON-LD → generate sitemaps and hreflang → `build-agent-files.ts` → run `check-structured-data`, `check-todos`, `check-i18n` and `check-constraints` → emit `dist/`. `import-catalog.ts` is a one-off helper that gives Claude a starting point from the main site; its output is raw material only (every locale starts as `missing`) because Ukrainian text and consumer copy must be rewritten natively for German B2B buyers.

---

## 15. Quality gates and acceptance criteria

CI (`pnpm check`) must pass before each merge; the release checklist must be ticked before launch.

| Area | Gate |
|---|---|
| Lighthouse (mobile, simulated slow 4G) | Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100 on `/`, one category, one product |
| Budgets | LCP ≤ 2.0 s, TBT ≤ 150 ms, CLS ≤ 0.05; JS ≤ 40 KB gzip on the landing page; first-viewport transfer ≤ 500 KB |
| Accessibility | axe: 0 serious/critical on all templates; manual keyboard pass; 200% zoom and 360 px width without loss of content |
| SEO | Unique title/description/H1 per page; canonical and hreflang reciprocal; sitemap holds only indexable URLs; no broken internal links; `noindex` only on `/danke/` and flagged drafts |
| Structured data | JSON-LD validates (Rich Results Test or Schema validator) and passes `check-structured-data` |
| Content | `check-todos --strict` clean on `main`; every claim in `docs/claims.md` approved |
| Multilingual | `check:i18n` clean: key parity, no `stale` or unreviewed published pages, no hard-coded paths; hreflang reciprocity verified on the built output; layout intact at 360 px in the longest locale |
| Constraints | `check:constraints` clean: no open `SITE` rows and no open `LOCALE` rows for any `live` locale; every claim, mark and test result shown on a page has a matching document reference |
| Agent layer | `robots.txt`, `llms.txt`, `catalog.json`, markdown twins present and valid; §11.6 tests 1–3 recorded |
| Forms | RFQ works with and without JS; autoresponder sent; spam checks active; success page `noindex` |
| Responsiveness | Visual checks at 360, 768, 1024, 1440 px (Playwright screenshots stored in `docs/qa/`) |
| Legal | Impressum and Datenschutz reviewed by German counsel; no third-party requests before consent (verify in the network panel) |

**Release checklist:** DNS and HTTPS live; Search Console and Bing verified; sitemaps submitted; analytics events firing; RFQ test submissions received by sales in every `live` locale; language-switcher links checked in both directions; redirects tested; the main site gets a link to this site and its `de` hreflang is corrected (client action).

---

## 16. Working plan for Claude Code in VS Code

### 16.1 Working rules (also copy into `CLAUDE.md` in Phase 0)

- Read `SPEC.md` first. Plan before coding each phase; commit at the end of each phase with a clear message.
- Never invent facts. Use `TODO(client)`; log claims in `docs/claims.md`. Treat `CONSTRAINTS.md` as binding: never show a CE mark, a certification logo or a test result without the matching document (X-05, C-03, C-04).
- The content collections are the single source of truth: pages, JSON-LD, `catalog.json`, `llms.txt` and markdown twins are generated from them.
- No third-party runtime requests. No client-side rendering of primary content.
- Run `pnpm check` before declaring a phase done. Report what failed, not just what passed.
- Record every deviation from this spec in `docs/decisions.md`.

### 16.2 Phases

| Phase | Deliverable | Done when |
|---|---|---|
| 0 Setup | Repo, Astro + TS + Tailwind, tokens, fonts self-hosted, the locale framework of §5A (`locales.ts`, `routes.ts`, switcher, hreflang and sitemap generation, `check:i18n`) proven with `de`, `en` and one switched-off third locale, CI with lint/type/build, `CLAUDE.md`, `docs/` stubs including `constraints-status.csv` seeded with every ID from CONSTRAINTS.md, and `check:constraints` | `pnpm build` passes; empty DE/EN pages render with header/footer; switching the third locale on in config produces its pages and hreflang with no code change |
| 1 Landing MVP | All §6 sections with placeholder copy marked `TODO(client)`; RFQ form and function; analytics; legal page shells; robots, sitemap, canonical, hreflang, Organization/WebSite/FAQ JSON-LD | Lighthouse gates met on `/`; RFQ test email received |
| 2 Catalogue | `import-catalog.ts`; 36 product drafts; category and product templates; filters; comparison tables; Product/ItemList JSON-LD; indexing governance (§7.3) | All 36 pages build in preview deployments; `check-structured-data` clean; production publishes only pages whose text in that locale is reviewed (§7.3) |
| 3 Content and agent layer | Reviewed German/EN copy loaded; `llms.txt`, `llms-full.txt`, markdown twins, `catalog.json/csv`, `openapi.json`; strict TODO check; §11.6 tests 1–3 | Release checklist ticked |
| 4 Experimental | `/mcp`, server card, WebMCP adapter, buyer guides, catalogue PDF | Behind flags; tests in `docs/agent-readiness.md` |
| 5 Additional locales | `nl`, `pl`, `fr`, `cs`, one at a time (in this order unless the client re-orders), each activated per §5A.1: glossary, style guide, drafts, native review, keyword map, legal pages, and the country rows of CONSTRAINTS.md | Locale `live`; `check:i18n` and `check:constraints` clean; §11.6 tests passed in that language |

### 16.3 Kickoff prompt (paste into Claude Code in the empty repo)

> Read `SPEC.md` and `CONSTRAINTS.md` completely. Then do Phase 0: set up the project exactly as §14 and §5A describe, generate `CLAUDE.md` from §16.1 plus the commands you define, create the `docs/` stubs, and seed `docs/constraints-status.csv` with every ID from `CONSTRAINTS.md`. Before writing code, show me a short plan and list any decision in §3.1 you want to change. Stop at the end of Phase 0 and report: what you built, what `pnpm check` output was, and what you need from the client (§3.2).

Follow-up prompts: "Do Phase 1", "Do Phase 2", and so on, one per session if context gets long.

---

## Appendix A — Product seeds (main-site slugs; prefix `https://meblikarpat.com.ua/`)

**Tables (15):** stil-barnij (Barny square), stil-barnij-kruhlyi (Barny round), stil-barnij-priamokutnij (Barny rectangular), stil-derev-janij-biden (Bayden), stil-derev-janij-frankfurt, stil-derev-janij-frankfurt-eko, stil-fabio (new), stil-fin-oak, stil-gdansk (new), stil-derev-janij-grand, stil-derev-janij-johnson, stil-derev-janij-likicari-long, stil-derev-janij-smart, stil-derev-janij-verke-prjamokutnij, stil-derev-janij-verke-kruglij.

**Chairs (21):** stilec-lounge, stilec-boris, stilec-sydney, stilec-sydney-with-sides, stilec-milan, stilec-milan-high, stilec-forte-barnij, stilec-forte-01, stilec-forte-03, stilec-dallas, stilec-dallas-soft, stilec-asti (Aston), stilec-madrid, stilec-chicago, stilec-bone, stilec-como, stilec-vil-njus (Vilnius), stilec-chester-soft, stilec-tor, stilec-layt (Light), stilec-hjuge (Hygge).

Category pages on the main site: `/stoli/`, `/stil-ci/`, HoReCa selection `/mebli-dlja-horeca/` (29 items, 6 tables + chairs + 2 sofas). Use it to seed `useCases: ['gastro','hotel']`.

## Appendix B — JSON-LD templates

Organization (shared `@id`, referenced from every page):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://b2b.meblikarpat.com.ua/#org",
  "name": "Mebli Karpat",
  "alternateName": "Меблі Карпат",
  "url": "https://b2b.meblikarpat.com.ua/",
  "logo": "https://b2b.meblikarpat.com.ua/img/logo.png",
  "foundingDate": "2002",
  "description": "Hersteller von Stühlen und Tischen aus Massivholz (Eiche, Buche) für Gastronomie, Hotellerie und Handel.",
  "address": { "@type": "PostalAddress", "streetAddress": "Kn. Olhy St. 95", "addressLocality": "Lviv", "addressCountry": "UA" },
  "contactPoint": [{
    "@type": "ContactPoint", "contactType": "sales",
    "email": "info@meblikarpat.com.ua", "telephone": "+380679690202",
    "availableLanguage": ["de", "en", "uk"], "areaServed": ["DE", "AT", "CH"]
  }],
  "sameAs": ["https://www.instagram.com/meblikarpat", "https://www.facebook.com/mebel.karpat", "https://youtube.com/channel/UCjFkDFlNqB1dCZHzrTEi1yA/videos"],
  "knowsAbout": ["Massivholzmöbel", "Gastronomiestühle", "Massivholztische", "Maßanfertigung", "Private Label"]
}
```

List in `availableLanguage` only languages that sales can really answer in (TODO(client)); it does not have to match the site's locales. Add the B2B mailbox when known.

Product (one variant shown; use `ProductGroup` + `hasVariant` when the product has several sizes):

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://b2b.meblikarpat.com.ua/stuehle/milan/#product",
  "name": "Stuhl Milan",
  "description": "…reviewed German description…",
  "sku": "CHAIR-MILAN",
  "image": ["https://b2b.meblikarpat.com.ua/img/stuhl-milan-1200.jpg"],
  "brand": { "@type": "Brand", "name": "Mebli Karpat" },
  "manufacturer": { "@id": "https://b2b.meblikarpat.com.ua/#org" },
  "material": "Massivholz Eiche oder Buche",
  "category": "Stühle > Gastronomiestühle",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Sitzhöhe", "value": 460, "unitCode": "MMT" }
  ],
  "audience": { "@type": "BusinessAudience", "audienceType": "Gastronomie, Hotellerie, Möbelhandel" }
}
```

Add `offers` only when a real EUR price exists:

```json
"offers": {
  "@type": "Offer",
  "priceCurrency": "EUR", "price": "0.00",
  "eligibleCustomerType": "http://purl.org/goodrelations/v1#Business",
  "areaServed": "DE",
  "availability": "https://schema.org/MadeToOrder",
  "url": "https://b2b.meblikarpat.com.ua/stuehle/milan/"
}
```

`price` above is a placeholder: use the client's number or omit the whole block.

In every other locale, translate `name`, `description`, `material`, `category` and the property names; use that locale's page URL for `@id` and `url` (`…/en/chairs/milan/#product`); keep `sku` and numeric values identical.

## Appendix C — `robots.txt`, `llms.txt`

`robots.txt` (generated from config; verify bot tokens against vendor docs at build time):

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /danke/
Disallow: /en/thank-you/
# one more Disallow line per live locale's thank-you path, generated from the route map

# AI search and retrieval agents: allowed
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /

# AI training crawlers: allowed by default (flag ai.allowTraining=false flips these to Disallow)
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: CCBot
Allow: /

Sitemap: https://b2b.meblikarpat.com.ua/sitemap-index.xml
```

`llms.txt`:

```
# Mebli Karpat — Massivholz-Stühle und -Tische (B2B)

> Hersteller aus Lviv, Ukraine, seit 2002. Stühle und Tische aus massiver Eiche und Buche für Gastronomie, Hotellerie, Möbelhandel und Private-Label-Kunden in Deutschland. Maßanfertigung möglich. Angebote auf Anfrage.

## Wichtige Seiten
- [Startseite](https://b2b.meblikarpat.com.ua/index.md): Sortiment, Leistungen, Ablauf, FAQ
- [Tische](https://b2b.meblikarpat.com.ua/tische/index.md): 15 Modelle
- [Stühle](https://b2b.meblikarpat.com.ua/stuehle/index.md): 21 Modelle

## Daten und Schnittstellen
- [Produktkatalog (JSON)](https://b2b.meblikarpat.com.ua/catalog.json): alle Produkte mit Maßen, Hölzern, Oberflächen
- [Anfrage-API (OpenAPI)](https://b2b.meblikarpat.com.ua/openapi.json): Angebotsanfrage senden (Zustimmung des Käufers erforderlich)

## Kontakt
- Vertrieb: info@meblikarpat.com.ua, +380 67 969 02 02

## Sprachen / Languages
- [English](https://b2b.meblikarpat.com.ua/en/index.md): same offer, written for English-speaking buyers
- (every further live locale is listed here with its own index.md)
```

## Appendix D — MCP tools (Phase 4)

| Tool | Input | Output |
|---|---|---|
| `search_products` | `q?`, `category?` (tables\|chairs), `use_case?`, `wood?`, `min_length_mm?`, `max_length_mm?` | List of `{slug, name, category, woods, url, image}` |
| `get_product` | `slug` | Full product record as in `catalog.json` |
| `list_options` | none | Woods, finishes, use cases, dimension ranges |
| `get_company_profile` | none | Name, founding year, location, languages, contact, production facts (approved claims only) |
| `get_compliance_info` | none | Documents and certificates available, EUDR approach, each with status and last updated |
| `create_quote_request` | Same fields as the RFQ form + `buyer_confirmed: true` | `{status: "received", reference, next_steps}` |

Every tool takes an optional `lang` (a live locale code; default `de`). Limits: 60 requests/min/IP; read tools need no auth; `create_quote_request` needs a valid email and `buyer_confirmed: true`; every output includes `source_url` and `last_updated`.

## Appendix E — FAQ topics (12–14 items per locale, written natively; shown here in German; answers from client inputs only)

1. Welche Holzarten und Oberflächen bieten Sie an?
2. Sind Maßanfertigungen und Sonderfarben möglich? Ab welcher Menge?
3. Bieten Sie Private Label / OEM an?
4. Wie lange dauern Muster und Serienproduktion?
5. Wie läuft der Versand nach Deutschland (Incoterms, Transportdauer, Verpackung)?
6. Welche Zahlungsbedingungen gelten für Neukunden?
7. Welche Dokumente erhalten Importeure für die EU-Entwaldungsverordnung (EUDR)?
8. Welche Zertifikate und Prüfberichte gibt es (Holz, Emissionen, Lacke, Belastungstests)?
9. Sind die Stühle für den Dauereinsatz in der Gastronomie geeignet? Welche Belastung wurde geprüft?
10. Wie stellen Sie Lieferkontinuität sicher?
11. Gibt es Ersatzteile und Garantie?
12. Wer ist mein Ansprechpartner und in welcher Sprache?
13. Wie hoch sind die Formaldehyd-Emissionen und liegt ein Prüfbericht nach REACH Eintrag 77 vor?
14. Wer ist der EU-Verantwortliche nach der Produktsicherheitsverordnung (GPSR) und wer ist Importeur?

## Appendix F — Keyword hypotheses (validate with Search Console, Google Keyword Planner or Sistrix before finalising; no volumes are claimed here)

German terms only. Every additional locale needs its own keyword research: local search behaviour differs, and a translated keyword is often not what buyers in that market type.

| Cluster | Example German terms | Target page |
|---|---|---|
| Gastro chairs | Gastronomiestühle Holz, Massivholzstühle Gastronomie, Restaurantstühle Eiche | `/stuehle/` |
| Gastro tables | Gastronomietische Massivholz, Bistrotisch Eiche, Stehtisch/Bartisch Holz | `/tische/` |
| Hotel and contract | Hotelmöbel Massivholz Hersteller, Objektmöbel Holz Stühle Tische | `/` |
| Custom | Eichentisch nach Maß, Massivholztisch Maßanfertigung | `/tische/`, Phase 3 service page |
| Wholesale / OEM | Möbel Großhandel Massivholz, Möbelhersteller Private Label, Stühle Hersteller Osteuropa | `/` |
| Product level | Esstisch Eiche ausziehbar, Barhocker Holz massiv, Stuhl Buche massiv | product pages |
| Compliance | EUDR Möbel Lieferant, FSC Massivholzmöbel Hersteller | `/` (section 8), Phase 3 guide |

Competitors to review before copywriting (German resellers that list solid-wood hospitality chairs and tables): setrada.de, pemora.de, BIG Möbel, Sklum. Study how they present specs, certificates and trade terms; do not copy their text.

## Appendix G — hreflang and head metadata example

Generated from the route map (§5A.2) for `/stuehle/milan/` when `de` and `en` are `live` and both texts are published. The English page carries the mirror image with its own canonical.

```html
<html lang="de">
<link rel="canonical" href="https://b2b.meblikarpat.com.ua/stuehle/milan/">
<link rel="alternate" hreflang="de" href="https://b2b.meblikarpat.com.ua/stuehle/milan/">
<link rel="alternate" hreflang="en" href="https://b2b.meblikarpat.com.ua/en/chairs/milan/">
<link rel="alternate" hreflang="x-default" href="https://b2b.meblikarpat.com.ua/stuehle/milan/">
<link rel="alternate" type="text/markdown" href="https://b2b.meblikarpat.com.ua/stuehle/milan/index.md">
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="en_GB">
```

Matching sitemap entry (one `url` per locale page, same alternates on each):

```xml
<url>
  <loc>https://b2b.meblikarpat.com.ua/stuehle/milan/</loc>
  <lastmod>2026-11-05</lastmod>
  <xhtml:link rel="alternate" hreflang="de" href="https://b2b.meblikarpat.com.ua/stuehle/milan/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://b2b.meblikarpat.com.ua/en/chairs/milan/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://b2b.meblikarpat.com.ua/stuehle/milan/"/>
</url>
```

A locale in `draft` status, or a page below `reviewed` in a locale, is left out of every alternate list.
