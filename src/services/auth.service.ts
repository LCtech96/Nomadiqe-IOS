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
  static async signUp(data: SignUpData) {
    const { error: signUpError, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          username: data.username,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No user returned');

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        username: data.username,
      });

    if (profileError) throw profileError;

    return authData;
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
}

export default AuthService;
