import axios, { AxiosInstance } from 'axios';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  DashboardStats,
  HeatmapData,
  Workspace,
  WorkspaceMember,
  WorkspaceActivity,
  User,
  ActionRadarData,
} from '../types';
import { authService } from './auth';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5001/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
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

// ================= AUTH =================
export const authAPI = {
  signup: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/signup', { email, password }),

  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }),
};

// ================= TASKS =================
export const tasksAPI = {
  create: (taskData: CreateTaskInput) =>
    apiClient.post<Task>('/tasks', taskData),

  getAll: (priority?: string, status?: string, workspace_id?: string) =>
    apiClient.get<Task[]>('/tasks', { params: { priority, status, workspace_id } }),

  getById: (id: string) =>
    apiClient.get<Task>(`/tasks/${id}`),

  update: (id: string, updateData: UpdateTaskInput) =>
    apiClient.put<Task>(`/tasks/${id}`, updateData),

  delete: (id: string) =>
    apiClient.delete(`/tasks/${id}`),

  toggle: (id: string) =>
    apiClient.patch<Task>(`/tasks/${id}/toggle`),
};

// ================= ANALYTICS (ETL-Powered) =================
export const analyticsAPI = {
  // Reads from user_daily_metrics or workspace_daily_metrics
  getDashboardStats: (workspace_id?: string) =>
    apiClient.get<DashboardStats>('/analytics/dashboard', { params: { workspace_id } }),


  // Keeps existing real-time DB logic for now
  getProductivityHeatmap: (workspace_id?: string) =>
    apiClient.get<HeatmapData[]>('/analytics/heatmap', { params: { workspace_id } }),

  // Fetch the Action Radar lists (urgent/stale tasks)
  getActionRadar: (workspace_id?: string) =>
    apiClient.get<ActionRadarData>('/analytics/action-radar', { params: { workspace_id } }),
};

// ================= WORKSPACES =================
export const workspaceAPI = {
  getAll: () =>
    apiClient.get<Workspace[]>('/workspaces'),

  create: (name: string) =>
    apiClient.post<Workspace>('/workspaces', { name }),

  getById: (id: string) =>
    apiClient.get<Workspace>(`/workspaces/${id}`),

  // Added delete method to resolve TS2339 error
  delete: (id: string) =>
    apiClient.delete(`/workspaces/${id}`),

  getMembers: (workspaceId: string) =>
    apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),

  invite: (workspaceId: string, email: string) =>
    apiClient.post(`/workspaces/${workspaceId}/invite`, { email }),

  // memberId (User ID) is used to match your backend's delete route
  removeMember: (workspaceId: string, memberId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`),

  getActivity: (workspaceId: string) =>
    apiClient.get<WorkspaceActivity[]>(`/workspaces/${workspaceId}/activity`),
};