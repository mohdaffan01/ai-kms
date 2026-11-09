import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const API_STATIC_BASE =
  import.meta.env.VITE_SERVER_URL ||
  API_BASE_URL.replace(/\/api\/?$/, '');

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

// Response interceptor to detect backend connection failure (ERR_NETWORK / server offline)
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
      window.dispatchEvent(
        new CustomEvent('aikms:backend-offline', {
          detail: { message: `Backend server is not reachable at ${API_STATIC_BASE}`, error },
        })
      );
    }
    return Promise.reject(error);
  }
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

export const resetPasswordWithOtpApi = async ({ email, otp, password, confirmPassword }) => {
  const response = await authApi.post('/auth/reset-password-otp', {
    email,
    otp,
    password,
    confirmPassword,
  });
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
