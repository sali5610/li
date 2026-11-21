# Group portal overlays · 7 variations (G2 draft)

These seven **transparent WebP runtime derivatives** are made from the user's `Portal(1).zip` containing original PNG art (`cong-moi-01.png` to `cong-moi-07.png`). The PNG master files remain in that uploaded ZIP; **they are not independently committed to GitHub**. Do not mislabel the WebP derivatives as byte-exact PNG originals.

| ID | Canonical derivative | Runtime alias |
| --- | --- | --- |
| 01 | `design-assets/portals/cong-moi-01.webp` | `site/assets/portals/cong-moi-01.webp` |
| 02 | `design-assets/portals/cong-moi-02.webp` | `site/assets/portals/cong-moi-02.webp` |
| 03 | `design-assets/portals/cong-moi-03.webp` | `site/assets/portals/cong-moi-03.webp` |
| 04 | `design-assets/portals/cong-moi-04.webp` | `site/assets/portals/cong-moi-04.webp` |
| 05 | `design-assets/portals/cong-moi-05.webp` | `site/assets/portals/cong-moi-05.webp` |
| 06 | `design-assets/portals/cong-moi-06.webp` | `site/assets/portals/cong-moi-06.webp` |
| 07 | `design-assets/portals/cong-moi-07.webp` | `site/assets/portals/cong-moi-07.webp` |

Each image is resized to 560px wide using Lanczos and saved as quality-90 WebP with true alpha. All seven alias bytes use identical Git blobs. Total runtime files: ~326 KB.

**Implementation:** `design-system/react/PortalCategoryCard.tsx` is the reusable component; transparent portal overlay is z-index 1, and its illustration slot is behind (z-index 0). `site/design-system/portal-category-card.html` is the review specimen in **Design System Studio → Cards → Portal Category Card**. Use Variant 01–07 to see each original portal design with an intentionally empty illustration interior.

**Scope:** G2 draft / PO review pending. Does **not** replace the live Tàng Thư group card or release discipline imagery. The original uploaded ZIP is provenance, not a Git-tracked master archive.