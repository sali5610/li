# Step16 S-G3-16J — Native Vanilla ↔ React L09 state bridge

**Status 2026-11-19: 15/15 real Chrome browser scenarios PASS; G3 NOT APPROVED.**

Reference: [Step16 Notion](https://app.notion.com/p/4196cf6db72a81379aaccba71303cb75), [G3 ADR draft PR #120](https://github.com/sali5610/li/pull/120), [React pilot PR #121](https://github.com/sali5610/li/pull/121), [stacked adapter Draft PR #122](https://github.com/sali5610/li/pull/122).

## Exact coverage

The current published Vanilla L09-1-2 route from site/index.html and the React/TypeScript pilot load in **separate same-origin localhost iframes** with synthetic study state. The pilot draws authored VI/EN prompts from site/assets/lesson-l09-hifi.js, with the 4 original written questions and 4 rubric rows, not invented educational copy.

The new guarded adapter at tools/step16-real-l09-react-island/src/native-bridge.ts may read/write **li.review.L09-1-2.v1** only if the hostname is localhost/127.0.0.1, the path contains tools/step16-real-l09-react-island/dist, and the explicit bridge query equals native-localhost-test. Otherwise it uses **step16.l09.react-island.v1**; public GitHub Pages cannot activate native-key compatibility mode.

## Verified browser evidence

[GitHub Actions #44422685442](https://github.com/sali5610/li/actions/runs/44422685442) SUCCESS at tested code commit cea63f06536199abec5bb79d538916cabd5815d0; companion workflow at this commit SUCCESS.

| Scenario | Actual result |
| --- | --- |
| Exact-source React challenge, rubric, VI/EN, draft, submit, reload and Chrome widths | 7/7 PASS |
| Real published Vanilla attempt → React hydration, incl. assisted flag | PASS |
| React draft write → real Vanilla reload, unchanged guided note/future metadata | PASS |
| Native write → React conflict, save blocked until manual reload | PASS |
| Native app-wide language changes → React English authoring + safe refresh | PASS |
| React submission → native rubric unlock on reload; React-local compatible event | PASS |
| Native rubric score and completion → React reload displays 5/8 | PASS |
| Malformed legacy record refused without rewriting it | PASS |
| No explicit localhost query → experimental key only | PASS |
| **Total** | **15/15** |

Build output: one React pilot JS asset **218,833 raw / 69,896 gzip bytes**, including extracted L09 authored content and React runtime. Prior isolated pilot had 214,913 raw / 68,676 gzip bytes. This difference is not a whole-app bandwidth/speed benchmark.

## Integration contract and limits

- The versionless legacy study record owns locale, 4 drafts, optional hint, assistance, submittedAt, answer snapshot, self-review ratings and reviewed status. The adapter checks known fields and retains unknown future properties. A raw-value optimistic pre-write check prevents many stale overwrites, but it is **not atomic compare-and-swap**, a Web Lock for all writers or a database transaction.
- App-wide language is owned by the original window.liLanguage service and the local preference key li.app.locale.v1. The test uses cross-document browser storage events; native lesson also updates its own stored locale, which requires a React refresh. A production React island must subscribe to the same-window global event rather than create another locale owner.
- A React-local li:lesson-submitted event is emitted on the research iframe window. This **does not prove** native Library/Recents observers in a different window received it. Real-route integration must share a single owner and event bus.
- The existing native Library/Recents status getter reads the reviewed/submitted fields, but navigation, bookmarks, visit logging and Lão Lý companion have **not been tested end-to-end with a React-owned route**.
- The React pilot covers **only** L09 challenge and rubric, not complete original guided learning, sources, hero/media, sidebar, full design-system parity or approved production UX.
- 390px/820px Chromium checks are not physical iPhone/iPad Safari, VoiceOver, iPad landscape rotation, PWA, genuine storage quota or crash recovery. A reproducible npm lockfile is also still missing.
- No production site files modified, no real learner data touched or uploaded, no backend/auth/provider/billing/merge/deploy. **Incremental cost 0 VND.**

**Architecture inference:** React + TypeScript is a technically viable *bounded* future island, not an automatic frontend winner over modular Vanilla or Lit. G3 Human Product Owner decision remains open. If approved, the next controlled milestone is a **single DOM owner** test for the exact native L09 route with state and global event integration, backup/rollback and physical Safari QA.
