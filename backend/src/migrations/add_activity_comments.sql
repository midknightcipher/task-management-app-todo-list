-- ═══════════════════════════════════════════════════════════
-- Migration: Add Activity Logs + Comments
-- Run on existing databases that already have workspaces
-- ═══════════════════════════════════════════════════════════

-- Ensure workspace_id is NOT NULL on tasks (backfill first)
DO $$
DECLARE
  u RECORD;
  ws_id UUID;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    IF NOT EXISTS (SELECT 1 FROM workspace_members WHERE user_id = u.id) THEN
      ws_id := gen_random_uuid();
      INSERT INTO workspaces (id, name, owner_id) VALUES (ws_id, 'My Workspace', u.id);
      INSERT INTO workspace_members (id, workspace_id, user_id, role)
        VALUES (gen_random_uuid(), ws_id, u.id, 'owner');
      UPDATE tasks SET workspace_id = ws_id WHERE user_id = u.id AND workspace_id IS NULL;
    ELSE
      SELECT wm.workspace_id INTO ws_id
        FROM workspace_members wm WHERE wm.user_id = u.id ORDER BY wm.created_at ASC LIMIT 1;
      UPDATE tasks SET workspace_id = ws_id WHERE user_id = u.id AND workspace_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  meta JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- New indexes
CREATE INDEX IF NOT EXISTS idx_activity_workspace ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_task      ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_created   ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_task      ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_created   ON comments(created_at ASC);
