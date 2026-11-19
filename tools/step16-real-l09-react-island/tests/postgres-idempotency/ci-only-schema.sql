-- SYNTHETIC POSTGRES TEST ONLY. NEVER APPLY TO NEON, STAGING OR PRODUCTION.
-- Idempotency/RLS candidate schema for Issue #161.
-- The guard blocks accidental execution outside the disposable CI database.
\set ON_ERROR_STOP on
DO $$
BEGIN
 IF current_database() <> 'li_idempotency_ci' THEN
  RAISE EXCEPTION 'CI_ONLY_DATABASE_REQUIRED';
 END IF;
END
$$;

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE SCHEMA auth;
CREATE ROLE authenticated NOLOGIN NOBYPASSRLS;
CREATE ROLE li_sync_executor NOLOGIN NOBYPASSRLS;
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('li.test_subject',true),'')
$$;
CREATE TABLE public.li_ci_invites(owner_id text PRIMARY KEY, allowed boolean NOT NULL);
INSERT INTO public.li_ci_invites VALUES ('synthetic-A',true),('synthetic-B',true),('synthetic-C',false);
CREATE FUNCTION public.li_is_invited() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT EXISTS(
  SELECT 1 FROM public.li_ci_invites
  WHERE owner_id=auth.user_id() AND allowed IS TRUE
 )
$$;

-- Production-shaped table: primary key, owner default and forced RLS.
CREATE TABLE public.li_user_state(
 owner_id text NOT NULL DEFAULT auth.user_id(),
 item_type text NOT NULL CHECK(item_type IN ('lesson_attempt','review_schedule','bookmark','note','preference','l2_progress')),
 item_id text NOT NULL CHECK(length(item_id) BETWEEN 1 AND 180),
 revision bigint NOT NULL CHECK(revision>=1),
 payload jsonb NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz,
 PRIMARY KEY(owner_id,item_type,item_id)
);
ALTER TABLE public.li_user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.li_user_state FORCE ROW LEVEL SECURITY;
CREATE POLICY li_user_state_select_owner ON public.li_user_state
 FOR SELECT TO authenticated USING(owner_id=auth.user_id());
CREATE POLICY li_user_state_insert_owner ON public.li_user_state
 FOR INSERT TO authenticated WITH CHECK(owner_id=auth.user_id());
CREATE POLICY li_user_state_update_owner ON public.li_user_state
 FOR UPDATE TO authenticated USING(owner_id=auth.user_id()) WITH CHECK(owner_id=auth.user_id());
CREATE POLICY li_user_state_invited_only ON public.li_user_state
 AS RESTRICTIVE FOR ALL TO authenticated USING(public.li_is_invited()) WITH CHECK(public.li_is_invited());
GRANT USAGE ON SCHEMA auth,public TO authenticated,li_sync_executor;
-- Idempotent cutover REQUIRES all writes through the receipt RPC.
-- This is only a CI trial; live Neon still grants direct DML and is untouched.
GRANT SELECT ON public.li_user_state TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.li_user_state FROM authenticated;

-- SECURITY DEFINER executes as a NONLOGIN, NOBYPASSRLS role and is
-- explicitly subject to its own owner+invite RLS rules. Authenticated
-- users receive neither membership in this role nor receipt-table grants.
CREATE POLICY li_user_state_rpc_select ON public.li_user_state
 FOR SELECT TO li_sync_executor
 USING(owner_id=auth.user_id() AND public.li_is_invited());
CREATE POLICY li_user_state_rpc_insert ON public.li_user_state
 FOR INSERT TO li_sync_executor
 WITH CHECK(owner_id=auth.user_id() AND public.li_is_invited());
CREATE POLICY li_user_state_rpc_update ON public.li_user_state
 FOR UPDATE TO li_sync_executor
 USING(owner_id=auth.user_id() AND public.li_is_invited())
 WITH CHECK(owner_id=auth.user_id() AND public.li_is_invited());
GRANT SELECT,INSERT,UPDATE ON public.li_user_state TO li_sync_executor;

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
ALTER TABLE public.li_sync_operation_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.li_sync_operation_receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY receipt_rpc_select ON public.li_sync_operation_receipts
 FOR SELECT TO li_sync_executor USING(owner_id=auth.user_id() AND public.li_is_invited());
