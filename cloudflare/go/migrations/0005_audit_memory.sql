-- Email is a contact address, not proof of identity. Audit tokens still authorize access.
CREATE TABLE IF NOT EXISTS loki_audit_saves (
  audit_id TEXT PRIMARY KEY REFERENCES loki_audits(id),
  email TEXT NOT NULL,
  workspace_path TEXT NOT NULL UNIQUE,
  crm_contact_id TEXT NOT NULL,
  crm_account_id TEXT NOT NULL,
  saved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS loki_audit_saves_email ON loki_audit_saves(email);
CREATE TABLE IF NOT EXISTS loki_memory_files (
  audit_id TEXT NOT NULL REFERENCES loki_audits(id),
  path TEXT NOT NULL,
  content TEXT NOT NULL CHECK(json_valid(content)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(audit_id,path)
);
