CREATE TABLE IF NOT EXISTS crm_intake_receipts (
  kind TEXT NOT NULL CHECK(kind IN ('contact','waitlist')),
  source_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','linked','review')),
  crm_contact_id TEXT,
  crm_account_id TEXT,
  last_attempt_at TEXT NOT NULL,
  error_code TEXT NOT NULL DEFAULT '',
  PRIMARY KEY(kind,source_id)
);
CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('audit_started','audit_saved','contact_submitted','waitlist_joined')),
  session_id TEXT NOT NULL,
  device TEXT NOT NULL CHECK(device IN ('phone','tablet','desktop'))
);
CREATE INDEX IF NOT EXISTS conversion_events_created ON conversion_events(created_at,kind,session_id);
