-- ========================================================
-- 1. OPERATIONAL INDEXES (For live KPI queries)
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- ========================================================
-- 2. REPORTING TABLES (Precomputed OLAP Analytics)
-- ========================================================

CREATE TABLE IF NOT EXISTS user_daily_activity (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  tasks_created INT NOT NULL DEFAULT 0,
  tasks_completed INT NOT NULL DEFAULT 0,
  tasks_deleted INT NOT NULL DEFAULT 0,
  productivity_score NUMERIC(5,2) DEFAULT 0.00,
  PRIMARY KEY (user_id, snapshot_date),
  UNIQUE (user_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS workspace_daily_activity (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  tasks_created INT NOT NULL DEFAULT 0,
  tasks_completed INT NOT NULL DEFAULT 0,
  tasks_deleted INT NOT NULL DEFAULT 0,
  productivity_score NUMERIC(5,2) DEFAULT 0.00,
  PRIMARY KEY (workspace_id, snapshot_date),
  UNIQUE (workspace_id, snapshot_date)
);