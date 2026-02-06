/**
 * Verify Email Screen
 * Email verification message
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import type { AuthScreenProps } from '../../types/navigation';

export default function VerifyEmailScreen({ navigation, route }: AuthScreenProps<'VerifyEmail'>) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { email } = route.params;

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="mail"
            size={80}
            color={theme.colors.primary.blue}
          />
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: textColor }]}>
          {t('auth.verifyEmail')}
        </Text>
        <Text
          style={[
            styles.message,
            {
              color: isDark
                ? theme.colors.dark.secondaryLabel
                : theme.colors.light.secondaryLabel,
            },
          ]}
        >
          {t('auth.verifyEmailMessage')}
        </Text>
        <Text
          style={[
            styles.email,
            { color: theme.colors.primary.blue },
          ]}
        >
          {email}
        </Text>

        <Text
          style={[
            styles.instructions,
            {
              color: isDark
                ? theme.colors.dark.tertiaryLabel
                : theme.colors.light.tertiaryLabel,
            },
          ]}
        >
          Please check your inbox and click the verification link to continue
        </Text>

        {/* Actions */}
        <Button
          onPress={() => navigation.navigate('SignIn')}
          size="lg"
          style={styles.button}
        >
          Back to Sign In
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.screenPadding,
  },
  iconContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...theme.typography.body,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  email: {
    ...theme.typography.headline,
    fontWeight: '600',
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
  },
  instructions: {
    ...theme.typography.subheadline,
    textAlign: 'center',
    marginBottom: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.lg,
  },
  button: {
    width: '100%',
  },
});
