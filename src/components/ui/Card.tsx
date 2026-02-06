/**
 * Card Component - iOS Style
 * Card container con shadow e padding
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: boolean;
  elevated?: boolean;
}

export function Card({
  children,
  padding = true,
  elevated = true,
  style,
  ...props
}: CardProps) {
  const { isDark } = useTheme();

  // Coerce to boolean so we never pass string to native View
  const hasPadding = Boolean(padding);
  const hasElevated = Boolean(elevated);

  const cardStyle: ViewStyle = {
    backgroundColor: isDark
      ? theme.colors.dark.card
      : theme.colors.light.card,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: isDark
      ? theme.colors.dark.cardBorder
      : theme.colors.light.cardBorder,
  };

  if (hasPadding) {
    cardStyle.padding = theme.spacing.cardPadding;
  }

  if (hasElevated && !isDark) {
    Object.assign(cardStyle, theme.shadows.card);
  }

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}
