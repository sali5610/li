# ONT-01 · li. shared typed ontology contract v0.1

> **Human PO approved architectural direction (2026-11-19), schema & fixtures in draft review only.** This is NOT an app feature, G2 signoff, a knowledge-mastery model, an RLS security implementation or authorization to deploy/migrate. See [Notion ONT-01](https://app.notion.com/p/41d6cf6db72a81188986ed5f65d17a5e) and [S183 architecture](https://app.notion.com/p/41d6cf6db72a81f59573fb0e5ed6836e).

## Source hierarchy

- Decisions/approval: Notion Hub, Latest Handoff, S183, S145 and newest PO instructions; source editorial content remains in its Notion page.
- Static UI behavior: [Design Library canonical entrypoint](../../design-system/README.md) and owned component/pattern/token files; this ontology does **not** replace those contracts.
- Implemented runtime: GitHub `main` only after authorized merge and release; this branch is unmerged.
- Private learning data: user's owner-bound Dexie/Neon state (Step16), excluded from public manifests. This document does not grant or prove database permissions.

## Data dictionary / files

| Artifact | Contract | Authority |
| --- | --- | --- |
| [registry.v0.1.json](registry.v0.1.json) | Kinds, domains, typed predicates, endpoint matrix, review/publish/visibility/evidence states, ID policy | ONT-01 draft typed registry |
| [graph.schema.json](graph.schema.json) | JSON Schema Draft 2020-12 shape for static demo graph | ONT-01 draft schema; semantic constraints in validator |
| [ontology-types.ts](ontology-types.ts) | Generated read-only TypeScript unions/interfaces | Generated from registry via Node tool |
| [demo.graph.v0.1.json](demo.graph.v0.1.json) | Source-linked L09 and Button/ActionGroup examples with honest draft/PO-locked status | Illustrative graph, NOT production corpus |
| [validate_ontology.mjs](../../tools/validate_ontology.mjs) | Zero-dependency runtime checks and negative fixtures | PR-only contract validator |

### Namespaces & immutable identities

`lesson:L09-1-1`, `lesson:L09-1-2`, and `technique:L2-T06` refer to *existing* canonical product IDs. Namespace prefixes do not alter the original source identifiers or make new lessons. The `concept:ont01:*`, `application:ont01:*`, `gate:ONT01:*` examples are **new unapproved candidate IDs** until reviewed and promoted by a later explicit process. A VI/EN title or alias never creates a second canonical learning record.

Review state `proposed|verified|approved|rejected|superseded` is **independent** from content publish state `draft|review_only|published|suspended|retired|not_applicable`. `verified` means source mapping was observed, **not** a credential, scientific effect or live execution claim. `published` requires reviewed content/rights; concept indexing alone cannot publish a lesson. Each node and edge carries an inspectable, pinned source URL/section, checked-on date, evidence type and version (nodes).

### Relation intent & topology

- `IS_A`: concept taxonomy. `PART_OF`: **only** Field→Group, Course→Field, Lesson→Course, Chapter→Lesson. F/I/A are progression metadata, not obligatory extra routes.
- `REQUIRES`: **hard academic prerequisite** reviewed by domain/source; related lessons are not automatically prerequisites. Cycle rejection mandatory. `CONTRASTS_WITH` and `RELATED_TO` are symmetric; reverse duplicates rejected.
- `TEACHES`, `AIMS_AT`, `SUPPORTED_BY`: concept/outcome/claim-to-exact-source edition, **not** proof that the editor's manuscript was independently peer-reviewed.
- `USES_METHOD` → `INSTANTIATES_METHOD` → `ASSESSES_METHOD`: optional method fit and actual enacted practice. S145 keeps K1 task correctness separate from K3 technique execution and K5 real delayed retest. Never award mastery when guide is opened.
- `USES_TOKEN`, `HAS_SLOT`, `FILLS_SLOT`, `USES_PATTERN`, `CONSTRAINS`, `VALIDATES`: **UI graph proposal** only until ONT-02 verifies component source, actual slot/state/API, responsive/accessibility, and executable enforcement.
- `ASSISTS_WITH`, `OFFERS_ACTION`: companion contextual aid; no automatic LLM or permission to reveal independent answers. `SUPERSEDES`: specific dated decision precedence, not global deletion of history.

## Two reference paths

**Learning (existing references + proposed edges):** `lesson:L09-1-1` → `USES_METHOD` → `application:ont01:L09-1-1:l2-t06:p01` → `INSTANTIATES_METHOD` → `technique:L2-T06`. A distinct `Micropractice` has `ASSESSES_METHOD` and an `IndependentChallenge` has `ASSESSES_OUTCOME`. These describe **S145 editorial structure**, not a working runtime or tested learner ability. L09-1-2 has a documented distinction between sampling bias and random sampling variation; its new concept IDs and graph binding remain `proposed`, while its approved *content* is not rewritten.

**UI:** `screen:lesson:L09-1-2` → `USES_PATTERN` → `pattern:LearningActionArea` → `HAS_SLOT` → `slot:LearningActionArea:primary` ← `FILLS_SLOT` ← `component:Button`; `UIRule` → `CONSTRAINS` → pattern and `QAGate` → `VALIDATES` → rule. This is a behavior-modeling specimen, **not** proof a React ActionGroup exists in current app.

## Validator & regression

Run locally with Node 20+ (no paid runtime, dependency install, network or database):
```sh
node tools/validate_ontology.mjs --check
node tools/validate_ontology.mjs --emit-types > docs/ontology/ontology-types.ts
```
`--check` verifies stable IDs, version consistency, registered endpoint types, provenance/evidence, rights/review/publish state, no dangling or orphan links, no duplicate aliases within one node kind and locale, no symmetric reverse duplicate, no forbidden PART_OF pair, no illegal private nodes and no cycles across PART_OF, IS_A, REQUIRES, SUPERSEDES. Negative cases are executable self-tests. Cross-kind ambiguous search aliases are allowed and must be disambiguated by ONT-04.

The schema is a shape contract; semantic and graph-level checks are executed by Node because JSON Schema alone cannot inspect graph topology. The proposed PR workflow runs **only** this validator on ontology-file pull requests. It does not run Cloudflare release, build/deploy, fetch credentials or touch Neon.

## Security and lifecycle boundaries

- Static demo intentionally has **zero real learner/attempt nodes**, secrets, emails or account IDs. Learner/Attempt/EVIDENCES are registry definitions for future owner-scoped data; **do not** write them to public JSON or conflate graph constraints with Neon RLS authorization.
- Source edition, rights and QA gate must be checked before any content becomes playable; stale/withdrawn sources must not result in fake available lessons or deleted historical attempts.
- ONT-02 owns real React component rules; ONT-03 owns detailed academic and L2/L3 graph review; ONT-04 owns public search and buddy query semantics; ONT-05 is optional after measured retrieval gain.
- No PII, private diary, JWT, Google invitation allowlist, DB migration, graph service or embedding index is created as part of ONT-01.

## Review checklist

- [x] Existing canonical L09/L2 identifiers preserved in demo
- [x] Public graph and private learner evidence separated in typed registry
- [x] Semantic endpoint matrix, cycle & alias policy present
- [x] Explicit source/section provenance on every specimen
- [x] Machine-readable schema, generated TS types, negative fixture runner authored
- [ ] Hosted GitHub PR CI evidence (fill actual run ID after workflow finishes)
- [ ] Academic / Design owner review of **new proposed** edges and slot names (ONT-02/03), G2 and live Step16 privacy QA remain separate
