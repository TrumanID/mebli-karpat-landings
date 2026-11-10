# Mebli Karpat Black Friday landing

One-page Ukrainian landing: "Buy on Black Friday, use at Christmas". Three chairs and three tables at a campaign price; buyers choose quantities and send a request that is e-mailed to sales. It is a request, not a checkout: no payment on the site.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :4322 |
| `npm run build` | Static build to `dist/` (preview stage) |
| `npm run preview` | Serves `dist/` on :4322 with real `_headers` and the real order handler; e-mail is stubbed and printed |
| `npm run check` | Types, build, unit tests |
| `npm run test:e2e` | Playwright + axe (installed Chrome); screenshots to `docs/qa/` |
| `npm run check:release` | Production build. **Fails until prices, dates and the Christmas deadline are confirmed** in `src/data/offer.ts` |

## Rules

- `src/data/offer.ts` is the single source for models, regular prices, discount and dates. Pages, totals, e-mails and the server-side price check all read it. The server never trusts prices from the browser.
- Never invent facts. Regular prices come from meblikarpat.com.ua (date in `priceCheckedOn`). Unknowns use `<Todo text="…" />`, visible only in the preview stage. Open items for the client: `docs/todo-client.uk.md`.
- No third-party runtime requests, no inline JS or CSS (strict CSP in `public/_headers`), no cookies or storage.
- Everything works without JavaScript: quantity fields sit on the cards and join the form through `form="order-form"`; a no-JS captcha question is the fallback.
- Self-hosted proof-of-work captcha (`src/lib/captcha.ts`, same as the B2B site). Deployments need `CAPTCHA_SECRET`, `BREVO_API_KEY`, `ORDER_TO_EMAIL`, `ORDER_FROM_EMAIL` (see `.env.example`) or the form refuses requests rather than losing them.
- Motion is CSS only and switches off with reduced motion.
