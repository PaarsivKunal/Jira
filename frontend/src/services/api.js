import axios from 'axios';

// Use environment variable or default to /api (works with Nginx proxy)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// ======================
// Interceptors
// ======================

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ======================
// Auth
// ======================
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) =>
  api.put(`/auth/reset-password/${token}`, { password });

// ======================
// Organizations
// ======================
export const checkDomain = (domain) =>
  api.get('/organizations/check-domain', { params: { domain } });

export const getMyOrganization = () =>
  api.get('/organizations/me');

export const createOrganization = (data) =>
  api.post('/organizations', data);

// ======================
// Microsoft Integration
// ======================
export const getMicrosoftAuthUrl = (integrationType) =>
  api.get(`/microsoft/auth-url?integrationType=${integrationType}`);

export const getIntegrationStatus = () =>
  api.get('/microsoft/status');

export const getUserTeams = () =>
  api.get('/microsoft/teams');

export const getTeamChannels = (teamId) =>
  api.get(`/microsoft/teams/${teamId}/channels`);

export const configureTeamsChannel = (data) =>
  api.post('/microsoft/teams/configure', data);

export const updateIntegrationSettings = (settings) =>
  api.put('/microsoft/settings', settings);

export const disconnectIntegration = (type) =>
  api.post('/microsoft/disconnect', { type });

// ======================
// Projects
// ======================
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const getProjectStats = (id) => api.get(`/projects/${id}/stats`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// ======================
// Issues
// ======================
export const getIssues = (params) => api.get('/issues', { params });
export const getIssue = (id) => api.get(`/issues/${id}`);
export const createIssue = (data) => api.post('/issues', data);
export const updateIssue = (id, data) => api.put(`/issues/${id}`, data);
export const deleteIssue = (id) => api.delete(`/issues/${id}`);
export const updateIssueStatus = (id, status) =>
  api.patch(`/issues/${id}/status`, { status });

export const approveIssue = (id, comment) =>
  api.post(`/issues/${id}/approve`, { comment });

export const rejectIssue = (id, comment) =>
  api.post(`/issues/${id}/reject`, { comment });

// ======================
// Comments
// ======================
export const getComments = (issueId) =>
  api.get(`/comments/issues/${issueId}/comments`);

export const createComment = (issueId, content) =>
  api.post(`/comments/issues/${issueId}/comments`, { content });

export const updateComment = (id, content) =>
  api.put(`/comments/${id}`, { content });

export const deleteComment = (id) =>
  api.delete(`/comments/${id}`);

// ======================
// Work Logs
// ======================
export const getWorkLogs = (issueId) =>
  api.get(`/issues/${issueId}/worklogs`);

export const createWorkLog = (issueId, data) =>
  api.post(`/issues/${issueId}/worklogs`, data);

export const updateWorkLog = (workLogId, data) =>
  api.put(`/worklogs/${workLogId}`, data);

export const deleteWorkLog = (workLogId) =>
  api.delete(`/worklogs/${workLogId}`);

// ======================
// Attachments
// ======================
export const uploadAttachment = (issueId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/attachments/issues/${issueId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadAttachment = (id) =>
  api.get(`/attachments/${id}/download`, { responseType: 'blob' });

export const deleteAttachment = (id) =>
  api.delete(`/attachments/${id}`);

// ======================
// Reports
// ======================
export const getReports = (projectId) =>
  api.get(`/reports/projects/${projectId}/reports`);

export const getReport = (id) =>
  api.get(`/reports/${id}`);

export const createReport = (projectId, data) =>
  api.post(`/reports/projects/${projectId}/reports`, data);

export const updateReport = (id, data) =>
  api.put(`/reports/${id}`, data);

export const deleteReport = (id) =>
  api.delete(`/reports/${id}`);

export const getReportData = (id) =>
  api.get(`/reports/${id}/data`);

// ======================
// Shortcuts
// ======================
export const getShortcuts = () => api.get('/shortcuts');
export const createShortcut = (data) => api.post('/shortcuts', data);
export const updateShortcut = (id, data) => api.put(`/shortcuts/${id}`, data);
export const deleteShortcut = (id) => api.delete(`/shortcuts/${id}`);

// ======================
// Dashboard
// ======================
export const getWidgets = () => api.get('/dashboard/widgets');
export const getWidgetData = (id) =>
  api.get(`/dashboard/widgets/${id}/data`);

export const createWidget = (data) =>
  api.post('/dashboard/widgets', data);

export const updateWidget = (id, data) =>
  api.put(`/dashboard/widgets/${id}`, data);

export const deleteWidget = (id) =>
  api.delete(`/dashboard/widgets/${id}`);

export default api;
