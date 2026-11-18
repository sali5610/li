# L09-1-1 — Wave 2 CMS + offline state pilot (STAGING ONLY)

**Status (2026-11-18):** source-preserving bilingual editorial CMS extraction + pure state engine + unit-level offline QA. **NOT A WEB APP, NOT MERGED, NOT DEPLOYED**.

## Canonical sources and authority
- [Original current VI/EN lesson + six contextual Lão Lý stages](https://app.notion.com/p/41b6cf6db72a8149b622ed4b789860fc) — primary editorial source of truth (source revision fixed Q4 answer spoiler and split independent T06/T07 feedback).
- [S148 offline pilot build contract](https://app.notion.com/p/41b6cf6db72a814eac3bc875549e2789) — unique route, stage order, method enactment, progress key, assessment gate and a11y plan.
- [Step18](https://app.notion.com/p/4196cf6db72a815981f8cb558a8a4cb6) and [Step22](https://app.notion.com/p/4196cf6db72a81c1a09afc0b89f6c7bf) remain incomplete implementation backlogs.
- [Wave1 CMS staging pattern](https://github.com/sali5610/li/tree/content/wave1-cms-assessment-staging-20261118/docs/editorial/wave1-cms) is reference only; **never change Wave1 PO-locked data/runtime to pilot Wave2**.

## Deliverables
- `L09-1-1.cms.v1.staging.json`: source-preserved VI/EN hook, goals, concepts, variable types, guided content, real T06/T07 prompt and *separately gated feedback*, independent case with post-submit model answer and rubric, six contextual mentor moments and quote IDs, source/right attributes.
- `L09-1-1.state.offline.mjs`: isolated pure state machine, unique L09-1-1 storage namespace, method choice K2 vs actual attempt K3, independent submission/answer reveal/rubric, locale-switch/Spellbook-return preservation, retries with original evidence history, explicit hint flags K7 and unmeasured K5.
- `L09-1-1.contract-tests.mjs`: reproducible CMS/state behavioral assertions; `run-l0911-offline.mjs` is the Node CLI runner.
- `qa/L09-1-1.v8-contract-20261118.json`: **52/52 PASS** in the isolated code-mode V8 executor against the **actual three staged GitHub files**; this is **NOT a claim of Node CLI, CI, browser, mobile or VoiceOver execution**.

## Verify locally without publishing

```bash
node docs/editorial/wave2-cms-l0911/run-l0911-offline.mjs
```

No dependencies beyond Node standard library. Do not point a deployed site at this file. The bundle includes answer keys for offline authoring; its state gate controls **learner-facing visibility only**. Client-side JSON and localStorage are inspectable: it is not a secure exam backend.

## Content and method invariants
- Hook is first in VI and EN. Original intro 9/10 volunteers = 90% is distinct from independent 256/320. After editorial source correction, **no literal independent 80% answer in pre-submit content**.
- Primary T06 classifies A learner ID, B reopen count, C support priority, D measured duration, requiring reasoned response before its feedback. Optional T07 challenges 30/40 volunteer iOS inference and **has an independent feedback gate**. Skipping T07 cannot block the independent.
- Four independent answers and separate model/rubric after submit. Explicit incomplete submission is labeled incomplete/ungraded; model answer reveal is a separate action, not an automatic check.
- Six contextual Lão Lý stages with 3 IDs each. Reflection unlocked only after submit. Quote IDs existing does **not** clear exact quote source/translation/rights review; `box-models` remains unresolved at source-quotation level.
- New route `lessonL0911`, new root `page-lessonL0911`, local state namespace `li.review.L09-1-1.v1` are **proposed for integration only**, not registered in live `site/` files.

## Open acceptance gates / not yet claimed
- **Native app markup/route integration (Step22), actual DOM and focus, true a11y/mobile/persistence errors, device Safari and VoiceOver, visual G2, academic/media-rights source checks, editor/source translation signoff, Human PO release G3/G4, QA28.**
- Isolated **pure state** does not implement a browser localStorage adapter; `restore` tests only prove JSON reconstruction and corrupted input fallback.
- **K1 correctness cannot be automatically scored from arbitrary written answers; K5 delayed retention not measured.**
- Existing Wave1 W1-CMS branch and main site untouched. Only `docs/editorial/wave2-cms-l0911/` changed in this branch; do not merge, deploy or enable public preview without fresh owner authorization.

**New paid cost: 0 VND.**
