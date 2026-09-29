CREATE TABLE IF NOT EXISTS contact_inquiries (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL,
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_detail TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS contact_inquiries_submitted_at
  ON contact_inquiries (submitted_at DESC);
