/**
 * Host KOL&BED Program Screen
 * Ottava fase onboarding host: adesione programma KOL&BED, notti minime, tipo programma (100%, Pulizie, Visibilità)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { OnboardingScreenProps } from '../../types/navigation';

type KolbedProgramType = 'kolbed_100' | 'gigo_50' | 'paid_collab';

const ONBOARDING_KOLBED_MIN_NIGHTS_KEY = '@nomadiqe/onboarding_kolbed_min_nights';
const MIN_NIGHTS_OPTIONS = [7, 14, 21, 28, 35];

export default function HostKolbedProgramScreen({
  navigation,
  route,
}: OnboardingScreenProps<'HostKolbedProgram'>) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [minNights, setMinNights] = useState(7);
  const [program, setProgram] = useState<KolbedProgramType | null>(null);
  const [paidMin, setPaidMin] = useState('');
  const [paidMax, setPaidMax] = useState('');

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const canContinue =
    program !== null &&
    (program !== 'paid_collab' ||
      (paidMin !== '' && paidMax !== '' && parseFloat(paidMin) <= parseFloat(paidMax)));

  const handleContinue = async () => {
    if (!canContinue || !propertyId) return;
    try {
      await AsyncStorage.setItem(ONBOARDING_KOLBED_MIN_NIGHTS_KEY, String(minNights));
      await PropertiesService.updateProperty(propertyId, {
        kolbed_program: program,
        paid_collab_min_budget:
          program === 'paid_collab' && paidMin ? parseFloat(paidMin) : null,
        paid_collab_max_budget:
          program === 'paid_collab' && paidMax ? parseFloat(paidMax) : null,
      });
    } catch (_) {}
    navigation.navigate('HostBasePrice', { propertyId });
  };

  const cardStyle = (value: KolbedProgramType) => ({
    backgroundColor: program === value ? cardBg : 'transparent',
    borderWidth: 2,
    borderColor:
      program === value
        ? theme.colors.primary.blue
        : isDark
          ? 'rgba(255,255,255,0.2)'
          : 'rgba(0,0,0,0.1)',
  });

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
          {t('propertyOnboarding.kolbedAdhesionTitle')}
        </Text>
        <Text style={[styles.stepSubtitle, { color: secondary }]}>
          {t('propertyOnboarding.kolbedAdhesionSubtitle')}
        </Text>

        <Text style={[styles.sectionLabel, { color: textColor }]}>
          {t('propertyOnboarding.kolbedMinNightsLabel')}
        </Text>
        <View style={styles.nightsRow}>
          {MIN_NIGHTS_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.nightChip,
                {
                  backgroundColor: minNights === n ? theme.colors.primary.blue : cardBg,
                  borderColor: minNights === n ? theme.colors.primary.blue : 'transparent',
                },
              ]}
              onPress={() => setMinNights(n)}
            >
              <Text
                style={[
                  styles.nightChipText,
                  { color: minNights === n ? '#fff' : textColor },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 100% - Consigliato */}
        <TouchableOpacity
          style={[styles.programCard, cardStyle('kolbed_100')]}
          onPress={() => setProgram('kolbed_100')}
        >
          <View style={styles.programCardContent}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>
                {t('propertyOnboarding.kolbedRecommendedBadge')}
              </Text>
            </View>
            <Text style={[styles.programTitle, { color: textColor }]}>
              {t('propertyOnboarding.kolbedProgram100Title')}
            </Text>
            <Text style={[styles.programDesc, { color: secondary }]}>
              {t('propertyOnboarding.kolbedProgram100Desc')}
            </Text>
          </View>
          <Ionicons name="ribbon" size={28} color={theme.colors.primary.blue} />
        </TouchableOpacity>

        {/* Pulizie */}
        <TouchableOpacity
          style={[styles.programCard, cardStyle('gigo_50')]}
          onPress={() => setProgram('gigo_50')}
        >
          <View style={styles.programCardContent}>
            <Text style={[styles.programTitle, { color: textColor }]}>
              {t('propertyOnboarding.kolbedProgramCleaningTitle')}
            </Text>
            <Text style={[styles.programDesc, { color: secondary }]}>
              {t('propertyOnboarding.kolbedProgramCleaningDesc')}
            </Text>
          </View>
          <Ionicons name="sparkles" size={28} color={theme.colors.primary.blue} />
        </TouchableOpacity>

        {/* Visibilità - Consigliato */}
        <TouchableOpacity
          style={[styles.programCard, cardStyle('paid_collab')]}
          onPress={() => setProgram('paid_collab')}
        >
          <View style={styles.programCardContent}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>
                {t('propertyOnboarding.kolbedRecommendedBadge')}
              </Text>
            </View>
            <Text style={[styles.programTitle, { color: textColor }]}>
              {t('propertyOnboarding.kolbedProgramVisibilityTitle')}
            </Text>
            <Text style={[styles.programDesc, { color: secondary }]}>
              {t('propertyOnboarding.kolbedProgramVisibilityDesc')}
            </Text>
            {program === 'paid_collab' && (
              <View style={styles.budgetRow}>
                <TextInput
                  style={[styles.budgetInput, { backgroundColor: cardBg, color: textColor }]}
                  placeholder="Min €"
                  placeholderTextColor={secondary}
                  value={paidMin}
                  onChangeText={setPaidMin}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.budgetSep, { color: secondary }]}>–</Text>
                <TextInput
                  style={[styles.budgetInput, { backgroundColor: cardBg, color: textColor }]}
                  placeholder="Max €"
                  placeholderTextColor={secondary}
                  value={paidMax}
                  onChangeText={setPaidMax}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </View>
          <Ionicons name="eye" size={28} color={theme.colors.primary.blue} />
        </TouchableOpacity>

        <Button
          onPress={handleContinue}
          size="lg"
          style={styles.button}
          disabled={!canContinue}
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
  sectionLabel: {
    ...theme.typography.headline,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  nightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.xl },
  nightChip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  nightChipText: { ...theme.typography.headline, fontWeight: '600' },
  programCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  programCardContent: { flex: 1 },
  programTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: 6 },
  programDesc: { ...theme.typography.subheadline },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  recommendedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  budgetInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...theme.typography.body,
  },
  budgetSep: { ...theme.typography.body },
  button: { marginTop: theme.spacing['2xl'] },
});
