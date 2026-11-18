# Lão Lý — active papercraft illustration & icon library (v4 · final clean-edge mini-heads)

**Current visual set (Human PO decision 2026-11-19):** 10 *Trong gương* expression illustrations + 5 chat/study-mode icons. **No Ngoài gương asset variant.** The original 25-image illustration set is superseded; Git history retains restoration provenance, but it is no longer part of the active source tree.

## What lives where
- `trong-guong/`: 10 paper-collage geometric PNG masters, 1024×1024 RGBA. Same faceted wood face, olive polygon leaves, white brows/beard, gold round glasses. Mirror art has no baked-in frame.
- `icon/`: five **final Human-PO-approved clean-edge head-only mini icons**, obtained from the exact latest five-head approval sheet (2026-11-19). Neutral = open smile; Vào nhịp = delighted; Đào sâu = skeptical/thoughtful; Quá tải = **fatigued/drooping eyes + sweat + scribble**, not startled; Hồi trí = peacefully asleep. Each 96×96 transparent indexed PNG is designed for 24px display. See [live icon sheet](icon/README.md).
- `papercraft-current-contact-sheet.png`: historical UX-ART-04 pose/contact-sheet snapshot; its five icon thumbnails are **superseded** by the canonical [final five mini-icons](icon/README.md). Never use the historical contact-sheet thumbnails as source assets.
- `manifest.json`: precise per-file provenance, SHA-256, size, use and review/acceptance boundary.

## Usage and gates
GitHub owns active asset binaries. Notion owns Human PO decisions, mapping and pending gates. App's seven Lão Lý PNG paths are populated from these new masters; copying a file is not a blanket G2 approval. Never reinstate older `ngoai-guong/` from historical revisions without a new Human PO decision. Mode labels reflect **user-selected** modes, never infer a person's health or cognitive state.

The 10 mirror illustrations originate from the newly generated 2026-11-19 papercraft pose sheet and compact crop; **not 10 independent in-mirror drawings**. The five mini icons are cropped from the PO-approved five-head sheet, **not** the large illustration pose set. Former 1024px functional icon files were removed from the active tree (restorable from Git history). Assess pose and asset visibility at narrow screens; physical Safari/PWA/VoiceOver/G2 remain open. No extra paid tools.
## UX-ART-06 · Approved system-state scenes (2026-11-19)
The Human Product Owner approved the **two-state papercraft context sheet** for real **loading** and **error** states. Masters live in `system-states/` with exact copies in `site/assets/laoly-state-loading.png` and `site/assets/laoly-state-error.png`.
- Loading: Lão Lý reading next to the lantern, sleeping cat, and armillary sphere; show **only during real pending work**.
- Error: Lão Lý puzzled over an invalid map; show **only for real failed operations**, paired with a clear cause and working recovery action.
- Both are original user-approved composition panels, split with transparent padding and saved as **1024×1024 RGBA PNG** (not baked onto dark/white backgrounds). The transparent silhouette is the **same active Lão Lý art language** as `Trong gương`, not the deprecated `Ngoài gương` character variant.
- Actual runtime first use: Settings → Backup → **Import JSON**. Shared visual style: `site/assets/li-state-scenes.css`; specimen: Component Library → Feedback & system states. If the file is invalid, too large, or persistence fails, expose the error with **Choose another file**. Never show an error illustration for ordinary empty search results or fake delays/loading.
- Asset approval is specific to these two pictures. Full character identity G2, 24px icon optical QA, physical iPhone/iPad Safari/PWA/VoiceOver, reduced-motion and edge-halo review remain independent.

## UX-ART-07 · final clean-edge five mini-heads (2026-11-19)
The Human Product Owner rejected the earlier startled Quá tải state and edge halos; the exact latest approved five-head image is now the source. We isolated all five from an RGB reference whose checkerboard was baked into pixels and replaced it with **real PNG transparency**, not a checkerboard background. All five were standardized to 96px, visual-checked at 24px/42px on both paper/forest, and copied byte-for-byte to stable app aliases. We did **not** redraw any head, change the illustration family, or alter learning-mode logic. Browser CI/publishing must pass before claiming deployed; physical iPhone Safari/PWA, iPad responsive, VoiceOver and overall G2 are separate open checks.
