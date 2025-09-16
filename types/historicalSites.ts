/**
 * TypeScript types for Historical Sites API
 * Based on the backend API documentation and models
 */

export interface Governorate {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface City {
  id: number;
  name_en: string;
  name_ar: string;
  governorate: number;
  governorate_details?: Governorate;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Tag {
  id: number;
  slug_en: string;
  slug_ar: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Category {
  id: number;
  slug_en: string;
  slug_ar: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface MediaFile {
  id: number;
  file: string;
  title?: string;
  caption?: string;
  historical_site: number;
  user: number;
  is_thumbnail: boolean;
  created_at: string;
  updated_at: string;
}

export interface HistoricalSite {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  latitude: number;
  longitude: number;
  city: number;
  user: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  media_files: MediaFile[];
  tags_detail: Tag[];
  categories_detail: Category[];
}

// Form data types
export interface CreateSiteData {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  latitude: number;
  longitude: number;
  city: number;
  tags?: number[];
  categories?: number[];
}

export interface UpdateSiteData extends Partial<CreateSiteData> {}

export interface MediaUploadData {
  file: File | any; // For React Native, this could be different
  title?: string;
  caption?: string;
  historical_site: number;
  is_thumbnail?: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Filter and search types
export interface UserFriendlyFilters {
  search: string;
  selectedCity?: string;           // City name, not ID
  selectedCategories: string[];    // Category slugs, not IDs
  selectedTags: string[];          // Tag slugs, not IDs
  sortBy: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
}

export interface BackendFilters {
  search?: string;
  city?: number;                   // Mapped to ID
  categories?: string;             // Comma-separated IDs
  tags?: string;                   // Comma-separated IDs
  ordering?: string;               // Mapped to backend format
  page?: number;
}

// Location types for map integration
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends Coordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

// Reference data service type
export interface ReferenceData {
  cities: City[];
  categories: Category[];
  tags: Tag[];
  governorates: Governorate[];
}

// Form validation types
export interface SiteFormErrors {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  coordinate?: string;
  city?: string;
  selectedCategories?: string;
  selectedTags?: string;
  mediaItems?: string;
}

// Upload progress for media files
export interface UploadProgress {
  fileIndex: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}