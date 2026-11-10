# Mebli Karpat B2B site

Static multilingual landing site for solid-wood chairs and tables. `SPEC.md` is the requirements document and `CONSTRAINTS.md` is the binding legal and standards register. Read both before each phase.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Static build to `dist/` |
| `npm run preview` | Serves `dist/` on :4321 with real `_headers` and the real RFQ handler; email is stubbed |
| `npm run check` | Types, build, TODO, JSON-LD, i18n and constraints reports, RFQ unit tests. Run before calling a phase done |
| `npm run check:release` | Strict gates. **Fails until client inputs, native review and legal rows are closed** |
| `npm run test:e2e` | Playwright + axe (uses installed Chrome), writes screenshots to `docs/qa/` |
| `node scripts/import-catalog.ts` | One-off main-site import to `data/import/` and `assets/originals/` |

`PUBLIC_STAGE=production` hides every `TODO(client)` and the blocks that would be left empty. The default stage shows them as yellow markers.

## Rules

- Never invent facts. Use `TODO(client): …` as the end of a string, and log claims in `docs/claims.md`. Never show a CE mark, a certification logo or a test result without the matching document (X-05, C-03, C-04).
- `src/content` and `src/i18n/ui` are the single source of truth for pages, JSON-LD and later agent files.
- Language: `src/i18n/locales.ts` + `routes.ts`. A new locale is `ui/{l}.json`, `landing/{l}.json`, `faq/{l}.json`, `legal/{l}.json` and a status change, with no code change. Never hard-code internal paths: use `localizedPath()`.
- No third-party runtime requests, no inline JS or CSS (strict CSP in `public/_headers`), no client-side rendering of primary content, no cookies or local storage.
- All copy is `machine_draft` until a native reviewer promotes it (§5A.4).
- Design: only the logo and colour tokens come from the main site; the look is the 2026-11-05 redesign, not SPEC §8 (see `docs/decisions.md`). Motion is CSS only and must leave content visible when unsupported or with reduced motion.
- No third-party captcha. The form uses the self-hosted proof-of-work in `src/lib/captcha.ts`; deployments need `RFQ_CAPTCHA_SECRET` or the form refuses requests.
- Record every deviation from the spec in `docs/decisions.md`.
- Report what failed, not just what passed.

## Status

Phases 0 and 1 are built. Next is Phase 2: category and product pages (then restore "Details" links and category links). Phase 3: `llms.txt`, markdown twins, `catalog.json`, `openapi.json`.
