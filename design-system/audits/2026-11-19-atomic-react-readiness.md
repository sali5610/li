# li. Atomic Design inventory & React readiness audit — 2026-11-19

> **Audit / proposed normalization, not G2 visual approval, not production release.** Current evidence: GitHub `main` static app/design library and unreleased Step16 draft branch at `70d8e875878cfb1b739181ab91525de328e1d3e4`. Decisions: [Notion Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334), [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5), [Step15 G2](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1). This file documents evidence, gaps and recommended contracts; it does not mean unbuilt components exist.

## Verdict

- **Source token mapping — PASS for its defined scope only.** The last verified `tools/audit_design_tokens.py --check-zero` scan checked **3,127 authored first-party static site component declarations**, with zero unmapped paint/type/spacing declarations after defined exclusions. It scans `site/`, **not** `tools/step16-real-l09-react-island/src/**/*.css|tsx`; no React parity can be inferred. Legacy compatibility tokens preserve old values, not semantic consistency.
- **Foundations — PARTIAL.** Color, typography, spacing, iPad scales, interaction intent exist. Missing explicit reusable system contracts for motion durations/easing, component-level state-layer roles, elevation/shadow geometry, semantic shape exceptions, layering/z-index, responsive container breakpoints, and React-facing typed contracts. `quality` flags remain false for device/G2/accessibility.
- **Component coverage — PARTIAL.** `components.md` mixes static selectors, gallery specimens, page-specific implementations, and proposed variants. `ux-patterns-and-behavior.md` contains cross-pattern Do/Don't, **not a separate completed specification/test pack for every component**.
- **React readiness — NOT READY AS A REUSABLE LIBRARY.** The L09 and auth research routes compile as isolated React pilots. No `src/components/` shared library found in the inspected branch. `pilot.css` hardcodes spacing/type/radius and sets 8px cards/6px controls contrary to the generally square li. control contract. Auth has its own `auth-shell.css`. No production React mount, Safari/G2 acceptance, or fully verified user-private Neon sync.
- **Live QA — OPEN.** Existing Chrome CI/source checks do not prove real Safari/PWA/VoiceOver/200% zoom, production interaction-state coverage or full WCAG 2.2 AA. iPad rotation defect remains open in latest handoff.

## Atomic taxonomy: actual inventory vs required components

Legend: **Static** = implemented or located in existing `site/`, not automatically reusable React; **Specimen** = component review/demo without confirmed production adoption; **Pilot** = unreleased React; **GAP** = not found as a canonical reusable component in inspected source (does not prove no one-off code exists elsewhere). Priority P0 = needed for Step16 migration or safety; P1 = near-term; P2 = later.

### 0. Foundations (not atoms)

| Domain | Existing | Gap / proposed semantic contract | Priority |
| --- | --- | --- | --- |
| Colors | paper/cream/porcelain/moss/olive/ink, semanticColors, scene & alpha tokens | Roles `surface/default/raised/input`, `content/primary/muted/on-brand`, `border/default/strong`, `action/primary`, `status/{success,warning,error,info}`; distinguish state from decorative olive | P0 |
| Typography | Crimson Text editorial, sans UI, responsive role scale + legacy clamps | Component-slot type roles with VI/EN 200%-zoom guarantees; compatibility aliases marked deprecated | P1 |
| Spacing | 4px base + iPad density scales and approved 14/18px exceptions | Component insets/density and reflow conditions as readable role names; freeze approved micro-spacing | P1 |
| Shape | control radius 0; named exceptions | `shape/control-square`, `shape/nav-oval`, `shape/chip-pill`, `shape/mentor-bubble`, card exceptions explicitly documented | P0 |
| Elevation | hard offset shadow pattern + preview effect colors | Shadow x/y/blur/spread/color semantic roles and per-state pressed elevation; do not impose Material tonal elevation | P1 |
| Motion & sound | reduced-motion intent and a handful of ad-hoc visual effects | `motion/instant/fast/normal/slow`, easing, transition family, exit/enter/focus preservation, reduced-motion fallback; optional sound opt-in/mute, no automatic audio | P1 |
| Layout | review viewport list, iPad portrait/landscape scales | Breakpoint/container/landscape-short-height/safe-area/keyboard-offset/z-index layering contract; production Safari rotation test | P0 |
| Iconography & art | Lucide 1.8 stroke with 18/20/22/24px roles; Lão Lý approved family/mini-icons, paper collage | Icon/action mapping registry, decor vs meaningful alt, approved asset manifest and crop-safe usage; preserve **current Trong gương only** character family | P1 |
| Data/status semantics | source review status, save/progress rules | Central status vocab (idle/editing/saving/saved/failed, idle/loading/empty/error, local-only/offline/syncing/conflict); never style a state before its real source event | P0 |

