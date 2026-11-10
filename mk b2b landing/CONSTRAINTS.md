# CONSTRAINTS — legal, standards and certification register per market

Companion to [SPEC.md](SPEC.md) (v1.2). Markets: **Germany (DE), Netherlands (NL), Poland (PL), France (FR), Czech Republic (CZ)**, plus the EU-wide and Ukraine-side items that apply to all of them.

| | |
|---|---|
| Compiled | 2026-11-05 |
| Method | Web research on 2026-11-05 across law-firm, compliance-vendor, standards-body, authority and news pages; plus general knowledge where marked |
| Not done | No primary legal text (EUR-Lex, national gazettes) and no standard was read in full. **This is a work list for counsel, a customs broker and a test lab, not legal advice** |

## How to read this register

**Confidence**
- ✔ found in at least one source during this research. Sources are mostly secondary, so still verify against the primary text.
- ◐ general knowledge, not confirmed in this research. Verify before relying on it.
- ○ open: sources conflicted or were silent. Needs an expert answer.

**Gate** (when the item must be closed)
- `SITE` before the site goes public in any locale
- `LOCALE` before that country's locale goes live
- `QUOTE` before quoting or contracting with buyers in that market
- `SHIP` before the first shipment into the EU
- `WATCH` monitor only

**Owner:** C = client (Mebli Karpat), I = importer or distribution partner, L = counsel, T = test laboratory, B = customs broker.

**Tracking in the repository.** Keep `docs/constraints-status.csv` with the header `id,status,owner,evidence,date`, one row per ID below. `status` is `open`, `closed`, `accepted` (client accepts the risk in writing) or `n/a`. `pnpm check:constraints` fails if any `SITE` row is `open`, or any `LOCALE` row of a `live` locale is `open`. `LOCALE` rows with a country prefix (DE-, NL-, PL-, FR-, CZ-) belong to that country's locale; W-06 applies to every `live` locale.

**Scope assumption.** The landing site is B2B only (W-01). Consumer-law items are therefore out of scope; if the company later sells to consumers in these markets, a separate review is needed.

---

## Part A — Cross-market constraints

