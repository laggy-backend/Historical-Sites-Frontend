/**
 * Filter Mapping Service
 * Converts user-friendly filter names to backend API formats
 * Now only handles search and sorting (city/categories/tags filtering removed)
 */

import { UserFriendlyFilters, BackendFilters } from '../types/historicalSites';
import { logger } from '../utils/logger';

// Sort options for the UI dropdown
export const SORT_OPTIONS = [
  {
    key: 'newest' as const,
    label: 'Newest First',
    icon: 'time-outline'
  },
  {
    key: 'oldest' as const,
    label: 'Oldest First',
    icon: 'time-outline'
  },
  {
    key: 'name_asc' as const,
    label: 'Name A-Z',
    icon: 'text-outline'
  },
  {
    key: 'name_desc' as const,
    label: 'Name Z-A',
    icon: 'text-outline'
  },
  {
    key: 'updated_newest' as const,
    label: 'Recently Updated',
    icon: 'refresh-outline'
  },
  {
    key: 'updated_oldest' as const,
    label: 'Least Recently Updated',
    icon: 'refresh-outline'
  }
];

// Sort mapping from user-friendly names to backend format
const SORT_MAPPING = {
  'newest': '-created_at',
  'oldest': 'created_at',
  'name_asc': 'name_en',
  'name_desc': '-name_en',
  'updated_newest': '-updated_at',
  'updated_oldest': 'updated_at'
} as const;

export const filterMapper = {
  /**
   * Convert user-friendly filters to backend API format
   */
  toBackendFilters: (userFilters: UserFriendlyFilters): BackendFilters => {
    const backendFilters: BackendFilters = {};

    // Search text - pass through as-is
    if (userFilters.search?.trim()) {
      backendFilters.search = userFilters.search.trim();
    }

    // Sort mapping
    backendFilters.ordering = SORT_MAPPING[userFilters.sortBy] || SORT_MAPPING.newest;

    logger.info('filterMapping', 'Mapped user filters to backend format', {
      userFilters,
      backendFilters
    });

    return backendFilters;
  },

  /**
   * Convert backend response to user-friendly format
   */
  fromBackendFilters: (backendFilters: BackendFilters): UserFriendlyFilters => {
    const userFilters: UserFriendlyFilters = {
      search: backendFilters.search || '',
      sortBy: 'newest'
    };

    // Convert backend ordering to user-friendly sort option
    if (backendFilters.ordering) {
      const sortEntry = Object.entries(SORT_MAPPING).find(([_, value]) => value === backendFilters.ordering);
      if (sortEntry) {
        userFilters.sortBy = sortEntry[0] as UserFriendlyFilters['sortBy'];
      }
    }

    logger.info('filterMapping', 'Mapped backend filters to user format', {
      backendFilters,
      userFilters
    });

    return userFilters;
  },

  /**
   * Clear all filters and return to defaults
   */
  clearAllFilters: (): UserFriendlyFilters => ({
    search: '',
    sortBy: 'newest'
  }),

  /**
   * Remove a specific filter
   */
  removeFilter: (
    currentFilters: UserFriendlyFilters,
    filterType: 'search' | 'sort',
    value?: string
  ): UserFriendlyFilters => {
    const newFilters = { ...currentFilters };

    switch (filterType) {
      case 'search':
        newFilters.search = '';
        break;
      case 'sort':
        newFilters.sortBy = 'newest';
        break;
    }

    logger.info('filterMapping', 'Removed filter', {
      filterType,
      value,
      oldFilters: currentFilters,
      newFilters
    });

    return newFilters;
  },

  /**
   * Count active filters (non-default values)
   */
  getActiveFilterCount: (filters: UserFriendlyFilters): number => {
    let count = 0;

    if (filters.search?.trim()) count++;
    if (filters.sortBy !== 'newest') count++;

    return count;
  },

  /**
   * Get human-readable summary of active filters
   */
  getFilterSummary: (filters: UserFriendlyFilters): string[] => {
    const summary: string[] = [];

    if (filters.search?.trim()) {
      summary.push(`Search: "${filters.search}"`);
    }

    if (filters.sortBy !== 'newest') {
      const selectedSort = SORT_OPTIONS.find(option => option.key === filters.sortBy);
      if (selectedSort) {
        summary.push(`Sort: ${selectedSort.label}`);
      }
    }

    return summary;
  }
};