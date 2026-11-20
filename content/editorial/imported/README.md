# Legacy Notion manuscripts · GitHub migration inventory (2026-11-20)

All **25 missing known manuscript sources** were migrated into immutable-source GitHub JSON. Together with three Wave1 locked lessons in `content/lessons/` and the existing L09-1-1 editorial source, the repository now holds all **29 known manuscript bodies** described in the 2026-11-20 content ledger: **21 canonical legacy lesson IDs** + **8 noncanonical research drafts**.

## What is ready
- Full original lesson-body markdown is preserved in each `content.full_original_markdown`. VI/EN learner prose is also sectioned in `content.localized.vi.body_md` and `.en.body_md`. For S182 research drafts, the shared independent exercise, editor-key and rubric sections remain in the full source body and are **not** shipped.
- Stable source provenance / title / IDs, draft lifecycle and explicit rights-unreviewed statuses are included. Catalog research candidates stay proposals; no invented canonical IDs.
- Full inventory and scope: [index.v1.json](index.v1.json).

## What is NOT ready
- Imported sources use `notion-editorial-import-v1` and are **NOT** validated `editorial-structured-v1` runtime lessons. Promote only after accurate section/assessment/mentor modeling, source and rights review, post-submit answer gate, source pack build and PO approval. `tools/build_content_packs.mjs` excludes this folder.
- 135 legacy lesson **outlines** ≠ 135 authored bodies: 21 known body IDs, 114 outline-only; runtime still contains only three Wave1 released/packaged bodies.
- Two separate editor-only answer-key Notion pages for F04/F05 were deliberately **not exported** into this public GitHub repository. Never put private learner data or confidential keys here; use Neon/Dexie for user progress.
- Notion is now historical provenance. All future learning-content edits occur in GitHub source under `content/`.