### A1. Product law (EU)

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| X-01 | **EU Deforestation Regulation** (EU) 2023/1115, amended by (EU) 2025/2650. Wooden furniture (CN 9401 and 9403, wooden) is in scope. Application: 30 Dec 2026 for large and medium operators and for downstream operators and traders; 30 Jun 2027 for micro and small primary operators. The Commission confirmed no further delay in May 2026. A product-scope amendment reportedly entered into force on 18 Sep 2026. The operator that first places goods on the EU market (usually the importer) files the due-diligence statement | ✔ | QUOTE, SHIP | Build an EUDR data pack per product: wood species (scientific name), country and plot geolocation of harvest, harvest date range, legality evidence, supplier chain. Check Annex I for your exact CN codes after the scope amendment. Check Ukraine's risk classification (○, not verified here). Offer the pack to importers as a selling point | C, I |
| X-02 | **REACH Annex XVII Entry 77, formaldehyde** (Regulation (EU) 2023/1464). From 6 Aug 2026, furniture and wood-based articles must not release more than 0.062 mg/m³ in the chamber test of Appendix 14. Exemption for articles used exclusively for industrial or professional purposes does not hold where the public is exposed, which covers restaurant and hotel furniture. No general exemption for wood was found. Textiles already under Entry 72 are excluded | ✔ | QUOTE, SHIP | Test the **finished article** (wood, glue, finish combination) in an accredited lab with EN 16516 or EN ISO 16000-9; keep the report with the product record; do not rely on glue or lacquer supplier statements alone. Add the result to the product page and `catalog.json` only when a report exists | C, T |
| X-03 | **REACH general duties**: safety data sheets for glues and coatings, communication on substances of very high concern above 0.1% w/w in an article (Art. 33), supplier declarations for hardware and fabrics | ◐ | QUOTE | Collect SDS and supplier declarations into one compliance folder; answer buyer questionnaires from it | C |
| X-04 | **General Product Safety Regulation** (EU) 2023/988, in force since 13 Dec 2024. Furniture is a covered product group. A non-EU manufacturer needs an EU-established economic operator (importer or EU responsible person). Product identification (type, batch or serial), manufacturer name and address, and the EU operator's contact must be on the product or packaging; safety information in the language of the member state; technical documentation kept for 10 years. Whether professional-only furniture is outside scope is unclear | ✔ / ○ | SHIP | Decide who is the EU operator for each market (importer or a paid EU responsible person). Add a label template per locale. Keep a risk assessment per model. Ask counsel whether HoReCa furniture counts as "likely to be used by consumers" | C, L |
| X-05 | **CE marking**: no CE-marking legislation applies to ordinary wooden chairs and tables | ◐ | SITE | Never show a CE mark or write "CE-certified" on site, labels or catalogues. Use named standards and test reports instead | C |
| X-06 | **Product liability**: Directive (EU) 2024/2853, transposition due 9 Dec 2026. Importers and EU representatives of non-EU manufacturers carry liability, so importers will ask about insurance | ◐ | QUOTE | Obtain product-liability insurance that covers EU sales; state it in the trade terms only if it exists | C |
| X-07 | **Textile fibre labelling** (EU) 1007/2011 may apply to upholstery fabrics offered or sold separately | ○ | QUOTE | Ask the importer or counsel whether labelling is needed for chair models with fabric seats | L |
| X-08 | **Wooden packaging** (pallets, crates, dunnage) from a third country must follow ISPM 15: heat-treated or fumigated and marked. Regulation (EU) 2016/2031 Art. 43. Ukraine's mark has the form UA + 5-digit producer code + HT or MB | ✔ | SHIP | Buy ISPM 15 packaging from a registered supplier, or use plastic or cardboard pallets. Check the mark on every pallet | C |
| X-09 | **Packaging and Packaging Waste Regulation** (EU) 2025/40, applying from 12 Aug 2026. Producers that first make packaging available in a member state carry extended producer responsibility there. Sources say non-EU producers must appoint an authorised representative in each member state; one source says this holds even if the Omnibus suspension for EU producers is adopted, and the status of that proposal is unverified. If an EU importer is the first to make the packaging available, the importer is the producer | ✔ / ○ | SHIP | Decide the sales model per market (sell to an importer, or ship to the end customer yourself). If you ship directly, appoint a packaging-compliance representative for that country. Design packaging to be recyclable | C, L |
| X-10 | **Ecodesign for Sustainable Products Regulation** (EU) 2024/1781. Furniture is a priority group; the delegated act is expected in 2028 or 2029 (sources differ), and the digital product passport follows later. No binding furniture obligation exists today | ✔ | WATCH | Keep product data structured (it already is in SPEC §14.3). Review yearly | C |
| X-11 | **Green-claims rules**: Directive (EU) 2024/825 restricts generic environmental claims ("eco-friendly", "green") and sustainability labels not based on a certification scheme or public authority; applies from 27 Sep 2026. It is a consumer-protection directive, but the safe course is to follow it in B2B copy too | ◐ | SITE | Every environmental or health claim in `docs/claims.md` needs evidence. Replace the main site's "completely safe for health" with a claim tied to a test report. FSC/PEFC logos only under a licence | C |
| X-12 | **Forced Labour Regulation** (EU) 2024/3015, applying from Dec 2027 | ◐ | WATCH | Keep supplier records for wood and hardware | C |
| X-13 | **Supplier due-diligence questionnaires**: German LkSG (amended in 2026, final status unconfirmed) and the EU CSDDD (delayed) lead many buyers to send ESG questionnaires to non-EU suppliers | ○ | QUOTE | Prepare a standard answer pack: code of conduct, origin of wood, labour practice, policies. Optional: EcoVadis | C |

### A2. Standards (voluntary, but they are the buyer's yardstick)

