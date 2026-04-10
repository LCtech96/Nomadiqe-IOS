/**
 * Jolly Onboarding Screen
 * Onboarding specifico per jolly: descrizione servizi visibile agli host in KOL&BED
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import type { OnboardingScreenProps } from '../../types/navigation';

const BIO_MAX = 30;

export default function JollyOnboardingScreen({ navigation }: OnboardingScreenProps<'JollyOnboarding'>) {
  const { user, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [servicesDescription, setServicesDescription] = useState('');

  const handleComplete = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await AuthService.updateProfile(user.id, {
        bio: servicesDescription.trim().slice(0, BIO_MAX) || null,
        onboarding_completed: true,
      });
      await refreshProfile();
    } catch (error: unknown) {
      Alert.alert(t('common.error'), (error as Error)?.message || t('onboarding.saveError'));
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

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>💼</Text>
            <Text style={[styles.title, { color: textColor }]}>{t('onboarding.jollyWelcome')}</Text>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>
              {t('onboarding.jollySubcategorySubtitle')}
            </Text>
            <Text style={[styles.visibleToHosts, { color: secondaryColor }]}>
              {t('onboarding.jollyVisibleToHosts')}
            </Text>
          </View>

          <View style={styles.features}>
            <FeatureItem
              icon="🛠️"
              title="List Your Services"
              description="Cleaning, maintenance, photography, and more"
            />
            <FeatureItem
              icon="📅"
              title="Manage Requests"
              description="Receive and handle service requests"
            />
            <FeatureItem
              icon="⭐"
              title="Build Reputation"
              description="Get reviews and grow your business"
            />
          </View>

          <Input
            label={t('onboarding.jollyServicesDescription')}
            placeholder={t('onboarding.jollyServicesPlaceholder')}
            value={servicesDescription}
            onChangeText={(v) => setServicesDescription(v.slice(0, BIO_MAX))}
            containerStyle={styles.inputRow}
            helperText={`${servicesDescription.length}/${BIO_MAX}`}
          />

          <Button
            onPress={handleComplete}
            loading={loading}
            disabled={loading}
            size="lg"
            style={styles.button}
          >
            {t('onboarding.jollyComplete')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: secondaryColor }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  visibleToHosts: {
    ...theme.typography.footnote,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  inputRow: { marginBottom: theme.spacing.lg },
  emoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
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
  features: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  featureIcon: {
    fontSize: 48,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.headline,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    ...theme.typography.subheadline,
  },
  button: {
    marginBottom: theme.spacing.md,
  },
});
