import axios, { AxiosInstance } from 'axios';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Workspace,
  WorkspaceMember,
  WorkspaceActivity,
  User,
  ActionRadarData,
} from '../types';
import { authService } from './auth';

export interface LiveKPIs {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface TrendData {
  date: string;
  tasks_created: number;
  tasks_completed: number;
  productivity_score: number;
}

export interface HeatmapPoint {
  date: string;
  count: number;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

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
  signup: (email: string, password: string) => apiClient.post<{ token: string; user: User }>('/auth/signup', { email, password }),
  login: (email: string, password: string) => apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }),
};

export const tasksAPI = {
  create: (taskData: CreateTaskInput) => apiClient.post<Task>('/tasks', taskData),
  getAll: (priority?: string, status?: string, workspace_id?: string) => apiClient.get<Task[]>('/tasks', { params: { priority, status, workspace_id } }),
  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  update: (id: string, updateData: UpdateTaskInput) => apiClient.put<Task>(`/tasks/${id}`, updateData),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  toggle: (id: string) => apiClient.patch<Task>(`/tasks/${id}/toggle`),
};

export const analyticsAPI = {
  getKPIs: () => apiClient.get<LiveKPIs>('/analytics/kpis'),
  getWorkspaceKPIs: (workspaceId: string) => apiClient.get<LiveKPIs>(`/analytics/workspace/${workspaceId}/kpis`),
  getTrends: (range: string = '30d', workspace_id?: string) => apiClient.get<TrendData[]>('/analytics/trends', { params: { range, workspace_id } }),
  getHeatmap: (year?: number, workspace_id?: string) => apiClient.get<HeatmapPoint[]>('/analytics/heatmap', { params: { year, workspace_id } }),
  getActionRadar: (workspace_id?: string) => apiClient.get<ActionRadarData>('/analytics/action-radar', { params: { workspace_id } }),
};

export const workspaceAPI = {
  getAll: () => apiClient.get<Workspace[]>('/workspaces'),
  create: (name: string) => apiClient.post<Workspace>('/workspaces', { name }),
  getById: (id: string) => apiClient.get<Workspace>(`/workspaces/${id}`),
  delete: (id: string) => apiClient.delete(`/workspaces/${id}`),
  getMembers: (workspaceId: string) => apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  invite: (workspaceId: string, email: string) => apiClient.post(`/workspaces/${workspaceId}/invite`, { email }),
  removeMember: (workspaceId: string, memberId: string) => apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  getActivity: (workspaceId: string) => apiClient.get<WorkspaceActivity[]>(`/workspaces/${workspaceId}/activity`),
};