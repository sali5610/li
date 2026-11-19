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