### 1. Atoms

| Component / contract | Evidence | Required variants and states | Do / Don't | Priority |
| --- | --- | --- | --- | --- |
| Text, Heading, Label, Caption | Static tokens | semantic hierarchy, long VI/EN, truncation when optional only | DO preserve content meaning; DON'T use 10px essential copy | P0 |
| Button | Static `.primary`, `.secondary`; Pilot buttons | primary/secondary/tertiary/destructive; default/hover/focus/pressed/disabled/busy | DO one dominant action; DON'T style every action primary or confirm before persistence | P0 |
| IconButton | Static `.tool-button`; Specimen | with label, active/idle, focus, 48px intended hit area | DO map action correctly; DON'T use a decorative div as a button | P0 |
| Link | Static + Specimen | inline/standalone, visited/focus/external if needed | DO navigate with link; DON'T use action as fake link | P0 |
| TextInput / Textarea | Static/Specimen, Pilot custom | default/filled/focus/readonly/disabled/error, controlled/uncontrolled contract | DO visible label, porcelain editable; DON'T use placeholder as label | P0 |
| Radio / Checkbox / Switch | Static check-in + Specimen | checked/unchecked/indeterminate where applicable, group label/disabled | DO radio one-of-many, checkbox many; DON'T collapse switch/settings into radio | P0 |
| Chip / Badge / StatusText | Static filter pill + Specimen | filter selected/clear, informational badges, source draft/reviewed | DO make selected both semantic and visible; DON'T reuse decorative olive as status | P0 |
| Icon / Avatar / Image | Static assets | decorative vs meaningful, responsive art crop, alt policy | DO approved source and logical icon roles; DON'T bake crucial text inside crop | P1 |
| Divider / ProgressIndicator / Spinner | Specimen progress, Static rules | determinate/indeterminate, status text and value ARIA | DO use measured progress; DON'T invent XP, mastery or percentages | P1 |

### 2. Molecules

| Component / contract | Evidence | Essential Do / Don't / states | Priority |
| --- | --- | --- | --- |
| FormField (label + helper + control + error) | Pattern spec; scattered Static | Inline correction, associated descriptions, invalid/valid/pending; DON'T clear draft on error | P0 |
| SearchField (input + clear + result count) | Static and Specimen | VI/EN academic aliases, loading/zero/no-result/error distinct; DON'T hide explicit search behind default preview limit | P0 |
| ActionGroup (primary + secondary) | Static Home | baseline alignment, long labels, same target geometry, pending only blocks conflicting action | P0 |
| SaveStatus / InlineAlert / Toast | Pattern spec + Static instances | unsaved/saving/saved/readback-failed; warning/info/success/error, live-region; DON'T say saved on click | P0 |
| FilterGroup / SegmentedChoice / LanguageSwitch | Static and Specimen | active/pressed, keyboard, locale persistence; DON'T treat selection as focus | P0 |
| Breadcrumb / Back-Resume / ListRow | Static IA + Specimen sidebar/list | hierarchical location, single active route, Back != Resume | P1 |
| SourceCitation / StatusBadge | Static lessons | draft/reviewed/published/learner-note distinct; non-color-only meaning | P0 |
| CharacterBubble / LessonPrompt / QuestionField | Static Home and lesson, Pilot prompt | safe crop, text wrap, contextual answer/retry; DON'T let art/tail cover CTA | P0 |
| Menu / Tooltip / Disclosure | Specimen dropdown; no confirmed reusable React | keyboard Escape/outside click/arrow, focus restoration; avoid nested traps | P1 |

### 3. Organisms

