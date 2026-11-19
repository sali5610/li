-- CI ONLY: prepare an isolated PostgreSQL 16 DB for ACTUAL PostgREST 16 HTTP.
-- The signed JWT is HS256 with a deliberately published disposable CI secret.
-- This is NOT Neon managed pg_session_jwt or a production migration.
\set ON_ERROR_STOP on
DO $$ BEGIN
 IF current_database()<>'li_idempotency_ci' THEN
  RAISE EXCEPTION 'CI_ONLY_DATABASE_REQUIRED';
 END IF;
END $$;

CREATE ROLE li_ci_authenticator LOGIN NOINHERIT NOBYPASSRLS
 PASSWORD 'li-ci-postgrest-local-only-password';
CREATE ROLE li_ci_anon NOLOGIN NOBYPASSRLS;
GRANT authenticated,li_ci_anon TO li_ci_authenticator;

-- PostgREST sets request.jwt.claims AFTER verifying the test JWT signature.
-- Existing synthetic SQL assertions use li.test_subject, which is only
-- permitted here to keep prior deterministic cases in a throwaway DB.
-- This fallback would be insecure in production; NEVER copy to live Neon.
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
LANGUAGE sql STABLE AS $$
 SELECT COALESCE(
   NULLIF(NULLIF(current_setting('request.jwt.claims',true),'')::jsonb->>'sub',''),
   NULLIF(current_setting('li.test_subject',true),'')
 )
$$;

-- Reinstate the secure RPC-only ACL after the earlier rollback rehearsal.
REVOKE INSERT,UPDATE,DELETE ON public.li_user_state FROM authenticated;
GRANT SELECT ON public.li_user_state TO authenticated;
GRANT EXECUTE ON FUNCTION
 public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)
 TO authenticated;
REVOKE ALL ON FUNCTION
 public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)
 FROM PUBLIC;

SELECT public.ci_assert(
 NOT has_table_privilege('authenticated','public.li_user_state','INSERT') AND
 NOT has_table_privilege('authenticated','public.li_user_state','UPDATE') AND
 NOT has_table_privilege('authenticated','public.li_user_state','DELETE') AND
 has_function_privilege('authenticated',
  'public.li_apply_user_edit_v1(text,text,jsonb,timestamptz,bigint,uuid)','EXECUTE'),
 'PostgREST CI setup secure RPC-only ACL');
SELECT 'LI_CI_POSTGREST_PREFLIGHT_READY' AS marker;
