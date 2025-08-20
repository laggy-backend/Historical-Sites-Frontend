import { API } from '@/services/apiService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const TOKEN_ENDPOINT = process.env.EXPO_PUBLIC_TOKEN_ENDPOINT || "";
  const REGISTER_ENDPOINT = process.env.EXPO_PUBLIC_REGISTER_ENDPOINT || "";
  const REFRESH_ENDPOINT = process.env.EXPO_PUBLIC_REFRESH_ENDPOINT || "";
  const ME_ENDPOINT = process.env.EXPO_PUBLIC_ME_ENDPOINT || "";
  const LOGOUT_ENDPOINT = process.env.EXPO_PUBLIC_LOGOUT_ENDPOINT || "";

  // Set auth header for API requests
  const setAuthHeader = (token: string) => {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  // Remove auth header
  const removeAuthHeader = () => {
    delete API.defaults.headers.common['Authorization'];
  };

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const response = await API.get(ME_ENDPOINT);
      setUser(response.data);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  };

  // Refresh access token
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh');
      if (!refreshToken) return null;

      const response = await API.post(REFRESH_ENDPOINT, { refresh: refreshToken });
      const { access } = response.data;
      
      await SecureStore.setItemAsync('access', access);
      setAuthHeader(access);
      
      return access;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  // Check authentication status on app load
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      const accessToken = await SecureStore.getItemAsync('access');
      const refreshToken = await SecureStore.getItemAsync('refresh');
      
      if (!accessToken && !refreshToken) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      if (accessToken) {
        setAuthHeader(accessToken);
        try {
          await fetchCurrentUser();
        } catch (error: any) {
          // If access token is expired, try to refresh
          if (error.response?.status === 401 && refreshToken) {
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
              await fetchCurrentUser();
            } else {
              // Refresh failed, clear everything but don't navigate
              await clearAuthData();
            }
          } else {
            await clearAuthData();
          }
        }
      } else if (refreshToken) {
        // Only refresh token exists, try to get new access token
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          await fetchCurrentUser();
        } else {
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear auth data without navigation
  const clearAuthData = async () => {
    await SecureStore.deleteItemAsync('access');
    await SecureStore.deleteItemAsync('refresh');
    removeAuthHeader();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Login function - throws error on failure, navigates only on success
  const login = async (email: string, password: string) => {
    try {
      const response = await API.post(TOKEN_ENDPOINT, { email, password });
      const { access, refresh } = response.data;

      // Store tokens
      await SecureStore.setItemAsync('access', access);
      await SecureStore.setItemAsync('refresh', refresh);
      
      // Set auth header
      setAuthHeader(access);
      
      // Fetch user data
      await fetchCurrentUser();
      
      // Navigate to home ONLY on success
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw the error so the login component can handle it
      // DO NOT change auth state or navigate on failure
      throw error;
    }
  };

  // Register function - throws error on failure, navigates only on success
  const register = async (email: string, password: string, password2: string) => {
    try {
      const response = await API.post(REGISTER_ENDPOINT, { email, password, password2 });
      const { tokens, user: userData } = response.data;

      // Store tokens
      await SecureStore.setItemAsync('access', tokens.access);
      await SecureStore.setItemAsync('refresh', tokens.refresh);
      
      // Set auth header
      setAuthHeader(tokens.access);
      
      // Set user data
      setUser(userData);
      setIsAuthenticated(true);
      
      // Navigate to home ONLY on success
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Register error:', error);
      // Re-throw the error so the register component can handle it
      // DO NOT change auth state or navigate on failure
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh');
      
      if (refreshToken) {
        // Call logout endpoint to blacklist the token
        try {
          await API.post(LOGOUT_ENDPOINT, { refresh: refreshToken });
        } catch (error) {
          console.error('Error calling logout endpoint:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data regardless of API call success
      await clearAuthData();
      
      // Navigate to login only on explicit logout
      router.replace('/(auth)/login');
    }
  };

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const requestInterceptor = API.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('access');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = API.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Only auto-refresh for authenticated requests (not login/register)
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes(TOKEN_ENDPOINT) &&
            !originalRequest.url?.includes(REGISTER_ENDPOINT)) {
          originalRequest._retry = true;
          
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return API(originalRequest);
          } else {
            // Don't logout automatically, let the component handle it
            return Promise.reject(error);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.request.eject(requestInterceptor);
      API.interceptors.response.eject(responseInterceptor);
    };
  }, [TOKEN_ENDPOINT, REGISTER_ENDPOINT]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};