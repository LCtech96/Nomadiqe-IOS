/**
 * Notifications Screen
 * Lista notifiche in-app, segna come letto
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { NotificationsService, type Notification } from '../../services/notifications.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { ProfileScreenProps } from '../../types/navigation';

export default function NotificationsScreen({
  navigation,
}: ProfileScreenProps<'Notifications'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const data = await NotificationsService.getNotifications(user.id);
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await NotificationsService.markAllAsRead(user.id);
      setList((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Notifiche</Text>
        {list.some((n) => !n.read) ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAll, { color: theme.colors.primary.blue }]}>Segna tutte lette</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.blue} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={secondary} />
            <Text style={[styles.emptyText, { color: secondary }]}>Nessuna notifica</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCollabRequest = item.type === 'collaboration_request';
          const isAffiliateRequest = item.type === 'affiliate_link_request';
          const isAffiliateCreated = item.type === 'affiliate_link_created';
          const iconName: keyof typeof Ionicons.glyphMap =
            item.type === 'like' ? 'heart'
            : item.type === 'comment' ? 'chatbubble'
            : isCollabRequest ? 'person-add'
            : isAffiliateRequest || isAffiliateCreated ? 'link'
            : 'notifications';
          const canNavigate = (isCollabRequest && item.related_id) || isAffiliateRequest;
          return (
            <TouchableOpacity
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={async () => {
                try {
                  await NotificationsService.markAsRead(item.id);
                  setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
                } catch (_) {}
                if (isCollabRequest && item.related_id) {
                  (navigation as { navigate: (a: string, b?: { userId?: string }) => void }).navigate('ViewUserProfile', { userId: item.related_id });
                } else if (isAffiliateRequest) {
                  navigation.navigate('AffiliateLinkRequests');
                }
              }}
              activeOpacity={canNavigate ? 0.7 : 1}
              disabled={!canNavigate}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={iconName} size={22} color={theme.colors.primary.blue} />
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
                {item.message ? (
                  <Text style={[styles.message, { color: secondary }]} numberOfLines={2}>{item.message}</Text>
                ) : null}
                <Text style={[styles.time, { color: secondary }]}>{formatRelativeTime(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  headerRight: { width: 80 },
  markAll: { ...theme.typography.footnote, fontWeight: '600' },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: theme.spacing['3xl'] },
  emptyText: { ...theme.typography.body, marginTop: theme.spacing.md },
  row: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    marginBottom: theme.spacing.xs,
  },
  rowUnread: { backgroundColor: 'rgba(79, 70, 229, 0.08)' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(79, 70, 229, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.sm },
  body: { flex: 1 },
  title: { ...theme.typography.headline, fontWeight: '600' },
  message: { ...theme.typography.footnote, marginTop: 2 },
  time: { ...theme.typography.caption2, marginTop: 4 },
});
