# ONT-03B · Pedagogy / L2 × L3 ontology — spec, not runtime

> **STATUS: 03B draft contract + source-anchored fixtures.** Human PO approved staged ONT-03A/B/C; this is **NOT** deployment of an assessment engine, not proof of mastery or an academic release. [ONT-03 Notion](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43), [S145 mandatory method-fit](https://app.notion.com/p/41b6cf6db72a8131ab62e71c289a1916), [L2 library](https://app.notion.com/p/41a6cf6db72a81cdbb29f741a2ac84ec).

## Scope and sources

This branch is stacked on **ONT-03A Draft PR #128**, which is stacked on **ONT-01 Draft PR #127**. It adds **zero Design System/UI files**; ONT-02 owns that. Content remains in the canonical Notion manuscripts and lib. No tuition/paid runtime or external embeddings.

- `techniques.v0.2.json`: 13 existing L2-T01…T13 canonical identities, scientific names, task fit, avoid conditions and original library pointers; no new technique invented. T13 approved canonical v0.2.
- `method-fit.v0.1.json`: S145's primary+optional selections per sample lesson with **stable editorial application IDs**, distinct guided vs independent case keys and VI/EN-friendly conceptual descriptions. Nothing is auto-scored or posted to users.
- `demo.graph.v0.1.json`: curated-only typed nodes `TechniqueDefinition`, `TechniqueApplication`, `Micropractice`, `IndependentChallenge`, `Rubric`, `HintPolicy`, `RevealGate`. External references resolve only to actual ONT-03A `Lesson` + `LearningOutcome`.
- `registry.v0.1.json`: four **new** predicates only; inherits 39 ONT-01 kinds and all ONT-03A academic relations without touching either registry.
- `graph.schema.json`: static graph JSON Schema; runtime semantic constraints in zero-dependency Node validator.
- `private-learning-event.schema.json`: **logical contract only** for private owner-scoped events; contains no personal data, tokens, invitation emails or saved responses. DB security still requires Neon restrictive RLS, real identity/live tests and G3/Step16 approval.
- `tools/validate_pedagogy_ontology.mjs`: checks provenance/type, ID/alias, two-case separation, no-spoiler, progress gate, 13 stable methods, 1 primary + 0/1 optional; negative fixtures and pure synthetic metric evaluator.

## Canonical mappings (editorial, not production)

| Lesson (source) | Primary | Optional | Application ID | Status |
| --- | --- | --- | --- | --- |
| [L09-1-1 Population/Sample](https://app.notion.com/p/41b6cf6db72a8149b622ed4b789860fc) | T06 Compare–Contrast | T07 Premise Checking | `L09-1-1:l2-t06:p01` | Wave2 editorial, no deployment |
| [L03-2-1 UX Taxonomy](https://app.notion.com/p/41b6cf6db72a811e9646e73ace162250) | T06 Compare–Contrast | T10 Decomposition | `L03-2-1:l2-t06:p01` (pilot pointer) | Wave3 editorial, no deployment |
| [L15-2-1 Forecasting](https://app.notion.com/p/41b6cf6db72a815a9924c508b68f8b99) | T03 Worked Examples/Fading | T10 Decomposition | `L15-2-1:l2-t03:p01` | Wave2 editorial, no deployment |

`L03-2-1:l2-t06:p01` is a proposed structured pointer to the editor's existing practice, not an asserted published runtime ID. All three have **distinct** practice and independent case keys; a method guide is an optional explainer/practice entry, **not** a recorded success. Default flow: learner can skip choosing a technique → lesson study → optional method-specific **enacted** micropractice → independent fresh case → submit → solution reveal → optional actual delayed review.

## State model & evidence integrity

| Marker | Minimum real event to count as evidence | Never infer from |
| --- | --- | --- |
| K1 domain task evidence | Actual independent case submitted, judged with versioned rubric, outcome/case/source traced, record assistance separately | Guide opened, method chosen, worked example, claim considered "likely" |
| K2 method fit | Chosen/declined technique and task-appropriate rationale event (if recorded) | Mandatory method picker default |
| K3 executed technique | Real practice submission with nonempty, task-specific procedure evidence and expected actions checked; separately tag assisted | Read instruction, clicked Try, mere screen opening, copy/paste model without execution |
| K5 delayed recall evidence | Genuine later attempt after real due time, distinct form/case from initial item, rubric checked, unassisted status recorded | Scheduling alone, notification, same sitting, immediate retry, future timestamp |

**Explicit anti-spoiler invariants:** practice feedback remains hidden until the **micropractice** is submitted; independent solution remains hidden until the **independent assessment** itself is submitted. Guidance can be shown before independent submission but cannot include the answer. Hints and revealing keys affect independence and must be reflected in K1/K5 eligibility. Do not claim metric as cognitive improvement, calibrated proficiency, actual deployed measurement or domain academic accuracy.

### Machine-readable event shape

A stored user record must derive its owner identity from the authenticated session and enforce it with server-side RLS. `private-learning-event.schema.json` intentionally does not include or accept a client-submitted `ownerId`. All real attempts/events must be isolated per account in Dexie and remote RLS, revisioned/idempotent across devices, with delete/export/consent behavior aligned with Step16/18. This design does not read or migrate existing `li.review.L09-1-2.v1`, does not create a table and does not score anything in the shipped app.

### Acceptance, honest status

Local command on **PR review branch**:

```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
node tools/validate_pedagogy_ontology.mjs --check
```

This checks **static contract invariants** and pure in-memory test events. Academic method-fit literature, cross-field relationships, real learner efficacy, mobile/screen reader, runtime state/persistence, source/rights G4, source syllabus gate CUR-01..04, G2 and Neon security gates all remain unverified.

**Next:** ONT-03C incremental academic population under CUR top-down gates; ONT-04 typed lexical→graph search / Lão Lý only after reviewed concepts and method safety. No merge, app release, Neon DB migration, real learner data changes or new paid service.