No harmonised mandatory furniture standard was found; these EN standards are what buyers, test labs and market-surveillance authorities use to judge strength, durability and safety (◐). Always cite the **edition year** in the product record and re-check yearly.

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| S-01 | **EN 16139:2025**, non-domestic seating: strength, durability, safety. Adults up to 110 kg. Test-severity levels by intended use sit in an informative annex. Excludes office task chairs, educational chairs, outdoor seating and row seating | ✔ | QUOTE | Test each chair model, or a justified representative per construction family, at the level agreed with the lab and typical buyers for hospitality. Publish standard, level, lab, report number and date | T, C |
| S-02 | **EN 15372:2023**, non-domestic tables. Excludes office desks, educational and laboratory tables, and outdoor tables with their own EN | ✔ | QUOTE | Same as S-01 for table models, including extension mechanisms | T, C |
| S-03 | **EN 12520** (domestic seating, 2024 edition) and **EN 12521** (domestic tables; 2023 or 2024 edition, sources differ) for the "Wohnen / home" use case | ✔ | QUOTE | Use for retail partners selling to households; confirm current editions with the national standards body | T |
| S-04 | **Test methods**: EN 1728 (seating strength and durability), EN 1022 (stability of seating), EN 1730 (tables) | ✔ / ◐ | QUOTE | The lab applies them; the report names them | T |
| S-05 | **Surface resistance** of finishes: EN 12720 (cold liquids), EN 12721 (wet heat), EN 12722 (dry heat), EN 15186 (scratch) | ◐ | QUOTE | Test table tops per finish (oil, oil plus tint, lacquer, enamel). Useful proof for restaurant buyers | T |
| S-06 | **Ignitability of upholstered furniture**: EN 1021-1 (smouldering cigarette) and EN 1021-2 (match-flame equivalent) | ✔ | QUOTE | Test upholstered chair models (for example the "soft" variants) with the actual fabric and foam. Needed in France for public premises and often demanded in tenders (see FR-05, DE-07) | T |
| S-07 | **Emission test methods** EN 16516 and EN ISO 16000-9 for REACH Entry 77 | ✔ | QUOTE | See X-02 | T |
| S-08 | **Lab recognition**: buyers prefer reports from ISO/IEC 17025-accredited labs. FCBA (France) is one such lab for furniture. Acceptance of Ukrainian lab reports varies | ◐ | QUOTE | Use an accredited EU lab for the first reports, or confirm with key importers that a Ukrainian accredited lab is accepted | C |

### A3. Certifications and documents (voluntary, buyer-expected)

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| C-01 | **FSC or PEFC chain of custody.** The main site shows neither. Both need an audit by an accredited certification body, and logos or claims need a trademark licence. Neither replaces the EUDR due-diligence statement, but both ease buyers' risk checks | ◐ | QUOTE | Decide whether to certify. Until then, say nothing about FSC or PEFC on the site | C |
| C-02 | **ISO 9001 / ISO 14001** | ◐ | WATCH | Optional; list on site only with a valid certificate | C |
| C-03 | **Quality and low-emission marks** (voluntary). DE: Blauer Engel RAL-UZ 38, Goldenes M (DGM, RAL-GZ 430), GS mark under the German product safety act. FR: NF Environnement Ameublement (tests by FCBA, licence by AFNOR) and NF Mobilier professionnel. No national mark was found for NL, PL or CZ | ✔ (FR) / ◐ | WATCH | Choose at most one or two marks per market after the first test reports exist. Show a mark only with a valid licence | C |
| C-04 | **Test-report bundle** (S-01 to S-07, X-02) as downloads per product and in `catalog.json` | ✔ | QUOTE | Data model: `compliance` block (SPEC §14.3). Every shown value needs a report reference | C |
| C-05 | **EPD, Cradle to Cradle, EcoVadis**: increasingly requested by hotel chains and public buyers | ◐ | WATCH | Optional later | C |
| C-06 | **Timber legality documents** for the EUDR data pack: forest-use permits, harvest and transport documents from Ukrainian forestry enterprises | ◐ | QUOTE | See X-01 | C |

