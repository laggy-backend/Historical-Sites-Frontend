/**
 * Video Preview Component
 * Conservative implementation using expo-video with robust error handling
 * Prevents connection conflicts and "Operation Stopped" errors
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Linking, Alert } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { createStyles, createTypographyStyle, useTheme } from '../../styles';

interface VideoPreviewProps {
  uri: string;
  width: number;
  height: number;
  showControls?: boolean;
  autoPlay?: boolean;
  thumbnailOnly?: boolean;
  style?: any;
}

// Global video manager to prevent conflicts
class VideoManager {
  private static activePlayer: any = null;
  private static loadingPlayers = new Set<string>();

  static canLoad(uri: string): boolean {
    // Only allow one video to load at a time
    return !this.activePlayer && !this.loadingPlayers.has(uri);
  }

  static setLoading(uri: string) {
    this.loadingPlayers.add(uri);
  }

  static setActive(player: any, uri: string) {
    this.clearLoading(uri);
    if (this.activePlayer && this.activePlayer !== player) {
      try {
        this.activePlayer.pause();
      } catch (e) {
        // Ignore errors when pausing previous player
      }
    }
    this.activePlayer = player;
  }

  static clearLoading(uri: string) {
    this.loadingPlayers.delete(uri);
  }

  static clearActive(player: any) {
    if (this.activePlayer === player) {
      this.activePlayer = null;
    }
  }
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  uri,
  width,
  height,
  showControls = false,
  autoPlay = false,
  thumbnailOnly = false,
  style
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);

  // Create video player instance only when explicitly requested
  const player = useVideoPlayer(
    shouldLoad && !thumbnailOnly ? {
      uri,
      // Add headers for better compatibility
      headers: {
        'Accept': 'video/*',
        'User-Agent': 'ExpoVideoPlayer/1.0'
      }
    } : null,
    player => {
      if (player && shouldLoad && !thumbnailOnly) {
        playerRef.current = player;
        player.loop = false;
        player.muted = !showControls;
        // Never auto-play to prevent conflicts
      }
    }
  );

  // Handle player events with better error management
  useEffect(() => {
    if (!player || !shouldLoad || thumbnailOnly) return;

    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'loading') {
        setIsLoading(true);
        setHasError(false);
        setPlayerReady(false);
        VideoManager.setLoading(uri);
      } else if (status.status === 'readyToPlay') {
        setIsLoading(false);
        setHasError(false);
        setPlayerReady(true);
        VideoManager.setActive(player, uri);
      } else if (status.status === 'error') {
        console.warn('Video load failed:', uri, status.error?.message);
        setIsLoading(false);
        setHasError(true);
        setPlayerReady(false);
        VideoManager.clearLoading(uri);
        VideoManager.clearActive(player);
        // Don't auto-retry to prevent loops
      }
    });

    return () => {
      subscription?.remove();
      VideoManager.clearLoading(uri);
      VideoManager.clearActive(player);
    };
  }, [player, shouldLoad, thumbnailOnly, uri]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        VideoManager.clearActive(playerRef.current);
      }
    };
  }, []);

  const styles = createStyles((theme) => ({
    container: {
      width,
      height,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    video: {
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
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 24,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.sm,
    },
    errorText: {
      ...createTypographyStyle(theme, 'caption'),
      color: 'white',
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }))(theme);

  const handlePlayPause = () => {
    if (!player || !playerReady) return;

    try {
      if (player.playing) {
        player.pause();
      } else {
        // Pause any other active video first
        VideoManager.setActive(player, uri);
        player.play();
      }
    } catch (error) {
      console.warn('Video play/pause error:', error);
    }
  };

  const isHttpUrl = uri.startsWith('http://');
  const isVideoSupported = uri.toLowerCase().match(/\.(mp4|mov|m4v)$/);

  const handleLoadRequest = () => {
    if (!VideoManager.canLoad(uri)) {
      console.log('Video loading blocked - another video is active');
      return;
    }

    // Warn about HTTP content
    if (isHttpUrl) {
      console.warn('Loading HTTP video - may fail due to security restrictions:', uri);
    }

    // Check format support
    if (!isVideoSupported) {
      console.warn('Video format may not be supported:', uri);
    }

    setHasError(false);
    setIsLoading(true);
    setShouldLoad(true);
  };

  // For thumbnail-only mode, show a simple video icon
  if (thumbnailOnly) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.videoPreview}>
          <Ionicons name="videocam" size={32} color="white" />
          <Text style={styles.videoText} numberOfLines={2}>
            Video
          </Text>
        </View>
      </View>
    );
  }

  // For error state, show retry option or external link
  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={32} color="white" />
          <Text style={styles.errorText}>
            Video playback not available{'\n'}
            {isHttpUrl ? 'HTTP content blocked by security policy' : 'Unsupported format or network error'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setHasError(false);
                setShouldLoad(false);
                setTimeout(handleLoadRequest, 500);
              }}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Open Video Externally',
                  'Would you like to open this video in your browser?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open',
                      onPress: () => Linking.openURL(uri).catch(() =>
                        Alert.alert('Error', 'Could not open video URL')
                      )
                    }
                  ]
                );
              }}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}
            >
              <Ionicons name="open-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // For initial state, show load button
  if (!shouldLoad) {
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity
          style={styles.videoPreview}
          onPress={handleLoadRequest}
        >
          <Ionicons
            name={isHttpUrl ? "warning-outline" : "play-circle"}
            size={48}
            color={isHttpUrl ? "orange" : "white"}
          />
          <Text style={[styles.videoText, isHttpUrl && { color: 'orange' }]}>
            {isHttpUrl
              ? 'HTTP video - may not work\nTap to try loading'
              : 'Tap to load video'
            }
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render actual video player
  return (
    <View style={[styles.container, style]}>
      <VideoView
        style={styles.video}
        player={player}
        fullscreenOptions={{ enabled: false }}
        allowsPictureInPicture={false}
        nativeControls={showControls}
        contentFit="cover"
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.videoText}>Loading video...</Text>
        </View>
      )}

      {!showControls && !isLoading && playerReady && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={handlePlayPause}
          activeOpacity={0.7}
        >
          <View style={styles.playButton}>
            <Ionicons
              name={player?.playing ? "pause" : "play"}
              size={24}
              color={theme.colors.textPrimary}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};