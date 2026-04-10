/**
 * Host Base Price Screen
 * Nona fase onboarding host: imposta prezzo base per i giorni feriali
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { OnboardingScreenProps } from '../../types/navigation';

export default function HostBasePriceScreen({
  navigation,
  route,
}: OnboardingScreenProps<'HostBasePrice'>) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [basePrice, setBasePrice] = useState<string>('');

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  const value = basePrice ? Math.max(0, parseFloat(basePrice.replace(',', '.')) || 0) : 0;

  const handleContinue = async () => {
    if (!propertyId || value <= 0) return;
    try {
      await PropertiesService.updateProperty(propertyId, {
        base_price_per_night: value,
      });
    } catch (_) {}
    navigation.navigate('HostOnboarding');
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepTitle, { color: textColor }]}>
          {t('propertyOnboarding.step7Title')}
        </Text>
        <Text style={[styles.stepSubtitle, { color: secondary }]}>
          {t('propertyOnboarding.step7Tip')}
        </Text>

        <View style={styles.priceInputWrap}>
          <Text style={[styles.priceCurrency, { color: textColor }]}>€</Text>
          <TextInput
            style={[styles.priceInput, { color: textColor }]}
            value={basePrice}
            onChangeText={(v) => setBasePrice(v.replace(/[^0-9,.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={secondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.showSimilarBtn, { borderColor: secondary }]}
          onPress={() => {}}
        >
          <Ionicons name="location" size={20} color={theme.colors.primary.blue} />
          <Text style={[styles.showSimilarText, { color: textColor }]}>
            {t('propertyOnboarding.step7ShowSimilar')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.link, { color: theme.colors.primary.blue }]}>
          {t('propertyOnboarding.step7LearnMorePrices')}
        </Text>

        <Button
          onPress={handleContinue}
          size="lg"
          style={styles.button}
          disabled={value <= 0}
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
  stepSubtitle: { ...theme.typography.body, marginBottom: theme.spacing.xl },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.blue,
    marginBottom: 12,
  },
  priceCurrency: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    ...theme.typography.largeTitle,
    fontWeight: '700',
    paddingVertical: 8,
  },
  showSimilarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 16,
  },
  showSimilarText: { ...theme.typography.body, fontWeight: '600' },
  link: { ...theme.typography.body, marginBottom: theme.spacing['2xl'] },
  button: { marginTop: theme.spacing.md },
});
