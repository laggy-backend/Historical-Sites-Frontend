/**
 * Filter Bar Component
 * Main container for all search and filter controls
 * Combines SearchBar with all filter components
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { createStyles, useTheme } from '../../styles';
import { useSearch } from '../../contexts/SearchContext';
import { SearchBar } from './SearchBar';
import { ActiveFilters } from './ActiveFilters';
import { CityFilter } from '../filters/CityFilter';
import { CategoryFilter } from '../filters/CategoryFilter';
import { TagFilter } from '../filters/TagFilter';
import { SortFilter } from '../filters/SortFilter';

interface FilterBarProps {
  disabled?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ disabled = false }) => {
  const { theme } = useTheme();
  const {
    filters,
    updateFilters,
    removeFilter,
    removeCategoryFilter,
    removeTagFilter,
    clearFilters
  } = useSearch();

  const styles = createStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.background,
      paddingVertical: theme.spacing.sm,
    },
    searchSection: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    filtersSection: {
      paddingLeft: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    filtersScroll: {
      gap: theme.spacing.sm,
    },
    filterItem: {
      marginRight: theme.spacing.sm,
    }
  }))(theme);

  // Handle search text changes
  const handleSearchChange = (search: string) => {
    updateFilters({ search });
  };

  // Handle city filter changes
  const handleCityChange = (city: string | undefined) => {
    updateFilters({ selectedCity: city });
  };

  // Handle category filter changes
  const handleCategoriesChange = (categories: string[]) => {
    updateFilters({ selectedCategories: categories });
  };

  // Handle tag filter changes
  const handleTagsChange = (tags: string[]) => {
    updateFilters({ selectedTags: tags });
  };

  // Handle sort changes
  const handleSortChange = (sortBy: typeof filters.sortBy) => {
    updateFilters({ sortBy });
  };

  // Active filter removal handlers
  const handleRemoveSearch = () => {
    removeFilter('search');
  };

  const handleRemoveCity = () => {
    removeFilter('city');
  };

  const handleRemoveSort = () => {
    removeFilter('sort');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <SearchBar
          value={filters.search}
          onSearch={handleSearchChange}
          disabled={disabled}
        />
      </View>

      {/* Filter Controls */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <View style={styles.filterItem}>
            <CityFilter
              selectedCity={filters.selectedCity}
              onCityChange={handleCityChange}
              disabled={disabled}
            />
          </View>

          <View style={styles.filterItem}>
            <CategoryFilter
              selectedCategories={filters.selectedCategories}
              onCategoriesChange={handleCategoriesChange}
              disabled={disabled}
            />
          </View>

          <View style={styles.filterItem}>
            <TagFilter
              selectedTags={filters.selectedTags}
              onTagsChange={handleTagsChange}
              disabled={disabled}
            />
          </View>

          <View style={styles.filterItem}>
            <SortFilter
              sortBy={filters.sortBy}
              onSortChange={handleSortChange}
              disabled={disabled}
            />
          </View>
        </ScrollView>
      </View>

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        onRemoveSearch={handleRemoveSearch}
        onRemoveCity={handleRemoveCity}
        onRemoveCategory={removeCategoryFilter}
        onRemoveTag={removeTagFilter}
        onRemoveSort={handleRemoveSort}
        onClearAll={clearFilters}
      />
    </View>
  );
};