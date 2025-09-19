import { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config';
import apiClient, { apiHelpers } from '../services/api';
import { authEvents } from '../services/authEvents';
import { AuthResult, ApiError } from '../types/api';
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

  const clearAuthData = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  }, []);

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


  const checkAuthStatus = useCallback(async (retryCount = 0) => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (!accessToken || !refreshToken) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get user profile - this will automatically handle token refresh via interceptor if needed
        const userResponse = await apiClient.get(API_ENDPOINTS.USERS.ME);
        const userData = userResponse.data;

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: userData.data,
          accessToken,
          refreshToken,
        });
      } catch (error) {
        const errorMessage = (error as Error).message;

        // Check if this is a retry manager conflict (not a real auth failure)
        if (errorMessage.includes('Retry already in progress for token-refresh') && retryCount < 3) {
          logger.debug('auth', `Token refresh in progress, retrying auth check (attempt ${retryCount + 1}/3)`);

          // Wait for the ongoing refresh to complete and retry with backoff
          setTimeout(() => {
            checkAuthStatus(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
          return;
        }

        // For actual auth failures or max retries exceeded, clear auth data
        if (retryCount >= 3) {
          logger.warn('auth', 'Max retry attempts exceeded for auth check');
        }
        logger.warn('auth', 'Auth status check failed - clearing auth data', { error: errorMessage });
        await clearAuthData();
      }
    } catch (error) {
      logger.warn('auth', 'Auth status check failed', { error: (error as Error).message });
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [clearAuthData]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up authentication event listeners
  useEffect(() => {
    const unsubscribeLogout = authEvents.on('FORCE_LOGOUT', (data) => {
      logger.warn('auth', 'Force logout triggered', { reason: data?.reason });
      clearAuthData();
    });

    const unsubscribeTokenRefresh = authEvents.on('TOKEN_REFRESHED', (tokens) => {
      logger.debug('auth', 'Token refreshed via API client');
      setAuthState(prev => ({
        ...prev,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
      }));
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeLogout();
      unsubscribeTokenRefresh();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};