/**
 * Posts Service
 * Handles post operations
 */

import { supabase } from './supabase';
import { awardPoints } from './points.service';
import type { Post, PostComment } from '../types';

export class PostsService {
  /**
   * Get feed posts (solo post approvati e pubblici: non include post solo profilo/private)
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
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { posts: data as Post[], total: count || 0 };
  }

  /**
   * Get posts by author (per pagina profilo: include tutti i post dell'autore visibili al chiamante)
   * RLS: l'autore vede tutti i propri post; gli altri solo public/followers
   */
  static async getPostsByAuthor(authorId: string, page: number = 0, pageSize: number = 20) {
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
      .eq('author_id', authorId)
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
   * Delete post (solo l'autore può eliminare)
   */
  static async deletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  }

  /**
   * Create post
   * @param visibility - 'public' (feed + profilo), 'private' (solo profilo autore, es. host da "+")
   */
  static async createPost(post: {
    author_id: string;
    content: string;
    media: any[];
    type: string;
    visibility?: 'public' | 'followers' | 'private';
  }) {
    const row = {
      ...post,
      visibility: post.visibility ?? 'public',
    };
    const { data, error } = await supabase
      .from('posts')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    try {
      await awardPoints(post.author_id, 'create_post');
    } catch (_) {}
    return data;
  }

  /**
   * Like post (assegna 1 pt all'utente, max 5/giorno)
   */
  static async likePost(postId: string, userId: string) {
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (likeError) throw likeError;

    const { error: rpcError } = await supabase.rpc('increment_post_likes', {
      post_id: postId,
    });
    if (rpcError) throw rpcError;

    try {
      await awardPoints(userId, 'like');
    } catch (_) {}
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
   * Get post comments (solo approvati, per il feed)
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
      .eq('approval_status', 'approved')
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
    const row = {
      ...comment,
      approval_status: 'pending' as const,
    };
    const { data, error } = await supabase
      .from('post_comments')
      .insert(row)
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
    try {
      await awardPoints(comment.user_id, 'comment');
    } catch (_) {}
    return data as PostComment;
  }

  /**
   * Get pending comments (admin RPC — bypasses RLS)
   */
  static async getPendingComments() {
    const { data, error } = await supabase.rpc('get_pending_post_comments');
    if (error) throw error;
    if (!data) return [];
    const list = Array.isArray(data) ? data : [];
    return list as PostComment[];
  }

  /**
   * Approva o rifiuta commento (admin RPC — bypasses RLS)
   */
  static async setCommentApprovalStatus(
    commentId: string,
    status: 'approved' | 'rejected'
  ) {
    const { error } = await supabase.rpc('set_post_comment_approval', {
      p_comment_id: commentId,
      p_status: status,
    });
    if (error) throw error;
  }

  /**
   * Get pending posts (admin RPC — bypasses RLS)
   */
  static async getPendingPosts() {
    const { data, error } = await supabase.rpc('get_pending_posts');
    if (error) throw error;
    if (!data) return [];
    const list = Array.isArray(data) ? data : [];
    return list as Post[];
  }

  /**
   * Update post approval status (admin RPC — bypasses RLS)
   */
  static async setApprovalStatus(
    postId: string,
    status: 'approved' | 'rejected'
  ) {
    const { error } = await supabase.rpc('set_post_approval', {
      p_post_id: postId,
      p_status: status,
    });
    if (error) throw error;
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
