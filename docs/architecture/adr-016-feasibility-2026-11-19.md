# ADR-016 — li. frontend, persistence and zero-cost hosting

Date: 2026-11-19. Status: INVESTIGATION / G3 NOT APPROVED. Owner: Solution Architect + Developer + Tester. Source snapshot: GitHub main ab76ee1b1c47cb74af43b8b924410eacff01eebb. This is a research-only PR: do not change production site, real data, hosting, or auth.

Project: https://app.notion.com/p/4196cf6db72a81269c71c90c39310334
G3 Task: https://app.notion.com/p/4196cf6db72a81379aaccba71303cb75
Design library: ../../design-system/README.md

## 1. Observed architecture and trust boundary

Browser: publicly hosted GitHub Pages site/ (HTML, CSS, Vanilla JavaScript) → separately managed DOM state modules → same-origin localStorage. Actual app backend/API, cloud DB, login, cross-device sync, verified service worker/offline PWA: not demonstrated in examined runtime. Public website does not mean that an unrelated visitor can directly read another person's different browser localStorage. Same-origin XSS or malicious script remains a data-leak risk.

**Storage inventory from live scripts: 11 fixed keys plus dynamic lesson attempt keys.**

| Domain | Key | Source |
| --- | --- | --- |
| Library/cases/bookmarks/ideas | li.private.library.v1 | site/index.html |
| Case draft | li.private.case-draft.v1 | site/index.html |
| Mentor address | li.buddy-address.v1 | site/index.html |
| Study mode | li.study-mode.v1 | site/index.html |
| Locale | li.app.locale.v1 | site/assets/app-language.js |
| Mentor position | li.companion.position.v1 | site/assets/laoly-drag.js |
| Lesson visits | li.private.lesson.visits.v1 | site/assets/library-hub.js |
| Case visits | li.private.problem.visits.v1 | site/assets/library-hub.js |
| Daily journal | li.personal.daily.v1 | site/assets/personal-diary.js |
| Diary consent flag | li.personal.daily.enabled.v1 | site/assets/personal-diary.js |
| T02 review schedule | li.spell.t02.due.v1 | site/assets/spell-practice.js |
| Lesson attempts/drafts | li.review.{lesson-id}.v1 | site/assets/lesson-wave1-core.js + lesson-l09-hifi.js |

**P1 source-confirmed:** the active schema-1 export handler in site/index.html serializes only cases, questions, ideas, savedContent, draft and buddyNames. It does not include independent lesson attempts, journal/consent, visit histories, T02 due schedule, locale, mode or mentor position. Current import writes only library, draft and buddy addresses. A successful export is NOT a complete learning-progress backup; do not migrate/delete a previous origin based on it. Diary code initializes new installs as enabled in absence of preference or existing diary (marked per PO), requiring privacy-decision reconciliation before changing behavior.

No manifest link or serviceWorker registration found in the inspected site/index.html. No offline/standalone durability can be claimed without tests.

## 2. Frontend decision matrix (all candidates, none selected)

| Candidate | Value | Risks / verification |
| --- | --- | --- |
| A: retain Vanilla JS, refactor to modules / shared state | No rewrite of the live UI, lowest rollout and asset-regression risk | More manual lifecycle/state coordination, component discipline required |
| B: React + Vite, incremental islands | Mature component/state/testing ecosystem for lesson, review, modal and animation states | New build tool/dependencies, bundle and migration work, GitHub Pages base /li/ must be configured, all stored IDs retained |
| C: Lit + Web Components | Browser-native, interoperable component boundaries and reuse | New component conventions, global state still needs design, third-party support differs |

Compare equal representative flows (lesson → answer → save → refresh → resume → export) with actual JS bytes, load/interactions, keyboard, VoiceOver, iPhone/iPad landscape, VI/EN, reduced motion and runtime error handling. No visual redesign; consume the same li. design-system and approved art. React supports gradual integration: https://react.dev/learn/add-react-to-an-existing-project ; Lit docs: https://lit.dev/docs/v3/ ; Vite Pages docs: https://vite.dev/guide/static-deploy .

## 3. Persistence / server decision matrix

