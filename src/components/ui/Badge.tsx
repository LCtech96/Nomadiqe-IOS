/**
 * Badge Component - iOS Style
 * Badge per stati, ruoli, contatori
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const { isDark } = useTheme();

  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignSelf: 'flex-start',
    };

    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = theme.colors.primary.blue;
        break;
      case 'success':
        baseStyle.backgroundColor = theme.colors.success;
        break;
      case 'warning':
        baseStyle.backgroundColor = theme.colors.warning;
        break;
      case 'error':
        baseStyle.backgroundColor = theme.colors.error;
        break;
      case 'outline':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = isDark
          ? theme.colors.dark.separator
          : theme.colors.light.separator;
        baseStyle.backgroundColor = 'transparent';
        break;
      default: // default
        baseStyle.backgroundColor = isDark
          ? theme.colors.dark.fill
          : theme.colors.light.fill;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.caption1,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'error':
        baseStyle.color = '#FFFFFF';
        break;
      case 'outline':
      case 'default':
        baseStyle.color = isDark
          ? theme.colors.dark.label
          : theme.colors.light.label;
        break;
    }

    return baseStyle;
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={getTextStyle()}>{children}</Text>
    </View>
  );
}
