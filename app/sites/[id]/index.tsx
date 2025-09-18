/**
 * Site Detail View
 * Displays full information about a historical site with map and media
 * Follows existing styling patterns
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import {
  centerContent,
  createStyles,
  createTypographyStyle,
  flexFull,
  rowCenter,
  useTheme
} from '../../../styles';
import { useAuth } from '../../../contexts/AuthContext';
import { useReferenceData } from '../../../contexts/ReferenceDataContext';
import { historicalSitesApi, siteHelpers } from '../../../services/historicalSites';
import { HistoricalSite } from '../../../types/historicalSites';
import { AxiosError } from 'axios';
import { apiHelpers } from '../../../services/api';
import { canEditSite as checkCanEditSite, canDeleteSite as checkCanDeleteSite } from '../../../utils/permissions';
import { VideoPreview } from '../../../components/media/VideoPreview';
import { isVideoFile } from '../../../utils/mediaUtils';

const { width: screenWidth } = Dimensions.get('window');
export default function SiteDetail() {
  const { theme } = useTheme();
  const { id, from } = useLocalSearchParams();
  const { user } = useAuth();
  const { getCityName } = useReferenceData();

  const [site, setSite] = useState<HistoricalSite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const siteId = parseInt(id as string, 10);

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
    actionButtons: {
      ...rowCenter,
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.xs,
    },
    scrollContainer: {
      paddingBottom: theme.spacing.lg,
    },
    imageContainer: {
      height: 300,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageNavigation: {
      position: 'absolute',
      bottom: theme.spacing.md,
      left: 0,
      right: 0,
      ...rowCenter,
      justifyContent: 'center',
      gap: theme.spacing.xs,
    },
    imageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeImageDot: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    leftArrow: {
      position: 'absolute',
      top: '50%',
      left: theme.spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 12,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ translateY: -16 }],
    },
    rightArrow: {
      position: 'absolute',
      top: '50%',
      right: theme.spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 12,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ translateY: -16 }],
    },
    contentSection: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    titleSection: {
      gap: theme.spacing.xs,
    },
    title: {
      ...createTypographyStyle(theme, 'h1'),
    },
    titleArabic: {
      ...createTypographyStyle(theme, 'h2'),
      color: theme.colors.textSecondary,
    },
    description: {
      ...createTypographyStyle(theme, 'body'),
      lineHeight: 24,
    },
    descriptionArabic: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      lineHeight: 24,
      textAlign: 'right',
    },
    metadataSection: {
      gap: theme.spacing.sm,
    },
    metadataRow: {
      ...rowCenter,
      gap: theme.spacing.sm,
    },
    metadataText: {
      ...createTypographyStyle(theme, 'body'),
      flex: 1,
    },
    coordinatesButton: {
      ...rowCenter,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    coordinatesText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textPrimary,
      fontWeight: theme.fontWeight.medium,
    },
    mapContainer: {
      height: 200,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginVertical: theme.spacing.md,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    tagsSection: {
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      ...createTypographyStyle(theme, 'h3'),
    },
    tagsContainer: {
      ...rowCenter,
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tag: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    tagText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    loadingContainer: {
      ...flexFull,
      ...centerContent,
    },
    errorContainer: {
      ...flexFull,
      ...centerContent,
      paddingHorizontal: theme.spacing.lg,
    },
    errorText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    placeholderContainer: {
      ...centerContent,
      height: 300,
      backgroundColor: theme.colors.backgroundSecondary,
    }
  }))(theme);

  useEffect(() => {
    if (siteId && !isNaN(siteId)) {
      loadSiteDetails();
    }
  }, [siteId, loadSiteDetails]);


  const loadSiteDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await historicalSitesApi.getSite(siteId);
      if (response.success) {
        setSite(response.data);
      } else {
        setError('Failed to load site details');
      }
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? apiHelpers.getUserFriendlyMessage(error)
        : 'Failed to load site details';

      // If site is not found (404), likely deleted, redirect to explore
      if (error instanceof AxiosError && error.response?.status === 404) {
        router.replace('/');
        return;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  const handleBack = () => {
    // If coming from site creation, always go to explore
    if (from === 'creation') {
      router.replace('/');
      return;
    }

    // For normal navigation, check if we can go back
    if (router.canGoBack()) {
      router.back();
    } else {
      // If no previous page, navigate to explore (main page)
      router.replace('/');
    }
  };

  const handleEdit = () => {
    router.push(`/sites/${siteId}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Site',
      'Are you sure you want to delete this historical site? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      const response = await historicalSitesApi.deleteSite(siteId);

      // Handle successful deletion - 204 responses might not have response.data
      // or might have response.success = true
      if (response?.success !== false) {
        // Navigate to explore page instead of going back to avoid showing deleted site
        router.replace('/');
      } else {
        Alert.alert('Error', 'Failed to delete site');
      }
    } catch (error) {
      // Check if it's actually a successful 204 response that axios treats as an error
      if (error instanceof AxiosError && error.response?.status === 204) {
        // 204 No Content is actually success for deletion
        router.replace('/');
        return;
      }

      const errorMessage = error instanceof AxiosError
        ? apiHelpers.getUserFriendlyMessage(error)
        : 'Failed to delete site';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleOpenInMaps = () => {
    if (!site) return;

    const url = `https://maps.apple.com/?q=${site.latitude},${site.longitude}`;
    Linking.openURL(url);
  };

  const userCanEdit = useMemo(() => {
    if (!site || !user) return false;
    return checkCanEditSite(site.user, user.id, user.role);
  }, [site, user]);

  const userCanDelete = useMemo(() => {
    if (!site || !user) return false;
    return checkCanDeleteSite(site.user, user.id, user.role);
  }, [site, user]);

  const renderImageGallery = () => {
    if (!site?.media_files.length) {
      return (
        <View style={styles.placeholderContainer}>
          <Ionicons
            name="image-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={createTypographyStyle(theme, 'caption')}>
            No images available
          </Text>
        </View>
      );
    }

    const currentMedia = site.media_files[selectedImageIndex];
    const isVideo = isVideoFile(currentMedia);

    return (
      <View style={styles.imageContainer}>
        {isVideo ? (
          <VideoPreview
            uri={currentMedia.file}
            width={screenWidth}
            height={240}
            showControls={true}
            autoPlay={false}
            thumbnailOnly={false}
            style={styles.image}
          />
        ) : (
          <Image
            source={{ uri: currentMedia.file }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        )}

        {site.media_files.length > 1 && (
          <>
            {/* Left Arrow */}
            <TouchableOpacity
              style={styles.leftArrow}
              onPress={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : site.media_files.length - 1)}
            >
              <Ionicons name="chevron-back" size={28} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>

            {/* Right Arrow */}
            <TouchableOpacity
              style={styles.rightArrow}
              onPress={() => setSelectedImageIndex(selectedImageIndex < site.media_files.length - 1 ? selectedImageIndex + 1 : 0)}
            >
              <Ionicons name="chevron-forward" size={28} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>

            {/* Dots Navigation */}
            <View style={styles.imageNavigation}>
              {site.media_files.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.imageDot,
                    index === selectedImageIndex && styles.activeImageDot
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                />
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={createTypographyStyle(theme, 'caption')}>
            Loading site details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !site) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Site not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {userCanEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          {userCanDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={flexFull} contentContainerStyle={styles.scrollContainer}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Content */}
        <View style={styles.contentSection}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{site.name_en}</Text>
            <Text style={styles.titleArabic}>{site.name_ar}</Text>
          </View>

          {/* Description */}
          <View>
            <Text style={styles.description}>{site.description_en}</Text>
            <Text style={styles.descriptionArabic}>{site.description_ar}</Text>
          </View>

          {/* Metadata */}
          <View style={styles.metadataSection}>
            {/* Location */}
            <View style={styles.metadataRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.metadataText}>
                {getCityName(site.city)}
              </Text>
            </View>

            {/* Open in Maps */}
            <TouchableOpacity style={styles.coordinatesButton} onPress={handleOpenInMaps}>
              <Ionicons name="map-outline" size={20} color={theme.colors.textPrimary} />
              <Text style={styles.coordinatesText}>
                Open in Maps
              </Text>
              <Ionicons name="open-outline" size={16} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            {/* Date Added */}
            <View style={styles.metadataRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.metadataText}>
                Added on {new Date(site.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: site.latitude,
                longitude: site.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: site.latitude,
                  longitude: site.longitude,
                }}
                title={site.name_en}
                description={getCityName(site.city)}
              />
            </MapView>
          </View>

          {/* Tags */}
          {site.tags_detail.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {site.tags_detail.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {tag.slug_en.replace(/-/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Categories */}
          {site.categories_detail.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.tagsContainer}>
                {site.categories_detail.map((category) => (
                  <View key={category.id} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {category.slug_en.replace(/-/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}