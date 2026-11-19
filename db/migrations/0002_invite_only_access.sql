-- li. Step16: OWNER-APPROVED email allowlist, even when Google OAuth authenticates.
-- Applied to Neon Free main on 2026-11-19 after temporary-branch verification.
-- Source remains versioned on DRAFT PR #124; no website release or live JWT test.
-- Depends on 0001_private_user_sync.sql and Neon Managed Better Auth.
-- DO NOT place actual learner emails or admin credentials into public GitHub.
-- NOTE: Google OAuth may still create an Auth identity. RLS authorizes ONLY
-- verified emails explicitly approved by the owner, and denies everybody else.
BEGIN;

CREATE TABLE IF NOT EXISTS public.li_invited_emails (
  email text PRIMARY KEY,
  invited_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (
    email = lower(btrim(email))
    AND length(email) BETWEEN 5 AND 254
    AND position('@' in email) > 1
  )
);

-- The browser must NEVER enumerate, insert, update or revoke invitations.
REVOKE ALL ON public.li_invited_emails FROM PUBLIC, anonymous, authenticated;

-- A verified provider identity must match an unrevoked exact invited email.
-- Check the authenticated user ID IN NEON AUTH DB, not client-supplied email,
-- request body, account name, unverified JWT email or UI state.
CREATE OR REPLACE FUNCTION public.li_is_invited()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $li_invite$
  SELECT EXISTS (
    SELECT 1
    FROM public.li_invited_emails AS allowed
    INNER JOIN neon_auth."user" AS verified_user
      ON lower(btrim(verified_user.email)) = allowed.email
    WHERE verified_user.id::text = auth.user_id()
      AND verified_user."emailVerified" IS TRUE
      AND allowed.revoked_at IS NULL
  )
$li_invite$;

REVOKE ALL ON FUNCTION public.li_is_invited() FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.li_is_invited() TO authenticated;

-- Restrictive RLS policies are AND-ed with 0001 owner-only policies.
-- A new permissive owner policy can NEVER bypass these restrictions.
CREATE POLICY li_user_state_invited_only ON public.li_user_state
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.li_is_invited()))
  WITH CHECK ((SELECT public.li_is_invited()));

CREATE POLICY li_learning_events_invited_only ON public.li_learning_events
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.li_is_invited()))
  WITH CHECK ((SELECT public.li_is_invited()));

COMMIT;

-- INITIAL INVITES (owner-controlled operations, NOT here):
--   INSERT INTO public.li_invited_emails(email)
--   VALUES (lower(btrim($1))) ON CONFLICT (email)
--   DO UPDATE SET revoked_at = NULL;
-- REVOKE: UPDATE public.li_invited_emails SET revoked_at = now()
--         WHERE email = lower(btrim($1));
-- Neither action is exposed via the anonymous/authenticated Data API.
--
-- Required tests before any remote user-data sync or first release:
-- 1) verified invited A and B have independent rows and owner-only access
-- 2) third-party Google login with uninvited C cannot read/write either table
-- 3) unverified identity cannot read/write even if email was invited
-- 4) revoked A is rejected immediately by Data API even with an old valid JWT
-- 5) browser RPC li_is_invited() returns true only for verified invitees
-- 6) malicious forged owner_id requests fail, and synthetic rows are cleaned up
--
-- Beware: Cloudflare Pages static assets remain public unless protected at
-- the edge (e.g. Cloudflare Access). This RLS protects private data, not JS/CSS.
