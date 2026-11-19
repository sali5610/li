# ONT-04B2b-1 · Publication-route authority and permission gating (source-only)

**Status: DRAFT, strict read-only contract and tests.** Actual 04B2b app rollout remains **Pending/Blocked**. Do **not** merge or deploy this PR. It does not invent new lesson IDs, create any navigable UI actions, allow Google sign-ins or alter Neon RLS.

## Current verified truths (November 19, 2026)

The existing native application has **three source-declared routes**:

| Canonical lesson | Native internal page | Markup source | Academic graph coverage | Release permission |
| --- | --- | --- | --- | --- |
| `L09-1-2` | `lessonL09` → `page-lessonL09` | `site/assets/lesson-l09-hifi-markup.js` | Exists in ONT-03A pilot, `publishState=review_only` | **Not granted** |
| `L03-1-2` | `lessonL03` → `page-lessonL03` | `site/assets/lesson-l03-hifi-markup.js` | Not in ONT-03A pilot | **Not granted** |
| `L15-2-2` | `lessonL15` → `page-lessonL15` | `site/assets/lesson-l15-hifi-markup.js` | Not in ONT-03A pilot | **Not granted** |

The three-page native route mapping comes from the `LI_LESSON_ROUTES` literal inside `site/index.html`, while real dynamic page markup has matching `id="page-..."` and `data-lesson-id="..."`. The fact that a route is rendered and the manuscript is content-locked **is not** permission to provide a Search "Open lesson" deep link. Old page comments saying "published route" are source-code comments, not release-authority proofs.

**New live-G3 clarification:** As of S198 in the [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5), the PO-approved **Google Auth-only pilot was manually uploaded successfully** to Cloudflare under the Free safeguards (GitHub manual deployment run #44540051214). However **0 accounts had verified email / Google linking / sessions at that post-deploy snapshot**, and no real invited-user/RLS cross-account proof was captured. The upload does NOT unblock a user-private Search route. The 30 internal release limit was retained, automatic Git previews already disabled by the PO. Do not revert to the superseded "no Auth pilot was deployed" claim from S195.

## What this package delivers

- [Source-audited candidate manifest](native-route-candidates.v0.1.json) with exact ID → legacy native route-key → dynamically created page ID → actual markup path, provenance, editorial status, rights, publication and permission *separate*.
- [Restricted JSON schema](route-audit.schema.json) with **no** `appUrl`, `openAction` or `publishProof` in this fixture; the keys explicitly hold `null`. It describes the data shape; the Node checker enforces semantic/source constraints and a set of deliberately invalid alterations.
- [Fail-closed route inspector](route-readiness.mjs) for offline Search-result diagnostics. It can report "native source code known", but it is **structurally incapable of granting navigation**. It never emits a link, route action or access token. Do not treat its status as a server access decision.
- [Source/graph validator](../../../tools/check_search_publication_routes.mjs): checks actual `site/index.html` and three lesson markup sources; exact ID/DOM mappings, non-duplicated route identities, source-version context and strict coverage. Checks ONT-03A pilot for the one reviewed lesson and avoids synthesizing missing L03/L15 records. Rejects spoofed publication, release URL, action, permissions, rights, account verification, new course coverage and source drift.

## Search / navigation rules

1. A typed result is **not** a lesson route. `SearchResult.id` identifies a curated knowledge object; `routeCandidate.canonicalLessonId` records a *code-level* observation only.
2. A route may be offered **only after** an independently approved immutable publication manifest names the canonical ID, UI route, source edition, rights grant, content approval and release decision, with a verified signature/trustworthy server enforcement. This demonstration defines no such manifest and **cannot open a route**.
3. Invite-only access must be checked by the server using a real authenticated account + verified email/provider linking + real Neon RLS; client booleans, query flags and `userId`/email typed in a browser **never grant access**.
4. On revoked rights, stale content, missing code or uncertain curricular ID, fail closed. A released route and private user-state read are **separate** authorizations; even a valid lesson route cannot return personal notes/progress without per-user RLS.
5. Do not confuse Wave1 content locks with an all-15-field authored curriculum. ONT-03C is PENDING. Auth-only upload and app search deployment are different products/gates.

## Reproduce source-only QA (no build)

```sh
node tools/validate_ontology.mjs --check
node tools/validate_academic_ontology.mjs --check
node tools/validate_pedagogy_ontology.mjs --check
node tools/test_offline_typed_search.mjs
node tools/check_search_publication_routes.mjs --check
```

This works without any new package, network call or paid API. It is **NOT** Safari/VoiceOver, a connected Google Auth proof, a backend permission evaluator, UX-DS-G2 approval, a deploy, full course population or real route-integrated Search. Parent ONT-04 remains in Backlog; ONT-04B2b actual rollout and ONT-04C remain pending.

**Next gated step:** Once Step16 real-account OAuth linking and A/B/C signed RLS pass plus ONT-02 visual/behavioral and Step16.2 parity, PO can review a *separate* authenticated routing adapter. Until then, keep the existing native Tra Cứu, 04B2a opt-in localhost bridge and Wave1 lesson screens unchanged. No new spend.

Evidence: [ONT-04](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927), [ONT-03C Pending](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43), [G3 state](https://app.notion.com/p/4196cf6db72a81379aaccba71303cb75).
