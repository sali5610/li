-- li. E2EE production cut-over guard — SOURCE ONLY, NOT APPLIED.
-- This is a G4-protected migration: require an approved, deployed E2EE client,
-- backed-up and verified owner-by-owner conversion, and explicit PO approval.
-- WILL FAIL on any existing plaintext row. Never apply to unblock CI/debug.
--
-- PostgreSQL cannot prove client key secrecy. These checks stop accidental
-- plaintext uploads by old app builds after a deliberate cut-over; verification
-- that valid AES-GCM envelopes decrypt is strictly a client-side responsibility.
--
-- Preconditions (read-only):
-- SELECT count(*) FROM public.li_user_state
-- WHERE NOT (coalesce(payload->>'schema'='li.e2ee.payload.v1', false)
--   OR (item_type='preference' AND item_id='__li_e2ee_keybag_v1'
--       AND coalesce(payload->>'schema'='li.e2ee.keybag.v1', false)));
-- SELECT count(*) FROM public.li_learning_events
-- WHERE NOT coalesce(payload->>'schema'='li.e2ee.payload.v1',false);
--
-- If either query is nonzero: STOP, do not delete users or truncate rows.

BEGIN;

ALTER TABLE public.li_user_state
  ADD CONSTRAINT li_user_state_e2ee_payload_only
  CHECK (
    coalesce(
      (
        item_type='preference' AND item_id='__li_e2ee_keybag_v1'
        AND jsonb_typeof(payload)='object'
        AND payload->>'schema'='li.e2ee.keybag.v1'
        AND jsonb_typeof(payload->'passphrase')='object'
        AND jsonb_typeof(payload->'recovery')='object'
        AND (payload - 'schema' - 'accountId' - 'passphrase' - 'recovery')='{}'::jsonb
      )
      OR
      (
        NOT (item_type='preference' AND item_id='__li_e2ee_keybag_v1')
        AND jsonb_typeof(payload)='object'
        AND payload->>'schema'='li.e2ee.payload.v1'
        AND jsonb_typeof(payload->'nonce')='string'
        AND jsonb_typeof(payload->'ciphertext')='string'
        AND (payload - 'schema' - 'nonce' - 'ciphertext')='{}'::jsonb
      ),false
    )
  );

-- No current direct learner-event write path exists; keep future events
-- closed to plaintext too, including the old DEFAULT '{}'::jsonb.
ALTER TABLE public.li_learning_events
  ADD CONSTRAINT li_learning_events_e2ee_payload_only
  CHECK (
    coalesce(
      jsonb_typeof(payload)='object'
      AND payload->>'schema'='li.e2ee.payload.v1'
      AND jsonb_typeof(payload->'nonce')='string'
      AND jsonb_typeof(payload->'ciphertext')='string'
      AND (payload - 'schema' - 'nonce' - 'ciphertext')='{}'::jsonb,
      false
    )
  );

COMMIT;
