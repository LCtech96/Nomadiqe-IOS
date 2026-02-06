/**
 * Sign In Screen
 * Schermata di login con email/password e Google OAuth
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { emailSchema, passwordSchema } from '../../utils/validators';
import type { AuthScreenProps } from '../../types/navigation';

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen({ navigation }: AuthScreenProps<'SignIn'>) {
  const { signIn } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setLoading(true);
      await signIn(data.email, data.password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              {t('auth.signIn')}
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
              Welcome back to Nomadiqe
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.password')}
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              )}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary.blue }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              size="lg"
              style={styles.signInButton}
            >
              {t('auth.signIn')}
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? theme.colors.dark.separator
                    : theme.colors.light.separator,
                },
              ]}
            />
            <Text
              style={[
                styles.dividerText,
                {
                  color: isDark
                    ? theme.colors.dark.tertiaryLabel
                    : theme.colors.light.tertiaryLabel,
                },
              ]}
            >
              {t('auth.orContinueWith')}
            </Text>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? theme.colors.dark.separator
                    : theme.colors.light.separator,
                },
              ]}
            />
          </View>

          {/* Social Login */}
          <Button variant="outline" size="lg" style={styles.googleButton}>
            <Ionicons name="logo-google" size={20} style={{ marginRight: 8 }} />
            <Text>Continue with Google</Text>
          </Button>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text
              style={[
                styles.signUpText,
                {
                  color: isDark
                    ? theme.colors.dark.secondaryLabel
                    : theme.colors.light.secondaryLabel,
                },
              ]}
            >
              {t('auth.dontHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.signUpLink, { color: theme.colors.primary.blue }]}>
                {t('auth.signUp')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingTop: theme.spacing['3xl'],
  },
  header: {
    marginBottom: theme.spacing['4xl'],
  },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
  },
  form: {
    marginBottom: theme.spacing['2xl'],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    ...theme.typography.subheadline,
    fontWeight: '600',
  },
  signInButton: {
    marginTop: theme.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...theme.typography.subheadline,
    marginHorizontal: theme.spacing.md,
  },
  googleButton: {
    marginBottom: theme.spacing['2xl'],
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    ...theme.typography.body,
  },
  signUpLink: {
    ...theme.typography.body,
    fontWeight: '600',
  },
});
