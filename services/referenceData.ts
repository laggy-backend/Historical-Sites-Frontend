/**
 * Reference Data API Service
 * Handles API calls for cities, governorates, tags, and categories
 */

import { API_ENDPOINTS } from '../config';
import {
  City,
  Governorate,
  Tag,
  Category,
  ReferenceData,
  ApiResponse
} from '../types/historicalSites';
import apiClient from './api';

// Common/Location API calls
export const commonApi = {
  /**
   * Get all governorates
   */
  getGovernorates: async (): Promise<ApiResponse<Governorate[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COMMON.GOVERNORATES);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all cities with governorate details
   */
  getCities: async (): Promise<ApiResponse<City[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COMMON.CITIES);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Tags API calls
export const tagsApi = {
  /**
   * Get all tags
   */
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TAGS.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new tag
   */
  createTag: async (tagData: { slug_en: string; slug_ar: string }): Promise<ApiResponse<Tag>> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TAGS.CREATE, tagData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a tag
   */
  updateTag: async (id: number, tagData: { slug_en: string; slug_ar: string }): Promise<ApiResponse<Tag>> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.TAGS.UPDATE(id), tagData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a tag
   */
  deleteTag: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.TAGS.DELETE(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Categories API calls
export const categoriesApi = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new category
   */
  createCategory: async (categoryData: { slug_en: string; slug_ar: string }): Promise<ApiResponse<Category>> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a category
   */
  updateCategory: async (id: number, categoryData: { slug_en: string; slug_ar: string }): Promise<ApiResponse<Category>> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.CATEGORIES.UPDATE(id), categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a category
   */
  deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Reference Data Service for loading all lookup data
export const referenceDataApi = {
  /**
   * Load all reference data in parallel
   */
  loadAll: async (): Promise<ReferenceData> => {
    try {
      const [governoratesRes, citiesRes, tagsRes, categoriesRes] = await Promise.all([
        commonApi.getGovernorates(),
        commonApi.getCities(),
        tagsApi.getTags(),
        categoriesApi.getCategories()
      ]);

      return {
        governorates: governoratesRes.data,
        cities: citiesRes.data,
        tags: tagsRes.data,
        categories: categoriesRes.data
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Refresh specific reference data type
   */
  refreshCities: async (): Promise<City[]> => {
    const response = await commonApi.getCities();
    return response.data;
  },

  refreshTags: async (): Promise<Tag[]> => {
    const response = await tagsApi.getTags();
    return response.data;
  },

  refreshCategories: async (): Promise<Category[]> => {
    const response = await categoriesApi.getCategories();
    return response.data;
  }
};

// Helper functions for reference data
export const referenceHelpers = {
  /**
   * Find city by ID
   */
  findCityById: (cities: City[], id: number): City | undefined => {
    return cities.find(city => city.id === id);
  },

  /**
   * Find city by name
   */
  findCityByName: (cities: City[], name: string): City | undefined => {
    return cities.find(city => city.name_en === name || city.name_ar === name);
  },

  /**
   * Find tag by slug
   */
  findTagBySlug: (tags: Tag[], slug: string): Tag | undefined => {
    return tags.find(tag => tag.slug_en === slug || tag.slug_ar === slug);
  },

  /**
   * Find category by slug
   */
  findCategoryBySlug: (categories: Category[], slug: string): Category | undefined => {
    return categories.find(category => category.slug_en === slug || category.slug_ar === slug);
  },

  /**
   * Get cities by governorate
   */
  getCitiesByGovernorate: (cities: City[], governorateId: number): City[] => {
    return cities.filter(city => city.governorate === governorateId);
  },

  /**
   * Format tag/category for display
   */
  formatSlugForDisplay: (slug: string): string => {
    return slug.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  },

  /**
   * Validate new tag/category slug
   */
  validateSlug: (slug: string, type: 'english' | 'arabic'): { isValid: boolean; error?: string } => {
    if (!slug.trim()) {
      return { isValid: false, error: 'Slug cannot be empty' };
    }

    if (type === 'english') {
      // English slug validation: lowercase letters, numbers, hyphens
      const englishSlugRegex = /^[a-z0-9-]+$/;
      if (!englishSlugRegex.test(slug)) {
        return {
          isValid: false,
          error: 'English slug can only contain lowercase letters, numbers, and hyphens'
        };
      }
    }

    if (slug.length > 100) {
      return { isValid: false, error: 'Slug must be 100 characters or less' };
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { isValid: false, error: 'Slug cannot start or end with a hyphen' };
    }

    if (slug.includes('--')) {
      return { isValid: false, error: 'Slug cannot contain consecutive hyphens' };
    }

    return { isValid: true };
  }
};