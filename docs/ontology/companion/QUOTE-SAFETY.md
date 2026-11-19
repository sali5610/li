# ONT-04C1b · Source, attribution and quotation-rights safety audit

**DRAFT ONLY · Metadata review, not quote text clearance, no live rendering and no app deployment.**

This task follows [ONT-04C1 context contract](README.md) and [S76/S77 approved Lão Lý cultural voice](https://app.notion.com/p/41b6cf6db72a8190b542daed8017d949). The current canonical source is the actual [24-quote S121 browser bank](https://github.com/sali5610/li/blob/architecture/ont04c1b-laoly-quote-source-safety-20261119/site/assets/laoly-quotes-s121.js), **not** the obsolete Cụ Lâm texts or an imagined quote bank. Three Wave1 native source files refer to a 17-ID subset; a source reference does not imply publication approval or permission to quote.

## Actual data inventory and gates

- `site/assets/laoly-quotes-s121.js`: **24 unique quote IDs**, each with source URL, original language, source-attribution label and VI authored interpretation; `QUOTES_EN` has 24 matching English metadata entries.
- `site/lessons/companion/{L09-1-2,L03-1-2,L15-2-2}.json`: 3 × 6 = **18** stage records, each containing exactly 4 quote alternative IDs and 1 selected quote ID, **90 total references / 17 unique bank IDs**, no missing references at baseline. These are **editorial candidates**.
- New `quote-safety-policy.v0.1.json`: each quote must separately pass original-text/edition authentication, attribution (including fictional speaker versus historical writer), VI/EN translation reuse rights, geographic rights for the intended distribution, contextual relevance and no-spoiler rules. Currently **0/24 independently cleared** for new integration. A URL and a bilingual gloss are **not** themselves legal clearance or source authentication.
- `quote-safety.mjs` is a **metadata-only fail-closed inspector**. It never returns an original quote or translation, author wording, executable action, source-derived academic claim, private learner answer or lesson route. Valid source ID on `opening/concept/guided` returns `WITHHELD_SOURCE_RIGHTS_UNREVIEWED`, not permission to render. `independent/reflection/extension` always suppress quotes; `calmMode`, `debateMode`, `feedbackVisible` also suppress. Unknown ID, private input, untrusted locale and forged approval are denied.

## Limited external/primary-source observations — NOT clearance

**George E. P. Box**: [MacTutor's curated quotation page](https://mathshistory.st-andrews.ac.uk/Biographies/Box/quotations/) reproduces a Box model quotation and references a 1987 book. This is independent bibliographic corroboration, **not** an inspected facsimile of every exact word/version and not a grant to reuse a late-20th-century English quotation. Its `box-models` ID remains pending text/edition and reuse review.

**Virginia Woolf**: [Wikisource's 1929 Hogarth edition](https://en.wikisource.org/wiki/A_Room_of_One%27s_Own_(Hogarth_1929)) and [Library of Congress](https://www.loc.gov/item/29027524/) identify the work, while the [Authors Guild](https://authorsguild.org/news/public-domain-day-2025-faulkner-hemingway-woolf-steinbeck/) notes 1929 works entered the **US** public domain in 2025 but overseas rights must be checked. The `woolf-room` candidate remains pending edition/territorial/translated wording rights; one-country status does **not** authorize worldwide app reuse.

**Historical warnings from PO-approved S76/S77**: `Eppur si muove` has a historically **unverified Galileo attribution**; `Per aspera ad astra` must never be asserted as a verbatim Seneca quotation. **Neither is an ID in this actual 24-item S121 bank.** Do not invent/insert them as verified historical quotes. Avoid interpreting religious/Sanskrit source material as a game spell or reward. These warnings are recorded in policy, not quote content.

## Existing runtime risk (NOT fixed here)

The current browser `site/assets/laoly-quotes-s121.js` quote renderer hides cards during **buddy debate and calm mode**, but **does not itself check independent stage/reflection/extension, wrong/right feedback, territorial rights or a signed permission gate** before choosing a quote candidate. The three lesson manifests include quote alternatives for all six stages. The current S125 companion exposes lesson stage by reading local UI; **this offline audit does not patch or certify that runtime**. Its `legacyRuntimeSafetyFinding.severity = GATE_OPEN_DO_NOT_CLAIM_FIXED` is an intentionally honest blocker for future integrated UI QA.

## Validation — PR-only, no external APIs or copying text

```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
node tools/validate_pedagogy_ontology.mjs --check
node tools/test_offline_typed_search.mjs
node tools/check_search_publication_routes.mjs --check
node tools/check_companion_context.mjs --check
node tools/check_companion_quote_safety.mjs --check
```

The validator parses JSON literal arrays from the **actual checked-in browser script** without evaluating its JS or downloading/redistributing quotation text. It audits all 24 bank entries, 24 EN translations, 18 source stages, 90 references and 17 unique refs; evaluates **3 × 6 × 2 = 36** static lesson/locale/stage contexts; checks all are held/suppressed; rejects forged rights, incorrect IDs, injected attempts/emails/roles, missing source metadata and missing bilingual coverage. This is a **source/contract QA** exercise only, not a legal opinion, academic quotation authenticity signoff, copyright license, Stage14 user test, VoiceOver/Safari device QA or production source patch.

## Gated follow-up

- **04C1c editorial manual source review** (optional): assign quote-by-quote source edition evidence, exact attribution, VI/EN first-party gloss rights, source link health and country/legal distribution rules; seek real appropriate review before *any* text reuse. Keep review recorded in Notion, not as an asserted CI checkmark.
- **04C2 runtime**: integrate **after** real Google-only invited session and Neon A/B/C signed RLS, DS/React native one-writer QA, trusted independent submission and G2 approval. Add a single gate in the existing quote renderer before text is assigned, otherwise metadata-only hold is not sufficient. **Do not bypass when sessionStorage says submitted**.
- **ONT-03C academic population remains PENDING**. Live Search release still blocked by publication manifest. No merge, site edits, Cloudflare build or paid service in this PR. **Cost 0 VND**.
