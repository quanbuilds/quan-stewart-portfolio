-- Anonymous, bounded product events; never form text, credentials, IPs or URLs with queries.
CREATE TABLE IF NOT EXISTS site_events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('page_view','section_view','audit_open','app_open','contact_open')),
  page TEXT NOT NULL CHECK (page IN ('home','audit','services','about','contact','app')),
  session_id TEXT NOT NULL,
  referrer_host TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL CHECK (device IN ('phone','tablet','desktop'))
);
CREATE INDEX IF NOT EXISTS site_events_created ON site_events(created_at);
CREATE INDEX IF NOT EXISTS site_events_kind_session ON site_events(kind,session_id,created_at);
