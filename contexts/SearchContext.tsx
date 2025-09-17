/**
 * Search Context
 * Manages search and filtering state for historical sites
 * Follows the same pattern as AuthContext
 */

import React, { createContext, ReactNode, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { historicalSitesApi } from '../services/historicalSites';
import { filterMapper } from '../services/filterMapping';
import {
  HistoricalSite,
  UserFriendlyFilters,
  PaginatedResponse,
  ApiResponse
} from '../types/historicalSites';
import { logger } from '../utils/logger';
import { AxiosError } from 'axios';
import { apiHelpers } from '../services/api';

interface SearchState {
  // Search results
  sites: HistoricalSite[];
  totalCount: number;
  hasNextPage: boolean;
  currentPage: number;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;

  // Error handling
  error: string | null;

  // Filter state
  filters: UserFriendlyFilters;
}

interface SearchContextType extends SearchState {
  // Search actions
  search: (newFilters?: Partial<UserFriendlyFilters>, resetPagination?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  clearSearch: () => void;

  // Filter actions
  updateFilters: (newFilters: Partial<UserFriendlyFilters>) => Promise<void>;
  clearFilters: () => Promise<void>;
  removeFilter: (filterType: 'search' | 'sort', value?: string) => Promise<void>;

  // Utility functions
  getActiveFilterCount: () => number;
  getFilterSummary: () => string[];
}

const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

const INITIAL_FILTERS: UserFriendlyFilters = {
  search: '',
  sortBy: 'newest'
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {

  const [state, setState] = useState<SearchState>({
    sites: [],
    totalCount: 0,
    hasNextPage: false,
    currentPage: 1,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    filters: INITIAL_FILTERS
  });

  // Debounced search effect for text input
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  // Auto-retry timeout for network errors
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (
    searchFilters: UserFriendlyFilters,
    page: number = 1,
    append: boolean = false
  ): Promise<void> => {
    try {
      // Clear any pending retry timeout
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }

      // Set appropriate loading state
      setState(prev => ({
        ...prev,
        isLoading: page === 1 && !append,
        isLoadingMore: page > 1 && append,
        error: null
      }));

      logger.info('search', 'Performing search', { filters: searchFilters, page, append });

      // Convert user-friendly filters to backend format
      const backendFilters = filterMapper.toBackendFilters(searchFilters);
      const queryParams = { ...backendFilters, page };

      // Make API call
      const response: ApiResponse<PaginatedResponse<HistoricalSite>> = await historicalSitesApi.getSites(queryParams);

      if (response.success) {
        const { results, count, next } = response.data;

        setState(prev => ({
          ...prev,
          sites: append ? [...prev.sites, ...results] : results,
          totalCount: count,
          hasNextPage: !!next,
          currentPage: page,
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          filters: searchFilters
        }));

        logger.info('search', 'Search completed successfully', {
          resultCount: results.length,
          totalCount: count,
          hasNext: !!next
        });
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? apiHelpers.getUserFriendlyMessage(error)
        : error instanceof Error
          ? error.message
          : 'Search failed';

      logger.error('search', 'Search failed', { error: errorMessage });

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        error: errorMessage
      }));

      // Auto-retry for network errors
      if (error instanceof AxiosError && apiHelpers.isNetworkError(error)) {
        const timeout = setTimeout(() => {
          logger.info('search', 'Auto-retrying after network error');
          performSearch(searchFilters, page, append);
        }, 5000); // Retry after 5 seconds
        setRetryTimeout(timeout);
      }
    }
  }, []);

  // Search function with debouncing for text search
  const search = useCallback(async (
    newFilters: Partial<UserFriendlyFilters> = {},
    resetPagination: boolean = true
  ): Promise<void> => {
    const updatedFilters = { ...state.filters, ...newFilters };

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If only search text changed, debounce it
    const isOnlySearchTextChange = Object.keys(newFilters).length === 1 && 'search' in newFilters;

    if (isOnlySearchTextChange && newFilters.search !== state.filters.search) {
      const timeout = setTimeout(() => {
        performSearch(updatedFilters, resetPagination ? 1 : state.currentPage, false);
      }, 500); // 500ms debounce

      setSearchTimeout(timeout);
    } else {
      // For filter changes, search immediately
      await performSearch(updatedFilters, resetPagination ? 1 : state.currentPage, false);
    }
  }, [state.filters, state.currentPage, searchTimeout, performSearch]);

  // Load more results (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (state.isLoadingMore || !state.hasNextPage) return;

    await performSearch(state.filters, state.currentPage + 1, true);
  }, [state.isLoadingMore, state.hasNextPage, state.filters, state.currentPage, performSearch]);

  // Refresh current search
  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    await performSearch(state.filters, 1, false);
  }, [state.filters, performSearch]);

  // Clear search and reset to defaults
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      sites: [],
      totalCount: 0,
      hasNextPage: false,
      currentPage: 1,
      error: null,
      filters: INITIAL_FILTERS
    }));
  }, []);

  // Filter management functions
  const updateFilters = useCallback(async (newFilters: Partial<UserFriendlyFilters>): Promise<void> => {
    await search(newFilters, true);
  }, [search]);

  const clearFilters = useCallback(async (): Promise<void> => {
    await search(INITIAL_FILTERS, true);
  }, [search]);

  const removeFilter = useCallback(async (
    filterType: 'search' | 'sort',
    value?: string
  ): Promise<void> => {
    const clearedFilters = filterMapper.removeFilter(state.filters, filterType, value);
    await search(clearedFilters, true);
  }, [state.filters, search]);


  // Utility functions
  const getActiveFilterCount = useCallback((): number => {
    return filterMapper.getActiveFilterCount(state.filters);
  }, [state.filters]);

  const getFilterSummary = useCallback((): string[] => {
    return filterMapper.getFilterSummary(state.filters);
  }, [state.filters]);

  // Initial search on component mount
  useEffect(() => {
    if (state.sites.length === 0 && !state.isLoading && !state.error) {
      // Perform initial search with default filters
      performSearch(INITIAL_FILTERS, 1, false);
    }
  }, [state.sites.length, state.isLoading, state.error]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [searchTimeout, retryTimeout]);

  const contextValue = useMemo(() => ({
    // State
    ...state,

    // Actions
    search,
    loadMore,
    refresh,
    clearSearch,

    // Filter actions
    updateFilters,
    clearFilters,
    removeFilter,

    // Utilities
    getActiveFilterCount,
    getFilterSummary
  }), [state, search, loadMore, refresh, clearSearch, updateFilters, clearFilters, removeFilter, getActiveFilterCount, getFilterSummary]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};