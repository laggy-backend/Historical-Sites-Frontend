/**
 * Edit Historical Site Form
 * Multi-step form for editing existing historical sites
 * Reuses logic and components from the creation flow
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createButtonStyle,
  createButtonTextStyle,
  createInputErrorStyle,
  createInputLabelStyle,
  createInputStyle,
  createInputTextStyle,
  createStyles,
  createTypographyStyle,
  flexFull,
  getPlaceholderColor,
  rowCenter,
  useTheme,
  createShadow
} from '../../../styles';
import { useAuth } from '../../../contexts/AuthContext';
import { useReferenceData } from '../../../contexts/ReferenceDataContext';
import { historicalSitesApi } from '../../../services/historicalSites';
import { LocationPicker } from '../../../components/maps/LocationPicker';
import { CityFilter } from '../../../components/filters/CityFilter';
import { CategoryFilter } from '../../../components/filters/CategoryFilter';
import { TagFilter } from '../../../components/filters/TagFilter';
import { MediaPicker, MediaItem } from '../../../components/media/MediaPicker';
import { UpdateSiteData, Coordinate, SiteFormErrors, HistoricalSite } from '../../../types/historicalSites';
import {
  validateEnglishName,
  validateArabicName,
  validateEnglishDescription,
  validateArabicDescription
} from '../../../utils/validation';
import { parseApiError, mapApiFieldToFormField } from '../../../utils/errorParser';
import { canEditSite } from '../../../utils/permissions';

type FormStep = 'basic' | 'location' | 'metadata' | 'media' | 'review';

interface FormData {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  coordinate?: Coordinate;
  selectedCity?: string;
  selectedCategories: string[];
  selectedTags: string[];
  mediaItems: MediaItem[];
  existingMedia: any[];
}

export default function EditSite() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { findCityByName, findCategoryBySlug, findTagBySlug, getCityName } = useReferenceData();

  const siteId = parseInt(id as string, 10);

  // State
  const [site, setSite] = useState<HistoricalSite | null>(null);
  const [isLoadingSite, setIsLoadingSite] = useState(true);
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<FormData>({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    coordinate: undefined,
    selectedCity: undefined,
    selectedCategories: [],
    selectedTags: [],
    mediaItems: [],
    existingMedia: []
  });
  const [errors, setErrors] = useState<SiteFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
    },
    header: {
      ...rowCenter,
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      ...createTypographyStyle(theme, 'h2'),
    },
    placeholder: {
      width: 24,
    },
    stepIndicator: {
      ...rowCenter,
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    stepDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeStepDot: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    completedStepDot: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    stepText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    activeStepText: {
      color: theme.colors.textInverse,
    },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: theme.colors.border,
      maxWidth: 40,
    },
    activeStepLine: {
      backgroundColor: theme.colors.success,
    },
    scrollContainer: {
      paddingBottom: 100,
    },
    formSection: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    stepTitle: {
      ...createTypographyStyle(theme, 'h2'),
      textAlign: 'center',
    },
    stepDescription: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    inputContainer: {
      gap: theme.spacing.sm,
    },
    reviewSection: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    reviewItem: {
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    reviewLabel: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: theme.fontWeight.medium,
    },
    reviewValue: {
      ...createTypographyStyle(theme, 'body'),
    },
    reviewValueSecondary: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    navigationBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      ...rowCenter,
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: 'transparent',
      pointerEvents: 'box-none',
    },
    arrowButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      ...createShadow(theme, 'md'),
      pointerEvents: 'auto',
    },
    arrowButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    arrowButtonDisabled: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    updateButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: 24,
      ...createShadow(theme, 'md'),
      pointerEvents: 'auto',
    },
    updateButtonText: {
      ...createButtonTextStyle(theme, 'primary', 'md'),
      fontWeight: theme.fontWeight.semibold,
    },
    loadingContainer: {
      ...flexFull,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    existingMediaItem: {
      marginRight: theme.spacing.md,
      width: 120,
    },
    existingMediaImageContainer: {
      position: 'relative',
      width: 120,
      height: 80,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.backgroundSecondary,
    },
    existingMediaImage: {
      width: '100%',
      height: '100%',
    },
    thumbnailBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      left: theme.spacing.xs,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    thumbnailBadgeText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textInverse,
      fontSize: 10,
    },
    deleteMediaButton: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: theme.spacing.xs,
    },
    setThumbnailButton: {
      marginTop: theme.spacing.xs,
      backgroundColor: theme.colors.backgroundSecondary,
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    setThumbnailText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.primary,
      fontSize: 10,
    }
  }))(theme);

  // Load site data
  useEffect(() => {
    if (siteId && !isNaN(siteId)) {
      loadSiteData();
    }
  }, []);

  const loadSiteData = async () => {
    try {
      setIsLoadingSite(true);
      const response = await historicalSitesApi.getSite(siteId);

      if (response.success) {
        const siteData = response.data;
        setSite(siteData);

        // Check permissions
        if (!user || !canEditSite(siteData.user, user.id, user.role)) {
          Alert.alert('Access Denied', 'You do not have permission to edit this site.');
          router.back();
          return;
        }

        // Pre-populate form with existing data
        setFormData({
          name_en: siteData.name_en,
          name_ar: siteData.name_ar,
          description_en: siteData.description_en,
          description_ar: siteData.description_ar,
          coordinate: {
            latitude: siteData.latitude,
            longitude: siteData.longitude
          },
          selectedCity: getCityName(siteData.city),
          selectedCategories: siteData.categories_detail?.map(cat => cat.slug_en) || [],
          selectedTags: siteData.tags_detail?.map(tag => tag.slug_en) || [],
          mediaItems: [], // New media items to be added
          existingMedia: siteData.media_files || []
        });
      } else {
        Alert.alert('Error', 'Site not found');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load site data');
      router.back();
    } finally {
      setIsLoadingSite(false);
    }
  };

  // Update form data with validation (reused from creation flow)
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));

    // Clear and re-validate related errors when updating fields
    const newErrors = { ...errors };

    if ('name_en' in updates) {
      delete newErrors.name_en;
      const error = validateEnglishName(updates.name_en || '');
      if (error) newErrors.name_en = error;
    }
    if ('name_ar' in updates) {
      delete newErrors.name_ar;
      const error = validateArabicName(updates.name_ar || '');
      if (error) newErrors.name_ar = error;
    }
    if ('description_en' in updates) {
      delete newErrors.description_en;
      const error = validateEnglishDescription(updates.description_en || '');
      if (error) newErrors.description_en = error;
    }
    if ('description_ar' in updates) {
      delete newErrors.description_ar;
      const error = validateArabicDescription(updates.description_ar || '');
      if (error) newErrors.description_ar = error;
    }
    if ('coordinate' in updates) {
      delete newErrors.coordinate;
    }
    if ('selectedCity' in updates) {
      delete newErrors.city;
    }
    if ('mediaItems' in updates) {
      delete newErrors.mediaItems;
    }

    setErrors(newErrors);
  };

  // Validate current step (reused from creation flow)
  const validateCurrentStep = (): boolean => {
    const newErrors: SiteFormErrors = {};

    switch (currentStep) {
      case 'basic':
        const nameEnError = validateEnglishName(formData.name_en);
        if (nameEnError) newErrors.name_en = nameEnError;

        const nameArError = validateArabicName(formData.name_ar);
        if (nameArError) newErrors.name_ar = nameArError;

        const descEnError = validateEnglishDescription(formData.description_en);
        if (descEnError) newErrors.description_en = descEnError;

        const descArError = validateArabicDescription(formData.description_ar);
        if (descArError) newErrors.description_ar = descArError;
        break;

      case 'location':
        if (!formData.coordinate) {
          newErrors.coordinate = 'Location is required';
        }
        break;

      case 'metadata':
        if (!formData.selectedCity) {
          newErrors.city = 'City selection is required';
        }
        break;

      case 'media':
        // Media is optional
        break;

      case 'review':
        // Final validation
        const finalNameEnError = validateEnglishName(formData.name_en);
        if (finalNameEnError) newErrors.name_en = finalNameEnError;

        const finalNameArError = validateArabicName(formData.name_ar);
        if (finalNameArError) newErrors.name_ar = finalNameArError;

        const finalDescEnError = validateEnglishDescription(formData.description_en);
        if (finalDescEnError) newErrors.description_en = finalDescEnError;

        const finalDescArError = validateArabicDescription(formData.description_ar);
        if (finalDescArError) newErrors.description_ar = finalDescArError;

        if (!formData.coordinate) {
          newErrors.coordinate = 'Location is required';
        }

        if (!formData.selectedCity) {
          newErrors.city = 'City selection is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Media management functions
  const handleDeleteExistingMedia = async (mediaId: number, index: number) => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media file? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Call API to delete the media
              const response = await historicalSitesApi.deleteMediaFile(mediaId);

              if (response.success) {
                // Remove from local state
                const updatedMedia = [...formData.existingMedia];
                updatedMedia.splice(index, 1);
                updateFormData({ existingMedia: updatedMedia });
                Alert.alert('Success', 'Media deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete media');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete media');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSetThumbnail = async (mediaId: number, index: number) => {
    try {
      setIsLoading(true);
      // Call API to set this media as thumbnail
      const response = await historicalSitesApi.updateMedia(mediaId, { is_thumbnail: true });

      if (response.success) {
        // Update local state - remove thumbnail from all existing media, then set it on this one
        const updatedMedia = formData.existingMedia.map((media, i) => ({
          ...media,
          is_thumbnail: i === index
        }));
        updateFormData({ existingMedia: updatedMedia });
        Alert.alert('Success', 'Thumbnail updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update thumbnail');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update thumbnail');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    const steps: FormStep[] = ['basic', 'location', 'metadata', 'media', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: FormStep[] = ['basic', 'location', 'metadata', 'media', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle update submission
  const handleSubmit = async () => {
    if (!validateCurrentStep() || !user) {
      return;
    }

    try {
      setIsLoading(true);

      // Convert user-selected city to ID
      const city = findCityByName(formData.selectedCity!);
      if (!city) {
        Alert.alert('Error', 'Selected city not found');
        return;
      }

      // Convert user-selected categories and tags to IDs
      const categoryIds = formData.selectedCategories
        .map(slug => findCategoryBySlug(slug)?.id)
        .filter(id => id !== undefined) as number[];

      const tagIds = formData.selectedTags
        .map(slug => findTagBySlug(slug)?.id)
        .filter(id => id !== undefined) as number[];

      const updateData: UpdateSiteData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        description_en: formData.description_en.trim(),
        description_ar: formData.description_ar.trim(),
        latitude: formData.coordinate!.latitude,
        longitude: formData.coordinate!.longitude,
        city: city.id,
        // Only include categories and tags if they have values
        ...(categoryIds.length > 0 && { categories: categoryIds }),
        ...(tagIds.length > 0 && { tags: tagIds })
      };

      // Step 1: Update the site data
      const siteResponse = await historicalSitesApi.updateSite(siteId, updateData);

      if (!siteResponse.success) {
        Alert.alert('Error', 'Failed to update site');
        return;
      }

      // Step 2: Upload new media files if any
      if (formData.mediaItems.length > 0) {
        try {
          const mediaResponse = await historicalSitesApi.uploadSiteMedia(siteId, formData.mediaItems);

          if (!mediaResponse.success) {
            Alert.alert(
              'Partial Success',
              'Site was updated but some media files failed to upload.',
              [{ text: 'OK' }]
            );
          }
        } catch (mediaError) {
          Alert.alert(
            'Partial Success',
            'Site was updated but media upload failed.',
            [{ text: 'OK' }]
          );
        }
      }

      Alert.alert(
        'Success',
        'Site updated successfully',
        [{ text: 'OK', onPress: () => router.push('/(protected)') }]
      );

    } catch (error) {
      console.error('Site update error:', error);

      const parsedError = parseApiError(error);

      if (parsedError.hasFieldErrors) {
        // Map API field errors to form field errors
        const newErrors: SiteFormErrors = {};

        for (const [apiField, fieldErrors] of Object.entries(parsedError.fieldErrors)) {
          const formField = mapApiFieldToFormField(apiField);
          if (fieldErrors.length > 0) {
            switch (formField) {
              case 'name_en':
                newErrors.name_en = fieldErrors[0];
                break;
              case 'name_ar':
                newErrors.name_ar = fieldErrors[0];
                break;
              case 'description_en':
                newErrors.description_en = fieldErrors[0];
                break;
              case 'description_ar':
                newErrors.description_ar = fieldErrors[0];
                break;
              case 'coordinate':
                newErrors.coordinate = fieldErrors[0];
                break;
              case 'city':
                newErrors.city = fieldErrors[0];
                break;
              case 'mediaItems':
                newErrors.mediaItems = fieldErrors[0];
                break;
            }
          }
        }

        setErrors(newErrors);

        // Navigate back to the first step that has errors
        const stepHasError = (step: FormStep): boolean => {
          switch (step) {
            case 'basic':
              return !!(newErrors.name_en || newErrors.name_ar || newErrors.description_en || newErrors.description_ar);
            case 'location':
              return !!newErrors.coordinate;
            case 'metadata':
              return !!(newErrors.city || newErrors.mediaItems);
            case 'media':
              return !!newErrors.mediaItems;
            case 'review':
              return false;
            default:
              return false;
          }
        };

        const steps: FormStep[] = ['basic', 'location', 'metadata', 'media', 'review'];
        const errorStep = steps.find(stepHasError);
        if (errorStep) {
          setCurrentStep(errorStep);
        }

        Alert.alert(
          'Validation Errors',
          'Please fix the highlighted errors and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', parsedError.generalMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator (reused from creation flow)
  const renderStepIndicator = () => {
    const steps: { key: FormStep; number: number }[] = [
      { key: 'basic', number: 1 },
      { key: 'location', number: 2 },
      { key: 'metadata', number: 3 },
      { key: 'media', number: 4 },
      { key: 'review', number: 5 }
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <View style={[
              styles.stepDot,
              currentStep === step.key && styles.activeStepDot,
              steps.findIndex(s => s.key === currentStep) > index && styles.completedStepDot
            ]}>
              <Text style={styles.stepText}>{step.number}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                steps.findIndex(s => s.key === currentStep) > index && styles.activeStepLine
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Form steps (reusing components from creation flow)
  const renderBasicInfoStep = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Update the name and description of the historical site in both English and Arabic.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.name_en, isLoading)}>
          Site Name (English) *
        </Text>
        <TextInput
          style={[
            createInputStyle(theme, 'default', 'md', !!errors.name_en, focusedField === 'name_en', isLoading),
            createInputTextStyle(theme, 'md', isLoading)
          ]}
          placeholder="Enter site name in English"
          placeholderTextColor={getPlaceholderColor(theme)}
          value={formData.name_en}
          onChangeText={(text) => updateFormData({ name_en: text })}
          onFocus={() => setFocusedField('name_en')}
          onBlur={() => setFocusedField(null)}
          editable={!isLoading}
        />
        {errors.name_en && <Text style={createInputErrorStyle(theme)}>{errors.name_en}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.name_ar, isLoading)}>
          Site Name (Arabic) *
        </Text>
        <TextInput
          style={[
            createInputStyle(theme, 'default', 'md', !!errors.name_ar, focusedField === 'name_ar', isLoading),
            createInputTextStyle(theme, 'md', isLoading)
          ]}
          placeholder="أدخل اسم الموقع بالعربية"
          placeholderTextColor={getPlaceholderColor(theme)}
          value={formData.name_ar}
          onChangeText={(text) => updateFormData({ name_ar: text })}
          onFocus={() => setFocusedField('name_ar')}
          onBlur={() => setFocusedField(null)}
          editable={!isLoading}
        />
        {errors.name_ar && <Text style={createInputErrorStyle(theme)}>{errors.name_ar}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.description_en, isLoading)}>
          Description (English) *
        </Text>
        <TextInput
          style={[
            createInputStyle(theme, 'default', 'md', !!errors.description_en, focusedField === 'description_en', isLoading),
            createInputTextStyle(theme, 'md', isLoading),
            { height: 120, textAlignVertical: 'top' }
          ]}
          placeholder="Describe the historical significance and details of this site"
          placeholderTextColor={getPlaceholderColor(theme)}
          value={formData.description_en}
          onChangeText={(text) => updateFormData({ description_en: text })}
          onFocus={() => setFocusedField('description_en')}
          onBlur={() => setFocusedField(null)}
          editable={!isLoading}
          multiline
          numberOfLines={4}
        />
        {errors.description_en && <Text style={createInputErrorStyle(theme)}>{errors.description_en}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.description_ar, isLoading)}>
          Description (Arabic) *
        </Text>
        <TextInput
          style={[
            createInputStyle(theme, 'default', 'md', !!errors.description_ar, focusedField === 'description_ar', isLoading),
            createInputTextStyle(theme, 'md', isLoading),
            { height: 120, textAlignVertical: 'top' }
          ]}
          placeholder="اوصف الأهمية التاريخية وتفاصيل هذا الموقع"
          placeholderTextColor={getPlaceholderColor(theme)}
          value={formData.description_ar}
          onChangeText={(text) => updateFormData({ description_ar: text })}
          onFocus={() => setFocusedField('description_ar')}
          onBlur={() => setFocusedField(null)}
          editable={!isLoading}
          multiline
          numberOfLines={4}
        />
        {errors.description_ar && <Text style={createInputErrorStyle(theme)}>{errors.description_ar}</Text>}
      </View>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepDescription}>
        Update the exact location of the historical site on the map.
      </Text>

      <View style={styles.inputContainer}>
        <LocationPicker
          coordinate={formData.coordinate}
          onLocationSelect={(coordinate) => updateFormData({ coordinate })}
          editable={!isLoading}
        />
        {errors.coordinate && <Text style={createInputErrorStyle(theme)}>{errors.coordinate}</Text>}
      </View>
    </View>
  );

  const renderMetadataStep = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      <Text style={styles.stepDescription}>
        Update the city, categories and tags for this historical site.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.city, isLoading)}>
          City *
        </Text>
        <CityFilter
          selectedCity={formData.selectedCity}
          onCityChange={(city) => updateFormData({ selectedCity: city })}
          disabled={isLoading}
        />
        {errors.city && <Text style={createInputErrorStyle(theme)}>{errors.city}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, false, isLoading)}>
          Categories (Optional)
        </Text>
        <CategoryFilter
          selectedCategories={formData.selectedCategories}
          onCategoriesChange={(categories) => updateFormData({ selectedCategories: categories })}
          disabled={isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, false, isLoading)}>
          Tags (Optional)
        </Text>
        <TagFilter
          selectedTags={formData.selectedTags}
          onTagsChange={(tags) => updateFormData({ selectedTags: tags })}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  const renderMediaStep = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Media Management</Text>
      <Text style={styles.stepDescription}>
        Add new photos and videos or manage existing media files.
      </Text>

      {formData.existingMedia.length > 0 && (
        <View style={styles.inputContainer}>
          <Text style={createInputLabelStyle(theme, false, isLoading)}>
            Existing Media ({formData.existingMedia.length} files)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: theme.spacing.sm }}
          >
            {formData.existingMedia.map((media, index) => (
              <View key={media.id} style={styles.existingMediaItem}>
                <View style={styles.existingMediaImageContainer}>
                  {media.file_url && (
                    <Image
                      source={{ uri: media.file_url }}
                      style={styles.existingMediaImage}
                      contentFit="cover"
                    />
                  )}
                  {media.is_thumbnail && (
                    <View style={styles.thumbnailBadge}>
                      <Text style={styles.thumbnailBadgeText}>Thumbnail</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteMediaButton}
                  onPress={() => handleDeleteExistingMedia(media.id, index)}
                  disabled={isLoading}
                >
                  <Ionicons name="trash" size={16} color={theme.colors.error} />
                </TouchableOpacity>
                {!media.is_thumbnail && (
                  <TouchableOpacity
                    style={styles.setThumbnailButton}
                    onPress={() => handleSetThumbnail(media.id, index)}
                    disabled={isLoading}
                  >
                    <Text style={styles.setThumbnailText}>Set as Thumbnail</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.mediaItems, isLoading)}>
          Add New Media Files (Optional)
        </Text>
        <MediaPicker
          mediaItems={formData.mediaItems}
          onMediaChange={(items) => {
            // Check if site already has a thumbnail
            const hasThumbnail = formData.existingMedia.some(media => media.is_thumbnail);

            // If site already has a thumbnail, don't set any new media as thumbnail
            if (hasThumbnail) {
              const itemsWithoutThumbnail = items.map(item => ({
                ...item,
                is_thumbnail: false
              }));
              updateFormData({ mediaItems: itemsWithoutThumbnail });
            } else {
              updateFormData({ mediaItems: items });
            }
          }}
          disabled={isLoading}
          maxItems={10}
        />
        {errors.mediaItems && <Text style={createInputErrorStyle(theme)}>{errors.mediaItems}</Text>}
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.reviewSection}>
      <Text style={styles.stepTitle}>Review & Update</Text>
      <Text style={styles.stepDescription}>
        Please review all changes before updating the historical site.
      </Text>

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Site Name</Text>
        <Text style={styles.reviewValue}>{formData.name_en}</Text>
        <Text style={styles.reviewValueSecondary}>{formData.name_ar}</Text>
      </View>

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Description</Text>
        <Text style={styles.reviewValue} numberOfLines={3}>{formData.description_en}</Text>
        <Text style={styles.reviewValueSecondary} numberOfLines={3}>{formData.description_ar}</Text>
      </View>

      {formData.coordinate && (
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Coordinates</Text>
          <Text style={styles.reviewValue}>
            {formData.coordinate.latitude.toFixed(4)}°, {formData.coordinate.longitude.toFixed(4)}°
          </Text>
        </View>
      )}

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>City</Text>
        <Text style={styles.reviewValue}>{formData.selectedCity || 'Not selected'}</Text>
      </View>

      {formData.selectedCategories.length > 0 && (
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Categories</Text>
          <Text style={styles.reviewValue}>{formData.selectedCategories.join(', ')}</Text>
        </View>
      )}

      {formData.selectedTags.length > 0 && (
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Tags</Text>
          <Text style={styles.reviewValue}>{formData.selectedTags.join(', ')}</Text>
        </View>
      )}

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Media Changes</Text>
        <Text style={styles.reviewValue}>
          {formData.mediaItems.length === 0
            ? 'No new media files to add'
            : (() => {
                const images = formData.mediaItems.filter(item => item.type.startsWith('image/')).length;
                const videos = formData.mediaItems.filter(item => item.type.startsWith('video/')).length;
                const parts = [];
                if (images > 0) parts.push(`${images} new photo${images !== 1 ? 's' : ''}`);
                if (videos > 0) parts.push(`${videos} new video${videos !== 1 ? 's' : ''}`);
                return parts.join(' and ') + ' to add';
              })()
          }
        </Text>
        {formData.existingMedia.length > 0 && (
          <Text style={styles.reviewValueSecondary}>
            {formData.existingMedia.length} existing media file{formData.existingMedia.length !== 1 ? 's' : ''} will remain
          </Text>
        )}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicInfoStep();
      case 'location':
        return renderLocationStep();
      case 'metadata':
        return renderMetadataStep();
      case 'media':
        return renderMediaStep();
      case 'review':
        return renderReviewStep();
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'basic':
        return !!(formData.name_en.trim() && formData.name_ar.trim() &&
                 formData.description_en.trim() && formData.description_ar.trim());
      case 'location':
        return !!formData.coordinate;
      case 'metadata':
        return !!formData.selectedCity;
      case 'media':
        return true; // Media is optional
      case 'review':
        return false; // No next on review step
      default:
        return false;
    }
  };

  const isFirstStep = currentStep === 'basic';
  const isLastStep = currentStep === 'review';

  // Loading state
  if (isLoadingSite) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading site data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!site) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.error }]}>
            Site not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Historical Site</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Form Content */}
      <KeyboardAvoidingView
        style={flexFull}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={flexFull}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Navigation Bar */}
      <View style={styles.navigationBar}>
        {!isFirstStep && (
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handlePrevious}
            disabled={isLoading}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        )}
        {isFirstStep && <View style={{ width: 48 }} />}

        {isLastStep ? (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Text style={styles.updateButtonText}>Update Site</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.arrowButton,
              canGoNext() && styles.arrowButtonActive,
              (!canGoNext() || isLoading) && styles.arrowButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!canGoNext() || isLoading}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={canGoNext() ? theme.colors.textInverse : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}