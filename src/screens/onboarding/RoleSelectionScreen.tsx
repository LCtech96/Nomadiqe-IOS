/**
 * Role Selection Screen
 * Selezione del ruolo utente (Host, Creator, Jolly)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button, Card } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useInvite } from '../../contexts/InviteContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import { getInviteByCode } from '../../services/invitations.service';
import type { OnboardingScreenProps } from '../../types/navigation';
import type { UserRole } from '../../types';

interface RoleOption {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
}

const roleOptions: RoleOption[] = [
  { role: 'host', icon: 'home' },
  { role: 'creator', icon: 'camera' },
  { role: 'jolly', icon: 'briefcase' },
];

export default function RoleSelectionScreen({ navigation }: OnboardingScreenProps<'RoleSelection'>) {
  const { user, refreshProfile } = useAuth();
  const { pendingInviteCode } = useInvite();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);

  // Se l'utente è arrivato da un link invito, pre-seleziona il ruolo (host o creator)
  useEffect(() => {
    if (!pendingInviteCode) return;
    getInviteByCode(pendingInviteCode)
      .then((inv) => {
        if (inv?.role) setSelectedRole(inv.role);
      })
      .catch(() => {});
  }, [pendingInviteCode]);

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

      // Navigate: jolly → sottocategoria, poi tutti → ProfileCompletion (passiamo il ruolo per evitare race sul profile)
      switch (selectedRole) {
        case 'host':
        case 'creator':
          navigation.navigate('ProfileCompletion', { role: selectedRole });
          break;
        case 'jolly':
          navigation.navigate('JollySubcategory');
          break;
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('onboarding.roleError'));
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
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
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
            {t('roles.selectRoleSubtitle')}
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
                  {t(`roles.${option.role}`)}
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
                  {t(`roles.${option.role}Description`)}
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
          {t('onboarding.continue')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
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
