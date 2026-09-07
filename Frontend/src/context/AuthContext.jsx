import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  loginApi,
  registerApi,
  getMeApi,
  updateProfileApi,
  changePasswordApi,
} from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear error helper
  const clearError = () => setError(null);

  // Load authenticated user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await getMeApi();
          setUser(userData);
        } catch (err) {
          console.error('Failed to load user session:', err);
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login handler
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi(credentials);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerApi(userData);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Profile update handler
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfileApi(profileData);
      setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
      setLoading(false);
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
  };

  // Change password handler
  const changePassword = async (passwordData) => {
    setError(null);
    try {
      const res = await changePasswordApi(passwordData);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to change password.';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
