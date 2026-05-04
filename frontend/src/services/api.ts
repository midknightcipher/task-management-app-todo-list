import axios, { AxiosInstance } from 'axios';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  DashboardStats,
  PriorityBreakdown,
  HeatmapData,
  User,
} from '../types';
import { authService } from './auth';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://task-management-backend-mo32.onrender.com/api';

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

  getAll: (priority?: string, status?: string) =>
    apiClient.get<Task[]>('/tasks', { params: { priority, status } }),

  getById: (id: string) =>
    apiClient.get<Task>(`/tasks/${id}`),

  update: (id: string, updateData: UpdateTaskInput) =>
    apiClient.put<Task>(`/tasks/${id}`, updateData),

  delete: (id: string) =>
    apiClient.delete(`/tasks/${id}`),

  toggle: (id: string) =>
    apiClient.patch<Task>(`/tasks/${id}/toggle`),
};

// ================= ANALYTICS =================
export const analyticsAPI = {
  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/analytics/dashboard'),

  getPriorityAnalytics: () =>
    apiClient.get<PriorityBreakdown[]>('/analytics/priority'),

  getProductivityHeatmap: () =>
    apiClient.get<HeatmapData[]>('/analytics/heatmap'),
};

// ================= WORKSPACES =================
export const workspaceAPI = {
  getAll: () =>
    apiClient.get('/workspaces'),

  create: (name: string) =>
    apiClient.post('/workspaces', { name }),

  getTasks: (workspaceId: string) =>
    apiClient.get('/tasks', {
      params: { workspace_id: workspaceId }
    }),

  invite: (workspaceId: string, email: string) =>
    apiClient.post(`/workspaces/${workspaceId}/invite`, { email }),
};