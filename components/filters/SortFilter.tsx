/**
 * Sort Filter Component
 * Dropdown for selecting sort order with user-friendly labels
 * Follows existing styling patterns
 */

import React, { useState } from 'react';
import { Text, TouchableOpacity, Modal, View, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createButtonStyle,
  createButtonTextStyle,
  createStyles,
  createTypographyStyle,
  flexFull,
  rowCenter,
  useTheme
} from '../../styles';
import { SORT_OPTIONS } from '../../services/filterMapping';
import { UserFriendlyFilters } from '../../types/historicalSites';

interface SortFilterProps {
  sortBy: UserFriendlyFilters['sortBy'];
  onSortChange: (sort: UserFriendlyFilters['sortBy']) => void;
  disabled?: boolean;
}

export const SortFilter: React.FC<SortFilterProps> = ({
  sortBy,
  onSortChange,
  disabled = false
}) => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const styles = createStyles((theme) => ({
    filterButton: {
      ...createButtonStyle(theme, 'secondary', 'sm', disabled),
      ...rowCenter,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.xs,
    },
    filterButtonText: {
      ...createButtonTextStyle(theme, 'secondary', 'sm', disabled),
      flex: 1,
      textAlign: 'left',
    },
    modalOverlay: {
      ...flexFull,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      maxHeight: '60%',
      paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
      ...rowCenter,
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      ...createTypographyStyle(theme, 'h3'),
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    sortList: {
      paddingHorizontal: theme.spacing.lg,
    },
    sortOption: {
      ...rowCenter,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    selectedSortOption: {
      backgroundColor: theme.colors.primaryLight,
    },
    sortContent: {
      flex: 1,
      ...rowCenter,
      gap: theme.spacing.sm,
    },
    sortLabel: {
      ...createTypographyStyle(theme, 'body'),
      fontWeight: theme.fontWeight.medium,
      flex: 1,
    },
    sortIcon: {
      width: 24,
      alignItems: 'center',
    },
  }))(theme);

  const handleSortSelect = (sort: UserFriendlyFilters['sortBy']) => {
    onSortChange(sort);
    setIsModalOpen(false);
  };

  const getCurrentSortLabel = () => {
    const currentSort = SORT_OPTIONS.find(option => option.key === sortBy);
    return currentSort?.label || 'Sort';
  };

  const renderSortItem = ({ item }: { item: typeof SORT_OPTIONS[number] }) => {
    const isSelected = sortBy === item.key;

    return (
      <TouchableOpacity
        style={[
          styles.sortOption,
          isSelected && styles.selectedSortOption
        ]}
        onPress={() => handleSortSelect(item.key)}
      >
        <View style={styles.sortContent}>
          <View style={styles.sortIcon}>
            <Ionicons
              name={item.icon as any}
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
          <Text style={styles.sortLabel}>{item.label}</Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark"
            size={20}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setIsModalOpen(true)}
        disabled={disabled}
      >
        <Text style={styles.filterButtonText} numberOfLines={1}>
          {getCurrentSortLabel()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort By</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalOpen(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                style={styles.sortList}
                data={SORT_OPTIONS}
                renderItem={renderSortItem}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};