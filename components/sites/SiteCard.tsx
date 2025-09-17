/**
 * Site Card Component
 * Individual historical site item for list display
 * Follows existing styling patterns
 */

import React from 'react';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  createStyles,
  createTypographyStyle,
  rowCenter,
  useTheme
} from '../../styles';
import { HistoricalSite } from '../../types/historicalSites';
import { siteHelpers } from '../../services/historicalSites';
import { useReferenceData } from '../../contexts/ReferenceDataContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = screenWidth - (CARD_MARGIN * 2);

interface SiteCardProps {
  site: HistoricalSite;
  onPress: (site: HistoricalSite) => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({ site, onPress }) => {
  const { theme } = useTheme();
  const { getCityName } = useReferenceData();

  const thumbnailImage = siteHelpers.getThumbnailImage(site);

  const styles = createStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: CARD_MARGIN,
      marginVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      overflow: 'hidden',
    },
    imageContainer: {
      width: CARD_WIDTH,
      height: 200,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.backgroundSecondary,
    },
    content: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    header: {
      gap: theme.spacing.xs,
    },
    title: {
      ...createTypographyStyle(theme, 'h3'),
      numberOfLines: 2,
    },
    titleArabic: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    metadata: {
      gap: theme.spacing.xs,
    },
    metadataRow: {
      ...rowCenter,
      gap: theme.spacing.xs,
    },
    metadataText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      flex: 1,
    },
    tagsContainer: {
      ...rowCenter,
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    tag: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
    },
    tagText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    }
  }))(theme);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(site)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {thumbnailImage ? (
          <Image
            source={{ uri: thumbnailImage.file }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name="image-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {site.name_en}
          </Text>
          <Text style={styles.titleArabic} numberOfLines={1}>
            {site.name_ar}
          </Text>
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          {/* Location */}
          <View style={styles.metadataRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.metadataText}>
              {getCityName(site.city)}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.metadataRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.metadataText}>
              Added {formatDate(site.created_at)}
            </Text>
          </View>

          {/* Media count */}
          {site.media_files.length > 0 && (
            <View style={styles.metadataRow}>
              <Ionicons
                name="images-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.metadataText}>
                {site.media_files.length} photo{site.media_files.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {site.tags_detail.length > 0 && (
          <View style={styles.tagsContainer}>
            {site.tags_detail.slice(0, 3).map((tag) => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>
                  {tag.slug_en.replace(/-/g, ' ')}
                </Text>
              </View>
            ))}
            {site.tags_detail.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  +{site.tags_detail.length - 3} more
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};