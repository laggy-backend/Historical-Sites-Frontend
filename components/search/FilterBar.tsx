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


  // Handle sort changes
  const handleSortChange = (sortBy: typeof filters.sortBy) => {
    updateFilters({ sortBy });
  };

  // Active filter removal handlers
  const handleRemoveSearch = () => {
    removeFilter('search');
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

      {/* Sort Control */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
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
        onRemoveSort={handleRemoveSort}
        onClearAll={clearFilters}
      />
    </View>
  );
};