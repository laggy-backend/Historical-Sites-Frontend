/**
 * Media Compression Utilities
 * Handles image and video compression before upload
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from './logger';

export interface CompressionResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

export interface CompressionOptions {
  // Image compression options
  imageQuality?: number; // 0-1, default 0.8
  imageMaxWidth?: number; // default 1920
  imageMaxHeight?: number; // default 1080

  // General options
  minimumFileSizeForCompress?: number; // bytes, default 1MB
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  imageQuality: 0.8,
  imageMaxWidth: 1920,
  imageMaxHeight: 1080,
  minimumFileSizeForCompress: 1024 * 1024, // 1MB
};

/**
 * Compresses an image using expo-image-manipulator
 */
export async function compressImage(
  uri: string,
  originalSize: number,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip compression for small files
    if (originalSize < opts.minimumFileSizeForCompress) {
      return {
        uri,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        success: true,
      };
    }

    // Get image dimensions to determine if resizing is needed
    const manipulateActions: ImageManipulator.Action[] = [];

    // Add resize action if needed
    manipulateActions.push({
      resize: {
        width: opts.imageMaxWidth,
        height: opts.imageMaxHeight,
      },
    });

    const result = await ImageManipulator.manipulateAsync(
      uri,
      manipulateActions,
      {
        compress: opts.imageQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Get compressed file size (estimate)
    const compressedSize = result.width * result.height * 3 * opts.imageQuality; // RGB estimate
    const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

    return {
      uri: result.uri,
      originalSize,
      compressedSize,
      compressionRatio,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown compression error';
    logger.error('media', 'Image compression failed', {
      error: errorMessage,
      uri,
      originalSize,
      options
    });
    return {
      uri,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Compresses media - only images are supported, videos are returned as-is
 */
export async function compressMedia(
  uri: string,
  mimeType: string,
  originalSize: number,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const isImage = mimeType.startsWith('image/');

  if (isImage) {
    return compressImage(uri, originalSize, options);
  } else {
    // Videos and other types returned without compression
    return {
      uri,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: true,
    };
  }
}

/**
 * Gets file size from URI (for better size estimation)
 */
export async function getFileSize(uri: string): Promise<number> {
  try {
    const response = await fetch(uri, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength) : 0;
  } catch {
    return 0;
  }
}

/**
 * Formats bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets compression savings summary
 */
export function getCompressionSummary(result: CompressionResult): string {
  if (!result.success) {
    return 'Compression failed';
  }

  if (result.compressionRatio >= 1) {
    return 'No compression applied';
  }

  const savings = (1 - result.compressionRatio) * 100;
  const originalFormatted = formatBytes(result.originalSize);
  const compressedFormatted = formatBytes(result.compressedSize);

  return `Reduced from ${originalFormatted} to ${compressedFormatted} (${savings.toFixed(1)}% savings)`;
}