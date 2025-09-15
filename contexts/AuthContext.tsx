import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

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

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const clearAuthData = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
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
      const response = await fetch(`${API_BASE_URL}/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Login failed'
        };
      }

      const tokens = await response.json();

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', tokens.access);
      await SecureStore.setItemAsync('refreshToken', tokens.refresh);

      // Get user profile
      const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: userData.data,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  };

  const logout = async () => {
    try {
      if (authState.refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.accessToken}`,
          },
          body: JSON.stringify({ refresh: authState.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuthData();
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        await clearAuthData();
        return false;
      }

      const tokens = await response.json();

      await SecureStore.setItemAsync('accessToken', tokens.access);
      await SecureStore.setItemAsync('refreshToken', tokens.refresh);

      setAuthState(prev => ({
        ...prev,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await clearAuthData();
      return false;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (!accessToken || !refreshToken) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Verify token
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/token/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: accessToken }),
      });

      if (verifyResponse.ok) {
        // Get user profile
        const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
            user: userData.data,
            accessToken,
            refreshToken,
          });
          return;
        }
      }

      // Token invalid, try refresh
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth check error:', error);
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
      logout,
      refreshAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};