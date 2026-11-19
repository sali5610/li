-- li. (理) G3 approved Free-only private sync schema, revision 0001.
-- No academic content, vectors or personal diary uploaded to this database.
-- Neon Auth + Data API must be provisioned first; auth.user_id() RETURNS text.
-- Login/signup credentials and privileged database roles MUST NOT be in frontend.

BEGIN;

CREATE TABLE IF NOT EXISTS public.li_user_state (
  owner_id text NOT NULL DEFAULT auth.user_id(),
  item_type text NOT NULL CHECK (item_type IN
    ('lesson_attempt', 'review_schedule', 'bookmark', 'note', 'preference', 'l2_progress')),
  item_id text NOT NULL CHECK (length(item_id) BETWEEN 1 AND 180),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
  payload jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (owner_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS li_user_state_owner_changed
  ON public.li_user_state (owner_id, changed_at);

CREATE TABLE IF NOT EXISTS public.li_learning_events (
  owner_id text NOT NULL DEFAULT auth.user_id(),
  event_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  lesson_id text NOT NULL CHECK (length(lesson_id) BETWEEN 1 AND 180),
  method_id text,
  kind text NOT NULL CHECK (length(kind) BETWEEN 1 AND 80),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (owner_id, event_id)
);

CREATE INDEX IF NOT EXISTS li_learning_events_owner_time
  ON public.li_learning_events (owner_id, occurred_at DESC);

-- RLS = actual access control. A client-supplied owner_id has no authority.
ALTER TABLE public.li_user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.li_user_state FORCE ROW LEVEL SECURITY;
ALTER TABLE public.li_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.li_learning_events FORCE ROW LEVEL SECURITY;

-- Anonymous users cannot query any private records via the Data API.
REVOKE ALL ON public.li_user_state FROM PUBLIC, anonymous;
REVOKE ALL ON public.li_learning_events FROM PUBLIC, anonymous;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.li_user_state TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.li_learning_events TO authenticated;

CREATE POLICY li_user_state_select_owner ON public.li_user_state
  FOR SELECT TO authenticated USING (owner_id = (SELECT auth.user_id()));
CREATE POLICY li_user_state_insert_owner ON public.li_user_state
  FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.user_id()));
CREATE POLICY li_user_state_update_owner ON public.li_user_state
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.user_id()))
  WITH CHECK (owner_id = (SELECT auth.user_id()));
CREATE POLICY li_user_state_delete_owner ON public.li_user_state
  FOR DELETE TO authenticated USING (owner_id = (SELECT auth.user_id()));

CREATE POLICY li_learning_events_select_owner ON public.li_learning_events
  FOR SELECT TO authenticated USING (owner_id = (SELECT auth.user_id()));
CREATE POLICY li_learning_events_insert_owner ON public.li_learning_events
  FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.user_id()));
CREATE POLICY li_learning_events_delete_owner ON public.li_learning_events
  FOR DELETE TO authenticated USING (owner_id = (SELECT auth.user_id()));

COMMIT;

-- Future sync implementation MUST use per-item revision conditions and
-- a durable IndexedDB offline outbox; this schema alone does not sync devices.
-- Tombstones use deleted_at, to avoid resurrecting deleted remote records.
-- Do NOT put diary into item_type without distinct remote-consent PO gate.
-- Verify actual user A/B JWT RLS isolation before app goes live.
