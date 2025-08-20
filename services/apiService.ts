// services/apiService.ts
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "";

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // 20 second default timeout
  validateStatus: (status) => {
    // Consider any status code less than 500 as valid
    // This allows handling of 4xx errors in the application logic
    return status < 500;
  },
});

// Add request interceptor for logging (useful for debugging)
API.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
API.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      if (error.response) {
        // Server responded with error status
        console.error(`[API Error] ${error.response.status} - ${error.config?.url}`, error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error('[API Error] No response received', error.request);
      } else {
        // Error in request configuration
        console.error('[API Error]', error.message);
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your connection and try again.';
    } else if (!error.response && error.message === 'Network Error') {
      error.message = 'Network error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);