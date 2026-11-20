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
