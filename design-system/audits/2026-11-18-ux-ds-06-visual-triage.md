# UX-DS-06 · Manual visual triage and modal typography regression · 18 Nov 2026

**Status:** Confirmed visual blocker; QA rule staged, **site fix NOT implemented**. [Original Chrome visual run](https://github.com/sali5610/li/actions/runs/44218689224) · [Draft PR #10](https://github.com/sali5610/li/pull/10) · [Issue #4](https://github.com/sali5610/li/issues/4).

## Evidence actually inspected
The original artifact contains **111 route/state computations, 53 PNG screenshots, 0 automated failures/warnings/errors**. Reviewed all 390px captured screens plus 320px Guide, 820px Check-in and 1440px Home. This is partial human screenshot triage, **not** a full visual, device, accessibility, or G2 signoff.

## Confirmed visual defect — P0
On **390×844 headless Chrome**, the Check-in dialog title **“Nhịp hôm nay ra sao?”** wraps to two lines with visible overlapping glyphs; at **820×1024** it remains on one line without collision. Browser readback of the revised QA artifact confirms **font-size 48px / computed line-height 24px** at 320, 375, 390 and 402 CSS px: `.dialog h2` sets display font-size but no explicit line-height, so it inherits the body's 24px computed leading. The canonical display token requires **48px / 56px**. The original QA only inspected clipped text under `.page`, not modal headings, so green automation incorrectly missed this visual problem.

- Evidence artifact filenames: `screenshots/390-checkin.png` (defect) and `screenshots/820-checkin.png` (one-line control).
- Candidate targeted implementation **not applied**: `#checkin-modal #checkin-title { line-height: var(--li-leading-display); }`. If site-edit authorization changes, first inspect all dialog headings/variants, then compare at narrow widths and rerun source + DOM + screenshot QA.
- Staged regression now assesses wrapped Check-in heading leading and exercises 320/375/390/402/600/820 CSS px. A failing gate is an accurate defect signal, not a failed attempt to claim completion.

## Source-of-truth reconciliation
Latest PO direction **UX-DS-05** approves Lão Lý as an intentional floating action button; intersecting Home actions, bottom nav or other content is not automatically a defect. The older `design-system/components.md` incorrectly disallowed overlap and demanded hiding FAB on dialogs. It has been corrected on this staging branch; screenshot-based visual assertions follow the approved exception. No illustration geometry or interaction change has been made.

## Boundaries and gates
- Changed only `design-system/` documentation and `tools/visual_regression_matrix.mjs` on **review branch**.
- **No site/ edits, no merge, no deploy**; Wave1 content lock and Wave2/3 editorial-only remain untouched.
- Physical iPhone Safari/PWA, VoiceOver, pinch zoom, extensive scrolling/text expansion, screenshot pixel comparison, and **Human PO G2 visual decision** are still open.
- Incremental paid cost: **0 VND**.

**Acceptance:** UX-DS-06 remains **BLOCKED until actual site heading correction is authorized and observed across viewports**. No “visual QA complete” label is justified by the old 0-failure report.