-- Migration: Add Workspace Collaboration
-- Run this on existing databases (fresh installs should use init.sql instead)

-- Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Members Table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, user_id)
);

-- Add workspace_id and assigned_to to tasks (nullable for existing rows)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);

-- Backfill: create a personal workspace for every existing user who doesn't have one
DO $$
DECLARE
  u RECORD;
  ws_id UUID;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    IF NOT EXISTS (
      SELECT 1 FROM workspace_members WHERE user_id = u.id
    ) THEN
      ws_id := gen_random_uuid();
      INSERT INTO workspaces (id, name, owner_id) VALUES (ws_id, 'My Workspace', u.id);
      INSERT INTO workspace_members (id, workspace_id, user_id, role)
        VALUES (gen_random_uuid(), ws_id, u.id, 'owner');
      -- Assign existing tasks to that workspace
      UPDATE tasks SET workspace_id = ws_id WHERE user_id = u.id AND workspace_id IS NULL;
    END IF;
  END LOOP;
END $$;
