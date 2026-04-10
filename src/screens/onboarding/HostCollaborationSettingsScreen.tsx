/**
 * Host Collaboration Settings Screen
 * Settima fase onboarding host: scegli impostazioni collaborazione (Creator / Creator Verificato)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { OnboardingScreenProps } from '../../types/navigation';

type FirstGuestType = 'any_creator' | 'verified_creator';

export default function HostCollaborationSettingsScreen({
  navigation,
  route,
}: OnboardingScreenProps<'HostCollaborationSettings'>) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [selected, setSelected] = useState<FirstGuestType | null>(null);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const handleContinue = async () => {
    if (!selected) return;
    try {
      await PropertiesService.updateProperty(propertyId, { first_guest_type: selected });
    } catch (_) {}
    navigation.navigate('HostKolbedProgram', { propertyId });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.stepTitle, { color: textColor }]}>
          {t('propertyOnboarding.collaborationSettingsTitle')}
        </Text>
        <Text style={[styles.stepSubtitle, { color: secondary }]}>
          {t('propertyOnboarding.collaborationSettingsSubtitle')}{' '}
          <Text style={styles.link}>{t('propertyOnboarding.step5LearnMore')}</Text>
        </Text>

        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: selected === 'any_creator' ? cardBg : 'transparent',
              borderWidth: 2,
              borderColor:
                selected === 'any_creator'
                  ? theme.colors.primary.blue
                  : isDark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
            },
          ]}
          onPress={() => setSelected('any_creator')}
        >
          <View style={styles.optionCardContent}>
            <Text style={[styles.optionTitle, { color: textColor }]}>
              {t('propertyOnboarding.step6Option1Title')}
            </Text>
            <Text style={[styles.optionDesc, { color: secondary }]}>
              {t('propertyOnboarding.step6Option1Desc')}
            </Text>
          </View>
          <Ionicons name="person" size={32} color={theme.colors.primary.blue} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: selected === 'verified_creator' ? cardBg : 'transparent',
              borderWidth: 2,
              borderColor:
                selected === 'verified_creator'
                  ? theme.colors.primary.blue
                  : isDark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
            },
          ]}
          onPress={() => setSelected('verified_creator')}
        >
          <View style={styles.optionCardContent}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>
                {t('propertyOnboarding.step5Option1Badge')}
              </Text>
            </View>
            <Text style={[styles.optionTitle, { color: textColor }]}>
              {t('propertyOnboarding.step6Option2Title')}
            </Text>
            <Text style={[styles.optionDesc, { color: secondary }]}>
              {t('propertyOnboarding.step6Option2Desc')}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary.blue} />
        </TouchableOpacity>

        <Button
          onPress={handleContinue}
          size="lg"
          style={styles.button}
          disabled={!selected}
        >
          {t('onboarding.continue')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  stepTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: { ...theme.typography.body, marginBottom: theme.spacing.lg },
  link: { textDecorationLine: 'underline' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  optionCardContent: { flex: 1 },
  optionTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: 4 },
  optionDesc: { ...theme.typography.subheadline },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  recommendedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  button: { marginTop: theme.spacing['2xl'] },
});
