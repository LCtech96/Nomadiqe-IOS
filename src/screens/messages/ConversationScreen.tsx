/**
 * Conversation Screen
 * Thread messaggi con un utente: lista, input, invio, segna come letto
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { MessagesService, type Message } from '../../services/messages.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { ProfileScreenProps } from '../../types/navigation';

export default function ConversationScreen({
  navigation,
  route,
}: ProfileScreenProps<'Conversation'>) {
  const { recipientId, recipientName } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const load = async () => {
    if (!user?.id) return;
    try {
      const data = await MessagesService.getMessages(user.id, recipientId);
      setMessages(data);
      await MessagesService.markAsRead(user.id, recipientId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, recipientId]);

  const send = async () => {
    const text = inputText.trim();
    if (!text || !user?.id || sending) return;
    setSending(true);
    setInputText('');
    try {
      const newMsg = await MessagesService.sendMessage(user.id, recipientId, text);
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error(e);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const bubbleOut = isDark ? '#2c2c2e' : theme.colors.primary.blue;
  const bubbleIn = isDark ? '#3a3a3c' : '#e5e5ea';

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {recipientName}
        </Text>
        <View style={styles.headerRight} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>Nessun messaggio. Invia un messaggio per iniziare.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
                <View style={[styles.bubble, { backgroundColor: isMe ? bubbleOut : bubbleIn }]}>
                  <Text style={[styles.bubbleText, { color: isMe ? '#fff' : textColor }]}>{item.content}</Text>
                  <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.7)' : secondary }]}>
                    {formatRelativeTime(item.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View style={[styles.inputRow, { backgroundColor: bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea', color: textColor }]}
            placeholder="Messaggio..."
            placeholderTextColor={secondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!inputText.trim() || sending}
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '600', flex: 1, textAlign: 'center' },
  headerRight: { width: 24 },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 16, flexGrow: 1 },
  empty: { paddingVertical: theme.spacing['2xl'], alignItems: 'center' },
  emptyText: { ...theme.typography.body },
  bubbleWrap: { marginBottom: theme.spacing.sm },
  bubbleWrapLeft: { alignItems: 'flex-start' },
  bubbleWrapRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { ...theme.typography.body },
  bubbleTime: { ...theme.typography.caption2, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.screenPadding + 8,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...theme.typography.body,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
