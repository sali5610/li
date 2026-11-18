# UX-DS-20 · Authored UI Component Token Coverage — 2026-11-18

**Scope:** Source-level audit of first-party li. static GitHub Pages app components and the Component Library. Human PO requested **no unmapped color, typography or spacing declarations**. The canonical value source is `design-system/tokens.json`; generated CSS is `site/assets/design-tokens.css`. All direct component paint/typography/spacing properties are now tested by `tools/audit_design_tokens.py --check-zero`.

## Observed source evidence

The strict audit enumerates **3,127 authored CSS/HTML design declarations** in the candidate branch and reports **zero non-token component-role declarations** once intrinsic language keywords and genuine image/illustration layout geometry are excluded. Audit includes app stylesheets, page HTML <style> and inline style attrs and first-party lesson-template markup. It guards new properties such as font-weight and letter-spacing, extra color props, raw local color variables and literal paint fallbacks.

The earlier baseline ratchet (`--check-baseline`) merely required no *growth* in technical debt. The new **zero-debt** CI rejects a single newly authored raw design value and preserves the baseline ratchet separately. Generated CSS is deterministic, and `python3 tools/generate_design_tokens.py --check` catches token drift.

| Family | Implementation approach | Decision boundary |
| --- | --- | --- |
| Foundation and semantic color | `colors`, `semanticColors` and `sceneColors` in JSON, emitted as `--paper`, `--olive`, `--li-color-*`, `--li-scene-*` | Main Moss, Porcelain, selected sand and original art palette preserved |
| Alpha paint overlays | `alphaColors` as `--li-effect-alpha-*` | Same original RGBA values, not recolored |
| Typography | Canonical `--li-type-*`, `--li-leading-*`, `--li-font-*` and compatibility `legacyTypographyTokens` for exact historical clamp, ratio, tracking, font shorthand/family and weight | This is value **mapping**, not a claim every legacy 12px or fluid component was redesign-reviewed; future hierarchy convergence needs PO visual comparison |
| Spacing | Grid `--li-space-*` and exact `approvedMicroSpacing` for preapproved responsive Guide and Home context gaps | Intentionally preserved 14px/18px exceptions; no arbitrary rounding |
| Ruled notebook | `--li-leading-notebook:32px`; authored `--li-notebook-line-height` is an alias | 32px rule and 39px first visible line unchanged; Porcelain editable background retained |
| Olive decoration | `3px solid var(--olive)` on `.page:not(#page-home) .section-shell > .kicker` with 8px inset | Label ornament only; no CTA/nav/focus/status recolor |

## Explicit non-component exclusions

- CSS intrinsic keywords such as `none`, `transparent`, `inherit`, `currentColor`, `auto`, `0`: these are control-flow/grammar, not visual material values requiring duplicated palette variables.
- Real `url(...webp)` scene images and independent illustration/hero crop coordinates (e.g., `margin-left:-50vw`) are preserved as visual geometry. The source artwork is not regenerated.
- Generated token definitions contain the raw hex/color/font/spacing values **by design**; they are the one legal source. Vendor Lucide and binary SVG/WebP art are excluded.
- Dynamic JavaScript sizes for progress/clipboard/scroll interactions remain runtime state calculations, not fixed design-system spacing tokens. First-party JS templates were scanned for raw design paint; strict checker also reads HTML/JS template style attrs.
- Source static audit cannot prove all **computed** cascade values, WCAG contrast, semantic accessibility, browser screenshot parity, iOS PWA/VoiceOver, or Human PO G2 signoff.

## QA gates

Run `python3 tools/generate_design_tokens.py --check`, `python3 tools/audit_design_tokens.py --check-zero`, `python3 tools/audit_design_tokens.py --check-baseline`, and all repository CI (Design System, companion/site, Tàng Thư IA, headless Chrome seven viewport widths). Chrome fixture checks actual Olive decorative border and notebook line token. Inspect live app and Component Library after GitHub Pages actually publishes the commit and complete Human PO G2/device QA separately. **Cost increase: 0 VND.**
