# li. UI/UX Design Library — zero-debt component token candidate v0.4

**UX-DS-20 candidate (2026-11-18):** Audited the first-party UI and normalized authored component color, typography (including legacy fluid sizes, line-height, tracking and font shorthand) and spacing to JSON-generated CSS variables. New strict `python3 tools/audit_design_tokens.py --check-zero` is enforced by Design System CI; audited **3,127 authored component declarations** with zero unmapped after migration. Existing color blends, art shadows and the PO-approved narrow 14/18px Guide spacing are preserved as named tokens, not rounded or recolored. `--olive` adds a **3px noninteractive editorial kicker rule** on non-Home section headings; selection, focus, nav, CTA and illustration paints are unchanged. See [UX-DS-20 source coverage report](audits/2026-11-18-zero-component-token-debt.md). This is **source-level component token coverage only**: CSS intrinsic keywords, genuine image URLs, illustration geometry, generated definitions, runtime state dimensions and SVG assets are explicitly out of scope; no claim of whole-app visual, physical-device, accessibility or Human PO G2 approval. Cost +0 VND.

**UX-DS-19 candidate (2026-11-18):** Added distinct porcelain `#FEFDFC` / `--porcelain` as the input/textarea surface: brighter than cream `#FAF9F5`, but not white `#FFFFFF`. Editable text, search, ruled textarea and icon-search across app and Component Library use the new foundation token. Disabled fields remain paper-2; notebook's 32px rule and 3px existing-border focus behavior are preserved. No button/card/illustration recoloring or G2 approval.

**UX-DS-18 candidate (2026-11-18):** Added independent base color `olive: #65734C` / runtime `--olive`, presented as an **Olive Moss** swatch in Component Library > Foundations. It is a muted supporting green (cream text contrast ≈4.85:1) alongside existing brand Moss `#243A29`, not a replacement or forced recolor of actual controls. Existing neutral-ivory paper and all current active semantic tokens remain unchanged. Human PO G2 visual gate is still open.

**UX-DS-17 candidate (2026-11-18):** The shared paper material has been cooled slightly toward neutral ivory across reading background, raised sheet, deeper sheet, card, rule, navigation selected fill and matching light semantic surfaces. The natural paper hierarchy, moss/forest/wood identity, approved illustrations and contrast-first text roles remain unchanged. This is an app-wide token refinement **for Human PO G2 review**, not final visual-identity approval. Runtime CSS is regenerated from tokens; every HTML consumer changes its stylesheet cache query.

**v0.3 implementation:** `design-system/tokens.json` is the **single authored source for color, typography and 4px spacing**. `tools/generate_design_tokens.py` deterministically produces `site/assets/design-tokens.css`; never edit that CSS directly. Six former inline style blocks were extracted in source order into `site/assets/li-layout.css`, while `site/assets/ui-foundations.css` owns reusable role-based component rules and `lesson-l09-hifi.css` covers the three frozen Wave1 lesson shells.

**Scope:** A versioned, testable contract for the [li. (理) GitHub Pages high-fi](https://sali5610.github.io/li/). The main app `site/index.html` now has **no inline `<style>` tags**. The original layered layout is still substantial and has some intentionally preserved illustration breakpoints, but tokenized color/type/spacing do not require another `<style>` override. This is a static CSS component system, not a React or Material UI framework. [Specimen](../site/design-system-preview.html) is only a visual review aid.


**Governance:** Notion = latest decisions/acceptance; GitHub = implementation and executable checks. An implemented detail may still be **G2 pending**. Newer direct PO decisions override older design proposals. No new visual direction or asset is approved by writing this library.

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
