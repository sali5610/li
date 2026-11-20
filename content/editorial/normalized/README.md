# Canonical 17 bilingual manuscripts · Sectioned draft layer

**Status: 17/17 source-preserving drafts sectioned, 0 authorized for app publication.** Every normalized JSON retains the original VI/EN instructional headings and prose, grouped into learner sections (`goals`, `concept`, `guided`, `methods`, `independent`, `reflection`, `extension`) and an ordered six-stage Lão Lý source block. Where explicitly marked in the author source, independent *model answers* and method feedback are separated from their prompts and tagged `AFTER_VALID_INDEPENDENT_SUBMISSION` and `AFTER_MEANINGFUL_METHOD_ATTEMPT`.

- Source originals remain exclusively under [../imported/](../imported/). This is a **derived migration view**, not a second authoring CMS. Never edit Notion or manipulate generated public `site/content-packs` files.
- Current runtime renderer demands `editorial-structured-v1` with approved metadata. These new files use `editorial-sectioned-draft-v1`, and deliberately sit outside `content/lessons/`: **React cannot publish them until the missing interaction/source/rights gates are fulfilled**.
- Earlier import checks misclassified L09-2-1: the word “undefined” correctly describes P(A|B) with P(B)=0. Only L09-3-1 had two missing Lão Lý replies; they are now completed in the authoritative GitHub imported source and derived draft.
- Source text can include editorial keys, quotes and references. Not all external citations and illustrations are cleared for redistribution. Don't expose imported source, keys, or normalized drafts in the released lesson pack.
- 8 noncanonical research drafts retain their distinct source identities under `../imported/`; do not assign legacy lesson IDs without PO curriculum mapping. 114/135 old outline entries have no identified complete body.
- <code>index.v1.json</code> is the honest per-lesson status list. User attempts/progress remain in Neon/Dexie; **no database migration or deployment** happened here.

**Next practical value step:** implement a lesson-specific adapter for these sectioned structures and their actual L2 methods/independent question models inside the existing React learning journey, on a no-release branch; don't ask the PO to approve incomplete lessons.
