-- li. ISSUE #161 — additive LIVE Neon receipt/RPC migration.
-- APPROVED by Human PO on 2026-11-20. Applies to Neon project silent-dawn-26391246,
-- branch br-tiny-pond-azq00c4y, database li. One atomic transaction required.
--
-- SECURITY: Existing signed client direct DML stays enabled during compatibility
-- rollout. Never revoke it before a signed RPC A/B/C check + client rollout.
-- Existing owner data is untouched; no backfill or receipt deletion.
-- Caller may only submit item fields; verified owner derives from auth.user_id().
--
-- CRITICAL: Run the sections between "-- @statement" in ONE transaction only.
-- Separate rollout will replace the legacy writer and revoke direct DML.
-- @statement
DO $role$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='li_sync_executor') THEN
  CREATE ROLE li_sync_executor NOLOGIN NOINHERIT NOBYPASSRLS;
 ELSIF NOT EXISTS (
   SELECT 1 FROM pg_catalog.pg_roles
   WHERE rolname='li_sync_executor' AND NOT rolcanlogin AND NOT rolbypassrls
 ) THEN
  RAISE EXCEPTION 'LI_SYNC_EXECUTOR_ROLE_UNSAFE';
 END IF;
END
$role$;
-- @statement
GRANT li_sync_executor TO li_owner WITH SET TRUE;
-- @statement
GRANT USAGE ON SCHEMA public TO li_sync_executor;
-- @statement
CREATE FUNCTION public.li_sync_subject_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=pg_catalog,pg_temp
AS $fn$
 SELECT auth.user_id()
$fn$;
-- @statement
REVOKE ALL ON FUNCTION public.li_sync_subject_v1() FROM PUBLIC;
-- @statement
GRANT EXECUTE ON FUNCTION public.li_sync_subject_v1() TO li_sync_executor;
-- @statement
GRANT EXECUTE ON FUNCTION public.li_is_invited() TO li_sync_executor;
-- @statement
GRANT SELECT,INSERT,UPDATE ON TABLE public.li_user_state TO li_sync_executor;
-- @statement
CREATE POLICY li_user_state_rpc_select ON public.li_user_state
 FOR SELECT TO li_sync_executor
 USING(owner_id=public.li_sync_subject_v1() AND public.li_is_invited());
-- @statement
CREATE POLICY li_user_state_rpc_insert ON public.li_user_state
 FOR INSERT TO li_sync_executor
 WITH CHECK(owner_id=public.li_sync_subject_v1() AND public.li_is_invited());
-- @statement
CREATE POLICY li_user_state_rpc_update ON public.li_user_state
 FOR UPDATE TO li_sync_executor
 USING(owner_id=public.li_sync_subject_v1() AND public.li_is_invited())
 WITH CHECK(owner_id=public.li_sync_subject_v1() AND public.li_is_invited());
-- @statement
CREATE TABLE public.li_sync_operation_receipts(
 owner_id text NOT NULL,
 op_id uuid NOT NULL,
 item_type text NOT NULL,
 item_id text NOT NULL,
 base_revision bigint NOT NULL CHECK(base_revision>=0),
 request_sha256 bytea NOT NULL CHECK(octet_length(request_sha256)=32),
 accepted_revision bigint NOT NULL CHECK(accepted_revision>=1),
 accepted_changed_at timestamptz NOT NULL,
 PRIMARY KEY(owner_id,op_id)
);
-- @statement
ALTER TABLE public.li_sync_operation_receipts ENABLE ROW LEVEL SECURITY;
-- @statement
ALTER TABLE public.li_sync_operation_receipts FORCE ROW LEVEL SECURITY;
-- @statement
REVOKE ALL ON TABLE public.li_sync_operation_receipts FROM PUBLIC,authenticated;
-- @statement
GRANT SELECT,INSERT ON TABLE public.li_sync_operation_receipts TO li_sync_executor;
-- @statement
CREATE POLICY li_receipt_rpc_select ON public.li_sync_operation_receipts
 FOR SELECT TO li_sync_executor
 USING(owner_id=public.li_sync_subject_v1() AND public.li_is_invited());
-- @statement
CREATE POLICY li_receipt_rpc_insert ON public.li_sync_operation_receipts
 FOR INSERT TO li_sync_executor
 WITH CHECK(owner_id=public.li_sync_subject_v1() AND public.li_is_invited());
