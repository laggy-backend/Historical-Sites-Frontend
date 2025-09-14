import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { components, colors } from '../../styles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputStyle = () => {
    const inputStyles = [components.input];

    if (isFocused) {
      inputStyles.push(components.inputFocused);
    }

    if (error) {
      inputStyles.push(components.inputError);
    }

    if (style) {
      inputStyles.push(style);
    }

    return inputStyles;
  };

  return (
    <View style={[components.formGroup, containerStyle]}>
      {label && <Text style={components.label}>{label}</Text>}
      <TextInput
        style={getInputStyle()}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <Text style={components.errorText}>{error}</Text>}
    </View>
  );
};