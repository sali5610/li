-- Separate STAGING D1, not the live Neon learner database.
-- Endpoint, auth and p256dh are private device delivery credentials.
CREATE TABLE IF NOT EXISTS push_subscriptions (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL,
 endpoint TEXT NOT NULL,
 p256dh TEXT NOT NULL,
 auth TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('study','sleep','movement','rest')),
 local_time TEXT NOT NULL,
 zone TEXT NOT NULL,
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
 last_day TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_push_enabled ON push_subscriptions(enabled);
CREATE INDEX IF NOT EXISTS idx_push_owner ON push_subscriptions(owner_id);
