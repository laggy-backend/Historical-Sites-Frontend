import * as SecureStore from 'expo-secure-store';
import api, { endpoints } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  role: 'visitor' | 'contributor' | 'moderator' | 'admin';
  created_at: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post(endpoints.auth.login, credentials);

    // Handle SimpleJWT direct response
    const tokens = {
      access: response.data.access,
      refresh: response.data.refresh,
    };

    await SecureStore.setItemAsync('authToken', tokens.access);
    await SecureStore.setItemAsync('refreshToken', tokens.refresh);

    // Get user profile
    const profileResponse = await api.get(endpoints.user.me);
    const user = profileResponse.data.data;

    return { user, tokens };
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post(endpoints.auth.register, data);

    if (response.data.success) {
      const { user, tokens } = response.data.data;

      await SecureStore.setItemAsync('authToken', tokens.access);
      await SecureStore.setItemAsync('refreshToken', tokens.refresh);

      return { user, tokens };
    }

    throw new Error('Registration failed');
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await api.post(endpoints.auth.logout, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await this.clearTokens();
    }
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post(endpoints.auth.refresh, { refresh: refreshToken });

    const tokens = {
      access: response.data.access,
      refresh: response.data.refresh || refreshToken,
    };

    await SecureStore.setItemAsync('authToken', tokens.access);
    if (response.data.refresh) {
      await SecureStore.setItemAsync('refreshToken', tokens.refresh);
    }

    return tokens;
  },

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get(endpoints.user.me);
    return response.data.data;
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      await api.post(endpoints.auth.verify, { token });
      return true;
    } catch {
      return false;
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post(endpoints.auth.passwordReset, { email });
  },
};