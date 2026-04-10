/**
 * Support Conversation Screen
 * Visualizza la conversazione con l'assistenza; se non c'è ticket mostra CTA per creare richiesta
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { formatRelativeTime } from '../../utils/formatters';
import {
  SupportService,
  type SupportTicketWithDetails,
  type SupportTicketMessage,
} from '../../services/support.service';
import type { ProfileScreenProps } from '../../types/navigation';

export default function SupportConversationScreen({
  navigation,
  route,
}: ProfileScreenProps<'SupportConversation'>) {
  const ticketIdParam = route.params?.ticketId;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [ticket, setTicket] = useState<SupportTicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const loadTicket = useCallback(async () => {
    if (!user?.id) return;
    try {
      const tickets = await SupportService.getMyTickets(user.id);
      const id = ticketIdParam ?? tickets[0]?.id;
      if (!id) {
        setTicket(null);
        return;
      }
      const detail = await SupportService.getTicketWithDetails(id);
      setTicket(detail);
      if (detail) {
        await SupportService.markTicketAsReadByUser(id, user.id);
        await SupportService.markSupportNotificationsReadForTicket(user.id, id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, ticketIdParam]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useFocusEffect(
    useCallback(() => {
      loadTicket();
    }, [loadTicket])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTicket();
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !ticket || !user?.id) return;
    setSending(true);
    try {
      await SupportService.addUserMessage(ticket.id, user.id, text);
      setReplyText('');
      await loadTicket();
    } catch (e) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('support.conversation')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('support.requestSupport')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color={secondary} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>{t('support.noTicket')}</Text>
          <Text style={[styles.emptySubtitle, { color: secondary }]}>{t('support.noTicketSubtitle')}</Text>
          <Button
            onPress={() => navigation.navigate('RequestSupport')}
            size="lg"
            style={styles.emptyBtn}
          >
            {t('support.newRequest')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const renderMessage = ({ item }: { item: SupportTicketMessage }) => {
    const isUser = item.sender_type === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAdmin]}>
        <View
          style={[
            styles.msgBubble,
            {
              backgroundColor: isUser ? theme.colors.primary.blue : cardBg,
              alignSelf: isUser ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <Text style={[styles.msgText, { color: isUser ? '#fff' : textColor }]}>{item.body}</Text>
          <Text style={[styles.msgTime, { color: isUser ? 'rgba(255,255,255,0.8)' : secondary }]}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('support.conversation')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.ticketInfo}>
        <Text style={[styles.ticketMeta, { color: secondary }]}>
          {t('support.device')}: {ticket.device || '-'} · {t('support.type')}: {ticket.request_type}
        </Text>
        {ticket.attachments.length > 0 && (
          <View style={styles.attachmentsRow}>
            {ticket.attachments.map((att, i) => (
              <TouchableOpacity
                key={att.id}
                onPress={() => {}}
                style={styles.thumbWrap}
              >
                <Image source={{ uri: att.file_url }} style={styles.thumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={ticket.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.blue} />
        }
      />

      <View style={[styles.inputRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
          placeholder={t('support.replyPlaceholder')}
          placeholderTextColor={secondary}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: replyText.trim() ? theme.colors.primary.blue : cardBg }]}
          onPress={handleSendReply}
          disabled={!replyText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={22} color={replyText.trim() ? '#fff' : secondary} />
          )}
        </TouchableOpacity>
      </View>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyTitle: { ...theme.typography.title2, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { ...theme.typography.body, marginTop: 8, textAlign: 'center' },
  emptyBtn: { marginTop: 24 },
  ticketInfo: { paddingHorizontal: theme.spacing.screenPadding, paddingBottom: 8 },
  ticketMeta: { ...theme.typography.caption1 },
  attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumbWrap: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  listContent: { padding: theme.spacing.screenPadding, paddingBottom: 16 },
  msgRow: { marginBottom: 12 },
  msgRowUser: { alignItems: 'flex-end' },
  msgRowAdmin: { alignItems: 'flex-start' },
  msgBubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  msgText: { ...theme.typography.body },
  msgTime: { ...theme.typography.caption1, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.screenPadding,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    ...theme.typography.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
