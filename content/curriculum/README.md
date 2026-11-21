# li. Curriculum navigation — current ISCED-F 2013

**Status:** production source backport candidate; not a release authorization. The public runtime on `main` uses `site/assets/catalog-curriculum-data.js` as a static catalog, mirrored from the reviewed `integration/staging` versioned source `content/curriculum/legacy-catalog.v1.json`. The staging branch additionally builds React and `site/content-packs/`; those features are **not** part of this minimal main backport.

- Current populated broad fields: **02 Arts & Humanities, 03 Social Sciences/Journalism/Information, 04 Business/Administration/Law, 05 Natural Sciences/Mathematics/Statistics, 06 ICT** (5 of UNESCO's 11 broad fields).
- Stable existing inventory: **15 Fields / 45 Courses / 135 Lessons**. Never equate outline presence with publish approval.
- `category` is a bilingual editorial filter/tag within Group, not a navigation level. The hierarchy stays Group → Field → Course → Lesson → Chapter.
- Old Group slug links normalize through `legacyGroupAliases`, including previous `technology`, `mathematics`, `language`, `history`, `psychology`, `music`, `business`. Stable F/C/L IDs and progress keys remain intact.
- Source reference: [UNESCO ISCED-F 2013](https://uis.unesco.org/sites/default/files/documents/isced-fields-of-education-and-training-2013-en.pdf). Detailed codes for multidisciplinary fields are provisional; app categories are not official UNESCO narrow-field names.
- Current editorial decisions: [Notion Curriculum Roadmap](https://app.notion.com/p/41a6cf6db72a817cb564e44436740f7d); implementation [PR #516](https://github.com/sali5610/li/pull/516), [pack normalization PR #519](https://github.com/sali5610/li/pull/519).

Never add a Neon taxonomy migration, academic release, or Cloudflare deployment from metadata alone. Production remains gated by manual G4 release approval.
