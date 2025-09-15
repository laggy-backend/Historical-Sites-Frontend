import { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config';
import apiClient, { apiHelpers } from '../services/api';

interface User {
  id: number;
  email: string;
  role: 'visitor' | 'contributor' | 'moderator' | 'admin';
  created_at: string;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const clearAuthData = async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  };

  const login = async (email: string, password: string) => {
    try {
      // Login request - don't use interceptor to avoid token attachment
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const tokens = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

      // Get user profile (this will use the interceptor to attach token)
      const userResponse = await apiClient.get(API_ENDPOINTS.USERS.ME);
      const userData = userResponse.data;

      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        user: userData.data,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
      });

      return { success: true };
    } catch (error) {
      // Only log in development for cleaner production logs
      if (__DEV__) {
        console.warn('Login failed');
      }
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: apiHelpers.getErrorMessage(axiosError)
      };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      // Registration request - don't use interceptor to avoid token attachment
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
      });

      const registrationData = response.data;

      if (registrationData.success) {
        // Registration returns both user data and tokens
        const { user, tokens } = registrationData.data;

        // Store tokens securely
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: registrationData.error?.message || 'Registration failed'
        };
      }
    } catch (error) {
      // Only log in development for cleaner production logs
      if (__DEV__) {
        console.warn('Registration failed');
      }
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: apiHelpers.getErrorMessage(axiosError)
      };
    }
  };

  const logout = async () => {
    try {
      if (authState.refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refresh: authState.refreshToken
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Logout request failed (non-critical):', error);
      }
    } finally {
      await clearAuthData();
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return false;

      // Use direct axios call to avoid interceptor loop
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refresh: refreshToken
      });

      const tokens = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

      setAuthState(prev => ({
        ...prev,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
      }));

      return true;
    } catch (error) {
      if (__DEV__) {
        console.warn('Token refresh failed');
      }
      await clearAuthData();
      return false;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (!accessToken || !refreshToken) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Verify token
        await apiClient.post(API_ENDPOINTS.AUTH.VERIFY, {
          token: accessToken
        });

        // Get user profile
        const userResponse = await apiClient.get(API_ENDPOINTS.USERS.ME);
        const userData = userResponse.data;

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: userData.data,
          accessToken,
          refreshToken,
        });
        return;
      } catch (verifyError) {
        // Token invalid, try refresh
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        } else {
          // After successful refresh, get user profile
          try {
            const userResponse = await apiClient.get(API_ENDPOINTS.USERS.ME);
            const userData = userResponse.data;
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              isAuthenticated: true,
              user: userData.data,
            }));
          } catch (userError) {
            if (__DEV__) {
              console.warn('Failed to get user after refresh');
            }
            await clearAuthData();
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Auth status check failed');
      }
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      refreshAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};