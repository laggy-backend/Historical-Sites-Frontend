/**
 * Search Bar Component
 * Text input for searching historical sites with debouncing
 * Follows existing styling patterns from the codebase
 */

import React, { useState, useEffect } from 'react';
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
  onSearch: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onSearch,
  placeholder = 'Search historical sites...',
  disabled = false
}) => {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onSearch(localValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, onSearch, value]);

  const handleClear = () => {
    setLocalValue('');
    onSearch('');
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
      paddingRight: localValue ? theme.spacing.xl + theme.spacing.lg : theme.spacing.lg,
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
          value={localValue}
          onChangeText={setLocalValue}
          editable={!disabled}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {localValue.length > 0 && (
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