### A4. Trade, customs, logistics and contracts (Ukraine to EU)

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| T-01 | **Road transport**: the EU–Ukraine road transport agreement (no permits needed) runs to **31 Mar 2027**. Any further extension is conditional on Ukraine's alignment with EU road transport law. Polish hauliers press for stricter terms | ✔ | QUOTE | Do not promise delivery terms beyond Mar 2027 without a fallback (EU carriers, multimodal). Show lead times as "ex works plus transit" | C, B |
| T-02 | **DCFTA preferential origin**: proof is a EUR.1 certificate (issued by Ukrainian customs, free of charge per consignment) or an invoice declaration (low-value consignments up to EUR 6,000, or an approved exporter; check the current threshold). For heading 9401 the rule is a change of tariff heading with a 10% tolerance; the 9403 rule was not found | ✔ / ○ | SHIP | Confirm rules and duty per HS code with a broker; set up an approved-exporter status if volume justifies it | C, B |
| T-03 | **HS classification** of each model (9401 seats, 9403 other furniture; wooden subheadings) must match the EUDR and customs declarations | ◐ | QUOTE | Add `hsCode` to the product record after broker confirmation | B |
| T-04 | **Customs and tax**: the EU declarant needs an EORI number; import VAT is paid on import. Prefer EXW, FCA or DAP. Avoid DDP unless you hold an EU VAT registration and a fiscal representative. Buyers' VAT IDs should be checked in VIES | ◐ | QUOTE | Write Incoterms and VAT handling into the trade terms. Collect buyer VAT IDs in the RFQ | C, B |
| T-05 | **Contract law**: the UN sales convention (CISG) applies by default between parties in contracting states, which includes Ukraine and all five markets here, unless excluded. Governing law, jurisdiction or arbitration, retention of title and warranty terms must be chosen | ◐ | QUOTE | Draft general terms of sale in English plus per-market versions; decide on CISG exclusion with counsel | L |
| T-06 | **Late payment**: Directive 2011/7/EU generally limits agreed B2B payment periods to 60 days unless expressly agreed and not grossly unfair; national rules can be stricter (FR-07, NL-07) | ◐ | QUOTE | Keep standard terms within 60 days; the current 50% advance and 50% before dispatch is compliant in principle | C |
| T-07 | **Ukraine-side rules**: export contracts, currency control and deadlines for receiving export proceeds, export declarations, martial-law measures | ○ | QUOTE | Confirm with the bank and customs broker | C, B |
| T-08 | **Trademarks**: availability of "Mebli Karpat" and the logo in the EU (EUIPO and national offices); model names such as "Frankfurt" or "Milan" are generic words and may be hard to protect | ○ | QUOTE | Run a clearance search; file an EU trademark if the brand is the sales asset | C, L |

