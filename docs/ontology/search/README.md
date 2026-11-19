# ONT-04A · Typed Search offline/read-only pilot

> **Status: experiment on a DRAFT PR only.** No site search, no live Lão Lý, no 15-field knowledge graph, no real user data, no paid AI/vector model, no DB migration, no app/Cloudflare deployment. This work builds on ONT-03B → ONT-03A → ONT-01 unmerged draft branches. All **03C population remains PENDING**, per PO's latest Notion decision.

Source-of-truth links: [ONT-04 backlog](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927), [ONT-03 03C blocker](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43), [S37 candidate inventory](https://app.notion.com/p/41a6cf6db72a8136858dc0f61c8327e6), [L2 library](https://app.notion.com/p/41a6cf6db72a81cdbb29f741a2ac84ec), [CUR-TD academic gates](https://app.notion.com/p/41d6cf6db72a8123a550cbe8be314738).

## Source boundary and indexing

The experimental index **only** reads the checked-in curated example records of:
- [ONT-03A academic graph](../academic/demo.graph.v0.1.json): three editorially represented Fields F03 UX, F09 Data Science and F15 Supply Chain, plus the small **candidate** Berkeley source-programme identity; it does not imply full course coverage or confirm independent scholarship.
- [ONT-03B pedagogy graph](../pedagogy/demo.graph.v0.1.json) and [13 canonical L2 methods](../pedagogy/techniques.v0.2.json): method names are only research/editorial identifiers, no execution.
- [Two S37 candidate-only outline titles](candidate-outlines.v0.1.json) `L01-1-1` and `L02-2-2` explicitly labelled `proposed` and `rightsState=unknown`. They are **not published**. Current S37 45/135 reserved references are not a 135-playable-lesson corpus.

Searchable kinds: Field, Lesson, Concept, Course, SourceProgramme, SourceCourse, TechniqueDefinition. SourceClaim/SourceEdition are **not keyword results**, but may appear in a traceable verified 1–2-hop evidence path; no answer keys are indexed. Personal Attempt/Learner/ReviewDue/AssistanceEvent/Feedback are strictly forbidden.

Index fields are whitelisted: canonical ID, node type, original title, VI/EN alias, version, independent review/publish/rights states and source URL/section/date. No chapter body, learner notes, answer solution, auth token, global site crawl or external search data.

## Actual query contract

[offline-search.mjs](offline-search.mjs) exports `buildPilotIndex`, `searchPilot`, `expandReviewed`. Inputs are **trusted explicit local fixtures**, not an arbitrary remote endpoint. No imports from React or API/DB.

- Query via `id` / legacy ID suffix, exact VI/EN title or alias, deterministic prefix/token match and a **single edit** fuzzy match only for sufficiently long terms; default limit 10 and max query 128 characters; type facets.
- Rank exact ID above exact title/alias, then prefix, all tokens, contained phrase, typo. Prefer requested locale slightly. Never silently merge same-surface terms across different kinds or senses. Return `whyShown` and `sourceUrl/sourceSection/checkedOn` per result.
- Default search hides `reviewState=proposed` candidates; `includeCandidates:true` is **debug/review only** and still produces `playable=false`. Verified editorial drafts are returned explicitly marked draft. PO-content-locked Wave1 manuscript is **not automatically a verified published route**. Source rights, content maturity, app deployment and availability are separate gates.
- Reviewed graph expansion limited to 0–2 hops; currently whitelisted `SCOPED_TO_FIELD`, `STATES_CLAIM`, `SUPPORTED_BY`, `OFFERED_BY`, `CATALOGUED_IN`, with both endpoints and edges `verified/approved` and source provenance. Direction can be traversed both ways with full path shown; a same-Field 2-hop result is **NOT** a hard prerequisite. All proposed `TEACHES`, `REQUIRES`, `OPTIONAL_METHOD` etc. **do not expand**.
- Unknown query returns `no_match` and explains this is **only a small demo**, not proof that the full discipline lacks the topic. Revoked/unsupported sources are excluded. No navigation handler or result route is emitted; every result reports `playable=false`.

## How to run

```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
node tools/validate_pedagogy_ontology.mjs --check
node tools/test_offline_typed_search.mjs
```

Node 22+, built-in modules only, zero network or paid dependencies. The final test evaluates [21 hand-labelled queries](eval-corpus.v0.1.json) (known IDs, vi/en titles, alias, typo, type filter, candidate suppression, unknown) and rejects failure when an expected result is not first. It reports **Precision@1**, **Recall@5**, **MRR** *for this tiny source-bound constructed corpus only*, never a production benchmark/learning effectiveness claim. It additionally checks privacy, identity collisions, cross-type ambiguity in a **synthetic-only** test, link review gates, no spoiler/source fields, no implied route/playability and absence of >2-hop traversal. An unknown value remains unknown.

## Remaining blockers and future follow-up

- **ONT-03C:** pending CUR-01–04 top-down verified 15-field university requirement and original li. course register; no blanket importing candidates from S37.
- **ONT-04B:** app/React search and visual/accessibility QA depend on separate ONT-02, Step16.2 and Step22; no production site edits in this PR.
- **ONT-04C:** contextual Lão Lý assistance, source claims/rebuttals, spoiler/permission tests and private data isolation need real Step16 auth/RLS and G2/release gates. This pilot **does not** use an LLM and does not claim to be a deployed tutor.
- **ONT-05:** optional embeddings only after this lexical+graph baseline is tested on a representative corpus with verifiable zero cost, privacy, source rights and device constraints.

This is technical contract/fixture QA, not a scholarly review of content, a paid-API-enabled semantic search engine, a released feature or a systemwide evaluation. +0 VND.
