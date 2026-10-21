CREATE TABLE IF NOT EXISTS loki_waitlist (
  phone TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'loki-app',
  consent_version TEXT NOT NULL DEFAULT 'launch-notification-v1'
);
