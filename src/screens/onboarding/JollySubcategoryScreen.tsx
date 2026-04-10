/**
 * Jolly Subcategory Screen
 * Sottocategoria per ruolo Jolly: cleaner, property manager, assistenza, autista, fornitore
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

export type JollySubcategory =
  | 'cleaner'
  | 'property_manager'
  | 'assistenza'
  | 'autista'
  | 'fornitore'
  | 'restaurant'
  | 'excursions'
  | 'boat_excursions'
  | 'home_products';

const JOLLY_SUBCATEGORIES: { value: JollySubcategory; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'cleaner', labelKey: 'onboarding.jollyCleaner', icon: 'sparkles' },
  { value: 'property_manager', labelKey: 'onboarding.jollyPropertyManager', icon: 'business' },
  { value: 'assistenza', labelKey: 'onboarding.jollyAssistenza', icon: 'headset' },
  { value: 'autista', labelKey: 'onboarding.jollyAutista', icon: 'car' },
  { value: 'fornitore', labelKey: 'onboarding.jollyFornitore', icon: 'cube' },
  { value: 'restaurant', labelKey: 'onboarding.jollyRestaurant', icon: 'restaurant' },
  { value: 'excursions', labelKey: 'onboarding.jollyExcursions', icon: 'trail-sign' },
  { value: 'boat_excursions', labelKey: 'onboarding.jollyBoatExcursions', icon: 'boat' },
  { value: 'home_products', labelKey: 'onboarding.jollyHomeProducts', icon: 'cart' },
];

export default function JollySubcategoryScreen({ navigation }: OnboardingScreenProps<'JollySubcategory'>) {
  const { user, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [selected, setSelected] = useState<JollySubcategory | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected || !user) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AuthService.updateProfile(user.id, {
        role: 'jolly',
        jolly_subcategory: selected,
      });
      await refreshProfile();
      navigation.navigate('ProfileCompletion', { role: 'jolly' });
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('onboarding.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>{t('onboarding.jollySubcategory')}</Text>
          <Text style={[styles.subtitle, { color: secondary }]}>
            {t('onboarding.jollySubcategorySubtitle')}
          </Text>
        </View>
        <View style={styles.options}>
          {JOLLY_SUBCATEGORIES.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(opt.value);
              }}
              activeOpacity={0.7}
            >
              <Card style={[styles.optionCard, selected === opt.value && styles.selectedCard]}>
                <Ionicons
                  name={opt.icon}
                  size={28}
                  color={selected === opt.value ? '#fff' : theme.colors.primary.blue}
                />
                <Text style={[styles.optionLabel, { color: textColor }]}>{t(opt.labelKey)}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          onPress={handleContinue}
          disabled={!selected || loading}
          loading={loading}
          size="lg"
          style={styles.button}
        >
          {t('onboarding.continue')}
        </Button>
      </View>
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
  content: { flex: 1, padding: theme.spacing.screenPadding },
  header: { marginBottom: theme.spacing['3xl'] },
  title: { ...theme.typography.largeTitle, fontWeight: '700', marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body },
  options: { gap: theme.spacing.md, flex: 1 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary.blue,
    backgroundColor: `${theme.colors.primary.blue}20`,
  },
  optionLabel: { ...theme.typography.headline, fontWeight: '600' },
  button: { marginTop: theme.spacing.lg },
});
