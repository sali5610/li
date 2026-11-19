-- CI ONLY: simulate reversible privilege cutover, NOT a live Neon migration.
\set ON_ERROR_STOP on
DO $$
BEGIN
 IF current_database()<>'li_idempotency_ci' THEN
  RAISE EXCEPTION 'CI_ONLY_DATABASE_REQUIRED';
 END IF;
END $$;

-- PG-21: disable new RPC without deleting historical receipts.
REVOKE EXECUTE ON FUNCTION
 public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)
 FROM authenticated;
SELECT public.ci_assert(
 NOT has_function_privilege('authenticated',
 'public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)','EXECUTE'),
 'PG-21 rollback deactivates RPC for authenticated');

-- PG-22: explicit authorization rollback restores previously read-only verified
-- live privilege shape, but only in the disposable CI database.
GRANT INSERT,UPDATE,DELETE ON public.li_user_state TO authenticated;
SELECT public.ci_assert(
 has_table_privilege('authenticated','public.li_user_state','SELECT') AND
 has_table_privilege('authenticated','public.li_user_state','INSERT') AND
 has_table_privilege('authenticated','public.li_user_state','UPDATE') AND
 has_table_privilege('authenticated','public.li_user_state','DELETE'),
 'PG-22 legacy DML privilege shape restored');
SELECT public.ci_assert(
 (SELECT relrowsecurity AND relforcerowsecurity
 FROM pg_class WHERE oid='public.li_user_state'::regclass),
 'PG-22 FORCE RLS not dropped');
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_sync_operation_receipts)=5,
 'PG-22 existing receipt history preserved');

-- PG-23: the old per-owner API can operate after role restoration (isolated
-- transaction rolled back), while the newer RPC cannot be used.
BEGIN;
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',true);
INSERT INTO public.li_user_state(item_type,item_id,revision,payload)
 VALUES('preference','qa-rollback-only',1,'{"test":"rolled-back"}'::jsonb);
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_user_state WHERE item_id='qa-rollback-only')=1,
 'PG-23 authorized legacy write works after fallback');
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-disabled-rpc',
   '{}'::jsonb,NULL,0,'77777777-7777-4777-8777-777777777777');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'PG-23_REVOKED_RPC_STILL_ACCESSIBLE'; END IF;
END $$;
ROLLBACK;

-- PG-24: even after restoring direct DML the RLS invited-only guard should
-- block an uninvited fixture identity.
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-C',false);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.li_user_state(item_type,item_id,revision,payload)
  VALUES('preference','qa-uninvited-rollback',1,'{}'::jsonb);
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'PG-24_UNINVITED_LEGACY_WRITE'; END IF;
END $$;
RESET ROLE;

SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_user_state)=4 AND
 (SELECT COUNT(*) FROM public.li_sync_operation_receipts)=5,
 'PG-24 state and immutable receipt preserved across cutover rollback');
SELECT 'LI_PG_ROLLBACK_REHEARSAL_21_TO_24_PASS' AS verified_marker;
