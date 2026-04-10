/**
 * Authentication Service
 * Handles all auth operations with Supabase
 */

import { supabase } from './supabase';
import type { UserProfile } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  /** Site URL per link conferma email (deve essere in Redirect URLs in Supabase Auth) */
  static readonly EMAIL_REDIRECT_URL = 'https://nomadiqe.app/';

  static async signUp(data: SignUpData) {
    const { error: signUpError, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          username: data.username,
        },
        emailRedirectTo: AuthService.EMAIL_REDIRECT_URL,
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No user returned');

    // Il profilo viene creato dal trigger DB (on_auth_user_created) su auth.users.
    // Se il trigger non è stato ancora applicato, ensureProfile() creerà il profilo al primo accesso.
    // Per ricevere l'email di conferma: configura SMTP custom in Supabase (vedi docs/SUPABASE_RESEND_SMTP.md).
    return authData;
  }

  /**
   * Invia di nuovo l'email di conferma (utile se non è arrivata).
   * Richiede che in Supabase sia attivo l'invio email (SMTP custom o default).
   */
  static async resendVerificationEmail(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData) {
    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return authData;
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Get current user profile
   */
  static async getCurrentProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'nomadiqe://reset-password',
    });

    if (error) throw error;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  /**
   * Sign in with Google (OAuth)
   */
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'nomadiqe://auth/callback',
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update profile
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload avatar: uploads image to storage then updates profile.avatar_url
   */
  static async uploadAvatar(userId: string, imageUri: string, base64?: string | null): Promise<string> {
    const BUCKET = 'avatars';
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    let body: Blob | ArrayBuffer;
    if (base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      body = bytes.buffer;
    } else {
      const response = await fetch(imageUri);
      body = await response.blob();
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    const publicUrl = urlData?.publicUrl ?? '';

    await this.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  }
}

export default AuthService;
