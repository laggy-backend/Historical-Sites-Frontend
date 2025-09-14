import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Get API base URL from environment or use localhost as fallback
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it
      await SecureStore.deleteItemAsync('authToken');
      // Could trigger a redirect to login here
    }
    return Promise.reject(error);
  }
);

// API endpoints based on api_documentation.md
export const endpoints = {
  // Authentication endpoints
  auth: {
    register: '/api/v1/auth/register/',
    login: '/api/v1/auth/token/',
    refresh: '/api/v1/auth/token/refresh/',
    verify: '/api/v1/auth/token/verify/',
    logout: '/api/v1/auth/logout/',
    passwordReset: '/api/v1/auth/password-reset/',
    passwordResetConfirm: (uidb64: string, token: string) =>
      `/api/v1/auth/password-reset-confirm/${uidb64}/${token}/`,
    passwordResetComplete: '/api/v1/auth/password-reset-complete/',
  },

  // User endpoints
  user: {
    me: '/api/v1/users/me/',
  },

  // Location endpoints
  common: {
    governorates: '/api/v1/common/governorates/',
    governorate: (id: number) => `/api/v1/common/governorates/${id}/`,
    cities: '/api/v1/common/cities/',
    city: (id: number) => `/api/v1/common/cities/${id}/`,
  },

  // Historical sites endpoints
  historicalSites: {
    sites: '/api/v1/historical-sites/sites/',
    site: (id: number) => `/api/v1/historical-sites/sites/${id}/`,
    bulkMediaUpload: (id: number) => `/api/v1/historical-sites/sites/${id}/bulk_media_upload/`,
    tags: '/api/v1/historical-sites/tags/',
    tag: (id: number) => `/api/v1/historical-sites/tags/${id}/`,
    categories: '/api/v1/historical-sites/categories/',
    category: (id: number) => `/api/v1/historical-sites/categories/${id}/`,
    media: '/api/v1/historical-sites/media/',
    mediaItem: (id: number) => `/api/v1/historical-sites/media/${id}/`,
  },

  // API Documentation endpoints
  docs: {
    swagger: '/api/v1/docs/',
    redoc: '/api/v1/docs/redoc/',
    schema: '/api/v1/docs/schema/',
  },
};

export default api;
export { API_BASE_URL };
