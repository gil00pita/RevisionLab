export const schema = [
  `CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1), settings_json TEXT NOT NULL,
    secrets_ciphertext TEXT, secret_names TEXT NOT NULL DEFAULT '[]',
    revision INTEGER NOT NULL DEFAULT 0, email_status TEXT, slack_status TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS workspace_history (
    id TEXT PRIMARY KEY, action TEXT NOT NULL, actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL, snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL, expires_at TEXT NOT NULL, committed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS workspace_history_artifacts (
    history_id TEXT NOT NULL REFERENCES workspace_history(id) ON DELETE CASCADE,
    artifact_id TEXT NOT NULL REFERENCES artifacts(id),
    PRIMARY KEY(history_id, artifact_id)
  )`,
  `CREATE TABLE IF NOT EXISTS workspace_api_keys (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('editor', 'commenter')),
    created_by TEXT NOT NULL REFERENCES reviewers(id), created_at TEXT NOT NULL, revoked_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS workspace_instances (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
    instance_id TEXT NOT NULL UNIQUE, api_path TEXT NOT NULL, base_path TEXT NOT NULL,
    api_key TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS setup_progress (
    id INTEGER PRIMARY KEY CHECK(id = 1), step INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0, name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '', notifications_step_added INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS workspace_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    show_comment_bubbles INTEGER NOT NULL DEFAULT 1 CHECK(show_comment_bubbles IN (0, 1)),
    comment_bubble_color TEXT NOT NULL DEFAULT 'blue'
      CHECK(comment_bubble_color IN ('gray', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink')),
    system_url TEXT, allowed_email_rules TEXT NOT NULL DEFAULT '[]',
    join_code_hash TEXT, join_code_created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '', archived_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
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
    invitation_id TEXT REFERENCES invitations(id), membership_id TEXT,
    membership_revision INTEGER, expires_at TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS workspace_memberships (
    id TEXT PRIMARY KEY, reviewer_id TEXT REFERENCES reviewers(id), email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'commenter')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'active', 'suspended', 'removed')),
    revision INTEGER NOT NULL DEFAULT 1, source TEXT NOT NULL,
    invited_by TEXT REFERENCES reviewers(id), created_at TEXT NOT NULL, activated_at TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS login_challenges (
    id TEXT PRIMARY KEY, membership_id TEXT REFERENCES workspace_memberships(id),
    email TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, return_to TEXT NOT NULL,
    expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS persona_credentials (
    persona_id TEXT PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
    username_ciphertext TEXT NOT NULL, password_ciphertext TEXT NOT NULL,
    updated_at TEXT NOT NULL, updated_by TEXT NOT NULL REFERENCES reviewers(id)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY, actor_id TEXT REFERENCES reviewers(id), action TEXT NOT NULL,
    target_type TEXT NOT NULL, target_id TEXT, created_at TEXT NOT NULL
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
    created_at TEXT NOT NULL, capture_json TEXT, capture_key TEXT, UNIQUE(flow_id, position)
  )`,
  `CREATE TABLE IF NOT EXISTS recording_visits (
    id TEXT PRIMARY KEY, flow_id TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    source_step_id TEXT REFERENCES steps(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, interaction_json TEXT, UNIQUE(flow_id, position)
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
    parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE, edge_id TEXT, element_anchor TEXT
  )`,
  "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_steps_flow ON steps(flow_id, position)",
  "CREATE INDEX IF NOT EXISTS idx_comments_route ON comments(route, created_at)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_invitation ON sessions(invitation_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_membership ON sessions(membership_id)",
  "CREATE INDEX IF NOT EXISTS idx_challenges_invitation ON otp_challenges(invitation_id)",
  "CREATE INDEX IF NOT EXISTS idx_workspace_history_expiry ON workspace_history(expires_at, created_at)",
  "CREATE INDEX IF NOT EXISTS idx_workspace_history_artifacts ON workspace_history_artifacts(artifact_id)",
  "CREATE INDEX IF NOT EXISTS idx_login_challenges_email ON login_challenges(email, created_at)",
];
