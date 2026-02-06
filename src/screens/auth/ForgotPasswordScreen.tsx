/**
 * Forgot Password Screen
 * Reset password via email
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Input } from '../../components/ui';
import { AuthService } from '../../services/auth.service';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { emailSchema } from '../../utils/validators';
import type { AuthScreenProps } from '../../types/navigation';

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await AuthService.resetPassword(data.email);
      Alert.alert(
        'Success',
        'Password reset link has been sent to your email',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color={textColor} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="mail-outline"
            size={64}
            color={theme.colors.primary.blue}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: textColor }]}>
            {t('auth.resetPassword')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark
                  ? theme.colors.dark.secondaryLabel
                  : theme.colors.light.secondaryLabel,
              },
            ]}
          >
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder="your@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            size="lg"
            style={styles.submitButton}
          >
            Send Reset Link
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.screenPadding,
  },
  backButton: {
    marginBottom: theme.spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  icon: {
    marginBottom: theme.spacing['2xl'],
  },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
});