| Candidate | Published free capacity or capability | Risk / block |
| --- | --- | --- |
| A: localStorage + complete portable backup | No new account/billing. Typical 5 MiB per origin for localStorage | Device loss, Safari eviction, no sync, site remains public |
| B: IndexedDB local-first + backup | Better structured local transactions and larger storage | No cloud recovery, still subject to browser eviction and migration; verify iOS |
| C: Supabase Free / PostgreSQL + Auth + RLS | Free: 2 projects, DB 500 MB each, 50k MAU, 1 GB file storage, 5 GB egress | Pauses after low activity about 7 days, no free automated daily backups, provider/access and RLS tests needed |
| D: Firebase Spark / Firestore + Auth | 1 GiB, 50k reads/day, 20k writes/day, 10 GiB/month data transfer | Read-based billing model; backup/restore not free; Firebase Cloud Storage requires a Blaze billing account, not available on Spark |
| E: Cloudflare Workers Free + D1 | D1: 5 million rows read/day, 100,000 rows written/day, 5 GB total | Build and secure own API/auth/session, free daily cap is enforced; integration heavier |

Primary vendor documentation checked 2026-11-19:
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Browser storage: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Safari storage: https://webkit.org/blog/14403/updates-to-storage-policy/
- Supabase pricing: https://supabase.com/pricing
- Supabase free pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Firestore quota: https://firebase.google.com/docs/firestore/quotas
- Firebase Spark/Blaze: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firebase Storage Blaze requirement: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/

These are published vendor terms, not verified account quotas, actual load or guaranteed long-term free services. No provider accounts or billing projects are created by this ADR. For privacy if using Supabase, secret keys MUST stay server-only and per-user row security must be verified: https://supabase.com/docs/guides/database/postgres/row-level-security .

**Provisional direction only:** protect current learner progress first; retain static/local-first baseline while investigating. If the product truly needs login, private site and automatic two-device sync, compare Supabase and Firebase in isolated fake-user negative tests and raise privacy/cost/lock-in choice to Human PO G3. IndexedDB is not a substitute for cloud backup.

## 4. Data safety PoC — isolated, synthetic only

A Node script under tools/step16_backup_spike.cjs is a PROTOTYPE CONTRACT, not shipped backup UI. It uses a fixed reviewed namespace registry plus lesson key pattern, format v2 with digest, 10 MiB max, import preview (add/update/remove), confirmation gate, post-write readback, best-effort rollback and explicit rollback failure status. Test with synthetic data only; never upload actual notes to GitHub, CI or Notion. Node crypto is not a tested browser implementation.

Test ledger:
1. Byte-exact full fake-domain roundtrip, including dynamic lesson states.
2. Dry-run makes zero writes.
3. Removal preview and explicit replacement.
4. Unknown new li. key blocks completeness claim.
5. Tampering, duplicate or unsupported version rejected.
6. Invalid JSON and large payload rejected.
7. Write denial triggers verified rollback.
8. Rollback failure never reported as success.
9. Repository source registry and old export-gap contract.

Local isolated Node suite ran 8/8 synthetic tests PASS before the PR; repository source contract and GitHub CI require their own result. This does not demonstrate production-safe data migration, iOS Safari/PWA, storage quota under real browsers, offline caching or user-account isolation. Do NOT treat this as a finished export/import fix.

## 5. Delivery gates and privacy

- No source/billing secrets embedded in public web assets; audit XSS, dependencies, content rendering and private-data logs.
- If cloud selected, test two distinct synthetic users: anonymous deny, other-user CRUD deny, own-user CRUD allow, delete/export and actual server authorization. UI hiding is not security.
- Import preview must be non-destructive and handle legacy schema 1, corrupted JSON, unsupported schema, failed writes, interrupted restore, storage pressure, repeated imports and older Vercel → GitHub origin migration.
- Keep approved Wave1 content and lesson IDs stable. Freeze G2 visual decisions separately. Do not mark G3 approved because CSS, React, or source tests happen to pass.
- Before release: E2E browser contract, physical Safari/iPhone/iPad landscape/VoiceOver, offline/PWA evidence, billing eligibility, exact deployed build, complete rollback, G4 Human PO decision.

**Remaining G3 evidence:** real browser backup/restore, frontend representative PoCs with bundle/state metrics, auth/sync/private requirements and cost entitlements, provider account proof if any, threat-model/diary consent resolution, schema migration & rollback, final Human PO G3 decision.

**Status:** Step16 In Progress; G3 NOT READY. GitHub draft PR modifies documents and isolated test tooling only; site/ remains byte-identical. No new paid services or deployments. Incremental spend 0 VND.
