/**
 * Environment configuration
 * Contains environment-specific values that change between dev/staging/prod
 */

export const ENV = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
} as const;