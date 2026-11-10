# Agent readiness (SPEC §11.6)

Record Lighthouse Agentic Browsing results and the fact-extraction and RFQ tests here, with dates. Verify `robots.txt` bot tokens against vendor docs before launch.

Phase 3 still to build: `llms.txt`, `llms-full.txt`, markdown twins, `catalog.json/csv`, `openapi.json`.

## RFQ captcha

`POST /api/rfq` needs either `captcha` (solve `GET /api/captcha`: find `number` in 0..`max` so that SHA-256 of `salt` + `number` equals `challenge`; send `{salt, number, challenge, signature}` as a JSON string) or `captchaAnswer` (the sum shown in the form's `<noscript>`). Document this in `openapi.json` and `llms.txt` in Phase 3.
