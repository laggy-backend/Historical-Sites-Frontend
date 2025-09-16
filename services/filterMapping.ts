/**
 * Filter Mapping Service
 * Converts user-friendly filter names to backend API IDs and formats
 */

import { UserFriendlyFilters, BackendFilters, ReferenceData } from '../types/historicalSites';
import { referenceHelpers } from './referenceData';
import { logger } from '../utils/logger';

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
  toBackendFilters: (
    userFilters: UserFriendlyFilters,
    referenceData: ReferenceData
  ): BackendFilters => {
    const backendFilters: BackendFilters = {};

    // Search text - pass through as-is
    if (userFilters.search?.trim()) {
      backendFilters.search = userFilters.search.trim();
    }

    // City filter - convert city name to ID
    if (userFilters.selectedCity) {
      const city = referenceHelpers.findCityByName(referenceData.cities, userFilters.selectedCity);
      if (city) {
        backendFilters.city = city.id;
      } else {
        logger.warn('filterMapping', 'City not found for name', { cityName: userFilters.selectedCity });
      }
    }

    // Categories filter - convert category slugs to comma-separated IDs
    if (userFilters.selectedCategories.length > 0) {
      const categoryIds: number[] = [];

      userFilters.selectedCategories.forEach(categorySlug => {
        const category = referenceHelpers.findCategoryBySlug(referenceData.categories, categorySlug);
        if (category) {
          categoryIds.push(category.id);
        } else {
          logger.warn('filterMapping', 'Category not found for slug', { categorySlug });
        }
      });

      if (categoryIds.length > 0) {
        backendFilters.categories = categoryIds.join(',');
      }
    }

    // Tags filter - convert tag slugs to comma-separated IDs
    if (userFilters.selectedTags.length > 0) {
      const tagIds: number[] = [];

      userFilters.selectedTags.forEach(tagSlug => {
        const tag = referenceHelpers.findTagBySlug(referenceData.tags, tagSlug);
        if (tag) {
          tagIds.push(tag.id);
        } else {
          logger.warn('filterMapping', 'Tag not found for slug', { tagSlug });
        }
      });

      if (tagIds.length > 0) {
        backendFilters.tags = tagIds.join(',');
      }
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
   * Convert backend response to user-friendly format (for initializing filters from URL params, etc.)
   */
  fromBackendFilters: (
    backendFilters: BackendFilters,
    referenceData: ReferenceData
  ): UserFriendlyFilters => {
    const userFilters: UserFriendlyFilters = {
      search: backendFilters.search || '',
      selectedCity: undefined,
      selectedCategories: [],
      selectedTags: [],
      sortBy: 'newest'
    };

    // Convert city ID to name
    if (backendFilters.city) {
      const city = referenceHelpers.findCityById(referenceData.cities, backendFilters.city);
      if (city) {
        userFilters.selectedCity = city.name_en;
      }
    }

    // Convert category IDs to slugs
    if (backendFilters.categories) {
      const categoryIds = backendFilters.categories.split(',').map(id => parseInt(id.trim(), 10));
      const categoryNames: string[] = [];

      categoryIds.forEach(id => {
        const category = referenceData.categories.find(cat => cat.id === id);
        if (category) {
          categoryNames.push(category.slug_en);
        }
      });

      userFilters.selectedCategories = categoryNames;
    }

    // Convert tag IDs to slugs
    if (backendFilters.tags) {
      const tagIds = backendFilters.tags.split(',').map(id => parseInt(id.trim(), 10));
      const tagNames: string[] = [];

      tagIds.forEach(id => {
        const tag = referenceData.tags.find(t => t.id === id);
        if (tag) {
          tagNames.push(tag.slug_en);
        }
      });

      userFilters.selectedTags = tagNames;
    }

    // Convert ordering to user-friendly sort
    if (backendFilters.ordering) {
      const sortEntry = Object.entries(SORT_MAPPING).find(
        ([, backendValue]) => backendValue === backendFilters.ordering
      );
      if (sortEntry) {
        userFilters.sortBy = sortEntry[0] as UserFriendlyFilters['sortBy'];
      }
    }

    return userFilters;
  },

  /**
   * Check if filters are empty (no active filtering)
   */
  isEmptyFilter: (filters: UserFriendlyFilters): boolean => {
    return (
      !filters.search?.trim() &&
      !filters.selectedCity &&
      filters.selectedCategories.length === 0 &&
      filters.selectedTags.length === 0 &&
      filters.sortBy === 'newest'
    );
  },

  /**
   * Get active filter count for display
   */
  getActiveFilterCount: (filters: UserFriendlyFilters): number => {
    let count = 0;

    if (filters.search?.trim()) count++;
    if (filters.selectedCity) count++;
    if (filters.selectedCategories.length > 0) count += filters.selectedCategories.length;
    if (filters.selectedTags.length > 0) count += filters.selectedTags.length;
    if (filters.sortBy !== 'newest') count++;

    return count;
  },

  /**
   * Create filter summary for display
   */
  getFilterSummary: (filters: UserFriendlyFilters): string[] => {
    const summary: string[] = [];

    if (filters.search?.trim()) {
      summary.push(`Search: "${filters.search}"`);
    }

    if (filters.selectedCity) {
      summary.push(`City: ${filters.selectedCity}`);
    }

    if (filters.selectedCategories.length > 0) {
      if (filters.selectedCategories.length === 1) {
        summary.push(`Category: ${referenceHelpers.formatSlugForDisplay(filters.selectedCategories[0])}`);
      } else {
        summary.push(`Categories: ${filters.selectedCategories.length} selected`);
      }
    }

    if (filters.selectedTags.length > 0) {
      if (filters.selectedTags.length === 1) {
        summary.push(`Tag: ${referenceHelpers.formatSlugForDisplay(filters.selectedTags[0])}`);
      } else {
        summary.push(`Tags: ${filters.selectedTags.length} selected`);
      }
    }

    if (filters.sortBy !== 'newest') {
      const sortLabels = {
        'newest': 'Newest First',
        'oldest': 'Oldest First',
        'name_asc': 'Name A-Z',
        'name_desc': 'Name Z-A',
        'updated_newest': 'Recently Updated',
        'updated_oldest': 'Least Recently Updated'
      };
      summary.push(`Sort: ${sortLabels[filters.sortBy]}`);
    }

    return summary;
  },

  /**
   * Clear all filters except search
   */
  clearFilters: (keepSearch: boolean = false): UserFriendlyFilters => {
    return {
      search: keepSearch ? '' : '',
      selectedCity: undefined,
      selectedCategories: [],
      selectedTags: [],
      sortBy: 'newest'
    };
  },

  /**
   * Remove specific filter type
   */
  removeFilter: (
    filters: UserFriendlyFilters,
    filterType: 'search' | 'city' | 'sort',
    value?: string
  ): UserFriendlyFilters => {
    const newFilters = { ...filters };

    switch (filterType) {
      case 'search':
        newFilters.search = '';
        break;
      case 'city':
        newFilters.selectedCity = undefined;
        break;
      case 'sort':
        newFilters.sortBy = 'newest';
        break;
      default:
        logger.warn('filterMapping', 'Unknown filter type to remove', { filterType });
    }

    return newFilters;
  },

  /**
   * Remove specific category or tag
   */
  removeItemFilter: (
    filters: UserFriendlyFilters,
    type: 'category' | 'tag',
    item: string
  ): UserFriendlyFilters => {
    const newFilters = { ...filters };

    if (type === 'category') {
      newFilters.selectedCategories = filters.selectedCategories.filter(cat => cat !== item);
    } else if (type === 'tag') {
      newFilters.selectedTags = filters.selectedTags.filter(tag => tag !== item);
    }

    return newFilters;
  }
};

// Export sort options for UI components
export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', icon: 'arrow-down' },
  { key: 'oldest', label: 'Oldest First', icon: 'arrow-up' },
  { key: 'name_asc', label: 'Name A-Z', icon: 'text' },
  { key: 'name_desc', label: 'Name Z-A', icon: 'text' },
  { key: 'updated_newest', label: 'Recently Updated', icon: 'time' },
  { key: 'updated_oldest', label: 'Least Recently Updated', icon: 'time-outline' }
] as const;