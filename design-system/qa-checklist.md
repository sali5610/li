# Design QA and change-control checklist

**Rule:** Every request to fix a component triggers a top-down impact review, not a local patch at the reported screenshot. Use this before merging UI/UX work.

## 1. Impact chain
- [ ] Read Latest Handoff and newest PO direction; identify superseded or still-pending specs.
- [ ] Product goal/JTBD and research assumptions still make sense; no invented data or human usability evidence.
- [ ] Check IA, navigation, labels, routes, copy and wireframe sequence upstream of the visual symptom.
- [ ] Audit every instance/variant of affected component; search CSS/HTML/lesson modules for same controls.
- [ ] Confirm body 16/24, essential support ≥14/20, optional metadata ≥12/16; check long VI/EN copy and prevent method-card two-line forced cropping.
- [ ] Check every new margin/padding/gap value is a multiple of 4 and uses canonical spacing tokens; do not indiscriminately round artwork position/crop.
- [ ] Check rules in `design-system/tokens.json` and `design-system/components.md`; update them if an approved decision changed.
- [ ] Decide whether change is **visual** or changes interaction/state. Interaction changes may require a working-wireframe fork and re-validation; do not modify frozen WF-BASE.
- [ ] Identify relevant approval gates; do not conflate G2, human usability, accessibility, academic G4 or privacy G3.

## 2. Screen × state regression matrix
Review affected components on: Home + Gương Vạn Vấn, Môn học/catalog hierarchy, Sổ Tay Thần Chú + detail, Tủ Riêng/Bút Ký, Đào sâu/Phản chứng, Search, Nhặt ý, Settings, published Wave1 lesson, unapproved lesson draft (if affected).

| Category | Must inspect |
| --- | --- |
| Component state | Default, hover, pressed, selected, focus-visible, disabled, loading (if supported), success/error/empty |
| Guide 2-up PO acceptance | Thần Chú tile grid: exactly two columns at 320/375/390/402/600/640px; compact full titles + English original + two-line teaser, click opens full detail, shadow gutters preserved; token changes must not switch to one column. |
| Layout | Alignment baseline, text wrapping, overflow, clipping, z-index, icon/text spacing, button height/width parity |
| Viewport widths | 320, 375, 390, 402, 600, 820, 1440 CSS px; narrow portrait and useful landscape heights |
| Long content | Vietnamese diacritics, English text expansion, long title/question, zoom/text size, no truncation without affordance |
| Navigation | Top/bottom selection synchronized; icon remains legible; fixed/sticky bars don't hide content |
| Home | Question inside mirror; context below question; Lưu left / Đào sâu right; Lão Lý does not overlap |
| Touch | 44×44 intended target, no rectangular iOS tap flash, no sticky touch-hover rectangle, scrolling still works |
| Accessibility | Keyboard order, visible focus, label/role, error announcement, reduced motion; **pinch-zoom lock caveat** |
| Assets | Correct source, crop-safe center, approved status, alt/caption, no pending design published |
| Evidence & trust | Draft/published/source labels accurate; genuine save state; no fabricated research results |

## 3. Evidence of done
- [ ] Run `python3 tools/audit_design_tokens.py --check-baseline` across **all first-party HTML/CSS/JS**; new raw token/off-grid debt must not grow, and a pass does **not** imply the legacy baseline is zero. See [UX-DS-03 audit](audits/2026-11-18-full-app-token-mapping.md).
- [ ] Run `python3 tools/validate_ui_foundations.py` (new type/spacing CSS)
- [ ] Run `python3 tools/validate_design_system.py`
- [ ] Run `python3 tools/validate_site.py`
- [ ] Run affected interaction/regression tests (e.g. navigation and mirror gesture tests)
- [ ] Attach actual before/after screenshots for changed screens and states; compare with previous accepted design, not just aesthetic judgment.
- [ ] Record actual browser coverage separately from source-level checks. Real iPhone Safari/PWA, Android/desktop, VoiceOver and pinch/zoom need physical or instrumented testing.
- [ ] Record result: pass/fail/unverified for each touched screen; no generic “QA passed” when physical QA didn't happen.
- [ ] Add a regression test or fixture for every recurrence-prone bug; avoid a duplicate override patch.
- [ ] Sync the actual GitHub commit/PR, test outcome, residual risk and PO gate to Notion handoff.

## 4. Definition of Done
**Design docs complete ≠ components extracted ≠ CI green ≠ visual QA pass ≠ Human PO G2 approved.** Mark only the level that has supporting evidence. No additional paid service is permitted without explicit approval.
