import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Meetings API
export const meetingsAPI = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/meetings', { params }),
  get: (id: string) => api.get(`/meetings/${id}`),
  create: (data: {
    title: string;
    description?: string;
    meetingUrl: string;
    platform: string;
    scheduledAt?: string;
    clickupListId?: string;
  }) => api.post('/meetings', data),
  delete: (id: string) => api.delete(`/meetings/${id}`),
  getStatus: (id: string) => api.get(`/meetings/${id}/status`),
  syncToClickUp: (id: string) => api.post(`/meetings/${id}/sync`),
};

// ClickUp API
export const clickupAPI = {
  getAuthUrl: () => api.get('/clickup/auth'),
  getTeams: () => api.get('/clickup/teams'),
  getSpaces: (teamId: string) => api.get(`/clickup/spaces/${teamId}`),
  getLists: (spaceId: string) => api.get(`/clickup/lists/${spaceId}`),
  disconnect: () => api.post('/clickup/disconnect'),
};

// Billing API
export const billingAPI = {
  getSummary: () => api.get('/billing/summary'),
  purchaseCredits: (hours: number, paymentMethodId: string) =>
    api.post('/billing/purchase', { hours, paymentMethodId }),
  subscribe: (planId: string, paymentMethodId: string) =>
    api.post('/billing/subscribe', { planId, paymentMethodId }),
  cancelSubscription: (immediate: boolean = false) =>
    api.post('/billing/cancel', { immediate }),
  configureAutoTopUp: (enabled: boolean, amount: number) =>
    api.post('/billing/auto-topup', { enabled, amount }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Partial<{ name: string; email: string; company: string }>) =>
    api.put('/users/profile', data),
  updateSettings: (settings: any) => api.put('/users/settings', settings),
  deleteAccount: () => api.delete('/users/account'),
};

// Calendar API
export const calendarAPI = {
  getGoogleAuthUrl: () => api.get('/calendar/google/auth'),
  getConnections: () => api.get('/calendar/connections'),
  syncConnection: (id: string) => api.post(`/calendar/connections/${id}/sync`),
  disconnectCalendar: (id: string) => api.delete(`/calendar/connections/${id}`),
  getUpcomingEvents: (limit?: number) => api.get('/calendar/events', { params: { limit } }),
  getSettings: () => api.get('/calendar/settings'),
  updateSettings: (data: { autoJoinEnabled?: boolean; autoJoinLeadTime?: number }) =>
    api.put('/calendar/settings', data),
};

export default api;
