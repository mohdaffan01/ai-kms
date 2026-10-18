import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to headers automatically
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const registerApi = async (userData) => {
  const response = await authApi.post('/auth/register', userData);
  return response.data;
};

export const loginApi = async (credentials) => {
  const response = await authApi.post('/auth/login', credentials);
  return response.data;
};

export const requestPasswordResetApi = async (email) => {
  const response = await authApi.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordApi = async (token, passwordData) => {
  const response = await authApi.post(`/auth/reset-password/${token}`, passwordData);
  return response.data;
};

export const getMeApi = async () => {
  const response = await authApi.get('/auth/me');
  return response.data;
};

export const updateProfileApi = async (profileData) => {
  const response = await authApi.put('/users/profile', profileData);
  return response.data;
};

export const changePasswordApi = async (passwordData) => {
  const response = await authApi.put('/users/change-password', passwordData);
  return response.data;
};

export default authApi;
