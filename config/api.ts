/**
 * API configuration
 * Contains API endpoints and app constants that don't change between environments
 */

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register/',
    LOGIN: '/auth/token/',
    REFRESH: '/auth/token/refresh/',
    VERIFY: '/auth/token/verify/',
    LOGOUT: '/auth/logout/',
    PASSWORD_RESET: '/auth/password-reset/',
  },
  USERS: {
    ME: '/users/me/',
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
} as const;