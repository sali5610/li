-- CI-ONLY SQL assertions. Synthetic identities / custom GUC = NOT real JWT.
\set ON_ERROR_STOP on
DO $$
BEGIN
 IF current_database() <> 'li_idempotency_ci' THEN
  RAISE EXCEPTION 'CI_ONLY_DATABASE_REQUIRED';
 END IF;
END
$$;

CREATE FUNCTION public.ci_assert(ok boolean, label text) RETURNS void
 LANGUAGE plpgsql AS $$
 BEGIN
  IF ok IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'CI_ASSERTION_FAILED: %', label;
  END IF;
 END
 $$;

-- Role/privilege proof as postgres before executing as mock authenticated user.
SELECT public.ci_assert(
 (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
  WHERE oid='public.li_user_state'::regclass),
 'FORCE RLS enabled');
SELECT public.ci_assert(
 NOT has_table_privilege('authenticated','public.li_sync_operation_receipts','SELECT') AND
 NOT has_table_privilege('authenticated','public.li_sync_operation_receipts','INSERT'),
 'receipt ledger inaccessible to caller');
SELECT public.ci_assert(
 NOT pg_has_role('authenticated','li_sync_executor','MEMBER'),
 'authenticated cannot assume definer role');
SELECT public.ci_assert(
 (SELECT prosecdef FROM pg_proc
  WHERE oid='public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)'::regprocedure),
 'RPC is security definer');

SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);

-- PG-01: first commit, original ack and same opId replay.
SELECT public.ci_assert(
 (public.li_apply_user_edit_v1('preference','qa-item-1','{"n":1}'::jsonb,
  NULL,0,'11111111-1111-4111-8111-111111111111') #>> '{item,revision}')='1',
 'PG-01 insert revision 1');
SELECT public.ci_assert(
 (public.li_apply_user_edit_v1('preference','qa-item-1','{"n":1}'::jsonb,
  NULL,0,'11111111-1111-4111-8111-111111111111')->>'kind')='replayed',
 'PG-02 exact replay returns replayed');

-- PG-03: same opId with tampered payload must fail, with preserved row.
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-item-1',
   '{"n":999}'::jsonb,NULL,0,'11111111-1111-4111-8111-111111111111');
 EXCEPTION WHEN unique_violation THEN
  caught := true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-03_MISSING_OP_REPLAY_REJECTION'; END IF;
END $$;
SELECT public.ci_assert(
 (SELECT payload->>'n' FROM public.li_user_state WHERE item_id='qa-item-1')='1',
 'PG-03 row unchanged after forged replay');

-- PG-04: different op, stale base revision must remain conflict.
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-item-1',
   '{"n":2}'::jsonb,NULL,0,'22222222-2222-4222-8222-222222222222');
 EXCEPTION WHEN unique_violation THEN caught:=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-04_MISSING_STALE_CONFLICT'; END IF;
END $$;

-- PG-05: PATCH to revision 2 and replay original op after newer commit.
SELECT public.ci_assert(
 (public.li_apply_user_edit_v1('preference','qa-item-1','{"n":2}'::jsonb,
  NULL,1,'22222222-2222-4222-8222-222222222222') #>> '{item,revision}')='2',
 'PG-05 update revision 2');
SELECT public.ci_assert(
 (public.li_apply_user_edit_v1('preference','qa-item-1','{"n":1}'::jsonb,
  NULL,0,'11111111-1111-4111-8111-111111111111') #>> '{item,revision}')='1',
 'PG-06 replay original revision after newer write');
SELECT public.ci_assert(
 (SELECT revision=2 AND payload='{"n":2}'::jsonb
  FROM public.li_user_state WHERE item_id='qa-item-1'),
 'PG-06 latest row still revision 2');

-- PG-07: receipt table direct access MUST be denied to authenticated.
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM COUNT(*) FROM public.li_sync_operation_receipts;
 EXCEPTION WHEN insufficient_privilege THEN caught:=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-07_RECEIPT_TABLE_EXPOSED'; END IF;
END $$;

-- PG-08: user B sees neither A row nor A receipt but may reuse same opId in own namespace.
SELECT set_config('li.test_subject','synthetic-B',false);
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_user_state WHERE owner_id='synthetic-A')=0,
 'PG-08 account isolation');
