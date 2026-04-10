/**
 * Post Detail Screen
 * Immagini (carousel se più di una), testo, mi piace e commenti.
 * Swipe da sinistra a destra (iOS) o indietro: torna alla schermata precedente (gesture stack).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Badge } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PostsService } from '../../services/posts.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { Post, PostMedia, PostComment } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = theme.spacing.screenPadding;
const CAROUSEL_WIDTH = SCREEN_WIDTH - H_PAD * 2;

function parseMedia(media: Post['media'] | string | null | undefined): PostMedia[] {
  if (!media) return [];
  if (Array.isArray(media)) return media.filter((m) => m?.url);
  if (typeof media === 'string') {
    try {
      const arr = JSON.parse(media) as PostMedia[];
      return Array.isArray(arr) ? arr.filter((m) => m?.url) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function imageUrlsFromMedia(media: PostMedia[]): string[] {
  return media.filter((m) => m.type === 'image' && m.url).map((m) => m.url);
}

type PostDetailParams = { postId: string };

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ PostDetail: PostDetailParams }, 'PostDetail'>>();
  const { postId } = route.params;
  const { isDark } = useTheme();
  const { user, profile } = useAuth();
  const { t } = useI18n();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const inputBg = isDark ? theme.colors.dark.secondaryBackground : theme.colors.light.secondaryBackground;

  const loadAll = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        PostsService.getPostById(postId),
        PostsService.getPostComments(postId),
      ]);
      setPost(p);
      setComments(c);
      setLikesCount(p.likes_count ?? 0);
      if (user?.id) {
        const isLiked = await PostsService.hasUserLikedPost(postId, user.id);
        setLiked(isLiked);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), 'Impossibile caricare il post.');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, user?.id, navigation, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleLike = async () => {
    if (!user?.id || !post) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((n) => (next ? n + 1 : Math.max(0, n - 1)));
    try {
      if (next) await PostsService.likePost(post.id, user.id);
      else await PostsService.unlikePost(post.id, user.id);
    } catch {
      setLiked(!next);
      setLikesCount((n) => (!next ? n + 1 : Math.max(0, n - 1)));
    }
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
      await loadAll();
      Alert.alert(
        t('common.success'),
        'Il tuo commento è in attesa di approvazione da parte dell\'admin.'
      );
    } catch (e) {
      console.error(e);
      setInputText(text);
      Alert.alert(t('common.error'), 'Impossibile inviare il commento.');
    } finally {
      setSending(false);
    }
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.max(0, Math.round(x / CAROUSEL_WIDTH));
    setCarouselIndex(idx);
  };

  if (loading || !post) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  const mediaList = parseMedia(post.media);
  const images = imageUrlsFromMedia(mediaList);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {t('profile.posts')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.blue} />
          }
        >
          {/* Autore */}
          <View style={styles.authorRow}>
            <Avatar uri={post.author?.avatar_url} size={44} verified={Boolean(post.author?.is_verified)} />
            <View style={styles.authorMeta}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: textColor }]}>
                  {post.author?.full_name || t('common.user')}
                </Text>
                {post.author?.role && (
                  <Badge variant="outline" style={styles.roleBadge}>
                    {post.author.role}
                  </Badge>
                )}
              </View>
              <Text style={[styles.timestamp, { color: secondary }]}>
                {formatRelativeTime(post.created_at)}
              </Text>
            </View>
          </View>

          {/* Carousel immagini */}
          {images.length > 0 ? (
            <View style={styles.carouselWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onMomentumScrollEnd={onCarouselScroll}
                nestedScrollEnabled
                style={{ width: CAROUSEL_WIDTH }}
              >
                {images.map((uri, idx) => (
                  <View key={`${uri}-${idx}`} style={{ width: CAROUSEL_WIDTH }}>
                    <Image
                      source={{ uri }}
                      style={styles.carouselImage}
                      contentFit="contain"
                      transition={200}
                    />
                  </View>
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        { backgroundColor: i === carouselIndex ? theme.colors.primary.blue : secondary, opacity: i === carouselIndex ? 1 : 0.35 },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <Text style={[styles.content, { color: textColor }]}>{post.content}</Text>

          {/* Azioni */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={!user}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? theme.colors.error : secondary}
              />
              <Text style={[styles.actionText, { color: secondary }]}>{likesCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={24} color={secondary} />
              <Text style={[styles.actionText, { color: secondary }]}>{post.comments_count}</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: textColor }]}>{t('posts.comments')}</Text>

          {comments.length === 0 ? (
            <Text style={[styles.emptyComments, { color: secondary }]}>
              {t('posts.noComments')}
            </Text>
          ) : (
            comments.map((item) => (
              <View key={item.id} style={styles.commentRow}>
                <Avatar uri={(item.user as { avatar_url?: string })?.avatar_url} size={36} />
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: textColor }]}>
                      {(item.user as { full_name?: string })?.full_name || 'Utente'}
                    </Text>
                    <Text style={[styles.commentTime, { color: secondary }]}>
                      {formatRelativeTime(item.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, { color: textColor }]}>{item.content}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {user ? (
          <View style={[styles.inputRow, { backgroundColor: bg, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <Avatar uri={profile?.avatar_url} size={36} />
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
              placeholder={t('posts.writeComment')}
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
              style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: H_PAD, paddingBottom: 24 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  authorMeta: { flex: 1, marginLeft: theme.spacing.md },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' },
  authorName: { ...theme.typography.headline, fontWeight: '600' },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2 },
  timestamp: { ...theme.typography.caption1, marginTop: 2 },
  carouselWrap: { marginBottom: theme.spacing.md },
  carouselImage: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_WIDTH * 0.85,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { ...theme.typography.body, marginBottom: theme.spacing.md },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { ...theme.typography.subheadline, fontWeight: '600' },
  sectionLabel: { ...theme.typography.headline, fontWeight: '700', marginBottom: theme.spacing.md },
  emptyComments: { ...theme.typography.body, marginBottom: theme.spacing.md },
  commentRow: { flexDirection: 'row', marginBottom: theme.spacing.md },
  commentBody: { flex: 1, marginLeft: theme.spacing.sm },
  commentHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  commentAuthor: { ...theme.typography.subheadline, fontWeight: '600' },
  commentTime: { ...theme.typography.caption1 },
  commentContent: { ...theme.typography.body },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: H_PAD,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.lg : H_PAD,
    gap: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
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
