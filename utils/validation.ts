/**
 * Frontend validation utilities that match the backend validation patterns
 * Based on Historical-Sites-Backend/common/validators.py
 */

// Regex patterns matching the backend exactly
const ENGLISH_TEXT_PATTERN = /^[A-Za-z0-9\s\.\,\!\?\:\-\(\)\'\"]+$/;
const ARABIC_TEXT_PATTERN = /^[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s\d\.\,\!\?\:\-\(\)]+$/;

/**
 * Validate that a string field is not empty or whitespace-only
 * Matches backend validate_non_empty_string function
 */
export const validateNonEmptyString = (value: string): string | null => {
  if (!value || !value.trim()) {
    return 'This field cannot be empty.';
  }
  return null;
};

/**
 * Validate that text contains valid English characters
 * Matches backend validate_english_text function
 * Allows letters, numbers, spaces, and common punctuation: . , ! ? : - ( ) ' "
 */
export const validateEnglishText = (value: string): string | null => {
  if (!value) return null; // Empty values are handled by validateNonEmptyString

  if (!ENGLISH_TEXT_PATTERN.test(value)) {
    return 'English text must contain only English letters, numbers, spaces, and basic punctuation.';
  }
  return null;
};

/**
 * Validate that text contains valid Arabic characters
 * Matches backend validate_arabic_text function
 * Allows Arabic letters, numbers, spaces, and common punctuation: . , ! ? : - ( )
 */
export const validateArabicText = (value: string): string | null => {
  if (!value) return null; // Empty values are handled by validateNonEmptyString

  if (!ARABIC_TEXT_PATTERN.test(value)) {
    return 'Arabic text must contain only Arabic letters, numbers, spaces, and basic punctuation.';
  }
  return null;
};

/**
 * Validate English name field (combines non-empty and pattern validation)
 * Matches backend BilingualNameValidationMixin for name_en
 */
export const validateEnglishName = (value: string): string | null => {
  const emptyError = validateNonEmptyString(value);
  if (emptyError) return emptyError;

  const patternError = validateEnglishText(value);
  if (patternError) return patternError;

  return null;
};

/**
 * Validate Arabic name field (combines non-empty and pattern validation)
 * Matches backend BilingualNameValidationMixin for name_ar
 */
export const validateArabicName = (value: string): string | null => {
  const emptyError = validateNonEmptyString(value);
  if (emptyError) return emptyError;

  const patternError = validateArabicText(value);
  if (patternError) return patternError;

  return null;
};

/**
 * Validate English description field (combines non-empty and pattern validation)
 * Matches backend BilingualDescriptionValidationMixin for description_en
 */
export const validateEnglishDescription = (value: string): string | null => {
  const emptyError = validateNonEmptyString(value);
  if (emptyError) return emptyError;

  const patternError = validateEnglishText(value);
  if (patternError) return patternError;

  return null;
};

/**
 * Validate Arabic description field (combines non-empty and pattern validation)
 * Matches backend BilingualDescriptionValidationMixin for description_ar
 */
export const validateArabicDescription = (value: string): string | null => {
  const emptyError = validateNonEmptyString(value);
  if (emptyError) return emptyError;

  const patternError = validateArabicText(value);
  if (patternError) return patternError;

  return null;
};

/**
 * Validate latitude value is within valid range [-90, 90]
 * Matches backend validate_latitude function
 */
export const validateLatitude = (value: number): string | null => {
  if (value < -90.0 || value > 90.0) {
    return 'Latitude must be between -90 and 90 degrees.';
  }
  return null;
};

/**
 * Validate longitude value is within valid range [-180, 180]
 * Matches backend validate_longitude function
 */
export const validateLongitude = (value: number): string | null => {
  if (value < -180.0 || value > 180.0) {
    return 'Longitude must be between -180 and 180 degrees.';
  }
  return null;
};

/**
 * Comprehensive validation for site creation form
 * Matches backend HistoricalSite model validation
 */
export interface SiteValidationErrors {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  coordinate?: string;
  city?: string;
}

export const validateSiteCreationForm = (formData: {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  coordinate?: { latitude: number; longitude: number };
  selectedCity?: string;
}): SiteValidationErrors => {
  const errors: SiteValidationErrors = {};

  // Validate English name
  const nameEnError = validateEnglishName(formData.name_en);
  if (nameEnError) errors.name_en = nameEnError;

  // Validate Arabic name
  const nameArError = validateArabicName(formData.name_ar);
  if (nameArError) errors.name_ar = nameArError;

  // Validate English description
  const descEnError = validateEnglishDescription(formData.description_en);
  if (descEnError) errors.description_en = descEnError;

  // Validate Arabic description
  const descArError = validateArabicDescription(formData.description_ar);
  if (descArError) errors.description_ar = descArError;

  // Validate coordinates
  if (!formData.coordinate) {
    errors.coordinate = 'Location is required';
  } else {
    const latError = validateLatitude(formData.coordinate.latitude);
    const lngError = validateLongitude(formData.coordinate.longitude);
    if (latError) errors.coordinate = latError;
    else if (lngError) errors.coordinate = lngError;
  }

  // Validate city selection
  if (!formData.selectedCity) {
    errors.city = 'City selection is required';
  }

  return errors;
};

/**
 * Check if validation errors object has any errors
 */
export const hasValidationErrors = (errors: SiteValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};