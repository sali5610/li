-- SYNC-12 / PostgreSQL-only privilege hardening regression.
-- Never apply to Neon. The identity extension is a MOCK custom GUC.
\set ON_ERROR_STOP on
DO $$
BEGIN
 IF current_database() <> 'li_idempotency_ci' THEN
  RAISE EXCEPTION 'CI_ONLY_DATABASE_REQUIRED';
 END IF;
END $$;

-- PG-16: server receipt function is the ONLY write surface for authenticated.
SELECT public.ci_assert(
 has_table_privilege('authenticated','public.li_user_state','SELECT') AND
 NOT has_table_privilege('authenticated','public.li_user_state','INSERT') AND
 NOT has_table_privilege('authenticated','public.li_user_state','UPDATE') AND
 NOT has_table_privilege('authenticated','public.li_user_state','DELETE'),
 'PG-16 authenticated direct DML revoked, read remains available');

-- PG-17: default PostgreSQL PUBLIC EXECUTE must not reach receipt writer.
SELECT public.ci_assert(
 (SELECT p.proacl IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM aclexplode(p.proacl) a
    WHERE a.grantee=0 AND a.privilege_type='EXECUTE')
  FROM pg_proc p WHERE p.oid =
   'public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)'::regprocedure),
 'PG-17 no PUBLIC EXECUTE on idempotent function');
SELECT public.ci_assert(
 has_function_privilege('authenticated',
  'public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)','EXECUTE'),
 'PG-17 authenticated has narrow RPC execute grant');

SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);

-- PG-18: direct insert is forbidden even for an invited owner's own row.
DO $$
DECLARE rejected boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.li_user_state(item_type,item_id,revision,payload)
   VALUES('preference','qa-bypass-insert',1,'{"bypass":true}'::jsonb);
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'PG-18_DIRECT_INSERT_ACCEPTED'; END IF;
END $$;

-- PG-19: owner cannot bypass RPC receipt with direct UPDATE.
DO $$
DECLARE rejected boolean:=false;
BEGIN
 BEGIN
  UPDATE public.li_user_state SET payload='{"bypass":true}'::jsonb
   WHERE owner_id='synthetic-A' AND item_type='preference' AND item_id='qa-item-1';
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'PG-19_DIRECT_UPDATE_ACCEPTED'; END IF;
END $$;

-- PG-20: direct DELETE must be independently reviewed/migrated, and
-- cannot silently bypass the receipt protocol.
DO $$
DECLARE rejected boolean:=false;
BEGIN
 BEGIN
  DELETE FROM public.li_user_state
   WHERE owner_id='synthetic-A' AND item_type='preference' AND item_id='qa-item-1';
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'PG-20_DIRECT_DELETE_ACCEPTED'; END IF;
END $$;

RESET ROLE;
SELECT public.ci_assert(
 (SELECT count(*) FROM public.li_user_state)=4,
 'PG-20 denied bypasses did not modify existing synthetic state');
SELECT 'LI_PG_DIRECT_DML_BYPASS_DENIED_16_TO_20_PASS' AS verified_marker;
