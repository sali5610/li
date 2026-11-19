# ONT-03A — Academic knowledge ontology v0.1 (draft, no release)

> PO approved 03A/03B/03C incremental strategy in [ONT-03 Notion](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43); this is **03A ONLY**: machine-checkable academic concept/syllabus metadata, editorial source observations and a tiny 3-field demo. It is **NOT** a completed syllabus, a public application feature, a new database migration or 03B learning-method execution. PR is stacked on unmerged ONT-01. UI ontology remains the separate ONT-02 workstream.

## Current curricular truth

Read [CUR-TD top-down remediation](https://app.notion.com/p/41d6cf6db72a8123a550cbe8be314738) before backfilling. Sequence is **15 fields scope → complete reference programme requirements including elective rules (within selected programmes) → cross-university comparison → original li. Course catalogue → course outcomes → lesson blueprint → lesson chapters and method fit**. CUR-01..04 have not been completed across 15 fields. Existing 45 Môn/135 Bài IDs remain legacy references, not a target or fixed quota. Foundation/Intermediate/Advanced are metadata, not another mandatory navigation tier.

**Crucial identity boundary:** `SourceProgramme` (year/degree/framework) → `ProgrammeRequirement` → `SourceCourse` is **NOT** the same as li. `Course` → `Lesson` → `Chapter`. No Berkeley source-course ID may be recycled as a li. Course ID; same university course code at different institutions/editions is not an equivalence. Cross-listed university codes require official evidence and per-edition equivalence; a li. suggested prerequisite is not a formal university prerequisite.

## Files & contracts

| File | Purpose |
| --- | --- |
| `academic/registry.v0.1.json` | Add four source-programme kinds and eleven typed relations to inherited ONT-01 graph vocabulary; no modifications to shared UI registry |
| `academic/academic.schema.json` | JSON Schema Draft 2020-12 document shape (graph topology enforced by Node) |
| `academic/demo.graph.v0.1.json` | Illustrative nodes/edges from Data Science (F09), UX (F03), Supply Chain (F15), plus **one** Berkeley programme/sample requirement/course |
| `tools/validate_academic_ontology.mjs` | Relation endpoint validator, provenance/alias/lifecycle/rights checks, cycle detection, guarded hard prerequisites and 16 negative rejection tests |
| `li-academic-ontology.yml` | PR-only CI, no web build, Neon or release action |

## Academic object contract

- **Curriculum:** current visible IA Group → Field → Course → Lesson → Chapter. A `SCOPED_TO_FIELD` edge is only a search/index shortcut until a real Course is approved; never infer or fabricate a `PART_OF` hierarchy from the lesson number alone.
- **University/framework:** `Institution`, `SourceProgramme` (edition, scope, degree/framework), `ProgrammeRequirement` (required/elective/option, rule, coverage), `SourceCourse` (institution + programme + edition + exact code + crosslist key). The sole DATA 8 case reflects [S183 institutional research](https://app.notion.com/p/41d6cf6db72a81b58cd8f48bb4776fa0), status **proposed**, <b>not</b> an audited full programme inventory.
- **Knowledge:** `Concept` has stable ID, meaning, boundaries, VI/EN aliases, explicit non-synonyms, rights/source version; `LearningOutcome` includes measurable action. `Misconception` and `Chapter` remain supported by the inherited contract but are **not fabricated** in this pilot.
- **Claims:** `SourceClaim` records an *editorial observation* at a source section, linked to `SourceEdition` and originating lesson. “This lesson says X” ≠ “X was independently demonstrated by research”. Separate `rightsState` and content publication state; no automatic academic approval.
- **Relations:** `TEACHES`, `AIMS_AT`, `SUPPORTED_BY` and `CONTRASTS_WITH` from ONT-01; new `SCOPED_TO_FIELD`, `STATES_CLAIM`, `CLAIM_ABOUT`, `OFFERED_BY`, `HAS_REQUIREMENT`, `CATALOGUED_IN`, `ELIGIBLE_FOR`, `INFORMS_COURSE`, `FORMAL_PREREQUISITE`, `RECOMMENDED_BEFORE`, `SAME_CROSSLIST`.
- **Gate:** hard `REQUIRES` / `FORMAL_PREREQUISITE` and same-source `SAME_CROSSLIST` must be verified/approved with source-linked endpoints and remain acyclic. `RECOMMENDED_BEFORE` is not a university entry requirement and is separately checked for cycles.
- **Evidence:** per node/edge: original Notion URL, section, checkedOn, origin and review status. VI/EN aliases reuse one ID; concepts with similar surface words and different senses MUST NOT automatically merge. In particular UX question wording bias and DS selection bias are not necessarily identical.
- **Ownership/privacy:** these are shareable curated editorial references only. Learner attempts, review schedules and private progress stay exclusively with protected Step16/18 storage; do not ship any user ID, Google allowlist, diary, private semantic index or raw answer in public static manifests.

## Three worked slices — and what is still missing

1. **F09 Data Science:** existing lesson identities `L09-1-1` (editorial) and `L09-1-2` (PO-content-locked), candidate population/sample/selection-bias concepts. New semantic edges are `proposed`. The original frozen lesson is untouched. A separate source-course sample `UC Berkeley DATA 8` is attached to its distinct source programme/requirement, **not** forcibly mapped to a li. Course.
2. **F03 UX:** `L03-2-1` distinguishes taxonomy, hierarchy, navigation and content model. Candidate concepts taxonomy and navigation are separate; same term/language alias never conflates with route ownership.
3. **F15 Supply Chain:** `L15-2-1` qualifies simple historical averages, no-stockout assumptions and forecasting uncertainty. No cross-field `SAME_AS`, formal prerequisite or invented university degree assigned.

All three are **editorial samples**, not complete course coverage, 3/15 rollout, or a course graph with verified prerequisites. Cross-field relations can be proposed after CUR-03 evidence, never inferred from word similarity.

## Run / expected acceptance

```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
```

Node 22+ standard library only; `--check` passes when source-linked IDs, 3-field sample count, distinct source vs li. IDs, required institution/year fields, one-canonical-concept VI/EN aliases, endpoint matrix, no speculative hard prerequisite/crosslist, no orphan/cycle, and honest publication/rights/academic-coverage statuses are satisfied. The validator also runs 16 deliberately invalid graph mutations to confirm they are rejected. This checks **data integrity**, NOT actual academic correctness or physical UI.

**Next:** ONT-03B consumes this contract to fit L2-T01..T13 to methods, enactment, micropractice, independent challenge and K1/K3/K5; ONT-03C waits for CUR-01..04 verified breadth then populates actual course graph progressively. No edit to G2 design system, PR #127 shared ONT-01, app, database or released site.
