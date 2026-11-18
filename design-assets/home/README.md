# Home image assets — exact shipped artwork snapshots

This directory preserves the **four actual graphic binaries** used for the Home/background family. The files have exactly the same Git blob SHA as the corresponding `site/assets/<filename>` copies. No image pixels, compressions, color or framing were changed by the governance audit.

| File | Current role | Notes |
| --- | --- | --- |
| [home-li-iphone-20261119.jpg](home-li-iphone-20261119.jpg) | Current narrow-screen Home background | Historical PO-approved artwork; real device crop check still separate |
| [home-li-ipad-20261119.jpg](home-li-ipad-20261119.jpg) | Current iPad/tablet Home background | Large ~7.9 MB original runtime JPEG; archive does not mean optimized |
| [home-mystic-cool-desktop.webp](home-mystic-cool-desktop.webp) | Desktop/default fallback and Component Library images | Historical deployed WebP |
| [home-mystic-cool-mobile.webp](home-mystic-cool-mobile.webp) | Mobile fallback and Component Library images | Historical deployed WebP |

**Important:** these are exact deployed **binary** sources, not verified layered design originals. Home CSS runtime paths remain unchanged; see [site/assets/library-hub.css](../../site/assets/library-hub.css) and [site/assets/li-layout.css](../../site/assets/li-layout.css). Human PO G2 overall remains open. [All-asset inventory](../README.md).
