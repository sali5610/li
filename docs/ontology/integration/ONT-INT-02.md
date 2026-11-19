# ONT-INT-02 · Safe native Dialog + localhost L09 React integration

**Implementation candidate, DRAFT, not merged or deployed.** This work inherits [ONT-INT-01 source tree PR #150](https://github.com/sali5610/li/pull/150) and applies the existing UX-DS-35 canonical Dialog behavior from [DS #134](https://github.com/sali5610/li/pull/134) without replacing the entire ONT `site/index.html`.

## Exact bounded source owners

- `site/index.html`: original ONT Search localhost gate and `laoly-quote-stage-gate.js` remain. Two old modal functions and one keydown owner replaced with the **exact shared DS #134** functions: modal open/inert/restore, link+select+textarea+summary+tabindex focusable filtering, full Tab/Shift+Tab/Escape and opener restoration. Added one **double-guarded inline localhost-only script loader** that checks HTTP, localhost/127.0.0.1, exact `/site/index.html` path, lesson ID `L09-1-2` and `li-react=l09` or `l09-native-fixture` before fetching the React router script.
- `site/assets/step16-react-router.js`: research-only native bridge from Step16.2 / Stage02B [#148](https://github.com/sali5610/li/pull/148). Loads an **uncommitted, locally compiled** module only after explicit opt-in. A failed CSS/JS/mount keeps native challenge/rubric visible; success hides/inerts original challenge/rubric only and retains real native pedagogy.
- `site/assets/lesson-l09-hifi.js`: upstream Step16 fixture edits preserving authored content; local-only synthetic `step16.l09.shared-native-fixture.v1` key, native guided/locale field-specific patch after React handover, stale native challenge writes refused. Unflagged code still owns real native key.
- `site/assets/library-hub.js`: skip real learning visit recording **only for exact localhost L09 research flag**; normal app visits unchanged.
- `tools/step16-real-l09-react-island/`: updated from the latest exact #148 researched tree pinned at time of this integration; research module source only. Do not bundle into production.

## Required acceptance layers

- In one actual branch (not temporary overlay), source test validates ONT quote/Search and DS modal single ownership + no compiled bundle tracked.
- Existing CI on changed `site/index.html` must run real native ONT quote/no-spoiler browser QA (189 cases) and Design System regression; CI with no real device is not physical Safari.
- New test: actual native `site/index.html` iframe via Chromium, Buddy + Check-in opener, background inert, Tab/Shift+Tab focus wrap incl appended synthetic anchor/select, Escape and focus return, native Search fallback and unchanged private learner key/visit history. QA DOM-key events are synthetic; mounted browser is real Chromium.
- New 23-case L09 shell fixture: flag OFF, localhost React on, VI/EN/synthetic handover, exact native/React ownership and data isolation, rollback path, 390/820px; uses synthetic key only.
- Native L09 original theory and Wave1 manuscripts remain byte-identical except isolated synthetic-key data plumbing. No Google invite/RLS or cloud sync acceptance implied.

## Gate truth

ONT-03C pending curriculum, optional vector OFF, G2/physical iPhone/iPad Safari/G4 and signed Google invite/RLS still OPEN. VoiceOver `OUT_OF_SCOPE_PO_S208`, not PASS. No main merge, Cloudflare build/deploy or Neon DDL. CI uses GitHub Actions runner minutes; do not claim zero preview consumption unless measured.
## Pinned CI-only external source fixture (not integrated DB code)

The imported React #148 private invite synthetic suite reads `db/migrations/0002_invite_only_access.sql`, which is deliberately not included in ONT-INT-01/02's `db/` source scope. The initial integration Actions suite stopped on `ENOENT` before browser QA, although the preceding source/ONT/Design System and 189/189 native quote checks passed. This was **not** an observed Neon RLS failure. To keep all negative invite tests executable without adopting or deploying Auth database code, the draft-only ONT-INT-02 workflow checks out immutable React #148 commit `fb292e6210666b5371085cb5dfee1fb8b763e9fc`, verifies Git blob `6eb6c73c81596d4ecf199137ff3741b75576a42c`, then copies that file to the **disposable CI workspace only** before running synthetic test suites. The file remains untracked in the actual Git tree and no SQL migration is applied. Its CI use cannot establish signed production RLS or release clearance.
