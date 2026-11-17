# UX-DS-03 · Full-app token coverage audit — 18 November 2026

**Status: AUDIT COMPLETE / REMEDIATION NOT STARTED.** Source anchor: `main` commit `d6ebb9f587f782c3ec187120cd3f8e3a1b6d6876` (Design Foundations v0.2). This report is a <b>source-level declaration inventory</b>, **not a computed CSS, screenshot, visual-consistency or accessibility certification**. The static scan was confirmed by GitHub Actions for [PR #6](https://github.com/sali5610/li/pull/6). No UI/content/illustration/route behavior was modified by this audit.

## Short answer

**No, color / typography / spacing are not fully mapped to the design tokens.** The newest runtime layer `site/assets/ui-foundations.css` predominantly uses canonical vars; the large inline legacy CSS and native lesson CSS do not. Existing CI was falsely easy to read as complete coverage because it validated the new layer only, not all CSS sources. The new audit runner makes the debt observable and adds a **no-growth ratchet**, while permitting historical values until safely migrated.

## 1. Exact static counts

Classification: `with_var` means the declaration contains at least one CSS `var(--...)`; `without_var` includes literal `0`, `auto`, `transparent`, `currentColor`, inheritance, deliberate image-composition values, and potentially superseded declarations. This classification **does not say every without-var value is wrong**. Spacing off-grid = occurrences of literal `px` not divisible by 4, not unique components or computed values.

| CSS surface | Color without / total | Typography without / total | Spacing without / total | Off-grid spacing px occurrences |
| --- | ---: | ---: | ---: | ---: |
| `site/index.html` — six inline `<style>` blocks | **145 / 414** | **291 / 292** | **369 / 369** | **313** |
| `site/assets/lesson-l09-hifi.css` (shared L03/L09/L15) | **1 / 32** | **29 / 29** | **53 / 53** | **40** |
| `site/assets/ui-foundations.css` v0.2 | **0 / 0** | **2 / 80** | **1 / 92** | **0** |
| **Core CSS total** | **146 / 446** | **322 / 401** | **423 / 514** | **353** |
| `site/design-system-preview.html` (specimen, not primary app) | 1 / 29 | 36 / 36 | 32 / 32 | 0 |
| `site/lesson-source-lab.html` (published side tool) | 21 / 31 | 12 / 12 | 21 / 21 | 17 |

Key nuance: all 53 spacing declarations in lesson CSS lack vars, but some are currently superseded by shared foundations. The new foundations' remaining two literal typography declarations are an artwork-bound mirror font clamp `22–26px` and its unitless line-height; remaining raw spacing declaration is a deliberate zero. Specimen numbers align with the intended scale but are literal instead of consuming it.

Additional checks:
- `site/index.html`: **55** `font-size` declarations specifying 6–11px (including old responsive rules); native lesson stylesheet: **2** such declarations. Many are overridden by the new foundation, but which still win at every viewport remains unverified without browser computed-style snapshots.
- Inline style attributes: **11** in app HTML; three native lesson markup templates add one each. **8 off-grid inline spacing declarations**: five in `index.html`, one per L03/L09/L15 markup template. The report also inventories dynamically set JS style properties separately.
- App CSS has **52 distinct direct hexadecimal color values** across color-related declarations in the legacy main HTML (63 hex appearances); the source lab has 18 distinct color hex values. This counts semantic/contextual/scene art as well as potential token candidates; do not replace all colors blindly.
- Approximate structural collision scan found **311 repeated selector/property keys** and **235 `!important` declarations** among six main inline style blocks. This includes legitimate media-query variations. The **volume of layered overrides**, not each occurrence individually, is the maintainability risk.

## 2. Where mapping is missing — by screen / component

| Area | Concrete source and evidence | Assessment | Next action |
| --- | --- | --- | --- |
| **Global / reading surfaces** | `site/index.html` base `body` still specifies 15px/1.55; `.panel`, `.surface`, `.intro`, `.kicker`, `.action`, `.filter`, `.footer` use many literal sizes/insets. Foundation overrides shared roles with 16/24 and 14/20 but legacy remains. | **P1 shared component debt**; do not imply all old values render. | Move surviving common declarations to canonical role tokens; remove superseded declarations only after visual diffs. |
| **Home / Gương Vạn Vấn** | Repeated legacy rules for `#page-home .mirror-message h2` (font-size ~14 times), `#page-home .hero-dialogue-bubble p` (~11), bubble padding (~11), mirror position (~15). Some `11px` copy and `9px` labels exist in historical CSS; new foundation supplies 14px support and larger mirror clamp. | **P0 cascade/overflow risk**, high custom illustration dependency. | Consolidate one breakpoint matrix + artwork-safe text constraints. Browser-check 320/375/390/402/600/820/1440, long VI/EN, sticky nav and safe areas before deleting patches. Do not round image position/crop values to 4px. |
| **Thần Chú / Guide / method cards** | Old `#page-guide #method-cards` 2-column rules include `font-size:9px`, `10.5px`, arbitrary `18px` gaps; new foundation adds adaptive 220px min card and 14px support. Repeated guide mentor rules and 4px-incompatible decorative offsets remain. | **P1**; visually important but some legacy overwritten. | Extract method card/mentor primitives and test 13 items, title overflow, filters, selected states and contrast. |
| **Lessons Wave1 L03/L09/L15** | `site/assets/lesson-l09-hifi.css`: 29/29 typography and 53/53 spacing declarations without tokens; `.l09-stats span` has historical 10/11px; `.l09-figure figcaption strong` 13px; lesson JS markup each uses `style="margin-top:18px"`. | **P0/P1 concrete unmapped source**, some inline values bypass regular cascade. | Lift 18px inline margins to shared classes, map all lesson type/space to `--li-type-*`, `--li-leading-*`, `--li-space-*`, keep art/stat semantics; run answer/feedback + VI/EN regression. |
| **Settings and Guide Detail** | Legacy Settings two variants use `28px` / `30px` gap; foundation overrides to `32px` `!important`. Other `14px` and `18px` section margins still exist; new rule covers part of these. | **P1 redundant cascade debt**. | Remove replaced variants only with screenshot evidence; use `--li-section-gap` and spacing roles everywhere. |
| **Header, bottom nav, CTA** | Header/nav selected sand `#E5D8BA`, focus outlines such as `#7E984F` and `#806D49` are used directly in CSS even though some have JSON semantic counterparts. `.nav-btn` historical 10px label is superseded by new 14px. | **P1 semantic color token gap** and selected/focus regression risk. | Define CSS semantic aliases to the approved selected/focus values; use one shared state specification without changing actual colors. |
| **Lão Lý / overlays / statuses** | Legacy dialog, overlays and bubble have literal colors and spacing in `site/index.html`; `.action.warn` uses `#7D4330`, illustrated text/overlay uses multiple off-white variants. Foundation maps selected text/control roles but not all contextual colors. | **P1 semantic audit**, not all colors must equal base palette. | Inventory status/surface/on-image roles, map semantic names only after provenance/PO decision. Speech bubble geometry is approved exception, not blanket square corner reset. |
| **Toast / index HTML inline styles** | `site/index.html` inline style around lines 1450–1473 contains `margin-top:15px`, `17px`, toast `padding:13px` / `font-size:12px` and positioning. | **P1 directly unmapped**. | Replace presentation-only inline style with reusable classes/tokens; preserve dynamic visibility/geometry. |
| **Source Lab separate published route** | `site/lesson-source-lab.html` defines separate palette, 15px base, 13px small text and 17 off-grid spacing px occurrences; does not use shared foundations. | **P2 independent stylesheet**. | Decide whether to visually align as an internal tool or keep intentionally isolated; if aligned, consume same tokens. |
| **Design-system specimen** | `site/design-system-preview.html` uses matched *values* but literal typography/spacing (36/36 and 32/32 without vars), redefines base color vars locally while importing foundations. | **P2 design-system dogfooding gap**. | Make specimen consume actual tokens/classes and test component roles; no implied G2 approval. |

### CSS token vocabulary gaps
- Canonical JSON contains core colors and semantic entries, but several semantic values (e.g. active nav `#E5D8BA`, focus outline) are **not exposed as CSS variables in a single runtime color module**.
- Main HTML defines legacy `--light`, `--gold`, `--accent`, `--line`. These are not all in `tokens.json`; `--line` duplicates the visual rule value and several appear historical. Verify usage and approval before deleting or consolidating.
- Status warning, on-image contrast, cultural quote, speech-bubble fill and shadow colors may warrant semantic tokens. A custom visual exception must be explicitly marked as a design decision, not silently forced to palette entries.

## 3. Why existing tests missed this

`tools/validate_ui_foundations.py` checks **the new foundation file only** for 4px literals and type roles. `tools/validate_design_system.py` verifies that baseline colors exist *somewhere* in HTML and certain states/selectors remain present. Neither checks computed styles or guarantees that older later specificity / `!important` / inline styles are gone.

**New controls in PR #6:**
- `tools/audit_design_tokens.py` scans **all first-party site HTML, all first-party CSS and first-party JS** (excluding vendor Lucide, SVG artworks and binaries); reports declaration totals, raw-vs-var mapping, off-grid px, inline styles and examples.
- `design-system/audits/token-coverage-baseline.json` captures the measured baseline. CI `--check-baseline` **fails if any category of unmapped declarations or off-grid literals grows**, including in new files (baseline zero by default). Existing historical debt is **grandfathered but visible**, never counted as complete compliance.
- When debt decreases, preserve reduced ceiling by regenerating/reviewing baseline later; do **not** casually raise baseline to make failing CI green.
- No paid CI dependencies.

## 4. Remediation order and acceptance

1. **P0 — Stop the override cascade**: inventory which Home/Guide selectors actually win by viewport and state; make one breakpoint mapping. Protect existing artwork and latest PO-approved selected nav and mirror/CTA semantics.
2. **P1 — Extract + map components**: lesson CSS + JS markup and inline toast/Settings UI; apply color semantic vars and type/spacing role vars for shared Header, Nav, Action, Modal, Surface, Guide and Lesson. Remove copied historical values in small, reviewed PRs.
3. **P2 — Bring secondary routes into compliance**: Source Lab, specimen and legacy alias cleanup.
4. **Regression acceptance (before each merge)**: baseline no-growth audit + full `validate_site.py` + relevant native lesson and route tests; browser screenshot comparison at 320/375/390/402/600/820/1440, long VI/EN text, UI states and zoom. Run real iPhone Safari/PWA and VoiceOver separately, without pretending static CI verifies it.
5. **Governance**: Notion records Human PO approvals and decisions; GitHub owns tokens, source implementation and tests. This audit does **not** approve G2, change locked Wave1 content, publish Wave2 drafts or modify WF-BASE. Incremental cost $0.

**Related:** [Prior v0.2 design contract](../typography-spacing.md) · [Component inventory](../components.md) · [Issue #4 — Shared components and visual regression](https://github.com/sali5610/li/issues/4) · [PR #6 — Audit instrumentation](https://github.com/sali5610/li/pull/6)
