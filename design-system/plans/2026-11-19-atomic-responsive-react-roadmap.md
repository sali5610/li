# li. Design System v1.0 Remediation Roadmap — Atomic + Responsive + React

> **UX-DS-35 · DRAFT PLAN · 2026-11-19.** Scope: refactor UI design contracts and build a reusable React design system incrementally, without visual redesign, destructive rewrite, production deploy or paid services. This plan follows the [Atomic Readiness Audit](../audits/2026-11-19-atomic-react-readiness.md) and [Responsive/Adaptive contract](../responsive-adaptive.md). G2 visual PO approval and Step16.1 private auth/RLS/release gates remain separate.

## Desired end state and acceptance levels

- **Ready for implementation:** approved/reference-linked component specs + shared semantic tokens + responsive Do/Don't + atomic inventory + test definitions exist. No code claim.
- **React component ready:** actual typed code uses generated tokens, supports all meaningful variants/states/a11y/VI-EN and responsive rules, has isolated stories and CI results. Can be used behind flag.
- **Screen ready:** composed page uses shared React primitives/organisms, preserves canonical data and state ownership, passes native parity and viewport tests; feature flag can be enabled in a reviewed preview/staging plan.
- **Production ready:** physical iPhone/iPad Safari (including repeated rotations), PWA, keyboard/VoiceOver, human G2 visual acceptance; auth/cloud needs real verified permission/RLS/consent + manual deployment approval. A successful GitHub build is not the same as this status.

## Stage-by-stage plan (no calendar promises, no automatic rollout)

| Stage | Priority | Goal / concrete changes | Output / Done criteria | Dependencies / gate |
| --- | --- | --- | --- | --- |
| **0. Freeze evidence** | P0 | Capture current main SHA, PR #124/#125, PO approvals/exceptions; inventory all real DOM/CSS instances, tokens, specificity overrides; pin before screenshots for Home/iPhone/iPad/L09/Guide | Source-of-truth & risk register, screenshot baseline, affected-screen matrix, all contradictory legacy rules tagged by owner; no deleted CSS yet | Current audit; no PO gate for observation |
| **1. Reproduce responsive failures** | P0 | Actual iPhone + iPad portrait/landscape, Safari repeated rotation, visual/layout/root metrics, browser chrome, Split View, safe-area, keyboard, 200% text; audit missing hover/tap/focus semantics | Reproduction cases and physical Pass/Fail/Unverified; concrete root-cause hypotheses and failing regression fixtures; no 'fix' without observed initial failure | Uses approved real-device evidence; no image/asset swap |
| **2. Design Foundations v1** | P0 | Split reference→semantic→component tokens; consolidate color/type/space and create named responsive density, width/container, shape, elevation, motion, layer, safe-area; keep iPad approved values as baseline. Introduce typed React token generation from JSON | Token JSON/generated CSS/TS parity; no unexplained new raw literals or visually changed approved values; semantic→legacy crosswalk & deprecation list; CI checks | Needs Stage0; new visual values or new variant require PO G2 review |
| **3. Responsive contract into executable layout primitives** | P0 | Implement `Container`, `Stack`, `Inline`, `Grid`, `Cluster`, `SafeArea`, `ScrollRegion` contracts + container-query rules and short-height fallback; scope CSS; preserve 2-up Guide 320–640 and approved iPad art | 320→1440 sweep; 320/375/390/402 + 600/640/744/820/970/1024/1133/1194/1366/1408 + reduced-height, zoom; no action clipped; stable DOM semantics | Stages1-2; resolve iPad rotation visually only with physical evidence |
| **4. Atomic React library foundation** | P0 | Extract shared `Button`, `IconButton`, `Text`, `Field`, `Card`, `Status`, `Progress`, `Dialog` from canonical contracts, no pilot-only hardcoded CSS; establish TS props/slots/events/refs and a story gallery | Variant/state/VI-EN/keyboard/touch/a11y tests per primitive; zero unreviewed style literals in React; native CSS bleed guarded; specimen matches existing approved appearance | Stages2-3; no production mount |
| **5. Molecules + interaction patterns** | P0/P1 | `FormField`, `SearchField`, `ActionGroup`, `SaveStatus`, `LanguageSwitch`, `SourceBadge`, `LessonQuestion`, `CharacterBubble`, `Menu/Disclosure`; central state machines and message truth | Every component doc: purpose/when/when not/anatomy/variants/token mapping/states/Do-Don't/a11y/responsive/React API/story/tests; key error/retry/empty/loading paths | Stage4; no invented data/source status |
| **6. Adaptive organisms and templates** | P1 | Rebuild shared Nav/Header, LearningFlow/Rubric, Catalog list, Checkin/MentorDialog and Home composition from lower levels; split reusable layout from page art. Remove CSS specificity patches only after per-screen visual parity | Phone/iPad compact→expanded + iPad split + landscape short-height; Home full-bleed and approved art; nav/focus, centered CTA group, safe-area, dialogs; visual diff ledger; legacy rules deprecated safely | Stages3-5; PO G2 for materially changed composition |
| **7. React integration 16.2 — L09 first** | P0 | Mount route/island behind feature flag OFF on Vanilla shell; canonical L09-1-2 content, VI/EN, answer/attempt/rubric/hint/continue; only ONE writer to record and native fallback | Native↔React content, visual, behavior and persistence parity; storage-denied/refresh/offline tests; no duplicate answers or lost draft; rollback via flag | Stages4-6 relevant components; **not blocked by 16.1 real cloud auth** |
| **8. Google-only invite Auth & account/sync components** | P0 for auth path | Adopt Google-only invited Auth (no password/OTP), denied/revoked/checking/offline/logout/switch; account-bound local state and explicit conflict UX. Keep cloud off until real security proof and PO consent | Invited A/B + uninvited C + revoked tests with real signed identities, RLS, synthetic cleanup, account isolation; Safari UI parity; consent & manual release gate. No diary cloud | Step16.1 separately approved migration/release/security gates; Stage4-5 components |
| **9. Hardening and handoff** | P0 release | Build CI per-component, React token audit, visual regression, a11y, device trace; remove legacy overrides only when coverage passes, document exceptions, update assets/component gallery/handoff | Per-screen × variant × state × viewport × locale × input mode with evidence SHA; PO G2 review; manual-only Cloudflare action AFTER authorization. Clear status **Ready / Blocked / Unverified** | Stages1-8; security and G2 gates stay open until proven |

