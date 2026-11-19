# ONT-04C1 · Lão Lý deterministic contextual contract (offline draft only)

> **No live AI, no private learner data, no app changes, no deployment.** This is a *read-only* source-bounded companion decision table, built on the existing approved Lão Lý personality (not legacy Cụ Lâm), six-stage S125/S145 teaching plan, Wave1 companion manifests and ONT-03A/03B source-linked graphs.

## Baseline and scope

- [S183 PO-approved ontology direction](https://app.notion.com/p/41d6cf6db72a81f59573fb0e5ed6836e) describes route, canonical entity, concept, six teaching stages, source, locale, permissions and 1–3 safe actions. It does **not** approve navigating from unpublished content.
- [S145 no-spoiler / L3×L2](https://app.notion.com/p/41b6cf6db72a8131ab62e71c289a1916) requires separate guided micropractice and independent challenge, **reflection after an actual trusted submission**, VI/EN parity, no K1/K3/K5 from opening a guide.
- [S76 Lão Lý identity/voice](https://app.notion.com/p/41b6cf6db72a8190b542daed8017d949): Lão Lý as fallible, curious, rebuttable scholar. No anthropomorphic omniscience or automatic attribution of unreviewed classical quotations. Notional quote suggestions are WITHHELD until rights and relevance are checked.
- [S105 contextual 12-screen companion](https://app.notion.com/p/41b6cf6db72a81599d56fa86988d86f4): the **existing** deterministic `site/assets/laoly-context-s112.js` can read local UI state and perform native actions. This ONT-04C1 pilot is **deliberately separate** and does *not* replace its 12-screen logic, save handlers, or read the current native UI state.
- [ONT-04B2b route audit](../search/routes/README.md): three source-declared Wave1 native page routes do **not** equal approval to navigate from Search or confirmation of invited-user access. G3 Auth-only pilot was uploaded in S198 but source diagnosis S199 confirmed Google sign-in bounced back without a linked account or session; real verified email and Neon A/B/C RLS still OPEN.

## Source-grounded pilot

| Lesson | Source present | State | Method |
| --- | --- | --- | --- |
| `L09-1-2` Sampling Bias | `site/lessons/companion/L09-1-2.json` | Wave1 content-locked/UI review, NOT a released publication grant | NONE asserted |
| `L03-1-2` UX Interview Bias | `site/lessons/companion/L03-1-2.json` | Wave1 content-locked/UI review, NOT indexed as ONT-03A published lesson | NONE asserted |
| `L15-2-2` Supply Reorder Points | `site/lessons/companion/L15-2-2.json` | Wave1 content-locked/UI review; NOT indexed as ONT-03A published lesson | NONE asserted |
| `L09-1-1` Population/Sample | ONT-03A academic + ONT-03B method-fit / [Notion editorial](https://app.notion.com/p/41b6cf6db72a8149b622ed4b789860fc) | Unreleased editorial draft; no Wave1 companion manifest invented | **T06** only as a proposed editorial pointer when `reviewProposals=true` |

The three real Wave1 companion JSONs each contain the six canonical `opening → concept → guided → independent → reflection → extension` stage IDs in both languages. The static resolver **does not ingest or reuse their stage reply text** because the on-device companion's source manifests include post-submission material. The source-checker confirms their existence and parity but the new responses are authored safe generic *prompts* only.

## Contract and security boundaries

- `request.schema.json` and [resolver](offline-context.mjs) accept **only** `lessonId`, `locale` (`vi`/`en`), `stage` and optional Boolean `reviewProposals`. Any extra key, private learner answer, attempt, emailed identity, hint count, JWT, role or `submitted` flag is **rejected before being used or logged**. This offline prototype intentionally does NOT model trusted private context snapshots.
- Source metadata is editorial provenance, explicitly **not** independently verified academic truth. Proposed concepts and cross-field graph claims aren't promoted to confirmed facts or prerequisites. Only curated canonical ID and field identity are carried.
- Six stages exist, but only the first four return 1–2 **non-executable** reflective prompt actions. `reflection` and `extension` return **zero actions** and no answer because the client cannot prove a real completed, owner-scoped independent attempt. Even a forged `submitted` input is rejected rather than unlocking.
- `EXPLORE_METHOD_DEFINITION` appears as a third **non-executable** editorial action only for `L09-1-1` in guided stage with explicit reviewer proposal mode and source-confirmed `L2-T06`. It cannot count a method executed, open an unapproved route, write a score, read a progress table or fetch L2 text.
- The output has hard-coded negative permission invariants `canNavigate`, `canReadPrivate`, `canRevealAnswer`, `canGrade`, `canSave`, `contentPublished`, `verifiedSubmission` = **false**. Every action `handler=null`, `target=null`, `executable=false`, no raw answer keys in templates.
- There is **no** retrieval or LLM API and no new installation/dependency. Do not pass raw Notion lesson text, private Dexie/Neon records, OAuth invites or copied unsent responses to a public static graph or remote model. The approved voice is presented as *bounded question prompts*, not automatic academic advice.

## Run QA locally

```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
node tools/validate_pedagogy_ontology.mjs --check
node tools/test_offline_typed_search.mjs
node tools/check_search_publication_routes.mjs --check
node tools/check_companion_context.mjs --check
```

The validator cross-checks the actual Wave1 manifest JSONs, the source-route audit, ONT-03A/03B source state and 13 L2 definitions. It tests all **4 lesson × 6 stage × 2 locale = 48** combinations, verifies VI/EN intent parity, gates all post-submit stages, and challenges private-field injection, forged source routes and method-fit misuse. This is static contract QA, not browser/Safari/VoiceOver QA or real learner-submission authentication.

## What is still pending

**04C2**: after Step16 signed Google Auth + Neon RLS A/B/C, decide a *trusted-server authenticated* context adapter (never a client boolean for `submitted`). Integrate with existing 12-screen S112 buddy actions and L3 Wave1 source manifests only after real ownership/source/rights gates and human G2/release approval. Validate anti-spoiler with actual fresh independent case, source consistency and bilingual accessibility. No fake post-submit score.

**04B2b** live Search routes remain blocked behind approved versioned publication manifest; **ONT-03C** still Pending because CUR-TD entire programme inventory is incomplete. Design System ONT-02 in separate chat. All linked PRs are draft; no merge, migration, Cloudflare build/deploy or paid AI. +0 VND.
