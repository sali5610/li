# S241 · WebKit engine QA, NOT Safari acceptance

This is a PR-only cross-engine CI check at the **exact same React + Design System + ONT-02 combined source tree** as #164's Chromium test. It installs an ephemeral pinned Playwright WebKit binary in GitHub Actions and serves only http://127.0.0.1:8798 inside the runner. No Cloudflare/public app deployment.

## Engine matrix and proof
- Linux headless Playwright WebKit `1.56.1` package; record browser's actual `version()` at runtime.
- Real rendered L09 source both legacy and `li-vc-g2=1` opt-in at 390 × 844, 820 × 1050, 1040 × 768, 1440 × 900.
- Compare DOM lesson/question text, four answer values, privacy key absence, page overflow, exact two exercise/review Cards retaining flat/no-shadow, responsive 20/28/32/24 padding, CTA hit sizes and hard shadows, answer min-height.
- At 390, focus first answer and inspect actual computed border, fill four synthetic answers through Playwright events, toggle VI/EN, request hint, submit, require rubric and four disabled answers, preserve real learner key.
- Capture full-page WebKit opt-in screenshots for 390 + 820 and 390 submitted, plus JSON computed style ledger under `/tmp/li-uxds35-stage02b/combined/l09-webkit/`.
- **FAIL closed** on unsupported browser launch/install, lesson mismatch, DOM or style regression. A GitHub Actions run that fails is **not** a claim the app has passed Safari.

## Important gate boundary

**WebKit is a browser engine, not iOS Safari on an actual iPhone or iPad.** Different fonts, OS rendering, native input interaction, WebKit port/version, virtual keyboard, fixed viewport, touch gesture, PWA, zoom, orientation, BFCache and hardware remain unverified. Global visual G2 is reserved for Human PO review and remains OPEN; physical Safari test stays NOT RUN. This test cannot greenlight Stage03, merge, Auth/Neon RLS or Cloudflare G4.

**Implementation state:** Proposed CI source until exact-head Actions PASS is observed and recorded.
