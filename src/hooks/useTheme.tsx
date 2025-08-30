import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  colorScheme: NonNullable<ColorSchemeName>;
  setTheme: (theme: Theme) => void;
  isDarkColorScheme: boolean;
}

const THEME_STORAGE_KEY = 'app-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [colorScheme, setColorScheme] = useState<NonNullable<ColorSchemeName>>(
    Appearance.getColorScheme() ?? 'light'
  );

  const isDarkColorScheme = colorScheme === 'dark';

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme: string | null) => {
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
      }
    });

    // Subscribe to system theme changes
    const subscription = Appearance.addChangeListener((appearance) => {
      setColorScheme(appearance.colorScheme ?? 'light');
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Update color scheme based on theme preference
    if (theme === 'system') {
      setColorScheme(Appearance.getColorScheme() ?? 'light');
    } else {
      setColorScheme(theme as NonNullable<ColorSchemeName>);
    }
  }, [theme]);

  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        setTheme: handleSetTheme,
        isDarkColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