### A5. Website, data and marketing (all markets)

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| W-01 | **B2B only.** Selling only to businesses keeps consumer regimes out of scope: withdrawal rights, consumer price and information duties, and consumer-facing e-commerce accessibility rules | ◐ | SITE | State in every locale that offers are for commercial customers only; RFQ form has a business-use confirmation; no consumer price display. Keep WCAG 2.2 AA anyway | C |
| W-02 | **GDPR applies and an EU representative is likely needed.** A non-EU company that offers goods to people in the EU, or monitors them, without an EU establishment needs a representative under Art. 27. Signals regulators weigh: EU languages, EU shipping, EU-targeted support, analytics. The occasional-processing exemption is narrow. A Dutch authority reportedly fined a non-EU website operator EUR 525,000 for not appointing one | ✔ | SITE | Appoint an EU representative before launch and name it in the privacy notice, or set up an EU establishment | C, L |
| W-03 | **International transfers**: the sales mailbox is in Ukraine, which has no EU adequacy decision (◐). Whether direct collection by a non-EU controller is a "transfer" is debated | ○ | SITE | Prefer EU-hosted processing and an EU email provider; use standard contractual clauses wherever an EU processor forwards data to Ukraine; counsel decides | L |
| W-04 | **Privacy notice** (GDPR Art. 13) per locale: purposes, legal basis (legitimate interest for B2B inquiries), retention, processors, recipients, rights, complaint to a supervisory authority | ◐ | SITE | Counsel writes or reviews each locale; link in every footer and next to the form | L |
| W-05 | **ePrivacy and cookies**: cookieless analytics and no third-party requests mean no consent banner is needed for storage access (◐). National rules differ if anything is stored: DE TDDDG §25, FR CNIL guidance (rejecting must be as easy as accepting), NL Telecommunications Act 11.7a, PL telecom or electronic communications law, CZ Act 127/2005 (opt-in) | ◐ | SITE | Keep the site free of cookies and local storage for non-essential purposes (SPEC D8, §13). Re-check before adding any tool | C, L |
| W-06 | **Provider identification** on the site, per country (see DE-01, NL-01, PL-02, FR-02, CZ-02). It is unclear whether national rules bind a non-EU provider; one French ministerial answer suggests not for foreign e-commerce sites | ✔ / ○ | LOCALE | Publish company name, legal form, address, register number, VAT ID, contact and a named responsible person in every locale | C, L |
| W-07 | **Cold e-mail consent differs by country** (DE: consent needed even in B2B; NL: legal persons treated more freely; FR: allowed if relevant to the person's role, with opt-out; PL and CZ: consent regimes). Cold calls are also regulated | ◐ | n/a | No cold e-mail in any market until counsel confirms per country; use LinkedIn, phone, post and fairs, and e-mail only after consent | C, L |
| W-08 | **Photo rights**: project and factory photos need permission from venue owners; recognisable people need consent | ◐ | SITE | Keep written permissions with the media files | C |
| W-09 | **Terms of sale and supply** (see T-05, T-06) | ◐ | QUOTE | Publish only after counsel review | L |

---

## Part B — Country constraints

### B1. Germany (DE) — locale `de`

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| DE-01 | **Impressum** under §5 of the Digital Services Act (DDG): name, legal form, address, e-mail plus a second fast contact, register number, VAT ID if any, responsible representative | ◐ | LOCALE | See SPEC §13; counsel reviews | C, L |
| DE-02 | **Cookies and storage**: §25 TDDDG requires consent for non-essential storage or access | ◐ | LOCALE | Stay cookieless (W-05) | C |
| DE-03 | **Cold e-mail**: §7 UWG requires prior consent for advertising e-mail, including to businesses | ◐ | n/a | See W-07 | C |
| DE-04 | **Language of documents**: German assembly, care and safety information is expected by buyers and is required where the product reaches consumers | ◐ | SHIP | Prepare German care and safety sheets | C |
| DE-05 | **Accessibility act (BFSG)** applies to consumer-facing e-commerce services, not to B2B-only | ◐ | WATCH | Keep B2B-only (W-01) | C |
| DE-06 | **Packaging law (VerpackG, LUCID register)**: the party that first places filled sales packaging on the German market must register and participate in a take-back system. Direct B2B deliveries from abroad are unclear; the PPWR will replace the national regime in steps | ◐ / ○ | SHIP | Ask a packaging-compliance advisor; see X-09 | C, L |
| DE-07 | **Fire rules for venues**: state building rules for assembly and accommodation venues can require flame-retardant seating or upholstery in specific cases | ◐ | QUOTE | Offer S-06 test reports for upholstered models; check per project | T, C |
| DE-08 | **Marks German buyers know**: Blauer Engel (RAL-UZ 38), Goldenes M (DGM), GS mark, FSC, PEFC | ◐ | WATCH | See C-03 | C |
| DE-09 | **Supplier questionnaires** (LkSG, CSRD) | ○ | QUOTE | See X-13 | C |

### B2. Netherlands (NL) — locale `nl`

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| NL-01 | **Website identification**: Dutch Civil Code art. 3:15d expects name, address, e-mail, Chamber of Commerce (KvK) number and VAT ID for information-society providers. A foreign provider has no KvK number; whether the rule binds it is unclear | ◐ / ○ | LOCALE | Show company data in the Dutch locale (name, address, e-mail, registration number, VAT ID); ask a Dutch lawyer about the KvK point | C, L |
| NL-02 | **Language**: no statutory Dutch-language requirement for B2B pages was found; Dutch is required for consumer information. Buyers still expect Dutch product facts | ○ | LOCALE | Native-reviewed Dutch copy | C |
| NL-03 | **Cookies**: Telecommunications Act art. 11.7a requires consent unless the cookie is functional or has limited privacy impact | ◐ | LOCALE | Stay cookieless (W-05) | C |
| NL-04 | **Marketing e-mail**: consent for natural persons; legal persons are treated more freely; sole traders count as natural persons | ◐ | n/a | See W-07 | L |
| NL-05 | **Product safety authority**: NVWA enforces product safety; GPSR duties apply | ◐ | SHIP | See X-04 | C |
| NL-06 | **Packaging EPR**: Dutch producer-responsibility rules and the packaging waste fund. Obligations of foreign sellers need checking | ○ | SHIP | See X-09; ask a Dutch advisor | L |
| NL-07 | **Payment terms and public buyers**: Dutch law limits payment periods imposed by large companies on SMEs to 30 days (◐). Dutch public buyers apply national sustainable-procurement criteria for furniture, including legal and sustainable timber (FSC or PEFC or equivalent) | ◐ | QUOTE | Offer 30-day terms to Dutch SME customers or confirm with counsel; get FSC or PEFC if public buyers are a target (C-01) | C |
| NL-08 | **Fire rules for hospitality**: no national statutory test for loose chairs was found; contract buyers specify EN 1021 | ○ | QUOTE | See S-06 | T |

### B3. Poland (PL) — locale `pl`

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| PL-01 | **Language**: the Polish language act requires Polish for consumer information, instructions and warranty; B2B contracts are free in language. Not confirmed in this research | ◐ | LOCALE | Polish copy; Polish care and safety sheets for any consumer-facing resale | C |
| PL-02 | **Provider identification**: the act on electronic services expects name, address, e-mail and tax number | ◐ | LOCALE | Show company data in the Polish locale | C |
| PL-03 | **Cookies and e-mail marketing**: consent-based regime; applies to B2B e-mail as well | ◐ | LOCALE | Cookieless site (W-05); no cold e-mail (W-07) | C, L |
| PL-04 | **BDO register and packaging duties**: a foreign entrepreneur without a Polish branch registers with the Marshal of the Mazowieckie Voivodeship; an administrative decision treated a foreign seller of packaged goods to a Polish buyer as obliged to register. Whether a Polish importer takes the duty over is unclear | ✔ / ○ | SHIP | See X-09; confirm with a Polish advisor before the first direct shipment | L |
| PL-05 | **Market surveillance**: the consumer and competition office (UOKiK) and the trade inspectorate enforce product safety | ◐ | SHIP | See X-04 | C |
| PL-06 | **Transit risk**: Poland is the main road-transit and border country; the road transport agreement is contested by Polish hauliers (T-01) | ✔ | QUOTE | Plan alternative routes and carriers | C, B |

### B4. France (FR) — locale `fr`

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| FR-01 | **French language** (Toubon law, 1994): designation, offer, presentation, instructions and warranty of goods must be in French. Contracts with foreign parties may also have a foreign-language version. Applicability to a B2B website is debated | ✔ / ○ | LOCALE | Treat French as required for product information, quotes, terms and labels aimed at French buyers; native-reviewed copy | C, L |
| FR-02 | **Mentions légales** (LCEN, art. 6-III): publisher identity, address, capital and trade register number if any, a named publication director, and the host. A ministerial answer suggests the duty cannot be imposed on foreign e-commerce sites | ✔ | LOCALE | Publish the full set in French regardless | C |
| FR-03 | **Furniture producer responsibility (REP, éléments d'ameublement)**: a "metteur sur le marché" includes foreign companies selling products in France, including remote sellers. Professional furniture (restaurant and hotel seating and tables) falls under Valdelia; household furniture under Éco-mobilier. Contributions follow an annual scale | ✔ (Valdelia) / ◐ | SHIP | Decide who is the producer in France. If a French importer is the first to place goods, it carries the duty; if you ship direct to French customers, register with Valdelia or use an authorised representative | C, I, L |
| FR-04 | **AGEC law details**: sorting-information logo (Triman) and visible eco-contribution on invoices | ○ | SHIP | Ask a French advisor whether they apply to professional furniture | L |
| FR-05 | **Fire safety in public premises (ERP)**: restaurants and hotels are ERP (◐). Reaction-to-fire rules apply only in ERP, not in homes. Materials are classified under the order of 21 Nov 2002; seating in assembly rooms can fall under article AM 18; upholstered seating is assessed with EN 1021-1 and -2 | ✔ / ◐ | QUOTE | For upholstered models, offer S-06 reports and check the venue category with a fire consultant | T, L |
| FR-06 | **Marks French buyers know**: NF Environnement Ameublement (FCBA tests, AFNOR licence), NF Mobilier professionnel, PEFC, FSC | ✔ / ◐ | WATCH | See C-03 | C |
| FR-07 | **Payment terms**: French commercial code art. L441-10 caps B2B terms at 60 days from invoice date or 45 days from month end, with late-payment penalties. Applicability to a non-French supplier needs checking | ◐ | QUOTE | Keep terms within the cap for French buyers | C, L |
| FR-08 | **Cookies**: the data authority (CNIL) requires that refusing is as easy as accepting; audience-measurement exemptions depend on configuration | ◐ | LOCALE | Stay cookieless (W-05) | C |
| FR-09 | **B2B e-mail prospecting**: allowed if relevant to the person's role, with prior information and opt-out | ◐ | n/a | See W-07 | L |

### B5. Czech Republic (CZ) — locale `cs`

| ID | Constraint | Conf. | Gate | What the project must do | Owner |
|---|---|---|---|---|---|
| CZ-01 | **Language**: the consumer protection act (634/1992) requires Czech information for consumer goods; B2B is free. Not confirmed in this research | ◐ | LOCALE | Czech copy; Czech care and safety sheets for consumer-facing resale | C |
| CZ-02 | **Provider identification**: act 480/2004 on information-society services and the Civil Code expect business identification | ◐ | LOCALE | Show company data in the Czech locale | C |
| CZ-03 | **Cookies and commercial e-mail**: act 127/2005 (cookies, opt-in) and act 480/2004 (commercial communications, consent) | ◐ | LOCALE | Cookieless site (W-05); no cold e-mail (W-07) | C, L |
| CZ-04 | **Packaging EPR (EKO-KOM)**: a foreign company may appoint a Czech authorised representative for packaging it supplies. Sources conflict on the governing act (477/2001, 541/2020 or 542/2020) and on small-business exemptions (for example turnover under CZK 25 million and under 300 kg of packaging a year) | ✔ / ○ | SHIP | See X-09; confirm with EKO-KOM or the ministry | L |
| CZ-05 | **Standards and certification**: the same EN standards apply as Czech national adoptions (ČSN EN); no extra local test or mark was found | ○ | WATCH | Confirm with the importer | C |

---

## Part C — Locale activation matrix

A locale goes `live` only when its row is clear. `SITE` items apply to every locale from day one.

| Locale | Must be closed before going live (beyond all `SITE` items) | Must be closed before first quote or shipment in that market |
|---|---|---|
| `de` (launch) | DE-01, DE-02, W-06 | X-01, X-02, X-04, X-08, X-09, S-01, S-02, T-01 to T-06, DE-04, DE-06, DE-07 |
| `en` (launch) | none beyond `SITE` | as for the target buyers' country |
| `nl` | NL-01 to NL-03, W-06 | NL-05 to NL-08 and the shared items above |
| `pl` | PL-01 to PL-03, W-06 | PL-04 to PL-06 and the shared items above |
| `fr` | FR-01, FR-02, FR-08, W-06 | FR-03 to FR-07 and the shared items above |
| `cs` | CZ-01 to CZ-03, W-06 | CZ-04, CZ-05 and the shared items above |

`SITE` items: X-05, X-11, W-01 to W-05, W-08.

## Part D — Questions for local counsel and advisors

1. **All markets:** does GPSR cover furniture sold only to businesses for hospitality use, and who is the "economic operator" in each sales model (X-04)?
2. **All markets:** in which sales models must the company itself, rather than the importer, register for packaging EPR (X-09, DE-06, NL-06, PL-04, CZ-04)?
3. **EU representative:** is one required for this site and form, and which entity should it be (W-02)? How should data flowing to the Ukrainian sales team be covered (W-03)?
4. **France:** are Valdelia registration, the Triman logo and a visible eco-contribution required for professional furniture sold to French buyers, directly or through an importer (FR-03, FR-04)? Does the Toubon law apply to a B2B-only site (FR-01)?
5. **Netherlands:** does art. 3:15d apply to a non-EU provider without a KvK number (NL-01)? What payment-term limits apply (NL-07)?
6. **Poland and Czech Republic:** current packaging-EPR rules and thresholds for foreign sellers (PL-04, CZ-04); language rules for B2B documents (PL-01, CZ-01).
7. **EUDR:** which CN codes and subheadings of the amended Annex I cover each model, and what Ukraine's risk category means for the importer's checks (X-01)?
8. **Customs broker:** HS codes, duty under the DCFTA, origin proof, and the right Incoterms and VAT set-up (T-02 to T-04).

## Sources (accessed 2026-11-05; mostly secondary)

- EUDR: [EY tax news](https://taxnews.ey.com/news/2026-0237-eu-deforestation-regulation-application-postponed-to-30-december-2026), [European Commission Access2Markets](https://trade.ec.europa.eu/access-to-markets/en/news/delay-until-december-2026-and-other-developments-implementation-eudr-regulation), [EUSTAFOR](https://eustafor.eu/eudr-what-the-commissions-4-may-2026-simplification-package-means-for-wood-state-forests-and-non-eu-operators/), [iCustoms](https://www.icustoms.ai/blogs/eudr-news-updates/), [ComplianceGate](https://www.compliancegate.com/eudr-furniture-requirements/)
- Formaldehyde: [Eurofins](https://www.eurofins.com/en/consumer-product-testing/softlines-hardlines/news-articles/new-eu-formaldehyde-limits-for-furniture-how-to-comply-with-reach-entry-77-before-august-2026/), [FIRA](https://www.fira.co.uk/news/article/european-rules-on-formaldehyde-emissions-from-furniture-now-in-force), [CATAS](https://catas.com/en-GB/news/exemptions-for-the-new-european-reach-restriction-on-formaldehyde)
- GPSR: [Brodies](https://brodies.com/insights/public-law-and-regulation/navigating-compliance-with-the-general-product-safety-regulation-key-obligations-for-manufacturers/), [Obelis](https://www.obelis.net/services/representation/general)
- Standards: [EN 16139:2025](https://genorma.com/en/standards/en-16139-2025), [EN 15372:2023](https://genorma.com/en/standards/en-15372-2023), [EN 12521](https://www.dinmedia.de/en/standard/din-en-12521/374502387), [EN 1021 ignitability](https://measurlabs.com/products/en-1021-1-en-1021-2-upholstered-furniture-ignitability/)
- PPWR: [Coolset](https://www.coolset.com/academy/ppwr-authorised-representative), [ppc.land](https://ppc.land/eu-packaging-law-forces-sellers-to-register-in-up-to-27-countries/)
- GDPR Art. 27: [IAPP](https://iapp.org/news/a/representatives-under-art-27-of-the-gdpr-all-your-questions-answered), [Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2021/06/gdpr-fine-for-failure-to-appoint-an-eu-representative)
- Trade: [EU–Ukraine road transport agreement](https://transport.ec.europa.eu/news-events/news/eu-and-ukraine-extend-road-transport-agreement-until-31-march-2027-2025-09-25_en), [DCFTA origin (Asters)](https://www.asterslaw.com/press_center/publications/trade_with_the_eu_preferences_and_ip_rights/), [TheTradeHub, heading 9401](https://www.thetradehub.eu/es/customs/origin/preferential/eu-ukraine-dcfta/9401)
- ESPR: [Furniture News](https://furniturenews.net/resources/the-esprs-dpp-countdown), [Renoon](https://www.renoon.com/digital-product-passport-furniture)
- Wooden packaging: [IPPC Ukraine](https://www.ippc.int/fr/countries/ukraine/implementationispm/2024/12/implementation-of-ispm-15-in-ukraine-5), [Agrinfo](https://agrinfo.eu/book-of-reports/eu-import-requirements-for-wood-packaging-material-explained/)
- France: [Valdelia member guide](https://valdelia.org/wp-content/uploads/Guide_bienvenue_Adherents_DEA_2025.pdf), [Valdelia perimeter](https://valdelia.org/wp-content/uploads/28102024_Perimetre_Valdelia_mobiliers_concernes.pdf), [ERP fire guide](https://manutan-collectivites.fr/media/wysiwyg/guide-feu-erp-mc.pdf), [CMS on mentions légales](https://cms.law/fr/fra/a-la-une/editeurs-de-site-internet-soignez-vos-mentions-legales), [NF Environnement certificate example](https://www.haworth.com/content/dam/digital/int/unpublished/tibas/tibas_certificate_nf-environment_2027-07_fr_en.pdf)
- Netherlands: [business.gov.nl checklist](https://business.gov.nl/starting-your-business/checklists-for-starting-a-business/how-to-start-an-online-business-a-checklist/)
- Poland: [pit.pl on BDO](https://www.pit.pl/?p=26636), [administrative decision](https://mazovia.pl/resource/58632/179450/decyzja_831_23_OS.docx.pdf)
- Czech Republic: [EKO-KOM authorised representative](https://www.ekokom.cz/?p=10296), [EKO-KOM clients](https://www.ekokom.cz/en/clients/)
