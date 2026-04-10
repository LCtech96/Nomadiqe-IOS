/**
 * Home Feed Screen
 * Feed principale con post, like, commenti
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Card, Avatar, Badge, Separator } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { PostsService } from '../../services/posts.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { HomeScreenProps } from '../../types/navigation';
import type { Post, PostMedia } from '../../types';

/** Normalizza media da DB (può essere array o JSON string) e restituisce la prima immagine URL */
function getFirstImageUrl(media: Post['media'] | string | null | undefined): string | null {
  if (!media) return null;
  let arr: PostMedia[] | null = null;
  if (typeof media === 'string') {
    try {
      arr = JSON.parse(media) as PostMedia[];
    } catch {
      return null;
    }
  } else if (Array.isArray(media)) {
    arr = media;
  }
  const first = arr?.[0];
  return first && typeof first === 'object' && first.url ? first.url : null;
}

export default function HomeFeedScreen({ navigation }: HomeScreenProps<'HomeFeed'>) {
  const { isDark, setTheme } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { posts: newPosts } = await PostsService.getFeedPosts(0, 20);
      setPosts(newPosts);
      setPage(0);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Home</Text>
        <TouchableOpacity onPress={toggleTheme} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={textColor}
          />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            userId={user?.id ?? null}
            isOwnPost={user?.id === item.author_id}
            onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== item.id))}
            onPressPost={() => navigation.navigate('PostDetail', { postId: item.id })}
            onPressComments={() => navigation.navigate('PostDetail', { postId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function PostItem({
  post,
  userId,
  isOwnPost,
  onDeleted,
  onPressPost,
  onPressComments,
}: {
  post: Post;
  userId: string | null;
  isOwnPost: boolean;
  onDeleted: () => void;
  onPressPost: () => void;
  onPressComments: () => void;
}) {
  const { isDark } = useTheme();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [likedLoaded, setLikedLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carica se l'utente ha già messo like (cuore rosso e conteggio corretto)
  useEffect(() => {
    if (!userId) {
      setLikedLoaded(true);
      return;
    }
    let cancelled = false;
    PostsService.hasUserLikedPost(post.id, userId)
      .then((isLiked) => {
        if (!cancelled) {
          setLiked(isLiked);
          setLikedLoaded(true);
        }
      })
      .catch(() => setLikedLoaded(true));
    return () => { cancelled = true; };
  }, [post.id, userId]);

  const handleDelete = () => {
    Alert.alert(
      'Elimina post',
      'Vuoi eliminare questo post? L\'azione non si può annullare.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await PostsService.deletePost(post.id);
              onDeleted();
            } catch (e) {
              Alert.alert('Errore', 'Impossibile eliminare il post.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  const handleLike = async () => {
    if (!userId) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(nextLiked ? likesCount + 1 : likesCount - 1);
    try {
      if (nextLiked) {
        await PostsService.likePost(post.id, userId);
      } else {
        await PostsService.unlikePost(post.id, userId);
      }
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPressPost} style={styles.postCardWrap}>
    <Card style={styles.postCard}>
      {/* Author Header */}
      <View style={styles.postHeader}>
        <Avatar
          uri={post.author?.avatar_url}
          size={40}
          verified={Boolean(post.author?.is_verified)}
        />
        <View style={styles.authorInfo}>
          <View style={styles.authorNameRow}>
            <Text style={[styles.authorName, { color: textColor }]}>
              {post.author?.full_name || 'Unknown'}
            </Text>
            {post.author?.role && (
              <Badge variant="outline" style={styles.roleBadge}>
                {post.author.role}
              </Badge>
            )}
          </View>
          <Text style={[styles.timestamp, { color: secondaryColor }]}>
            {formatRelativeTime(post.created_at)}
          </Text>
        </View>
        {isOwnPost && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.deleteButton}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={secondaryColor} />
            ) : (
              <Ionicons
                name="trash-outline"
                size={22}
                color={secondaryColor}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: textColor }]}>{post.content}</Text>

      {/* Media */}
      {(() => {
        const imageUrl = getFirstImageUrl(post.media);
        return imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.mediaImage}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : null;
      })()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? theme.colors.error : secondaryColor}
          />
          <Text style={[styles.actionText, { color: secondaryColor }]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onPressComments}>
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={secondaryColor}
          />
          <Text style={[styles.actionText, { color: secondaryColor }]}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="share-outline"
            size={24}
            color={secondaryColor}
          />
        </TouchableOpacity>
      </View>
    </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
  },
  listContent: {
    padding: theme.spacing.screenPadding,
    gap: theme.spacing.md,
  },
  postCardWrap: {
    borderRadius: theme.borderRadius.lg,
  },
  postCard: {
    padding: theme.spacing.cardPadding,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  authorName: {
    ...theme.typography.headline,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timestamp: {
    ...theme.typography.caption1,
    marginTop: 2,
  },
  content: {
    ...theme.typography.body,
    marginBottom: theme.spacing.md,
  },
  mediaImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    ...theme.typography.subheadline,
    fontWeight: '600',
  },
});