**Stage order is by dependency, not a calendar promise.** Stages 3–6 may be parallelized among component families after token names are fixed; Step16.1 security work may continue independently. Never make full React conversion wait for every P2 component.

## Recommended PR slicing and merge discipline

1. **Docs-only PR #125 (DRAFT):** atomic audit, responsive contract, this roadmap, entrypoint/checklist crosslinks. No runtime or tokens value change; Human PO may review new responsive exceptions.
2. **PR A — foundations + token/CI:** token naming, generators CSS+TS, React scanner and test fixtures; no visible pixel change.
3. **PR B — layout primitives + Safari investigation:** adopt container/height/safe-area scaffolding in isolated fixture; preserve existing production Home fallback until real device check.
4. **PR C — core atoms/molecules:** shared React library, docs, variant/state gallery; scoped style.
5. **PR D — responsive templates/organisms:** adopt one targeted screen family at a time, measure regression, do not change canonical academic content.
6. **PR E — L09 React island integration:** behind flag OFF, one-way migration of screen ownership, native fallback and rollback.
7. **PR F — Auth and private sync:** only after separate real identity/invite/RLS/consent gates. Never sneak this into a visual refactor.
8. **Final separate release review:** compare main SHA, browser/device test artifacts, visual evidence, PO G2 approval; only then manual Cloudflare deployment.

**No blanket all-app CSS rewrite, no auto-merge.** Each PR must list *all* selectors and screen instances affected, old→new tokens/behavior, VI/EN, responsive variants, screenshot evidence, source SHA and open Safari/G2 gates. If a shared component change breaks another screen, revert or fix across all instances before progressing.

## Responsive acceptance journeys (minimum)

| Journey | Device condition | What must stay correct |
| --- | --- | --- |
| Home → L09 → Back | iPhone portrait 320/375/390/402; short landscape; iPad portrait/landscape; 200% text | Mirror text visible, Lưu/Đào sâu accessible, Lão Lý not covering nav, no lost progress, Back distinct from Resume |
| Thần Chú list → method detail | 320/390/600/**640** and iPad split | **Two tiles 320–640** as already PO accepted, full method name accessible, 13 methods searchable, selected filter and explicit query semantics |
| Notebook / Diary | iPhone virtual keyboard, Safari PWA, iPad split, zoom | Input scroll into view, 32px notebook line alignment, real saved/readback, no data loss after orientation |
| Check-in / Mentor | iPhone short landscape + virtual keyboard + iPad large window | Dialog body scroll separate, footer and Close/Skip remain reachable, focus containment/restore, FAB hidden when open |
| iPad Home repeat rotations | 970×1408→1408×970→970×1408→1408×970 (plus 820×1180 / 1194×834) | No blank paper, root scene fills visual area, crop and content focus remain correct, centered bubble+2 CTA, no horizontal/body scroll by default, question and click targets preserved |
| Google Auth & access denied | Any width; invited/uninvited/revoked, offline | No password creation UI, clear error/invite state, accessible logout, no false access/sync status, real permission isolated |

## QA evidence table template

| Field | Required evidence |
| --- | --- |
| Source | PR, commit SHA, affected screen, component ID + atomic level |
| Variant | device density, layout class, container width, portrait/landscape/short-height, input modality |
| Content | VI/EN, 1-line/long copy, error/empty/loading/save failed, keyboard |
| Browser | Chrome automation and **physical Safari** results tracked separately |
| Accessibility | role/name/value, focus and restoration, keyboard, VoiceOver, 320px reflow, 200% resize and relevant 400% reflow |
| Result | PASS / FAIL / UNVERIFIED, actual screenshot/fixture/repro, severity, next action |
| Approval | Implemented ≠ CI passed ≠ G2 approved ≠ Released; explicit PO gate when needed |

## Definition of done at each phase

- **No token drift** between JSON, CSS and React types. Do not equate 'all old values aliased' with semantic quality.
- **No unreviewed component variation**: named component API, tokens, responsive Do/Don't and state/ARIA recorded.
- **No regression** in accepted 2-up Guide, one iPad landscape artwork crop, iPad density, sand selected nav, square controls, paper/Moss roles and locked content.
- **No hidden control**, missing focus, data loss, false Saved/authorized/mastery state or unapproved cloud access.
- **No fake device pass**: physical Safari and VoiceOver remain UNVERIFIED until real evidence.
- **0 new paid spend**; no Cloudflare production/preview build initiated by planning work; keep manual release policy.

## References

- [Current Responsive Contract](../responsive-adaptive.md)
- [Current Atomic Audit](../audits/2026-11-19-atomic-react-readiness.md)
- [Current Design Library](../README.md)
- [Current Component Contract](../components.md) and [Behavior Contract](../ux-patterns-and-behavior.md)
- [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) / [Step15 G2](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1)
- [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Material Adaptive](https://developer.android.com/codelabs/adaptive-material-guidance), [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
