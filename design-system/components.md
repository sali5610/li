# UI component contract — current code ↔ intended behavior

**Inventory date: 2026-11-18.** CSS selectors below are observed in the current static app or documented in the active handoff; **not** imported shared components. “Implemented” never equals “G2-approved”. After changes, search **all** selectors and matching element instances, including later overrides.

| Component | Current location/selectors | Reusable contract | States / risk |
| --- | --- | --- | --- |
| **Top header / global utility icons** | `.header`, `.tool-button` | Global identity + Search / Nhặt ý / Settings; active item uses sand `#E5D8BA` inner oval, moss ink, `aria-current="page"`. Sticky header; keep header visible above scrolling content. | Normal, selected, coarse-touch hover, focus-visible, icon-only accessible names. **S142/S143 PO-specified**. |
| **Bottom navigation** | `.mobile-nav`, `.nav-btn` | Same selected visual grammar and semantics as top icons; fixed mobile nav must not overlap text/actions; retain 44px minimum button target. | Active, inactive, hover, focus, iOS tap. Must check route synchrony. |
| **Primary/secondary CTA** | `.primary`, `.secondary`, `.hero-actions` | Primary and secondary actions align by shared height/baseline/padding; square control surfaces and opaque hard-offset shadows outside documented exceptions. Home action **Lưu → Đào sâu** left-to-right, not vertically misaligned. | Default, pressed, hover, disabled, focus, narrow long-label overflow. |
| **Home mirror / question** | `#page-home .hero`, `.mirror-message`, `.mirror-controls`, `.mirror-refresh` | Background full bleed only on Home. Question must remain inside real illustrated mirror; context BELOW question and BEFORE actions; previous/next arrows stationary, question may float gently with reduced-motion alternative. | All question lengths, wrap, 320/375/390/402 widths; content/gesture sync; clipping and z-index. |
| **Lão Lý persistent companion** | Buddy floating button, `#buddy-modal`, `.buddy-shell`, `.buddy-scroll` | Avatar persists near lower-right without occluding content. Open dialog uses an intentional speech bubble, not generic square modal; scroll body only; title/actions remain reachable; floating avatar hidden while dialog open. | Home vs other screens, keyboard/dialog flow, open/close, 82svh constraint, iPhone bottom safe area. |
| **Editorial panels / cards** | `.panel`, `.panel.inset`, `.destination`, `.spell` | Bounded reading container, paper layers, hard shadow. Use one spacing/type hierarchy for homologous cards; no arbitrary one-off radii or washed-out text. | Long VI/EN title/body, pressed/focus, imagery crop, empty/source label. |
| **Inputs / Save feedback** | `.notebook`, `.flat-button`, source/status controls | Clear label, focus, accessible validation. Never say “đã lưu” until actual readback confirms persistence. | Storage denied, unsaved, error, success, locale switch. |
| **Lessons / academic evidence** | `site/lessons/`, `site/assets/lesson-*.css|js` | Same UI tokens/typography, truthful lesson publication/approval and source disclosure. Each lesson may have contextual content but must not silently fork global controls. | Draft/reviewed/published, answer-not-yet-revealed/revealed, screen reader/VI-EN. |
| **Illustration cards/windows/portals/books** | [Notion asset library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f) | Landscape usable as landscape and center portrait crop, muted 2D ink-outlined/storybook grammar; **different disciplines need different settings**, not duplicate tree library. No built-in gate/window frame baked into reusable background. | **Not all assets approved**. Review each artwork; never upload pending drafts into public repo. |

## Visual design rules (decisions vs QA)
- **PO-specific visual exceptions:** even though S81 baseline generally asks square controls, the latest header/bottom **active icon background is intentionally an oval sand pill**, and the separate **Lão Lý chat is a rounded speech bubble**. Do **not** run blanket `border-radius:0` resets on these.
- **Touch exception risk:** source currently contains PO-requested pinch-zoom locking; this remains an **accessibility concern**, not WCAG acceptance. Accessibility review must record that risk rather than pretending all gestures/zoom are supported.
- **iPhone Safari square tap flash regression:** native tap highlight and touch-hover overlays have reappeared in the past. Test visually on device; source presence of `-webkit-tap-highlight-color` is only a smoke check.
- **Latest state wins:** if Notion or new PO feedback differs from the above, update this contract **and** every affected implementation/screenshot fixture together. Never quietly make the docs say something old.

### Icon role separation (latest code evidence)
- **Browser tab favicon (newest S146 main):** exact same SVG URL as the header seal, `site/assets/li-seal.svg?v=exact-header-s146`; older `li-favicon.svg` remains a historical asset but is no longer the live browser icon. This is unrelated to typography.
- **iOS Add to Home Screen:** `site/assets/apple-touch-icon.png` is a **separate asset**. The latest `main` validator is labeled S145 and describes a **typography-only 理** icon on moss, superseding the earlier S142 seal-based iOS touch icon. Do not infer that all icon contexts must use one identical PNG/SVG. Reconfirm the newest PO approval in Notion before changing either asset.
- The root brand seal displayed in the app is a third placement; updating the favicon must not silently replace the header logo.

## Adoption pattern for a new screen
1. Choose an existing component + variant from this table.
2. Reuse its spacing/geometry/color/semantic state (not a copy-pasted one-off CSS block).
3. Define exceptional behavior with a design decision link and note in this table.
4. Check every other instance of that component before merging.
5. Record status as **observed**, **PO-accepted specific**, **pending**, or **rejected/deprecated**.

### Technical debt explicitly tracked
The current high-fi is still a large inline-styled static document with later CSS overrides; the design library is a **reference + automated baseline**, not a true single-source runtime component package. A follow-up extraction should consolidate selectors and shared styles without altering frozen WF-BASE or claiming G2 approval.

## v0.2 typography and spacing — shared implementation rule
- **Runtime CSS:** `site/assets/ui-foundations.css` is the canonical migration layer (loaded last in the app), not a new framework.
- **Default:** 16px/24px reading text, 14px/20px essential supporting text, 12px/16px only metadata; Crimson Text editorial headings 24/32 and up. All line heights are multiples of 4px.
- **Grid:** space tokens 0/4/8/12/16/20/24/32/40/48/64/80/96 CSS px. Every new padding, margin and gap must use a token or a value divisible by 4. Touch target goal 48px.
- **Guide:** adaptive method cards replace 9–10.5px copy and forced two-line clipping; one column when necessary, not shrinking type.
- **Scope:** Home, Catalog, Guide, Library, Research, Search, Capture, Settings, Lão Lý and published Wave1 lesson families all share type/spacing roles. Preserve special artwork geometry, selected sand pill and speech bubble.
- **Limit:** older inline CSS still contains off-grid local rules. Central foundation supersedes touched shared surfaces; complete legacy cleanup needs a separate safe visual regression pass. See [type/spacing spec](typography-spacing.md).
