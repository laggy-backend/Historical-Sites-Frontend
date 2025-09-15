/**
 * Axios API client with interceptors
 * Handles authentication, token refresh, and global error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT, HTTP_STATUS, STORAGE_KEYS } from '../config';
import { ApiError } from '../types/api';
import { logger } from '../utils/logger';
import { retryManager, DEFAULT_RETRY_CONFIG } from '../utils/retry';

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

      // Only log non-auth requests in debug to reduce noise
      if (!config.url?.includes('/auth/')) {
        logger.debug('api', `${config.method?.toUpperCase()} ${config.url}`, {
          hasAuth: !!token
        });
      }
    } catch (error) {
      logger.warn('api', 'Failed to attach auth token', { error: (error as Error).message });
    }
    return config;
  },
  (error) => {
    logger.error('api', 'Request interceptor error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and global errors
apiClient.interceptors.response.use(
  (response) => {
    // Only log non-auth responses in debug to reduce noise
    if (!response.config.url?.includes('/auth/')) {
      logger.debug('api', `${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
        status: response.status,
        hasData: !!response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestKey = `${originalRequest.method}-${originalRequest.url}`;

    // Log the error (but reduce noise for expected auth failures)
    const isAuthVerification = originalRequest.url?.includes('/verify/');
    const isAuthLogin = originalRequest.url?.includes('/token/') && originalRequest.method?.toLowerCase() === 'post';
    const is401 = error.response?.status === HTTP_STATUS.UNAUTHORIZED;

    if (!(isAuthVerification && is401) && !(isAuthLogin && is401)) {
      // Only log unexpected errors or non-401 auth errors
      logger.apiError(
        originalRequest.method?.toUpperCase() || 'UNKNOWN',
        originalRequest.url || 'unknown',
        error.message,
        error.response?.status
      );
    } else {
      // For expected auth failures, use debug level
      const context = isAuthVerification ? 'Auth verification' : 'Login attempt';
      logger.debug('api', `${context} failed (expected): ${error.message}`, {
        status: error.response?.status
      });
    }

    // Handle 401 Unauthorized - attempt token refresh with retry logic
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // Check if we're already retrying token refresh to prevent loops
      if (retryManager.isCurrentlyRetrying('token-refresh')) {
        logger.warn('api', 'Token refresh already in progress, rejecting request');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          logger.warn('auth', 'No refresh token available for token refresh');
          return Promise.reject(error);
        }

        // Use retry manager for token refresh
        const refreshResponse = await retryManager.executeWithRetry(
          'token-refresh',
          async () => {
            logger.info('auth', 'Attempting token refresh');
            return axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
              { refresh: refreshToken },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10 second timeout for refresh requests
              }
            );
          },
          {
            ...DEFAULT_RETRY_CONFIG,
            maxAttempts: 2, // Only retry token refresh once
          }
        );

        const { access, refresh } = refreshResponse.data;

        // Store new tokens
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh);

        logger.authSuccess('Token refresh');

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Reset retry count for the original request since we got new auth
        retryManager.resetRetryCount(requestKey);

        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh failed - clear tokens and reset retry state
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        retryManager.resetRetryCount('token-refresh');
        retryManager.resetRetryCount(requestKey);

        logger.authFailure('Token refresh', (refreshError as Error).message);
        return Promise.reject(refreshError);
      }
    }

    // Handle rate limiting
    if (error.response?.status === HTTP_STATUS.RATE_LIMITED) {
      logger.warn('api', 'Rate limit exceeded', {
        url: originalRequest.url,
        retryAfter: error.response.headers['retry-after']
      });
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default apiClient;

// Helper functions for common operations
export const apiHelpers = {
  /**
   * Extract error message from response with proper typing
   */
  getErrorMessage: (error: AxiosError | ApiError): string => {
    // Handle AxiosError
    if ('isAxiosError' in error || error.response?.data) {
      const data = error.response?.data as Record<string, any>;

      // Try different response formats
      if (data?.detail) return data.detail;
      if (data?.error?.message) return data.error.message;
      if (data?.message) return data.message;

      // Handle non-success API responses
      if (data?.success === false && data?.error) {
        return data.error.message || data.error.code || 'API request failed';
      }
    }

    // Handle direct message
    if (error.message) return error.message;

    // Fallback
    logger.warn('api', 'Unable to extract error message', { error });
    return 'An unexpected error occurred';
  },

  /**
   * Check if error is a network connectivity issue
   */
  isNetworkError: (error: AxiosError | ApiError): boolean => {
    if ('code' in error && error.code === 'NETWORK_ERROR') return true;
    if (error.message?.includes('Network Error')) return true;
    if (error.message?.includes('timeout')) return true;
    return false;
  },

  /**
   * Check if error is retryable
   */
  isRetryableError: (error: AxiosError | ApiError): boolean => {
    // Network errors are retryable
    if (apiHelpers.isNetworkError(error)) return true;

    // 5xx server errors are retryable
    if (error.response?.status && error.response.status >= 500) return true;

    // 401 is retryable (token refresh)
    if (error.response?.status === 401) return true;

    // 429 rate limit is retryable with backoff
    if (error.response?.status === 429) return true;

    return false;
  },

  /**
   * Get user-friendly error message for display
   */
  getUserFriendlyMessage: (error: AxiosError | ApiError): string => {
    const rawMessage = apiHelpers.getErrorMessage(error);

    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Network Error': 'Please check your internet connection and try again.',
      'timeout': 'The request took too long. Please try again.',
      'Request failed with status code 500': 'Server error. Please try again later.',
      'Request failed with status code 503': 'Service temporarily unavailable. Please try again later.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'UNAUTHORIZED': 'Please log in again to continue.',
      'INSUFFICIENT_PERMISSIONS': 'You don\'t have permission to perform this action.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
    };

    // Check for exact matches first
    if (errorMappings[rawMessage]) {
      return errorMappings[rawMessage];
    }

    // Check for partial matches
    for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
      if (rawMessage.includes(key)) {
        return friendlyMessage;
      }
    }

    // Return the raw message if no mapping found, but sanitize it
    return rawMessage.length > 100 ? 'An error occurred. Please try again.' : rawMessage;
  },
};