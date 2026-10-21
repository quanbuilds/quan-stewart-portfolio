CREATE TABLE IF NOT EXISTS wonplace_site_events (
 id TEXT PRIMARY KEY, created_at TEXT NOT NULL, kind TEXT NOT NULL,
 page TEXT NOT NULL, session_id TEXT NOT NULL, referrer_host TEXT NOT NULL DEFAULT '', device TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS wonplace_site_events_created ON wonplace_site_events(created_at);
