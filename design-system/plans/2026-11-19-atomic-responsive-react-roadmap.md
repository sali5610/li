# li. Design System v1.0 Remediation Roadmap — Atomic + Responsive + Ontology + React

> **UX-DS-35 · DRAFT EXECUTION PLAN + PO-APPROVED ONTOLOGY DIRECTION · 2026-11-19.** Scope: refactor UI design contracts and build a reusable React design system incrementally, without visual redesign, destructive rewrite, production deploy or paid services. This plan integrates the already approved [S183 ontology architecture](https://app.notion.com/p/41d6cf6db72a81f59573fb0e5ed6836e) and existing ONT-01–05 backlog **without creating duplicate tasks**, and follows the [Atomic Readiness Audit](../audits/2026-11-19-atomic-react-readiness.md) and [Responsive/Adaptive contract](../responsive-adaptive.md). G2 visual PO approval and Step16.1 private auth/RLS/release gates remain separate.

## Desired end state and acceptance levels

- **Ready for implementation:** approved/reference-linked component specs + shared semantic tokens + responsive Do/Don't + atomic inventory + test definitions exist. No code claim.
- **React component ready:** actual typed code uses generated tokens, supports all meaningful variants/states/a11y/VI-EN and responsive rules, has isolated stories and CI results. Can be used behind flag.
- **Screen ready:** composed page uses shared React primitives/organisms, preserves canonical data and state ownership, passes native parity and viewport tests; feature flag can be enabled in a reviewed preview/staging plan.
- **Production ready:** physical iPhone/iPad Safari (including repeated rotations), PWA, keyboard/VoiceOver, human G2 visual acceptance; auth/cloud needs real verified permission/RLS/consent + manual deployment approval. A successful GitHub build is not the same as this status.

## Stage-by-stage plan (no calendar promises, no automatic rollout)

| Stage | Priority | Goal / concrete changes | Output / Done criteria | Dependencies / gate |
| --- | --- | --- | --- | --- |
| **0. Freeze evidence** | P0 | Capture current main SHA, PR #124/#125/#127, PO approvals/exceptions and ONT-01 frozen typed spec; inventory all real DOM/CSS instances, tokens, specificity overrides; pin before screenshots for Home/iPhone/iPad/L09/Guide | Source-of-truth & risk register, screenshot baseline, affected-screen matrix, all contradictory legacy rules tagged by owner; no deleted CSS yet | Current audit; no PO gate for observation |
| **1. Reproduce responsive failures** | P0 | Actual iPhone + iPad portrait/landscape, Safari repeated rotation, visual/layout/root metrics, browser chrome, Split View, safe-area, keyboard, 200% text; audit missing hover/tap/focus semantics | Reproduction cases and physical Pass/Fail/Unverified; concrete root-cause hypotheses and failing regression fixtures; no 'fix' without observed initial failure | Uses approved real-device evidence; no image/asset swap |
| **2. Design Foundations v1** | P0 | **ONT-02 integration:** bind typed UI Token/Component/Variant/Slot/Pattern/Rule/Decision IDs to the ONT-01 registry; split reference→semantic→component tokens; consolidate color/type/space and create named responsive density, width/container, shape, elevation, motion, layer, safe-area; keep iPad approved values as baseline. Introduce typed React token generation from JSON | Token JSON/generated CSS/TS parity; no unexplained new raw literals or visually changed approved values; semantic→legacy crosswalk & deprecation list; CI checks | Needs Stage0; new visual values or new variant require PO G2 review |
| **3. Responsive contract into executable layout primitives** | P0 | Implement `Container`, `Stack`, `Inline`, `Grid`, `Cluster`, `SafeArea`, `ScrollRegion` contracts + container-query rules and short-height fallback; scope CSS; preserve 2-up Guide 320–640 and approved iPad art | 320→1440 sweep; 320/375/390/402 + 600/640/744/820/970/1024/1133/1194/1366/1408 + reduced-height, zoom; no action clipped; stable DOM semantics | Stages1-2; resolve iPad rotation visually only with physical evidence |
| **4. Atomic React library foundation** | P0 | **ONT-02 code adoption:** map live component props/variants/slots/state and responsive rules to stable ontology IDs & UI-rule gates; extract shared `Button`, `IconButton`, `Text`, `Field`, `Card`, `Status`, `Progress`, `Dialog` from canonical contracts, no pilot-only hardcoded CSS; establish TS props/slots/events/refs and a story gallery | Variant/state/VI-EN/keyboard/touch/a11y tests per primitive; zero unreviewed style literals in React; native CSS bleed guarded; specimen matches existing approved appearance | Stages2-3; no production mount |
| **5. Molecules + interaction patterns** | P0/P1 | **ONT-02 rule graph + parallel ONT-03 editorial graph:** build testable `USES_TOKEN`, `HAS_SLOT`, `FILLS_SLOT`, `CONSTRAINS`, `VALIDATES` UI edges, separately link concepts/outcomes/S145 method-fit; `FormField`, `SearchField`, `ActionGroup`, `SaveStatus`, `LanguageSwitch`, `SourceBadge`, `LessonQuestion`, `CharacterBubble`, `Menu/Disclosure`; central state machines and message truth | Every component doc: purpose/when/when not/anatomy/variants/token mapping/states/Do-Don't/a11y/responsive/React API/story/tests; key error/retry/empty/loading paths | Stage4; no invented data/source status |
| **6. Adaptive organisms and templates** | P1 | **ONT-02 screen mapping + ONT-03 learning evidence:** checked `USES_PATTERN` / `HAS_SLOT` / rule→QA binding by responsive variant and a source-pinned L09 learning subgraph; rebuild shared Nav/Header, LearningFlow/Rubric, Catalog list, Checkin/MentorDialog and Home composition from lower levels; split reusable layout from page art. Remove CSS specificity patches only after per-screen visual parity | Phone/iPad compact→expanded + iPad split + landscape short-height; Home full-bleed and approved art; nav/focus, centered CTA group, safe-area, dialogs; visual diff ledger; legacy rules deprecated safely | Stages3-5; PO G2 for materially changed composition |
| **7. React integration 16.2 — L09 first** | P0 | **ONT-03 actual pilot binding:** resolve approved Lesson→Concept→Outcome→MethodApplication→Micropractice/IndependentChallenge without publishing draft graph nodes; mount route/island behind feature flag OFF on Vanilla shell; canonical L09-1-2 content, VI/EN, answer/attempt/rubric/hint/continue; only ONE writer to record and native fallback | Native↔React content, visual, behavior and persistence parity; storage-denied/refresh/offline tests; no duplicate answers or lost draft; rollback via flag | Stages4-6 relevant components; **not blocked by 16.1 real cloud auth** |
| **8. Google-only invite Auth & account/sync components** | P0 for auth path | **ONT-04 permissions boundary in search/mentor pilot:** search and buddy actions must respect entity lifecycle and per-account rights, no private-node public manifest; adopt Google-only invited Auth (no password/OTP), denied/revoked/checking/offline/logout/switch; account-bound local state and explicit conflict UX. Keep cloud off until real security proof and PO consent | Invited A/B + uninvited C + revoked tests with real signed identities, RLS, synthetic cleanup, account isolation; Safari UI parity; consent & manual release gate. No diary cloud | Step16.1 separately approved migration/release/security gates; Stage4-5 components |
| **9. Hardening and handoff** | P0 release | **Ontology CI + evidence gates:** validate schema/edges/aliases/source/rights/permissions, review graph-based UI rule compliance, run ONT-04 query/action evaluations; ONT-05 is a separate optional benchmark and must NOT block core UX release; build CI per-component, React token audit, visual regression, a11y, device trace; remove legacy overrides only when coverage passes, document exceptions, update assets/component gallery/handoff | Per-screen × variant × state × viewport × locale × input mode with evidence SHA; PO G2 review; manual-only Cloudflare action AFTER authorization. Clear status **Ready / Blocked / Unverified** | Stages1-8; security and G2 gates stay open until proven |

**Stage order is by dependency, not a calendar promise.** Stages 3–6 may be parallelized among component families after token names are fixed; Step16.1 security work may continue independently. Never make full React conversion wait for every P2 component.


## Ontology integration — ONT-01 to ONT-05 (approved direction, staged adoption)

**Not an extra screen level, a second component library, a graph database mandate or an AI chatbot.** Ontology provides typed, explainable, versioned relationships *between* the Atomic Design library, academic knowledge, L2/L3 teaching, search and contextual companion. [S183 PO-approved direction](https://app.notion.com/p/41d6cf6db72a81f59573fb0e5ed6836e) is the architectural authority; existing [Notion ONT tasks](https://app.notion.com/p/4196cf6db72a818aba61f3d4cd03e08c) are the backlog truth. [ONT-01 draft PR #127](https://github.com/sali5610/li/pull/127) owns the source registry, schema, examples and validator. **PR #125 is ONLY the integrated plan, not a competing ontology schema.** Never duplicate or silently rename existing kind, edge, ID or backend permissions.

### Cross-workstream implementation matrix

| Ontology task (canonical backlog) | Verified status | When and how to apply it inside stages 0–9 | Deliverable & release proof |
| --- | --- | --- | --- |
| [**ONT-01** — Typed registry + provenance](https://app.notion.com/p/41d6cf6db72a81188986ed5f65d17a5e) | **Done for spec/validator only**, [PR #127](https://github.com/sali5610/li/pull/127) DRAFT/unmerged, CI success. 39 node kinds, 25 predicate types, 21 sample nodes/19 edges, 10 negative tests; NOT a runtime feature. | Stage **0** pins registry/schema/type/validator version + accepted-source evidence; Stage **2** consumes **after source ref is available in an integration branch**; Stage **9** runs validation on authored graph changes. | Single registry authority, no duplicate concept/lesson IDs, no dangling/orphan or invalid edge, provenance/status/rights inspected, public graph contains **zero real learner or auth data**. |
| [**ONT-02** — Design System UI ontology](https://app.notion.com/p/41d6cf6db72a81e0aa1ef66c7ddc0507) | **Backlog / P0** | Stages **2, 3, 4, 5, 6**. Map token→component→slot/variant/state→pattern→screen/flow→rule→QA gate. Implement typed component props enforcing rules and link responsive variants to **window/container/height**, not hardware labels. | One reference path **Button→ActionGroup→L09→UI rule→QA gate** checked on iPhone/iPad portrait/landscape, split, keyboard, VI/EN and a11y; no unreviewed 6/8px rounded ordinary controls; actual component API/state backed by code and tests, not graph-only fixtures. |
| [**ONT-03** — Academic graph + L2/L3 evidence](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43) | **Backlog / P0** | Can author **in parallel with Stage 2–6**, after ONT-01 and academic/IA/S145 source reconciliation; bind to **L09 Stage 7** only after review. Stable 5-tier navigation retained: Group→Field→Course→Lesson→Chapter; concepts/outcomes/prerequisites live as semantic references, not new mandatory routes. | L09 verified Lesson→Concept/Outcome/SourceEdition→primary/optional L2-T01..T13 application→distinct Micropractice/IndependentChallenge; hard `REQUIRES` edge reviewed and acyclic; **K1 answer, K3 enacted method, K5 delayed retest are NOT conflated**. No unapproved lesson publication, no Wave1 content edits. |
| [**ONT-04** — Typed search + 1–2 hop expansion + rule-based Lão Lý](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927) | **Backlog / P1** | Pilot **after ONT-02 + ONT-03 evidence and Stage 7 L09 route/behavior parity**; may be built as independently flagged search/mentor vertical. Reuse S37 typed navigation/search and existing Lão Lý context, not an invented live LLM. Stage 8 covers account-bound permissions; Stage 9 evaluates. | VI/EN ID/alias/typo lexical results, type and published/draft labels, exact source + explainable typed reason, 1–2 hop whitelist/direction caps. Lão Lý safe action allowlist (explain contrast, prerequisite, open optional L2, cite, navigate, save via single writer) respects stage, hints, consent, no pre-submit spoiler, no cross-user leakage; manually tested error/denied. |
| [**ONT-05** — Optional vector benchmark](https://app.notion.com/p/41d6cf6db72a814c9c18d1bdeaf69cdb) | **Backlog / P2, NO GO until benchmark** | **After ONT-04 lexical+graph baseline**, as a separately gated research task; no React/core DS dependency or release blocker. Free/offline licensed embeddings + optional verified Free-tier pgvector only if evaluation justifies. | Versioned bilingual query gold set; compare lexical+graph vs vector-enhanced **Recall@5, MRR, NDCG**, p95 latency, RAM/battery/iPhone Safari, storage and perpetual cost. Document **GO/NO-GO**; keep vector OFF when no measurable benefit or zero-cost guarantee. |

### Apply ontology to actual UX/React features (not just document links)

1. **UI contract pilot / ONT-02.** Give `Button` a stable Component ID, named variants/state, responsive token/shape roles, `ActionGroup` slot placement and contextual actions. Connect `Component USES_TOKEN Token`, `Pattern HAS_SLOT Slot`, `Component FILLS_SLOT Slot`, `Rule CONSTRAINS Pattern`, `QAGate VALIDATES Rule`. A machine validator detects orphaned edges and a **separate React assertion/browser test** proves the actual Button appearance, target and focus at 320/390/744/820/1194 widths and short heights. Graph validation cannot certify visual pixels or VoiceOver.
2. **Academic L09 pilot / ONT-03.** A reviewed `lesson:L09-1-1` links to exact Concept/Outcome/SourceClaim edition; optional `application:L09-1-1:T06` binds the existing `technique:L2-T06`; `Micropractice` (method enactment) is a different entity from independent `Challenge` (knowledge). `lesson:L09-1-2` distinguishes sampling **bias** vs random sampling **variation** without turning the distinction into a false synonym. Example `concept:ont01:*` IDs remain **candidate only**, even though an existing lesson is PO-locked.
3. **Search + connected knowledge / ONT-04.** User searching 'sampling bias' gets a typed concept, linked reviewed Data Science lesson, and, **only if editorial evidence supports it**, UX participant-recruitment and Sociology survey links. Show `why shown` and availability; deny unpublished draft as playable. Do not infer `SAME_CONCEPT` solely because names sound alike; avoid double-counting progress when user navigates through another discipline.
4. **Lão Lý / ONT-04.** Context is route + canonical entity + L2/L3 stage + hint count + active attempt + locale + exact source status + current permission. Use permitted action targets/one writer, transparent rationale and no premature independent answer. No hallucinated academic source, model inference or false “saved” state.
5. **Access & data boundary.** Public build may include only curated, rights-cleared nonprivate ontology. Private Attempt/ReviewDue/Progress/Diary/Invites live in account-scoped storage, never in a public JSON/graph index. **Invite-only RLS migration status alone is not signed Google A/B/C proof**; Step16.1 live identity and isolation tests must pass before cloud use. Ontology permissions annotate UX but **never substitute for server RLS**.

### Dependencies and acceptance gates (a change to the plan, not a code implementation)

- **Cross-branch dependency:** current PR #127 is unmerged. PR #125 may cite it, but must **not import a file from PR #127 as if it exists on GitHub main**. For implementation, rebase after a separately approved merge or create a reviewed stacked branch pinned to exact PR #127 SHA. No silent schema fork.
- **Stages 0–3:** no blocker on unapproved lesson mappings; ONT-02 can verify UI graph shape and constraints while ONT-03 academic editorial review proceeds in parallel. No global release waits for all 15 fields to be graph-mapped.
- **Stage 4–6 entry:** typed `Component→Token/Slot/Rule` graph and actual React props/states trace one another; deletion of source CSS allowed only when all affected visual instances have parity evidence.
- **Stage 7 entry:** ONT-03 L09 demonstration uses only reviewed/published or clearly candidate-labelled graph edges; lesson remains canonical, progress remains one writer, a changed graph revision cannot silently recompute historical mastery.
- **ONT-04 entry:** lexical/typed search baseline works without embeddings, tested on exact ID/title and VI/EN aliases; graph hops require allowed edge types and provenance; buddy allowlist and privacy isolation tests first.
- **Stage 9 release:** graph/schema/negative-fixture validation + component/browser/physical iPhone/iPad Safari + real privacy/rights G2 approval where applicable. **Graph VALIDATES edge does NOT equal a passed physical Safari test.**
- **ONT-05 stays optional**; never add a paid graph service, SaaS embeddings/API, third-party hosted search, unreviewed content or a sixth IA tier as an assumed prerequisite.

### Integration PR split — preserve accountability

- **PR #125 / this document:** plan/crosswalk and QA owner links only (DRAFT).
- **PR #127 / ONT-01:** already authored typed registry and validator, separately DRAFT; maintain it as canonical proposed ontology schema and CI.
- **Follow-up ONT-02 PR:** graph-backed Design System mapping + React rule tests, scoped to audited components and responsive patterns. No duplicate generated CSS/token authority.
- **Follow-up ONT-03 PR:** versioned reviewed academic content graph manifest, concept prerequisites, method-fit and source/rights validation; no student data.
- **Follow-up ONT-04 PR:** flagged typed search / graph / deterministic Lão Lý pilot, no forced vector index. Requires separate integration and accessibility/permission QA.
- **ONT-05 research:** only benchmark & decision record; implement vector storage only after explicit evidence, approval, privacy/free-tier feasibility.

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
