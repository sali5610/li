## S-G3-16E · Local backup v2 candidate regression checklist (PR #111)

- [ ] On actual Settings UI, export all 11 registered fixed `li.*` keys plus dynamic lesson attempt state; verify checksum, byte cap and downloaded file format with fake data.
- [ ] On a clean origin, import and reload v2: library/case draft, full attempts, diary/enablement, visits, T02 schedule, language, mode, mentor position must be present and rendered after module reinitialization.
- [ ] Legacy schema1 partial-file input: explicit warning, merge only, no lost lesson/due/diary/consent keys; impossible-to-recover missing original data must not be fabricated.
- [ ] Preview displays precise adds/overwrites/removals, cancel yields zero writes, stale preview is rejected. Failure and unknown key handling are actionable and do not claim backup success.
- [ ] Corrupted JSON, bad schema/digest, >10MB, quota/error injection and rollback failure are independently detected; retry button works, loading is not left stuck.
- [ ] Physical iPhone/iPad Safari downloads, Files picker, VoiceOver, keyboard/focus and PWA origin behavior require separate device evidence; CI green is not proof. G2/G3 remain open.
- [ ] Source contract, component variants and bilingual copy are synced. **Do not merge this candidate into live app without release gate review.**

# Design QA and change-control checklist

**Rule:** Every request to fix a component triggers a top-down impact review, not a local patch at the reported screenshot. Use this before merging UI/UX work.

