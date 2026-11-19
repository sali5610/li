# ONT-04B1 · React typed-search island (isolated research only)

> **Not a live app feature.** This is the first independently testable UI adapter for [ONT-04A lexical/typed search](../../docs/ontology/search/README.md), and intentionally does NOT merge into `site/index.html`, Step16 React L09 shells, app routing or any deployed screen. Stage ONT-04B full integration remains blocked by unmerged React/Design System (ONT-02)/Step22/privacy release gates.

## Dependency boundary

Reads the exact zero-dependency `docs/ontology/search/offline-search.mjs` (type declaration beside source) and existing 03A/03B plus tiny candidate fixtures by relative import; no copy/fork of ranking code. The standalone React 19/TypeScript/Vite build is a disposable reviewer preview, **not** a new approved platform or style. Existing Step16 React 19 and the canonical [Design Library](../../design-system/README.md) provided the technical patterns, without editing either codebase. Current **ONT-03C PENDING**, full ONT-04 Backlog.

## What is actually implemented

- Search form with visible/accessible name, explicit submit/Enter, clear, VI/EN labels, exact-ID/title/alias/one-typo retrieval from 04A, entity kind facet and opt-in candidate-review switch (off by default).
- Results have explicit entity kind, editorial/review and non-playable status, precise canonical ID, source section/date URL and explainable ranking reason. Only external HTTPS provenance link opens with `rel=noopener noreferrer`; **no app lesson route or implicit click-to-navigate**.
- 0–2-hop *reviewed* graph relationship panel with source path; never invent hard prerequisite from same Field, draft TEACHES, or incomplete institution syllabus.
- Output has polite `role=status`, semantic headings and buttons, native keyboard navigation, visible focus outlines, 48px touch target, icon-free words, 320–360px stacked reflow, iPad/desktop single-column width cap and reduced-motion rule.
- CSS references the existing generated `site/assets/design-tokens.css` (not edited) and uses existing token names. Any styling here is local/proposed, not ONT-02 done or PO G2 signoff.
- No private user query persistence, no fetch, Neon, app events, session, model, embeddings, answer keys or performance/learning analytics. All sample data are checked-in demo.

## Run in isolation (not on production site)

```sh
cd tools/ont04b-react-search-island
npm install --no-audit --no-fund
npm run build
npm run test:ci
npm run dev
```

`vite` local dev server binds only `127.0.0.1`. Test environment is jsdom: behavior and accessible DOM attributes are checked; NOT real Safari iPhone/iPad/VoiceOver manual QA or a physical-device WCAG audit. No Cloudflare build is triggered by PR workflow.

## What remains

- **ONT-04B2** after the separate React/ONT-02 lanes settle: use an approved navigation surface and actual publication-route manifest, preserve current native→React one-writer and handoff, and render real responsive app.
- **ONT-04C** contextual Lão Lý, lesson permissions, anti-spoiler and source rebuttals still waits Step16/22 and real user isolation tests.
- **ONT-03C** stays PENDING until CUR-TD academic programme/source-course gates; 45/135 IDs from S37 are candidate reservations, never a proxy for reviewed content.
- User must explicitly approve any production release and major visual change; this branch is unmerged draft. No extra paid spend.

Related Notion: [ONT-04](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927), [ONT-03](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43), [UX-DS-35](https://app.notion.com/p/41d6cf6db72a81d48ffdc4a38de4cec0), [Step15 G2](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1).
