/**
 * Reference Data Context
 * Provides access to cities, governorates, tags, and categories throughout the app
 * Follows the same pattern as AuthContext
 */

import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { referenceDataApi, referenceHelpers } from '../services/referenceData';
import { ReferenceData, City, Tag, Category, Governorate } from '../types/historicalSites';
import { logger } from '../utils/logger';
import { useAuth } from './AuthContext';

interface ReferenceDataContextType {
  // Data
  data: ReferenceData | null;
  isLoading: boolean;
  error: string | null;

  // Helper functions
  getCityName: (id: number) => string;
  getCategoryName: (id: number) => string;
  getTagName: (id: number) => string;
  getGovernorate: (id: number) => Governorate | undefined;

  // Search functions
  findCityByName: (name: string) => City | undefined;
  findTagBySlug: (slug: string) => Tag | undefined;
  findCategoryBySlug: (slug: string) => Category | undefined;

  // Refresh functions
  refreshData: () => Promise<void>;
  refreshCities: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const ReferenceDataContext = createContext<ReferenceDataContextType | null>(null);

export const useReferenceData = () => {
  const context = useContext(ReferenceDataContext);
  if (!context) {
    throw new Error('useReferenceData must be used within a ReferenceDataProvider');
  }
  return context;
};

interface ReferenceDataProviderProps {
  children: ReactNode;
}

export const ReferenceDataProvider: React.FC<ReferenceDataProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<ReferenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all reference data on mount
  const loadReferenceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      logger.info('referenceData', 'Loading reference data');

      const referenceData = await referenceDataApi.loadAll();
      setData(referenceData);

      logger.info('referenceData', 'Reference data loaded successfully', {
        cities: referenceData.cities.length,
        governorates: referenceData.governorates.length,
        tags: referenceData.tags.length,
        categories: referenceData.categories.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reference data';
      logger.error('referenceData', 'Failed to load reference data', { error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getCityName = useCallback((id: number): string => {
    if (!data) return 'Unknown City';
    const city = referenceHelpers.findCityById(data.cities, id);
    return city?.name_en || 'Unknown City';
  }, [data]);

  const getCategoryName = useCallback((id: number): string => {
    if (!data) return 'Unknown Category';
    const category = data.categories.find(cat => cat.id === id);
    return category ? referenceHelpers.formatSlugForDisplay(category.slug_en) : 'Unknown Category';
  }, [data]);

  const getTagName = useCallback((id: number): string => {
    if (!data) return 'Unknown Tag';
    const tag = data.tags.find(t => t.id === id);
    return tag ? referenceHelpers.formatSlugForDisplay(tag.slug_en) : 'Unknown Tag';
  }, [data]);

  const getGovernorate = useCallback((id: number): Governorate | undefined => {
    if (!data) return undefined;
    return data.governorates.find(gov => gov.id === id);
  }, [data]);

  const findCityByName = useCallback((name: string): City | undefined => {
    if (!data) return undefined;
    return referenceHelpers.findCityByName(data.cities, name);
  }, [data]);

  const findTagBySlug = useCallback((slug: string): Tag | undefined => {
    if (!data) return undefined;
    return referenceHelpers.findTagBySlug(data.tags, slug);
  }, [data]);

  const findCategoryBySlug = useCallback((slug: string): Category | undefined => {
    if (!data) return undefined;
    return referenceHelpers.findCategoryBySlug(data.categories, slug);
  }, [data]);

  // Refresh functions
  const refreshData = useCallback(async (): Promise<void> => {
    await loadReferenceData();
  }, []);

  const refreshCities = useCallback(async (): Promise<void> => {
    if (!data) return;

    try {
      logger.info('referenceData', 'Refreshing cities');
      const cities = await referenceDataApi.refreshCities();
      setData(prev => prev ? { ...prev, cities } : null);
      logger.info('referenceData', 'Cities refreshed successfully', { count: cities.length });
    } catch (error) {
      logger.error('referenceData', 'Failed to refresh cities', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [data]);

  const refreshTags = useCallback(async (): Promise<void> => {
    if (!data) return;

    try {
      logger.info('referenceData', 'Refreshing tags');
      const tags = await referenceDataApi.refreshTags();
      setData(prev => prev ? { ...prev, tags } : null);
      logger.info('referenceData', 'Tags refreshed successfully', { count: tags.length });
    } catch (error) {
      logger.error('referenceData', 'Failed to refresh tags', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [data]);

  const refreshCategories = useCallback(async (): Promise<void> => {
    if (!data) return;

    try {
      logger.info('referenceData', 'Refreshing categories');
      const categories = await referenceDataApi.refreshCategories();
      setData(prev => prev ? { ...prev, categories } : null);
      logger.info('referenceData', 'Categories refreshed successfully', { count: categories.length });
    } catch (error) {
      logger.error('referenceData', 'Failed to refresh categories', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [data]);

  // Load data only when authentication is ready and user is authenticated
  useEffect(() => {
    if (authLoading) {
      // Still waiting for auth to initialize
      return;
    }

    if (!isAuthenticated) {
      // User is not authenticated, clear any existing data
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // User is authenticated, load reference data
    loadReferenceData();
  }, [isAuthenticated, authLoading]);

  return (
    <ReferenceDataContext.Provider value={{
      data,
      isLoading,
      error,
      getCityName,
      getCategoryName,
      getTagName,
      getGovernorate,
      findCityByName,
      findTagBySlug,
      findCategoryBySlug,
      refreshData,
      refreshCities,
      refreshTags,
      refreshCategories
    }}>
      {children}
    </ReferenceDataContext.Provider>
  );
};