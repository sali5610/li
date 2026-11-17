# W2-QA-02 · Quote-bank exceptions & Lão Lý release checklist

**Status:** source-backed editorial patch proposal, **NOT** an approval to modify the shared `site/assets/laoly-quotes-s121.js`, Wave1 PO-locked content, or deploy Wave2. Date: 2026-11-18. Zero paid cost.

## A. Exact live bank inspection

Read the default-branch `site/assets/laoly-quotes-s121.js` directly on 2026-11-18 (blob SHA `71cbf574858d81c75e1c02204848e4d990da3219`). There are **24 quote objects**, each storing `id`, `original`, `gloss`, `meta`, `url`, `lang`, `tags`, `comment`. The current UI explicitly displays **"Diễn nghĩa"**, which should be kept distinct from a literal translation or edition-verified original. Existing quote texts remain unchanged by this branch.

## B. Three supported, decision-ready errata

### B1 — `analects-peers`: **edition-bound numbering**

- Current production `meta`: “Khổng Tử · Luận Ngữ, Thuật Nhi 7.22”; production link: https://zh.wikisource.org/zh-hant/論語/述而第七.
- That exact linked Wikisource edition labels the quotation **七之二一 = 7.21** and labels the NEXT statement **七之二二 = 7.22**: see https://zh.wikisource.org/zh-hant/論語/述而第七.
- Some other editorial sequences number this same saying **7.22**: see https://confucius.page/analects-7-22/ . Do not claim 7.21 is universal; **the app's source link and displayed edition number must match**.
- **Suggested future production metadata** if the app continues to link Wikisource: `Khổng Tử · Luận Ngữ, Thuật Nhi 7.21 (theo bản Wikisource được dẫn)`. Keep exact `original`, `gloss`, `url`, `id`, and user progress stable.
- Alternatively keep standard 7.22 but link a 7.22-numbered edition and explicitly identify its source; do not mix editions.

### B2 — `box-models`: **source precision and literal vs gloss**

- Bank `original` matches the phrase documented on p.424 of the **co-authored** Box & Draper (1987), *Empirical Model-Building and Response Surfaces*. The readable SAS statistical research audit [Rick Wicklin, 2025-04-02](https://blogs.sas.com/content/iml/2025/04/02/all-models-are-wrong.html) reproduces the passage and identifies p.424. This **is NOT direct access to the whole book**. A shorter earlier Box publication dates to 1979, not to a verbatim full 1976 phrase.
- **Suggested future `meta`**: `George E. P. Box · in Box & Draper, Empirical Model-Building and Response Surfaces (Wiley, 1987), p. 424`. This distinguishes speaker attribution from co-authorship of the cited book.
- **Suggested future additional editorial fields:** `sourceEvidenceURL` (SAS page), `verificationLevel = "published-page-excerpt"`, `translationVI = "Về cơ bản, mọi mô hình đều sai, nhưng một số vẫn hữu ích."`, `interpretationVI = "Mô hình đơn giản hóa thực tại; hữu ích hay không còn tùy giả định, kiểm nghiệm và mục tiêu."`, `contextScope = "statistical approximation, NOT a proof that any UX dashboard or forecast is good"`.
- Keep the current `original`, ID and existing explanatory `gloss` until the schema/display and metadata are reviewed. The MacTutor attribution page https://mathshistory.st-andrews.ac.uk/Biographies/Box/quotations/ remains a secondary pointer.

### B3 — link/translation-right exceptions

- `epictetus-appearance`: exact present English text appears in [Project Gutenberg §I](https://www.gutenberg.org/files/45109/45109-h/45109-h.htm), whose title page credits English translator Thomas W. Higginson. This is **an English translation**, not independently verified ancient Greek wording. The linked Gutenberg edition includes a publisher copyright notice; **text accessibility does not independently resolve jurisdictional reuse rights or imply the entire modern edition can be republished**. Editorial candidate: source URL replacement only after verifying original bank-linked Wikisource URL and final rights scope.
- `woolf-room`: matching clause is directly visible in [Project Gutenberg Australia, ch. I](https://www.gutenberg.net.au/ebooks02/0200791h.html), where Woolf introduces it as **her argued opinion**, not scientifically proven law. Existing bank-linked Wikisource Hogarth-1929 URL was previously inaccessible to the research viewer; do not infer that a cache miss means the text is false. Alternative link needs license/jurisdiction review.
- `seneca-time` and `darwin-confidence` are **sentence fragments**; display as fragments or explicitly indicate ellipsis, not fabricate a full independent sentence. Original Latin and translation editions need separate specialist QA.
- Full origin/language/translation checks for all 24 quotes were previously documented in the project's S137/S138 audits. **23/24 source-text matching count is not 23/24 accepted translations nor 24/24 rights approvals**.

## C. Runtime quote-choice bug candidate — **NOT fixed here**

Current engine:
```js
const pool = Array.isArray(ctx.quoteIds) && ctx.quoteIds.length
  ? QUOTES.filter(q => ctx.quoteIds.includes(q.id))
  : matchList(ctx);
const selected = (notRecent.length ? notRecent : available)[0];
```
`QUOTES.filter()` preserves the global source-bank order. It **does not preserve** the contextual `ctx.quoteIds` list order. Thus a lesson-stage editorial **primary / alternate 1 / alternate 2** priority might be ignored when the desired primary occurs later in the global bank. The recent-quote skip can further change which item is first. This is a source-inspected *potential behavioral mismatch*, not a real-device runtime reproduction or claim that the current approved Wave1 routes are broken.

**Minimum release acceptance:**
1. Test `ctx.quoteIds` with permutations of three valid IDs; first attempt should prefer the explicitly designated primary when not recently shown, while a repeat avoids recent quote under an intentional policy.
2. **Design whether "primary" means "must show" or "first choice subject to rotation"** before implementation; never randomly show an ill-fit quote merely to diversify content.
3. Preserve existing ID/persistence and VI gloss/source links; don't silently rewrite L1/Wave1 locked dialogue. Add source-link / quote text unit tests for B1/B2 and safe fallback when an ID is missing.
4. Demo each of six stages × six Wave2 lessons, in both locales, with visible exact quote/gloss/attribution/context and no pre-submit spoiler.
5. Actual iPhone/VoiceOver and signed quote-right review remain separate.

## D. Release gate

| Component | Current status |
| --- | --- |
| Box/Wikisource/Gutenberg exact-source clarification | Verified and documented |
| Production quote-bank metadata and schema patch | **NOT APPLIED — Human PO/rollback gate** |
| Lão Lý quote selection behavior | **Source inspection found risk; runtime test/fix OPEN** |
| VI/EN four-clock SVG prototype | **4 editable source files on review branch, NOT deployed** |
| Source/figure rights + UI QA, G2/G3/G4/QA28 | OPEN |
| Wave1 original lesson content | LOCKED / untouched |
| Wave2 6 bilingual drafts | Notion only, 0/6 PO content approved / 0/6 deployed |
