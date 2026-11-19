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