## UX-DS-22 · Cross-pattern behavior gate (2026-11-19)
- [ ] Apply [UX-DS-22 Do/Don't and behavior contract](ux-patterns-and-behavior.md) to every affected component: usage, anti-pattern, anatomy, state, accessible semantics, responsive layout and visual exceptions.
- [ ] Test primary vs secondary hierarchy; semantic link vs action; selected vs focus; disabled vs readonly; default/hover/focus/pressed/selected/busy/error/empty.
- [ ] Test persistence truth: saving/saved/failed with actual readback, data retained on error, no silent reset or invented metric.
- [ ] Test modal open/focus trap/Escape/restored focus/body scroll/short-height footer, and fixed nav/FAB not hiding essential content or focused controls.
- [ ] Check WCAG 2.2 AA measurable contrast/resize/reflow and target size exceptions accurately; li. 48px intended touch target, not a claim Apple pt equals CSS px.
- [ ] Check real device and assistive technology separately; do not claim compliance or G2 based solely on doc changes or headless CI.

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
| Thần Chú S116/S118 | 2 compact method cards per phone row at ≤640px, **gap 18/20px** and ≤360px **14/18px**. Keep full VI title, academic EN name, 2-line purpose teaser, Chú Giải action, filters/modes. Treat these as approved micro-geometry exceptions, NOT token debt to round. |
| Home | Question inside mirror; **no visible Gương Vạn Vấn kicker**, accessible scene name remains; **UX-DS-15 transparent header overlays the same hero art**, cream seal/icons, 48px targets, Home check-in clears header; return to non-Home restores paper header **and vertical scrolling**. Home is locked to exactly 100dvh and has no vertical body scroll; check 320×568/375×667/390×844, iPad landscape and dialog scrolling. Context below question; Lưu left / Đào sâu right; Lão Lý does not overlap |
| Touch | 44×44 intended target, no rectangular iOS tap flash, no sticky touch-hover rectangle, scrolling still works |
| Accessibility | Keyboard order, visible focus, label/role, error announcement, reduced motion; **pinch-zoom lock caveat** |
| Assets | Correct source, crop-safe center, approved status, alt/caption, no pending design published |
| Evidence & trust | Draft/published/source labels accurate; genuine save state; no fabricated research results |

### Component Review UX-DS-09 completeness / PO requested
- [ ] Icons: Lucide-only functional artwork, consistent 18/20/22/24 role sizes and stroke, semantics identical on Home & mobile nav. Tủ Riêng uses archive; bookmark reserved for saved items.
- [ ] Actions: primary, secondary, text-link, disabled, hover, pressed, focus visible; actual click behavior honest.
- [ ] Large cards: light ivory `--cream` and warm ivory `--paper-2`, same anatomy, no accidental compact two-up.
- [ ] Forms: text input default, filled, focus, error, disabled, readonly; textarea content, disabled and unsaved counter; filter chip default/selected/disabled and screenreader states.
- [ ] Home chat bubble: subtle border, no card shadow, long copy and actual hero artwork alignment independent.
- [ ] Navigation: utility, mobile 4-tab, nested Back. Verify same icon names and selected semantics.
- [ ] Headless Chrome board fixture asserts interactive states; **physical Safari, VoiceOver, text zoom and G2 approval still open**.

### UX-DS-10 · Component review completeness (Human PO feedback)
- [ ] Bút Ký textarea specimen mirrors 32px **ruled notebook** in app, including focus/disabled, not plain generic background.
- [ ] Compare light vs forest-green chat bubble. **UX-DS-24:** forest body and tail computed border width 0px in Component Library + live Home; light candidate keeps its hairline stroke. No changes to forest fill, shadow, copy, padding, geometry or G2 gate.
- [ ] Verify **real image card examples**: media top landscape 16:9, responsive split, contained illustration; render actual approved app assets; no unpublished subject art.
- [ ] Prevent rectangle tap flash for nav/icon controls, preserve designed active oval/keyboard focus. Verify CSS cache bust and test on real iPhone Safari.
- [ ] QA captures both `?capture=media` and `?capture=bubbles` as honest independent screenshots.
- [ ] Check downstream effect on Home, nav, Check-in and Tủ Riêng; all 01–14 interaction/IA decisions preserved; G2 and physical device still OPEN.

### UX-DS-11 · Component families and live boundary
- [ ] Progress bar: zero/partial/complete/indeterminate and compact; aria semantics + width track count, reduced motion, no fictional mastery score.
- [ ] Filter chip corners are full pill in **both review and actual Guide**; preserve S116/S118 compact method-card and all other CTAs.
- [ ] Transparent icon button/48px target + selected bookmark; small button normal, disabled, touch 44px.
- [ ] Dropdown keyboard Escape/Arrow/Home/End, click-outside, selected item; language VI/EN switch with semantic role and checked state (review only).
- [ ] Left sidebar and list item respond to active state without changing main app IA; checkbox multi-select, radio one choice, icon field input/clear.
- [ ] Calendar has 4 named mode shades light→dark and separate missing-data state; no inference as health measure or historical user activity.
- [ ] Vertical **stacked** bar is 7 calendar days per view, Bài/Vấn đề/Input segments, constant monthly scale, correct month edge.
- [ ] Browser automation at 320/390/820, screenshot sections controls/dataviz, real iPhone Safari/VoiceOver/G2 PO review OPEN.
- [ ] Review uses deterministic example records only; no localStorage access or diary state mutation.

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


### UX-ART-05 · Five PO-approved Lão Lý mini heads, 2026-11-19
- [x] Crop from user-approved sheet: only head, five distinct states, transparent; no body or props; 96px canonical PNGs + app aliases
- [x] Source QA: PNG header, 96×96 geometry, transparency chunk, and byte-for-byte deployed/canonical equality
- [ ] Physical iPhone Safari at 24 CSS px on parchment and forest backgrounds: recognizability of eyes/expressions, edge halo, AA
- [ ] iPad portrait/landscape, 200% text zoom, VoiceOver and PWA caching; retain readable four mode labels and accessible names
- [ ] Overall G2 illustration identity acceptance remains separate

## UX-DS-25 · iPad portrait / landscape regression matrix (2026-11-19)
- [ ] Visual: 744×1133, 820×1180, 1024×1366 portrait and 1133×744, 1194×834, 1366×1024 landscape. Verify body 18/28, support 16/24, 56px control target, 24px icons, 28/32px card pad.
- [ ] Home landscape keeps the iPad background, mirror text fully within opening, dialogue separate from question, Lưu → Đào sâu aligned, header transparent, 100dvh scroll locked.
- [ ] Research/Catalog/Library/Guide/Settings/L03/L09/L15: no horizontal overflow or clipped VI/EN; note source/status/lesson drilldown, scroll restoration, modal + Lão Lý controls.
- [ ] Rotate live Safari while a nested lesson, filter, or modal is active; preserve content, state, focus, keyboard and accessible names, no reload or data loss.
- [x] Source contract: JSON device scales generate CSS; Component Library viewport presets include both orientations and change iframe width AND height.
- [ ] Real iPad Safari/PWA with portrait/landscape and split view; Headless CI or iframe alone cannot certify it. PO G2 still OPEN.

### UX-ART-06 · Approved Lão Lý loading/error scenes
- [ ] Exact two Human PO-selected scenes stored as **1024×1024 RGBA with transparent pixels** under `design-assets/lao-ly/system-states/`; deployed app binary copies identical by SHA-256.
- [ ] Loading shown only while reading a selected backup, not on an arbitrary fixed timer; success/cancel hides it. Never show error art for search's ordinary no-result state.
- [ ] Invalid JSON, >10 MB, denied localStorage/readback show the error art with a clear message and working retry; original stored data not overwritten on malformed input. Do not claim rollback is guaranteed if browser storage is unavailable.
- [ ] UI specimen matches shared `.li-state-scene` app component, decorative images have empty alt, status/alert semantics, keyboard/touch retry and reduced-motion fallback.
- [ ] Visually inspect paper & moss backgrounds, edge halo and artwork clearance at 320/375/390/402/820px and 200% text zoom; run real iPhone/iPad Safari/PWA/VoiceOver before claiming device-level signoff. G2 remains open.


### UX-ART-07 · Latest approved five-mini-icon replacement, 2026-11-19
- [x] Exact final approved reference used, not an independently redrawn version; all five heads share clean boundaries and matching geometry.
- [x] Original RGB checkerboard removed using color matte; actual PNG `tRNS` transparent corners; 96px 64-color palette, verified local overlays at 24px and 42px on paper + forest.
- [x] Replaced canonical 5 PNGs and five matching deployed aliases; existing four modes, neutral chat avatar, labels, aria and saved-state logic unchanged.
- [x] Invalidated cached URLs for all 12 icon references in `site/index.html`.
- [ ] Review real Safari/PWA at 24px on iPhone/iPad, 200% text zoom, VoiceOver, contrast and halo; do not claim this from static preview/Chromium.
- [ ] Full G2 signoff distinct from this asset-specific Human PO approval.


### UX-ASSET-01 · Visual asset custody & provenance audit (2026-11-19)
- [x] Every separate image file currently committed under `site/assets/` has a canonical byte-identical entry: 17 Lão Lý canonical art files (9 runtime aliases), four Home backgrounds, three brand/logo/icon files; current coverage described in `design-assets/README.md` and JSON registry.
- [x] Image governance and entrypoint linked in Design Library; obsolete UX-ART-03 Ngoài gương rule corrected to current Trong gương-only decision.
- [ ] Extract six base64 WebP illustration variables (`--hero-mobile-url`, `--hero-url`, `--shelf-url`, `--book-url`, `--roots-url`, `--wood-url`) from the historical CSS into independently versioned assets; avoid altering runtime appearance and validate as a separate migration.
- [ ] Recover/check actual binary + approvals for intended 25 concept assets (8 group portals, 6 windows, 8 books, 3 Home entrances). Notion lists the plan/decision; checked-in master files are not verified on GitHub. Do not mark them complete or deploy unapproved art.
- [ ] Recover/archive approved individual discipline artwork: Chinese language color-graded art has image-level PO approval in Notion but **no verified canonical binary**; English v2 remains unapproved. Do not equate chat-generated file names with GitHub assets.
- [ ] For every new image: retain source/crop, transparent alpha if required, dimensions, provenance, approval state, component usages, landscape/portrait responsive checks, SHA/byte-parity and public/review status; check real Safari/PWA where applicable.
- [ ] Do not claim full G2 or original editable layered source custody solely from Git-tracked runtime images.


### UX-NAV-ICON-01 · Thần Chú bottom-tab four-point star (2026-11-19)
- [x] Live mobile bottom tab `data-page=guide` uses Lucide `sparkle`, not `book-open`; the other three destination icon semantics remain stable (4 tabs total).
- [x] Component Library iconography tile, bottom 4-tab navigation specimen and sidebar navigation specimen use the **same** Lucide `sparkle`.
- [x] Static regression checks cover exact icon mapping, bundled Lucide availability, and preserved book-open lesson illustrations; browser fixture checks a rendered `svg.lucide-sparkle`.
- [ ] Verify on physical iPhone/iPad Safari at 22px (default + selected sand oval), 200% text zoom, VoiceOver, tap behavior/PWA; G2 overall still pending.
