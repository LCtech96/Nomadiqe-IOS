/**
 * Host: lista richieste di link affiliato da creator approvati (swipe).
 * Per ogni richiesta l'host inserisce la % da offrire e approva o rifiuta.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { AffiliateService, type AffiliateLinkRequestWithCreator } from '../../services/affiliate.service';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';

export default function AffiliateLinkRequestsScreen({
  navigation,
}: ProfileScreenProps<'AffiliateLinkRequests'>) {
  const { isDark } = useTheme();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [requests, setRequests] = useState<AffiliateLinkRequestWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [offeredPercents, setOfferedPercents] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || profile?.role !== 'host') return;
    setLoading(true);
    try {
      const list = await AffiliateService.getPendingLinkRequestsForHost(user.id);
      setRequests(list);
      setOfferedPercents((prev) => {
        const next = { ...prev };
        list.forEach((r) => {
          if (next[r.id] === undefined) next[r.id] = String(r.creator_requested_percent ?? '');
        });
        return next;
      });
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (requestId: string) => {
    if (!user?.id) return;
    const raw = offeredPercents[requestId] ?? '';
    const num = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    setActingId(requestId);
    try {
      await AffiliateService.hostRespondToLinkRequest(requestId, user.id, num, true);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id) return;
    setActingId(requestId);
    try {
      await AffiliateService.hostRespondToLinkRequest(requestId, user.id, 0, false);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  if (profile?.role !== 'host') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('affiliate.richiesteLink')}</Text>
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
          {t('affiliate.richiesteLink')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {requests.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondary }]}>{t('affiliate.nessunaRichiesta')}</Text>
          ) : (
            requests.map((r) => {
              const creatorName = r.creator?.full_name || r.creator?.username || t('common.user');
              const isActing = actingId === r.id;
              return (
                <View
                  key={r.id}
                  style={[styles.card, { backgroundColor: isDark ? theme.colors.dark.card : theme.colors.light.card }]}
                >
                  <View style={styles.cardRow}>
                    <Avatar uri={r.creator?.avatar_url} size={48} />
                    <View style={styles.cardInfo}>
                      <Text style={[styles.creatorName, { color: textColor }]} numberOfLines={1}>
                        {creatorName}
                      </Text>
                      <Text style={[styles.percentHint, { color: secondary }]}>
                        {t('affiliate.percentPlaceholder')}: {r.creator_requested_percent}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.percentLabel, { color: secondary }]}>{t('affiliate.percentOfferta')}</Text>
                  <TextInput
                    style={[styles.percentInput, { color: textColor, borderColor: secondary }]}
                    placeholder="0–100"
                    placeholderTextColor={secondary}
                    keyboardType="number-pad"
                    value={offeredPercents[r.id] ?? ''}
                    onChangeText={(val) => setOfferedPercents((prev) => ({ ...prev, [r.id]: val }))}
                  />
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(r.id)}
                      disabled={isActing}
                    >
                      <Text style={styles.rejectBtnText}>{t('affiliate.rifiuta')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.primary.blue }]}
                      onPress={() => handleApprove(r.id)}
                      disabled={isActing}
                    >
                      {isActing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.approveBtnText}>{t('affiliate.approva')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.screenPadding, paddingBottom: theme.spacing.xl * 2 },
  emptyText: { ...theme.typography.body },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  cardInfo: { marginLeft: theme.spacing.md, flex: 1 },
  creatorName: { ...theme.typography.headline, fontWeight: '600' },
  percentHint: { ...theme.typography.caption1, marginTop: 2 },
  percentLabel: { ...theme.typography.caption1, marginBottom: theme.spacing.xs },
  percentInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    marginBottom: theme.spacing.md,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.md, justifyContent: 'flex-end' },
  actionBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.error },
  rejectBtnText: { ...theme.typography.body, color: theme.colors.error, fontWeight: '600' },
  approveBtnText: { ...theme.typography.body, color: '#fff', fontWeight: '600' },
});
