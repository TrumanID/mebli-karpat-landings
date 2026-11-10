# Client inputs (SPEC §3.2)

Ukrainian version with an answer column for the client: [todo-client.uk.md](todo-client.uk.md).

Found missing facts with `npm run check:todos`. Tick an item when the data is in the repository.

- [ ] **Legal entity name, address, registration number, VAT ID, managing director**: Impressum and `Organization` data
- [ ] **German-speaking contact (name, role, email, phone, WhatsApp) and a B2B mailbox**: Trust, `ContactPoint`, RFQ routing
- [ ] **Certificates and test reports: FSC/PEFC (if held), REACH Entry 77 formaldehyde report, finish and glue safety data sheets, EN 16139 (non-domestic seating) and EN 15372 (non-domestic tables) tests, EN 12520 / EN 12521 for domestic lines**: Buyers in every market ask first. The main site shows none (CONSTRAINTS.md X-02, S-01 to S-07)
- [ ] **EUDR documentation approach: wood species, origin (Lviv region per the main site), harvest geolocation data, legality documents**: EUDR applies to wood products placed on the EU market from 30 Dec 2026 for medium and large operators and traders, and from 30 Jun 2027 for micro and small primary operators; the product scope was reportedly amended on 18 Sep 2026, so check Annex I for your CN codes (CONSTRAINTS.md X-01). The EU importer files the due-diligence statement and will need your data
- [ ] **Capacity per month, MOQ, standard lead times, sample policy and cost**: RFQ expectations, FAQ
- [ ] **Incoterms and payment terms for Germany (main site: 50% prepayment, 50% before dispatch)**: FAQ, trade terms block
- [ ] **EUR trade prices or "from" prices per product**: `offers` markup (optional)
- [ ] **Variant data per product: sizes, heights, extension options, wood, finishes, upholstery**: Spec tables, `ProductGroup`
- [ ] **Original high-resolution photos (not the cached thumbnails), factory photos, project photos, licence to use**: Hero, galleries, E-E-A-T
- [ ] **EU/German references (projects or customers, with permission)**: Trust section. If none, use Ukrainian HoReCa projects and label them honestly
- [ ] **Native-level German reviewer for all copy**: The main site's `/de/` section is mostly untranslated Ukrainian with German UI strings and lorem ipsum. Do not repeat that
- [ ] **One native-speaking reviewer per additional locale, and the languages sales can answer in**: Translation review (§5A.4), contact block per locale, RFQ autoresponder language
- [ ] **Approval of the terminology glossary (`docs/i18n/glossary.csv`)**: Consistent product and trade terms in every language
- [ ] **Legal review for each additional target country**: Legal pages differ by country (§13, CONSTRAINTS.md Part B)
- [ ] **EU representative (GDPR Art. 27) and EU economic operator (GPSR): an importer or a paid representative per market**: Privacy notice, product labels (W-02, X-04)
- [ ] **Sales model per market: sell to an importer, or ship to the end customer yourself**: Decides who carries packaging and furniture producer-responsibility duties (X-09, FR-03, PL-04, CZ-04)
- [ ] **Product-liability insurance covering EU sales; ISPM 15 packaging supplier; customs broker and test-lab contacts**: Trade terms, shipping, HS codes and test reports (X-06, X-08, T-02 to T-04, S-08)
- [ ] **Domain DNS access, email provider, analytics account, Search Console access**: Launch
