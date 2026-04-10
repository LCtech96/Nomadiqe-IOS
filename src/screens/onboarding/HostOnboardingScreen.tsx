/**
 * Host Onboarding Screen
 * Step 1: Benvenuto + Feature overview
 * Step 2: Scelta tier struttura (basic / medium / luxury)
 * Step 3: Collaborazioni a pagamento + Disclaimer contenuti
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import type { OnboardingScreenProps } from '../../types/navigation';

const STEPS = 3;
type HostTier = 'basic' | 'medium' | 'luxury';

// ──────────────────────────────────────────────────────────────────────────
// Tier data
// ──────────────────────────────────────────────────────────────────────────
interface TierOption {
  tier: HostTier;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}
const TIER_OPTIONS: TierOption[] = [
  { tier: 'basic',  icon: 'home-outline',          color: '#34C759' },
  { tier: 'medium', icon: 'business-outline',       color: '#007AFF' },
  { tier: 'luxury', icon: 'diamond-outline',        color: '#FF9500' },
];

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────
export default function HostOnboardingScreen({ navigation }: OnboardingScreenProps<'HostOnboarding'>) {
  const { user, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<HostTier | null>(null);
  const [acceptsPaidCollab, setAcceptsPaidCollab] = useState<boolean | null>(null);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  const canProceedStep2 = selectedTier !== null;
  const canProceedStep3 = acceptsPaidCollab !== null && disclaimerAccepted;

  const handleComplete = async () => {
    if (!user) return;
    if (!disclaimerAccepted) {
      Alert.alert('Disclaimer richiesto', 'Devi leggere e accettare le condizioni d\'utilizzo dei contenuti per continuare.');
      return;
    }
    try {
      setLoading(true);
      await AuthService.updateProfile(user.id, {
        onboarding_completed: true,
        host_tier: selectedTier,
        accepts_paid_collaborations: acceptsPaidCollab ?? false,
      } as Parameters<typeof AuthService.updateProfile>[1]);
      await refreshProfile();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Errore durante il completamento dell\'onboarding';
      Alert.alert('Errore', msg);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step < STEPS) setStep((s) => s + 1);
    else handleComplete();
  };

  const goPrev = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Back */}
      <TouchableOpacity style={styles.backRow} onPress={goPrev}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      {/* Progress */}
      <View style={styles.progressRow}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              { backgroundColor: i < step ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1: Benvenuto ─────────────────────────────── */}
        {step === 1 && (
          <>
            <Text style={styles.emoji}>🏠</Text>
            <Text style={[styles.title, { color: textColor }]}>{t('onboarding.hostWelcomeTitle')}</Text>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>{t('onboarding.hostWelcomeSubtitle')}</Text>

            <View style={styles.featureList}>
              {[
                { icon: '✨' as const, title: 'Aggiungi le tue strutture', desc: 'Carica foto, descrizioni e disponibilità.' },
                { icon: '🤝' as const, title: 'Collabora con Creator e Jolly', desc: 'Trova profili compatibili con il tuo livello.' },
                { icon: '📊' as const, title: 'Monitora le performance', desc: 'Statistiche su prenotazioni e collaborazioni.' },
              ].map(({ icon, title, desc }) => (
                <View key={title} style={[styles.featureItem, { backgroundColor: cardBg }]}>
                  <Text style={styles.featureIcon}>{icon}</Text>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: textColor }]}>{title}</Text>
                    <Text style={[styles.featureDesc, { color: secondaryColor }]}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── STEP 2: Scelta tier ───────────────────────────── */}
        {step === 2 && (
          <>
            <Text style={[styles.title, { color: textColor }]}>{t('onboarding.hostTierTitle')}</Text>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>{t('onboarding.hostTierSubtitle')}</Text>

            <View style={styles.tierList}>
              {TIER_OPTIONS.map(({ tier, icon, color }) => {
                const isSelected = selectedTier === tier;
                const labelKey = `onboarding.hostTier${tier.charAt(0).toUpperCase() + tier.slice(1)}` as
                  'onboarding.hostTierBasic' | 'onboarding.hostTierMedium' | 'onboarding.hostTierLuxury';
                const descKey = `onboarding.hostTier${tier.charAt(0).toUpperCase() + tier.slice(1)}Desc` as
                  'onboarding.hostTierBasicDesc' | 'onboarding.hostTierMediumDesc' | 'onboarding.hostTierLuxuryDesc';
                return (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.tierCard,
                      { backgroundColor: cardBg, borderColor: isSelected ? color : 'transparent', borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedTier(tier)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.tierIconWrap, { backgroundColor: `${color}22` }]}>
                      <Ionicons name={icon} size={28} color={color} />
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierLabel, { color: textColor }]}>{t(labelKey)}</Text>
                      <Text style={[styles.tierDesc, { color: secondaryColor }]}>{t(descKey)}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── STEP 3: Paid collab + Disclaimer ─────────────── */}
        {step === 3 && (
          <>
            <Text style={[styles.title, { color: textColor }]}>{t('onboarding.paidCollabTitle')}</Text>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>{t('onboarding.paidCollabSubtitle')}</Text>

            {/* Why important */}
            <View style={[styles.infoBox, { backgroundColor: 'rgba(0,122,255,0.08)', borderColor: 'rgba(0,122,255,0.25)' }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary.blue} />
              <Text style={[styles.infoBoxText, { color: textColor }]}>{t('onboarding.paidCollabWhyBody')}</Text>
            </View>

            {/* Choice */}
            {([
              { value: true,  icon: 'cash-outline' as const,      color: '#34C759', labelKey: 'onboarding.paidCollabAccept' as const },
              { value: false, icon: 'hand-left-outline' as const,  color: '#FF3B30', labelKey: 'onboarding.paidCollabDecline' as const },
            ] as { value: boolean; icon: keyof typeof Ionicons.glyphMap; color: string; labelKey: 'onboarding.paidCollabAccept' | 'onboarding.paidCollabDecline' }[]).map(({ value, icon, color, labelKey }) => (
              <TouchableOpacity
                key={String(value)}
                style={[
                  styles.choiceCard,
                  { backgroundColor: cardBg, borderColor: acceptsPaidCollab === value ? color : 'transparent', borderWidth: 2 },
                ]}
                onPress={() => setAcceptsPaidCollab(value)}
                activeOpacity={0.75}
              >
                <Ionicons name={icon} size={22} color={color} />
                <Text style={[styles.choiceLabel, { color: textColor, flex: 1 }]}>{t(labelKey)}</Text>
                {acceptsPaidCollab === value && <Ionicons name="checkmark-circle" size={20} color={color} />}
              </TouchableOpacity>
            ))}

            {/* Disclaimer */}
            <View style={[styles.disclaimerBox, { backgroundColor: cardBg }]}>
              <Text style={[styles.disclaimerTitle, { color: textColor }]}>{t('onboarding.contentDisclaimerTitle')}</Text>
              <Text style={[styles.disclaimerBody, { color: secondaryColor }]} numberOfLines={5}>
                {t('onboarding.contentDisclaimerBody')}
              </Text>
              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() => setDisclaimerVisible(true)}
              >
                <Text style={[styles.readMoreText, { color: theme.colors.primary.blue }]}>Leggi tutto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setDisclaimerAccepted((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, { borderColor: disclaimerAccepted ? theme.colors.primary.blue : secondaryColor, backgroundColor: disclaimerAccepted ? theme.colors.primary.blue : 'transparent' }]}>
                  {disclaimerAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.checkLabel, { color: textColor }]}>{t('onboarding.contentDisclaimerAccept')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          onPress={goNext}
          loading={loading}
          disabled={
            loading ||
            (step === 2 && !canProceedStep2) ||
            (step === 3 && !canProceedStep3)
          }
          size="lg"
          style={styles.ctaBtn}
        >
          {step < STEPS ? t('common.next') : t('onboarding.startHosting')}
        </Button>
      </View>

      {/* Disclaimer Modal */}
      <Modal visible={disclaimerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDisclaimerVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('onboarding.contentDisclaimerTitle')}</Text>
            <Pressable onPress={() => setDisclaimerVisible(false)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
              <Ionicons name="close" size={24} color={textColor} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <Text style={[styles.modalBody, { color: textColor }]}>{t('onboarding.contentDisclaimerBody')}</Text>
          </ScrollView>
          <View style={styles.footer}>
            <Button
              onPress={() => { setDisclaimerAccepted(true); setDisclaimerVisible(false); }}
              size="lg"
              style={styles.ctaBtn}
            >
              {t('onboarding.contentDisclaimerAccept')}
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screenPadding,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  progressDot: { height: 4, flex: 1, borderRadius: 2 },
  content: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 120,
    alignItems: 'stretch',
  },
  emoji: { fontSize: 72, textAlign: 'center', marginBottom: theme.spacing.lg },
  title: { ...theme.typography.title1, fontWeight: '700', textAlign: 'center', marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, textAlign: 'center', marginBottom: theme.spacing['2xl'] },

  // Features (step 1)
  featureList: { gap: theme.spacing.md },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  featureIcon: { fontSize: 36 },
  featureText: { flex: 1 },
  featureTitle: { ...theme.typography.headline, fontWeight: '600' },
  featureDesc: { ...theme.typography.subheadline, marginTop: 2 },

  // Tier cards (step 2)
  tierList: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  tierIconWrap: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierInfo: { flex: 1 },
  tierLabel: { ...theme.typography.headline, fontWeight: '700' },
  tierDesc: { ...theme.typography.caption1, marginTop: 2 },

  // Paid collab cards (step 3)
  infoBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoBoxText: { ...theme.typography.caption1, flex: 1, lineHeight: 18 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  choiceLabel: { ...theme.typography.subheadline, fontWeight: '600' },

  // Disclaimer box (step 3)
  disclaimerBox: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  disclaimerTitle: { ...theme.typography.headline, fontWeight: '700', marginBottom: theme.spacing.sm },
  disclaimerBody: { ...theme.typography.caption1, lineHeight: 18 },
  readMoreBtn: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
  readMoreText: { ...theme.typography.subheadline, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkLabel: { ...theme.typography.subheadline, flex: 1 },

  // Footer
  footer: { padding: theme.spacing.screenPadding },
  ctaBtn: { width: '100%' },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  modalTitle: { ...theme.typography.title3, fontWeight: '700' },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  modalBody: { ...theme.typography.body, lineHeight: 24 },
});
