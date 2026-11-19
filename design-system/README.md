# li. UI/UX Design Library — canonical start here

> **SINGLE START HERE · Mandatory entrypoint for every li. UI/UX task.** This page is the one canonical **navigation and governance entrypoint** for the Design Library. Detailed rules remain in dedicated source-of-truth files linked below; do not maintain conflicting copies. Repository AI agents are instructed by [AGENTS.md](../AGENTS.md) to open this page before designing, reviewing, modifying or QA-testing any UI.

## Start here — mandatory UI/UX work protocol (UX-DS-23)

**Before touching a screen, asset, copy, token, component, test or UI documentation:**

1. **Read this page first**; identify which exact subject contracts below apply. Open the affected linked contracts *before* proposing or editing. Do not rely on remembered colors, historical examples, or the first CSS selector found.
2. **Reconcile decisions first:** read [Notion Product Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334), [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) and relevant [Step15 G2](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1) / [active Step13 copy](https://app.notion.com/p/41b6cf6db72a811aba36dcec9cc42c20). Newest explicit Human PO decisions supersede older *within their actual scope*. Notion owns approval/decision status; GitHub main owns implemented code and these executable design contracts.
3. **Classify the change:** design-only vs IA/navigation/copy/interaction/state/persistence behavior. For behavioral changes, work backwards through JTBD → evidence → IA → wireframe → copy → components → code → QA. Preserve the immutable WF-BASE; fork a working wireframe when a journey changes. Do not hide a flow change inside a CSS patch.
4. **Use the same library contract:** reuse token, component, variant and UI pattern; inspect *every* affected instance and override. Record a new variant or exception here and in its detailed owner file instead of copy-pasting one-off styles.
5. **Verify the whole journey:** screen × component × state × device/viewport × VI/EN × input method; follow [QA matrix](qa-checklist.md). Test actual persistence/error states, modal/focus, bottom nav/FAB overlap, empty data, 200% text, long labels. Capture evidence and distinguish automated CI from real Safari/PWA/VoiceOver.
6. **Maintain the library and handoff:** in the *same change* update affected source contracts, explicit Do/Don't and regression fixtures, and the relevant Notion decision/handoff. Include PR/SHA, actual test results and open G2/human-study/device gates. No new paid services.

### Design Library map — which file owns which truth?

| Layer / question | **Authoritative contract** | When to open it |
| --- | --- | --- |
| **Start, precedence, change workflow** | **This README** + root [AGENTS.md](../AGENTS.md) | **Every UI/UX task, without exception** |
| **Color, semantic paint, typography values, spacing, shape, target-size settings** | [tokens.json](tokens.json) → [generated design-tokens.css](../site/assets/design-tokens.css) | Every visual/component adjustment; **only edit JSON**, regenerate CSS |
| **Typography roles, 4px grid, responsive spacing** | [typography-spacing.md](typography-spacing.md) | Type, rhythm, text overflow, layouts |
| **Component inventory, selectors, variants, states, PO exceptions** | [components.md](components.md) | Every touched component and its siblings |
| **iPhone/iPad adaptive rules, window + container + height + safe-area + rotation** | [responsive-adaptive.md](responsive-adaptive.md) **(DRAFT, UX-DS-35)** | Every layout, component density, Safari, keyboard or viewport adjustment |
| **Atomic → Responsive → React staged remediation plan** | [UX-DS-35 implementation roadmap](plans/2026-11-19-atomic-responsive-react-roadmap.md) **(DRAFT)** | Before planning implementation PRs, migration order and gate checks |
| **Atomic-level gap inventory + React readiness (AUDIT, not approved implementation)** | [2026-11-19 atomic audit](audits/2026-11-19-atomic-react-readiness.md) | When planning React shared components, component-level Do/Don't or migration QA; keep approved designs unchanged |
| **Use / Don't use, interaction patterns, state transitions, accessibility behavior** | [ux-patterns-and-behavior.md](ux-patterns-and-behavior.md) | Any UI/UX interaction, new component or pattern; treat as default rule |
| **Coverage, acceptance, impact chain and device test evidence** | [qa-checklist.md](qa-checklist.md) | Every UI/UX PR or design review |
| **Actual component specimens** | [Component Library review](../site/component-library-review.html) | Compare rendered visual/state examples; a review specimen ≠ production signoff |
| **Loading/error illustrated states** | [Lão Lý state masters](../design-assets/lao-ly/README.md) + [shared scene CSS](../site/assets/li-state-scenes.css) + [Component Library Feedback](../site/component-library-review.html#feedback) | Any real pending/error operation, fallback message, or retry action; do not conflate empty with error |\n| **Lão Lý illustration / icon variant policy** | [Mirror-only geometric papercraft Lão Lý family](../design-assets/lao-ly/README.md) + [Notion character canon](https://app.notion.com/p/41b6cf6db72a81e685bdfd00bb063b82) | Any scene/mentor illustration, expression, Settings art, Component Library artwork or chat icon usage |
| **All image / icon / illustration asset custody + gaps** | [Visual Asset Registry](../design-assets/README.md) + [machine-readable manifest](../design-assets/manifest.json) | Every generated image, Home/background, logo, icon, new visual asset or change to an image file; distinguish canonical file, app alias, inline CSS image and unshipped concept |
| **Artwork / illustration approval** | [Notion Asset Library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f) | Scene, icon, Lão Lý or generated illustration |
| **Latest accepted copy and product decisions** | [Step13 active canon](https://app.notion.com/p/41b6cf6db72a811aba36dcec9cc42c20), [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) | Any labels, status, dialogue, UX journey or gate |

### UI rule snapshot — no guessing

- **Responsive ownership — proposal UX-DS-35:** effective viewport/container width, visible height and keyboard/safe-area govern layout; iPad Split View can use compact mode, and short-height iPhone landscape must keep controls reachable. Preserve approved Thần Chú 2-up 320–640px, current iPad density only in proper contexts, one landscape iPad Home artwork cropped for portrait, and repeat-rotation Safari proof. See [responsive-adaptive.md](responsive-adaptive.md). Do not remove current Safari fallback until physical verification; G2 remains OPEN.

- **Shape & material:** square ordinary controls, opaque offset hard shadows; **exceptions**: selected nav sand oval, rounded Lão Lý speech bubble, full-pill filter chips and organic illustration. Don't run global square-radius resets over exceptions.
- **Color roles:** paper `#F1F0E9`, cream `#FAF9F5`, porcelain editable fields `#FEFDFC`, brand Moss `#243A29`, Olive Moss `#65734C` **decorative editorial kicker only**; avoid off-token color and semantic misuse. Exact current values and role mapping are owned by JSON, not this quick reference.
- **Typography & spacing:** Crimson Text editorial titles; system sans body/control, 16/24 body, >=14/20 essential support, 4px spacing grid. Approved Guide 2-up narrow 14/18px micro-geometry is a documented exception; preserve full VI/EN method names.
- **Navigation & hierarchy:** one selected global route with sand oval + `aria-current=page`, matching header/mobile navigation; Home full-bleed with mirror question inside art, actions `Lưu` then `Đào sâu`; no fixed nav or Lão Lý covering content.
- **Input & touch:** target **48×48 CSS px intended** on new touch interactions; distinguish WCAG 2.2 AA 24×24 CSS px minimum (with exceptions) from Apple 44×44 *pt* and Android 48×48 *dp*. Focus-visible, accessible names, real disabled/readonly, reduced motion and zoom/reflow must work.
- **Lão Lý art (UX-ART-04/07; supersedes UX-ART-03):** exactly one **`Trong gương`-named** papercraft illustration family (10 poses), five separately approved clean-edge mini-head icons, and two contextual Loading/Error scenes. No active `Ngoài gương` asset family; the previous opposite UX-ART-03 sentence was obsolete. Follow [canonical character files](../design-assets/lao-ly/README.md) and [visual asset registry](../design-assets/README.md), retaining unapproved concepts outside production. Overall G2 remains open.
- **Behavior:** action uses button, navigation uses link; selected ≠ focus; clicked ≠ saved; errors must allow recovery; never fake cloud sync, mastery, health diagnosis, research approval, or a completed save.
- **Review truth:** token/CI checks are necessary but **not** physical iPhone/VoiceOver or complete WCAG certification. G2 visual identity acceptance remains **OPEN** until Human PO approves it.

### When changing a rule: one change, one traceable home

**Choose an owner file from the map.** If it is a token, edit `tokens.json` and regenerate CSS; if it is a component behavior, edit `components.md` and `ux-patterns-and-behavior.md` as applicable; if it changes QA, edit `qa-checklist.md` and its fixtures. Update this README only when the *entrypoint, policy, summary or ownership map* changes. Do not copy entire detailed contracts into a new parallel guideline or assume a GitHub merge approves a Notion G2 gate.

**Minimum PR report:** affected screens/components; source decision and any exception; files changed; behavior before/after; tests run with Pass/Fail/Unverified; status of Safari/PWA/VoiceOver/G2; Notion handoff update. Run `python3 tools/validate_design_system.py` for design-library index integrity as part of existing Design System CI.

## Implementation history and current evidence boundary

**UX-DS-20 candidate (2026-11-18):** Audited the first-party UI and normalized authored component color, typography (including legacy fluid sizes, line-height, tracking and font shorthand) and spacing to JSON-generated CSS variables. New strict `python3 tools/audit_design_tokens.py --check-zero` is enforced by Design System CI; audited **3,127 authored component declarations** with zero unmapped after migration. Existing color blends, art shadows and the PO-approved narrow 14/18px Guide spacing are preserved as named tokens, not rounded or recolored. `--olive` adds a **3px noninteractive editorial kicker rule** on non-Home section headings; selection, focus, nav, CTA and illustration paints are unchanged. See [UX-DS-20 source coverage report](audits/2026-11-18-zero-component-token-debt.md). This is **source-level component token coverage only**: CSS intrinsic keywords, genuine image URLs, illustration geometry, generated definitions, runtime state dimensions and SVG assets are explicitly out of scope; no claim of whole-app visual, physical-device, accessibility or Human PO G2 approval. Cost +0 VND.

**UX-DS-19 candidate (2026-11-18):** Added distinct porcelain `#FEFDFC` / `--porcelain` as the input/textarea surface: brighter than cream `#FAF9F5`, but not white `#FFFFFF`. Editable text, search, ruled textarea and icon-search across app and Component Library use the new foundation token. Disabled fields remain paper-2; notebook's 32px rule and 3px existing-border focus behavior are preserved. No button/card/illustration recoloring or G2 approval.

**UX-DS-18 candidate (2026-11-18):** Added independent base color `olive: #65734C` / runtime `--olive`, presented as an **Olive Moss** swatch in Component Library > Foundations. It is a muted supporting green (cream text contrast ≈4.85:1) alongside existing brand Moss `#243A29`, not a replacement or forced recolor of actual controls. Existing neutral-ivory paper and all current active semantic tokens remain unchanged. Human PO G2 visual gate is still open.

**UX-DS-17 candidate (2026-11-18):** The shared paper material has been cooled slightly toward neutral ivory across reading background, raised sheet, deeper sheet, card, rule, navigation selected fill and matching light semantic surfaces. The natural paper hierarchy, moss/forest/wood identity, approved illustrations and contrast-first text roles remain unchanged. This is an app-wide token refinement **for Human PO G2 review**, not final visual-identity approval. Runtime CSS is regenerated from tokens; every HTML consumer changes its stylesheet cache query.

**v0.3 implementation:** `design-system/tokens.json` is the **single authored source for color, typography and 4px spacing**. `tools/generate_design_tokens.py` deterministically produces `site/assets/design-tokens.css`; never edit that CSS directly. Six former inline style blocks were extracted in source order into `site/assets/li-layout.css`, while `site/assets/ui-foundations.css` owns reusable role-based component rules and `lesson-l09-hifi.css` covers the three frozen Wave1 lesson shells.

**Scope:** A versioned, testable contract for the [li. (理) GitHub Pages high-fi](https://sali5610.github.io/li/). The main app `site/index.html` now has **no inline `<style>` tags**. The original layered layout is still substantial and has some intentionally preserved illustration breakpoints, but tokenized color/type/spacing do not require another `<style>` override. This is a static CSS component system, not a React or Material UI framework. [Specimen](../site/design-system-preview.html) is only a visual review aid.


**Governance:** Notion = latest decisions/acceptance; GitHub = implementation and executable checks. An implemented detail may still be **G2 pending**. Newer direct PO decisions override older design proposals. No new visual direction or asset is approved by writing this library.

**UX-DS-22 behavior standards (2026-11-19):** [Do/Don't, UI patterns, interaction states, accessibility and QA contract](ux-patterns-and-behavior.md). The document defines expected behavior, not a claim that current UI passed the tests or that G2 is approved. It preserves existing design tokens and PO-specific geometry.

## Read order / source hierarchy
1. [Notion Product Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334) and [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5).
2. [Step13 ACTIVE UX writing](https://app.notion.com/p/41b6cf6db72a811aba36dcec9cc42c20), [S81 G2 token + crosswalk](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1), [illustration asset library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f).
3. More recent explicit PO bug/visual decisions (see handoff S142/S143 for header selected pill and touch feedback).
4. Latest `main` implementation (actual behavior, not proof of acceptance); compare against documents when they disagree.

## Files and responsibilities
| File | What it controls |
| --- | --- |
| [typography-spacing.md](typography-spacing.md) | M3-inspired readable type scale and strict 4px spatial grid, responsive mapping and migration boundary |
| [../tools/generate_design_tokens.py](../tools/generate_design_tokens.py) | Deterministically generates runtime CSS from JSON; `--check` detects drift |
| [../site/assets/design-tokens.css](../site/assets/design-tokens.css) | **Generated** color, semantic color, type and 4px spacing CSS variables |
| [../site/assets/li-layout.css](../site/assets/li-layout.css) | Extracted original six layout/illustration blocks in preserved cascade order |
| [../site/assets/lesson-l09-hifi.css](../site/assets/lesson-l09-hifi.css) | Shared tokenized native L03/L09/L15 lesson layout |
| [../site/assets/ui-foundations.css](../site/assets/ui-foundations.css) | Canonical reusable component and responsive-role CSS, loaded last |
| [../tools/validate_ui_foundations.py](../tools/validate_ui_foundations.py) | Mechanical spacing/type checks for new CSS; source only |
| [tokens.json](tokens.json) | Machine-readable implemented color, geometry, typography and touch baseline |
| [components.md](components.md) | Canonical component purpose, variants, states and code selectors |
| [ux-patterns-and-behavior.md](ux-patterns-and-behavior.md) | UX-DS-22 Do/Don't, pattern choice, state transitions, accessibility behavior and acceptance tests |
| [qa-checklist.md](qa-checklist.md) | Mandatory full-system review + screen/state/device matrix |
| [../tools/validate_design_system.py](../tools/validate_design_system.py) | Free stdlib structural checks comparing core tokens with current source |
| [../.github/workflows/li-design-contract.yml](../.github/workflows/li-design-contract.yml) | JSON/CSS parity, strict zero unmapped authored component declarations, debt ratchet and native site/interaction checks |
| [../.github/workflows/li-render-qa.yml](../.github/workflows/li-render-qa.yml) | Real headless Chrome computed-style smoke at seven viewport widths |
| [../AGENTS.md](../AGENTS.md) | Instructions for assistants editing the repo |

## State model
- **PO-accepted specific decision:** accepted only for its documented scope (e.g., seal symbol, sand active icon state); cite decision.
- **Observed implementation:** code exists in current site; not automatically approved or visually validated.
- **G2 pending:** overall visual consistency/signoff remains open; cannot be marked complete by code or CI.
- **Draft asset:** do not move into public repo or production until individually reviewed.
- **Deprecated:** earlier contradictory rule is archived; do not revive it.

## Current invariants
- Brand: **理 / li.**; scholar **Lão Lý**. A living, illustrated ancient-tree library, parchment/wood/moss/forest aesthetic.
- Controls generally have square geometry, opaque offset shadows and restrained decoration. **Exceptions**: active top/bottom nav **sand oval pill**, Lão Lý's actual **rounded speech bubble**, natural illustrated shapes. Newer explicit decisions outrank the old blanket “zero radius” rule.
- Current color baselines: paper `#F1F0E9`, moss `#243A29`, supporting olive `#65734C`, ink `#272A23`, nav active sand `#E8E4D9`; typography: Crimson Text headings, system sans utility/body.
- Global header icon controls and bottom navigation share the **same semantic selected state** (sand pill + moss ink, `aria-current="page"`), not a white-on-white active icon.
- Screen layout: Home scene edge-to-edge; reading areas bounded. Mirror question must fit within illustrated mirror; exactly **two Home main CTA buttons** in order **Lưu (left), Đào sâu (right)**. Persistent Lão Lý cannot block text or CTAs.
- Touch: accessible intended hit area at least **44×44 CSS px**, no iOS square highlight on icon controls; preserve visible keyboard focus. Text, buttons and layouts must accommodate Vietnamese/English lengths.
- Lessons must not imply published/proven/approved content when source or release state is draft. No fake persistence, metrics, diagnoses or academic signoff.

## CSS load order (one-way dependencies)

```
design-system/tokens.json (only editable source)
  └── tools/generate_design_tokens.py
       └── site/assets/design-tokens.css (generated)
             ↓
site/assets/li-layout.css (historical geometry and art CSS)
             ↓
site/assets/lesson-l09-hifi.css (shared Wave1 lesson rules)
             ↓
site/assets/ui-foundations.css (current reusable UI roles; last)
```

Edit a token in JSON → run `python3 tools/generate_design_tokens.py` → run `python3 tools/generate_design_tokens.py --check`. Add reusable visual styles in `ui-foundations.css`, not new `<style>` blocks in HTML or a cascade override appended to the layout file. Dynamic progress-bar width and hide/show state in JS are legitimate functional styles, not replacement token definitions.

## Remaining technical debt, measured honestly

[UX-DS-03 historical baseline audit](audits/2026-11-18-full-app-token-mapping.md) predates v0.3. [UX-DS-04 v0.3 remediation report](audits/2026-11-18-css-refactor-v03.md) gives the post-refactor figures and verified CI. The [automated auditor](../tools/audit_design_tokens.py) and [reduced debt ceiling](audits/token-coverage-baseline.json) prevent any new unmapped property count/off-grid value from increasing. **An unbound `auto`, `currentColor`, `transparent`, scene-specific image color or unitless line-height does not necessarily mean a design-token defect.** Not every historic art-position rule has been deduplicated and physical iPhone/PWA/VoiceOver/browser-zoom QA remains open.

## Browser and regression validation

- `python3 tools/generate_design_tokens.py --check`
- `python3 tools/validate_design_system.py`
- `python3 tools/validate_ui_foundations.py`
- `python3 tools/audit_design_tokens.py --check-baseline`
- `python3 tools/validate_site.py` (includes route, Lão Lý, mirror, Wave1 lesson tests)
- [Headless Chrome CI](../.github/workflows/li-render-qa.yml): actual rendered CSS at 320/375/390/402/600/820/1440 CSS px, guide truncation, body roles, source artwork, horizontal overflow. **Not** screenshot diff or Safari/VoiceOver certification.

## Further work — not silently marked complete

1. Incrementally deduplicate historical Home/mentor-specific cascade variants after visual screenshot comparisons with the selected artwork and long VI/EN copy.
2. Review and semantic-tokenize remaining scene-specific color literals only after confirming approved visual meaning and contrast.
3. Extend browser fixture to every modal, scroll state, focus/selected/error condition and actual iPhone PWA/VoiceOver/text-zoom. Keep G2 visual signoff and independent academic release gates open.

No new paid infrastructure or services.
