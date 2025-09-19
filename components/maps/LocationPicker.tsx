/**
 * Location Picker Component
 * Interactive map for selecting GPS coordinates with current location support
 * Used in site creation and editing forms
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  createButtonStyle,
  createStyles,
  createTypographyStyle,
  rowCenter,
  useTheme
} from '../../styles';
import { Coordinate } from '../../types/historicalSites';
import { logger } from '../../utils/logger';

interface LocationPickerProps {
  coordinate?: Coordinate;
  onLocationSelect: (coordinate: Coordinate) => void;
  editable?: boolean;
  height?: number;
}

const DEFAULT_REGION: Region = {
  latitude: 30.0444, // Cairo, Egypt as default
  longitude: 31.2357,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  coordinate,
  onLocationSelect,
  editable = true,
  height = 300
}) => {
  const { theme } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(coordinate || null);
  const [region, setRegion] = useState<Region>(
    coordinate
      ? { ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : DEFAULT_REGION
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const styles = createStyles((theme) => ({
    container: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.backgroundSecondary,
    },
    mapContainer: {
      height,
      position: 'relative',
    },
    map: {
      width: '100%',
      height: '100%',
    },
    controls: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    controlButton: {
      ...createButtonStyle(theme, 'secondary', 'sm', false),
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    coordinatesDisplay: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    coordinateRow: {
      ...rowCenter,
      justifyContent: 'space-between',
    },
    coordinateLabel: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    coordinateValue: {
      ...createTypographyStyle(theme, 'body'),
      fontFamily: 'monospace',
    },
    instructions: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }))(theme);

  useEffect(() => {
    if (coordinate) {
      setSelectedLocation(coordinate);
      setRegion({
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  }, [coordinate]);

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location permission is needed to use your current location.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    if (!editable) return;

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      setIsLoadingLocation(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
      });

      const newCoordinate: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(newCoordinate);
      setRegion({
        ...newCoordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });

      onLocationSelect(newCoordinate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to get current location';
      logger.error('general', 'Failed to get current location', {
        error: errorMessage
      });
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = (event: any) => {
    if (!editable) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newCoordinate: Coordinate = { latitude, longitude };

    setSelectedLocation(newCoordinate);
    onLocationSelect(newCoordinate);
  };

  const handleMarkerDragEnd = (event: any) => {
    if (!editable) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newCoordinate: Coordinate = { latitude, longitude };

    setSelectedLocation(newCoordinate);
    onLocationSelect(newCoordinate);
  };

  const formatCoordinate = (value: number, precision: number = 6): string => {
    return value.toFixed(precision);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          scrollEnabled={editable}
          zoomEnabled={editable}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable={editable}
              onDragEnd={handleMarkerDragEnd}
              title="Selected Location"
              description="Drag to adjust position"
            />
          )}
        </MapView>

        {/* Controls */}
        {editable && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <Ionicons
                name={isLoadingLocation ? "hourglass-outline" : "locate-outline"}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Disabled Overlay */}
        {!editable && (
          <View style={styles.disabledOverlay}>
            <Ionicons
              name="eye-outline"
              size={32}
              color={theme.colors.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Coordinates Display */}
      <View style={styles.coordinatesDisplay}>
        {selectedLocation ? (
          <>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Latitude:</Text>
              <Text style={styles.coordinateValue}>
                {formatCoordinate(selectedLocation.latitude)}
              </Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Longitude:</Text>
              <Text style={styles.coordinateValue}>
                {formatCoordinate(selectedLocation.longitude)}
              </Text>
            </View>
            {editable && (
              <Text style={styles.instructions}>
                Tap the map or drag the marker to adjust the location
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.instructions}>
            {editable
              ? 'Tap the map to select a location or use current location'
              : 'No location selected'
            }
          </Text>
        )}
      </View>
    </View>
  );
};