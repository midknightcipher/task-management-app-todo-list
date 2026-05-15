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
  assignee_email?: string | null; // ✅ Added
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
  assignee_email?: string | null; // ✅ Added
}

export interface UpdateTaskInput {
  status?: 'Todo' | 'In-Progress' | 'Completed';
  completed_at?: string | null;
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  assignee_email?: string | null; // ✅ Added
}

// ================= ANALYTICS TYPES =================

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