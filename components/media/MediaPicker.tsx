/**
 * Media Picker Component
 * Allows users to select and preview multiple images and videos for historical sites
 * Supports: Images (jpg, jpeg, png, gif, webp - max 10MB) and Videos (mp4, avi, mov, wmv, flv, webm, mkv - max 100MB)
 * Follows existing component patterns and styling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  createButtonStyle,
  createButtonTextStyle,
  createStyles,
  createTypographyStyle,
  rowCenter,
  useTheme
} from '../../styles';

export interface MediaItem {
  uri: string;
  name: string;
  type: string;
  size: number;
  title?: string;
  caption?: string;
  is_thumbnail?: boolean;
}

interface MediaPickerProps {
  mediaItems: MediaItem[];
  onMediaChange: (items: MediaItem[]) => void;
  maxItems?: number;
  disabled?: boolean;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  mediaItems,
  onMediaChange,
  maxItems = 10,
  disabled = false
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles((theme) => ({
    container: {
      gap: theme.spacing.md,
    },
    header: {
      gap: theme.spacing.xs,
    },
    title: {
      ...createTypographyStyle(theme, 'h3'),
    },
    description: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
    },
    mediaGrid: {
      gap: theme.spacing.md,
    },
    mediaRow: {
      ...rowCenter,
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    mediaItem: {
      width: 100,
      height: 100,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.backgroundSecondary,
      position: 'relative',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    },
    videoPreview: {
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
    },
    videoText: {
      ...createTypographyStyle(theme, 'caption'),
      color: 'white',
      textAlign: 'center',
      marginTop: theme.spacing.xs,
      fontSize: 10,
    },
    mediaOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButton: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.full,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbnailIndicator: {
      position: 'absolute',
      bottom: theme.spacing.xs,
      left: theme.spacing.xs,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
    },
    thumbnailText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textInverse,
      fontSize: 10,
    },
    addButton: {
      ...createButtonStyle(theme, 'secondary', 'md', false),
      ...rowCenter,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      minHeight: 100,
    },
    addButtonDisabled: {
      opacity: 0.5,
    },
    addButtonText: {
      ...createButtonTextStyle(theme, 'secondary', 'md'),
      color: theme.colors.textSecondary,
    },
    info: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    infoText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.primary,
    },
    errorText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    }
  }))(theme);

  const pickImages = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const validItems: MediaItem[] = [];
        const invalidItems: string[] = [];

        for (const [index, asset] of result.assets.entries()) {
          const isImage = asset.mimeType?.startsWith('image/');
          const isVideo = asset.mimeType?.startsWith('video/');
          const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos

          if (!isImage && !isVideo) {
            invalidItems.push(`${asset.name} (unsupported file type)`);
            continue;
          }

          if (asset.size && asset.size > maxSize) {
            const maxMB = isImage ? '10MB' : '100MB';
            invalidItems.push(`${asset.name} (exceeds ${maxMB} limit)`);
            continue;
          }

          validItems.push({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || (isImage ? 'image/jpeg' : 'video/mp4'),
            size: asset.size || 0,
            is_thumbnail: mediaItems.length === 0 && index === 0 && isImage, // Only images can be thumbnails
          });
        }

        if (invalidItems.length > 0) {
          Alert.alert(
            'Invalid Files',
            `The following files were skipped:\n• ${invalidItems.join('\n• ')}`
          );
        }

        const totalItems = mediaItems.length + validItems.length;
        if (totalItems > maxItems) {
          Alert.alert(
            'Too Many Files',
            `You can only select up to ${maxItems} files. ${totalItems - maxItems} file(s) will be ignored.`
          );
          const allowedItems = validItems.slice(0, maxItems - mediaItems.length);
          onMediaChange([...mediaItems, ...allowedItems]);
        } else {
          onMediaChange([...mediaItems, ...validItems]);
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...mediaItems];
    const removedItem = newItems[index];
    newItems.splice(index, 1);

    // If we removed the thumbnail and there are other items, make the first one the thumbnail
    if (removedItem.is_thumbnail && newItems.length > 0) {
      newItems[0].is_thumbnail = true;
    }

    onMediaChange(newItems);
  };

  const setAsThumbnail = (index: number) => {
    const item = mediaItems[index];
    // Only images can be thumbnails
    if (!item.type.startsWith('image/')) {
      Alert.alert('Invalid Thumbnail', 'Only images can be set as thumbnails.');
      return;
    }

    const newItems = mediaItems.map((item, i) => ({
      ...item,
      is_thumbnail: i === index
    }));
    onMediaChange(newItems);
  };

  const canAddMore = mediaItems.length < maxItems && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos & Videos</Text>
        <Text style={styles.description}>
          Add photos and videos to showcase this historical site. Only photos can be used as thumbnails.
        </Text>
      </View>

      <View style={styles.mediaGrid}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.mediaRow}>
            {mediaItems.map((item, index) => {
              const isVideo = item.type.startsWith('video/');
              const isImage = item.type.startsWith('image/');

              return (
                <View key={`${item.uri}-${index}`} style={styles.mediaItem}>
                  {isImage ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.mediaImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.videoPreview}>
                      <Ionicons name="videocam" size={32} color="white" />
                      <Text style={styles.videoText} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </View>
                  )}

                  {item.is_thumbnail && (
                    <View style={styles.thumbnailIndicator}>
                      <Text style={styles.thumbnailText}>COVER</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.mediaOverlay}
                    onPress={() => setAsThumbnail(index)}
                    activeOpacity={0.7}
                    disabled={isVideo}
                  >
                    <Ionicons
                      name={item.is_thumbnail ? "star" : "star-outline"}
                      size={24}
                      color={isVideo ? 'rgba(255, 255, 255, 0.3)' : 'white'}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}

            {canAddMore && (
              <TouchableOpacity
                style={[styles.addButton, !canAddMore && styles.addButtonDisabled]}
                onPress={pickImages}
                disabled={!canAddMore || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                ) : (
                  <>
                    <Ionicons name="add" size={24} color={theme.colors.textSecondary} />
                    <Text style={styles.addButtonText}>Add Media</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {mediaItems.length > 0 && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            • Tap the star icon to set a photo as the cover image (videos cannot be cover images)
          </Text>
          <Text style={styles.infoText}>
            • Use the × button to remove media files
          </Text>
          <Text style={styles.infoText}>
            • {mediaItems.length}/{maxItems} files selected
          </Text>
          <Text style={styles.infoText}>
            • Supports images (max 10MB) and videos (max 100MB)
          </Text>
        </View>
      )}

      {!canAddMore && mediaItems.length >= maxItems && (
        <Text style={styles.errorText}>
          Maximum {maxItems} files allowed
        </Text>
      )}
    </View>
  );
};