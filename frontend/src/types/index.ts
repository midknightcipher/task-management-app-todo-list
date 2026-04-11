export interface User {
  id: string;
  email: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In-Progress' | 'Completed';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Used when creating a new task
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo';
  due_date?: string | null;
}

// Used when updating a task
export interface UpdateTaskInput {
  status?: 'Todo' | 'In-Progress' | 'Completed';
  completed_at?: string | null;
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
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