| Component / contract | Evidence | Acceptance scope | Priority |
| --- | --- | --- | --- |
| AppHeader / BottomNav / SideNav | Static | single active route, sand oval, transparent Home exception, fixed safe-area, keyboard/focus | P0 |
| HomeMirror + Dialogue + CTA | Static | full bleed, no root scroll only where feasible; long text, visible actions, iPad rotation | P1 |
| CatalogExplorer / CourseCardGrid | Static | Group→Field→Course→Lesson navigation, adaptive 2-up spell exception, data/source semantics | P1 |
| LearningFlow (L09) | Static canonical + Pilot React | **one source of lesson content, one owner of attempt state, VI/EN, resume, hints, rubric, post-submit answer visibility** | P0 |
| Assessment / RubricPanel | Static/Pilot | answer locking, no false scoring, accessible labels, save conflict/failed readback | P0 |
| AuthPanel / AccountSwitcher | Pilot AuthPanel, no shared library | **Google-only invite**, verified session, denied/revoked/error, separate learner state; no cloud without independent security gate | P0 |
| NoteEditor / DiaryCalendar / ActivityChart | Static, Specimen | local-only privacy, autosave truth, empty vs zero; import/export/recovery, no fake chart rows | P1 |
| CheckinDialog / MentorDialog | Static | focus trap/restoration, Scroll-body/footer safe, skippable check-in, Lão Lý FAB hidden while dialog open | P1 |
| EmptyState / ErrorState / LoadingState | Static shared scene CSS; review | same anatomy and recovery behavior; true async only, semantic announcements; DON'T show error for valid empty | P0 |
| SyncStatus / ConflictResolver / InviteDenied | Draft protocol, not shipped UI | offline/queued/syncing/synced/failed/conflict, explicit keep-local/use-remote, fail closed, consent | P0 when sync is enabled |
| NotificationCenter / In-appReminder | Not confirmed in reusable library | opt-in notification permissions, no implicit push or paid service; iPhone reminder link is optional enhancement | P2 |

### 4. Templates (composition; not new atomic primitives)

1. **Home template:** full-bleed mirror and context, 2 aligned actions, selected nav and mentor, iPad landscape/portrait art contract.
2. **Catalog template:** Group → Field → Course → Lesson; search/filter/empty and scholarly source context; no hardcoded 3-course quotas.
3. **Learning template:** lesson header + progress + reading + practice + answer/rubric + feedback + resume, adaptable to L2 practice frameworks.
4. **Account template:** invited Google auth + session/access states + account switch/logout, no credential path before privacy QA.
5. **Personal workspace template:** notes, diary, bookmarks, backup/import, permissions/local-only status.
6. **Guide/Spell template:** 13 methods searchable, approved compact 2-up mobile, details and original academic naming.
7. **Feedback template:** loading, empty, error, offline, conflict with context-aware recovery.

### 5. Pages (data-bound instances; do not duplicate component CSS)

Actual Home, each of 15 Fields / course / lesson screens, L09-1-2, Spell list/detail, Notebook/Diary, Search, Settings/Auth, error/empty screens should instantiate templates with data and local content. Screens are not themselves component variants. Preserve all existing PO-locked canonical lessons and IDs.

## Specification of Done for **each** reusable component

A component is not marked READY until all fields are present and tested:
1. ID / Atomic level / functional purpose / owner / existing app selector(s).
2. When to use and **when NOT** to use; explicit **Do/Don't** with examples.
3. Anatomy/slots and composition boundaries (no nested interactive trap).
4. Variants/sizes/density, state chart and allowed transitions.
5. **Reference → semantic → component** token binding with no raw fallback in app styling.
6. React props/events, controlled vs uncontrolled input, ref/focus support, semantic DOM; types.
7. Keyboard, touch, ARIA roles/name/state and WCAG 2.2 AA acceptance.
8. VI/EN content, long copy, wrapping, visual crop and 200% text/320px reflow.
9. Responsive/safe-area/overlay/landscape-short-height behavior.
10. Live specimen and state stories; unit/a11y/browser regression tests, captured failures and evidence SHA.
11. Decision provenance and PO G2 acceptance **separate from code/test status**.

## React implementation contract (16.2; proposal, NOT executed by this audit)

