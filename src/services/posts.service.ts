/**
 * Posts Service
 * Handles post operations
 */

import { supabase } from './supabase';
import type { Post, PostComment } from '../types';

export class PostsService {
  /**
   * Get feed posts
   */
  static async getFeedPosts(page: number = 0, pageSize: number = 20) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          role,
          is_verified
        )
      `, { count: 'exact' })
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { posts: data as Post[], total: count || 0 };
  }

  /**
   * Get post by ID
   */
  static async getPostById(postId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          role,
          is_verified
        )
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data as Post;
  }

  /**
   * Create post
   */
  static async createPost(post: {
    author_id: string;
    content: string;
    media: any[];
    type: string;
  }) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Like post
   */
  static async likePost(postId: string, userId: string) {
    // Insert like
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (likeError) throw likeError;

    // Increment likes count
    const { error: rpcError } = await supabase.rpc('increment_post_likes', {
      post_id: postId,
    });

    if (rpcError) throw rpcError;
  }

  /**
   * Unlike post
   */
  static async unlikePost(postId: string, userId: string) {
    // Delete like
    const { error: unlikeError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (unlikeError) throw unlikeError;

    // Decrement likes count
    const { error: rpcError } = await supabase.rpc('decrement_post_likes', {
      post_id: postId,
    });

    if (rpcError) throw rpcError;
  }

  /**
   * Get post comments
   */
  static async getPostComments(postId: string) {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          is_verified
        )
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PostComment[];
  }

  /**
   * Create comment
   */
  static async createComment(comment: {
    post_id: string;
    user_id: string;
    content: string;
    parent_comment_id?: string;
  }) {
    const { data, error } = await supabase
      .from('post_comments')
      .insert(comment)
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          is_verified
        )
      `)
      .single();

    if (error) throw error;

    // Increment comments count
    await supabase.rpc('increment_post_comments', {
      post_id: comment.post_id,
    });

    return data as PostComment;
  }

  /**
   * Check if user liked post
   */
  static async hasUserLikedPost(postId: string, userId: string) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
}

export default PostsService;
