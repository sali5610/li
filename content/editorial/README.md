# L09-1-1 — editor-only bilingual source snapshot

**Status:** EDITORIAL REVIEW, NOT A LEARNER RELEASE · 2026-11-20.
**ID/course:** `L09-1-1` / `C09-1` — Population, Sample & Variable Types, preceding live L09-1-2.
**Canonical navigation:** 8-group catalog retains this lesson as an outline (`published: false`).
**Source file:** [L09-1-1.cms.v1.review.json](L09-1-1.cms.v1.review.json).

## What actually moved
This file is the **exact Git blob `75475cc365aaa15543af43d8c0d52b79bf48086c`**, reused unchanged from the pre-existing GitHub editorial pilot at [`docs/editorial/wave2-cms-l0911/L09-1-1.cms.v1.staging.json`](https://github.com/sali5610/li/blob/content/wave2-l0911-cms-offline-20261118/docs/editorial/wave2-cms-l0911/L09-1-1.cms.v1.staging.json). Original authoring is at [W2A · L09-1-1 VI/EN Notion](https://app.notion.com/p/41b6cf6db72a8149b622ed4b789860fc); `source.locale_source_hash_fnv32` and all sections are preserved. This promotion makes its editorial artifact discoverable under the GitHub content source tree **without publishing or cloning a second CMS**. Notion remains provenance/history, not runtime.

Contains the VI/EN hooks and explanations; population/sample/parameter/statistic and categorical/discrete/continuous/ordinal ID distinctions; a separate original guided example; L2-T06 primary and optional L2-T07 with separate attempt/feedback; four-answer independent fictional 320/256 case, rubric and answer reveal after submission; six Lão Lý contexts. Reuse the previously passed [58-case Node contract / 25-case in-memory Chromium evidence](https://app.notion.com/p/41c6cf6db72a8174b46dc2983c1ee1b9), NOT real-origin/iPhone/VoiceOver verification. Inspectable client source contains pedagogical model answers; UX reveal is not secure exam storage.

## Evidence and release exceptions
| Item | Current editorial decision |
| --- | --- |
| Population/sample and variable definitions | First-party learning explanation, grounded by [OpenStax Statistics 2e §1.1](https://openstax.org/books/introductory-statistics-2e/pages/1-1-definitions-of-statistics-probability-and-key-terms), [§1.2](https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling), and [NIST Populations and Sampling](https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc134.htm); links are `reference_only`, not imported textbook text |
| OpenStax reuse rights | Their published materials carry reuse conditions (CC BY-NC-SA and use-case restrictions). Do not reproduce figures, exercises or substantial book passages; a separate use/permission review is required for reuse in an AI-related product |
| External visual | Population-versus-sample image by Loneshieling is **CC BY-SA 4.0**, NOT public domain. Attribution, modification disclosure, license URL, suitable mobile alternate text and UI approval are still open |
| Quote and Lão Lý source | Quote provenance/translation and rights are unresolved for release; no blanket quote-bank clearance |
| Ordinal 1–5 measurement | Academic/statistics reviewer still needed before release; a single ordinal item must not be silently treated as continuous/equal interval |
| Publication | Wave2 no-deploy instruction respected: no `site/`, app route, auth, Neon, syllabus ID or production change; no PO release approval inferred |

**Guard:** `tools/build_content_packs.mjs` ingests `content/lessons/*.json` only. This file is under `content/editorial/` specifically so it remains excluded from `site/content-packs/`, Tra Cứu and user progress. **Do not move it to `content/lessons/` or set `published=true` until reviewed.** The old separately isolated DOM pilot is reference-only and is not another testing environment. No new cost.

**Next useful step:** Resolve the small explicit content/rights gate for this *one* lesson, then adapt its already-authored text to the shared canonical lesson structure and real React learner flow. Do not repeat the 58/25 unaffected offline pilot checks; do focused new-integration QA only.
