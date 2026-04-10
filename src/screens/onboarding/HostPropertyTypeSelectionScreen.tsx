/**
 * Host Property Type Selection Screen
 * Terza fase onboarding host: scelta del tipo di struttura da pubblicare (grid come in NewPropertyOnboarding step 1)
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
  STRUCTURE_TYPES,
  type StructureTypeKey,
} from '../../constants/propertyOnboarding';
import type { OnboardingScreenProps } from '../../types/navigation';

const ONBOARDING_STRUCTURE_TYPE_KEY = '@nomadiqe/onboarding_selected_structure_type';

const STRUCTURE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  casa: 'home',
  appartamento: 'business',
  fienile: 'storefront',
  bnb: 'cafe',
  barca: 'boat',
  baita: 'home-outline',
  camper_roulotte: 'car',
  casa_particular: 'home',
  castello: 'business',
  grotta: 'ellipse',
  container: 'cube',
  casa_cicladica: 'square',
  dammuso: 'home',
  cupola: 'ellipse',
  casa_organica: 'leaf',
  fattoria: 'leaf',
  pensione: 'business',
  hotel: 'business',
  casa_galleggiante: 'water',
  kezhan: 'business',
  minsu: 'business',
  riad: 'business',
  ryokan: 'business',
  capanna: 'home',
  tenda: 'bonfire',
  minicasa: 'home',
  torre: 'cellular',
  casa_sull_albero: 'leaf',
  trullo: 'home',
  mulino: 'snow',
  iurta: 'ellipse',
};

export default function HostPropertyTypeSelectionScreen({
  navigation,
}: OnboardingScreenProps<'HostPropertyTypeSelection'>) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState<StructureTypeKey | null>(null);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const handleContinue = async () => {
    if (!selectedType) return;
    try {
      await AsyncStorage.setItem(ONBOARDING_STRUCTURE_TYPE_KEY, selectedType);
    } catch (_) {}
    navigation.navigate('HostPropertyBasicInfo');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('propertyOnboarding.step1Title')}
          </Text>
        </View>

        <View style={styles.typeGrid}>
          {STRUCTURE_TYPES.map((key) => {
            const selected = selectedType === key;
            const iconName = STRUCTURE_ICONS[key] ?? 'home';
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: selected
                      ? isDark
                        ? `${theme.colors.primary.blue}40`
                        : `${theme.colors.primary.blue}20`
                      : cardBg,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  },
                ]}
                onPress={() => setSelectedType(key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={iconName}
                  size={28}
                  color={selected ? theme.colors.primary.blue : (isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel)}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: selected ? textColor : (isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel) },
                  ]}
                  numberOfLines={2}
                >
                  {t(`propertyType.${key}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          onPress={handleContinue}
          disabled={!selectedType}
          size="lg"
          style={styles.button}
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
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  header: { marginBottom: theme.spacing.lg },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing['2xl'],
  },
  typeCard: {
    width: '31%',
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 88,
  },
  typeLabel: {
    ...theme.typography.caption1,
    marginTop: 6,
    textAlign: 'center',
  },
  button: { marginTop: theme.spacing.md },
});
