CREATE TABLE IF NOT EXISTS loki_operators (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  business TEXT NOT NULL,
  goal TEXT NOT NULL,
  audit_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS loki_moves (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  title TEXT NOT NULL,
  evidence TEXT NOT NULL,
  action TEXT NOT NULL,
  metric TEXT NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  outcome TEXT NOT NULL DEFAULT '',
  resolved_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (operator_id) REFERENCES loki_operators(id)
);
CREATE INDEX IF NOT EXISTS loki_moves_operator_created ON loki_moves(operator_id, created_at DESC);
CREATE TABLE IF NOT EXISTS loki_messages (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (operator_id) REFERENCES loki_operators(id)
);
CREATE INDEX IF NOT EXISTS loki_messages_operator_created ON loki_messages(operator_id, created_at DESC);
