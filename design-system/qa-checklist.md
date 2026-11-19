# Design QA and change-control checklist

**Rule:** Every request to fix a component triggers a top-down impact review, not a local patch at the reported screenshot. Use this before merging UI/UX work.

## UX-DS-35 · Responsive adaptive iPhone/iPad & React readiness (DRAFT, 2026-11-19)

**Source contracts:** [Adaptive responsive rules](responsive-adaptive.md) and [staged remediation roadmap](plans/2026-11-19-atomic-responsive-react-roadmap.md). These checks are **NOT yet marked PASS by creation of this checklist**. Existing DS33 Safari recovery remains until device verification; keep G2 pending.

- [ ] Confirm responsive ownership chain: reference/semantic/component tokens → atom/molecule layout and state → organism/template composition; no new page-specific `!important`/absolute-offset screenshot patch.
- [ ] Test actual **window + container + visible height**, not device name alone; iPad Split View may be compact, iPhone landscape may be wide but short. Cover keyboard/safe-area, pointer/touch, full VI/EN text, 200% text/320px reflow, and current Safari browser chrome.
- [ ] Preserve PO-approved Thần Chú 2-up **320–640px** and meaningful untruncated names; preserve square primary controls, sand oval active nav, 48px intended new touch target, one approved iPad landscape Home artwork with portrait crop, and current iPad density baseline where applicable.
- [ ] iPhone physical Safari: portrait 320/375/390/402/430 widths and short-height landscape, fixed nav, focus, virtual keyboard, check-in/mentor dialog scroll/Close/CTA, no blocked pinching or sticky touch-hover.
- [ ] iPad physical Safari: full portrait and landscape, Split View/resize if supported, hardware keyboard/pointer, browser toolbar, **portrait→landscape→portrait→landscape** repeated with no stale root, no blank paper, no scroll trap, centered bubble and two CTA, preserved Home question and progress.
- [ ] React L09/Auth CSS/TSX included in token scan and typed CSS/TS parity; component variant/state stories include compact/medium/expanded/short-height, and style isolation from Vanilla shell.
- [ ] Record PASS/FAIL/UNVERIFIED separately for Chromium automation vs real iPhone/iPad Safari/PWA/VoiceOver; include source SHA, viewport metrics, screenshots and severity. No Human PO G2 approval inferred.
- [ ] Do not enable invite-only Google auth/cloud sync or public release as part of a responsive/layout PR; observe Step16.1 real identity/RLS/consent and manual deployment gates.

---

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
| Accessibility | Keyboard order, visible focus, label/role, error announcement, reduced motion; **UX-DS-28 removed the former pinch-zoom lock; Safari device zoom/rotation still needs physical retest** |
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

## UX-DS-28 · iPad Safari portrait-width / landscape reflow report (2026-11-19)
- [x] Source: viewport meta uses `width=device-width,initial-scale=1,viewport-fit=cover` without min/max-scale or `user-scalable=no`; global Safari pinch gesture listeners removed; document and mirror CSS allow `pinch-zoom`.
- [ ] Physical-device reproduction: screenshot showed Home artwork ending around 69% of landscape width, close to the 820/1180 portrait/landscape width ratio (inference, not verified browser metrics).
- [ ] Rotate actual iPad Safari portrait → landscape → portrait with tab already open; compare `innerWidth`, `visualViewport`, `screen`, root and Home Hero widths using the opt-in `?debug=ipad` panel; verify Home art fills full viewport, title/question/context/actions visible, no side blank.
- [ ] Test OS Safari page zoom 100%/125%/200%, pinch zoom, keyboard, split-window, reload and Home Screen PWA. Automated Chrome rotation-iframe evidence is not Safari certification.

## UX-DS-29 · Physical Safari 970/1408 diagnostic regression (2026-11-19)

- [x] PO screenshot evidence: full landscape viewport/root/hero 1408×832 but CSS mode desktop/phone, body 16px; old landscape media capped at 1400px. PO portrait-shaped snapshot had viewport+visual 970px, root+hero 1408px, stale height 832px.
- [x] Source fix: shared density, Home art, Guide and Catalog landscape media include 1408 CSS px with upper boundary 1420; 1440px desktop remains desktop. Reuse canonical iPad tokens and image master; refresh live CSS version.
- [ ] Rendered Chrome: assert portrait 970×1408, landscape 1408×832, desktop 1440×900, and live rotation 970→1408→970 without reload. Green CI does not equal physical Safari.
- [ ] Physical Safari: recheck landscape and portrait with `?debug=ipad`; expect `CSS mode: landscape` + body 18px at 1408px. Confirm visual and root widths synchronize after rotation; if 970 visual / 1408 root persists, treat it as an independent WebKit viewport issue, not proof that the 1408px media query failed.
- [ ] Check Home full-width, footer-free, no-scroll, actual background crop/position, 3-zone composition, `Lưu` and `Đào sâu`, companion and nav on both orientations, Split View, 200% text, VoiceOver and PWA. PO G2 remains OPEN.

## UX-DS-30 · Single landscape art / stale physical rotation Safari (2026-11-19)

