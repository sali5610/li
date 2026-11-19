# Step16 — exact L09-1-2 React + TypeScript island feasibility

**Research only. Not production, not approved G3, not a framework migration.** This pilot builds the *real* existing L09-1-2 challenge + self-review interaction in an isolated React 19 / TypeScript / Vite page, using the editorial payload extracted from current `site/assets/lesson-l09-hifi.js` rather than fake authored questions.

## Provenance, scope, boundaries

- `npm run extract` reads `site/assets/lesson-l09-hifi.js` and copies its actual `T.vi` and `T.en` source object into a generated JSON. Build fails if the 4 actual questions, rubric rows, translations or fields disappear. **No external source text is fetched**; source attribution and lesson ID stay with the existing course file.
- UI pilot includes actual original 4 free-text fields, assistance state, persistent draft, 12-character minimum per question, submit lock, snapshot of submitted answers, four 0–2 self-assessment criteria, completed-review flag and exact text/VI-EN switching. It does not claim automatic grading, cognitive scoring, mastery certificate or cross-device sync.
- The pilot writes only to **`step16.l09.react-island.v1`** on an isolated localhost origin, deliberately *not* `li.review.L09-1-2.v1`. No production state, privacy consent, public route, existing Design Library token or app screen is changed.
- CSS imports the actual approved generated token file and the existing runtime CSS in an isolated page, while adding only research-local layout adaptations. This is **not** a new approved visual design. The baseline version on public GitHub Pages is unaffected.
- Research CI builds + renders the pilot and proves state resume; tests may use fake strings but NOT fake lesson prompts. Existing native `site/index.html` remains the authoritative production baseline and should be compared again on actual mobile Safari before any G3 proposal.

### Reproduce locally

```sh
cd tools/step16-real-l09-react-island
npm install --no-audit --no-fund
npm run build
cd ../../
python3 -m http.server 8794 --bind 127.0.0.1 --directory .
# Browser: http://127.0.0.1:8794/tools/step16-real-l09-react-island/dist/
```

CI runs on GitHub Actions using isolated fake localStorage, Chromium and no paid SaaS. Direct dependency versions are pinned; lockfile needed before any approved production migration. No published URL or app route is created.

### Acceptance for framework pilot (not G3)

- exact editorial data + source hash, no new lesson text;
- initial render, VI/EN without discarding draft, four persisted free-text answers and optional hint, refuse premature submit;
- submit only if each answer has meaningful length, no AI grade; submitted answers frozen;
- rubric unlock on submit, rating 0/1/2 each criterion, total 0–8, complete only after all ratings;
- state survives reload, display truthful local-only status, reduced motion, keyboard labels and 48 CSS px target;
- no touching production storage and no network/account.

**Not measured yet:** actual code migration effort for the remaining 22+ native scripts, Web Vitals, complete Wave1 screen visual equivalence, iPhone/iPad Safari, VoiceOver, offline PWA, authentication or provider cost. Do not call this a completed React migration.


## Step16.2 — incremental React mount in the existing Vanilla L09 screen (DRAFT)

**Implementation boundary:** On an explicit local development URL only, React takes the L09-1-2 independent challenge and 0–8 self-rubric slots. Native content for goals, theory, diagrams, guided exercise, academic sources, bookmarks, site navigation, and non-L09 screens remains intact. The two old challenge/rubric DOM nodes are hidden and inert **only after** the React mount succeeds. If assets fail, the native lesson stays usable.

**Opt-in local URL** (no launch, no Cloudflare build, no account or cloud connection):

```sh
cd tools/step16-real-l09-react-island
npm install --no-audit --no-fund
npm run build:site-island
cd ../..
python3 -m http.server 8794 --bind 127.0.0.1 --directory .
# visit: http://127.0.0.1:8794/site/index.html?lesson=L09-1-2&li-react=l09
# remove &li-react=l09 to use the original Vanilla experience
```

This build generates `site/assets/step16-l09-island.js` and `.css` locally. The source branch **does not commit the generated build output**; the candidate loader never runs outside HTTP localhost / 127.0.0.1, even if a static site happens to contain the loader. It does not enable a production React route.

