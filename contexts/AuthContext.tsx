// contexts/AuthContext.tsx
import { API } from '@/services/apiService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
  
  // Add refs to prevent race conditions
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

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

  // Fetch current user data with timeout
  const fetchCurrentUser = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await API.get(ME_ENDPOINT, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      setUser(response.data);
      setIsAuthenticated(true);
      return response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timeout while fetching user');
        throw new Error('Request timeout');
      }
      console.error('Error fetching user:', error);
      throw error;
    }
  };

  // Refresh access token with race condition prevention
  const refreshAccessToken = async (): Promise<string | null> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;
    
    refreshPromiseRef.current = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh');
        if (!refreshToken) {
          return null;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await API.post(REFRESH_ENDPOINT, 
          { refresh: refreshToken },
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        const { access } = response.data;
        
        // Ensure access token is a string before storing
        if (access && typeof access === 'string') {
          await SecureStore.setItemAsync('access', access);
          setAuthHeader(access);
          return access;
        } else {
          console.error('Invalid access token received:', access);
          return null;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('Request timeout while refreshing token');
        } else {
          console.error('Error refreshing token:', error);
        }
        return null;
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
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
    try {
      // Only attempt to delete if the items exist
      const accessToken = await SecureStore.getItemAsync('access');
      const refreshToken = await SecureStore.getItemAsync('refresh');
      
      if (accessToken) {
        await SecureStore.deleteItemAsync('access');
      }
      if (refreshToken) {
        await SecureStore.deleteItemAsync('refresh');
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
    removeAuthHeader();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Login function with timeout
  const login = async (email: string, password: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await API.post(TOKEN_ENDPOINT, 
        { email, password },
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      const { access, refresh } = response.data;

      // Validate tokens are strings before storing
      if (!access || typeof access !== 'string') {
        throw new Error('Invalid access token received from server');
      }
      if (!refresh || typeof refresh !== 'string') {
        throw new Error('Invalid refresh token received from server');
      }

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
      if (error.name === 'AbortError') {
        throw new Error('Login request timeout. Please try again.');
      }
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function with timeout
  const register = async (email: string, password: string, password2: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await API.post(REGISTER_ENDPOINT, 
        { email, password, password2 },
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      const { tokens, user: userData } = response.data;

      // Validate tokens are strings before storing
      if (!tokens?.access || typeof tokens.access !== 'string') {
        throw new Error('Invalid access token received from server');
      }
      if (!tokens?.refresh || typeof tokens.refresh !== 'string') {
        throw new Error('Invalid refresh token received from server');
      }

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
      if (error.name === 'AbortError') {
        throw new Error('Registration request timeout. Please try again.');
      }
      console.error('Register error:', error);
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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          await API.post(LOGOUT_ENDPOINT, 
            { refresh: refreshToken },
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
        } catch (error) {
          console.error('Error calling logout endpoint:', error);
          // Continue with local logout even if API call fails
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

  // Setup axios interceptor for token refresh with proper dependencies
  useEffect(() => {
    const requestInterceptor = API.interceptors.request.use(
      async (config) => {
        // Skip auth header for auth endpoints
        if (config.url?.includes(TOKEN_ENDPOINT) || 
            config.url?.includes(REGISTER_ENDPOINT)) {
          return config;
        }
        
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
            !originalRequest.url?.includes(REGISTER_ENDPOINT) &&
            !originalRequest.url?.includes(REFRESH_ENDPOINT)) {
          originalRequest._retry = true;
          
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return API(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.request.eject(requestInterceptor);
      API.interceptors.response.eject(responseInterceptor);
    };
  }, [TOKEN_ENDPOINT, REGISTER_ENDPOINT, REFRESH_ENDPOINT]); // Fixed dependencies

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      checkAuthStatus,
    }),
    [user, isLoading, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};