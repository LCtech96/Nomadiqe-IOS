/**
 * Host Property Amenities Screen
 * Quinta fase onboarding host: servizi e sistemi di sicurezza dell'alloggio
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import {
  AMENITIES_REQUESTED,
  AMENITIES_INTEREST,
  AMENITIES_SECURITY,
  type AmenityKey,
} from '../../constants/propertyOnboarding';
import type { OnboardingScreenProps } from '../../types/navigation';

const ONBOARDING_AMENITIES_KEY = '@nomadiqe/onboarding_amenities';

function AmenityChip({
  id,
  selected,
  onToggle,
  textColor,
  cardBg,
  t,
}: {
  id: AmenityKey;
  selected: boolean;
  onToggle: () => void;
  textColor: string;
  cardBg: string;
  t: (key: string) => string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.amenityChip,
        {
          backgroundColor: selected ? theme.colors.primary.blue : cardBg,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? theme.colors.primary.blue : 'transparent',
        },
      ]}
      onPress={onToggle}
    >
      <Text
        style={[styles.amenityChipText, { color: selected ? '#fff' : textColor }]}
        numberOfLines={2}
      >
        {t(`amenity.${id}`)}
      </Text>
    </TouchableOpacity>
  );
}

export default function HostPropertyAmenitiesScreen({
  navigation,
}: OnboardingScreenProps<'HostPropertyAmenities'>) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [selected, setSelected] = useState<AmenityKey[]>([]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const toggle = (key: AmenityKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_AMENITIES_KEY, JSON.stringify(selected));
    } catch (_) {}
    navigation.navigate('HostPropertyPhotos');
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
          {t('propertyOnboarding.step3Title')}
        </Text>
        <Text style={[styles.stepSubtitle, { color: secondary }]}>
          {t('propertyOnboarding.step3Subtitle')}
        </Text>

        <Text style={[styles.sectionLabel, { color: textColor }]}>
          {t('propertyOnboarding.step3SectionRequested')}
        </Text>
        <View style={styles.amenityGrid}>
          {AMENITIES_REQUESTED.map((key) => (
            <AmenityChip
              key={key}
              id={key}
              selected={selected.includes(key)}
              onToggle={() => toggle(key)}
              textColor={textColor}
              cardBg={cardBg}
              t={t}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: textColor }]}>
          {t('propertyOnboarding.step3SectionInterest')}
        </Text>
        <View style={styles.amenityGrid}>
          {AMENITIES_INTEREST.map((key) => (
            <AmenityChip
              key={key}
              id={key}
              selected={selected.includes(key)}
              onToggle={() => toggle(key)}
              textColor={textColor}
              cardBg={cardBg}
              t={t}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: textColor }]}>
          {t('propertyOnboarding.step3SectionSecurity')}
        </Text>
        <View style={styles.amenityGrid}>
          {AMENITIES_SECURITY.map((key) => (
            <AmenityChip
              key={key}
              id={key}
              selected={selected.includes(key)}
              onToggle={() => toggle(key)}
              textColor={textColor}
              cardBg={cardBg}
              t={t}
            />
          ))}
        </View>

        <Button onPress={handleContinue} size="lg" style={styles.button}>
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
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  amenityChipText: { ...theme.typography.subheadline },
  button: { marginTop: theme.spacing['2xl'] },
});
