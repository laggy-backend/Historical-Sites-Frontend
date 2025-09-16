/**
 * Active Filters Component
 * Shows removable chips for currently active filters
 * Follows existing styling patterns
 */

import React from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createStyles,
  createTypographyStyle,
  rowCenter,
  useTheme
} from '../../styles';
import { UserFriendlyFilters } from '../../types/historicalSites';
import { referenceHelpers } from '../../services/referenceData';

interface ActiveFilter {
  type: 'search' | 'city' | 'category' | 'tag' | 'sort';
  label: string;
  value: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: UserFriendlyFilters;
  onRemoveSearch: () => void;
  onRemoveCity: () => void;
  onRemoveCategory: (category: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemoveSort: () => void;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemoveSearch,
  onRemoveCity,
  onRemoveCategory,
  onRemoveTag,
  onRemoveSort,
  onClearAll
}) => {
  const { theme } = useTheme();

  const styles = createStyles((theme) => ({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    scrollContainer: {
      ...rowCenter,
      gap: theme.spacing.sm,
    },
    filterChip: {
      ...rowCenter,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.full,
      paddingVertical: theme.spacing.xs,
      paddingLeft: theme.spacing.sm,
      paddingRight: theme.spacing.xs,
      gap: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.primary + '20',
    },
    filterChipText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    removeButton: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearAllButton: {
      ...rowCenter,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.full,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      gap: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    clearAllText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    emptyState: {
      display: 'none',
    }
  }))(theme);

  // Build active filters array
  const activeFilters: ActiveFilter[] = [];

  // Search filter
  if (filters.search?.trim()) {
    activeFilters.push({
      type: 'search',
      label: `"${filters.search}"`,
      value: filters.search,
      onRemove: onRemoveSearch
    });
  }

  // City filter
  if (filters.selectedCity) {
    activeFilters.push({
      type: 'city',
      label: filters.selectedCity,
      value: filters.selectedCity,
      onRemove: onRemoveCity
    });
  }

  // Category filters
  filters.selectedCategories.forEach(category => {
    activeFilters.push({
      type: 'category',
      label: referenceHelpers.formatSlugForDisplay(category),
      value: category,
      onRemove: () => onRemoveCategory(category)
    });
  });

  // Tag filters
  filters.selectedTags.forEach(tag => {
    activeFilters.push({
      type: 'tag',
      label: referenceHelpers.formatSlugForDisplay(tag),
      value: tag,
      onRemove: () => onRemoveTag(tag)
    });
  });

  // Sort filter (only if not default)
  if (filters.sortBy !== 'newest') {
    const sortLabels = {
      'newest': 'Newest First',
      'oldest': 'Oldest First',
      'name_asc': 'Name A-Z',
      'name_desc': 'Name Z-A',
      'updated_newest': 'Recently Updated',
      'updated_oldest': 'Least Recently Updated'
    };

    activeFilters.push({
      type: 'sort',
      label: sortLabels[filters.sortBy],
      value: filters.sortBy,
      onRemove: onRemoveSort
    });
  }

  // If no active filters, don't render anything
  if (activeFilters.length === 0) {
    return null;
  }

  const renderFilterChip = (filter: ActiveFilter, index: number) => (
    <View key={`${filter.type}-${filter.value}-${index}`} style={styles.filterChip}>
      <Text style={styles.filterChipText} numberOfLines={1}>
        {filter.label}
      </Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={filter.onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="close"
          size={12}
          color={theme.colors.textInverse}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Render individual filter chips */}
        {activeFilters.map(renderFilterChip)}

        {/* Clear all button */}
        {activeFilters.length > 1 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={onClearAll}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
            <Ionicons
              name="close-circle-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};