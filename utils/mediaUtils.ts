/**
 * Media utilities for detecting file types and handling media files
 */

import { MediaFile } from '../types/historicalSites';

/**
 * Check if a media file is a video based on file_type or file extension
 */
export function isVideoFile(media: MediaFile): boolean {
  // Check file_type if provided by API
  if (media.file_type) {
    return media.file_type.startsWith('video/');
  }

  // Fallback: check file extension
  const fileUrl = media.file;
  const extension = fileUrl.split('.').pop()?.toLowerCase();

  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp'];

  return videoExtensions.includes(extension || '');
}

/**
 * Check if a media file is an image based on file_type or file extension
 */
export function isImageFile(media: MediaFile): boolean {
  // Check file_type if provided by API
  if (media.file_type) {
    return media.file_type.startsWith('image/');
  }

  // Fallback: check file extension
  const fileUrl = media.file;
  const extension = fileUrl.split('.').pop()?.toLowerCase();

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

  return imageExtensions.includes(extension || '');
}

/**
 * Get the media type (video, image, or unknown)
 */
export function getMediaType(media: MediaFile): 'video' | 'image' | 'unknown' {
  if (isVideoFile(media)) return 'video';
  if (isImageFile(media)) return 'image';
  return 'unknown';
}