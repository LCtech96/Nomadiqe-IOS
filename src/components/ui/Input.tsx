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
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  /** Se true, mostra l'icona occhio per mostrare/nascondere la password (solo con secureTextEntry) */
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  style,
  secureTextEntry,
  showPasswordToggle,
  editable,
  multiline,
  autoFocus,
  ...props
}: InputProps) {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Coerce boolean props to actual booleans (in case they come as strings)
  const isSecure = Boolean(secureTextEntry);
  const showToggle = Boolean(showPasswordToggle) && isSecure;
  const actuallySecure = isSecure && !(showToggle && passwordVisible);
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

  const iconColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary.blue
    : 'transparent';

  const inputWrapperStyle = showToggle ? styles.inputRow : undefined;

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
      <View style={inputWrapperStyle}>
        <TextInput
          {...props}
          style={[
            styles.input,
            showToggle && styles.inputWithRightIcon,
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
          secureTextEntry={actuallySecure}
          editable={isEditable}
          multiline={isMultiline}
          autoFocus={shouldAutoFocus}
        />
        {showToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={passwordVisible ? 'Nascondi password' : 'Mostra password'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    ...theme.typography.body,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
  },
  inputWithRightIcon: {
    paddingRight: 44,
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    ...theme.typography.caption1,
    marginTop: theme.spacing.xs,
  },
});