-- @statement
CREATE FUNCTION public.li_apply_user_edit_v1(
 p_item_type text,
 p_item_id text,
 p_payload jsonb,
 p_deleted_at timestamptz,
 p_base_revision bigint,
 p_op_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp
AS $function$
DECLARE
 v_owner text;
 v_hash bytea;
 v_receipt public.li_sync_operation_receipts%ROWTYPE;
 v_item public.li_user_state%ROWTYPE;
BEGIN
 v_owner := public.li_sync_subject_v1();
 IF v_owner IS NULL OR NOT public.li_is_invited() THEN
  RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='LI_SYNC_NOT_INVITED';
 END IF;
 IF p_op_id IS NULL OR p_item_type IS NULL OR
    p_item_type NOT IN ('lesson_attempt','review_schedule','bookmark','note','preference','l2_progress') OR
    p_item_id IS NULL OR length(btrim(p_item_id))=0 OR
    length(p_item_id)>180 OR p_payload IS NULL OR
    octet_length(p_payload::text)>1048576 OR
    p_base_revision IS NULL OR p_base_revision<0 THEN
  RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='LI_SYNC_INVALID_INPUT';
 END IF;
 v_hash:=pg_catalog.sha256(pg_catalog.convert_to(
   pg_catalog.jsonb_build_array(p_item_type,p_item_id,p_base_revision,p_payload,p_deleted_at)::text,'UTF8'));

 -- Operation UUID lock precedes item lock. A replay cannot race its first commit.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner||':op:'||p_op_id::text,0));
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner||':item:'||p_item_type||':'||p_item_id,0));

 SELECT * INTO v_receipt FROM public.li_sync_operation_receipts
 WHERE owner_id=v_owner AND op_id=p_op_id;
 IF FOUND THEN
  IF v_receipt.request_sha256<>v_hash OR v_receipt.item_type<>p_item_type OR
     v_receipt.item_id<>p_item_id OR v_receipt.base_revision<>p_base_revision THEN
   RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='LI_SYNC_OP_ID_REUSED';
  END IF;
  RETURN pg_catalog.jsonb_build_object(
   'protocol','li-opid-v1','op_id',p_op_id::text,'kind','replayed',
   'item',pg_catalog.jsonb_build_object(
    'owner_id',v_owner,'item_type',p_item_type,'item_id',p_item_id,
    'revision',v_receipt.accepted_revision,'payload',p_payload,
    'changed_at',v_receipt.accepted_changed_at,'deleted_at',p_deleted_at));
 END IF;

 IF p_base_revision=0 THEN
  INSERT INTO public.li_user_state(owner_id,item_type,item_id,revision,payload,changed_at,deleted_at)
  VALUES(v_owner,p_item_type,p_item_id,1,p_payload,statement_timestamp(),p_deleted_at)
  ON CONFLICT DO NOTHING RETURNING * INTO v_item;
 ELSE
  UPDATE public.li_user_state SET
   revision=revision+1,payload=p_payload,changed_at=statement_timestamp(),deleted_at=p_deleted_at
  WHERE owner_id=v_owner AND item_type=p_item_type AND item_id=p_item_id
    AND revision=p_base_revision RETURNING * INTO v_item;
 END IF;
 IF NOT FOUND THEN
  RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='LI_SYNC_REVISION_CONFLICT';
 END IF;

 INSERT INTO public.li_sync_operation_receipts(
  owner_id,op_id,item_type,item_id,base_revision,request_sha256,
  accepted_revision,accepted_changed_at)
 VALUES(v_owner,p_op_id,p_item_type,p_item_id,p_base_revision,v_hash,
  v_item.revision,v_item.changed_at);

 RETURN pg_catalog.jsonb_build_object(
  'protocol','li-opid-v1','op_id',p_op_id::text,'kind','applied',
  'item',pg_catalog.to_jsonb(v_item));
END
$function$;
-- @statement
GRANT CREATE ON SCHEMA public TO li_sync_executor;
-- @statement
ALTER FUNCTION public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid) OWNER TO li_sync_executor;
-- @statement
REVOKE CREATE ON SCHEMA public FROM li_sync_executor;
-- @statement
REVOKE ALL ON FUNCTION public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid) FROM PUBLIC;
-- @statement
GRANT EXECUTE ON FUNCTION public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid) TO authenticated;
-- @statement
DO $verify$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='li_sync_executor' AND NOT rolcanlogin AND NOT rolbypassrls)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='li_sync_executor' AND rolinherit)
  OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_catalog.pg_class
          WHERE oid='public.li_sync_operation_receipts'::regclass)
  OR pg_catalog.has_table_privilege('authenticated','public.li_sync_operation_receipts','SELECT')
  OR pg_catalog.has_table_privilege('authenticated','public.li_sync_operation_receipts','INSERT')
  OR pg_catalog.has_schema_privilege('li_sync_executor','public','CREATE')
  OR pg_catalog.has_function_privilege('anonymous','public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)','EXECUTE')
  OR NOT pg_catalog.has_function_privilege('authenticated','public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)','EXECUTE')
 THEN
  RAISE EXCEPTION 'LI_SYNC_RECEIPT_SECURITY_ASSERTION_FAILED';
 END IF;
END
$verify$;

-- DO NOT REVOKE authenticated direct INSERT/UPDATE/DELETE HERE.
-- Rollback/incident: REVOKE EXECUTE ON FUNCTION public.li_apply_user_edit_v1(...)
-- FROM authenticated. Existing REST writer can then continue; do not drop
-- operation receipts until all pending op IDs and account-erasure needs resolve.
