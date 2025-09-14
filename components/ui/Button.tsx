import React from 'react';
import { Pressable, Text, PressableProps, ViewStyle, TextStyle } from 'react-native';
import { components } from '../../styles';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  customStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  customStyle,
  textStyle,
  disabled,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [components.button];

    switch (variant) {
      case 'primary':
        baseStyle.push(components.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(components.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(components.buttonOutline);
        break;
    }

    if (size === 'small') {
      baseStyle.push({ paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 });
    } else if (size === 'large') {
      baseStyle.push({ paddingHorizontal: 32, paddingVertical: 16, minHeight: 56 });
    }

    if (disabled || isLoading) {
      baseStyle.push({ opacity: 0.7 });
    }

    if (customStyle) {
      baseStyle.push(customStyle);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = variant === 'outline' ? components.buttonTextOutline : components.buttonText;
    const textStyles = [baseTextStyle];

    if (size === 'small') {
      textStyles.push({ fontSize: 14 });
    } else if (size === 'large') {
      textStyles.push({ fontSize: 18 });
    }

    if (textStyle) {
      textStyles.push(textStyle);
    }

    return textStyles;
  };

  return (
    <Pressable
      style={getButtonStyle()}
      disabled={disabled || isLoading}
      {...props}
    >
      <Text style={getTextStyle()}>
        {isLoading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
};