# Wave 1 Structured Content Migration — Assessment Staging

This directory holds **non-production editorial JSON snapshots** for the three PO-locked lessons:

- `L09-1-2` — Sampling Bias (Wave 1A)
- `L03-1-2` — Interview Bias (Wave 1A)
- `L15-2-2` — Reorder Point & Safety Stock (conditional Wave 1B)

## Source of truth and authority boundary

- **Google Sheets staging**: https://docs.google.com/spreadsheets/d/1AbLTcXOxTlZ135fFynQ9D2A8A-DLshg5m2H12_9bj_0/edit
- **Editorial original and decisions**: https://app.notion.com/p/41b6cf6db72a81a2929dce9a126a43ee
- **Existing runtime JS**: `site/assets/lesson-l09-hifi.js` and `site/assets/lesson-wave1-core.js`

The three `assessment/*.json` files are **read-only review snapshots**, not changes to canonical runtime content. They contain exact currently published JavaScript assessment strings in both VI/EN. They **must not** be loaded into the existing app until user-authorized cutover and full QA.

## Current staging contract

Each lesson includes independent scenario, 4 questions per language, optional assisted hint, aggregate model answer, a post-submit 4-criterion rubric (0–2 each), a guided unscored hint, and UI gate rules. Semantic question order must align across VI/EN. **Do not force a fake one-question-to-one-answer mapping**, particularly for L03 where the solution is an aggregate example-based response.

Run `node tools/validate_wave1_assessment_staging.mjs` from the repository root. It compares the JSON snapshot against the current source text, checks stored Git blob SHA and selected structural no-spoiler guards. The check is **not** a browser simulation or proof of accessible UX. The original 285 raw Notion blocks and companion Lão Lý manifests are preserved separately in Google Sheets.

## Release boundary

No edits to `site/`, no merge to `main`, no GitHub Pages deploy, no PO-locked wording change; no fees. Outstanding: 285-block semantic QA, source/license audit, real browser/iOS/VoiceOver tests, G2/G3/G4/QA28 and explicit Human PO release gate.
