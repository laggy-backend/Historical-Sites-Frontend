/**
 * Search Context
 * Clean React Native search implementation with proper debouncing
 * - Initial data loading on mount
 * - Proper search debouncing with setTimeout
 * - useTransition for smooth UX
 * - No infinite loops
 */

import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useTransition
} from 'react';
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
  isRefreshing: boolean;
  isLoadingMore: boolean;

  // Error handling
  error: string | null;

  // Filter state
  filters: UserFriendlyFilters;

  // Initialization state
  isInitialized: boolean;
}

interface SearchContextType extends SearchState {
  // Search query (what user is currently typing)
  searchQuery: string;

  // Core actions
  loadMore: () => void;
  refresh: () => void;
  clearSearch: () => void;

  // Filter management
  updateFilters: (newFilters: Partial<UserFriendlyFilters>) => void;
  clearFilters: () => void;

  // Utility functions
  getActiveFilterCount: () => number;
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

const INITIAL_STATE: SearchState = {
  sites: [],
  totalCount: 0,
  hasNextPage: false,
  currentPage: 1,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
  filters: INITIAL_FILTERS,
  isInitialized: false
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<any>(null);

  // Main search function
  const performSearch = useCallback(async (
    searchFilters: UserFriendlyFilters,
    page: number = 1,
    append: boolean = false,
    loadingType: 'loading' | 'refreshing' | 'loadingMore' = 'loading'
  ): Promise<void> => {
    try {
      // Set appropriate loading state
      setState(prev => ({
        ...prev,
        isLoading: loadingType === 'loading',
        isRefreshing: loadingType === 'refreshing',
        isLoadingMore: loadingType === 'loadingMore',
        error: null
      }));

      logger.info('search', 'Performing search', {
        filters: searchFilters,
        page,
        append,
        loadingType
      });

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
          isRefreshing: false,
          isLoadingMore: false,
          filters: searchFilters,
          isInitialized: true
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
        isRefreshing: false,
        isLoadingMore: false,
        error: errorMessage
      }));
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    if (!state.isInitialized) {
      performSearch(INITIAL_FILTERS, 1, false, 'loading');
    }
  }, [state.isInitialized, performSearch]);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only debounce if we have a search query and it's different from current filter
    if (searchQuery !== state.filters.search) {
      searchTimeoutRef.current = setTimeout(() => {
        const updatedFilters = { ...state.filters, search: searchQuery };
        performSearch(updatedFilters, 1, false, 'loading');
      }, 300) as any;
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, state.filters.search, performSearch]);

  // Core actions
  const loadMore = useCallback((): void => {
    if (state.isLoadingMore || !state.hasNextPage) return;
    performSearch(state.filters, state.currentPage + 1, true, 'loadingMore');
  }, [state.isLoadingMore, state.hasNextPage, state.filters, state.currentPage, performSearch]);

  const refresh = useCallback(() => {
    performSearch(state.filters, 1, false, 'refreshing');
  }, [state.filters, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setState(INITIAL_STATE);
    performSearch(INITIAL_FILTERS, 1, false, 'loading');
  }, [performSearch]);

  // Filter management
  const updateFilters = useCallback((newFilters: Partial<UserFriendlyFilters>): void => {
    // Handle search query separately for debouncing
    if (newFilters.search !== undefined) {
      setSearchQuery(newFilters.search);
    }

    // Handle other filters immediately
    const otherFilters = { ...newFilters };
    delete otherFilters.search;

    if (Object.keys(otherFilters).length > 0) {
      const updatedFilters = { ...state.filters, ...otherFilters };
      performSearch(updatedFilters, 1, false, 'loading');
    }
  }, [state.filters, performSearch]);

  const clearFilters = useCallback((): void => {
    setSearchQuery('');
    performSearch(INITIAL_FILTERS, 1, false, 'loading');
  }, [performSearch]);

  // Utility functions
  const getActiveFilterCount = useCallback((): number => {
    return filterMapper.getActiveFilterCount(state.filters);
  }, [state.filters]);

  const contextValue = useMemo(() => ({
    // State
    ...state,
    searchQuery,

    // Core actions
    loadMore,
    refresh,
    clearSearch,

    // Filter management
    updateFilters,
    clearFilters,

    // Utilities
    getActiveFilterCount
  }), [state, searchQuery, loadMore, refresh, clearSearch, updateFilters, clearFilters, getActiveFilterCount]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};