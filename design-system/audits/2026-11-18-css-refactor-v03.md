# UX-DS-04 · Legacy CSS consolidation and runtime token migration — 2026-11-18

**Status:** Implementation and automated source/real-browser checks completed on branch `refactor/consolidate-runtime-design-tokens-20261118`, [PR #9](https://github.com/sali5610/li/pull/9). **Human Product Owner G2 visual review remains open**. No new paid services, no content/IA data migrations, no change to frozen WF-BASE, no intentional change to approved illustration PNG/WebP/SVG.

## 1. Authority chain and no-change contract

1. Notion [Project Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334), [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) and S81 design-system crosswalk were consulted before refactor. Latest S142/S143 selected navigation, S146 header/fav-icon, S126 locked three native Wave1 lessons and accepted S119 Home artwork kept intact.
2. Preserve existing routing, localStorage, quote/sources and native lesson semantic content. This is CSS token/source structure and a Guide tablet-overflow correction, not a new UX flow.
3. Old `index.html` had six historically appended `<style>` blocks with overlapping selectors and embedded base64 illustration paint. They were extracted **in original order** rather than wholesale cascade deletion that could shift art coordinates.

## 2. New executable architecture

| File | Role |
| --- | --- |
| [`design-system/tokens.json`](../tokens.json) | **Single editable value source** for core/semantic/scene colors, typography size + leading and 4px spacing scale |
| [`tools/generate_design_tokens.py`](../../tools/generate_design_tokens.py) | No-dependency JSON → CSS generator; `--check` fails on uncommitted/stale generated output |
| [`site/assets/design-tokens.css`](../../site/assets/design-tokens.css) | **Generated, never hand edited** runtime CSS variables; no duplicate brand palette in app HTML |
| [`site/assets/li-layout.css`](../../site/assets/li-layout.css) | Six old inline style blocks combined into one external sheet, keeping original cascade/geometry and CSS-relative approved image URLs |
| [`site/assets/lesson-l09-hifi.css`](../../site/assets/lesson-l09-hifi.css) | Shared L03/L09/L15 layout using type/space vars (no off-grid literal spacing) |
| [`site/assets/ui-foundations.css`](../../site/assets/ui-foundations.css) | Canonical shared components/roles, responsive viewport behavior and 32px notebook line pattern |
| [`site/index.html`](../../site/index.html) | Loads tokens → layout → lessons → shared foundations with updated v0.3 cache keys; **zero inline `<style>` blocks** |

The app index dropped from roughly 854 KB to 61 KB after moving the ~794 KB inline CSS (including pre-existing base64 art) to a cacheable stylesheet. That byte relocation is **not** a claimed network transfer reduction.

## 3. Before / after static debt evidence

Measured by `python3 tools/audit_design_tokens.py`; “raw” = declarations without `var()` and therefore includes `transparent`, `currentColor`, `auto`, unitless `line-height` and CSS art shades; not all raw values are user-visible defects. Literal off-grid px occurrences count numeric `margin`/`padding`/`gap` values **only**.

| Source and metric | v0.2 before | v0.3 after |
| --- | ---: | ---: |
| Main HTML embedded style blocks | **6** | **0** |
| Main CSS spacing declarations without token | 369/369 in `index.html` | 11/355 in external `li-layout.css` |
| Main CSS typography without token | 291/292 in `index.html` | 119/281 in `li-layout.css` |
| Main CSS color declarations without token | 145/414 in `index.html` | **85/414** in `li-layout.css` |
| Main CSS six-digit direct hex values | 48+ contextual/art occurrences | **0**, all exact original values moved to semantic or scene JSON tokens |
| Main CSS off-grid numeric spacing px occurrences | 313 | **0** |
| Shared native Wave1 lesson typography without token | 29/29 | 3/29 |
| Shared native Wave1 lesson spacing without token | 53/53 | 0/54 |
| Shared native Wave1 lesson off-grid numeric spacing px | 40 | **0** |
| L03/L09/L15 markup `style="margin-top:18px"` | 3 | 0 (one reused `.l09-source-note` class) |
| Source Lab raw-color declarations | 21/31 | 3/31 |
| Source Lab raw-type declarations | 12/12 | 4/12 |
| Source Lab off-grid spacing px | 17 | **0** |
| Type/spacing design specimen raw values | 36/36 and 32/32 | 0/36 and 1/32 (the one value is `auto`) |

All historical hex colors were preserved as their original numerical values, now with documented `--li-color-*` semantic or `--li-scene-*` illustration-specific roles in JSON. Remaining 85/414 raw color declarations are mostly alpha/currentColor/transparent and contextual paint syntax, not a plan to replace with arbitrary palette values.

Historical palette aliases `--gold`, `--accent`, `--line`, `--light` were removed after confirming their usage and redirecting live references to token names. The visible nav selected sand / focus, Home speech and art paint preserve their accepted values and independent role exceptions.

## 4. Removed obsolete overrides, not functionality

- Removed the S118 mobile forced-two-column `#method-cards` block that made 9–10.5px descriptions and hid text after two lines. Canonical adaptive 220px-min card layout remains, with 24px titles and 14px unclamped descriptions.
- Consolidated method icons/end alignment in `ui-foundations.css` and used shared source-note margin tokens for all three frozen lessons.
- Replaced S107 28px/30px Settings gap literals by current 32px token mapping; retained route/copy/behavior.
- Corrected shared notebook ruling from the old 31px tile to 32px for the new 32px writing line; semantic rule color sourced from JSON.
- Fixed **35px rendered horizontal overflow at 820px** by constraining tablet editorial grid to `minmax(0,1fr)`, allowing horizontal filter-chip scrolling in its own container instead of hiding overflow at page level.

## 5. Verified checks

- `tools/generate_design_tokens.py --check` PASS: exact JSON/generated CSS parity.
- `tools/validate_design_system.py` and `tools/validate_ui_foundations.py` PASS.
- `tools/audit_design_tokens.py --check-baseline` PASS using the tightened v0.3 ceiling; no new off-grid numeric spacing declarations.
- `tools/validate_site.py` PASS: original interaction semantics and asset hashes, mirror touch and arrow behavior, 13 methods, routing/back stack, Lão Lý scenarios, source attribution, copy/export privacy and L03/L09/L15 answer/hint/review/persistence/parity native tests.
- Headless Chrome (preinstalled Google Chrome 157 in free GitHub Actions runner): rendered CSS, body 16/24, correct source URLs and typography/spacing tokens, native Guide card typography/visibility, responsive page overflow **PASS at 320 / 375 / 390 / 402 / 600 / 820 / 1440 CSS px**. [Rendered smoke workflow](../../.github/workflows/li-render-qa.yml) reads the **actual computed DOM result**, not an inert JavaScript substring.

## 6. Residual risks and decision gates

- **Not all historical Home/illustration selector duplicates were deleted.** The extracted `li-layout.css` deliberately preserves mobile breakpoint art coordinates, mirror position, Lão Lý illustration handling and earlier state overrides. Full physical-device/screenshot comparison must precede deleting those CSS branches. Avoid blanket deduplication and `!important` removal without visual evidence.
- **Headless rendered checks cover selected key states, not every modal/dialog, screen height, text scaling, contrast or full screenshot-diff.** Real iPhone Safari/PWA, VoiceOver, zoom and software keyboard interaction remain **UNVERIFIED**; the app's existing pinch-zoom lock remains a separate accessibility risk.
- New semantic and scene tokens preserve currently implemented color values; this is **not PO approval of the entire brand visual system**. Overall G2 and academic/real-user gates remain independent and open.
- To continue refactor: prioritize selected Home/mentor scene overrides based on reference screenshots, then modal and multi-locale text states. Protect Wave1 CONTENT LOCK, G3/G4 and current saved data.

**Incremental financial cost: zero.**

Related: [Baseline source audit (UX-DS-03)](2026-11-18-full-app-token-mapping.md) · [Component contract](../components.md) · [GitHub follow-up Issue #4](https://github.com/sali5610/li/issues/4).
