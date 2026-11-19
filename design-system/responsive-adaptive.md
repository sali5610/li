# li. Responsive & Adaptive Design Contract — iPhone / iPad / Web (PROPOSAL v1.0)

> **Status: DRAFT for UX-DS-35, 2026-11-19.** This is a proposed canonical responsive contract, NOT an implementation or Human PO G2 visual approval. Approved li. visual identity details, current iPad artwork, phone Thần Chú 2-up, Wave1 content and Google-only invite decisions remain unchanged. GitHub main remains production source; apply only through reviewed PR and screen-by-screen QA.

**Owner hierarchy:** [Design Library](README.md) → [token JSON](tokens.json) → this adaptive contract → [component contracts](components.md) / [behavior contracts](ux-patterns-and-behavior.md) → [QA](qa-checklist.md). [Latest Notion Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) owns accepted PO decisions. [Atomic audit](audits/2026-11-19-atomic-react-readiness.md) records uncovered React reuse.

## A. Root causes and evidence boundary

1. Existing static site has overlapping art/scene selectors, `li-layout.css` historical geometry and `ui-foundations.css`, plus `ipad-home-canvas.css` scoped to Home and `ipad-safari-rotation.js`. This is not yet one systematic responsive component API.
2. `tokens.json` contains separate **iPad portrait** and **landscape** deviceScale values (e.g. body 18/28 in both; portrait page gutter 32/card 28/control 56/icon 24; landscape gutter 40/card 32/control 56/icon 24). These are existing implementation values, **not authority to apply tablet density to any viewport that merely happens to be wide**.
3. PO physical Safari evidence: after repeated portrait→landscape rotation, outer/visual viewport and stale root disagreed (e.g. outer 1408×970, visual 1408×918, root 970×1270); Home artwork stopped with empty paper. Current JS physical-geometry workaround has headless/synthetic coverage but final real-device signoff remains **OPEN**. Do not claim fix solely because CSS media queries or Chromium tests pass.
4. Source-level zero-unmapped token audit counts static `site/` component declarations and excludes pilot React CSS/TSX. Per-component computed styles, geometry, iPad rotation, VoiceOver, motion and long-copy parity remain separately unverified.
5. User-provided Home iPad scene is one approved **landscape asset**; portrait uses a crop. Do not redraw/swap it as a CSS workaround.

## B. Adaptive principles (binding *once accepted*)

- **Viewport ≠ hardware model.** Layout follows effective app viewport and **component container** inline size. An iPad Split View may use compact behavior; an iPhone landscape may be wide but short. Use device checks only for verified platform bugs, never for ordinary component size/columns.
- **Four independent axes:** (1) available inline size; (2) available block size and keyboard/browser chrome; (3) input modality (touch/keyboard/pointer); (4) reduced motion, zoom, contrast, language and accessibility settings. Test permutations, not just 'phone portrait' and 'tablet landscape'.
- **Responsive ≠ scaled mockup.** Do not apply `transform: scale()`, fixed pixel position offsets or one `font-size` override to the whole UI. Reflow structure, recompose information hierarchy and use responsive semantic tokens.
- **Atomic ownership:** foundations own values; atoms own size and alignment; molecules own wrapping/stacking; organisms own navigation/focus/overlays; templates own grid and composition; pages own data only. A page cannot invent a second Button/Field style.
- **No silent visual changes.** Hard shadow, square controls, sand oval active nav, chip pill, Lão Lý bubble, porcelain editable fields, paper/moss and approved art exceptions stay intact. Device-specific visual changes beyond accepted policy require PO G2 review.
- **Critical actions stay operable.** A requested one-screen Home applies in ordinary supported conditions; when 200% zoom, assistive text sizing, keyboard or very short viewport makes content unreachable, a documented internal-scroll/reflow escape is required (proposal; needs PO acceptance). Never hide task controls merely to satisfy a no-scroll screenshot.

## C. Proposed responsive width classes (CSS px; PRODUCT PROPOSAL, not official Material breakpoint values)

| Class | Effective viewport width | Default strategy | Caveat |
| --- | --- | --- | --- |
| Compact | 320–599 | Single-column reading, compact navigation, flexible action groups; some explicitly approved compact 2-up cards | **Thần Chú existing 2-up remains 2-up through 640px** (approved exception) |
| Medium | 600–839 | Flexible 1→2 columns when content fits, compact or adaptive nav, tablet split-window behavior | 600–640 Thần Chú stays approved 2-up; 601–743 header must keep 48px targets |
| Expanded | 840–1199 | Two-pane only if *container* supports content/labels; larger reading gutters | Do not assume iPad full screen or portrait merely by width |
| Wide | 1200+ | Optional additional info pane, max reading width; avoid overstretched paragraphs | iPhone/window narrow-height still may need compact vertical composition |

**Width bands above are a starting proposal for li., not literal Apple/Material requirements.** Actual component container queries should use content-based cutovers, with named tokens and tests. Preserve existing 744/820/1024/1133/1194/1366 widths in regression fixtures. Distinguish responsive **layout** class from **density** tokens (for example, full-size iPad 56px intended controls vs compact windows); avoid inflating component height based on user agent alone.

