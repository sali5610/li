# Lão Lý — original illustration archive

Archive of all **25 actual Notion Artwork files**, copied byte-for-byte into GitHub.

- `trong-guong/`: 10 expressions in the mirror.
- `ngoai-guong/`: 10 expressions outside the mirror.
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
