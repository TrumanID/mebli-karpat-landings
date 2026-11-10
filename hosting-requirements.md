# Hosting requirements: Mebli Karpat landing pages

This document covers two sites. Both are built the same way, so one set of requirements fits both.

| | B2B site | Black Friday landing |
|---|---|---|
| Folder | `mk b2b landing` | `mk BF landing` |
| Audience | German and EU business buyers (DE/EN) | Ukrainian retail buyers (UK) |
| Planned address | `b2b.meblikarpat.com.ua` | not decided yet (e.g. `meblikarpat.com.ua/black-friday` or `bf.meblikarpat.com.ua`) |
| Built size | about 17 MB | about 3.3 MB |
| Form endpoint | `POST /api/rfq` | `POST /api/order` |
| Captcha endpoint | `GET /api/captcha` | `GET /api/captcha` |

## 1. What the application is

- **Static pages.** HTML, CSS, JS, fonts and images are generated at build time into `dist/`. There is no database, no CMS, no PHP, no user accounts and no cookies.
- **Two small server endpoints per site.** One issues a captcha challenge. The other receives the form, checks it, recalculates prices on the server (BF), and sends e-mail through the Brevo API.
- **Nothing is stored on the server.** A submitted form becomes an e-mail to sales, plus a confirmation to the buyer if they gave an address. The B2B site can optionally also post the request to a webhook (a CRM, for example).

## 2. Recommended hosting: Cloudflare Pages

Both projects are ready for Cloudflare Pages without code changes:

- the `functions/api/*.ts` files are Cloudflare Pages Functions;
- `public/_headers` is the Cloudflare header format;
- the handlers read the visitor IP from the Cloudflare header `cf-connecting-ip`.

The free plan is enough for a landing page. Steps:

1. Create a Cloudflare account and a Pages project for each site.
2. Upload `dist/` with `wrangler pages deploy dist`, or connect a Git repository with build command `npm ci && npm run build` and output folder `dist`.
3. Add the environment variables from section 5 as **encrypted secrets**.
4. Connect the domain or subdomain (section 6).
5. Add a rate-limiting rule for the form endpoint (section 3.4).

## 3. Minimum requirements for any other hosting

Use this list if the client prefers another provider, for example Ukrainian hosting.

### 3.1 Web server

| Requirement | Why | Notes |
|---|---|---|
| HTTPS with automatic certificate renewal; HTTP redirected to HTTPS | Forms send personal data; HSTS is enabled | Let's Encrypt is enough |
| Custom domain or subdomain | | |
| Directory index (`/privacy/` serves `/privacy/index.html`) and a redirect from `/privacy` to `/privacy/` | Built with `trailingSlash: 'always'` | |
| Custom 404 page served with status 404 | `dist/404.html` | |
| Custom response headers per path | Strict security policy (CSP, HSTS and others) | `public/_headers` must be translated for the server: `.htaccess` (Apache `mod_headers`) or `nginx` config |
| Long cache for `/_astro/*` (1 year, immutable); short or no cache for HTML | File names in `/_astro/` change on every build | |
| gzip or Brotli compression for HTML, CSS, JS, SVG | Page speed | |
| HTTP/2 or HTTP/3 | Page speed | |

### 3.2 Server code (the two endpoints)

| Requirement | Notes |
|---|---|
| Runtime | Cloudflare Workers (ready). **Or** Node.js 22.12 or newer: the code uses the standard `Request`, `Response`, `fetch` and Web Crypto APIs, so a small Node wrapper is needed. A wrapper already exists for local testing (`scripts/preview-server.ts`); a production version needs real e-mail sending and must run behind the HTTPS server. **PHP-only hosting cannot run it:** the two endpoints would have to be rewritten in PHP. |
| Outgoing HTTPS | To `api.brevo.com` (port 443). For B2B, also to the webhook URL if one is used. |
| Secret storage | Environment variables that are not in the code or in public files (section 5). |
| Real visitor IP | The rate limit reads `cf-connecting-ip`. Behind another proxy, the code must be changed to read the correct header (for example `X-Forwarded-For` from a trusted proxy). |
| Request timeout | At least 10 seconds: the form endpoint waits for Brevo before answering. |
| Logs | Access to error logs. The code logs errors without personal data. |

### 3.3 Build machine

The server does not build anything. Builds run on a developer machine or in CI:

- Node.js 22.12 or newer, and npm;
- `npm ci`, then `npm run build`, then upload `dist/` (plus the endpoints, if not on Cloudflare);
- the production build for the **BF landing** is `PUBLIC_STAGE=production npm run build`. It deliberately **fails** until the client confirms prices, dates and the Christmas deadline in `src/data/offer.ts`, so example prices never reach buyers.

### 3.4 Protection against spam and abuse

Already in the code: honeypot field, minimum fill time, signed proof-of-work captcha, and a limit of 5 requests per IP per 10 minutes.

