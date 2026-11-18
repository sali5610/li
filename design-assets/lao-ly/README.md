# Lão Lý — active papercraft illustration & icon library (v3)

**Current visual set (Human PO decision 2026-11-19):** 10 *Trong gương* expression illustrations + 5 chat/study-mode icons. **No Ngoài gương asset variant.** The original 25-image illustration set is superseded; Git history retains restoration provenance, but it is no longer part of the active source tree.

## What lives where
- `trong-guong/`: 10 paper-collage geometric PNG masters, 1024×1024 RGBA. Same faceted wood face, olive polygon leaves, white brows/beard, gold round glasses. Mirror art has no baked-in frame.
- `icon/`: five PO-approved **head-only mini icons** cropped from the 2026-11-19 transparent 5-face sheet (neutral, joyful=Vào nhịp, thoughtful=Đào sâu, surprised=Quá tải, sleepy=Hồi trí). 96×96 transparent indexed PNG masters; intended to read at 24 CSS px. No bodies, books or cup. Test actual iPhone/iPad Safari and paper/forest backgrounds.
- `papercraft-current-contact-sheet.png`: all 15 assets and a 48px preview.
- `manifest.json`: precise per-file provenance, SHA-256, size, use and review/acceptance boundary.

## Usage and gates
GitHub owns active asset binaries. Notion owns Human PO decisions, mapping and pending gates. App's seven Lão Lý PNG paths are populated from these new masters; copying a file is not a blanket G2 approval. Never reinstate older `ngoai-guong/` from historical revisions without a new Human PO decision. Mode labels reflect **user-selected** modes, never infer a person's health or cognitive state.

The 10 mirror illustrations originate from the newly generated 2026-11-19 papercraft pose sheet and compact crop; **not 10 independent in-mirror drawings**. The five mini icons are cropped from the PO-approved five-head sheet, **not** the large illustration pose set. Former 1024px functional icon files were removed from the active tree (restorable from Git history). Assess pose and asset visibility at narrow screens; physical Safari/PWA/VoiceOver/G2 remain open. No extra paid tools.

## UX-ART-05 · Approved system-state scenes (2026-11-19)
The Human Product Owner approved the **two-state papercraft context sheet** for real **loading** and **error** states. Masters live in `system-states/` with exact copies in `site/assets/laoly-state-loading.png` and `site/assets/laoly-state-error.png`.
- Loading: Lão Lý reading next to the lantern, sleeping cat, and armillary sphere; show **only during real pending work**.
- Error: Lão Lý puzzled over an invalid map; show **only for real failed operations**, paired with a clear cause and working recovery action.
- Both are original user-approved composition panels, split with transparent padding and saved as **1024×1024 RGBA PNG** (not baked onto dark/white backgrounds). The transparent silhouette is the **same active Lão Lý art language** as `Trong gương`, not the deprecated `Ngoài gương` character variant.
- Actual runtime first use: Settings → Backup → **Import JSON**. Shared visual style: `site/assets/li-state-scenes.css`; specimen: Component Library → Feedback & system states. If the file is invalid, too large, or persistence fails, expose the error with **Choose another file**. Never show an error illustration for ordinary empty search results or fake delays/loading.
- Asset approval is specific to these two pictures. Full character identity G2, 24px icon optical QA, physical iPhone/iPad Safari/PWA/VoiceOver, reduced-motion and edge-halo review remain independent.
