# li. React Design System — Stage07 consumer handoff (DRAFT)

Canonical source: \`design-system/react/index.ts\`; tokens: \`design-system/tokens.json\` → generated \`site/assets/design-tokens.css\`. Story explorer: one GitHub Pages \`/li/design-system/\`, no second repo/build. All components are typed React, imported from the same public index. Import the relevant family CSS from this directory.

## Composition API

| Family | Public API | Owner of state/behavior |
| --- | --- | --- |
| Stage03 layouts | Container, Stack, Inline, Cluster, Grid, SafeArea, ScrollRegion | Layout-only, widths and tokens |
| Stage04 atoms / components | Text, Heading, Link, Divider, Badge, Progress, Field, Checkbox, Radio, Icon, IconButton, Button, Card, FilterChip, Dialog | Consumer supplies inputs, routes, callbacks and dialog open |
| Stage05 molecules | SearchField, ActionGroup, InlineFeedback, SaveStatus, LanguageSwitch, FilterGroup, ListRow, Breadcrumb, SourceStatus, Disclosure, ActionMenu | Consumer supplies query, filter, save/sync evidence, locale, academic review and menu actions |
| Stage06 patterns | AppHeader, HomeMirrorShell, CatalogShell, LearningFlowShell, AccountShell, FeedbackScene | Consumer owns all route, lesson, auth, profile, persistence and result state |

\`import {AppHeader,CatalogShell,LearningFlowShell,FeedbackScene} from './design-system/react/index'\` — an app's actual relative import depends on its integration directory. No separate package/npm publish is assumed.

**Required stylesheet imports:** \`layout.css\`, \`atoms.css\`, \`components.css\`, \`controls.css\`, \`dialog.css\`, \`molecules.css\`, \`templates.css\` when using related components, after generated \`design-tokens.css\`. Studio builds these through the existing esbuild story entry points. Do not copy CSS into another source of truth.

## What app integration means (not claimed by Studio)

1. Mount the same components inside actual React routes and pass real \`href\` / callbacks.
2. Show \`SaveStatus state="synced"\` **only after** backend-confirmed sync/readback. SourceStatus \`reviewed\` requires actual academic review. All Studio data is fixture.
3. Wire invite-only auth, learning attempts, feedback, user progress and search **in the owning workstreams**. This repository's DS folder does not provide these services.
4. Validate only affected UI interactions; use existing token/TS CI. Physical Safari, human visual G2 and product usefulness are separate gates, not auto-approved by build success.

## Responsive and accessibility guardrails

- iPhone: 375 CSS px; iPad portrait: 970; iPad landscape: 1408, plus fluid and 200% text zoom as meaningful variants. Use container/grid wrapping; no UA-specific rules in generic templates.
- Native semantics: nav current links, form fields labeled, progress accessible, details/summary native, status/alert without fake completion, modal uses native dialog.
- Keep link navigation separate from button actions, 44–48px interactive targets, keyboard focus-visible, semantic heading hierarchy, text wrapping, reduced motion preference.
- Home artwork is **passed as a slot**. The story reuses existing \`site/assets/home-li-ipad-20261119.jpg\`; it does not override the real Home composition or claim G2 approval.

Status: **Stage07 typed API handoff prepared**; *actual consumer adoption has not been checked*. G2 open; Safari physical device unverified. No new framework, backend/Cloudflare changes or second repository.


## Stage08 canonical-source cleanup + Stage09 targeted G2 review

**One owner per level:** layout in \`Layout.tsx\`, atoms in \`Atoms.tsx/Controls.tsx\`, shared controls in \`Components.tsx/Dialog.tsx\`, molecules in \`Molecules.tsx\`, and six presentation patterns in \`Templates.tsx\`. \`site/design-system/studio.js\` is **catalog/router only**, not a second component author. The old HTML-only \`#nav\` example was retired in favor of real React \`#appHeader\`; incoming \`#nav\` or \`#navigation\` deep links redirect to AppHeader. Historical \`site/component-library-archive.html\`, \`site/design-system-preview.html\` and old site CSS are deliberately not deleted: their dependencies were not proven absent; no broken current app pages in the name of “cleanup”.

**Stage09 review in the SAME Studio:** Select a pattern, its variant, state, language and viewport. The Studio URL now carries all four choices and story hash. Use **Copy review link** to share exactly those settings, or **Open full preview** to examine the same React story at the device's native browser viewport. The embedded preview auto-grows for non-fixed-height dimensions (no 326px clipping); explicit portrait/landscape size presets remain fixed and scrollable.

High-value direct Studio pattern links: \`#appHeader\`, \`#homeMirror\`, \`#catalogShell\`, \`#learningShell\`, \`#accountShell\`, \`#feedbackScene\`. Compare typography, hierarchy and density at phone 390, iPad portrait 970×1408, landscape 1408×832 and actual desktop. **Do not require repeated PO testing:** one focused G2 review of composition/visual identity is enough to guide the next adjustment. Browser/device visual tests, PO approval and app integration are still **OPEN** until evidenced separately; TypeScript + Pages green are not those proofs.


## Focus behavior (PO correction 2026-11-20)

All keyboard-accessible controls keep **visible focus**, but do **not** draw an extra green outline. In the canonical \`focus.css\`, the **same** border changes thickness from 1px to 3px in moss/forest, or borderless actions thicken an underline / emphasize the existing surface. Invalid fields retain the error color. \`focus.css\` imports last in every React Studio story. Select \`State → focus\` to see the deterministic specimen and Tab for actual keyboard focus. G2 and Safari physical device remain open.

## UX-DS-11 → UX-DS-35 parity restoration (candidate React source, 2026-11-20)

All 12 missing families and 8 partial equivalents are represented by **20 importable React APIs and real interactive stories**, not an embedded copy of old static HTML. They live in `LegacyNavigation.tsx`, `LegacyCards.tsx`, `LegacyControls.tsx`, `LegacyDataViz.tsx` with shared `legacy.css`, bundle `LegacyGalleryStory.tsx` and the SAME Studio catalog. Archive review assets are reused via story URLs. Human PO G2 approval **not inferred** from parity. Legacy candidates remain DRAFT.

| Studio route | Historical family | React API | Variants | States |
| --- | --- | --- | --- | --- |
| `bottomNav` | Bottom Navigation | `MobileBottomNav` in `LegacyNavigation.tsx` | 4 tabs | default, selected, focus |
| `sidebarMenu` | Sidebar Menu | `SidebarMenu` in `LegacyNavigation.tsx` | Sections | default, focus |
| `topNavVariants` | Top Nav Variants | `TopNavContext` in `LegacyNavigation.tsx` | Logo, Back, Transparent | default, focus |
| `methodTile` | Thần Chú Method Tile | `MethodTile` in `LegacyCards.tsx` | Primary, Secondary, Dark | default, focus |
| `mediaCard` | Illustrated & Image Card | `MediaCard` in `LegacyCards.tsx` | Top, Side, Contained | default, dark |
| `horizontalCard` | Horizontal Media Card | `HorizontalCard` in `LegacyCards.tsx` | Text, Photo, Illustration, Icon | default, dark |
| `chatBubble` | Home Chat Bubble | `ChatBubble` in `LegacyCards.tsx` | Forest, Paper | default |
| `tagChip` | Static Tag Chip | `TagChip` in `LegacyCards.tsx` | Category | default |
| `editorialCard` | Editorial Card Anatomy | `EditorialCard` in `LegacyCards.tsx` | Cream, Ivory, Secondary, Dark | default, focus |
| `selectField` | Selection Dropdown | `SelectField` in `LegacyControls.tsx` | Native select | default, disabled, focus |
| `notebookTextarea` | Ruled Notebook Textarea | `NotebookTextarea` in `LegacyControls.tsx` | Ruled | default, readonly, disabled, focus |
| `functionalIcons` | Functional Icon Roles | `FunctionalIcon` in `LegacyControls.tsx` | 18px, 20px, 22px, 24px | default |
| `smallAction` | Small & Text Action | `SmallAction` in `LegacyControls.tsx` | Primary, Secondary, Text | default, disabled, focus |
| `progressVariants` | Progress Variants | `ProgressVariants` in `LegacyControls.tsx` | Linear, Compact, Indeterminate | default |
| `iconField` | Icon-bearing Input | `IconField` in `LegacyControls.tsx` | Search | default, error, disabled, focus |
| `checkinRadioModal` | Check-in Radio Modal | `CheckinRadioModal` in `LegacyControls.tsx` | Yes / No | default, focus |
| `monthCalendar` | Monthly Activity Calendar | `MonthCalendar` in `LegacyDataViz.tsx` | Month | default, focus |
| `stackedActivity` | Seven-day Activity Bars | `StackedActivityChart` in `LegacyDataViz.tsx` | 7 days | default, focus |
| `laoLyState` | Lão Lý Loading & Error Art | `LaoLyStateScene` in `LegacyDataViz.tsx` | Loading, Error | default |
| `laoLyCompanion` | Companion FAB & Dialog | `LaoLyCompanion` in `LegacyNavigation.tsx` | Companion | default, focus |

**Ownership:** UI modules do not persist, authenticate, write to Neon or call an AI backend. Calendar and chart take real caller-supplied data and distinguish no record from zero, and never infer user capacity/health. FAB and check-in modal use controlled Dialog. Bottom navigation links are real hrefs in actual consumer and hash fixtures inside the story. Source of truth: React exports, not UX-DS-11 archive. **Focus rule:** no extra outer green rectangle — existing border thickens or underline emphasizes on keyboard. `State: focus` is a fixture, G2 still open.


## Lucide Icon Manager · pinned catalog + role governance

- **One source:** \`lucide-react@1.76.0\` pinned exactly in \`design-system/react/package.json\`. \`npm install\` (existing Studio CI) installs it; \`npm run build\` compiles the gallery from real package exports. No CDN/runtime API, manual SVG copies, custom icon duplication or additional repo.
- **Studio:** \`/li/design-system/#lucideManager\`. Search the full installed Lucide export set, inspect an icon at sizes 18/20/22/24/32/40 and stroke widths 1/1.5/2/2.5, filter the curated li. roles, copy JSX import or stable \`LiIcon\` usage and link to upstream. Gallery code is deliberately Studio-only and is **not imported** in app entrypoints (large full catalog is a design-time cost, not a learner app cost).
- **Approved product mapping:** \`design-system/react/LucideIcons.tsx\` is the owner of stable icon role names (e.g. \`home\` renders upstream \`House\`, \`close\` renders \`X\`). Existing \`Controls.Icon\` and \`LegacyControls.FunctionalIcon\` preserve their public API but now call the same Lucide adapter. LiIcon is accessible: decorative icons hidden, meaningful ones get label.
- **Sync/update:** installed catalog is automatically recompiled when the DS is built/deployed. To update upstream icon releases, change exact pinned npm version in a reviewed PR; verify the approved role mapping and CI before publishing. **Syncing does not authorize a design change** or auto-write project files from the website. Site says "synced at build", not "up to date with npm latest".
- **Focus and style:** regular Lucide outlines respect currentColor/stroke and DS size/stroke; keyboard focus belongs to the **button/link hosting** the icon, never an extra outer green ring on the icon itself.
- **Validation boundary:** CI compile + Pages deployment verify source availability. PO visual G2, mobile Safari and actual app adoption remain separate. No extra test frameworks.


### Data Viz Today control · 2026-11-20
Both MonthCalendar and StackedActivityChart show a labeled **Hôm nay / Today** button. They use caller-supplied `todayDate` (local calendar date), not the device clock inside the library.
MonthCalendar jumps across months using `onMonthChange` and selects today; its button is disabled if the current month differs and no month-change handler exists. StackedActivityChart selects today when within `days`; for an older seven-day window, provide `onToday` to recenter the caller-owned window and selection, otherwise the action is disabled. Native buttons have 44px targets and a single thicker existing focus border, never an outer green outline. Story data is fixture-only.
