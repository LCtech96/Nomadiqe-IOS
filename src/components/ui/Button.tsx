/**
 * Button Component - iOS Style
 * Pulsante con varianti, dimensioni e animazioni native
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { cva, type VariantProps } from 'class-variance-authority';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

const buttonVariants = cva('', {
  variants: {
    variant: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      destructive: 'bg-destructive',
      outline: 'border-2',
      ghost: 'bg-transparent',
      link: 'bg-transparent',
    },
    size: {
      sm: 'h-9 px-3',
      md: 'h-11 px-4',
      lg: 'h-14 px-6',
      icon: 'h-11 w-11',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps extends TouchableOpacityProps, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = true,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme();

  const handlePress = (e: any) => {
    if (isDisabled) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onPress?.(e);
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.button,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size
    switch (size) {
      case 'sm':
        baseStyle.height = 36;
        baseStyle.paddingHorizontal = theme.spacing.md;
        break;
      case 'lg':
        baseStyle.height = 56;
        baseStyle.paddingHorizontal = theme.spacing['2xl'];
        break;
      case 'icon':
        baseStyle.height = 44;
        baseStyle.width = 44;
        baseStyle.paddingHorizontal = 0;
        break;
      default: // md
        baseStyle.height = 44;
        baseStyle.paddingHorizontal = theme.spacing.lg;
    }

    // Variant
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = theme.colors.primary.blue;
        break;
      case 'secondary':
        baseStyle.backgroundColor = isDark
          ? theme.colors.dark.secondaryBackground
          : theme.colors.light.secondaryBackground;
        break;
      case 'destructive':
        baseStyle.backgroundColor = theme.colors.error;
        break;
      case 'outline':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = isDark
          ? theme.colors.dark.separator
          : theme.colors.light.separator;
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'ghost':
      case 'link':
        baseStyle.backgroundColor = 'transparent';
        break;
    }

    if (isDisabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.headline,
      fontWeight: '600',
    };

    switch (size) {
      case 'sm':
        baseStyle.fontSize = 14;
        break;
      case 'lg':
        baseStyle.fontSize = 18;
        break;
    }

    switch (variant) {
      case 'primary':
      case 'destructive':
        baseStyle.color = '#FFFFFF';
        break;
      case 'secondary':
      case 'outline':
      case 'ghost':
        baseStyle.color = isDark
          ? theme.colors.dark.label
          : theme.colors.light.label;
        break;
      case 'link':
        baseStyle.color = theme.colors.primary.blue;
        break;
    }

    return baseStyle;
  };

  const isDisabled = Boolean(disabled || loading);

  return (
    <TouchableOpacity
      {...props}
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : theme.colors.primary.blue}
        />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
