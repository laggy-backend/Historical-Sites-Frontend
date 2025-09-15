/**
 * API error types and interfaces
 * Centralized type definitions for API responses and errors
 */

export interface ApiError {
  response?: {
    data: {
      success: boolean;
      error?: {
        code: string;
        message: string;
      };
      message?: string;
    };
    status: number;
  };
  message: string;
  code?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      role: 'visitor' | 'contributor' | 'moderator' | 'admin';
      created_at: string;
    };
    tokens: {
      access: string;
      refresh: string;
    };
  };
}

export interface UserProfile {
  id: number;
  email: string;
  role: 'visitor' | 'contributor' | 'moderator' | 'admin';
  created_at: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

// Style-related types to fix TextInput type issues
export interface TextInputStyleProps {
  containerStyle?: any; // Will be refined below
  textStyle?: any;      // Will be refined below
}

// Simplified input style type that works with TextInput
export type InputStyleType = Record<string, any>;