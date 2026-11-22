-- li. (理) — 30 owner-approved accounts maximum, INCLUDING the owner.
-- New authorization is still the existing verified-email invite list.
-- This migration is SOURCE ONLY: do not apply to production without PO G4 release approval.
-- Depends on db/migrations/0002_invite_only_access.sql.
-- Existing invitations and learner data are not modified.
--
-- Capacity counts unrevoked, approved EMAILS (not Google OAuth identities,
-- which may exist without approval). Revocation frees one slot.
-- Browser, anonymous, and authenticated roles cannot read/write the list or
-- execute the owner-only approval routine.

BEGIN;

-- Stop without changing anything if the existing allowlist already exceeds
-- the cap. Never silently revoke real learners to make room.
DO $li_cap_preflight$
BEGIN
  IF (SELECT count(*) FROM public.li_invited_emails WHERE revoked_at IS NULL) > 30 THEN
    RAISE EXCEPTION USING
      MESSAGE = 'LI_INVITE_CAP_PREEXISTING_OVER_30',
      ERRCODE = '23514';
  END IF;
END
$li_cap_preflight$;

-- Enforce the cap for ALL approval paths, including direct SQL inserts,
-- updates that reactivate a revoked email, and concurrent administrators.
-- AFTER triggers are intentional: on INSERT .. ON CONFLICT DO UPDATE, a BEFORE
-- INSERT trigger would incorrectly reject a duplicate at 30/30.
CREATE FUNCTION public.li_invite_cap_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $li_cap_guard$
BEGIN
  IF NEW.revoked_at IS NULL THEN
    -- Held until transaction end. A concurrent 31st approval waits and then
    -- observes the first transaction's committed invitation.
    PERFORM pg_catalog.pg_advisory_xact_lock(5610, 30);
    IF (SELECT count(*) FROM public.li_invited_emails WHERE revoked_at IS NULL) > 30 THEN
      RAISE EXCEPTION USING
        MESSAGE = 'LI_INVITE_CAP_REACHED_30',
        ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END
$li_cap_guard$;

CREATE TRIGGER li_invite_cap_30_enforced
AFTER INSERT OR UPDATE ON public.li_invited_emails
FOR EACH ROW
WHEN (NEW.revoked_at IS NULL)
EXECUTE FUNCTION public.li_invite_cap_guard();

-- A single owner-only approval command returns the remaining slots. It is
-- SECURITY INVOKER and cannot bypass existing allowlist table privileges.
-- Re-approving an already-active email does not use an extra slot.
CREATE FUNCTION public.li_approve_invite(p_email text)
RETURNS TABLE (approved_accounts integer, remaining_accounts integer, newly_approved boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $li_approve$
DECLARE
  normalized_email text := lower(btrim(p_email));
  was_active boolean;
  total integer;
BEGIN
  IF normalized_email IS NULL
     OR length(normalized_email) NOT BETWEEN 5 AND 254
     OR position('@' in normalized_email) <= 1 THEN
    RAISE EXCEPTION USING MESSAGE = 'LI_INVITE_EMAIL_INVALID', ERRCODE = '22023';
  END IF;

  -- Same transactional lock as the direct-write guard: no racing approvals.
  PERFORM pg_catalog.pg_advisory_xact_lock(5610, 30);
  SELECT EXISTS (
    SELECT 1 FROM public.li_invited_emails
    WHERE email = normalized_email AND revoked_at IS NULL
  ) INTO was_active;

  SELECT count(*)::integer INTO total
  FROM public.li_invited_emails WHERE revoked_at IS NULL;
  IF NOT was_active AND total >= 30 THEN
    RAISE EXCEPTION USING
      MESSAGE = 'LI_INVITE_CAP_REACHED_30',
      ERRCODE = '23514';
  END IF;

  INSERT INTO public.li_invited_emails(email, revoked_at)
  VALUES (normalized_email, NULL)
  ON CONFLICT (email) DO UPDATE SET revoked_at = NULL;

  SELECT count(*)::integer INTO total
  FROM public.li_invited_emails WHERE revoked_at IS NULL;
  RETURN QUERY SELECT total, 30 - total, NOT was_active;
END
$li_approve$;

-- Functions default to PUBLIC EXECUTE in PostgreSQL. Lock down both explicitly.
-- A trusted Neon database owner invokes li_approve_invite via a privileged
-- connection/SQL editor. Neither function is an end-user Data API RPC.
REVOKE ALL ON FUNCTION public.li_invite_cap_guard() FROM PUBLIC, anonymous, authenticated;
REVOKE ALL ON FUNCTION public.li_approve_invite(text) FROM PUBLIC, anonymous, authenticated;

COMMIT;

-- OWNER-ONLY APPROVAL (execute in the trusted Neon SQL editor; NEVER the browser):
-- SELECT * FROM public.li_approve_invite('new.person@example.com');
--
-- Example output AFTER approving the 12th account (owner counts as one):
-- approved_accounts | remaining_accounts | newly_approved
--                12 |                 18 | true
--
-- Already active email: same count, newly_approved=false.
-- 31st distinct active email: LI_INVITE_CAP_REACHED_30; no approval committed.
-- To release a slot, use the existing owner-controlled revoke operation:
-- UPDATE public.li_invited_emails SET revoked_at = now()
-- WHERE email = lower(btrim('existing.person@example.com'));
--
-- READ-ONLY count:
-- SELECT count(*) AS approved_accounts,
--        30 - count(*) AS remaining_accounts
-- FROM public.li_invited_emails WHERE revoked_at IS NULL;
--
-- Before applying to production: run focused TEMP/test Neon branch checks for
-- 29->30 success, 30->31 denial, duplicate at 30, revoke/re-approve,
-- concurrent approvals, anon/authenticated EXECUTE denial, and RLS isolation.
