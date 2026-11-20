-- #161: backward-compatible lost-ACK identification on the currently
-- USER-VALIDATED signed Neon REST writer. No RPC cutover, no privilege changes.
-- Existing 16+ user rows remain intact and retain NULL last_op_id.
-- Migrating this nullable column before client deployment is mandatory.
ALTER TABLE public.li_user_state
 ADD COLUMN IF NOT EXISTS last_op_id text NULL;
-- A bounded opaque operation identifier; this cannot alter RLS authorization.
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint
 WHERE conrelid='public.li_user_state'::regclass
 AND conname='li_user_state_last_op_id_bound') THEN
  ALTER TABLE public.li_user_state
    ADD CONSTRAINT li_user_state_last_op_id_bound
    CHECK(last_op_id IS NULL OR (length(last_op_id)>0 AND length(last_op_id)<=80));
 END IF;
END
$$;
-- IMPORTANT: after applying the DDL, refresh Neon Data API schema cache
-- via update_data_api with the SAME existing settings (LL-34).
-- Do NOT revoke authenticated direct DML here: old Safari tabs still use it.
-- Rollback requires only reverting REST client code; do not drop the nullable
-- column while any signed client may have persisted it.