SELECT public.ci_assert(
 (public.li_apply_user_edit_v1('preference','qa-item-1','{"from":"B"}'::jsonb,
  NULL,0,'11111111-1111-4111-8111-111111111111') #>> '{item,owner_id}')='synthetic-B',
 'PG-08 opId scoped by authenticated owner');
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_user_state)=1,
 'PG-08 B can only read its own state');

-- PG-09: uninvited user C denied without writing a row.
SELECT set_config('li.test_subject','synthetic-C',false);
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-item-c','{}'::jsonb,
   NULL,0,'33333333-3333-4333-8333-333333333333');
 EXCEPTION WHEN insufficient_privilege THEN caught:=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-09_UNINVITED_WROTE'; END IF;
END $$;

-- PG-10: empty user (anonymous) cannot run RPC.
SELECT set_config('li.test_subject','',false);
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-item-empty','{}'::jsonb,
   NULL,0,'33333333-3333-4333-8333-333333333333');
 EXCEPTION WHEN insufficient_privilege THEN caught:=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-10_ANONYMOUS_WROTE'; END IF;
END $$;

-- PG-11: a revoked user cannot use even a previous, valid receipt.
RESET ROLE;
UPDATE public.li_ci_invites SET allowed=false WHERE owner_id='synthetic-A';
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-item-1','{"n":1}'::jsonb,
   NULL,0,'11111111-1111-4111-8111-111111111111');
 EXCEPTION WHEN insufficient_privilege THEN caught:=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-11_REVOKED_REPLAY_ALLOWED'; END IF;
END $$;

-- PG-12: receipt insertion failure rolls back state and receipt together.
RESET ROLE;
UPDATE public.li_ci_invites SET allowed=true WHERE owner_id='synthetic-A';
CREATE FUNCTION public.ci_fail_receipt() RETURNS trigger
 LANGUAGE plpgsql AS $$
 BEGIN
  IF NEW.op_id='44444444-4444-4444-8444-444444444444'::uuid THEN
   RAISE EXCEPTION 'CI_SYNTHETIC_RECEIPT_FAILURE';
  END IF;
  RETURN NEW;
 END $$;
CREATE TRIGGER ci_fail_receipt BEFORE INSERT ON public.li_sync_operation_receipts
 FOR EACH ROW EXECUTE FUNCTION public.ci_fail_receipt();
SET ROLE authenticated;
SELECT set_config('li.test_subject','synthetic-A',false);
DO $$
DECLARE caught boolean:=false;
BEGIN
 BEGIN
  PERFORM public.li_apply_user_edit_v1('preference','qa-atomic-failure','{"n":3}'::jsonb,
   NULL,0,'44444444-4444-4444-8444-444444444444');
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='CI_SYNTHETIC_RECEIPT_FAILURE' THEN caught:=true; ELSE RAISE; END IF;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'PG-12_MISSING_RECEIPT_FAILURE'; END IF;
END $$;
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_user_state WHERE item_id='qa-atomic-failure')=0,
 'PG-12 insert rolled back atomically');
RESET ROLE;
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_sync_operation_receipts WHERE op_id='44444444-4444-4444-8444-444444444444')=0,
 'PG-12 receipt rollback confirmed');
DROP TRIGGER ci_fail_receipt ON public.li_sync_operation_receipts;
DROP FUNCTION public.ci_fail_receipt();

-- PG-13: database ledger has exactly 2 for A and 1 for B; no fixture C rows.
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_sync_operation_receipts)=3,
 'PG-13 unique server receipts');
SELECT public.ci_assert(
 (SELECT COUNT(*) FROM public.li_user_state)=2,
 'PG-13 one state per invited user');
SELECT public.ci_assert(
 NOT EXISTS(SELECT 1 FROM public.li_user_state WHERE owner_id='synthetic-C'),
 'PG-13 no uninvited rows');

SELECT 'LI_PG_IDEMPOTENCY_ISOLATED_ASSERTIONS_PASS' AS verified_marker;
