import api from './axios.js';

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

// Products
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

// Suppliers
export const suppliersApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Clients
export const clientsApi = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Locations
export const locationsApi = {
  getAll: (params) => api.get('/locations', { params }),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Receipts
export const receiptsApi = {
  getAll: (params) => api.get('/receipts', { params }),
  getById: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
};

// Dispatches
export const dispatchesApi = {
  getAll: (params) => api.get('/dispatches', { params }),
  getById: (id) => api.get(`/dispatches/${id}`),
  create: (data) => api.post('/dispatches', data),
  approve: (id) => api.post(`/dispatches/${id}/approve`),
  reject: (id, data) => api.post(`/dispatches/${id}/reject`, data),
  dispatch: (id) => api.post(`/dispatches/${id}/dispatch`),
};

// Stock
export const stockApi = {
  getAll: (params) => api.get('/stock', { params }),
  getByLocation: (params) => api.get('/stock/by-location', { params }),
};

// Movements
export const movementsApi = {
  getAll: (params) => api.get('/movements', { params }),
};

// Reports
export const reportsApi = {
  getStock: (params) => api.get('/reports/stock', { params }),
  getReceipts: (params) => api.get('/reports/receipts', { params }),
  getDispatches: (params) => api.get('/reports/dispatches', { params }),
  downloadStock: (params) => api.get('/reports/stock', { params, responseType: 'blob' }),
  downloadReceipts: (params) => api.get('/reports/receipts', { params, responseType: 'blob' }),
  downloadDispatches: (params) => api.get('/reports/dispatches', { params, responseType: 'blob' }),
};

// Logs
export const logsApi = {
  getAll: (params) => api.get('/logs', { params }),
};

// Users
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
};
