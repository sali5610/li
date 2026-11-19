# CUR-TD-06 — research-only learner export guard

This is an **isolated Node utility + synthetic test fixture**, NOT app integration, a public Notion importer, a live authenticated endpoint or a deployed security control. No teacher key, real Notion source ID, access token or unapproved manuscript is stored here.

Run locally: `node --test research/cur-td/learner-export.test.mjs` (Node >= 20). The library uses only `node:crypto` and exports `exportLearnerFromNotion` and `hashNotionBody`.

The **trusted editor-side** caller must supply: exact fetched Notion page response, `sourceId`, and an immutable reviewed manifest entry keyed by that page ID with a SHA-256 digest of the `<content>` body, approved `viStart`, `enStart`, `end` heading boundary strings, `version`, and `forbiddenFingerprints` for known exercise solutions. Never construct the manifest from user requests, Notion page prose, chat prompts or browser input. Unpinned/drifted/unknown sources and missing locale boundaries are denied. Nothing fetches Notion or writes files automatically.

Only the two allowlisted locale sections are returned. The return value intentionally contains no teacher page links, source metadata, answer solution, editorial footer or authorization state. Both output texts must still be rendered using a safe Markdown renderer with content sanitization; `researchOnly: true` and `published: false` are not auth gates.

**Known limits:** heuristics for answer fingerprints are not a semantic proof. Independent academic and bilingual human QA, actual Notion Share permissions/guest denial, signed invited-user identity, backend attempt-owner + committed-submit + content-version enforcement, no-store answer-key responses, browser bundle/PWA cache and replay checks are all NOT RUN. This module must not be bundled into the client or treated as a secure teacher-key store. Do not merge/publish before Human PO gate. Preserve original legacy lessons and CUR-04..07 decisions.

Evidence owner: Notion CUR-02W.5 and CUR-TD master plan. Reusable learning: LL-21. No Cloudflare, GitHub Pages or Neon dependency in this directory.
