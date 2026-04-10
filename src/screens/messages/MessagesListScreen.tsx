/**
 * Messages List Screen
 * Lista conversazioni (ultimo messaggio, non letti)
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

import { Avatar } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { MessagesService, type ConversationPreview } from '../../services/messages.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { ProfileScreenProps } from '../../types/navigation';

export default function MessagesListScreen({
  navigation,
}: ProfileScreenProps<'MessagesList'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const data = await MessagesService.getConversations(user.id);
      setConversations(data);
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

  const openConversation = (c: ConversationPreview) => {
    navigation.navigate('Conversation', {
      recipientId: c.otherUserId,
      recipientName: c.otherUserName || 'Utente',
    });
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Messaggi</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewConversation')}>
          <Ionicons name="create-outline" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.otherUserId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.blue} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={secondary} />
            <Text style={[styles.emptyText, { color: secondary }]}>Nessuna conversazione</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            onPress={() => openConversation(item)}
            activeOpacity={0.7}
          >
            <Avatar uri={item.otherUserAvatar} size={52} />
            <View style={styles.body}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
                  {item.otherUserName || 'Utente'}
                </Text>
                {item.lastMessageAt && (
                  <Text style={[styles.time, { color: secondary }]}>
                    {formatRelativeTime(item.lastMessageAt)}
                  </Text>
                )}
              </View>
              {item.lastMessage && (
                <Text style={[styles.preview, { color: secondary }]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              )}
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={secondary} />
          </TouchableOpacity>
        )}
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
  headerRight: { width: 24 },
  list: { paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: theme.spacing['3xl'] },
  emptyText: { ...theme.typography.body, marginTop: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, marginLeft: theme.spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...theme.typography.headline, fontWeight: '600' },
  time: { ...theme.typography.caption2 },
  preview: { ...theme.typography.footnote, marginTop: 2 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
