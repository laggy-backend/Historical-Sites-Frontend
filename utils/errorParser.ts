import { AxiosError } from 'axios';

export interface ValidationErrors {
  [fieldName: string]: string[];
}

export interface ParsedApiError {
  hasFieldErrors: boolean;
  fieldErrors: ValidationErrors;
  generalMessage: string;
}

/**
 * Parse API error responses to extract field-specific validation errors
 * Handles Django REST Framework validation error format
 */
export const parseApiError = (error: any): ParsedApiError => {
  const defaultResponse: ParsedApiError = {
    hasFieldErrors: false,
    fieldErrors: {},
    generalMessage: 'An error occurred'
  };

  // Handle AxiosError
  if (error instanceof AxiosError) {
    const responseData = error.response?.data;

    if (!responseData) {
      return {
        ...defaultResponse,
        generalMessage: 'Network error occurred'
      };
    }

    // Handle DRF validation errors (400 status with field details)
    if (error.response?.status === 400 && responseData) {
      // Check if this is a DRF validation error with field-level details
      if (typeof responseData === 'object' && !responseData.success) {
        // Look for field validation errors in the response
        const fieldErrors: ValidationErrors = {};
        let hasFieldErrors = false;

        // DRF returns validation errors directly as field-error mapping
        // or nested within an error object
        const errorData = responseData.error || responseData;

        for (const [field, errors] of Object.entries(errorData)) {
          if (Array.isArray(errors)) {
            fieldErrors[field] = errors;
            hasFieldErrors = true;
          } else if (typeof errors === 'string') {
            fieldErrors[field] = [errors];
            hasFieldErrors = true;
          }
        }

        if (hasFieldErrors) {
          return {
            hasFieldErrors: true,
            fieldErrors,
            generalMessage: 'Please fix the validation errors below'
          };
        }
      }
    }

    // Handle general API error responses
    if (responseData.error?.message) {
      return {
        ...defaultResponse,
        generalMessage: responseData.error.message
      };
    }

    if (responseData.message) {
      return {
        ...defaultResponse,
        generalMessage: responseData.message
      };
    }

    // Fallback to HTTP status-based messages
    switch (error.response?.status) {
      case 400:
        return {
          ...defaultResponse,
          generalMessage: 'Invalid request data'
        };
      case 401:
        return {
          ...defaultResponse,
          generalMessage: 'Authentication required'
        };
      case 403:
        return {
          ...defaultResponse,
          generalMessage: 'Permission denied'
        };
      case 404:
        return {
          ...defaultResponse,
          generalMessage: 'Resource not found'
        };
      case 500:
        return {
          ...defaultResponse,
          generalMessage: 'Server error occurred'
        };
      default:
        return {
          ...defaultResponse,
          generalMessage: `Request failed (${error.response?.status || 'Unknown error'})`
        };
    }
  }

  // Handle non-Axios errors
  if (error?.message) {
    return {
      ...defaultResponse,
      generalMessage: error.message
    };
  }

  return defaultResponse;
};

/**
 * Get the first error message for a specific field
 */
export const getFieldError = (fieldErrors: ValidationErrors, fieldName: string): string | undefined => {
  const errors = fieldErrors[fieldName];
  return errors && errors.length > 0 ? errors[0] : undefined;
};

/**
 * Map API field names to frontend form field names
 * This handles cases where API field names differ from form field names
 */
export const mapApiFieldToFormField = (apiField: string): string => {
  const fieldMapping: { [key: string]: string } = {
    'name_en': 'name_en',
    'name_ar': 'name_ar',
    'description_en': 'description_en',
    'description_ar': 'description_ar',
    'latitude': 'coordinate',
    'longitude': 'coordinate',
    'city': 'city',
    'categories': 'selectedCategories',
    'tags': 'selectedTags',
    'non_field_errors': 'general'
  };

  return fieldMapping[apiField] || apiField;
};