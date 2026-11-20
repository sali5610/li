-- Step 17: single transferable AI entitlement; Cloudflare D1 Free only.
-- Configure as binding LI_AI_DB on the existing Pages project.
-- Does not touch Neon accounts, personal progress, or learning content.
-- Execute ONLY on a separately approved Cloudflare release, not staging.
CREATE TABLE IF NOT EXISTS li_ai_control (
 singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
 enabled_email TEXT,
 requests_day TEXT NOT NULL DEFAULT '',
 requests_count INTEGER NOT NULL DEFAULT 0 CHECK (requests_count >= 0)
);
INSERT OR IGNORE INTO li_ai_control(singleton, enabled_email)
VALUES (1, NULL);
-- AI is disabled until the verified owner's account enables it.
-- Never insert private user emails or secrets in this public migration.
