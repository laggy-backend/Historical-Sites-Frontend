/**
 * City Filter Component
 * Dropdown selector for filtering by city with user-friendly names
 * Follows existing styling patterns
 */

import React, { useState, useMemo } from 'react';
import { Text, TouchableOpacity, Modal, View, FlatList, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createButtonStyle,
  createButtonTextStyle,
  createInputStyle,
  createInputTextStyle,
  createStyles,
  createTypographyStyle,
  flexFull,
  getPlaceholderColor,
  rowCenter,
  useTheme
} from '../../styles';
import { useReferenceData } from '../../contexts/ReferenceDataContext';
import { City } from '../../types/historicalSites';

interface CityFilterProps {
  selectedCity?: string;
  onCityChange: (city: string | undefined) => void;
  disabled?: boolean;
}

export const CityFilter: React.FC<CityFilterProps> = ({
  selectedCity,
  onCityChange,
  disabled = false
}) => {
  const { theme } = useTheme();
  const { data } = useReferenceData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cities = data?.cities || [];

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    const citiesList = data?.cities || [];
    if (!searchQuery.trim()) return citiesList;

    const query = searchQuery.toLowerCase().trim();
    return citiesList.filter(city =>
      city.name_en.toLowerCase().includes(query) ||
      city.name_ar.includes(query)
    );
  }, [data?.cities, searchQuery]);

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
    cityList: {
      paddingHorizontal: theme.spacing.lg,
    },
    cityOption: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    selectedCityOption: {
      backgroundColor: theme.colors.primaryLight,
    },
    cityNameEn: {
      ...createTypographyStyle(theme, 'body'),
      fontWeight: theme.fontWeight.medium,
    },
    cityNameAr: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
    },
    clearAllOption: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.backgroundSecondary,
      alignItems: 'center',
    },
    clearAllText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    searchContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      ...createInputStyle(theme, 'default', 'md', false, false, false),
      ...createInputTextStyle(theme, 'md', false),
    },
    noResultsContainer: {
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
    },
    noResultsText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    }
  }))(theme);

  const handleCitySelect = (city: City | null) => {
    onCityChange(city?.name_en);
    setIsModalOpen(false);
    setSearchQuery(''); // Clear search when modal closes
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSearchQuery(''); // Clear search when modal closes
  };

  const renderCityItem = ({ item }: { item: City }) => {
    const isSelected = selectedCity === item.name_en;

    return (
      <TouchableOpacity
        style={[
          styles.cityOption,
          isSelected && styles.selectedCityOption
        ]}
        onPress={() => handleCitySelect(item)}
      >
        <View style={rowCenter}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cityNameEn}>{item.name_en}</Text>
            <Text style={styles.cityNameAr}>{item.name_ar}</Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={20}
              color={theme.colors.primary}
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
          {selectedCity || 'All Cities'}
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
        onRequestClose={handleModalClose}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleModalClose}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select City</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleModalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search cities..."
                  placeholderTextColor={getPlaceholderColor(theme)}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>

              <FlatList
                style={styles.cityList}
                data={filteredCities}
                renderItem={renderCityItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                  <TouchableOpacity
                    style={styles.clearAllOption}
                    onPress={() => handleCitySelect(null)}
                  >
                    <Text style={styles.clearAllText}>All Cities</Text>
                  </TouchableOpacity>
                }
                ListEmptyComponent={
                  searchQuery.trim() ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No cities found matching &ldquo;{searchQuery}&rdquo;
                      </Text>
                    </View>
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};