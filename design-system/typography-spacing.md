# li. Typography & Spacing v0.3 — readable runtime roles

**Status:** Canonical JSON-authored scale is wired to the app via the generated `design-tokens.css`; **Human PO whole-app G2 signoff is still open**. This is a typography/layout change, not permission to modify illustration assets, academic content, navigation semantics, or frozen wireframe.

## 1. Why this changes

Source audit of the current `site/index.html` before v0.2 found many 9–13px labels, 10.5px method descriptions, a 10px mobile nav, and arbitrary 7/9/13/17/22/28/30px local gaps. A packed two-column guide forced instructional copy to shrink and sometimes truncate at two lines. The new scale changes content density by giving text usable width; it **does not** preserve the former two-up phone grid at the cost of legibility.

### External references vs li. decisions

- [Google / Android Developers — Material 3 typography](https://developer.android.com/develop/ui/compose/designsystems/material3): type is organized by display, headline, title, body and label roles. Body Large 16/24 and title Medium 16/24 illustrate the hierarchy; these are **reference values**, not a requirement to use Material's typography or Roboto.
- [Google Material — Baseline grid](https://m1.material.io/layout/metrics-keylines.html): 8dp component grid and 4dp typography/icon baseline; 16dp typical mobile side gutter. For this CSS web app we **adapt** this to 4 CSS px tokens and 8px primary rhythm, not claim literal Android dp equivalence.
- [Material — touch targets](https://m1.material.io/usability/accessibility.html): 48×48dp targets and usually at least 8dp between adjacent controls. New target contract is 48×48 CSS px where practical; previously approved 44px remains a historical minimum, not the desired new target.

**li. design choices:** preserve Crimson Text editorial headlines, system sans for reading/UI, folio/paper/moss palette, square ordinary controls, approved sand selected nav pill and Lão Lý speech bubble. No visual adoption of generic Material components.

## 2. Type hierarchy (font size / line height, CSS px)

| Role | Size / line | Use | Rules |
| --- | --- | --- | --- |
| Display | 48 / 56 | Large scene / editorial heading | Crimson Text, sparingly |
| Headline | 36 / 44 | Screen heading | Crimson Text |
| Title L | 28 / 36 | Featured card / reading section | Crimson Text |
| Title M | 24 / 32 | Method card and section title | Crimson Text |
| Title S | 20 / 28 | Compact card title | Crimson Text |
| Body L | 18 / 28 | Optional leading or longer reading | System sans; paragraph text |
| **Body** | **16 / 24** | Main copy, explanation, input, primary action | Default and **must not be shrunk for layout** |
| Support | 14 / 20 | Descriptions, secondary actions, source links, nav labels | Essential UI minimum |
| Caption | 12 / 16 | Only optional metadata, uppercase kicker, decorative category | Never use for essential instruction/action |

Type sizes need not be divisible by four; **line heights and spacing do**. Avoid forced single-line clipping for long Vietnamese, English, lesson sources or generated method names. Allow multiline labels and growing cards. Set readable language-aware line height; screen-reader behavior and text zoom still need device testing.

## 3. Spacing tokens — every value % 4 = 0

| Token | px | Example |
| --- | ---: | --- |
| 0 | 0 | Reset |
| 1 | 4 | Tight inline elements |
| 2 | 8 | Icon–label / close related items |
| 3 | 12 | Label → control, control vertical padding |
| 4 | 16 | Mobile page side gutter, control horizontal padding |
| 5 | 20 | Mobile card inset |
| 6 | 24 | Tablet gutters, desktop card inset, stack & mobile section gap |
| 8 | 32 | Regular section gap |
| 10 | 40 | Wide desktop page gutter and wide section gap |
| 12 | 48 | Major section separation |
| 16 | 64 | Page bottom safe spacing |
| 20 | 80 | Rare large composition rhythm |
| 24 | 96 | Rare large composition rhythm |

**Token naming:** `--li-space-4` = **16px**, not 4px; the suffix indexes the base 4px grid. Use named semantic aliases (`--li-page-gutter`, `--li-card-pad`, `--li-stack-gap`, `--li-section-gap`) instead of magic literals.

**Responsive:** gutters 16px mobile ≤600, 24px tablet, 40px wide desktop ≥1200. Card inset 20px mobile / 24px desktop. Controls at least 48px tall. Guide cards use adaptive `minmax(220px)` and become single-column on narrow phones rather than shrinking body to 10.5px.

## 4. Applied coverage in `site/assets/ui-foundations.css`

- Global body, section shells, editorial grids, cards, stacked content, inputs, control labels, page headers, typography roles.
- Homepage CTA pair, contextual text and mirror type with deliberate artwork/crop constraint.
- Global header utility target, mobile bottom-nav label/target, sand pill visuals preserved.
- Thần Chú search/filter, mentor card, method-card purpose text and responsive width; no intentional two-line forced hiding.
- Settings cards, guide detail, study mode controls, Lão Lý bubble and actions.
- Shared Wave 1 L03/L09/L15 lesson families: explanatory labels, sources, figures, stats and section gaps.

`site/assets/design-tokens.css` is **generated, never manually authored**. The order is tokens → extracted `li-layout.css` → native lesson CSS → `ui-foundations.css`. Edit `design-system/tokens.json`, regenerate, and implement/reuse component-role rules in the last stylesheet. `index.html` contains no inline `<style>` blocks; do not reintroduce them.

## 5. Explicit exceptions / open QA

- Artistic illustration crop, mirror position, decorative shadows and glyph optical offsets are **geometry**, not spacing tokens. Don't round these by an indiscriminate script: it can break the image alignment and source-approved composition.
- The source-level audit of the current app's first-party CSS reports **zero literal off-grid `px` margin/padding/gap values** after migrating former inline layouts and Wave1 lesson styles to tokens. A few valid `auto`, `0` and artistic/color/line-height exceptions remain; this is NOT a computed-style, screenshot, or physical-device conformity guarantee. See [v0.3 remediation evidence](audits/2026-11-18-css-refactor-v03.md).
- The hero mirror has a fixed illustrated opening: text long-tail, mobile heights, and Lão Lý/bottom action collision need screenshot validation.
- Real headless Chrome CI verifies the loaded CSS type roles, relevant responsive Guide components, approved Home artwork reference and horizontal overflow at seven viewport widths; it still cannot certify contrast, all element states, text zoom, iPhone PWA or VoiceOver. Existing request to lock pinch zoom is a distinct accessibility risk; not resolved by these type changes.
- G2 visual identity acceptance, actual-device QA, academic G4, privacy G3 and human-study gates remain separate.

**Visual specimen (noninteractive):** [Preview typography & spacing](../site/design-system-preview.html) after publishing. It exists for Human PO review; preview rendering does not count as actual device QA.

## 6. Acceptance checklist

- [ ] At 320/375/390/402/600/820/1440 widths, all essential copy ≥14px; reading default 16px and 24px leading.
- [ ] No cropped Vietnamese accents, forced two-line truncation of method descriptions, horizontal overflow or covered fixed-nav actions.
- [ ] Home mirror question remains within illustrated opening; context and CTA remain fully visible and in order.
- [ ] Guide search remains usable; all 13 methods and their originals can be read, including long VI/EN terminology.
- [ ] Lesson L03/L09/L15 pages show full prompts, source links, answer labels and complete feedback.
- [ ] Keyboard focus and selected nav semantics remain intact, icon pill not replaced.
- [x] Run generated token drift + design system validation, source debt ratchet and native lesson/route tests.
- [x] Run rendered computed-style Chrome smoke at 320/375/390/402/600/820/1440 CSS px; checked typography, palette, imagery, Guide and horizontal overflow.
- [ ] Capture cross-screen screenshot diffs, long-content/bottom-safe-area details, physical iPhone Safari/PWA and VoiceOver evidence.
- [ ] Record **actual screenshots** and hardware/browser testing as separate evidence, not inferred from CI.
