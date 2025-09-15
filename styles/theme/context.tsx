/**
 * Theme context provider for managing light/dark theme switching
 * Industry standard approach using React Context
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightTheme, darkTheme, Theme, ThemeMode } from './variants';
import { logger } from '../../utils/logger';

const THEME_STORAGE_KEY = 'app_theme_preference';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes (if using system theme)
  useEffect(() => {
    if (isSystemTheme && systemColorScheme) {
      setThemeMode(systemColorScheme as ThemeMode);
    }
  }, [systemColorScheme, isSystemTheme]);

  const loadThemePreference = async () => {
    try {
      const savedPreference = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (savedPreference) {
        const preference = JSON.parse(savedPreference);
        setIsSystemTheme(preference.useSystem ?? true);

        if (preference.useSystem) {
          setThemeMode((systemColorScheme as ThemeMode) || 'light');
        } else {
          setThemeMode(preference.mode || 'light');
        }
      } else {
        // Default to system theme
        setThemeMode((systemColorScheme as ThemeMode) || 'light');
      }
    } catch (error) {
      logger.warn('theme', 'Failed to load theme preference', { error: (error as Error).message });
      setThemeMode('light');
    }
  };

  const saveThemePreference = async (mode: ThemeMode, useSystem: boolean) => {
    try {
      const preference = {
        mode,
        useSystem,
      };
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      logger.warn('theme', 'Failed to save theme preference', { error: (error as Error).message });
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    setIsSystemTheme(false);
    saveThemePreference(newMode, false);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setIsSystemTheme(false);
    saveThemePreference(mode, false);
  };

  const setSystemTheme = (useSystem: boolean) => {
    setIsSystemTheme(useSystem);

    if (useSystem && systemColorScheme) {
      const systemMode = systemColorScheme as ThemeMode;
      setThemeMode(systemMode);
      saveThemePreference(systemMode, true);
    } else {
      saveThemePreference(themeMode, false);
    }
  };

  const currentTheme: Theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    toggleTheme,
    setTheme,
    isSystemTheme,
    setSystemTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};