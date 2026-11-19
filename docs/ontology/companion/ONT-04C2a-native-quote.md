# ONT-04C2a · Native Lão Lý quote stage/feedback guard (draft code only)

> **Not deployed.** Existing native `site/assets/laoly-quotes-s121.js` is now guarded in a DRAFT stacked GitHub branch, with a real source-level `site/index.html` script-order update. A localhost/manual reviewer preview may be built later only through an authorized gate; this PR does **not** upload/merge/build the Cloudflare production site.

## Scope and PO-approved rule

- The PO's [S205 personal/invite-only decision](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5): quote **reuse/copyright/translation-territory clearance is NOT a product blocker**. This is an explicit product scope, not a legal-exemption claim. No new approval process or research for licensing.
- Keep attribution/source metadata sanity (`id`, original, translation, cited author and HTTPS link); academic source authenticity still needs independent editorial checks. Quotes remain cultural/editorial commentary, not scientific evidence.
- Only modify the quote engine display behavior and load order, **not** the 24-item quote bank, 24 EN glosses, the three locked Wave1 companion JSON files, lesson lesson-answer code, S112 Lão Lý conversation content, Design System, Neon, Auth, or search route permission.

## What changes in actual source

1. `site/assets/laoly-quote-stage-gate.js` exports `window.liQuoteStageGate.evaluate` as a *deterministic synchronous* UI policy. On ordinary non-assessment screens, legitimate S121 cultural quote cards remain eligible. On the three Wave1 native lesson routes, the trusted-in-app companion stage must be present, and **only `opening`, `concept`, `guided`** are eligible.
2. `independent`, `reflection`, `extension` are always suppressed (whether or not localStorage claims an attempt was submitted); generic unstaged `lesson` and `case` screens also suppress so an unknown assessment stage cannot silently receive a quote. Absent or mismatched companion/quote ID metadata is fail-closed.
3. Calm mode, buddy-debate, and *visible lesson hint/guided hint, feedback, answer and rubric surfaces* suppress the card. Existing `liLessonCompanion.getContext()` supplies the active lesson stage; never trust a client-supplied `submitted` Boolean or inspect learner answer content.
4. The legacy `pick` function and `render` function check the live gate before selecting/text insertion. On suppression the old DOM fields (original/VI-EN translation/commentary/author/source link) are **cleared**, not merely hidden. Scroll, resize and click events also suppress **already visible** quotes if the stage/feedback changes. No new UI card or script-driven route is added.
5. The new script loads before S121 in `site/index.html`. If missing, the quote engine **fails closed**, not "try to display anyway." Stage gate uses source-only data and no cookies, login, localStorage progress, Neon, LLM, embeddings or paid service.

## Test evidence and limitations

```bash
node tools/check_companion_quote_safety.mjs --check
node tools/check_laoly_quote_runtime_gate.mjs --check
```

The second test uses Node's builtin `vm` to **execute the actual S121 browser quote renderer** plus the new stage gate against synthetic DOM nodes. It verifies the three **real Wave1 manifest JSONs** (3 lessons × six stages × two locales = 36 cases), safe display of 18 pre-assessment cases, suppression and DOM scrubbing of 18 assessment/post-submit cases, plus negative scenarios for wrong/missing stage, missing companion, spoofed selection, feedback/hint, calm/debate and source metadata. No end-user data, actual native site build, browser click-flow or deployed page is involved.

**Remaining ONT-04C2b:** True iPhone/iPad Safari, real browser focus/VoiceOver, quote context correctness on Wave1 UX screen and Lão Lý S112, submission states, actual Google-only invite/RLS signed privacy (needed for personal learner context only), visual G2 and release authorization. This PR does **not** assert original S121 quote authenticity verified quote-by-quote, or that the fix is live. ONT-03C remains Pending. Cost 0đ.

Related: [ONT-04](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927), [ONT-04C1b](https://app.notion.com/p/41d6cf6db72a81f2ba2dfe4b99377002).
