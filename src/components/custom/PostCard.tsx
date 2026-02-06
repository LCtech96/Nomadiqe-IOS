/**
 * Post Card Component
 * Card per visualizzare un post nel feed
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card, Avatar, Badge } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { formatRelativeTime } from '../../utils/formatters';
import { PostsService } from '../../services/posts.service';
import type { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({ post, onPress, onLike, onComment, onShare }: PostCardProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [liked, setLiked] = useState(Boolean(post.is_liked));
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  const handleLike = async () => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(newLiked ? likesCount + 1 : likesCount - 1);

    try {
      if (newLiked) {
        await PostsService.likePost(post.id, user.id);
      } else {
        await PostsService.unlikePost(post.id, user.id);
      }
      onLike?.(post.id);
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikesCount(newLiked ? likesCount - 1 : likesCount + 1);
      console.error('Error liking post:', error);
    }
  };

  return (
    <Card style={styles.card}>
      {/* Author Header */}
      <TouchableOpacity style={styles.header} onPress={onPress}>
        <Avatar
          uri={post.author?.avatar_url}
          size={44}
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
      </TouchableOpacity>

      {/* Content */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Text style={[styles.content, { color: textColor }]}>{post.content}</Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {post.media.map((media, index) => (
              <Image
                key={index}
                source={{ uri: media.url }}
                style={styles.mediaImage}
                contentFit="cover"
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? theme.colors.error : secondaryColor}
          />
          <Text style={[styles.actionText, { color: secondaryColor }]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment?.(post.id)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={secondaryColor}
          />
          <Text style={[styles.actionText, { color: secondaryColor }]}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare?.(post.id)}
        >
          <Ionicons name="share-outline" size={24} color={secondaryColor} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.cardPadding,
    marginBottom: theme.spacing.md,
  },
  header: {
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
  mediaContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.lg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xl,
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
