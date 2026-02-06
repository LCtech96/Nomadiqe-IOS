/**
 * Creator Onboarding Screen
 * Onboarding specifico per creator
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import type { OnboardingScreenProps } from '../../types/navigation';

export default function CreatorOnboardingScreen({ navigation }: OnboardingScreenProps<'CreatorOnboarding'>) {
  const { user, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await AuthService.updateProfile(user.id, {
        onboarding_completed: true,
      });
      await refreshProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.emoji]}>📸</Text>
          <Text style={[styles.title, { color: textColor }]}>
            Welcome, Creator!
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
            Create amazing content and collaborate with hosts worldwide
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="📱"
            title="Connect Social Media"
            description="Link your Instagram, TikTok, and YouTube"
          />
          <FeatureItem
            icon="🏡"
            title="Find Collaborations"
            description="Discover unique properties for content creation"
          />
          <FeatureItem
            icon="💰"
            title="Earn & Grow"
            description="Get paid for your content and grow your audience"
          />
        </View>

        <Button
          onPress={handleComplete}
          loading={loading}
          disabled={loading}
          size="lg"
          style={styles.button}
        >
          Start Creating
        </Button>
      </View>
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.screenPadding,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing['4xl'],
  },
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
    gap: theme.spacing['2xl'],
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
