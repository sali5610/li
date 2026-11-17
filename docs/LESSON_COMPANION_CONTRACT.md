# li. · Mandatory Lesson–Lão Lý Content Contract · S125

**Effective immediately for all future lesson content batches.** Content review and release are not complete unless each native Hi-Fi lesson has a matching lesson-specific Lão Lý companion manifest. Notion owns editorial decisions; GitHub owns code/assets.

## Applies to

Every \`site/assets/lesson-*-hifi-markup.js\` native lesson module, plus its paired \`lesson-*-hifi.js\` logic and any legacy URL \`site/lessons/L*.html\` redirect. The live lesson now lives in the main app (\`?lesson=L09-1-2\`), **not** the old standalone review page. The old \`page-lesson\` stub is a legacy placeholder, not the canonical reviewed lesson.

## Mandatory content package per lesson ID

1. **Read the real full lesson first** (objectives, explanations, examples, independent attempt, rubric, references). Do not compose from its title, URL or syllabus alone.
2. Ship \`site/lessons/companion/<lesson_id>.json\`, \`schema:1\`. Six **distinct** learning moments and their real page anchor IDs are required: \`opening\`, \`concept\`, \`guided\`, \`independent\`, \`reflection\`, \`extension\`.
3. Each moment has a relevant introductory Lão Lý prompt + **two different, useful actions with responses** in both VI/EN, plus brief lesson-specific interpretation. Tone: witty, sophisticated, learner-safe, no fake scholarship, no raw internal method codes instead of names.
4. At least **3 verified, context-relevant quote IDs per moment** and 6 or more distinct IDs across the lesson, all present in \`site/assets/laoly-quotes-s121.js\` with original text, source and rights provenance. Include \`relevance\` explaining specifically why the primary quote fits. Rotation may use only this vetted set; do not select random quotes from an unrelated discipline. If no appropriate source is available, add and verify it first or keep the editorial gate open—**never fabricate or misattribute**.
5. **Spoiler safety**: \`independent\` only asks metacognitive questions or generic hint structures. No model answer, solved conclusion, grading or rubric score before the learner submits. \`reflection\` must be locked until the existing lesson \`state.submitted\` becomes true. The companion never writes or changes the actual learning progress.
6. Integrate into the **existing Lão Lý popup and floating avatar**, not a second competing dialog. Include \`data-lesson-id\`, \`data-companion-manifest\` in the native lesson root, and a sidebar “Hỏi Lão Lý theo mục đang học” entrypoint. The shared \`lesson-companion-native.js\` inspects the visible lesson section, supplies conversation actions, and restricts quote rotation to the candidate set.
7. Keep the bilingual experience coherent. Original quotations, explanatory gloss and Lão Lý commentary are labeled separately. Academic facts/quotes require source traceability. Show uncertainty rather than invent evidence.

## Hard publish gate (automated)

\`python3 tools/validate_site.py\` runs \`tools/validate_lesson_companions.py\` for **all** \`site/assets/lesson-*-hifi-markup.js\` routes. GitHub Pages checks fail on missing manifest; lesson ID/anchor mismatch; fewer than six moments; missing VI/EN copy; incomplete prompts/actions; missing vetted quote IDs/contradictory topic tags; insufficient quote variety; absent native popup hookup; or known independent-answer leakage patterns. No generic placeholder is permitted to count as lesson companion content.

Automated checks are structural, **not** a substitute for academic/source verification, translation fidelity, pedagogical suitability, spoiler review, mobile layout, VoiceOver or the Human PO's decision gates. A green CI result does not mean all those reviews have occurred.

## Per-batch Definition of Done

- [ ] Full source material actually inspected; objective and terminology checked.
- [ ] Six lesson-specific mentor moments, with two distinct VI/EN questions/replies each.
- [ ] Quotes checked for original wording, relevance, provenance and proper separation from Lão Lý commentary.
- [ ] Challenge reviewed to avoid answers before submission; reflection gated.
- [ ] JSON and native lesson UI wired; all repo validators green, GitHub Pages deployment confirmed.
- [ ] iPhone/iPad/desktop and keyboard/VoiceOver/editorial QA recorded.
- [ ] Notion lesson status and Latest Handoff updated with evidence, unresolved gates and zero-cost accounting.

**Reference implementation:** \`site/lessons/companion/L09-1-2.json\` plus \`site/assets/lesson-l09-hifi-markup.js\`. Existing passage bank is shared; content is **not** generic per lesson. No external AI service or ongoing paid cost.
