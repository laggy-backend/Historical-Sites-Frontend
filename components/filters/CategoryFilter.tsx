/**
 * Category Filter Component
 * Multi-select filter for categories with user-friendly display names
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
import { useReferenceData } from '../../contexts/ReferenceDataContext';
import { referenceHelpers } from '../../services/referenceData';
import { Category } from '../../types/historicalSites';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  disabled?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoriesChange,
  disabled = false
}) => {
  const { theme } = useTheme();
  const { data } = useReferenceData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = data?.categories || [];

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
    badgeText: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.textInverse,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      fontSize: 12,
      fontWeight: theme.fontWeight.medium,
      minWidth: 20,
      textAlign: 'center',
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
      maxHeight: '80%',
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
    categoryList: {
      paddingHorizontal: theme.spacing.lg,
    },
    categoryOption: {
      ...rowCenter,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    categoryContent: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    categoryNameEn: {
      ...createTypographyStyle(theme, 'body'),
      fontWeight: theme.fontWeight.medium,
    },
    categoryNameAr: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    actionBar: {
      ...rowCenter,
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    clearButton: {
      ...createButtonStyle(theme, 'secondary', 'sm', false),
      paddingHorizontal: theme.spacing.md,
    },
    clearButtonText: {
      ...createButtonTextStyle(theme, 'secondary', 'sm', false),
    },
    selectedCount: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
    },
  }))(theme);

  const toggleCategory = (categorySlug: string) => {
    const isSelected = selectedCategories.includes(categorySlug);
    if (isSelected) {
      onCategoriesChange(selectedCategories.filter(slug => slug !== categorySlug));
    } else {
      onCategoriesChange([...selectedCategories, categorySlug]);
    }
  };

  const clearAllCategories = () => {
    onCategoriesChange([]);
  };

  const getButtonText = () => {
    if (selectedCategories.length === 0) return 'Categories';
    if (selectedCategories.length === 1) {
      return referenceHelpers.formatSlugForDisplay(selectedCategories[0]);
    }
    return 'Categories';
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategories.includes(item.slug_en);

    return (
      <TouchableOpacity
        style={styles.categoryOption}
        onPress={() => toggleCategory(item.slug_en)}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryNameEn}>
            {referenceHelpers.formatSlugForDisplay(item.slug_en)}
          </Text>
          <Text style={styles.categoryNameAr}>{item.slug_ar}</Text>
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={16}
              color={theme.colors.textInverse}
            />
          )}
        </View>
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
          {getButtonText()}
        </Text>
        {selectedCategories.length > 0 && (
          <Text style={styles.badgeText}>
            {selectedCategories.length}
          </Text>
        )}
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
                <Text style={styles.modalTitle}>Select Categories</Text>
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
                style={styles.categoryList}
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.actionBar}>
                <Text style={styles.selectedCount}>
                  {selectedCategories.length} selected
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAllCategories}
                  disabled={selectedCategories.length === 0}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};