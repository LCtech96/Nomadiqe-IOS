/**
 * Post Types - Nomadiqe Social Feed
 * Based on Supabase posts schema
 */

export type PostType = 'standard' | 'showcase' | 'collaboration';
export type PostApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PostMediaType = 'image' | 'video';

export interface PostMedia {
  type: PostMediaType;
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
}

export interface Post {
  id: string;
  author_id: string;
  
  // Content
  content: string;
  media: PostMedia[];
  type: PostType;
  
  // Property/Collaboration link
  property_id: string | null;
  collaboration_id: string | null;
  
  // Engagement
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  views_count: number;
  
  // Status
  approval_status: PostApprovalStatus;
  is_pinned: boolean;
  
  // Visibility
  visibility: 'public' | 'followers' | 'private';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations (populated)
  author?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    is_verified: boolean;
  };
  
  // User interaction state
  is_liked?: boolean;
  is_reposted?: boolean;
  is_bookmarked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  
  content: string;
  likes_count: number;
  replies_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  
  is_liked?: boolean;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostRepost {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}
