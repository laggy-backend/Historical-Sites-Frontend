import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { components, colors } from '../../styles';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'large'
}) => {
  return (
    <View style={components.loadingContainer}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[components.bodyTextSecondary, { marginTop: 16, textAlign: 'center' }]}>
          {message}
        </Text>
      )}
    </View>
  );
};