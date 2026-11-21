# li. — Current curriculum navigation (ISCED-F 2013)

**Status:** 5-group IA merged to `integration/staging` via PR #516, 2026-11-22. The historical 8-group navigation is superseded; this does **not** approve or publish any new teaching content.

## Source of truth

- Canonical field/course/lesson mapping: `content/curriculum/legacy-catalog.v1.json`.
- Compiled outputs: `site/assets/catalog-curriculum-data.js`, `site/content-packs/course-catalog.json`, and graph/search packs. Regenerate with `node tools/build_content_packs.mjs`; never independently edit generated packs.
- International reference: [UNESCO ISCED-F 2013](https://uis.unesco.org/sites/default/files/documents/isced-fields-of-education-and-training-2013-en.pdf), Appendix I.
- Only **5 populated broad fields out of UNESCO's 11** appear in li. now. This is the current learning scope, not a claim about the complete worldwide classification.
- Category tags are **li. editorial subcategories for browsing/filtering**, not claimed to be UNESCO's official 3-digit narrow categories. Four-digit codes below are **subject-based suggestions**, not accreditation or official classification of a degree.

## Navigation and category tags

Path remains **Nhóm ngành → Chuyên ngành → Môn → Bài → Chương**; category is a filter/tag within a group, **not** another navigation tier.

| ISCED broad field (li. Group ID) | li. Category tag | Existing Field | ISCED detail suggestion | Status |
| --- | --- | --- | --- | --- |
| 02 Nghệ thuật & Nhân văn (`arts-humanities`) | Ngôn ngữ / Languages | F01 Tiếng Trung; F02 Tiếng Anh | 0231 Language acquisition | Subject-based |
| 02 | Lịch sử / History | F10 Lịch sử thế giới | 0222 History and archaeology | Subject-based |
| 02 | Âm nhạc / Music | F14 Lý thuyết âm nhạc | 0215 Music and performing arts | Subject-based |
| 03 Khoa học xã hội, Báo chí & Thông tin (`social-sciences`) | Xã hội & văn hóa / Society & Culture | F06 Xã hội học; F07 Nhân học | 0314 Sociology and cultural studies | Subject-based |
| 03 | Kinh tế học / Economics | F08 Kinh tế học | 0311 Economics | Subject-based |
| 03 | Tâm lý học / Psychology | F11 Neurodiversity Studies; F12 Tâm lý học nhận thức; F13 Tâm lý học hành vi | 0313 Psychology | F11 provisional |
| 04 Kinh doanh, Quản trị & Luật (`business-administration-law`) | Quản trị & vận hành / Management & Operations | F15 Supply Chain | 0413 Management and administration | Provisional |
| 05 Khoa học tự nhiên, Toán & Thống kê (`natural-sciences-math`) | Dữ liệu & thống kê / Data & Statistics | F09 Data Science | 0542 Statistics | Provisional (also ICT) |
| 06 Công nghệ thông tin & Truyền thông (`ict`) | Thiết kế tương tác / Interaction Design | F03 Human–Computer Interaction (HCI) | 0613 Software and applications development and analysis | Provisional (also design) |
| 06 | Phát triển phần mềm / Software Development | F04 Backend | 0613 Software and applications development and analysis | Subject-based |
| 06 | Trí tuệ nhân tạo / Artificial Intelligence | F05 Generative AI | 0619 ICT not elsewhere classified | Provisional |

The app's displayed group titles and category tags are bilingual. Filter chips let learners narrow the fields within a group; field cards retain the tag so context is visible even when viewing all.

## Compatibility and release boundary

- Keep all **15 F IDs, 45 C IDs, 135 L IDs**, original academic manuscript bodies, rights, course/lesson publication flags and personal learning records unchanged.
- Old group path aliases, including `technology/hci/C03-1`, `technology/ux-design/C03-1`, `language/chinese/C01-1`, are normalized to the new Group IDs; refresh, Back and direct links must continue to work.
- The **public** generated `site/content-packs/C*.json` lesson `hierarchy.group` follows the current ISCED-F parent, preserving identical locked lesson body and stable lesson/field/course IDs. The generator derives current parents by Field ID.
- Legacy manuscript `hierarchy.group` fields are provenance snapshots, not today's navigation taxonomy. The pack builder resolves current parent groups through stable Field IDs; **do not rewrite locked lesson text** or Neon/Dexie progress.
- New categories/groups must be appended based on real curriculum needs, not a fixed quota; academic research candidate lists remain editorial drafts. No Cloudflare production, content release or user-data migration is implied.

**QA focus:** 5 group cards; 15 field cards; category filters (All and each tag, VI/EN); old links; stable lessons/progress; search graph/pack and React+native parity. Stop after focused checks pass.
