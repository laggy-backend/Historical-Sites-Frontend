import React from 'react';
import { View, ViewProps } from 'react-native';
import { components } from '../../styles';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[components.card, style]} {...props}>
      {children}
    </View>
  );
};