- Shared authored `tokens.json` remains authority. Generate CSS and a **typed TS token export** from same source. Do not manually duplicate palette or spacing constants in React. Maintain semantic roles and documented compatibility aliases.
- Introduce `src/ui/atoms`, `molecules`, `organisms`, `templates`, `patterns` (crosscutting accessibility/animation), and `styles` while keeping product/learning domain models outside UI primitives. Avoid a large third-party component framework that overrides li.'s approved visual identity.
- Start with **Button, IconButton, Text, Field, Card, Status, Progress, Dialog** and states; then L09 composites. Replace pilot-only CSS values/radii through a scoped adapter preserving current approved geometry; don't globally reset original site styles.
- **CI first:** expand token auditor to `tools/step16-real-l09-react-island/src/**/*.{css,tsx}` and later canonical React dir; differentiate CSS numbers that are data/geometry from actual design values. Add typed token generation parity and 0 new raw component declarations; test no CSS bleed in native shell.
- Build a small low-cost live component explorer (Vite route or repo fixture) with auto-matrix for variant/state/VI-EN/mobile/tablet rather than adopting paid Storybook hosting. No new paid service.
- Migrate only per-screen behind feature flag default OFF, native fallback; L09 source data canonical, one writable attempt owner. Don't mount production Google auth or private sync until 16.1 security gate and PO review.
- No automatic merge/deploy. CI and documentation are evidence only; G2 and real Safari/PWA/VoiceOver remain explicit separate gates.

## High-priority corrective backlog (proposal)

| ID | Severity | Work | Acceptance evidence |
| --- | --- | --- | --- |
| DS-R01 | P0 | Extend source token audit to React TSX/CSS with scoped exceptions; remove L09 pilot's unapproved 6/8px rounded controls and free literal type/spacing | CI deterministic zero React design literal violations; visual/behavior parity with canonical L09 |
| DS-R02 | P0 | First shared React atoms + molecules API and composite variants | Typed props, variant/state/locale/keyboard tests, one source tokens |
| DS-R03 | P0 | L09 Native↔React component/state parity and resume | One writer, same canonical content, no duplicate persistence, denied storage recovery |
| DS-R04 | P0 | Exact Google-only invited Auth/account state and RLS gating before any cloud UI assertion | Authorized true Google live sign-in and negative invited/uninvited/revoked isolation QA after explicit PO migration/release approval |
| DS-R05 | P1 | Semantic token 3-level naming and deprecation register; motion/shadow/shape/layer tokens | Token crosswalk + state variants, no silently changed approved visual output |
| DS-R06 | P1 | Component-by-component Do/Don't and states/specimens parity inventory | Matrix records owner/Do/Don't/story/tests/approval for every active control |
| DS-R07 | P1 | Physical iPad rotation and accessibility acceptance | iPhone/iPad portrait+landscape+rotation, 200% zoom, VoiceOver/focus, recorded Pass/Fail/Unverified |
| DS-R08 | P2 | Optional notification/sound interaction pattern | opt-in/mute/reduced-motion, no permission prompt without user action |

## UX-DS-35 · responsive follow-up and execution plan (DRAFT)

The initial audit is now supplemented with [iPhone/iPad adaptive behavior contract](../responsive-adaptive.md) and the [10-stage remediation roadmap](../plans/2026-11-19-atomic-responsive-react-roadmap.md). Responsive layout must be derived from effective available window/container width, height, input and accessibility needs, while preserving current **Thần Chú 2-up 320–640**, the approved single iPad landscape Home art/portrait crop, and iPad device-scale baseline. Existing physical Safari repeat-rotation issue is open; no claimed fix. The roadmap is a staged proposal, not completed code, G2 acceptance or deployment.

## Source scope and external references

- [li. canonical Design Library](../README.md) and [components inventory](../components.md), [interaction contract](../ux-patterns-and-behavior.md), [token audit](2026-11-18-zero-component-token-debt.md) (relative links from this audit require `../`).
- [L09 React pilot CSS](https://github.com/sali5610/li/blob/architecture/step16-private-react-neon-sync-20261119/tools/step16-real-l09-react-island/src/pilot.css) and [Auth CSS](https://github.com/sali5610/li/blob/architecture/step16-private-react-neon-sync-20261119/tools/step16-real-l09-react-island/src/auth/auth-shell.css).
- [Material Design 3 official Android guidance](https://developer.android.com/develop/ui/compose/designsystems/material3) (roles, themes, component variant/state distinctions). **Refer to its system design reasoning; don't replace li. with Material visual styling**.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) (AA normative where applicable; 24px target minimum with exceptions is not equivalent to li.'s intended 48px web touch area).

**Audit status:** DOCUMENTED AND PROPOSED, not shipped React components. Cloudflare builds/deployments: 0 initiated. Incremental paid cost: 0 VND.