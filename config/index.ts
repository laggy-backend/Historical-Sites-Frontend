/**
 * Unified configuration exports
 * Single source of truth for all app configuration
 */

import { ENV } from './env';
import { API_ENDPOINTS, HTTP_STATUS, STORAGE_KEYS } from './api';

// Export everything
export { ENV, API_ENDPOINTS, HTTP_STATUS, STORAGE_KEYS };

// Re-export commonly used values for convenience
export const { API_BASE_URL, API_TIMEOUT } = ENV;
export const { ACCESS_TOKEN, REFRESH_TOKEN } = STORAGE_KEYS;