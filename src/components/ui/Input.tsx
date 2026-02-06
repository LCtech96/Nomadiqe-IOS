/**
 * Input Component - iOS Style
 * Text input con stile iOS nativo
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  style,
  secureTextEntry,
  editable,
  multiline,
  autoFocus,
  ...props
}: InputProps) {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  // Coerce boolean props to actual booleans (in case they come as strings)
  const isSecure = Boolean(secureTextEntry);
  const isEditable = editable !== false; // default true
  const isMultiline = Boolean(multiline);
  const shouldAutoFocus = Boolean(autoFocus);

  const inputBackgroundColor = isDark
    ? theme.colors.dark.tertiaryBackground
    : theme.colors.light.secondaryBackground;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const placeholderColor = isDark
    ? theme.colors.dark.tertiaryLabel
    : theme.colors.light.tertiaryLabel;

  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary.blue
    : 'transparent';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: isDark
                ? theme.colors.dark.secondaryLabel
                : theme.colors.light.secondaryLabel,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: inputBackgroundColor,
            color: textColor,
            borderColor,
            borderWidth: isFocused || error ? 1 : 0,
          },
          style,
        ]}
        placeholderTextColor={placeholderColor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={isSecure}
        editable={isEditable}
        multiline={isMultiline}
        autoFocus={shouldAutoFocus}
      />
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error
                ? theme.colors.error
                : isDark
                ? theme.colors.dark.tertiaryLabel
                : theme.colors.light.tertiaryLabel,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.subheadline,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  input: {
    ...theme.typography.body,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
  },
  helperText: {
    ...theme.typography.caption1,
    marginTop: theme.spacing.xs,
  },
});
