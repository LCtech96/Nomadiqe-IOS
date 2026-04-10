/**
 * Dashboard Screen
 * Schermata principale per host / creator / jolly: ruolo + lista host/creator invitati
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { getInvitedByMe, type InvitationWithInvited } from '../../services/invitations.service';
import { CollaborationService, type CollaborationRequestWithCreator } from '../../services/collaboration.service';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';

export default function DashboardScreen({
  navigation,
}: ProfileScreenProps<'Dashboard'>) {
  const { isDark } = useTheme();
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [invitedList, setInvitedList] = useState<InvitationWithInvited[]>([]);
  const [loadingInvited, setLoadingInvited] = useState(false);
  const [collabRequests, setCollabRequests] = useState<Awaited<ReturnType<typeof CollaborationService.getRequestsByHost>>>([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [pendingFromCreators, setPendingFromCreators] = useState<CollaborationRequestWithCreator[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const inviteRole = profile?.role === 'host' ? 'host' : profile?.role === 'creator' ? 'creator' : null;
  const invitedEmptyRoleLabel = inviteRole === 'host' ? t('settings.inviteHost') : inviteRole === 'creator' ? t('settings.inviteCreator') : '';

  useEffect(() => {
    if (!profile?.id || !inviteRole) return;
    setLoadingInvited(true);
    getInvitedByMe(profile.id, inviteRole)
      .then(setInvitedList)
      .catch(() => setInvitedList([]))
      .finally(() => setLoadingInvited(false));
  }, [profile?.id, inviteRole]);

  const loadHostData = useCallback(async () => {
    if (!profile?.id || profile?.role !== 'host') return;
    setLoadingCollab(true);
    setLoadingPending(true);
    try {
      const [sent, pending] = await Promise.all([
        CollaborationService.getRequestsByHost(profile.id),
        CollaborationService.getPendingRequestsToHost(profile.id),
      ]);
      setPendingFromCreators(pending);
      setCollabRequests(
        sent.filter(
          (r) => r.initiated_by !== 'creator' || r.status === 'accepted'
        )
      );
    } catch {
      setCollabRequests([]);
      setPendingFromCreators([]);
    } finally {
      setLoadingCollab(false);
      setLoadingPending(false);
    }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const sectionTitle = inviteRole === 'host' ? t('dashboard.invitedHosts') : inviteRole === 'creator' ? t('dashboard.invitedCreators') : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('dashboard.title')}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.pointsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.pointsLabel, { color: secondary }]}>{t('dashboard.points')}</Text>
          <Text style={[styles.pointsValue, { color: textColor }]}>
            {profile?.points ?? 0}
          </Text>
          <Text style={[styles.pointsHint, { color: secondary }]}>
            {t('dashboard.pointsHint')}
          </Text>
        </View>

        <Text style={[styles.roleLabel, { color: secondary }]}>{t('dashboard.role')}</Text>
        <Text style={[styles.roleValue, { color: textColor }]}>
          {profile?.role || '—'}
        </Text>
        <Text style={[styles.hint, { color: secondary }]}>
          {t('dashboard.hint')}
        </Text>

        {sectionTitle && (
          <View style={styles.invitedSection}>
            <Text style={[styles.invitedTitle, { color: textColor }]}>{sectionTitle}</Text>
            {loadingInvited ? (
              <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
            ) : invitedList.length === 0 ? (
              <Text style={[styles.invitedEmpty, { color: secondary }]}>
                {t('dashboard.invitedEmpty', { role: invitedEmptyRoleLabel })}
              </Text>
            ) : (
              invitedList.map((inv) => (
                <View key={inv.id} style={styles.invitedRow}>
                  <Avatar uri={inv.invited?.avatar_url} size={44} />
                  <View style={styles.invitedInfo}>
                    <Text style={[styles.invitedName, { color: textColor }]} numberOfLines={1}>
                      {inv.invited?.full_name || t('common.user')}
                    </Text>
                    {inv.invited?.username && (
                      <Text style={[styles.invitedUsername, { color: secondary }]} numberOfLines={1}>
                        @{inv.invited.username}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {profile?.role === 'host' && (
          <>
            <View style={styles.invitedSection}>
              <Text style={[styles.invitedTitle, { color: textColor }]}>{t('dashboard.requestsFromCreatorsTitle')}</Text>
              {loadingPending ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
              ) : pendingFromCreators.length === 0 ? (
                <Text style={[styles.invitedEmpty, { color: secondary }]}>
                  {t('dashboard.requestsFromCreatorsEmpty')}
                </Text>
              ) : (
                pendingFromCreators.map((req) => {
                  const isActing = actingId === req.id;
                  return (
                    <View key={req.id} style={styles.pendingBlock}>
                      <TouchableOpacity
                        style={[styles.invitedRow, styles.pendingRow]}
                        onPress={() => navigation.navigate('HostCollaborationRequestDetail', { requestId: req.id })}
                        activeOpacity={0.75}
                      >
                        <Avatar uri={req.creator?.avatar_url} size={44} />
                        <View style={styles.invitedInfo}>
                          <Text style={[styles.invitedName, { color: textColor }]} numberOfLines={1}>
                            {req.creator?.full_name || req.creator?.username || t('common.user')}
                          </Text>
                          <Text style={[styles.invitedUsername, { color: secondary }]} numberOfLines={1}>
                            {req.creator?.role === 'creator' ? 'Creator' : 'Jolly'} · {t('dashboard.openRequest')}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={secondary} />
                      </TouchableOpacity>
                      <View style={styles.pendingQuickRow}>
                        <TouchableOpacity
                          style={[styles.quickDot, { backgroundColor: '#FF3B30' }]}
                          disabled={isActing}
                          onPress={async () => {
                            if (!profile?.id || isActing) return;
                            setActingId(req.id);
                            try {
                              await CollaborationService.hostRejectCollaborationRequest(req.id, profile.id);
                              setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                            } catch (e) {
                              Alert.alert(t('common.error'), (e as Error).message);
                            } finally {
                              setActingId(null);
                            }
                          }}
                        />
                        <TouchableOpacity
                          style={[styles.quickDot, { backgroundColor: '#FFCC00' }]}
                          disabled={isActing}
                          onPress={() => {
                            Alert.alert(
                              t('dashboard.requestsFromCreatorsTitle'),
                              undefined,
                              [
                                {
                                  text: t('collabRequestDetail.kolbedHalfCoverage'),
                                  onPress: async () => {
                                    if (!profile?.id) return;
                                    setActingId(req.id);
                                    try {
                                      await CollaborationService.hostCounterOfferCollaboration(req.id, profile.id, 'half_coverage');
                                      setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                                      await refreshProfile?.();
                                    } catch (e) {
                                      Alert.alert(t('common.error'), (e as Error).message);
                                    } finally {
                                      setActingId(null);
                                    }
                                  },
                                },
                                {
                                  text: t('collabRequestDetail.kolbed50Discount'),
                                  onPress: async () => {
                                    if (!profile?.id) return;
                                    setActingId(req.id);
                                    try {
                                      await CollaborationService.hostCounterOfferCollaboration(req.id, profile.id, '50_discount');
                                      setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                                      await refreshProfile?.();
                                    } catch (e) {
                                      Alert.alert(t('common.error'), (e as Error).message);
                                    } finally {
                                      setActingId(null);
                                    }
                                  },
                                },
                                { text: t('common.cancel'), style: 'cancel' },
                              ]
                            );
                          }}
                        />
                        <TouchableOpacity
                          style={[styles.quickDot, { backgroundColor: '#34C759' }]}
                          disabled={isActing}
                          onPress={async () => {
                            if (!profile?.id || isActing) return;
                            setActingId(req.id);
                            try {
                              await CollaborationService.hostAcceptCollaborationRequest(req.id, profile.id);
                              setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                              await refreshProfile?.();
                            } catch (e) {
                              Alert.alert(t('common.error'), (e as Error).message);
                            } finally {
                              setActingId(null);
                            }
                          }}
                        >
                          {isActing ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="checkmark" size={22} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
            <View style={styles.invitedSection}>
              <Text style={[styles.invitedTitle, { color: textColor }]}>{t('dashboard.creatorsApprovedTitle')}</Text>
              {loadingCollab ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
              ) : collabRequests.length === 0 ? (
                <Text style={[styles.invitedEmpty, { color: secondary }]}>
                  {t('dashboard.collabRequestsEmpty')}
                </Text>
              ) : (
                collabRequests.map((req) => (
                  <TouchableOpacity
                    key={req.id}
                    style={styles.invitedRow}
                    onPress={() => navigation.navigate('HostCollaborationRequestDetail', { requestId: req.id })}
                    activeOpacity={0.7}
                  >
                    <Avatar uri={req.creator?.avatar_url} size={44} />
                    <View style={styles.invitedInfo}>
                      <Text style={[styles.invitedName, { color: textColor }]} numberOfLines={1}>
                        {req.creator?.full_name || req.creator?.username || t('common.user')}
                      </Text>
                      <Text style={[styles.invitedUsername, { color: secondary }]} numberOfLines={1}>
                        {req.creator?.role === 'creator' ? 'Creator' : 'Jolly'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={secondary} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  pointsCard: {
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.xl,
  },
  pointsLabel: { ...theme.typography.caption1, marginBottom: 4 },
  pointsValue: { ...theme.typography.largeTitle, fontWeight: '700' },
  pointsHint: { ...theme.typography.caption1, marginTop: theme.spacing.sm },
  roleLabel: { ...theme.typography.caption1, marginBottom: 4 },
  roleValue: { ...theme.typography.title1, marginBottom: theme.spacing.lg },
  hint: { ...theme.typography.body, marginBottom: theme.spacing.xl },
  invitedSection: { marginTop: theme.spacing.lg },
  invitedTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: theme.spacing.md },
  loader: { marginVertical: theme.spacing.md },
  invitedEmpty: { ...theme.typography.subheadline },
  invitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  pendingRow: { flexWrap: 'nowrap', alignItems: 'center' },
  pendingBlock: { marginBottom: theme.spacing.md },
  pendingQuickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  quickDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptRejectBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  acceptBtnText: { ...theme.typography.footnote, color: '#fff', fontWeight: '600' },
  rejectBtnText: { ...theme.typography.footnote, fontWeight: '600' },
  invitedInfo: { flex: 1 },
  invitedName: { ...theme.typography.body, fontWeight: '600' },
  invitedUsername: { ...theme.typography.caption1 },
  structureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  structureBtnText: { ...theme.typography.body, fontWeight: '600', flex: 1 },
});
