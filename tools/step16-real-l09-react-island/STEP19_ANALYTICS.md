# Step 19 — learning analytics (candidate architecture)
Source: Notion Step19, Step06 K1–K8/E1/M1, S145, exact staging 807c307. No runtime collection or consent approval implied.
## One event contract, one owner boundary
Pure `src/learning/learning-analytics.mjs` is a future consumer of explicitly permitted events, not a collector. Generate one opaque round ID at the first committed start; use the same ID across locale, route, retry and device resumption. Persist event identities/timestamps atomically with the originating action only after explicit consent and privacy review; never derive a fresh ID on retry. Each source must reuse stable task/action identity; do not invent missing old timestamps or IDs.
| Event | Authoritative future source |
|---|---|
| subject_open | successful canonical subject/lesson route entry, not card impressions |
| unit_start | first committed start of learning round |
| tutorial_view_or_skip | explicit method tutorial action, not guide opened by default |
| rehearsal_attempt | saved real method rehearsal |
| technique_apply | saved submitted method action, not a click or prompt copy |
| independent_answer | committed independent submission, track exposure, assistance, assessment and rubric version |
| hint / reveal | actual explicit action, never inferred from reading |
| unit_finish | committed completion receipt, one per round, unique lesson count across rounds |
| due_review | real T02 schedule / completed review, matching stable opportunity ID |
Current Attempt already retains methodChoice, methodAttempts, submittedAt, ratings, hint, assisted, review snapshot and history; ports save with owner/revision guard. Reuse this instead of a second writer. It cannot establish all opens, tutorial skips, exact hint times, historical exposure, or fresh untrained transfer probes: report unknown, don't backfill fabricated events. Source eligibility is a caller responsibility, not established by token validation.
## Measurement
Separate lesson completion (unique lesson and completed started rounds), method selection and enacted submissions (per round and method), independent task evidence (fresh unassisted rubric-assessed subset, not correctness), and actual scheduled/completed review opportunities. Missing denominator is unknown, never zero mastery. K2 suitability, K3 execution quality, K1/K4 knowledge, K5 retention and K8 task attention need real eligible instruments; self-review, fresh task and true untrained transfer are distinct. No causal or IQ claims. No L1/health scoring or employer telemetry.
## Privacy boundary / next
No new data sink, owner identifiers, raw text, cloud tables, network request, or health event. This module validates allowlisted shape, not consent, source integrity, authentication or RLS. Never send mixed-owner inputs; no anonymous cross-account aggregate. No live collection until PO approves specific opt-in, scope, retention/deletion, local vs cloud and owner-only access. Use existing private progress with no separate logging as the minimum approach; any optional event capture must be separately approved and tested. Current architecture code/tests only; app behavior unchanged.
