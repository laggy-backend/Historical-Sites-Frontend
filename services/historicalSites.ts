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
   * Create a new historical site (without media files)
   */
  createSite: async (siteData: CreateSiteData): Promise<ApiResponse<HistoricalSite>> => {
    try {

      // Prepare request data object
      const requestData: any = {
        name_en: siteData.name_en,
        name_ar: siteData.name_ar,
        description_en: siteData.description_en,
        description_ar: siteData.description_ar,
        latitude: siteData.latitude,
        longitude: siteData.longitude,
        city: siteData.city
      };

      // Add optional fields only if they exist
      if (siteData.categories && siteData.categories.length > 0) {
        requestData.categories = siteData.categories;
      }

      if (siteData.tags && siteData.tags.length > 0) {
        requestData.tags = siteData.tags;
      }


      const response = await apiClient.post(API_ENDPOINTS.HISTORICAL_SITES.CREATE, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Site creation API error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Response headers:', axiosError.response?.headers);
      }
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
  uploadMediaFiles: async (
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
        API_ENDPOINTS.HISTORICAL_SITES.UPLOAD_MEDIA(siteId),
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
   * Upload multiple media files to a historical site using MediaItem objects
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

      const response = await apiClient.post(API_ENDPOINTS.HISTORICAL_SITES.UPLOAD_MEDIA(siteId), formData, {
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
   * Delete a media file (soft delete)
   */
  deleteMediaFile: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.MEDIA.DELETE(id));

      // Handle 204 No Content responses which might not have response.data
      if (response.status === 204) {
        return { success: true, message: 'Media deleted successfully', data: undefined };
      }

      return response.data;
    } catch (error) {
      // Check if axios treated a successful 204 as an error
      if (error instanceof AxiosError && error.response?.status === 204) {
        return { success: true, message: 'Media deleted successfully', data: undefined };
      }
      throw error;
    }
  },

  /**
   * Update media file metadata (cannot change the file itself)
   */
  updateMedia: async (
    id: number,
    updates: { title?: string; caption?: string; is_thumbnail?: boolean }
  ): Promise<ApiResponse<MediaFile>> => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.MEDIA.UPDATE(id), updates);
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

};