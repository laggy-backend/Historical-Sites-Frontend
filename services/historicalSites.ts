/**
 * Historical Sites API Service
 * Handles all API calls related to historical sites CRUD operations
 */

import { API_ENDPOINTS } from '../config';
import {
  HistoricalSite,
  CreateSiteData,
  UpdateSiteData,
  BackendFilters,
  PaginatedResponse,
  ApiResponse,
  MediaFile,
  MediaUploadData
} from '../types/historicalSites';
import { MediaItem } from '../components/media/MediaPicker';
import apiClient from './api';
import { AxiosError } from 'axios';

export const historicalSitesApi = {
  /**
   * Get paginated list of historical sites with optional filtering
   */
  getSites: async (filters: BackendFilters = {}): Promise<ApiResponse<PaginatedResponse<HistoricalSite>>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HISTORICAL_SITES.LIST, {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a single historical site by ID
   */
  getSite: async (id: number): Promise<ApiResponse<HistoricalSite>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HISTORICAL_SITES.DETAIL(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new historical site
   */
  createSite: async (siteData: CreateSiteData): Promise<ApiResponse<HistoricalSite>> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.HISTORICAL_SITES.CREATE, siteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing historical site
   */
  updateSite: async (id: number, siteData: UpdateSiteData): Promise<ApiResponse<HistoricalSite>> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.HISTORICAL_SITES.UPDATE(id), siteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Partially update an existing historical site
   */
  patchSite: async (id: number, siteData: Partial<UpdateSiteData>): Promise<ApiResponse<HistoricalSite>> => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.HISTORICAL_SITES.UPDATE(id), siteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a historical site (soft delete)
   */
  deleteSite: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.HISTORICAL_SITES.DELETE(id));

      // Handle 204 No Content responses which might not have response.data
      if (response.status === 204) {
        return { success: true, message: 'Site deleted successfully', data: undefined };
      }

      return response.data;
    } catch (error) {
      // Check if axios treated a successful 204 as an error
      if (error instanceof AxiosError && error.response?.status === 204) {
        return { success: true, message: 'Site deleted successfully', data: undefined };
      }
      throw error;
    }
  },

  /**
   * Upload multiple media files to a historical site
   */
  bulkMediaUpload: async (
    siteId: number,
    files: any[],
    titles: string[] = [],
    captions: string[] = [],
    thumbnails: boolean[] = []
  ): Promise<ApiResponse<{ media: MediaFile[] }>> => {
    try {
      const formData = new FormData();

      // Add files
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      // Add metadata arrays
      titles.forEach(title => {
        formData.append('titles', title);
      });

      captions.forEach(caption => {
        formData.append('captions', caption);
      });

      thumbnails.forEach(thumbnail => {
        formData.append('thumbnails', thumbnail.toString());
      });

      const response = await apiClient.post(
        API_ENDPOINTS.HISTORICAL_SITES.BULK_MEDIA(siteId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload multiple media files to a historical site using bulk upload endpoint
   */
  uploadSiteMedia: async (siteId: number, mediaItems: MediaItem[]): Promise<ApiResponse<{ media: MediaFile[] }>> => {
    try {
      const formData = new FormData();

      // Add all files to formData
      mediaItems.forEach((item) => {
        formData.append('files', item.file);
      });

      // Add metadata arrays (titles, captions, thumbnails)
      const titles = mediaItems.map(item => item.title || '');
      const captions = mediaItems.map(item => item.caption || '');
      const thumbnails = mediaItems.map(item => item.is_thumbnail || false);

      titles.forEach(title => formData.append('titles', title));
      captions.forEach(caption => formData.append('captions', caption));
      thumbnails.forEach(thumbnail => formData.append('thumbnails', thumbnail.toString()));

      const response = await apiClient.post(API_ENDPOINTS.SITES.BULK_MEDIA(siteId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Media management API calls
export const mediaApi = {
  /**
   * Get all media files
   */
  getMediaFiles: async (): Promise<ApiResponse<MediaFile[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MEDIA.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload a single media file
   */
  createMediaFile: async (mediaData: MediaUploadData): Promise<ApiResponse<MediaFile>> => {
    try {
      const formData = new FormData();
      formData.append('file', mediaData.file);
      formData.append('historical_site', mediaData.historical_site.toString());

      if (mediaData.title) {
        formData.append('title', mediaData.title);
      }
      if (mediaData.caption) {
        formData.append('caption', mediaData.caption);
      }
      if (mediaData.is_thumbnail !== undefined) {
        formData.append('is_thumbnail', mediaData.is_thumbnail.toString());
      }

      const response = await apiClient.post(API_ENDPOINTS.MEDIA.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update media file metadata (cannot change the file itself)
   */
  updateMediaFile: async (
    id: number,
    updates: { title?: string; caption?: string; is_thumbnail?: boolean }
  ): Promise<ApiResponse<MediaFile>> => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.MEDIA.UPDATE(id), updates);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a media file (hard delete)
   */
  deleteMediaFile: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.MEDIA.DELETE(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Helper functions for common site operations
export const siteHelpers = {
  /**
   * Build search/filter query string from filters object
   */
  buildFilterQuery: (filters: BackendFilters): string => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  },

  /**
   * Check if user can edit a site based on ownership and role
   */
  canEditSite: (site: HistoricalSite, currentUserId: number, userRole: string): boolean => {
    // Site owner can always edit
    if (site.user === currentUserId) return true;

    // Moderators and admins can edit any site
    return ['moderator', 'admin'].includes(userRole);
  },

  /**
   * Check if user can delete a site
   */
  canDeleteSite: (site: HistoricalSite, currentUserId: number, userRole: string): boolean => {
    // Same permissions as editing for now
    return siteHelpers.canEditSite(site, currentUserId, userRole);
  },

  /**
   * Get thumbnail image from site's media files
   */
  getThumbnailImage: (site: HistoricalSite): MediaFile | null => {
    return site.media_files.find(media => media.is_thumbnail) || site.media_files[0] || null;
  },

  /**
   * Format site coordinates for display
   */
  formatCoordinates: (latitude: number, longitude: number): string => {
    const latDirection = latitude >= 0 ? 'N' : 'S';
    const lonDirection = longitude >= 0 ? 'E' : 'W';

    return `${Math.abs(latitude).toFixed(4)}°${latDirection}, ${Math.abs(longitude).toFixed(4)}°${lonDirection}`;
  },

  /**
   * Validate site form data
   */
  validateSiteData: (data: CreateSiteData): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!data.name_en?.trim()) errors.name_en = 'English name is required';
    if (!data.name_ar?.trim()) errors.name_ar = 'Arabic name is required';
    if (!data.description_en?.trim()) errors.description_en = 'English description is required';
    if (!data.description_ar?.trim()) errors.description_ar = 'Arabic description is required';

    // Coordinate validation
    if (data.latitude < -90 || data.latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }
    if (data.longitude < -180 || data.longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }

    // City validation
    if (!data.city) errors.city = 'City is required';

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};