CREATE POLICY receipt_rpc_insert ON public.li_sync_operation_receipts
 FOR INSERT TO li_sync_executor WITH CHECK(owner_id=auth.user_id() AND public.li_is_invited());
GRANT SELECT,INSERT ON public.li_sync_operation_receipts TO li_sync_executor;
REVOKE ALL ON public.li_sync_operation_receipts FROM PUBLIC;
REVOKE ALL ON public.li_sync_operation_receipts FROM authenticated;

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
 v_kind text := 'applied';
BEGIN
 v_owner := auth.user_id();
 IF v_owner IS NULL OR NOT public.li_is_invited() THEN
  RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='LI_SYNC_NOT_INVITED';
 END IF;
 IF p_op_id IS NULL OR p_item_type IS NULL OR
    p_item_type NOT IN ('lesson_attempt','review_schedule','bookmark','note','preference','l2_progress') OR
    p_item_id IS NULL OR length(p_item_id) NOT BETWEEN 1 AND 180 OR
    p_payload IS NULL OR octet_length(p_payload::text)>131072 OR
    p_base_revision IS NULL OR p_base_revision<0 THEN
  RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='LI_SYNC_INVALID_INPUT';
 END IF;
 -- Stable Postgres jsonb canonicalization. Test readback on production
 -- PostgreSQL version before any real migration.
 v_hash := public.digest(convert_to(jsonb_build_array(
   p_item_type,p_item_id,p_base_revision,p_payload,p_deleted_at
 )::text,'UTF8'),'sha256');

 -- Serialize concurrent identical opIds (even if item identity differs),
 -- then all writes to the same item. Receipt unique key is still required.
 PERFORM pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(v_owner||':op:'||p_op_id::text,0)
 );
 PERFORM pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(v_owner||':item:'||p_item_type||':'||p_item_id,0)
 );

 SELECT * INTO v_receipt FROM public.li_sync_operation_receipts
 WHERE owner_id=v_owner AND op_id=p_op_id;
 IF FOUND THEN
  IF v_receipt.request_sha256<>v_hash OR
     v_receipt.item_type<>p_item_type OR
     v_receipt.item_id<>p_item_id OR
     v_receipt.base_revision<>p_base_revision THEN
   RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='LI_SYNC_OP_ID_REUSED';
  END IF;
  v_kind := 'replayed';
  -- Deliberately return the ORIGINAL acknowledged version, even if a
  -- different legitimate edit has since advanced the current row.
  RETURN jsonb_build_object(
   'protocol','li-opid-v1','op_id',p_op_id::text,'kind',v_kind,
   'item',jsonb_build_object(
    'owner_id',v_owner,'item_type',p_item_type,'item_id',p_item_id,
    'revision',v_receipt.accepted_revision,'payload',p_payload,
    'changed_at',v_receipt.accepted_changed_at,'deleted_at',p_deleted_at
   )
  );
 END IF;

 IF p_base_revision=0 THEN
  INSERT INTO public.li_user_state(
   owner_id,item_type,item_id,revision,payload,changed_at,deleted_at
  ) VALUES(v_owner,p_item_type,p_item_id,1,p_payload,statement_timestamp(),p_deleted_at)
  ON CONFLICT DO NOTHING RETURNING * INTO v_item;
 ELSE
  UPDATE public.li_user_state
   SET revision=revision+1,payload=p_payload,
       changed_at=statement_timestamp(),deleted_at=p_deleted_at
   WHERE owner_id=v_owner AND item_type=p_item_type
     AND item_id=p_item_id AND revision=p_base_revision
   RETURNING * INTO v_item;
 END IF;
 IF NOT FOUND THEN
  RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='LI_SYNC_REVISION_CONFLICT';
 END IF;
 INSERT INTO public.li_sync_operation_receipts(
  owner_id,op_id,item_type,item_id,base_revision,
  request_sha256,accepted_revision,accepted_changed_at
 ) VALUES(
  v_owner,p_op_id,p_item_type,p_item_id,p_base_revision,
  v_hash,v_item.revision,v_item.changed_at
 );
 RETURN jsonb_build_object(
  'protocol','li-opid-v1','op_id',p_op_id::text,'kind',v_kind,
  'item',to_jsonb(v_item)
 );
END
$function$;

ALTER FUNCTION public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)
 OWNER TO li_sync_executor;
REVOKE ALL ON FUNCTION public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid) TO authenticated;
COMMIT;
