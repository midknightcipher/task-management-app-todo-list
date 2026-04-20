export interface User {
  id: string;
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  email: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  workspace_id: string;
  assigned_to?: string | null;
  assigned_email?: string | null;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In-Progress' | 'Completed';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  workspace_id: string;
  assigned_to?: string | null;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo';
  due_date?: string | null;
}

export interface UpdateTaskInput {
  assigned_to?: string | null;
  status?: 'Todo' | 'In-Progress' | 'Completed';
  completed_at?: string | null;
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  task_id: string | null;
  user_id: string;
  action:
    | 'task_created'
    | 'task_updated'
    | 'status_changed'
    | 'task_assigned'
    | 'task_deleted'
    | 'comment_added';
  meta: Record<string, any> | null;
  created_at: string;
  user_email: string;
  task_title?: string | null;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_email: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface PriorityBreakdown {
  name: string;
  value: number;
}

export interface HeatmapData {
  date: string;
  completed_count: number;
}
