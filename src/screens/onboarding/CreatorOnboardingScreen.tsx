/**
 * Creator Onboarding Screen
 * Flusso in 3 step: categoria → tipi strutture (min 2) → link social → invio richiesta admin
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { ProfilesService } from '../../services/profiles.service';
import type { OnboardingScreenProps } from '../../types/navigation';
import {
  CREATOR_CATEGORIES,
  STRUCTURE_OPPORTUNITIES,
  MIN_STRUCTURE_SELECTIONS,
  SOCIAL_PLATFORMS,
  type CreatorCategory,
  type StructureOpportunity,
  type SocialLinksMap,
} from '../../constants/creator';

const STEPS = 4;

export default function CreatorOnboardingScreen({ navigation }: OnboardingScreenProps<'CreatorOnboarding'>) {
  const { user, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState<CreatorCategory | null>(null);
  const [structureSelections, setStructureSelections] = useState<StructureOpportunity[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinksMap>({});
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [disclaimerModalVisible, setDisclaimerModalVisible] = useState(false);

  const toggleStructure = (value: StructureOpportunity) => {
    setStructureSelections((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const setSocialLink = (key: keyof SocialLinksMap, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value.trim() || null }));
  };

  const canProceedStep1 = category != null;
  const canProceedStep2 = structureSelections.length >= MIN_STRUCTURE_SELECTIONS;
  const canProceedStep4 = disclaimerAccepted;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleSubmit = async () => {
    if (!user || !category || structureSelections.length < MIN_STRUCTURE_SELECTIONS) {
      Alert.alert(t('common.error'), t('creator.structureSubtitle'));
      return;
    }
    try {
      setLoading(true);
      const links: Record<string, string | null> = {};
      SOCIAL_PLATFORMS.forEach(({ key }) => {
        links[key] = socialLinks[key] ?? null;
      });
      await ProfilesService.submitCreatorApplication(user.id, {
        creator_category: category,
        creator_structure_preferences: structureSelections,
        social_links: links,
      });
      await refreshProfile();
      Alert.alert(t('common.success'), t('creator.submitSuccess'), [
        { text: t('common.ok'), onPress: () => {} },
      ]);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('common.saveProfileError'));
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: secondaryColor }]}>
          {step} / {STEPS}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Categoria */}
          {step === 1 && (
            <View style={styles.stepBlock}>
              <Text style={[styles.title, { color: textColor }]}>{t('creator.categoryTitle')}</Text>
              <Text style={[styles.subtitle, { color: secondaryColor }]}>
                {t('creator.categorySubtitle')}
              </Text>
              {CREATOR_CATEGORIES.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionCard,
                    { backgroundColor: category === opt.value ? theme.colors.primary.blue : cardBg },
                    category === opt.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setCategory(opt.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: category === opt.value ? '#fff' : textColor },
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 2: Tipi strutture (min 2) */}
          {step === 2 && (
            <View style={styles.stepBlock}>
              <Text style={[styles.title, { color: textColor }]}>{t('creator.structureTitle')}</Text>
              <Text style={[styles.subtitle, { color: secondaryColor }]}>
                {t('creator.structureSubtitle')}
              </Text>
              <Text style={[styles.hint, { color: secondaryColor }]}>
                {structureSelections.length} / {MIN_STRUCTURE_SELECTIONS}+ {t('common.done')}
              </Text>
              {STRUCTURE_OPPORTUNITIES.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: structureSelections.includes(opt.value)
                        ? theme.colors.primary.blue
                        : cardBg,
                    },
                    structureSelections.includes(opt.value) && styles.optionCardSelected,
                  ]}
                  onPress={() => toggleStructure(opt.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: structureSelections.includes(opt.value) ? '#fff' : textColor,
                      },
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 4: Disclaimer contenuti */}
          {step === 4 && (
            <View style={styles.stepBlock}>
              <Text style={[styles.title, { color: textColor }]}>{t('onboarding.contentDisclaimerTitle')}</Text>
              <Text style={[styles.subtitle, { color: secondaryColor }]}>
                Leggi attentamente le condizioni prima di procedere.
              </Text>

              <View style={[styles.disclaimerBox, { backgroundColor: cardBg }]}>
                <Text style={[styles.disclaimerBody, { color: textColor }]} numberOfLines={8}>
                  {t('onboarding.contentDisclaimerBody')}
                </Text>
                <TouchableOpacity style={styles.readMoreBtn} onPress={() => setDisclaimerModalVisible(true)}>
                  <Text style={[styles.readMoreText, { color: theme.colors.primary.blue }]}>Leggi tutto</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setDisclaimerAccepted((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  {
                    borderColor: disclaimerAccepted ? theme.colors.primary.blue : secondaryColor,
                    backgroundColor: disclaimerAccepted ? theme.colors.primary.blue : 'transparent',
                  },
                ]}>
                  {disclaimerAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.checkLabel, { color: textColor }]}>{t('onboarding.contentDisclaimerAccept')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Link social */}
          {step === 3 && (
            <View style={styles.stepBlock}>
              <Text style={[styles.title, { color: textColor }]}>{t('creator.socialTitle')}</Text>
              <Text style={[styles.subtitle, { color: secondaryColor }]}>
                {t('creator.socialSubtitle')}
              </Text>
              <Text style={[styles.hint, { color: secondaryColor }]}>
                {t('creator.socialVisibleToHosts')}
              </Text>
              {SOCIAL_PLATFORMS.map(({ key, labelKey, placeholder }) => (
                <Input
                  key={key}
                  label={t(labelKey)}
                  placeholder={placeholder}
                  value={socialLinks[key] ?? ''}
                  onChangeText={(v) => setSocialLink(key, v)}
                  containerStyle={styles.inputRow}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < STEPS ? (
            <Button
              onPress={handleNext}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
              size="lg"
              style={styles.button}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !canProceedStep4}
              size="lg"
              style={styles.button}
            >
              {t('creator.submit')}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Disclaimer full modal */}
      <Modal
        visible={disclaimerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDisclaimerModalVisible(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor, fontSize: 18, marginBottom: 0 }]}>
              {t('onboarding.contentDisclaimerTitle')}
            </Text>
            <Pressable onPress={() => setDisclaimerModalVisible(false)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
              <Ionicons name="close" size={24} color={textColor} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.disclaimerBody, { color: textColor, fontSize: 14, lineHeight: 22 }]}>
              {t('onboarding.contentDisclaimerBody')}
            </Text>
          </ScrollView>
          <View style={styles.footer}>
            <Button
              onPress={() => { setDisclaimerAccepted(true); setDisclaimerModalVisible(false); }}
              size="lg"
              style={styles.button}
            >
              {t('onboarding.contentDisclaimerAccept')}
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  stepIndicator: {
    ...theme.typography.subheadline,
  },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  stepBlock: { gap: theme.spacing.lg },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    marginBottom: theme.spacing.md,
  },
  hint: {
    ...theme.typography.footnote,
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary.blue,
  },
  optionLabel: {
    ...theme.typography.headline,
    fontWeight: '600',
  },
  inputRow: { marginBottom: theme.spacing.md },
  footer: {
    padding: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
  },
  button: { width: '100%' },
  // Disclaimer (step 4)
  disclaimerBox: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  disclaimerBody: { ...theme.typography.caption1, lineHeight: 18 },
  readMoreBtn: { marginTop: theme.spacing.xs },
  readMoreText: { ...theme.typography.subheadline, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkLabel: { ...theme.typography.subheadline, flex: 1 },
});