The rate limit and the captcha replay check are kept **in memory of one server instance**. On Cloudflare, or on any host that runs several instances, this is best effort. Add at the hosting level:

- a rate-limiting rule on `POST /api/order` and `POST /api/rfq` (Cloudflare: Security → WAF → Rate limiting rules);
- basic bot protection or a WAF, if the provider has one.

## 4. E-mail (Brevo)

| Requirement | Notes |
|---|---|
| Brevo account | Created by the client. The free plan has a daily sending limit; check the current limit against the expected number of requests. |
| API key | Passed to whoever deploys, through a secure channel. Never by e-mail or in a document. |
| Verified sender domain | `meblikarpat.com.ua` must be verified in Brevo: **SPF, DKIM and DMARC** DNS records. Without them, letters go to spam or are rejected. |
| Sender address | For example `no-reply@meblikarpat.com.ua` |
| Recipient address for requests | The sales mailbox |

If Brevo fails, the form tells the buyer it could not send and shows the phone number. A request is never silently lost.

## 5. Environment variables

Set them as secrets on the hosting. Values never go into the code.

**Black Friday landing**

| Variable | Value |
|---|---|
| `PUBLIC_STAGE` | `production` at build time (hides internal TODO markers) |
| `ORDER_TO_EMAIL` | Sales mailbox for requests |
| `ORDER_FROM_EMAIL` | Verified sender address |
| `BREVO_API_KEY` | Brevo API key |
| `CAPTCHA_SECRET` | Long random string, e.g. the output of `openssl rand -hex 32` |

**B2B site**

| Variable | Value |
|---|---|
| `PUBLIC_STAGE` | `production` at build time |
| `RFQ_TO_EMAIL` | Sales mailbox for requests |
| `RFQ_FROM_EMAIL` | Verified sender address |
| `BREVO_API_KEY` | Brevo API key (can be the same account) |
| `RFQ_CAPTCHA_SECRET` | Long random string, different from the BF one |
| `RFQ_WEBHOOK_URL` | Optional: CRM or automation webhook |
| `PUBLIC_ANALYTICS_ENDPOINT`, `PUBLIC_ANALYTICS_DOMAIN` | Optional: cookieless analytics. If used, that origin must be added to `connect-src` in `public/_headers`. |

Without the captcha secret or the e-mail settings, the form refuses requests with an error instead of accepting and losing them.

## 6. Domain and DNS

- Access to the DNS of `meblikarpat.com.ua`, or someone at the client who can add records.
- A `CNAME` (or `A`/`AAAA`) record for each subdomain, pointing to the hosting.
- The Brevo SPF, DKIM and DMARC records from section 4.
- If the BF page should live at `meblikarpat.com.ua/black-friday` (a path on the main site rather than a subdomain), the main site's server must forward that path to the landing. Agree this with whoever runs the main site; a subdomain is simpler.

## 7. Personal data and location

- Both forms collect names, phone numbers, e-mail and city. Data passes through the endpoint into e-mail and is not stored on the hosting.
- **B2B:** buyers are in the EU, so GDPR applies. Prefer hosting and an e-mail provider that process data in the EU, with a data processing agreement (DPA) with each. Brevo is an EU company.
- **BF:** buyers are in Ukraine; Ukrainian personal data law applies. The privacy page still needs the legal entity details (see `docs/todo-client.uk.md`).
- The pages load nothing from third parties (fonts and images are self-hosted), so no third-party cookie banner is needed.

## 8. Load

The pages are static and small, so a CDN or any ordinary host serves Black Friday traffic peaks without special sizing. Only form submissions reach server code, one request per order.

## 9. Acceptance check after deployment

- [ ] `https://…/` opens; `http://…/` redirects to HTTPS.
- [ ] Response headers include `Content-Security-Policy`, `Strict-Transport-Security` and `X-Content-Type-Options` (check in browser dev tools, or at securityheaders.com).
- [ ] `/privacy/` (BF) or `/datenschutz/` (B2B) open; `/nope/` returns status 404 with the styled page.
- [ ] A test request from a phone arrives in the sales mailbox; the confirmation arrives in the buyer's mailbox and is **not** in spam.
- [ ] The same test with JavaScript switched off also arrives.
- [ ] No yellow TODO markers or "example prices" banner are visible.
- [ ] Lighthouse mobile scores are close to the local results (100 in all four categories).

## 10. Hosting options compared

| Option | Static pages | Endpoints | Work needed |
|---|---|---|---|
| **Cloudflare Pages** (recommended) | Yes | Yes, as is | None; configure only |
| Netlify or Vercel | Yes (`_headers` works on Netlify) | Yes, after small adapters | Small |
| VPS or hosting with Node.js 22+ | Yes, via nginx or Apache | Yes, with a production Node wrapper | Moderate: server setup, TLS, process manager, updates |
| Shared PHP hosting (for example ukraine.com.ua plans without Node.js) | Yes; headers via `.htaccess` | **No**: rewrite both endpoints in PHP | Larger, and two code bases to keep in sync |