**Persistence:** React keeps using the synthetic research-only `step16.l09.react-island.v1` key. The live native key `li.review.L09-1-2.v1` stays owned by the existing app; React does not import, overwrite, sync, or migrate it. This prevents a dual-writer collision but is **not yet** cross-framework learner-state parity. The local native guided response is intentionally separate from the React challenge. No Auth, invite, consent or Neon Data API action is triggered.

**Shared UI primitive first slice:** `src/ui/Primitives.tsx` provides ActionButton, Surface and StatusMessage, reused by the React L09 challenge/rubric and scoped to the existing Design Library's CSS roles. `pilot.css` no longer overrides page-wide button, heading, body or form styles in the Vanilla shell; ordinary React controls are square and 48px minimum touch targets.

**QA acceptance:** The React workflow runs existing exact-source, bridge and localhost-auth Chromium suites; also builds the in-site bundle and exercises an 8-check real `site/index.html` integration fixture (flag OFF, mount/DOM ownership, preserved native pedagogy, static navigation, isolated local state, actual save, rubric gate and 390/820px smoke). This is synthetic Chromium only; NOT production, Safari/PWA/iPad, a live Google sign-in or a genuine A↔B privacy test.

**Still open before any migration/release:** one-writer native-key handover with backup/rollback and complete L09 parity, shared session/login/logout behind Step16.1 verified Google invite/RLS, design token audit for React, real-device/accessibility review and G2 human approval. No deployment is authorized by this PR.


### Step16.2 shared synthetic-key handover (local-only, no genuine learner data)

A second opt-in on the existing native app is `?lesson=L09-1-2&li-react=l09-native-fixture` and is **restricted to HTTP localhost / 127.0.0.1**. It uses a separate `step16.l09.shared-native-fixture.v1` localStorage key in both the native L09 script and the React bridge; **never** the genuine learner's `li.review.L09-1-2.v1` key.

The native L09 script still mounts the complete lesson and renders all academic sections. After React challenge/rubric mounts, the hidden/inert native challenge/rubric may not write any stale state. The still-visible native guided exercise can only patch its `guidedDraft` field; language changes may patch `locale`. Field-level writes read and preserve latest synthetic attempt data and unknown future fields. React uses its existing readback/stale-write guard to refuse overwrites after a native guided edit until explicit refresh. This is **not multi-tab transactional atomicity**, and has no claimed production migration.

The integration Chromium fixture now has **15 checks**, adding synthetic legacy hydration, React draft and unknown-field preservation, hostile stale native event, native guide partial update, React conflict refresh, submitted-attempt reload in Vanilla and true native-key non-mutation. All synthetic data is cleaned up in both success and error. Future production release still requires genuine-key backup/export/migration/rollback acceptance and one-writer proof under real cross-device conditions.

### Step16.2 follow-up: progress/resume projection and reversible dry-run

On the explicit localhost `l09-native-fixture` variant only, the mounted React pilot emits `li:l09-fixture-updated` **after confirmed local readback**. The native shell projects **only the separate synthetic key** to its lesson sidebar progress (0/1 until four-criterion self-review, then 1/1), resume label and nearby status text. The displays carry a visible “thử nghiệm/demo” distinction and do not represent certified mastery or public learner activity. The real `li.review.L09-1-2.v1`, `li.private.lesson.visits.v1`, personal diary and remote sync remain untouched. Synthetic submissions must **not** emit the live `li:lesson-submitted` event.

The ESM site-island module exports `captureFixtureSnapshot` and `rollbackFixtureSnapshot` and the guarded local router exposes `window.liStep16Fixture.capture()/rollback()` **only when that localhost fixture flag is present**. The snapshot is held in memory, validates existing schema, retains exact raw bytes/unknown future fields, and never copies a real private record. Rollback requires `confirmed=true` and a matching `expectedRaw` compare-before-write, verifies readback and invalidates the mounted React baseline until manually refreshed. This is a research-only recoverability proof; a compare-before-write on localStorage is **not atomic across tabs** and is not yet approved for real learner migration.

New acceptance: **21 synthetic shell checks** (draft → submit → self-review progress, no native activity pollution, denied/stale/confirmed rollback, React rehydrate and native reload) and **7 Node backup/rollback/origin/shape cases** alongside existing privacy and pedagogical tests. iPhone/iPad Safari, account/session, migration consent, backup file UX, real cross-device conflict and G2 remain open.
