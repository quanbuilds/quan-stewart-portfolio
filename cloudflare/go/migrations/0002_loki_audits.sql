CREATE TABLE IF NOT EXISTS loki_audits (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  business_hint TEXT NOT NULL,
  last_message_json TEXT NOT NULL DEFAULT '',
  turns_json TEXT NOT NULL DEFAULT '[]',
  insights_json TEXT NOT NULL DEFAULT '[]',
  result_json TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS loki_audits_created_at ON loki_audits(created_at DESC);

CREATE TABLE IF NOT EXISTS loki_text_optins (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  consent_copy TEXT NOT NULL,
  status TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  weekly_enabled INTEGER NOT NULL DEFAULT 0,
  last_inbound_at TEXT NOT NULL DEFAULT '',
  last_proactive_at TEXT NOT NULL DEFAULT '',
  provider_receipt TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (audit_id) REFERENCES loki_audits(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS loki_text_optins_audit ON loki_text_optins(audit_id);
CREATE INDEX IF NOT EXISTS loki_text_optins_phone ON loki_text_optins(phone_e164);

CREATE TABLE IF NOT EXISTS loki_text_messages (
  id TEXT PRIMARY KEY,
  optin_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  provider_receipt TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (optin_id) REFERENCES loki_text_optins(id)
);
