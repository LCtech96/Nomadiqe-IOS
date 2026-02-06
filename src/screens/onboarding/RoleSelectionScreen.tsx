/**
 * Role Selection Screen
 * Selezione del ruolo utente (Host, Creator, Jolly)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button, Card } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import type { OnboardingScreenProps } from '../../types/navigation';
import type { UserRole } from '../../types';

interface RoleOption {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'host',
    icon: 'home',
    title: 'Host',
    description: 'Manage your properties and accept collaborations with creators',
  },
  {
    role: 'creator',
    icon: 'camera',
    title: 'Creator',
    description: 'Create content and collaborate with hosts for unique stays',
  },
  {
    role: 'jolly',
    icon: 'briefcase',
    title: 'Jolly',
    description: 'Offer professional services to hosts and creators',
  },
];

export default function RoleSelectionScreen({ navigation }: OnboardingScreenProps<'RoleSelection'>) {
  const { user, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole || !user) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update role in profile
      await AuthService.updateProfile(user.id, { role: selectedRole });
      await refreshProfile();

      // Navigate to role-specific onboarding
      switch (selectedRole) {
        case 'host':
          navigation.navigate('HostOnboarding');
          break;
        case 'creator':
          navigation.navigate('CreatorOnboarding');
          break;
        case 'jolly':
          navigation.navigate('JollyOnboarding');
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update role');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('roles.selectRole')}
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
            Choose your role to get started with Nomadiqe
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.rolesContainer}>
          {roleOptions.map((option) => (
            <TouchableOpacity
              key={option.role}
              onPress={() => handleRoleSelect(option.role)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.roleCard,
                  selectedRole === option.role && styles.selectedCard,
                ]}
              >
                <View style={styles.roleHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      selectedRole === option.role && styles.selectedIconContainer,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={32}
                      color={
                        selectedRole === option.role
                          ? '#FFFFFF'
                          : theme.colors.primary.blue
                      }
                    />
                  </View>
                  {selectedRole === option.role && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary.blue}
                    />
                  )}
                </View>
                <Text style={[styles.roleTitle, { color: textColor }]}>
                  {option.title}
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    {
                      color: isDark
                        ? theme.colors.dark.secondaryLabel
                        : theme.colors.light.secondaryLabel,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <Button
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          loading={loading}
          size="lg"
          style={styles.continueButton}
        >
          Continue
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
    padding: theme.spacing.screenPadding,
  },
  header: {
    marginBottom: theme.spacing['3xl'],
    marginTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
  },
  rolesContainer: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  roleCard: {
    padding: theme.spacing['2xl'],
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary.blue,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.colors.primary.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: theme.colors.primary.blue,
  },
  roleTitle: {
    ...theme.typography.title2,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  roleDescription: {
    ...theme.typography.subheadline,
  },
  continueButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
});