**Height behavior:** independently test short visible height (e.g. 320, 375, 568, 667 CSS px) and large heights; geometry is based on accessible content area after header, safe area, keyboard, bottom nav, and browser chrome. Don't set a static minimum scene height that pushes CTA offscreen. Use `100dvh`/`100svh` intentionally, with fallback and runtime tests; never assume `100vh` equals visible area on mobile Safari.

## D. Foundation token & CSS architecture

**Current state:** `tokens.json` owns color, type, spacing and two iPad deviceScales. **Proposed new names are NOT yet implemented or approved numeric values:**

- `layout.window.{compact,medium,expanded,wide}` (breakpoint reference), `layout.container.{reading,card,sidebar,dialog}` (max/min inline size), `layout.gutter.{compact,medium,expanded}`, `layout.safeArea.{top,bottom,left,right}`.
- `density.{compact,comfortable}` and responsive component-role tokens `control.minSize`, `control.paddingInline`, `icon.size`, `card.padding`; map iPad current scale as the **initial parity baseline**, not a new source of silent visual change.
- `typography.role.{display,headline,title,body,support,caption}` with validated responsive role overrides; no arbitrary per-screen `clamp()` or tiny visible labels. Default body 16/24 CSS px for reading, support ≥14/20, full-size iPad current body 18/28.
- `shape.{control,navPill,chipPill,mentorBubble}`, `elevation.{surface,pressed,overlay}`, `motion.{duration,easing}`, `layer.{header,nav,modal,mentor,toast}`; retain current appearance until G2 review.
- **Source derivation:** authored JSON → deterministically generated CSS variables + typed React token module → pure UI components. Tests must fail any unreviewed raw paint/type/space/shape, token-name drift or duplicated React palette.
- CSS layout ownership: global tokens/reset → components (scoped, preferably CSS module) → responsive container rules → template/grid art-specific composition. Platform Safari workaround, if necessary, is isolated to Home in one module with automated + real device evidence. Track and delete obsolete `!important` overrides only after screenshot/behavior parity.

## E. Component responsive specifications — Do / Don't

| Family | Compact / short-height behavior | Medium & expanded behavior | DO | DON'T |
| --- | --- | --- | --- | --- |
| Type + buttons | 16/24 body, ≥14/20 essential support, 48 CSS px intended hit area, text wraps or group stacks | iPad current 18/28 body, control min 56 only in approved full-size density context | Preserve full VI/EN labels, stable baseline and loading width | Scale whole DOM, use 10px CTA label, hide overflowed action |
| Header + bottom nav | No overlap with safe area; four actual destination labels/actions and single selected route | Change navigation pattern only when available width and content require it; keep same active semantics | Sand oval selected + accessible name/aria-current; keyboard focus distinct | Detect iPad by UA and force sidebar in split view; sticky toolbar hides focused element |
| ActionGroup | Two actions side by side if minimum control widths fit; otherwise stack logically without reordering | Larger component targets/insets using tokens; align bubble and CTA ownership in same grid | Keep **Lưu → Đào sâu** sequence, visible gap, no overlap | Absolute-left/button-width fixes for a single screenshot |
| Cards / grids | Content-safe 1-column by default; **Guide/Thần Chú 2-up remains 2-up 320–640** with full method title and details reachable | 2-up / panes based on card min-width and container | Container queries, max reading width, portrait crop-safe art | `minmax(220px,1fr)` accidentally collapse accepted Guide tiles to one column |
| Forms / editor | Labels always visible; form 1 column; keyboard-safe focused field and footer | 1–2 columns when needed, controlled width, notebook 32px line fidelity | Validation inline, unsaved draft recoverable | Placeholder as label; fixed footer hidden by keyboard |
| Modal / mentor | Dialog height constrained to visible viewport; independent scrolling body, header/footer reachable; FAB hidden under modal | Constrain width and avoid absurdly stretched modal; support pointer/keyboard | Escape/close/focus containment/restore, no nested trap | `overflow:hidden` on whole app trapping long dialog |
| Home scene | Keep approved art/crop; question inside illustrated mirror; centered context bubble above two CTAs; safe bottom insets | Same approved iPad landscape art, portrait via crop; iPad scene and shell must fill *current* visible rectangle after repeated rotations | Reflow text/actions and permit accessibility fallback scroll when needed | Force static portrait asset, use new hardcoded absolute offsets, claim fixed without real rotation |
| Images / Lão Lý | Art `object-fit` per approved crop/contain; no critical text baked inside; FAB cannot cover nav | Asset-crop focus and bubble positioning in grid, not arbitrary pixel offsets | Meaningful alt when informative, decorative empty alt | Crop away discipline identifier, mentor over buttons |
| Progress / charts | No invented 7-day bars, keyboard-readable label, horizontal scroll only for essential 2D charts | Keep true data domains and labels; wider panes when space exists | 0 vs no-record/unknown; accessible data table alternatives | Fake completion or silent chart clipping |
| Search | Input spans available width, clear button operable, results in readable list | Results can use split panes only when container permits | Explicit query searches all eligible items/VI-EN aliases, distinct loading/no result/error | Cap explicit search to default preview set or reset on orientation |
| Auth / sync | Google-only invited, denied/error/offline/local status accessible at any width | Same permission semantics, just different layout | Never leak another user's data; keyboard accessible logout/retry | UI-only allowlist or claim cloud saved before server evidence |

