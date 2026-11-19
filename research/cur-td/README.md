# CUR-TD-06 — research-only learner export guard

This is an **isolated Node utility + synthetic test fixture**, NOT app integration, a public Notion importer, a live authenticated endpoint or a deployed security control. No teacher key, real Notion source ID, access token or unapproved manuscript is stored here.

Run locally: `node --test research/cur-td/learner-export.test.mjs` (Node >= 20). The library uses only `node:crypto` and exports `exportLearnerFromNotion` and `hashNotionBody`.

The **trusted editor-side** caller must supply: exact fetched Notion page response, `sourceId`, and an immutable reviewed manifest entry keyed by that page ID with a SHA-256 digest of the `<content>` body, approved `viStart`, `enStart`, `end` heading boundary strings, `version`, and `forbiddenFingerprints` for known exercise solutions. Never construct the manifest from user requests, Notion page prose, chat prompts or browser input. Unpinned/drifted/unknown sources and missing locale boundaries are denied. Nothing fetches Notion or writes files automatically.

Only the two allowlisted locale sections are returned. The return value intentionally contains no teacher page links, source metadata, answer solution, editorial footer or authorization state. Both output texts must still be rendered using a safe Markdown renderer with content sanitization; `researchOnly: true` and `published: false` are not auth gates.

**Known limits:** heuristics for answer fingerprints are not a semantic proof. Independent academic and bilingual human QA, actual Notion Share permissions/guest denial, signed invited-user identity, backend attempt-owner + committed-submit + content-version enforcement, no-store answer-key responses, browser bundle/PWA cache and replay checks are all NOT RUN. This module must not be bundled into the client or treated as a secure teacher-key store. Do not merge/publish before Human PO gate. Preserve original legacy lessons and CUR-04..07 decisions.

Evidence owner: Notion CUR-02W.5 and CUR-TD master plan. Reusable learning: LL-21. No Cloudflare, GitHub Pages or Neon dependency in this directory.

## CUR-TD-07 research compatibility check (2026-11-20)

The real Notion manuscripts use five different pairs of VI/EN headings, and four use editorial footer **line prefixes** rather than Markdown headings. The guard now supports a tightly enumerated set of allowed editorial-end prefixes; arbitrary non-heading boundaries still fail closed. The F09 sentence "Do not disclose independent answers" is harmless editorial wording, not a solved answer; direct `Independent answer:` values, answer keys and configured independent-case fingerprints remain denied.

Node 22 local smoke checks: `node --test research/cur-td/real-shape-smoke.test.mjs` = 16/16 PASS against **synthetic bodies shaped to match current five source headers**. Live Notion content hash+anchors were independently checked read-only in the Notion-connected research session (5/5 stable across two fetches); full source bodies and real Notion page IDs are **not** committed to this public repository. The signed editorial SHA-256 manifest remains in Notion, status RESEARCH-PINNED not publication approved. Do not substitute these shape fixtures for actual source import, teacher ACL, human VI/EN editorial review or browser/server tests. No PR, merge, production deployment or Neon changes.

## Research fixture confidentiality / release blocker

This GitHub repository is public. Test data MUST be **independent of actual teaching exercise solutions**, including synthetic-but-matching solved arithmetic. The current branch HEAD uses clearly fake sentinel strings; prior Git commit objects may remain retrievable even after editing a file. Do not assume retroactive erasure or answer secrecy. Before publishing the F15 exercise, rotate any overlapping assessment figures in the approved learner content and separately controlled teacher key, then redo conservation, locale parity, fingerprint and source SHA tests. This does NOT require changing protected canonical source lessons today.

This branch's current tests are docs-only/source-only and do not prove real invite identity, page ACL, backend evaluation, CI, or Cloudflare status. The 16-case local Node smoke test is grounded in synthetic *shapes* of five live Notion documents, not their raw bodies.
