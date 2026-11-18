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

## S157 — Standalone DOM preview (still NOT deployed)

An **isolated browser preview** now exists entirely under `docs/editorial/wave2-cms-l0911/`:

- `L09-1-1.preview.html`: localized landmarks, content navigation, contextual Lão Lý panel, accessible Spellbook dialog, explicit no-release label.
- `L09-1-1.preview.css`: neutral responsive layout, 390px viewport overflow checks, 44px target baseline, reduced-motion rules. **Not G2 visual-identity signoff**.
- `L09-1-1.preview.mjs`: same-origin static JSON CMS loader + pure-state module adapter; T06/T07 independent feedback gates, independent input/submission/explicit answer reveal and rubric, focus management, VI/EN switching, localStorage fallback, per-lesson mentor questions.

Launch **locally only**, after checking out this branch (do not publish the folder):

```bash
cd docs/editorial/wave2-cms-l0911
python3 -m http.server 8765 --bind 127.0.0.1
# Open http://127.0.0.1:8765/L09-1-1.preview.html in a local browser
```

**Verification executed in this session:**

- [26/26 PASS static preview source/ARIA wiring checks](qa/L09-1-1.preview-source-20261118.json) against exact GitHub staging source.
- [12/12 PASS in-memory headless Chromium DOM smoke checks](qa/L09-1-1.chromium-inmemory-fixture-20261118.json) against controller HTML/CSS with **synthetic structurally compatible CMS and locally reconstructed state test API**; direct loopback and file navigation were blocked by this sandbox's browser administrator. Do NOT call this full actual-CMS browser regression.
- [52/52 PASS existing pure state/CMS V8 checks](qa/L09-1-1.v8-contract-20261118.json) against actual staged JSON and source state.

A **local-server Playwright suite targeting the exact staged files** is prepared at `qa/smoke-local-chromium.py`, but has **not been run** in this restricted environment. It is optional and requires the free Python Playwright/Chromium installation. Browsers with real origin/localStorage, physical iPhone/Safari/VoiceOver, source rights, and app-shell integration remain **OPEN**. Model answers remain client-inspectable in CMS; this is an **educational UX reveal gate**, never secure testing infrastructure.

**Release scope correction:** The latest Product Hub clarification scopes “no deploy” to unpublished Wave2/3 curriculum; unrelated product UI may follow other approved workflows. This pilot remains explicitly **NO WEB DEPLOY, NO site/ edits, NO main merge**. New paid cost **0 VND**.

## S159 — Exact-CMS Chromium E2E, root-cause fix and regression evidence (2026-11-18)

**Verified source:** current exact GitHub branch CMS/stage modules are SHA-matched before the browser session (not the earlier synthetic 9 KB fixture). The authoring CMS contains the full bilingual 41.8 KB UTF-8 content. Current staged state, controller, HTML and CSS are loaded as the actual source text.

**The browser test really executed:** [QA script](qa/exact_cms_chromium_inmemory_e2e.py) and [25-pass report](qa/L09-1-1.actual-cms.chromium-inmemory-20261118.json). Chromium ran **25/25 PASS** on actual source/real learner events: Hook First, gated model answer, stage-specific mentor, T06/T07, Spellbook/Escape, VI/EN, 4-answer independent submit and incomplete handling, rubric, focus and nav stage, retry and archived method history, simulated reload, denied/corrupt storage handling, 320/375/390/402/768/1280 responsive widths and ARIA structural checks. Source screenshots are local to the private test environment, not identity-approved assets.

**One verified FAIL found and fixed:** before this patch, typing a T06 draft and reloading caused the T06 classification/reasoning inputs to reset. The identical T07 draft had the same underlying volatile-state problem. Fixed **both** by storing method draft values under `state.methods.T06/T07.draft` via `Pilot.setMethodDraft`. The browser controller autosaves on each method input event; restoring a previous v1 state without `draft` fields now safely migrates, and retry archives old evidence but clears the new attempt. Re-test passed. The real Node runner on the updated exact files now reports **58/58 PASS**, with [recorded contract evidence](qa/L09-1-1.node-contract-58-20261118.json) including 6 new migration/draft/retry cases. The earlier 52/52 and synthetic 12/12 records are historical, not the latest result.

**Scope of browser simulation:** local browser navigation to `http://127.0.0.1`, `file://` and `data:` fails with `ERR_BLOCKED_BY_ADMINISTRATOR`. To actually execute the **real** controller/state ES modules in Chromium, the harness loads their exact contents through in-memory Blob modules, changes only the local module import URL, and supplies the **real** CMS JSON through a fetch shim; an isolated Storage shim permits reload-state checks. The on-disk sources were also served through a local HTTP server and independently retrieved by Python with byte equality (4/4), but Chromium was **not able to navigate to the server**. Therefore **real-origin native localStorage, networking, Safari/iPhone, VoiceOver and PWA remain NOT TESTED**, and QA28/G2/G3/G4 remain OPEN. These are authentic source-based browser integration tests but **not a complete browser-origin production acceptance**.

**Re-run from checked-out staging branch, with free Node and Python Playwright + Chromium installed:**

```bash
node docs/editorial/wave2-cms-l0911/run-l0911-offline.mjs
python docs/editorial/wave2-cms-l0911/qa/exact_cms_chromium_inmemory_e2e.py
```

The browser script intentionally pins the known file blob SHAs: if the CMS/controller/state changes, verify the new source and update pins before calling a later result a pass. The separate `qa/smoke-local-chromium.py` real-origin suite still must be executed on an environment where loopback navigation is permitted.

**Policy:** no `site/` changes, no merge, no deploy, no public preview, no Wave1 edits and no new paid costs. Main has moved independently; recheck branch divergence and app-shell compatibility before any future integration.
