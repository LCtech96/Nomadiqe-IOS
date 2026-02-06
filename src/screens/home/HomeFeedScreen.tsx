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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, Avatar, Badge, Separator } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { PostsService } from '../../services/posts.service';
import { formatRelativeTime } from '../../utils/formatters';
import type { HomeScreenProps } from '../../types/navigation';
import type { Post } from '../../types';

export default function HomeFeedScreen({ navigation }: HomeScreenProps<'HomeFeed'>) {
  const { isDark } = useTheme();
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
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem post={item} />}
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

function PostItem({ post }: { post: Post }) {
  const { isDark } = useTheme();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  const handleLike = async () => {
    // Toggle optimistic
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    // TODO: Call API
  };

  return (
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
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: textColor }]}>{post.content}</Text>

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

        <TouchableOpacity style={styles.actionButton}>
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
