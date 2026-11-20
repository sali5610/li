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
5. The release must bundle `src/auth/cloudflare-worker.ts` with
   `npm run build:worker` and deploy its output as `site/_worker.js`
   alongside the **matching first-party React app**. Current Cloudflare
   manual workflow only uploads static `site/`, so it does **not** yet
   perform this release. Do not claim AI is live until this is fixed,
   a human approves G4, and the deployed endpoint verifies signed accounts.
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

**Not done:** production Worker integration/deployment, Cloudflare bindings
and real signed-device/inference validation. Keep Step17 In Progress.
