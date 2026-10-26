/**
 * Profiles Service
 * Fetch profiles by role, ensure profile exists (per follow, FCM, ecc.)
 */

import { supabase } from './supabase';
import { containsLink } from '../utils/bio';
import { prepareJpegUploadBody } from '../utils/imageUpload';
import type { UserProfile } from '../types';
import type { UserRole } from '../types/user';

export class ProfilesService {
  /**
   * Assicura che esista una riga in profiles per userId.
   * Se non esiste, crea un profilo con id, email, full_name (opzionale).
   * Da chiamare prima di follow, notifiche, ecc. quando l'utente potrebbe essere appena registrato da altro flusso.
   */
  static async ensureProfile(
    userId: string,
    email: string,
    fullName?: string | null,
    username?: string | null
  ): Promise<UserProfile> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user || authData.user.id !== userId) {
      throw new Error('Session invalid. Please sign in again.');
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existing) return existing as UserProfile;

    const resolvedEmail = email || authData.user.email || '';
    const resolvedName =
      fullName ?? (authData.user.user_metadata?.full_name as string | undefined) ?? null;
    const resolvedUsername =
      username ?? (authData.user.user_metadata?.username as string | undefined) ?? null;

    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: resolvedEmail,
        full_name: resolvedName,
        username: resolvedUsername,
      })
      .select()
      .maybeSingle();

    if (error) {
      // Stale session: auth user no longer exists in users/profiles FK chain.
      if (error.code === '23503') {
        throw new Error('Session invalid. Please sign in again.');
      }
      // Profile may have been created by DB trigger between select and insert.
      if (error.code === '23505') {
        const { data: raced } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (raced) return raced as UserProfile;
      }
      throw error;
    }
    if (!created) {
      const { data: raced } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (raced) return raced as UserProfile;
      throw new Error('Could not create profile.');
    }
    return created as UserProfile;
  }

  /**
   * Get profiles by IDs (per KOL&BED: host da mostrare a creator approvati)
   */
  static async getProfilesByIds(ids: string[]): Promise<UserProfile[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data as UserProfile[]) || [];
  }

  /**
   * Get profiles by roles (for KOL&BED: host sees creator+jolly, creator sees host+jolly, jolly sees host+creator)
   */
  static async getProfilesByRoles(roles: UserRole[]): Promise<UserProfile[]> {
    const valid = roles.filter((r): r is NonNullable<UserRole> => r != null);
    if (valid.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', valid)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data as UserProfile[]) || [];
  }

  /**
   * Get creator niches by user IDs (for KOL&BED card chips)
   */
  static async getCreatorNichesByUserIds(userIds: string[]): Promise<Record<string, string[]>> {
    if (userIds.length === 0) return {};
    const { data, error } = await supabase
      .from('creator_niches')
      .select('user_id, niche')
      .in('user_id', userIds);
    if (error) throw error;
    const map: Record<string, string[]> = {};
    for (const row of (data || []) as { user_id: string; niche: string }[]) {
      if (!map[row.user_id]) map[row.user_id] = [];
      map[row.user_id].push(row.niche);
    }
    return map;
  }

  /**
   * Segui un utente (insert in follows)
   */
  static async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) return;
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })
      .select()
      .single();
    if (error) throw error;
  }

  /**
   * Smetti di seguire
   */
  static async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
  }

  /**
   * Verifica se currentUser segue targetUser
   */
  static async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  /**
   * Lista ID seguiti da userId (per badge o conteggi)
   */
  static async getFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (error) throw error;
    return (data || []).map((r) => r.following_id);
  }

  /**
   * Lista ID follower di userId
   */
  static async getFollowerIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);
    if (error) throw error;
    return (data || []).map((r) => r.follower_id);
  }

  /**
   * Restituisce gli id profilo per le email date (es. admin)
   */
  static async getProfileIdsByEmails(emails: string[]): Promise<string[]> {
    if (emails.length === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .in('email', emails.map((e) => e.toLowerCase().trim()));
    if (error) throw error;
    return (data || []).map((r) => r.id);
  }

  /**
   * Profili con bio non approvata per link (bio_links_approved = false, bio presente). Filtro link in app con containsLink.
   */
  static async getProfilesPendingBioLinkApproval(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('bio_links_approved', false)
      .not('bio', 'is', null);

    if (error) throw error;
    const list = (data || []) as UserProfile[];
    return list.filter((p) => containsLink(p.bio));
  }

  /**
   * Approva i link nella bio di un profilo (admin)
   */
  static async approveBioLinks(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ bio_links_approved: true })
      .eq('id', profileId);

    if (error) throw error;
  }

  /**
   * Check if username is available (case-insensitive).
   */
  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const normalized = username.trim().toLowerCase();
    if (!normalized) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalized)
      .maybeSingle();
    if (error) throw error;
    if (!data) return true;
    return excludeUserId != null && data.id === excludeUserId;
  }

  private static isRemoteImageUri(uri: string): boolean {
    return uri.startsWith('http://') || uri.startsWith('https://');
  }

  /**
   * Upload a single creator aesthetic/gallery image to storage.
   */
  static async uploadCreatorCoverImage(userId: string, imageUri: string): Promise<string> {
    const BUCKET = 'avatars';
    const path = `${userId}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const body = await prepareJpegUploadBody(imageUri);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    return urlData?.publicUrl ?? '';
  }

  /**
   * Upload local gallery URIs and return public URLs (remote URIs are kept as-is).
   */
  static async uploadCreatorCoverImages(userId: string, imageUris: string[]): Promise<string[]> {
    const urls = await Promise.all(
      imageUris.map((uri) =>
        ProfilesService.isRemoteImageUri(uri)
          ? uri
          : ProfilesService.uploadCreatorCoverImage(userId, uri)
      )
    );
    return urls.filter(Boolean);
  }

  /**
   * Invio richiesta creator: categoria, preferenze strutture, link social. Imposta creator_status = pending e completa onboarding.
   */
  static async submitCreatorApplication(
    userId: string,
    data: {
      creator_category: 'micro_influencer' | 'influencer' | 'ugc_creator';
      creator_structure_preferences: string[];
      social_links: Record<string, string | null>;
      date_of_birth?: string | null;
      location?: string | null;
      profile_cover_images?: string[] | null;
    }
  ): Promise<UserProfile> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user || authData.user.id !== userId) {
      throw new Error('Session invalid. Please sign in again.');
    }

    await ProfilesService.ensureProfile(
      userId,
      authData.user.email ?? '',
      authData.user.user_metadata?.full_name as string | undefined,
      authData.user.user_metadata?.username as string | undefined
    );

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        creator_category: data.creator_category,
        creator_structure_preferences: data.creator_structure_preferences,
        social_links: data.social_links,
        ...(data.date_of_birth != null ? { date_of_birth: data.date_of_birth } : {}),
        ...(data.location != null ? { location: data.location } : {}),
        ...(data.profile_cover_images != null
          ? { profile_cover_images: data.profile_cover_images }
          : {}),
        creator_status: 'pending',
        onboarding_completed: true,
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      throw new Error('Profile not found. Please sign out and sign in again.');
    }
    return updated as UserProfile;
  }

  /**
   * Lista profili creator con richiesta (per admin): tutti quelli con role=creator e con dati creator compilati.
   */
  static async getCreatorApplicationsForAdmin(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .eq('creator_status', 'pending')
      .not('creator_category', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  }

  /**
   * Admin: approva o rifiuta un creator e imposta le opportunità (tipi strutture che potrà vedere in KOL&BED).
   * Uses SECURITY DEFINER RPC — direct profile updates are blocked by RLS for non-owners.
   */
  static async setCreatorApproval(
    profileId: string,
    status: 'approved' | 'rejected',
    admin_approved_opportunities: string[] = []
  ): Promise<void> {
    const { error } = await supabase.rpc('set_creator_approval', {
      p_profile_id: profileId,
      p_status: status,
      p_admin_approved_opportunities:
        status === 'approved' ? admin_approved_opportunities : [],
    });

    if (error) throw error;
  }

  /**
   * Host applications awaiting admin review.
   */
  static async getHostApplicationsForAdmin(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'host')
      .eq('host_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  }

  /**
   * Admin: approve or reject a host application.
   */
  static async setHostApproval(
    profileId: string,
    status: 'approved' | 'rejected'
  ): Promise<void> {
    const { error } = await supabase.rpc('set_host_approval', {
      p_profile_id: profileId,
      p_status: status,
      p_activate_properties: status === 'approved',
    });

    if (error) throw error;
  }
}