## F. iPhone rules

1. Verify real content widths at 320, 375, 390, 402, 430 CSS px and both portrait and landscape; **do not equate physical pixels with CSS px**.
2. Account for top notch, Home indicator, fixed bottom nav, Safari toolbar and virtual keyboard using `env(safe-area-inset-*)` where appropriate. Required actions must be in accessible scroll region.
3. On short-height landscape, do not let full-screen Home / fixed modal / Lão Lý trap focus or hide Save/Close/Submit; switch to a usable compact vertical composition.
4. Respect pointer mode: hover-only UI never carries essential affordances; focus remains visible for keyboard and VoiceOver. No accidental square tap flash without suppressing focus indicators.
5. Preserve native pinch zoom/200% text; `user-scalable=no` is prohibited.

## G. iPad rules

1. Support portrait, landscape, repeated orientation changes, Split View / Stage Manager-sized windows, browser UI appearance changes, hardware keyboard and pointer. Layout responds to **current window** not `screen.width` alone.
2. Full-size iPad can use approved portrait/landscape type/layout density tokens; split window must fall back to suitable compact/medium content-based behaviors rather than oversize controls.
3. Use one approved iPad landscape Home image; portrait is an image **crop**, not a different production art. Keep question in mirror, context bubble and pair of CTAs aligned centrally in their shared content block per current decisions.
4. No forced desktop three-column layout just because device is iPad. Additional panels appear only when available container width preserves readable main content and clickable controls.
5. Current Safari workaround in `ipad-safari-rotation.js` must be treated as **temporary platform-specific compatibility**, not a general responsive engine. Preserve it until production parity has been proven on actual devices; replace/retire only with before/after measured evidence. No duplicated CSS recovery classes, orientation reload, numeric viewport-meta rewriting, lost draft, or cloud calls.
6. Check portrait→landscape→portrait→landscape without refresh, including browser tab switch/back-forward, bottom nav, Lão Lý modal, home question persistence, split-view entry/exit and layout root vs visual viewport. No blank paper strip/CTA displacement/horizontal overflow.

## H. QA / acceptance matrix

**Viewport test examples (CSS px):**
- Compact portrait: `320×568`, `375×667`, `390×844`, `402×874`, `430×932`.
- Phone short landscape: `568×320`, `667×375`, `844×390`.
- Medium/split: `600×800`, `640×820`, `744×1133`, `820×1180`.
- Full iPad portrait: `970×1408`, `1024×1366`.
- Full iPad landscape: `1133×744`, `1194×834`, `1366×1024`, `1408×970`; repeat transitions at least 3 cycles where possible.
- Wide app view: `1440×900`; add resizable 320→1440 continuous sweep and 200% text / 400% reflow conditions.

**Every tested case records**: branch/commit SHA, actual CSS viewport and layout/visual metrics where meaningful, screen/organism/component/variant/state/locale/input modality, screenshot or reproduction, Pass/Fail/Unverified, blocker P0/P1/P2 and owner. Compare at least **Home, L09, Catalog, Guide, Settings/Auth, Tủ Riêng/Diary, modal/mentor/error states**, with realistic long VI/EN content and offline/error/save denied. Chrome/Playwright tests are helpful but **not** real Safari/VoiceOver proof.

**P0:** any unreachable CTA, cut-off dialog action, trapped focus, lost draft/account mix-up, false Saved/authorized state, blank significant scene after rotation, app impossible to navigate. **P1:** off-center group, wrong density, header/nav mismatch, clipped key copy, wrong selected mode. **P2:** nonfunctional optical polish.

**Release gates:** engineering CI PASS + real-device Safari/PWA/VoiceOver PASS + PO G2 signoff; auth/sync additionally needs 16.1 live invite/RLS/consent gates, separate from this UI contract. Release manual-only, no Cloudflare deployment triggered by docs.

## Sources (accessed Nov 2026)

- [Apple Human Interface Guidelines — Layout](https://developer.apple.com/design/human-interface-guidelines/layout): flexible size/window, adaptive composition, safe area. Native-specific guidance adapted for web, not identical dimensions.
- [Material Design adaptive layout guidance](https://developer.android.com/codelabs/adaptive-material-guidance): reason about window size classes and adaptive navigation/layout; li. retains original visual identity.
- [MDN CSS viewport concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts) and [MDN CSS lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length): visible vs layout viewport, `dvh/svh`.
- [MDN env safe area](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) and [meta viewport](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): 320 CSS px reflow/200% text. Exceptions for intrinsically two-dimensional content must be assessed narrowly.
