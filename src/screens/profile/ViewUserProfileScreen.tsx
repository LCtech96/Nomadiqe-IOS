/**
 * Visualizza il profilo di un altro utente (es. host che ha richiesto collaborazione).
 * Per creator che vedono un host approvato: pulsante "Genera link" → richiesta con % → link creato dall'host.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Avatar } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProfilesService } from '../../services/profiles.service';
import { AffiliateService, type AffiliateLink } from '../../services/affiliate.service';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';
import type { UserProfile } from '../../types';

export default function ViewUserProfileScreen({
  navigation,
  route,
}: ProfileScreenProps<'ViewUserProfile'>) {
  const { userId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { user, profile: currentProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [affiliateCanRequest, setAffiliateCanRequest] = useState(false);
  const [existingLink, setExistingLink] = useState<AffiliateLink | null>(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [percentInput, setPercentInput] = useState('');

  useEffect(() => {
    ProfilesService.getProfilesByIds([userId])
      .then((list) => setProfile(list[0] ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const loadAffiliateState = useCallback(async () => {
    if (!user?.id || !currentProfile || !profile || currentProfile.role !== 'creator' || profile.role !== 'host') return;
    setAffiliateLoading(true);
    try {
      const [canRequest, link, pending] = await Promise.all([
        AffiliateService.canCreatorRequestLink(user.id, profile.id),
        AffiliateService.getLinkByHostAndCreator(profile.id, user.id),
        AffiliateService.getPendingRequestFromCreatorToHost(user.id, profile.id).then((r) => !!r),
      ]);
      setAffiliateCanRequest(canRequest);
      setExistingLink(link);
      setPendingRequest(pending);
    } catch {
      setAffiliateCanRequest(false);
      setExistingLink(null);
      setPendingRequest(false);
    } finally {
      setAffiliateLoading(false);
    }
  }, [user?.id, currentProfile?.role, profile?.id, profile?.role]);

  useEffect(() => {
    if (profile && currentProfile?.role === 'creator' && profile.role === 'host') loadAffiliateState();
  }, [profile, currentProfile?.role, loadAffiliateState]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }
  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('common.user')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: secondary }]}>{t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {profile.full_name || profile.username || t('common.user')}
        </Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.content}>
        <Avatar uri={profile.avatar_url} size={100} />
        <Text style={[styles.name, { color: textColor }]}>{profile.full_name || profile.username || '—'}</Text>
        {profile.username && (
          <Text style={[styles.username, { color: secondary }]}>@{profile.username}</Text>
        )}
        {profile.role && (
          <Text style={[styles.role, { color: secondary }]}>
            {profile.role === 'host' ? 'Host' : profile.role === 'creator' ? 'Creator' : profile.role === 'jolly' ? 'Jolly' : profile.role}
          </Text>
        )}
        {profile.bio && (
          <Text style={[styles.bio, { color: textColor }]}>{profile.bio}</Text>
        )}

        {/* Affiliate: solo creator che vede host approvato (swipe destra) */}
        {currentProfile?.role === 'creator' && profile.role === 'host' && (
          <View style={[styles.affiliateSection, { borderColor: isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel }]}>
            {affiliateLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary.blue} />
            ) : existingLink ? (
              <>
                <Text style={[styles.affiliateLabel, { color: textColor }]}>{t('affiliate.ilTuolink')}</Text>
                <Text style={[styles.affiliatePercent, { color: secondary }]}>
                  {existingLink.creator_percentage_offered}% {t('affiliate.prenotazioneDaLink')}
                </Text>
                <TouchableOpacity
                  style={[styles.affiliateButton, { backgroundColor: theme.colors.primary.blue }]}
                  onPress={async () => {
                    const url = AffiliateService.getLinkUrl(existingLink.token, undefined);
                    await Clipboard.setStringAsync(url);
                    Alert.alert('', t('affiliate.linkCopied'));
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color="#fff" />
                  <Text style={styles.affiliateButtonText}>{t('common.share')}</Text>
                </TouchableOpacity>
              </>
            ) : pendingRequest ? (
              <Text style={[styles.affiliateLabel, { color: secondary }]}>{t('affiliate.richiestaInAttesa')}</Text>
            ) : affiliateCanRequest ? (
              <TouchableOpacity
                style={[styles.affiliateButton, { backgroundColor: theme.colors.primary.blue }]}
                onPress={() => { setPercentInput(''); setModalVisible(true); }}
              >
                <Ionicons name="link-outline" size={20} color="#fff" />
                <Text style={styles.affiliateButtonText}>{t('affiliate.generaLink')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? theme.colors.dark.background : theme.colors.light.background }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('affiliate.generaLink')}</Text>
            <Text style={[styles.modalHint, { color: secondary }]}>{t('affiliate.percentPlaceholder')}</Text>
            <TextInput
              style={[styles.percentInput, { color: textColor, borderColor: secondary }]}
              placeholder="0–100"
              placeholderTextColor={secondary}
              keyboardType="number-pad"
              value={percentInput}
              onChangeText={setPercentInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: secondary }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary.blue }]}
                onPress={async () => {
                  const num = Math.max(0, Math.min(100, parseInt(percentInput, 10) || 0));
                  setModalVisible(false);
                  try {
                    await AffiliateService.createLinkRequest(user!.id, profile!.id, num);
                    setPendingRequest(true);
                    setAffiliateCanRequest(false);
                  } catch (e) {
                    Alert.alert(t('common.error'), (e as Error).message);
                  }
                }}
              >
                <Text style={styles.modalBtnText}>{t('affiliate.inviaRichiesta')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerRight: { width: 24 },
  content: { alignItems: 'center', padding: theme.spacing.screenPadding },
  name: { ...theme.typography.title1, fontWeight: '700', marginTop: theme.spacing.md },
  username: { ...theme.typography.body, marginTop: 4 },
  role: { ...theme.typography.caption1, marginTop: 4 },
  bio: { ...theme.typography.body, marginTop: theme.spacing.lg, textAlign: 'center' },
  emptyText: { ...theme.typography.body },
  affiliateSection: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  affiliateLabel: { ...theme.typography.body, marginBottom: theme.spacing.sm },
  affiliatePercent: { ...theme.typography.caption1, marginBottom: theme.spacing.md },
  affiliateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  affiliateButtonText: { ...theme.typography.body, color: '#fff', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalBox: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
  },
  modalTitle: { ...theme.typography.title2, fontWeight: '700', marginBottom: theme.spacing.sm },
  modalHint: { ...theme.typography.caption1, marginBottom: theme.spacing.sm },
  percentInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    ...theme.typography.body,
    marginBottom: theme.spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md, justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.sm },
  modalBtnText: { ...theme.typography.body, color: '#fff', fontWeight: '600' },
});
