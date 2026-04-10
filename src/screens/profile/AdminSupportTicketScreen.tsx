/**
 * Admin Support Ticket Screen
 * Visualizza conversazione e permette di rispondere (notifica l'utente)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { formatRelativeTime } from '../../utils/formatters';
import {
  SupportService,
  type SupportTicketWithDetails,
  type SupportTicketMessage,
} from '../../services/support.service';
import type { ProfileScreenProps } from '../../types/navigation';

export default function AdminSupportTicketScreen({
  navigation,
  route,
}: ProfileScreenProps<'AdminSupportTicket'>) {
  const { ticketId } = route.params;
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [ticket, setTicket] = useState<SupportTicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!ticketId) return;
    try {
      const data = await SupportService.getTicketWithDetails(ticketId);
      setTicket(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !ticket || !profile?.id) return;
    setSending(true);
    try {
      await SupportService.addAdminReply(ticketId, profile.id, text);
      setReplyText('');
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('admin.supportTicket')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
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
              backgroundColor: isUser ? cardBg : theme.colors.primary.blue,
              alignSelf: isUser ? 'flex-start' : 'flex-end',
            },
          ]}
        >
          <Text style={[styles.msgLabel, { color: secondary }]}>
            {isUser ? t('support.user') : t('support.admin')}
          </Text>
          <Text style={[styles.msgText, { color: isUser ? textColor : '#fff' }]}>{item.body}</Text>
          <Text style={[styles.msgTime, { color: isUser ? secondary : 'rgba(255,255,255,0.8)' }]}>
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
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('admin.supportTicket')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.ticketInfo}>
        <Text style={[styles.ticketMeta, { color: secondary }]}>
          {t('support.device')}: {ticket.device || '-'} · {t('support.type')}: {ticket.request_type}
        </Text>
        <Text style={[styles.ticketMeta, { color: secondary }]}>
          User ID: {ticket.user_id}
        </Text>
        {ticket.attachments.length > 0 && (
          <View style={styles.attachmentsRow}>
            {ticket.attachments.map((att) => (
              <Image key={att.id} source={{ uri: att.file_url }} style={styles.thumb} resizeMode="cover" />
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={ticket.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={[styles.inputRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
      >
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
      </KeyboardAvoidingView>
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
  ticketInfo: { paddingHorizontal: theme.spacing.screenPadding, paddingBottom: 8 },
  ticketMeta: { ...theme.typography.caption1 },
  attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  listContent: { padding: theme.spacing.screenPadding, paddingBottom: 16 },
  msgRow: { marginBottom: 12 },
  msgRowUser: { alignItems: 'flex-start' },
  msgRowAdmin: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  msgLabel: { ...theme.typography.caption1, marginBottom: 2 },
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
