# Lão Lý — original illustration archive (one active illustration family)

## UX-ART-03 · One illustration family (Human PO decision · 2026-11-19)

**ACTIVE design direction for all future Lão Lý character illustrations: ONE `Ngoài gương` (standalone) variant, independent of whether a screen contains the illustrated Gương Vạn Vấn.** Ten expressive poses can share a silhouette and be reused by context; **never generate or maintain a second, cropped `Trong gương` variant.** Reuse/rescale the same approved illustration in an appropriate layout rather than fork the art to fit a mirror.

**RETIRED:** All ten `trong-guong/` files and their Notion rows are retained **only as historical source/rollback provenance**, marked `Retired — no longer used` in Notion. They are NOT valid options in Component Library or future art production. This is a *variant decision* and does not itself approve any unreviewed expressive PNG.

**Distinct functional category — preserved:** 1 approved neutral micro chat avatar + 4 approved study-mode icons in `icon/`. These remain functional control icons, **not** a second illustration variant; do not merge or replace them with 1024px scene artwork in small touch targets.

**Status of new visual language:** The Human PO-selected geometric-papercraft style (wooden geometric face, golden glasses, olive leaves, moss robe, cut-paper texture) and the ten-pose `Ngoài gương` set created as a review ZIP are recorded in [Notion Lão Lý](https://app.notion.com/p/41b6cf6db72a81e685bdfd00bb063b82). Those newest review-only binaries are NOT verified in this repo or uploaded to Notion. The `ngoai-guong/` archive here contains older unapproved source artwork, **not** automatically the new approved visual set. Do not publish it in the app without visual acceptance.

**Known historical runtime references requiring migration once standalone art is approved:** `site/index.html` Settings Lão Lý card `laoly-mirror-suy-nghi.png`; three examples in `site/component-library-review.html`; source checks in `tools/validate_site.py`; `site/assets/laoly-mirror-suy-nghi.png` historical binary. Guide `laoly-guide-rest.png` remains a separate *legacy deployed illustration* and must eventually be reconciled to the same accepted illustration family. New rules must not silently delete these live images before an approved replacement exists or falsely claim the application is already visually unified. G2 and physical iPhone/Safari/VoiceOver remain pending.

**Definition of done for actual migration:** Human PO approves specific standalone PNG(s) → place verified bytes in app assets → change all runtime/component-review references without losing contextual proportions or text clearance → update source validators, screenshots, cache versions, component contract and Notion handoff → run PR CI + device verification. Preserve origin/mirror composition and background art; no newly created mirror-specific character variant.

---

Archive of all **25 actual Notion Artwork files**, copied byte-for-byte into GitHub.

- `ngoai-guong/`: 10 historical standalone expression sources, **only future illustration variant** (individual asset approval still required).
- `trong-guong/`: 10 **RETIRED** mirror-crop expressions, retained for traceability, never for new UI.
- `icon/`: 1 neutral chat icon + 4 study-rhythm icons.

These binaries are intentionally **outside `site/`**, and do not automatically appear in the app.
The `manifest.json` records Notion source page, originally assigned and uploaded filenames,
PNG dimensions, original bytes, SHA-256 and the unchanged Notion review state.
**Stored does not mean the artwork is PO-approved.** UI inclusion is a separate decision.
No expiring signed Notion URLs or credentials are stored here.

Source: [Biểu cảm Lão Lý · Asset Library](https://app.notion.com/p/41b6cf6db72a814bb57bf8a877519798).

## Source-data quality notes

- **Resolved 2026-11-18: 25 Notion records, 25 unique binary PNGs.** The mistakenly duplicated `ngoai-guong/lao_ly_10_suy_nghi_outside.png` was replaced using the exact original `lao_ly_10_suy_nghi_outside.png` from the PO-provided `lao_ly_21_transparent_assets_v1(1).zip` (1024×1024 RGBA, 929,413 bytes, SHA-256 `4b2ddeaeffd9c7152792a575f1c16ebafdcb977c72676df33088afec663af88b`), and the Notion Artwork attachment was corrected. This fixes source identity, **not** the existing Needs PO review visual status.
- The neutral chat icon Notion record is named `lao_ly_chat_icon_master_1024.png`, but its actual stored PNG is **128×128**. We keep its original bytes without upscaling or claiming a 1024-pixel master.
- Four mode-icon Artwork sources are **1254×1254**, although their record filenames end in `_1024.png`. Dimensions and uploaded filenames are documented in `manifest.json`.

All 25 file records remain linked to their Notion pages and review states.
