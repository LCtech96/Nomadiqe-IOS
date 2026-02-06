/**
 * Separator Component - iOS Style
 * Linea separatrice
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface SeparatorProps {
  style?: ViewStyle;
}

export function Separator({ style }: SeparatorProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        {
          height: theme.spacing.hairline,
          backgroundColor: isDark
            ? theme.colors.dark.separator
            : theme.colors.light.separator,
        },
        style,
      ]}
    />
  );
}