- [x] PO iPad portrait 04:27: inner/root/Hero 970px and CSS portrait 18px, correct. On physical iPad landscape 04:28: inner/visual 970px but screen long side 1408px, half-page blank. Earlier 1408 media fix cannot run when CSS viewport remains 970px.
- [x] Reuse exact approved `home-li-ipad-20261119.jpg` across iPad portrait/landscape with `cover` and centered crop; **no portrait asset generation or recolor**.
- [ ] Source/CI: when native iPad orientation reports 90° and `innerWidth=970`, narrow runtime recovery selects 1408px landscape canvas, keeps body 18px, uses approved art, positions context/action right, and restores `device-width` with no reload/data reset after returning portrait.
- [ ] Physical Safari: in a fresh tab, verify portrait crop, rotate to landscape *without reload*, inspect `?debug=ipad` showing orientation angle and recovery mode, confirm no blank paper, correctly cropped landscape art, text/CTA remains readable.
- [ ] Independent real-device: assess fullscreen Safari toolbar, split view, PWA, page pinch zoom, navigation/lesson state preservation, keyboard and VoiceOver. G2 stays open.


## UX-DS-31 · Safari iPad 04:49 physical portrait/landscape regression — candidate, physical QA OPEN (2026-11-19)

- [x] Evidence: landscape Screenshot 1408×918 visual with root 1408×1843; screen 970×1408 and portrait orientation CSS, app/hero 1408/970 mixed. Portrait Safari screenshot screen/outer 970×1408, viewport 1408×1843, visual scale 0.69, fixed meta width=1408, body 16px, hero 970px with large paper gutters. These are two independent layout and zoom states; UX-DS-30 did not pass actual iPad acceptance.
- [x] Remove numeric meta writes. Apple recommends width=device-width; preserve native zoom and accessibility. JS prioritizes full-window outerW/outerH when CSS viewport lies, and has conservative opt-in CSS landscape/portrait compensation. Reset fallback after native reflow; never reload or clear persisted data.
- [x] Keep previously approved single home-li-ipad-20261119.jpg landscape master, cover + centered crop, no visual changes. Shared landscape/portrait JSON-derived tablet token aliases and Home one-screen dimensions; split view remains native.
- [ ] CI source validators + responsive smoke green at candidate head, including explicit portrait stale-1408 and landscape stale-970 simulations.
- [ ] Actual iPad Safari 970 portrait → 1408 landscape → 970 portrait, navigation controls/tap targets/home no-scroll; PWA/Split View/VoiceOver still require physical checks. No G2 signoff until Human PO confirms.


## UX-DS-32 / UX-HOME-10 · iPad 05:08 portrait reflow + center CTA group (2026-11-19)

- [x] Physical PO screenshots: landscape 1408×832 has root/hero 1408px and 18px iPad tokens; after rotating to portrait outer window is 970×1408 but visual viewport is 970×832, root/hero stay 1408×832, leaving a large blank paper area. `window.orientation=0`, `screen.orientation.angle=90`, `screen.type=portrait-primary`, scale=1.00. Treat CSS orientation and screen angle alone as unreliable on Safari.
- [x] JS fix: detect mismatched physical portrait via root/app/hero width or stale viewport height; infer browser chrome inset from short side 970 minus old landscape visible height 832 (=138); recover 970×1270 Home canvas; keep class until Safari actually reports corrected visible height.
- [x] UX: both orientations center one contextual bubble above the two primary buttons in a shared aligned width, no longer in right rail. Preserve question in mirror, approved iPad art, single screen, iPhone pattern and existing component tokens.
- [ ] GitHub Actions rendered CSS, design contract, IA, companion and iPad regression green on final PR head.
- [ ] Human PO physical iPad Safari 970 portrait → 1408 landscape → 970 portrait with no white gap, no horizontal scroll, bubble/CTAs centered and touch operable. Split View/PWA/VoiceOver still pending.


## UX-DS-33 · iPad 05:24 repeat-rotation regression (2026-11-19)

- [x] PO evidence: first screenshot landscape Home fills, then Safari reports visual 1408×918 and outer 1408×970 while root is stale 970×1270. The image stops early, shows paper below, and the Home appears scrolled. UX-DS-32 was **not accepted** on the physical device.
- [x] Refactor: retire all DS30–32 Safari recovery styles from \`ui-foundations.css\` and \`library-hub.css\`; keep one \`ipad-home-canvas.css\` scene authority and one physical-geometry script; preserve approved iPad artwork and centered bubble/CTAs.
- [x] Regression added: actual rendered Chrome iframe with physical 05:08 portrait and 05:24 landscape stale DOM roots, plus JS synthetic portrait→landscape→portrait→landscape. Compact header touch targets at 601–743px retain 48px minimum.
- [ ] GitHub PR #118 final CI checks fully green and merged to main.
- [ ] GitHub Pages publish of merged SHA verified.
- [ ] **PO physical iPad Safari** portrait→landscape→portrait→landscape with no paper gap, no scroll, correct bottom CTA placement, both buttons tappable after every rotation, and unchanged current question.
- [ ] PWA, Split View, 200% zoom and VoiceOver still require separate acceptance. No G2 signoff before these.
