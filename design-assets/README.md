# Visual image / icon / illustration asset registry — as-audited 2026-11-19

**Read here for ALL graphics** before UI/UX work. [Design Library front door](../design-system/README.md) owns work protocol; this registry owns **which binary exists and where**. Notion [Product Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334) and [UI Illustration Asset Library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f) own Human PO decisions and approvals; GitHub `main` owns actually checked-in files. "File present" is not "art approved", and PNG/JPEG snapshots are not proof of the original layered editable source.

## What is actually archived

| Family | Separate canonical files | Deployed use | Status |
| --- | ---: | --- | --- |
| [Lão Lý](lao-ly/README.md) | **17**: 10 expression illustrations + 5 mini head icons + 2 loading/error scenes | 9 byte-identical aliases under `site/assets/`; 10-pose library sources are retained | Uploaded and traceable. Individual assets approved as recorded; whole visual identity G2 remains open |
| [Home background](home/README.md) | **4**: iPhone JPG, iPad JPG, desktop WebP, mobile WebP | Homepage CSS & Component Library image specimens | Canonical copies added using exact existing Git blobs, not repainted |
| [Brand marks](brand/README.md) | **3**: SVG seal, SVG favicon, PNG Apple touch icon | Header, favicon and app icon | Canonical copies added using exact existing Git blobs |
| Lão Lý historical contact sheet | 1 review reference (not counted above) | No current source of icon truth | Review archive; icon thumbnails superseded by five clean-edge minis |
| Inline legacy visual art | **6 embedded WebP data URIs** in `site/assets/li-layout.css` | Hero, shelf, book, roots, wood legacy scenes | Git-tracked only inside CSS; **not** individually archived graphic files |

That is **24 separately managed production image files** (17 + 4 + 3), plus a historical 1-file review contact sheet. These are **not** all generated or proposed art assets.

## Known gaps — no false complete claims

- **25 planned concept PNGs** in the Notion UI Illustration Asset Library: **8 group portals + 6 discipline windows + 8 subject books + 3 Home entrances**. Notion contains checklist/specs and chat-file references; current GitHub main does not contain the expected files. Not all are Human PO approved. Do **not** auto-publish pending drafts or count naming/checklist items as uploaded binaries.
- **Individual discipline landscapes** (15 planned): Chinese-language color-graded scene has Human PO asset approval but no verified canonical GitHub binary / app integration. English v2 is **pending** approval and was deliberately not published. Other generated explorations are not known to be in `main`.
- **6 CSS-embedded art images**: historical `--hero-mobile-url`, `--hero-url`, `--shelf-url`, `--book-url`, `--roots-url`, `--wood-url`. These are source-controlled as CSS contents but not standalone files. Extract later without pixel changes and with visual regression.
- **Source-file provenance** for the Home/brand binaries: the exact deployed raster/SVG bytes are mirrored here, but the original upstream editable design/vector/large render, if any, is not verified.
- **No blanket G2 acceptance**: file custody ≠ design review, screen integration ≠ Human PO sign-off, and CI ≠ real iOS Safari/VoiceOver testing.

## Asset lifecycle contract (mandatory)

1. **Concept / draft:** record in Notion with status and source reference, but do not treat as deployed/approved or publish to the live asset directory. Respect PO review gate.
2. **PO-approved binary:** archive exact original in `design-assets/<family>/`, record metadata/provenance and decision link. Keep any source/original and exports separate, and record whether transparency is true alpha.
3. **Runtime use:** copy/export to `site/assets/` (or reference canonical through an explicit build path). Every shipped visual file needs a matching canonical file; keep runtime alias byte parity or document intentional compression/transformation plus source relation.
4. **Update / supersession:** update this registry, the family README, [Design Library](../design-system/README.md), the QA matrix, tests, and Notion handoff in the same change. Keep retired assets only as archival history, never silently revive rejected `Ngoài gương` or unapproved imagery.
5. **QA:** tiny size (24px where relevant), transparent edge halos on paper/forest, responsive portrait/landscape crop, accessibility/alt semantics, fallback/broken image, optimized file size, iPhone/iPad Safari/PWA when feasible. Reject a fake "tested" report.

[Machine-readable inventory](manifest.json) is CI-checked for the seven current Home/brand source/runtime file pairs. Lão Lý has its [own stronger manifest and tests](lao-ly/manifest.json).

**Audit type:** GitHub `main` tree + actual design files + Notion Asset Library, November 19, 2026. **Cost added: 0 VND.**
