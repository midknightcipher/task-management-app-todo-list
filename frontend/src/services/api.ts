import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://task-management-backend-mo32.onrender.com/api';

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

export const authAPI = {
  signup: (email: string, password: string) =>
    apiClient.post('/auth/signup', { email, password }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
};

export const tasksAPI = {
  create: (taskData: any) => apiClient.post('/tasks', taskData),
  getAll: (priority?: string, status?: string) =>
    apiClient.get('/tasks', { params: { priority, status } }),
  getById: (id: string) => apiClient.get(`/tasks/${id}`),
  update: (id: string, updateData: any) => apiClient.put(`/tasks/${id}`, updateData),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  toggle: (id: string) => apiClient.patch(`/tasks/${id}/toggle`),
};

export const analyticsAPI = {
  getDashboardStats: () => apiClient.get('/analytics/dashboard'),
  getPriorityAnalytics: () => apiClient.get('/analytics/priority'),
  getProductivityHeatmap: () => apiClient.get('/analytics/heatmap'),
};