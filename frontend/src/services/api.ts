import axios, { AxiosInstance } from 'axios';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  DashboardStats,
  PriorityBreakdown,
  HeatmapData,
  User,
  Workspace,
  WorkspaceMember,
  ActivityLog,
  Comment,
} from '../types';
import { authService } from './auth';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://task-management-backend-mo32.onrender.com/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User; workspace: Workspace }>(
      '/auth/signup',
      { email, password }
    ),
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    }),
};

export interface GetTasksParams {
  workspaceId: string;
  priority?: string;
  status?: string;
}

export const tasksAPI = {
  create: (taskData: CreateTaskInput) =>
    apiClient.post<Task>('/tasks', taskData),
  getAll: ({ workspaceId, priority, status }: GetTasksParams) =>
    apiClient.get<Task[]>('/tasks', {
      params: { workspace_id: workspaceId, priority, status },
    }),
  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  update: (id: string, updateData: UpdateTaskInput) =>
    apiClient.put<Task>(`/tasks/${id}`, updateData),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  toggle: (id: string) => apiClient.patch<Task>(`/tasks/${id}/toggle`),
};

export const analyticsAPI = {
  getDashboardStats: (workspaceId?: string) =>
    apiClient.get<DashboardStats>('/analytics/dashboard', {
      params: workspaceId ? { workspace_id: workspaceId } : {},
    }),
  getPriorityAnalytics: (workspaceId?: string) =>
    apiClient.get<PriorityBreakdown[]>('/analytics/priority', {
      params: workspaceId ? { workspace_id: workspaceId } : {},
    }),
  getProductivityHeatmap: (workspaceId?: string) =>
    apiClient.get<HeatmapData[]>('/analytics/heatmap', {
      params: workspaceId ? { workspace_id: workspaceId } : {},
    }),
};

export const workspaceAPI = {
  create: (name: string) =>
    apiClient.post<Workspace>('/workspace', { name }),
  getAll: () => apiClient.get<Workspace[]>('/workspace'),
  invite: (workspace_id: string, email: string, role: string = 'member') =>
    apiClient.post<WorkspaceMember>('/workspace/invite', {
      workspace_id,
      email,
      role,
    }),
  getMembers: (workspaceId: string) =>
    apiClient.get<WorkspaceMember[]>(`/workspace/${workspaceId}/members`),
};

export const activityAPI = {
  getWorkspaceActivity: (workspaceId: string, limit?: number) =>
    apiClient.get<ActivityLog[]>('/activity', {
      params: { workspaceId, limit },
    }),
  getTaskActivity: (taskId: string) =>
    apiClient.get<ActivityLog[]>('/activity/task', {
      params: { taskId },
    }),
};

export const commentsAPI = {
  getByTask: (taskId: string) =>
    apiClient.get<Comment[]>('/comments', { params: { taskId } }),
  create: (task_id: string, content: string) =>
    apiClient.post<Comment>('/comments', { task_id, content }),
  delete: (id: string) => apiClient.delete(`/comments/${id}`),
};
