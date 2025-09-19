/**
 * Upload Historical Site Form
 * Multi-step form for creating new historical sites with validation
 * Follows existing form patterns from login/register
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { router } from 'expo-router';
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
} from '../../styles';
import { useAuth } from '../../contexts/AuthContext';
import { useReferenceData } from '../../contexts/ReferenceDataContext';
import { historicalSitesApi, siteHelpers } from '../../services/historicalSites';
import { LocationPicker } from '../../components/maps/LocationPicker';
import { CityFilter } from '../../components/filters/CityFilter';
import { CategoryFilter } from '../../components/filters/CategoryFilter';
import { TagFilter } from '../../components/filters/TagFilter';
import { MediaPicker, MediaItem } from '../../components/media/MediaPicker';
import { CreateSiteData, Coordinate, SiteFormErrors } from '../../types/historicalSites';
import {
  validateEnglishName,
  validateArabicName,
  validateEnglishDescription,
  validateArabicDescription
} from '../../utils/validation';
import { parseApiError, mapApiFieldToFormField } from '../../utils/errorParser';
import { canCreateContent } from '../../utils/permissions';
import { logger } from '../../utils/logger';

type FormStep = 'basic' | 'location' | 'metadata' | 'review';

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
}

const INITIAL_FORM_DATA: FormData = {
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  coordinate: undefined,
  selectedCity: undefined,
  selectedCategories: [],
  selectedTags: [],
  mediaItems: []
};

export default function Upload() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { findCityByName, findCategoryBySlug, findTagBySlug } = useReferenceData();

  // Check if user has permission to create content
  const userCanCreateContent = canCreateContent(user?.role);

  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<SiteFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Debounced validation
  const validationTimeoutRef = useRef<any>(null);

  // Cleanup validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const debouncedValidation = useCallback((fieldName: string, value: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      const newErrors = { ...errors };
      delete newErrors[fieldName as keyof SiteFormErrors];

      let error: string | undefined;
      switch (fieldName) {
        case 'name_en':
          error = validateEnglishName(value);
          break;
        case 'name_ar':
          error = validateArabicName(value);
          break;
        case 'description_en':
          error = validateEnglishDescription(value);
          break;
        case 'description_ar':
          error = validateArabicDescription(value);
          break;
      }

      if (error) {
        newErrors[fieldName as keyof SiteFormErrors] = error;
      }

      setErrors(newErrors);
    }, 500);
  }, [errors]);

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
      paddingBottom: 100, // Extra space for floating navigation buttons
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
      pointerEvents: 'box-none', // Allow touch events to pass through transparent areas
    },
    navButton: {
      ...createButtonStyle(theme, 'secondary', 'md', false),
      minWidth: 100,
    },
    navButtonPrimary: {
      ...createButtonStyle(theme, 'primary', 'md', false),
      minWidth: 100,
    },
    navButtonDisabled: {
      ...createButtonStyle(theme, 'secondary', 'md', true),
      minWidth: 100,
    },
    navButtonText: {
      ...createButtonTextStyle(theme, 'secondary', 'md'),
    },
    navButtonTextPrimary: {
      ...createButtonTextStyle(theme, 'primary', 'md'),
    },
    navButtonTextDisabled: {
      ...createButtonTextStyle(theme, 'secondary', 'md'),
      opacity: 0.5,
    },
    arrowButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      ...createShadow(theme, 'md'),
      pointerEvents: 'auto', // Ensure buttons are touchable
    },
    arrowButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    arrowButtonDisabled: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: 24,
      ...createShadow(theme, 'md'),
      pointerEvents: 'auto', // Ensure button is touchable
    },
    createButtonText: {
      ...createButtonTextStyle(theme, 'primary', 'md'),
      fontWeight: theme.fontWeight.semibold,
    },
    dummyButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.backgroundSecondary,
      marginLeft: theme.spacing.md,
    },
  }))(theme);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));

    // Handle text fields with debounced validation
    if ('name_en' in updates) {
      debouncedValidation('name_en', updates.name_en || '');
    }
    if ('name_ar' in updates) {
      debouncedValidation('name_ar', updates.name_ar || '');
    }
    if ('description_en' in updates) {
      debouncedValidation('description_en', updates.description_en || '');
    }
    if ('description_ar' in updates) {
      debouncedValidation('description_ar', updates.description_ar || '');
    }

    // Handle non-text fields with immediate validation/clearing
    const newErrors = { ...errors };
    if ('coordinate' in updates) {
      delete newErrors.coordinate;
    }
    if ('selectedCity' in updates) {
      delete newErrors.city;
    }
    if ('mediaItems' in updates) {
      delete newErrors.mediaItems;
    }

    // Only update errors for non-text fields immediately
    if ('coordinate' in updates || 'selectedCity' in updates || 'mediaItems' in updates) {
      setErrors(newErrors);
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: SiteFormErrors = {};

    switch (currentStep) {
      case 'basic':
        // Use backend-matching validation for text patterns
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
        // Media is optional in the new approach
        // if (formData.mediaItems.length === 0) {
        //   newErrors.mediaItems = 'At least one image or video is required';
        // }
        break;

      case 'review':
        // Final comprehensive validation using all validation rules
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

        // Media is optional in the new approach
        // if (formData.mediaItems.length === 0) {
        //   newErrors.mediaItems = 'At least one image or video is required';
        // }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    const steps: FormStep[] = ['basic', 'location', 'metadata', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: FormStep[] = ['basic', 'location', 'metadata', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

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

      const siteData: CreateSiteData = {
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

      // Step 1: Create the historical site without media
      const siteResponse = await historicalSitesApi.createSite(siteData);

      if (!siteResponse.success) {
        Alert.alert('Error', 'Failed to create site');
        return;
      }

      const siteId = siteResponse.data.id;
      logger.info('sites', 'Site created successfully', { siteId, siteData });

      // Step 2: Upload media files if any
      if (formData.mediaItems.length > 0) {
        try {
          const mediaResponse = await historicalSitesApi.uploadSiteMedia(siteId, formData.mediaItems);

          if (!mediaResponse.success) {
            logger.warn('media', 'Media upload failed after site creation', { siteId });
            Alert.alert(
              'Partial Success',
              'Site was created but some media files failed to upload. You can add them later.',
              [{ text: 'OK' }]
            );
          } else {
            logger.info('sites', 'Site created successfully with media', { siteId, mediaCount: formData.mediaItems.length });
          }
        } catch (mediaError) {
          const errorMessage = mediaError instanceof Error ? mediaError.message : 'Media upload failed';
          logger.error('media', 'Media upload error after site creation', {
            siteId,
            error: errorMessage,
            mediaCount: formData.mediaItems.length
          });
          Alert.alert(
            'Partial Success',
            'Site was created but media upload failed. You can add media files later.',
            [{ text: 'OK' }]
          );
        }
      } else {
        logger.info('sites', 'Site created successfully without media', { siteId });
      }

      // Clear the form after successful creation
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep('basic');
      setErrors({});

      // Auto-navigate to the created site
      router.push(`/sites/${siteId}?from=creation`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Site creation failed';
      logger.error('sites', 'Site creation error', {
        error: errorMessage,
        formData: {
          name_en: formData.name_en,
          name_ar: formData.name_ar,
          citySelected: formData.selectedCity,
          hasLocation: !!formData.coordinate,
          mediaCount: formData.mediaItems.length
        }
      });

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
            case 'review':
              return false; // All errors are handled in previous steps
            default:
              return false;
          }
        };

        const steps: FormStep[] = ['basic', 'location', 'metadata', 'review'];
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

  const renderStepIndicator = () => {
    const steps: { key: FormStep; number: number }[] = [
      { key: 'basic', number: 1 },
      { key: 'location', number: 2 },
      { key: 'metadata', number: 3 },
      { key: 'review', number: 4 }
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

  const fillDummyData = () => {
    const dummyDataSets = [
      {
        name_en: 'Kuwait Towers',
        name_ar: 'أبراج الكويت',
        description_en: 'Iconic towers built in 1979 that have become the symbol of modern Kuwait. These architectural marvels feature distinctive blue-green spheres and serve as water reservoirs while offering panoramic views of Kuwait City and the Arabian Gulf.',
        description_ar: 'أبراج مميزة بُنيت عام 1979 وأصبحت رمزاً للكويت الحديثة. تتميز هذه المعجزات المعمارية بكراتها الزرقاء والخضراء المميزة وتعمل كخزانات مياه بينما توفر مناظر بانورامية لمدينة الكويت والخليج العربي.'
      },
      {
        name_en: 'Grand Mosque',
        name_ar: 'المسجد الكبير',
        description_en: 'The largest mosque in Kuwait, completed in 1986, featuring stunning Islamic architecture with intricate geometric patterns, beautiful calligraphy, and a magnificent central dome. This spiritual landmark can accommodate over 10,000 worshippers.',
        description_ar: 'أكبر مسجد في الكويت، اكتمل بناؤه عام 1986، ويتميز بعمارة إسلامية مذهلة مع أنماط هندسية معقدة وخط جميل وقبة مركزية رائعة. يمكن لهذا المعلم الروحي أن يستوعب أكثر من 10000 مصلٍ.'
      },
      {
        name_en: 'Seif Palace',
        name_ar: 'قصر السيف',
        description_en: 'The official residence of the Emir of Kuwait, featuring traditional Islamic architecture with blue-tiled clock tower. Built in 1896 and renovated multiple times, this palace represents the political heart of Kuwait and showcases beautiful Kuwaiti craftsmanship.',
        description_ar: 'المقر الرسمي لأمير الكويت، ويتميز بالعمارة الإسلامية التقليدية مع برج ساعة مكسو بالبلاط الأزرق. بُني عام 1896 ورُمم عدة مرات، ويمثل هذا القصر القلب السياسي للكويت ويعرض الحرفية الكويتية الجميلة.'
      },
      {
        name_en: 'Liberation Tower',
        name_ar: 'برج التحرير',
        description_en: 'A telecommunications tower built to commemorate Kuwait\'s liberation from Iraqi occupation in 1991. Standing at 372 meters tall, it was once the tallest structure in Kuwait and serves as a symbol of freedom and resilience.',
        description_ar: 'برج اتصالات بُني لإحياء ذكرى تحرير الكويت من الاحتلال العراقي عام 1991. يبلغ ارتفاعه 372 متراً، وكان ذات يوم أطول مبنى في الكويت ويعتبر رمزاً للحرية والصمود.'
      },
      {
        name_en: 'Souq Al-Mubarakiya',
        name_ar: 'سوق المباركية',
        description_en: 'One of the oldest markets in Kuwait, dating back over 200 years. This traditional bazaar offers a glimpse into Kuwait\'s trading heritage with its narrow alleys, traditional architecture, and vendors selling spices, textiles, and authentic Kuwaiti goods.',
        description_ar: 'واحد من أقدم الأسواق في الكويت، يعود تاريخه إلى أكثر من 200 عام. يوفر هذا البازار التقليدي لمحة عن تراث الكويت التجاري بأزقته الضيقة وعمارته التقليدية والباعة الذين يبيعون التوابل والمنسوجات والسلع الكويتية الأصيلة.'
      },
      {
        name_en: 'Red Fort',
        name_ar: 'القلعة الحمراء',
        description_en: 'A historic fort built in 1920 as part of Kuwait\'s old city wall defense system. This red-brick structure served as a watchtower and represents the architectural heritage of early 20th century Kuwait during the pearl diving era.',
        description_ar: 'قلعة تاريخية بُنيت عام 1920 كجزء من نظام دفاع سور مدينة الكويت القديمة. خدم هذا المبنى المصنوع من الطوب الأحمر كبرج مراقبة ويمثل التراث المعماري للكويت في أوائل القرن العشرين خلال عصر الغوص للبحث عن اللؤلؤ.'
      },
      {
        name_en: 'Failaka Island Archaeological Site',
        name_ar: 'موقع جزيرة فيلكا الأثري',
        description_en: 'Ancient ruins on Failaka Island dating back to the Bronze Age and Hellenistic period. This archaeological treasure includes Greek temples, ancient settlements, and artifacts that reveal Kuwait\'s connection to ancient civilizations and maritime trade routes.',
        description_ar: 'أطلال قديمة في جزيرة فيلكا تعود إلى العصر البرونزي والفترة الهلنستية. يشمل هذا الكنز الأثري معابد يونانية ومستوطنات قديمة وقطع أثرية تكشف عن صلة الكويت بالحضارات القديمة وطرق التجارة البحرية.'
      },
      {
        name_en: 'Kuwait National Museum',
        name_ar: 'المتحف الوطني الكويتي',
        description_en: 'Built in 1983, this museum houses Kuwait\'s cultural heritage including archaeological artifacts, traditional boats, Bedouin tents, and Islamic art. The building itself represents modern Kuwaiti architecture and serves as a guardian of the nation\'s history.',
        description_ar: 'بُني عام 1983، ويضم هذا المتحف التراث الثقافي للكويت بما في ذلك القطع الأثرية والقوارب التقليدية وخيام البدو والفن الإسلامي. يمثل المبنى نفسه العمارة الكويتية الحديثة ويعمل كحارس لتاريخ الأمة.'
      }
    ];

    const randomIndex = Math.floor(Math.random() * dummyDataSets.length);
    const selectedData = dummyDataSets[randomIndex];

    updateFormData(selectedData);
  };

  const renderBasicInfoStep = () => (
    <View style={styles.formSection}>
      <View style={[rowCenter, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>Basic Information</Text>
          <Text style={styles.stepDescription}>
            Enter the name and description of the historical site in both English and Arabic.
          </Text>
        </View>
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={fillDummyData} style={styles.dummyButton}>
            <Ionicons name="dice" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

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
        Pin the exact location of the historical site on the map.
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
        Select the city and add photos and videos to showcase this historical site.
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

      <View style={styles.inputContainer}>
        <Text style={createInputLabelStyle(theme, !!errors.mediaItems, isLoading)}>
          Media Files (Optional)
        </Text>
        <Text style={[createTypographyStyle(theme, 'caption'), { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>
          Add photos and videos to showcase this historical site. You can also add media files after creating the site.
        </Text>
        <MediaPicker
          mediaItems={formData.mediaItems}
          onMediaChange={(items) => updateFormData({ mediaItems: items })}
          disabled={isLoading}
          maxItems={10}
        />
        {errors.mediaItems && <Text style={createInputErrorStyle(theme)}>{errors.mediaItems}</Text>}
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.reviewSection}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Please review all information before creating the historical site.
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
            {siteHelpers.formatCoordinates(formData.coordinate.latitude, formData.coordinate.longitude)}
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
        <Text style={styles.reviewLabel}>Media Files</Text>
        <Text style={styles.reviewValue}>
          {formData.mediaItems.length === 0
            ? 'No media files selected'
            : (() => {
                const images = formData.mediaItems.filter(item => item.type.startsWith('image/')).length;
                const videos = formData.mediaItems.filter(item => item.type.startsWith('video/')).length;
                const parts = [];
                if (images > 0) parts.push(`${images} photo${images !== 1 ? 's' : ''}`);
                if (videos > 0) parts.push(`${videos} video${videos !== 1 ? 's' : ''}`);
                return parts.join(' and ') + ' selected';
              })()
          }
        </Text>
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
        return !!formData.selectedCity; // Media is now optional
      case 'review':
        return false; // No next on review step
      default:
        return false;
    }
  };

  const isFirstStep = currentStep === 'basic';
  const isLastStep = currentStep === 'review';

  // Show permission denied screen for users without creation permissions
  if (!userCanCreateContent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={[flexFull, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.lg }]}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[createTypographyStyle(theme, 'h2'), { textAlign: 'center', marginVertical: theme.spacing.lg }]}>
            Access Restricted
          </Text>
          <Text style={[createTypographyStyle(theme, 'body'), { textAlign: 'center', color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }]}>
            You need contributor privileges or higher to create historical sites. Please contact an administrator to upgrade your account.
          </Text>
          <TouchableOpacity
            style={createButtonStyle(theme, 'primary', 'md')}
            onPress={() => router.replace('/')}
          >
            <Text style={createButtonTextStyle(theme, 'primary', 'md')}>
              Back to Explore
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Historical Site</Text>
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
            style={styles.createButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Text style={styles.createButtonText}>Create Site</Text>
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