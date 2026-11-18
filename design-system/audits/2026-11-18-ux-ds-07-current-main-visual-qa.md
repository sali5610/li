# UX-DS-07 · Current-main visual regression / Check-in reconciliation — 2026-11-18

**Status:** staged QA source and screenshots complete on [draft PR #14](https://github.com/sali5610/li/pull/14); **no merge, no deployment, G2 open**.

## 1. Canonical implementation change: historical defect is superseded

- Historical [UX-DS-06 report](https://github.com/sali5610/li/blob/qa/visual-regression-matrix-20261118/design-system/audits/2026-11-18-ux-ds-06-visual-triage.md) captured Check-in dialog title at **48px font / 24px inherited leading** on the **pre-PR12** app, overlapping two lines at 320–402 CSS px.
- Since that screenshot, [Settings PR #13](https://github.com/sali5610/li/pull/13) and [adaptive Check-in PR #12](https://github.com/sali5610/li/pull/12) have both been merged. Main after PR12 was `a2cf4ffa5ac3e5183c0211d8483b06ba74cb7feb`; reviewed main `9561fe17975dbefadb0f00d0b42600f0864537db` added UX-IA-07 Settings polish; **subsequent main `f3c348c33aa34cfcec50ef0b476de0fcce2b1f87` changes Check-in's contract to three mandatory physical-state selectors**. The QA matrix was updated for this new behavioral contract before the final current-main rerun.
- The current authored `site/assets/checkin-adaptation.css` now explicitly uses **24px/32px** responsive title leading: `#checkin-modal .dialog h2 { font-size:var(--li-type-title-md); line-height:var(--li-leading-title-md) }`. This **fixes the specific source-level defect**, and the current Chrome render confirms it. Do not create another duplicate 48/56 patch for the redesigned component.
- Human PO's corrected release scope: Wave2/3 unpublished editorial content remains no-deploy; this is **not a global prohibition on unrelated UI work**. This QA branch remains draft-only independently.

## 2. New QA architecture / verified execution

A clean branch `qa/visual-current-main-20261118` was rebased onto `9561fe17975dbefadb0f00d0b42600f0864537db` so the current Settings mobile polish is included, rather than modifying or merging outdated draft PR #10. Ported the prior zero-dependency Chrome CDP screenshot/computed geometry runner and workflow, synced `design-system/components.md` with **intentional Lão Lý FAB overlap**, and updated `design-system/qa-checklist.md`. No `site/` or lesson modifications.

[Latest full visual run #44224036535](https://github.com/sali5610/li/actions/runs/44224036535) at commit `cc7b6573e4e785a9122f03909e1d52d8acd843eb` returned:
- **127/127 previous-snapshot checks run**
- **68 screenshot PNGs generated**
- **0 failures, 0 warnings, 0 runner errors**
- Other branch workflows: design-system contract, companion, rendered CSS Chrome smoke all **SUCCESS** at this same head.

Coverage includes 15 normal routes across **320/375/390/402/600/820/1440 CSS px**, Home/Guide Lão Lý speech bubble states, normal adaptive Check-in modal (320/375/390/402/600/820), synthetic long English Check-in title, short **568px viewport** at 390 and 820, actual radio input selection and resulting enabled Apply action. A synthetic long English title is a **layout stress fixture, not a shipped EN translation**.

## 3. Actual state readback, not just CI status

- Current Check-in title in Chrome: **24px font / 32px computed line-height**. Under synthetic longer English content it wraps to two readable lines at 320/375/390/402/600/820, without detected collision.
- At 390×568: modal `clientHeight=496px`, `scrollHeight=795px`, CSS `overflow-y:auto`; scroll-end readback `scrollTop=299px` equals `scrollHeight-clientHeight=299px`. Bottom action rect remains within modal; screenshot `screenshots/390-checkinShortEnd.png` visually reviewed.
- At 820×568: `scrollTop=212px` equals maximum 212px; action stays inside dialog bounds.
- The pre-physical-priority main at `9561fe1` rendered <b>Quá tải</b> for low energy + hard attention. **Do not apply this as an incomplete-input expectation to the newer physical-first implementation.** New visual QA requires three answered physical selectors before enabling Apply, and explicitly probes an incomplete two-of-three state.
- Actual gallery screenshots visually inspected for the new Check-in default, long title, short viewport and scrolled-end states. This is **not** an exhaustive human review of all 68 PNGs.

## 4. Still open

- Human PO **G2 full visual identity acceptance**, long VI/EN *real* localized content across every route, source/copy and all physical accessibility gates.
- Actual **iPhone Safari/PWA**, VoiceOver, pinch/text zoom, software keyboard, keyboard-only interaction, comprehensive focus order, and usability sessions are not certified by headless Chrome screenshots.
- Old [draft PR #10](https://github.com/sali5610/li/pull/10) is superseded for current-main QA and must not be treated as release-ready. Keep [Issue #4](https://github.com/sali5610/li/issues/4) open for remaining device and component work.

**No site edit, no curriculum publication, no GitHub main merge, no Pages deployment, 0 VND added paid cost in this workstream.**

## 5. Physical-first main reconciliation (pending updated CI result)

After `f3c348c33aa34cfcec50ef0b476de0fcce2b1f87`, Check-in's canonical first stage is three explicit required selects (sleep / movement / rest, each yes / no / unsure); energy/attention are optional within a disclosed details section. Tests now assert incomplete physical-state Apply disabled and a complete-state suggestion/Apply enabled. Prior 127/127 run predates this main change and must not be called its QA. Await current branch CI evidence before accepting the newly rebased matrix.
