import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, brandName) => api.post('/auth/register', { email, password, brandName }),
};

export const productService = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const orderService = {
  getAll: (status) => api.get('/orders', { params: { status } }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary'),
  getMessages: () => api.get('/analytics/messages'),
  getTopProducts: () => api.get('/analytics/top-products'),
};

export default api;