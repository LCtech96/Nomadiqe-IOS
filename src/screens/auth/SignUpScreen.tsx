/**
 * Sign Up Screen
 * Registrazione nuovo utente
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
import { emailSchema, passwordSchema, usernameSchema } from '../../utils/validators';
import type { AuthScreenProps } from '../../types/navigation';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen({ navigation }: AuthScreenProps<'SignUp'>) {
  const { signUp } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setLoading(true);
      await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        username: data.username,
      });
      navigation.navigate('VerifyEmail', { email: data.email });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign up');
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={textColor} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              {t('auth.signUp')}
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
              Create your Nomadiqe account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.fullName')}
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.username')}
                  placeholder="johndoe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              )}
            />

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

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.confirmPassword')}
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              size="lg"
              style={styles.signUpButton}
            >
              {t('auth.signUp')}
            </Button>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text
              style={[
                styles.signInText,
                {
                  color: isDark
                    ? theme.colors.dark.secondaryLabel
                    : theme.colors.light.secondaryLabel,
                },
              ]}
            >
              {t('auth.alreadyHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={[styles.signInLink, { color: theme.colors.primary.blue }]}>
                {t('auth.signIn')}
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
    paddingTop: theme.spacing.lg,
  },
  backButton: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing['3xl'],
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
    marginBottom: theme.spacing.xl,
  },
  signUpButton: {
    marginTop: theme.spacing.md,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    ...theme.typography.body,
  },
  signInLink: {
    ...theme.typography.body,
    fontWeight: '600',
  },
});
