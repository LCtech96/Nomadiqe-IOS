/**
 * Comments Screen
 * Lista commenti approvati + input per inviare nuovo commento (in attesa di approvazione admin)
 */

import React, { useState, useEffect } from 'react';
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
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { PostsService } from '../../services/posts.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { HomeScreenProps } from '../../types/navigation';
import type { PostComment } from '../../types';

export default function CommentsScreen({
  navigation,
  route,
}: HomeScreenProps<'Comments'>) {
  const { postId } = route.params;
  const { isDark } = useTheme();
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    try {
      const data = await PostsService.getPostComments(postId);
      setComments(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Errore', 'Impossibile caricare i commenti.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadComments();
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user?.id) return;
    setSending(true);
    setInputText('');
    try {
      await PostsService.createComment({
        post_id: postId,
        user_id: user.id,
        content: text,
      });
      await loadComments();
      Alert.alert(
        'Commento inviato',
        'Il tuo commento è in attesa di approvazione da parte dell\'admin. Sarà visibile dopo la moderazione.'
      );
    } catch (e) {
      console.error(e);
      setInputText(text);
      Alert.alert('Errore', 'Impossibile inviare il commento. Riprova.');
    } finally {
      setSending(false);
    }
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const inputBg = isDark ? theme.colors.dark.secondaryBackground : theme.colors.light.secondaryBackground;

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
        <Text style={[styles.headerTitle, { color: textColor }]}>Commenti</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                Nessun commento ancora. Scrivi il primo!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Avatar
                uri={(item.user as { avatar_url?: string })?.avatar_url}
                size={36}
              />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentAuthor, { color: textColor }]}>
                    {(item.user as { full_name?: string })?.full_name || 'Utente'}
                  </Text>
                  <Text style={[styles.commentTime, { color: secondary }]}>
                    {formatRelativeTime(item.created_at)}
                  </Text>
                </View>
                <Text style={[styles.commentContent, { color: textColor }]}>
                  {item.content}
                </Text>
              </View>
            </View>
          )}
        />

        {user ? (
          <View style={[styles.inputRow, { backgroundColor: bg }]}>
            <Avatar
              uri={profile?.avatar_url}
              size={36}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
              placeholder="Scrivi un commento..."
              placeholderTextColor={secondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <Text style={[styles.loginHint, { color: secondary }]}>
              Accedi per commentare
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  headerRight: { width: 24 },
  keyboardView: { flex: 1 },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 16 },
  empty: { paddingVertical: theme.spacing['2xl'], alignItems: 'center' },
  emptyText: { ...theme.typography.body },
  commentRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  commentBody: { flex: 1, marginLeft: theme.spacing.sm },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  commentAuthor: { ...theme.typography.headline, fontWeight: '600', marginRight: 8 },
  commentTime: { ...theme.typography.caption1 },
  commentContent: { ...theme.typography.body },
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
  loginHint: { ...theme.typography.body, paddingVertical: 8 },
});
