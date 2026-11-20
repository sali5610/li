# L09-1-1 · canonical-structure editorial lesson (NOT RELEASED)

**Status:** `draft` / `proposed` / `editorialStatus:draft` — the exact Wave2A first-party learning sections are now in **one** [canonical Lesson JSON](L09-1-1.lesson.v1.json). All 8 localized content sections, the independent 4 questions, after-submit model answers, rubric and optional T06/T07 prompts/feedback are copied without rewriting. `locked-structured-v1` identifies the shared data FORMAT, not a PO content lock or release approval.

**Stable identity:** L09-1-1 → C09-1 → F09 → mathematics. This editorial version preserves the learner's 4-level catalog outline but does not become a selectable/visible lesson. The earlier full CMS pilot source Git blob `75475cc365aaa15543af43d8c0d52b79bf48086c` remains available in Git history and [historical source branch](https://github.com/sali5610/li/blob/content/wave2-l0911-cms-offline-20261118/docs/editorial/wave2-cms-l0911/L09-1-1.cms.v1.staging.json), not duplicated as a second current content file. Original [Notion manuscript](https://app.notion.com/p/41b6cf6db72a8149b622ed4b789860fc) is provenance only.

## Scoped source/rights disposition

| Scope | Decision | Evidence |
|---|---|---|
| First-party teaching narrative, fictional examples and four independent questions | Retained unchanged VI/EN | Source section equality against the former CMS blob at migration; all instances still marked draft |
| OpenStax §1.1 / §1.2 | External citations/reference links only. No book text, book figures or book exercises incorporated | [Official reuse request](https://riceuniversity.tfaforms.net/52) distinguishes allowed teaching from commercial/other reuse; individual textbook licenses govern copying |
| USNA statistical data types | Reference link; nominal numeric-looking ID vs ordinal individual response supported; not expert endorsement | [USNA course notes](https://www.usna.edu/Users/cs/roche/courses/s24sd212/units/stattype/) |
| NIST population/sample | Reference link, not copied content | [NIST](https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc134.htm) |
| External population-vs-sample image by Loneshieling | **Not included** in learner-facing canonical payload. Historical Commons pilot lists [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Population_versus_sample_(statistics).png). No image redistribution, attribution UI or mobile-fit blocker for this text-only draft | [Commons file](https://commons.wikimedia.org/wiki/File:Population_versus_sample_(statistics).png) |
| Lão Lý quote/companion bank | **Not included**. Existing unreviewed quote rights and translation can't slip into lesson packs | Historical editorial branch only |
| Statistics specialist peer-review | **OPEN**: confirm treatment of a single 1–5 ordinal satisfaction item and scope of inferential limitations before academic approval | First-party draft; sources above do not equal sign-off |
| Product release/owner approval | **OPEN**: integration and publication are separate. There is no new lesson route, no student data migration and no implied Wave2 web-release authorization | `reviewState:proposed`, `publishState:draft`, `editorialStatus:draft` |

4 targeted editorial decisions, not a blanket rights clearance. No images, quote metadata or third-party exercise binaries copied into the review payload.

## Integration boundary
- **Source of truth** for this one draft: `content/editorial/L09-1-1.lesson.v1.json`; no current duplicate CMS.
- The course pack generator deliberately reads only `content/lessons/*.json`. Do NOT move this document there or change catalog `published` flags until the academic + PO release gates are satisfied.
- Concept IDs `concept:wave2:population-and-sample` and `concept:wave2:variable-types` are **editorial proposed anchors**, not yet released graph concepts. No speculative prerequisite to L09-1-2.
- Previously passed [offline 58 Node + 25 in-memory Chromium cases](https://app.notion.com/p/41c6cf6db72a8174b46dc2983c1ee1b9) are historical evidence for the old preview implementation, not tests on this current app. No repeated QA gate or separate test environment.
- When gates close, reuse the existing signed-in React learner experience (learn → practice → feedback → progress), not the isolated 2026-11-18 HTML pilot. Do not claim automatic written-answer grading, delayed memory retention or secure client-side answer secrecy.

**Next one useful step:** A focused statistics/source sign-off on this authored teaching slice and PO approval to expose L09-1-1 in the common app's existing learning flow. No new course taxonomy, CMS framework or off-branch web deployment.
