export interface User {
  id: string;
  email: string;
}

// ================= WORKSPACE TYPES =================

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  my_role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  action: string;
  task_id?: string | null;
  task_title?: string | null;
  created_at: string;
}

// ================= TASK TYPES =================

export interface Task {
  id: string;
  user_id: string;
  workspace_id?: string | null;   
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In-Progress' | 'Completed';
  due_date?: string;
  completed_at?: string | null;
  assignee_email?: string | null; 
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo';
  due_date?: string | null;
  workspace_id?: string | null;   
  assignee_email?: string | null; 
}

export interface UpdateTaskInput {
  status?: 'Todo' | 'In-Progress' | 'Completed';
  completed_at?: string | null;
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  assignee_email?: string | null; 
}

// ================= ANALYTICS TYPES =================

// Pipeline-driven weekly trend array
export interface WeeklyTrendPoint {
  day: string;
  completed: number;
  created: number;
}

// ETL Payload: Personal metrics
export interface PersonalDashboardStats {
  mode: 'personal';
  tasksCompleted: number;
  tasksCreated: number;
  overdueTasks: number;
  completionRate: number;
  productivityScore: number;
  weeklyTrend: WeeklyTrendPoint[];
}

// ETL Payload: Team metrics
export interface WorkspaceDashboardStats {
  mode: 'workspace';
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeMembers: number;
  healthScore: number;
  weeklyTrend: WeeklyTrendPoint[];
}

// Dashboard can be either mode depending on the toggle
export type DashboardStats = PersonalDashboardStats | WorkspaceDashboardStats;

// ETL Payload: JSON arrays for our new charts
export interface LeaderboardItem {
  email: string;
  completed_tasks: number;
}

export interface WorkloadItem {
  email: string;
  pending_tasks: number;
  overdue_tasks: number;
}

export interface TeamIntelligence {
  leaderboard: LeaderboardItem[];
  workload: WorkloadItem[];
}

// ETL Payload: Pipeline infrastructure health
export interface PipelineHealth {
  status: 'success' | 'failed' | 'running' | 'unknown';
  rows_processed: number;
  run_end: string | null;
}

export interface HeatmapData {
  date: string;
  completed_count: number;
}

// ETL Payload: Action Radar data (Urgent & Stale tasks)
export interface UrgentTask {
  id: string;
  title: string;
  due_date: string;
}

export interface StaleTask {
  id: string;
  title: string;
  updated_at: string;
}

export interface ActionRadarData {
  urgent: UrgentTask[];
  stale: StaleTask[];
}