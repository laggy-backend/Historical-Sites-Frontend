import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { endpoints } from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'visitor' | 'contributor' | 'moderator' | 'admin';
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('authToken');

      if (token) {
        // Verify token and get user data
        const response = await api.get(endpoints.user.me);
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post(endpoints.auth.login, { email, password });

      // Handle SimpleJWT direct response format
      if (response.data.access && response.data.refresh) {
        await SecureStore.setItemAsync('authToken', response.data.access);
        await SecureStore.setItemAsync('refreshToken', response.data.refresh);

        // Get user profile
        const profileResponse = await api.get(endpoints.user.me);
        if (profileResponse.data.success) {
          setUser(profileResponse.data.data);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post(endpoints.auth.register, { email, password });

      if (response.data.success) {
        // Auto-login after registration
        const { tokens } = response.data.data;
        await SecureStore.setItemAsync('authToken', tokens.access);
        await SecureStore.setItemAsync('refreshToken', tokens.refresh);
        setUser(response.data.data.user);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await api.post(endpoints.auth.logout, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuth();
    }
  };

  const clearAuth = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
    setError(null);
  };

  const refreshToken = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post(endpoints.auth.refresh, { refresh: refreshToken });

      if (response.data.access) {
        await SecureStore.setItemAsync('authToken', response.data.access);
        if (response.data.refresh) {
          await SecureStore.setItemAsync('refreshToken', response.data.refresh);
        }
        return true;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      await clearAuth();
      return false;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);
      const response = await api.post(endpoints.auth.passwordReset, { email });

      if (response.data.success) {
        return true;
      }

      throw new Error('Password reset request failed');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.response?.data?.error?.message || 'Password reset request failed');
      throw error;
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    requestPasswordReset,
  };
};