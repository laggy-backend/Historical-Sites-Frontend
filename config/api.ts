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
  HISTORICAL_SITES: {
    LIST: '/historical-sites/sites/',
    CREATE: '/historical-sites/sites/',
    DETAIL: (id: number) => `/historical-sites/sites/${id}/`,
    UPDATE: (id: number) => `/historical-sites/sites/${id}/`,
    DELETE: (id: number) => `/historical-sites/sites/${id}/`,
    BULK_MEDIA: (id: number) => `/historical-sites/sites/${id}/bulk_media_upload/`,
  },
  MEDIA: {
    LIST: '/historical-sites/media/',
    CREATE: '/historical-sites/media/',
    DETAIL: (id: number) => `/historical-sites/media/${id}/`,
    UPDATE: (id: number) => `/historical-sites/media/${id}/`,
    DELETE: (id: number) => `/historical-sites/media/${id}/`,
  },
  TAGS: {
    LIST: '/historical-sites/tags/',
    CREATE: '/historical-sites/tags/',
    DETAIL: (id: number) => `/historical-sites/tags/${id}/`,
    UPDATE: (id: number) => `/historical-sites/tags/${id}/`,
    DELETE: (id: number) => `/historical-sites/tags/${id}/`,
  },
  CATEGORIES: {
    LIST: '/historical-sites/categories/',
    CREATE: '/historical-sites/categories/',
    DETAIL: (id: number) => `/historical-sites/categories/${id}/`,
    UPDATE: (id: number) => `/historical-sites/categories/${id}/`,
    DELETE: (id: number) => `/historical-sites/categories/${id}/`,
  },
  COMMON: {
    CITIES: '/common/cities/',
    GOVERNORATES: '/common/governorates/',
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