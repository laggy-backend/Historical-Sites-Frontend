/**
 * Media Picker Component for Edit Mode
 * Simplified version for editing sites - does NOT allow thumbnail selection
 * Only allows adding new media files without thumbnail designation
 * Thumbnails can only be managed through existing media controls
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
import { VideoPreview } from './VideoPreview';
import { compressMedia, getFileSize, getCompressionSummary, CompressionResult } from '../../utils/mediaCompression';
export interface MediaItemEdit {
  uri: string;
  name: string;
  type: string;
  size?: number;
  width?: number;
  height?: number;
  title?: string;
  caption?: string;
  // NO is_thumbnail property in edit mode
  file?: any;
}

interface MediaPickerEditProps {
  mediaItems: MediaItemEdit[];
  onMediaChange: (items: MediaItemEdit[]) => void;
  maxItems?: number;
  disabled?: boolean;
}

export const MediaPickerEdit: React.FC<MediaPickerEditProps> = ({
  mediaItems,
  onMediaChange,
  maxItems = 10,
  disabled = false
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');

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
    const validItems: MediaItemEdit[] = [];
    const invalidItems: string[] = [];
    const compressionResults: CompressionResult[] = [];

    for (const [index, asset] of assets.entries()) {
      setCompressionProgress(`Processing ${index + 1}/${assets.length}...`);
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

      // Get actual or estimated file size
      let estimatedSize = 0;
      if (asset.fileSize) {
        estimatedSize = asset.fileSize;
      } else {
        // Try to get actual file size first
        const actualSize = await getFileSize(asset.uri);
        if (actualSize > 0) {
          estimatedSize = actualSize;
        } else if (asset.width && asset.height) {
          // Fallback to rough size estimation
          estimatedSize = isImage
            ? (asset.width * asset.height * 3) // RGB
            : (asset.width * asset.height * 1.5 * (asset.duration || 10)); // Video estimation
        }
      }

      // Compress media before validation (only for images)
      let compressionResult;
      if (isImage) {
        setCompressionProgress(`Compressing ${fileName}...`);
        compressionResult = await compressMedia(
          asset.uri,
          asset.mimeType || 'image/jpeg',
          estimatedSize,
          {
            imageQuality: 0.8,
            imageMaxWidth: 1920,
            imageMaxHeight: 1080,
            minimumFileSizeForCompress: 512 * 1024, // 512KB threshold
          }
        );
      } else {
        // Videos are not compressed, return as-is
        compressionResult = {
          uri: asset.uri,
          originalSize: estimatedSize,
          compressedSize: estimatedSize,
          compressionRatio: 1,
          success: true,
        };
      }

      compressionResults.push(compressionResult);

      // Use compressed URI and size for further processing
      const finalUri = compressionResult.success ? compressionResult.uri : asset.uri;
      const finalSize = compressionResult.success ? compressionResult.compressedSize : estimatedSize;

      if (finalSize > maxSize) {
        const maxMB = isImage ? '10MB' : '100MB';
        const compressionInfo = compressionResult.success
          ? ` after compression (${getCompressionSummary(compressionResult)})`
          : '';
        invalidItems.push(`${fileName} (size exceeds ${maxMB} limit${compressionInfo})`);
        continue;
      }

      // Create file object for upload - Better MIME type detection
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
        uri: finalUri,
        name: fileName,
        type: fileType
      };

      validItems.push({
        uri: finalUri,
        name: fileName,
        type: fileType,
        size: finalSize,
        width: asset.width,
        height: asset.height,
        file: fileObject
        // NO is_thumbnail property - this is the key difference from creation mode
      });
    }

    setCompressionProgress('');

    // Show compression summary (only for actually compressed images)
    const successfulImageCompressions = compressionResults.filter(r => r.success && r.compressionRatio < 1);
    if (successfulImageCompressions.length > 0) {
      const totalOriginalSize = successfulImageCompressions.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressedSize = successfulImageCompressions.reduce((sum, r) => sum + r.compressedSize, 0);
      const overallSavings = totalOriginalSize > 0 ? (1 - totalCompressedSize / totalOriginalSize) * 100 : 0;

      if (overallSavings > 5) { // Only show if meaningful savings
        Alert.alert(
          'Compression Complete',
          `${successfulImageCompressions.length} image(s) compressed with ${overallSavings.toFixed(1)}% total size reduction.`
        );
      }
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
    newItems.splice(index, 1);
    onMediaChange(newItems);
  };

  const canAddMore = mediaItems.length < maxItems && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Media Files</Text>
        <Text style={styles.description}>
          Add additional photos and videos to this site.
        </Text>
      </View>


      <View style={styles.mediaGrid}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.mediaRow}>
            {mediaItems.map((item, index) => {
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
                    <VideoPreview
                      uri={item.uri}
                      width={100}
                      height={100}
                      showControls={false}
                      autoPlay={false}
                      thumbnailOnly={true}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
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
                  <>
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    {compressionProgress ? (
                      <Text style={[styles.addButtonText, { fontSize: 12 }]}>
                        {compressionProgress}
                      </Text>
                    ) : (
                      <Text style={styles.addButtonText}>Processing...</Text>
                    )}
                  </>
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
            • Use the × button to remove media files before uploading
          </Text>
          <Text style={styles.infoText}>
            • {mediaItems.length}/{maxItems} new files selected
          </Text>
          <Text style={styles.infoText}>
            • Supports images (max 10MB) and videos (max 100MB)
          </Text>
          <Text style={styles.infoText}>
            • These files will be uploaded as additional media
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