/**
 * Axios API client with interceptors
 * Handles authentication, token refresh, and global error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT, HTTP_STATUS, STORAGE_KEYS } from '../config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Auto-attach authentication token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silently fail - token might not exist yet
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and global errors
apiClient.interceptors.response.use(
  (response) => {
    // Successful response - return as is
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    // BUT skip refresh attempts for auth endpoints (login, register, etc.)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token available - just pass through the original error
          return Promise.reject(error);
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access, refresh } = response.data;

        // Store new tokens
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        // Token refresh failed - user needs to re-authenticate
        if (__DEV__) {
          console.warn('Token refresh failed');
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === HTTP_STATUS.RATE_LIMITED && __DEV__) {
      console.warn('Rate limit exceeded');
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default apiClient;

// Helper functions for common operations
export const apiHelpers = {
  /**
   * Extract error message from response
   */
  getErrorMessage: (error: AxiosError): string => {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.detail) return data.detail;
      if (data.error?.message) return data.error.message;
      if (data.message) return data.message;
    }

    if (error.message) return error.message;
    return 'An unexpected error occurred';
  },
};