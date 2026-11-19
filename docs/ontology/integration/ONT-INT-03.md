# ONT-INT-03 · Dual local-only Search + L09 React island acceptance

**2026-11-19 — Draft-only, no merge, Neon data, Cloudflare or production app route.** Baseline exact [ONT-INT-02 PR #153](https://github.com/sali5610/li/pull/153) at `3d45d26272f2ff6cd977f8d2f30e596042204c15` has the actual shared native app, DS modal, quote-stage and two independent research entrypoints, but previous tests checked Search and L09 separately.

## Real scope

- Build both candidate assets **in the same disposable GitHub checkout** using their existing Vite site config; don't commit compiled bundles, or enable on hosted origin.
- Open actual `site/index.html?lesson=L09-1-2&li-react=l09-native-fixture&li-search-react=typed-v1` on HTTP 127.0.0.1 only.
- Observe both real React roots, one native navigation owner, original quote gate, DS Dialog + Search fallback, and independent visibility/inert ownership.
- Navigate L09→Search→L09→Search→L09; query canonical `L09-1-2`, check exact typed editorial/route lock and return to the same result and React L09 draft. Verify private `li.review.L09-1-2.v1` and `li.private.lesson.visits.v1` byte-identical.
- Negative: remove the generated Search CSS **from a disposable test workspace** and reload the double-flagged app; native Search must return without breaking the still-mounted L09 React or altering private record.
- Keep independent Search VI/EN locale as a **research-local state**; native L09 VI/EN remains separately owned. Cross-feature language unification is NOT approved/implemented here.
- Search remains source-only typed offline sample with no course-playable deep link, private search backend, account session or publication authority. Curriculum ONT-03C still pending.

## Evidence definitions

- CI source guards and Search jsdom tests are separate from **mounted actual Chromium** assertions. The embedded app uses real static script/module loads and real React state effects, but QA input events are synthetic.
- Node/Chrome PASS does **not** establish physical iPhone/iPad Safari, multi-device persistence, signed Google invite and Neon FORCE RLS, full content readiness, G2 visual identity, or G4 release authorization. VoiceOver-specific QA `OUT_OF_SCOPE_PO_S208`.
- QA fixture and workflow are source-only changes. No `site/index.html`, `db/`, learner data or production assets need changing if the two existing loaders are compatible. If red, fix narrow upstream source and rerun exact-head CI rather than simulating success.
- Deploy/merge stays disabled pending explicit release gate; GitHub Actions minutes are used, Cloudflare preview side effects unverified.

## Follow-up

After a passing dual-React proof, require authorized published route manifest, real signed A/B/C user-owned row isolation, physical Safari and G2 before moving the pilot from localhost to staging/production. Do not infer public feature readiness from demo search results.
