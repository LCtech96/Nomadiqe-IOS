/**
 * Host Property Basic Info Screen
 * Quarta fase onboarding host: numero ospiti, camere, letti, bagni
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
import type { OnboardingScreenProps } from '../../types/navigation';

const ONBOARDING_BASIC_INFO_KEY = '@nomadiqe/onboarding_basic_info';

function StepperRow({
  label,
  value,
  onChange,
  min,
  max,
  textColor,
  secondary,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  textColor: string;
  secondary: string;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.stepperLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Ionicons name="remove" size={24} color={secondary} />
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { color: textColor }]}>{value}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Ionicons name="add" size={24} color={secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HostPropertyBasicInfoScreen({
  navigation,
}: OnboardingScreenProps<'HostPropertyBasicInfo'>) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [propertyTitle, setPropertyTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [guests, setGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_BASIC_INFO_KEY,
        JSON.stringify({
          propertyTitle: propertyTitle.trim(),
          city: city.trim(),
          country: country.trim().toUpperCase(),
          guests,
          bedrooms,
          beds,
          bathrooms,
        })
      );
    } catch (_) {}
    navigation.navigate('HostPropertyAmenities');
  };

  const canContinue =
    propertyTitle.trim().length >= 2 &&
    city.trim().length >= 2 &&
    country.trim().length >= 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('propertyOnboarding.step2Title')}
          </Text>
          <Text style={[styles.subtitle, { color: secondary }]}>
            {t('propertyOnboarding.step2Subtitle')}
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: textColor }]}>{t('propertyOnboarding.step2PropertyName')}</Text>
          <TextInput
            value={propertyTitle}
            onChangeText={setPropertyTitle}
            placeholder={t('propertyOnboarding.step2PropertyNamePlaceholder')}
            placeholderTextColor={secondary}
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={[styles.inputLabel, { color: textColor }]}>{t('propertyOnboarding.step2City')}</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder={t('propertyOnboarding.step2CityPlaceholder')}
            placeholderTextColor={secondary}
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={[styles.inputLabel, { color: textColor }]}>{t('propertyOnboarding.step2Country')}</Text>
          <TextInput
            value={country}
            onChangeText={(v) => setCountry(v.toUpperCase())}
            placeholder={t('propertyOnboarding.step2CountryPlaceholder')}
            placeholderTextColor={secondary}
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
            autoCapitalize="characters"
            returnKeyType="done"
            maxLength={3}
          />
        </View>

        <StepperRow
          label={t('propertyOnboarding.guests')}
          value={guests}
          onChange={setGuests}
          min={1}
          max={20}
          textColor={textColor}
          secondary={secondary}
        />
        <StepperRow
          label={t('propertyOnboarding.bedrooms')}
          value={bedrooms}
          onChange={setBedrooms}
          min={0}
          max={20}
          textColor={textColor}
          secondary={secondary}
        />
        <StepperRow
          label={t('propertyOnboarding.beds')}
          value={beds}
          onChange={setBeds}
          min={1}
          max={30}
          textColor={textColor}
          secondary={secondary}
        />
        <StepperRow
          label={t('propertyOnboarding.bathrooms')}
          value={bathrooms}
          onChange={setBathrooms}
          min={1}
          max={20}
          textColor={textColor}
          secondary={secondary}
        />

        <Button onPress={handleContinue} size="lg" style={styles.button} disabled={!canContinue}>
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
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  header: { marginBottom: theme.spacing.xl },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: { ...theme.typography.body },
  formSection: { marginBottom: theme.spacing.lg, gap: 8 },
  inputLabel: { ...theme.typography.caption1, fontWeight: '600', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  stepperLabel: { ...theme.typography.body, fontWeight: '500' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: { ...theme.typography.title2, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  button: { marginTop: theme.spacing['2xl'] },
});
