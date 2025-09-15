import { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config';
import apiClient, { apiHelpers } from '../services/api';
import { AuthResult, AuthResponse, ApiError } from '../types/api';
import { logger } from '../utils/logger';

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
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string) => Promise<AuthResult>;
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

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      logger.info('auth', 'Login attempt started', { email });

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

      logger.authSuccess('Login', userData.data.id);
      return { success: true };
    } catch (error) {
      const apiError = error as AxiosError | ApiError;
      logger.authFailure('Login', apiHelpers.getErrorMessage(apiError), email);

      return {
        success: false,
        error: apiHelpers.getUserFriendlyMessage(apiError)
      };
    }
  };

  const register = async (email: string, password: string): Promise<AuthResult> => {
    try {
      logger.info('auth', 'Registration attempt started', { email });

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

        logger.authSuccess('Registration', user.id);
        return { success: true };
      } else {
        const errorMessage = registrationData.error?.message || 'Registration failed';
        logger.authFailure('Registration', errorMessage, email);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const apiError = error as AxiosError | ApiError;
      logger.authFailure('Registration', apiHelpers.getErrorMessage(apiError), email);

      return {
        success: false,
        error: apiHelpers.getUserFriendlyMessage(apiError)
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
      logger.warn('auth', 'Logout request failed (non-critical)', { error: (error as Error).message });
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
      logger.warn('auth', 'Token refresh failed', { error: (error as Error).message });
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
            logger.warn('auth', 'Failed to get user after refresh', { error: (userError as Error).message });
            await clearAuthData();
          }
        }
      }
    } catch (error) {
      logger.warn('auth', 'Auth status check failed', { error: (error as Error).message });
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