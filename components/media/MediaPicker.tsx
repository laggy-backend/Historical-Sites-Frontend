/**
 * Media Picker Component
 * Allows users to select and preview multiple images and videos for historical sites
 * Uses expo-image-picker for proper gallery/camera access instead of file system
 * Supports: Images (jpg, jpeg, png, gif, webp - max 10MB) and Videos (mp4, mov - max 100MB)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  size?: number;
  width?: number;
  height?: number;
  title?: string;
  caption?: string;
  is_thumbnail?: boolean;
  // File object for upload (created from uri)
  file?: any;
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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to select images and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showMediaOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photo Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Media',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: openCamera },
          { text: 'Gallery', onPress: openGallery },
        ]
      );
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        await processSelectedMedia([asset]);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo/video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: maxItems - mediaItems.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processSelectedMedia(result.assets);
      }
    } catch {
      Alert.alert('Error', 'Failed to select media. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processSelectedMedia = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const validItems: MediaItem[] = [];
    const invalidItems: string[] = [];

    for (const [index, asset] of assets.entries()) {
      const isImage = asset.type === 'image';
      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos

      // Generate a name from URI if not provided
      const fileName = asset.fileName || asset.uri.split('/').pop() || `${isImage ? 'image' : 'video'}_${Date.now()}`;

      // Validate file type before processing
      const extension = fileName.toLowerCase().split('.').pop() || '';
      const supportedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const supportedVideoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];

      if (isImage && !supportedImageTypes.includes(extension)) {
        invalidItems.push(`${fileName} (unsupported image format. Supported: ${supportedImageTypes.join(', ')})`);
        continue;
      }

      if (!isImage && !supportedVideoTypes.includes(extension)) {
        invalidItems.push(`${fileName} (unsupported video format. Supported: ${supportedVideoTypes.join(', ')})`);
        continue;
      }

      // Estimate file size if not provided (rough estimate based on dimensions and type)
      let estimatedSize = 0;
      if (asset.fileSize) {
        estimatedSize = asset.fileSize;
      } else if (asset.width && asset.height) {
        // Rough size estimation
        estimatedSize = isImage
          ? (asset.width * asset.height * 3) // RGB
          : (asset.width * asset.height * 1.5 * (asset.duration || 10)); // Video estimation
      }

      if (estimatedSize > maxSize) {
        const maxMB = isImage ? '10MB' : '100MB';
        invalidItems.push(`${fileName} (estimated size exceeds ${maxMB} limit)`);
        continue;
      }

      // Create file object for upload - React Native FormData compatible format
      // Better MIME type detection based on file extension and asset type
      let fileType = asset.mimeType;

      if (!fileType) {
        // Extract extension from filename
        const extension = fileName.toLowerCase().split('.').pop() || '';

        if (isImage) {
          // Handle image MIME types
          switch (extension) {
            case 'jpg':
            case 'jpeg':
              fileType = 'image/jpeg';
              break;
            case 'png':
              fileType = 'image/png';
              break;
            case 'gif':
              fileType = 'image/gif';
              break;
            case 'webp':
              fileType = 'image/webp';
              break;
            default:
              fileType = 'image/jpeg'; // fallback for images
          }
        } else {
          // Handle video MIME types
          switch (extension) {
            case 'mp4':
              fileType = 'video/mp4';
              break;
            case 'avi':
              fileType = 'video/x-msvideo';
              break;
            case 'mov':
              fileType = 'video/quicktime';
              break;
            case 'wmv':
              fileType = 'video/x-ms-wmv';
              break;
            case 'flv':
              fileType = 'video/x-flv';
              break;
            case 'webm':
              fileType = 'video/webm';
              break;
            case 'mkv':
              fileType = 'video/x-matroska';
              break;
            default:
              fileType = 'video/mp4'; // fallback for videos
          }
        }
      }

      const fileObject = {
        uri: asset.uri,
        name: fileName,
        type: fileType
      };

      validItems.push({
        uri: asset.uri,
        name: fileName,
        type: fileType,
        size: estimatedSize,
        width: asset.width,
        height: asset.height,
        is_thumbnail: mediaItems.length === 0 && index === 0 && isImage, // Only first image can be thumbnail
        file: fileObject
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
  };

  const removeItem = (index: number) => {
    const newItems = [...mediaItems];
    const removedItem = newItems[index];
    newItems.splice(index, 1);

    // If we removed the thumbnail and there are other items, make the first image the thumbnail
    if (removedItem.is_thumbnail && newItems.length > 0) {
      const firstImage = newItems.find(item => item.type.startsWith('image/'));
      if (firstImage) {
        firstImage.is_thumbnail = true;
      }
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
                onPress={showMediaOptions}
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