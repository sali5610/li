# Step 17 — one transferable AI seat (Cloudflare Free)

**State:** feature code integrated on staging only; **AI NOT LIVE** until an
explicitly approved Cloudflare release. This is not a second app or a new
learning-content store.

The shared staging host `https://sali5610.github.io/li/` is static:
it **cannot** safely execute /api/ai/* or reuse Cloudflare first-party cookies.
The UI accurately disables model calls there. Do not add cross-origin
credential shortcuts or any AI API token to React.

## One-time Cloudflare release dependencies (not configured by this PR)

1. The owner approves a production G4 release and confirms **Workers Free**
   remains the active plan. Never upgrade or enable paid AI billing.
2. Create one Cloudflare **D1 Free** database for entitlement metadata and
   apply `db/cloudflare/0001_ai_one_seat.sql`. It stores only the active
   invited email and the daily request counter, **never lesson responses**.
3. Bind that database to the **existing Cloudflare Pages** project's Worker
   as `LI_AI_DB`; add the Workers AI binding as `AI`.
4. Configure the private Pages Worker variable `LI_AI_OWNER_EMAIL` to the
   **verified Google email belonging to the human owner**, without committing
   that email. Retain `NEON_AUTH_COOKIE_SECRET` (32+ characters).
5. The release now has an **opt-in manual AI mode**, not an automatic
   deployment. On approved `main` only, select `ai_mode=true` and enter
   `PUBLISH_LI_AI_FREE_ONLY` after explicit G4 approval. The workflow
   builds first-party React and `_worker.js` into
   `dist-cloudflare-ai-candidate/`, verifies the existing Free-only Pages
   guard, and checks read-only production AI/D1/secret binding names.
   Set repository variable `LI_AI_FREE_PLAN_CONFIRMED=true` **only after
   verifying Workers Free in Cloudflare Dashboard**. Static `ai_mode=false`
   still uses the original `PUBLISH_LI_FREE_ONLY` confirmation.
   GitHub staging/CI can produce the candidate locally but never deploys
   it. Production requires main branch approval and the actual dispatch.
   A successful deployment is NOT proof of signed invite or model feedback.
6. Before enabling, smoke the real invitation/RLS gate: owner assignment;
   another invited account can receive the seat and the former holder is
   denied immediately; revoked/uninvited accounts cannot call the model;
   cross-site POST fails; Cloudflare Free neuron exhaustion yields deterministic fallback.

## Intended learner interaction

- Owner: **Account → AI access → Assign to me / Transfer to invited email /
  Disable for everyone.** One active email globally, not one switch per device.
- Invited assignee: after submitting one of the 3 reviewed Wave1 lessons,
  press **Get AI feedback** only for questions editorially marked `open`.
  Exact-answer questions use the existing answer key/rubric, never the model.
  The request includes only approved open-ended answers and their corresponding
  reviewed GitHub reference segments/rubric. Results are
  plain text, provisional, not grades/citations or certified mastery.
- Other users: all normal lesson, source, manual rubric, progress and Lão Lý
  remain. No model calls, no quota usage.
- Backend: validate first-party Neon session, short-lived signed JWT and
  `li_is_invited` RPC for **every** AI request; verify entitlement on D1
  primary; **no artificial 12-request cap**. The mandatory Workers Free plan
  enforces the provider's 10,000 Neurons/day limit, after which AI fails closed.
- On offline, missing bindings or quota exhaustion: existing deterministic
  self-review remains available. No payment or fallback to paid providers.

**Not done:** production dispatch/G4 approval, Cloudflare D1/Workers AI binding
and owner secret provisioning, D1 schema application, real signed-device
invite/RLS + feedback validation. The integrated release candidate and manual
release path are built but AI has **not** been enabled on any live account.
Keep Step17 In Progress.
