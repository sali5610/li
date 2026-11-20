# li. canonical course content — Wave 1
**Source of truth:** `content/lessons/*.json` (GitHub), **not Notion at runtime**.
Original bilingual learning copy, the four independent questions, hints, answer commentary and four rubric items were copied **verbatim from the PO-frozen native Hi-Fi payloads**. No academic words were rewritten. The three lesson keys remain `L03-1-2`, `L09-1-2`, `L15-2-2`. Sources are references, not a claim that academic release gates passed.

## Four navigation layers: Nhóm ngành → Chuyên ngành → Môn → Bài
- `content/curriculum/legacy-catalog.v1.json` is GitHub canonical for the *complete* nested 8 group / 15 field / 45 course / 135 lesson-outline tree. `node tools/build_content_packs.mjs` also deterministically regenerates the **existing** `site/assets/catalog-curriculum-data.js` from this JSON, byte-identical to its original S36 version, so current native Tàng Thư and native Search consume the canonical GitHub source with NO renderer rewrite. Never hand-edit generated JS. Generated `site/content-packs/course-catalog.json` exposes all four layers as normalized records with stable parent/child IDs, content availability and breadcrumb traversal. The shared typed graph includes all 195 structural `PART_OF` links, not just Wave1.
- Frontend consumes `listGroups()`, `listFields({groupId})`, `listCourses({fieldId,groupId,level})`, `listLessonOutlines({courseId,fieldId})`, `getLessonOutline(id)`, `getBreadcrumbs(id)`. `getLesson(id)` loads body on demand only when it really exists; 132 outline-only lessons remain drafts and are excluded from search. The three PO-frozen bodies stay `review_only`.
- **Different dimension**: pedagogical progression tags (Foundation / Intermediate / Advanced / Capstone) are NOT four hierarchy layers.

## Pedagogical course progression tags and editorial course inventory
- `content/curriculum/course-levels.v1.json`: four ordered pedagogical **tags** — Foundation / Nền tảng → Intermediate / Cốt lõi → Advanced / Chuyên sâu → Capstone/Portfolio / Ứng dụng-nghiên cứu. These are **not** added to the Group > Field > Course > Lesson > Chapter navigation hierarchy and do not impose a per-field quota. Elective/specialism is a role, not another level.
- `content/curriculum/legacy-catalog.v1.json`: all 45 existing Cxx-x course IDs and 135 legacy lesson outline IDs (8 groups / 15 fields), no renumbering. Only the 3 Wave1 lesson bodies are canonical learning packs at present; old `published` fields are navigation flags, not academic release.
- `content/curriculum/research-candidates.v0.1.json`: **238 source-preserved PROP candidate courses**, including 15 Capstone/Portfolio tagged proposals, copied from the PO-approved CUR-04A *editorial working baseline*. They remain `research_candidate` with `canonicalCourseId: null`; cannot appear as shipped learner courses until independent curricular approval. Current editorial baseline: 64 foundation / 84 intermediate / 75 advanced / 15 capstone. Role tags remain separate; no capstone quota.
- Build emits `site/content-packs/course-levels.json` + complete `course-catalog.json` from the GitHub canonical files. Navigation/ontology consumer uses the same generated IDs. Notion is provenance/editorial planning only; no runtime fetch. Research candidates are deliberately **excluded** from learner-facing generated course-catalog.

## One canonical input → generated static outputs
- `schema/lesson.schema.json` and `schema/content-types.ts`: required common metadata, flexible typed instructional body; no extra CMS.
- `graph/concepts.json` and `graph/edges.json`: typed *one-direction* authored relationships; reuse `docs/ontology/registry.v0.1.json` and academic relation extension. IDs that have not been editorially adjudicated stay `proposed`, including links derived from existing Wave1 cross-lesson navigation. No invented hard prerequisites or Wave1 L2 method-fit.
- `node tools/build_content_packs.mjs` writes `site/content-packs/{manifest,C*.json,graph,backlinks,search}.json`. `--check` verifies committed generated snapshots; it also checks the original frozen JS copy still matches until React/native runtime is migrated. Never edit generated indexes manually.
- `site/assets/li-content-adapter.mjs` exports `createContentClient`: `getLesson(id)`, `getConceptLessons(conceptId)`, `getRelatedLessons(id,{includeProposed})`, `getBacklinks(id)`, and public search document retrieval. Loads a **single course pack on demand**; a read-only adapter only.
- `node tools/test_content_adapter.mjs` is the changed-surface smoke, not another global QA suite.

## Verified learner-facing knowledge connection (2026-11-20)
- Verified **L03 ↔ L09 as a comparison of distinct survey error mechanisms**, not an equivalent concept or learning prerequisite. Sources are AAPOR survey questionnaire best practices and Pew Research Center's total survey error method. L03 and L09 `TEACHES` edges and two concept identities are source-checked, but full course/lesson academic publication remains gated.
- Existing `site/assets/lesson-related-wave1.js` now loads canonical `contentClient.getRelatedLessons(id)` and `graph()` instead of a hardcoded navigation list, displaying concept names, bilingual reason and direct external source. React L09's legacy shell is hidden; the related section stays visible after the React host. Source unavailable → no unsourced fallback.
- L09 ↔ L15 and L09 selection bias vs random variation remain `proposed`. No unverified source is promoted or displayed as confirmed.

## Wave 2 canonical-structure editorial candidate (NOT shipped)
- `content/editorial/L09-1-1.lesson.v1.json` is now a **schema-aligned draft** for L09-1-1 with source-preserved VI/EN teaching sections, independently gated T06/T07 practice, four independent written responses, model answer and rubric. Original source [Git blob 75475cc](https://github.com/sali5610/li/blob/content/wave2-l0911-cms-offline-20261118/docs/editorial/wave2-cms-l0911/L09-1-1.cms.v1.staging.json) remains in Git history; the duplicate current CMS file was removed.
- Third-party Commons image and unreviewed Lão Lý quote metadata are **not** included. OpenStax, NIST and USNA are **reference-only external links**, not imported book content. [Editorial rights and academic caveats](editorial/README.md).
- `publishState:draft` and `reviewState:proposed`: file stays out of `content/lessons/`, runtime packs, Search and available lesson routes. Academic statistics specialist and owner release gates still open; no Wave2 publish, migrations or Cloudflare.

## Important boundary
The old native JS still owns the deployed lesson **rendering and progress** until Chat 1/2 integrate the content adapter into the shared app. Temporary duplicate frozen payloads are guarded against drift. This PR does **not** claim the new source is consumed by the deployed learner UI, nor does it change Neon, auth, RLS, production release, or a second staging URL. The new static packs are intended for the **existing** `integration/staging` site build, not an independent deployment.

`review_only` + `po_locked` is intentional: content freeze is not full academic/rights/release sign-off. Existing legacy catalog `published=true` is a navigation flag, not a new approval for these generated packs. External image rights are a separate release gate, especially for L15 Wave1B conditional.

**Ownership:** This repository directory owns canonical authored content and schema. Chat 4 owns search/retrieval, reusing `search.json` and `graph.json`; it must not create a parallel graph engine.
