/**
 * Tag Filter Component
 * Multi-select filter for tags with user-friendly display names
 * Similar to CategoryFilter but for tags
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
import { Tag } from '../../types/historicalSites';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  selectedTags,
  onTagsChange,
  disabled = false
}) => {
  const { theme } = useTheme();
  const { data } = useReferenceData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tags = data?.tags || [];

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
    tagList: {
      paddingHorizontal: theme.spacing.lg,
    },
    tagOption: {
      ...rowCenter,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    tagContent: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    tagNameEn: {
      ...createTypographyStyle(theme, 'body'),
      fontWeight: theme.fontWeight.medium,
    },
    tagNameAr: {
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

  const toggleTag = (tagSlug: string) => {
    const isSelected = selectedTags.includes(tagSlug);
    if (isSelected) {
      onTagsChange(selectedTags.filter(slug => slug !== tagSlug));
    } else {
      onTagsChange([...selectedTags, tagSlug]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  const getButtonText = () => {
    if (selectedTags.length === 0) return 'Tags';
    if (selectedTags.length === 1) {
      return referenceHelpers.formatSlugForDisplay(selectedTags[0]);
    }
    return 'Tags';
  };

  const renderTagItem = ({ item }: { item: Tag }) => {
    const isSelected = selectedTags.includes(item.slug_en);

    return (
      <TouchableOpacity
        style={styles.tagOption}
        onPress={() => toggleTag(item.slug_en)}
      >
        <View style={styles.tagContent}>
          <Text style={styles.tagNameEn}>
            {referenceHelpers.formatSlugForDisplay(item.slug_en)}
          </Text>
          <Text style={styles.tagNameAr}>{item.slug_ar}</Text>
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
        {selectedTags.length > 0 && (
          <Text style={styles.badgeText}>
            {selectedTags.length}
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
                <Text style={styles.modalTitle}>Select Tags</Text>
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
                style={styles.tagList}
                data={tags}
                renderItem={renderTagItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.actionBar}>
                <Text style={styles.selectedCount}>
                  {selectedTags.length} selected
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAllTags}
                  disabled={selectedTags.length === 0}
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