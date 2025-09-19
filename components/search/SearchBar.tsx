/**
 * Search Bar Component
 * Modern React Native search input following 2025 best practices
 * - Simple controlled component (no internal debouncing)
 * - Debouncing handled by parent context with useDeferredValue
 * - Clean, focused responsibility
 */

import React from 'react';
import { TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createInputStyle,
  createInputTextStyle,
  createStyles,
  getPlaceholderColor,
  rowCenter,
  useTheme
} from '../../styles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search historical sites...',
  disabled = false,
  onSubmit
}) => {
  const { theme } = useTheme();

  const handleClear = () => {
    onChangeText('');
  };

  const handleSubmitEditing = () => {
    onSubmit?.();
  };

  const styles = createStyles((theme) => ({
    container: {
      position: 'relative',
    },
    inputContainer: {
      ...rowCenter,
      position: 'relative',
    },
    input: {
      ...createInputStyle(theme, 'default', 'md', false, false, disabled),
      ...createInputTextStyle(theme, 'md', disabled),
      paddingRight: value ? theme.spacing.xl + theme.spacing.lg : theme.spacing.lg,
      flex: 1,
    },
    searchIcon: {
      position: 'absolute',
      left: theme.spacing.md,
      zIndex: 1,
    },
    clearButton: {
      position: 'absolute',
      right: theme.spacing.md,
      padding: theme.spacing.xs,
      zIndex: 1,
    },
    inputWithIcon: {
      paddingLeft: theme.spacing.xl + theme.spacing.sm,
    }
  }))(theme);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder={placeholder}
          placeholderTextColor={getPlaceholderColor(theme)}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmitEditing}
          editable={!disabled}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />

        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={disabled}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};