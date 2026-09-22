export const schema = [
  `CREATE TABLE IF NOT EXISTS installation (id INTEGER PRIMARY KEY CHECK(id = 1), project_id TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS reviewers (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY, email TEXT, role TEXT NOT NULL CHECK(role IN ('commenter', 'editor')),
    token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES reviewers(id), created_at TEXT NOT NULL, revoked_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS otp_challenges (
    id TEXT PRIMARY KEY, invitation_id TEXT REFERENCES invitations(id), email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'commenter')), code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used_at TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, reviewer_id TEXT NOT NULL REFERENCES reviewers(id),
    role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'commenter')), token_hash TEXT NOT NULL UNIQUE,
    invitation_id TEXT REFERENCES invitations(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS flows (
    id TEXT PRIMARY KEY, family_id TEXT, version INTEGER NOT NULL DEFAULT 1,
    previous_version_id TEXT REFERENCES flows(id), name TEXT NOT NULL, persona TEXT NOT NULL,
    route TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('recording', 'complete')),
    created_by TEXT NOT NULL REFERENCES reviewers(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    board_json TEXT, board_revision INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY, content_type TEXT NOT NULL, size INTEGER NOT NULL,
    storage TEXT NOT NULL CHECK(storage IN ('file', 'database', 'custom')), bytes BLOB,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS discarded_artifacts (
    id TEXT PRIMARY KEY, flow_id TEXT NOT NULL, created_by TEXT NOT NULL,
    storage TEXT NOT NULL CHECK(storage IN ('file', 'custom'))
  )`,
  `CREATE TABLE IF NOT EXISTS steps (
    id TEXT PRIMARY KEY, flow_id TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    title TEXT NOT NULL, route TEXT NOT NULL, screenshot TEXT, position INTEGER NOT NULL,
    created_at TEXT NOT NULL, UNIQUE(flow_id, position)
  )`,
  `CREATE TABLE IF NOT EXISTS board_edges (
    flow_id TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE, id TEXT NOT NULL,
    source_step_id TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    target_step_id TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    label TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('recorded', 'manual')),
    archived_at TEXT, PRIMARY KEY(flow_id, id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY, flow_id TEXT REFERENCES flows(id) ON DELETE CASCADE,
    step_id TEXT REFERENCES steps(id) ON DELETE CASCADE, route TEXT NOT NULL, body TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('open', 'resolved')), author_id TEXT NOT NULL REFERENCES reviewers(id),
    created_at TEXT NOT NULL, resolved_at TEXT, anchor_x REAL, anchor_y REAL,
    parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE, edge_id TEXT
  )`,
  "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_steps_flow ON steps(flow_id, position)",
  "CREATE INDEX IF NOT EXISTS idx_comments_route ON comments(route, created_at)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_invitation ON sessions(invitation_id)",
  "CREATE INDEX IF NOT EXISTS idx_challenges_invitation ON otp_challenges(invitation_id)",
];
