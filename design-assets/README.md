# Visual image / icon / illustration asset registry — updated 2026-11-21

**Read here for ALL graphics** before UI/UX work. [Design Library front door](../design-system/README.md) owns work protocol; this registry owns **which binary exists and where**. Notion [Product Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334) and [UI Illustration Asset Library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f) own Human PO decisions and approvals; GitHub `integration/staging` owns the current integrated source. "File present" is not "art approved", and PNG/JPEG snapshots are not proof of the original layered editable source.

## What is actually archived

| Family | Separate canonical files | Deployed use | Status |
| --- | ---: | --- | --- |
| [Lão Lý](lao-ly/README.md) | **17**: 10 expression illustrations + 5 mini head icons + 2 loading/error scenes | 9 byte-identical aliases under `site/assets/`; 10-pose library sources are retained | Uploaded and traceable. Individual assets approved as recorded; whole visual identity G2 remains open |
| [Home background](home/README.md) | **2**: current iPhone and landscape WebP | Homepage CSS & Component Library image specimens | New PO-supplied artwork, original pixel dimensions retained |
| Discipline landscapes | **15**: `discipline/*.webp` | React/native field cards + detail | New PO-supplied image set (including HCI and AI) |
| [Group portal overlays](portals/README.md) | **7**: `portals/cong-moi-01..07.webp` transparent alpha derivatives | 7 byte-identical `site/assets/portals/` aliases in Studio / React component | Imported from PO-supplied PNG ZIP, resized for responsive review; G2 review pending |
| [Brand marks](brand/README.md) | **3**: SVG seal, SVG favicon, PNG Apple touch icon | Header, favicon and app icon | Canonical copies added using exact existing Git blobs |
| Lão Lý historical contact sheet | 1 review reference (not counted above) | No current source of icon truth | Review archive; icon thumbnails superseded by five clean-edge minis |
| Inline non-Home legacy art | **4 embedded WebP data URIs** in `site/assets/li-layout.css` | Shelf, book, roots, wood | Retired Home data URIs removed; unrelated art untouched |

That is **44 separately managed image files** (17 + 2 + 15 + 7 + 3), plus a historical 1-file review contact sheet. These are **not** all generated or proposed art assets.

## Known gaps — no false complete claims

- **Portal masters:** 7 PO-supplied transparent PNGs exist in the original uploaded `Portal(1).zip`, but GitHub archives only their 7 resized WebP derivatives so far, not byte-exact original PNG files. Studio can review all seven; this is not final G2 approval. The wider concept list (8 group portals, 6 windows, 8 books, 3 entrances) remains a separate planning inventory; avoid treating the other concept PNGs as uploaded.
- **Individual discipline landscapes**: all 15 now have GitHub binaries and app references; that does not imply academic-content release or blanket visual-identity sign-off.
- **Four non-Home CSS-embedded illustrations** remain (`--shelf-url`, `--book-url`, `--roots-url`, `--wood-url`), unchanged.
- **Source-file provenance** for the Home/brand binaries: the exact deployed raster/SVG bytes are mirrored here, but the original upstream editable design/vector/large render, if any, is not verified.
- **No blanket G2 acceptance**: file custody ≠ design review, screen integration ≠ Human PO sign-off, and CI ≠ real iOS Safari/VoiceOver testing.

## Asset lifecycle contract (mandatory)

1. **Concept / draft:** record in Notion with status and source reference, but do not treat as deployed/approved or publish to the live asset directory. Respect PO review gate.
2. **PO-approved binary:** archive exact original in `design-assets/<family>/`, record metadata/provenance and decision link. Keep any source/original and exports separate, and record whether transparency is true alpha.
3. **Runtime use:** copy/export to `site/assets/` (or reference canonical through an explicit build path). Every shipped visual file needs a matching canonical file; keep runtime alias byte parity or document intentional compression/transformation plus source relation.
4. **Update / supersession:** update this registry, the family README, [Design Library](../design-system/README.md), the QA matrix, tests, and Notion handoff in the same change. Keep retired assets only as archival history, never silently revive rejected `Ngoài gương` or unapproved imagery.
5. **QA:** tiny size (24px where relevant), transparent edge halos on paper/forest, responsive portrait/landscape crop, accessibility/alt semantics, fallback/broken image, optimized file size, iPhone/iPad Safari/PWA when feasible. Reject a fake "tested" report.

[Machine-readable inventory](manifest.json) is CI-checked for the five current Home/brand source/runtime file pairs. Lão Lý has its [own stronger manifest and tests](lao-ly/manifest.json).

**Audit type:** GitHub staging source + user-provided ZIP images, November 21, 2026. Deployment/device validation separate. **Cost added: 0 VND.**
