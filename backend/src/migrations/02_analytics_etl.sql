-- Active: 1779345926787@@ep-quiet-boat-aoo7e692-pooler.c-2.ap-southeast-1.aws.neon.tech@5432@neondb@public
-- ========================================================
-- 1. OPERATIONAL INDEXES (Crucial for micro-batch ETL)
-- ========================================================
-- Allows the Python worker to instantly find tasks modified in the last 15 minutes
CREATE INDEX
IF NOT EXISTS idx_tasks_updated_at ON tasks
(updated_at);
-- Composite indexes for lightning-fast ETL aggregations
CREATE INDEX
IF NOT EXISTS idx_tasks_user_updated ON tasks
(user_id, updated_at);
CREATE INDEX
IF NOT EXISTS idx_tasks_workspace_updated ON tasks
(workspace_id, updated_at);

-- ========================================================
-- 2. REPORTING TABLES (Precomputed Analytics)
-- ========================================================

-- Personal Analytics Table
CREATE TABLE
IF NOT EXISTS user_daily_metrics
(
  user_id UUID NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
  metric_date DATE
NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  completion_rate NUMERIC
(5,2) DEFAULT 0.00,
  productivity_score INTEGER DEFAULT 0,
  avg_completion_time_hrs NUMERIC
(7,2) DEFAULT 0.00,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- The composite unique key enables our UPSERT strategy
  UNIQUE
(user_id, metric_date)
);

-- Workspace Analytics Table
CREATE TABLE
IF NOT EXISTS workspace_daily_metrics
(
  workspace_id UUID NOT NULL REFERENCES workspaces
(id) ON
DELETE CASCADE,
  metric_date DATE
NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  overdue_percentage NUMERIC
(5,2) DEFAULT 0.00,
  workspace_health_score INTEGER DEFAULT 0,
  -- JSONB is perfect for frontend charts (leaderboards, workload donuts)
  leaderboard_data JSONB DEFAULT '[]'::jsonb,
  workload_distribution JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE
(workspace_id, metric_date)
);

-- ETL Pipeline Health Table
CREATE TABLE
IF NOT EXISTS etl_pipeline_logs
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  run_start TIMESTAMP NOT NULL,
  run_end TIMESTAMP,
  status VARCHAR
(20) CHECK
(status IN
('running', 'success', 'failed')),
  rows_processed INTEGER DEFAULT 0,
  error_message TEXT
);