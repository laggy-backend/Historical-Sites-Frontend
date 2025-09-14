import { useState, useCallback } from 'react';
import api, { endpoints } from '../services/api';
import { useApi } from './useApi';

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

export interface MediaFile {
  id: number;
  file: string;
  title: string;
  caption: string;
  historical_site: number;
  user: number;
  is_thumbnail: boolean;
  created_at: string;
  updated_at: string;
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

export interface SitesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HistoricalSite[];
}

export const useHistoricalSites = () => {
  const [sites, setSites] = useState<HistoricalSite[]>([]);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  // Get sites with pagination and filters
  const sitesApi = useApi<SitesResponse>((params = {}) =>
    api.get(endpoints.historicalSites.sites, { params })
  );

  // Get single site
  const siteApi = useApi<HistoricalSite>((id: number) =>
    api.get(endpoints.historicalSites.site(id))
  );

  // Create site
  const createSiteApi = useApi<HistoricalSite>((siteData: any) =>
    api.post(endpoints.historicalSites.sites, siteData)
  );

  // Update site
  const updateSiteApi = useApi<HistoricalSite>((id: number, siteData: any) =>
    api.patch(endpoints.historicalSites.site(id), siteData)
  );

  // Delete site
  const deleteSiteApi = useApi((id: number) =>
    api.delete(endpoints.historicalSites.site(id))
  );

  const fetchSites = useCallback(async (params = {}) => {
    try {
      const response = await sitesApi.execute(params);
      setSites(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
      return response;
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  }, []);

  const searchSites = useCallback(async (searchQuery: string, filters = {}) => {
    return fetchSites({ search: searchQuery, ...filters });
  }, [fetchSites]);

  const loadMoreSites = useCallback(async () => {
    if (!pagination.next || sitesApi.loading) return;

    try {
      // Extract page number from next URL
      const url = new URL(pagination.next);
      const page = url.searchParams.get('page');
      const params = Object.fromEntries(url.searchParams);

      const response = await sitesApi.execute(params);
      setSites(prev => [...prev, ...response.results]);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (error) {
      console.error('Error loading more sites:', error);
    }
  }, [pagination.next, sitesApi.loading]);

  return {
    // State
    sites,
    pagination,

    // API states
    loading: sitesApi.loading,
    error: sitesApi.error,
    siteLoading: siteApi.loading,
    createLoading: createSiteApi.loading,
    updateLoading: updateSiteApi.loading,
    deleteLoading: deleteSiteApi.loading,

    // Actions
    fetchSites,
    searchSites,
    loadMoreSites,
    getSite: siteApi.execute,
    createSite: createSiteApi.execute,
    updateSite: updateSiteApi.execute,
    deleteSite: deleteSiteApi.execute,

    // Reset functions
    reset: () => {
      setSites([]);
      setPagination({ count: 0, next: null, previous: null });
      sitesApi.reset();
    },
  };
};