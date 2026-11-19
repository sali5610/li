# li. ontology — backend/data-layer baseline

Status: **implementation candidate**, not curriculum publication or live learner sync.

This directory contains **data contracts + read-only index/query implementation** only. No independent UI, graph page, companion chatbot, endpoint, account storage or Neon migration.

## Contracts
- `registry.v0.1.json`, `graph.schema.json`, `ontology-types.ts`: canonical entity kinds, typed predicates, provenance, review/publish/rights/visibility states, and IDs.
- `academic/`: sourced Field–Course–Lesson–Concept–Source graph extension, with explicit editorial-only pilot coverage.
- `pedagogy/`: L2 technique definitions, L3 relationships, method-fit candidates, private-event **schema only** (no private data).
- `search/offline-search.mjs`: `buildPilotIndex()`, `searchPilot()`, `expandReviewed()`; pure read-only logic with explicit fixture input and source-gated public-only inclusion.

## Run the changed-surface checks
```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
node tools/validate_pedagogy_ontology.mjs --check
node tools/test_offline_typed_search.mjs
```

## Critical limits
- `demo.graph.v0.1.json` files and Search eval corpus are **fixtures**, not the complete canonical curriculum, and never grant a live lesson route.
- `buildPilotIndex()` intentionally accepts only the curated complete demo bundle. It is **not** a production/general-purpose data ingestion API. It does not read learners or connect to Neon.
- No frontend currently imports this package from `main` and no live app feature is thereby claimed. Runtime integration waits for the owning learning feature; no speculative new UI.
- ONT-03C bulk curriculum mapping waits on CUR-TD and release gate; ONT-05 vector search is Later.
- Ontology visibility is not database RLS. Auth and owner-bound learner records are separate security work.

Selected unchanged source blobs originate from tested ONT-01 / ONT-03A / ONT-03B / ONT-04A research chain, copied without React/DS/companion work. Changes in this merge are subject only to one focused Node CI.
