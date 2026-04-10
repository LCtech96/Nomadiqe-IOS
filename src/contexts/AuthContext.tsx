/**
 * Auth Context
 * Gestisce lo stato dell'autenticazione e il deep link di conferma email (access_token/refresh_token).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

/** Messaggi di errore Supabase che richiedono logout locale (token non più valido) */
const isInvalidRefreshTokenError = (err: unknown): boolean => {
  const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
  return /Invalid Refresh Token|Refresh Token Not Found|refresh_token/i.test(msg);
};

/** Se il refresh token non è più valido, cancella la sessione locale senza mostrare errore */
async function clearSessionIfInvalidToken(err: unknown): Promise<void> {
  if (!isInvalidRefreshTokenError(err)) return;
  try {
    await supabase.auth.signOut();
  } catch (_) {
    // ignore
  }
}
import { AuthService } from '../services/auth.service';
import { ProfilesService } from '../services/profiles.service';
import type { UserProfile } from '../types';

/** Estrae access_token e refresh_token dall'URL (hash o query) e imposta la sessione Supabase */
async function handleAuthUrl(url: string | null): Promise<boolean> {
  if (!url) return false;
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1] : '';
  const paramsStr = (hash || query).trim();
  if (!paramsStr) return false;
  const params: Record<string, string> = {};
  paramsStr.split('&').forEach((pair) => {
    const eq = pair.indexOf('=');
    if (eq === -1) return;
    const k = decodeURIComponent(pair.slice(0, eq).trim());
    const v = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' ')).trim();
    if (k) params[k] = v;
  });
  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (!access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return !error;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; fullName: string; username?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Per Supabase docs: gestire auto-refresh solo quando l'app è in foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user);
        } else {
          setLoading(false);
        }
      })
      .catch(async (err) => {
        if (isInvalidRefreshTokenError(err)) {
          await clearSessionIfInvalidToken(err);
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          console.warn('Auth getSession failed (Supabase may be unconfigured):', err?.message);
        }
        setLoading(false);
      });

    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
      subscription = sub;
    } catch (err) {
      console.warn('Auth onAuthStateChange failed:', err);
      setLoading(false);
    }

    return () => subscription?.unsubscribe?.();
  }, []);

  // Deep link: conferma email / magic link reindirizza qui con access_token e refresh_token
  useEffect(() => {
    const onUrl = async (event: { url: string }) => {
      if (event.url && (event.url.includes('access_token=') || event.url.includes('auth/callback'))) {
        await handleAuthUrl(event.url);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('access_token=') || url.includes('auth/callback'))) {
        handleAuthUrl(url);
      }
    });
    const sub = Linking.addEventListener('url', onUrl);
    return () => sub.remove();
  }, []);

  const loadProfile = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setLoading(false);
        return data as UserProfile;
      }
      // Profilo assente (es. trigger non applicato): crealo ora che l'utente è autenticato
      const created = await ProfilesService.ensureProfile(
        user.id,
        user.email ?? '',
        user.user_metadata?.full_name as string | undefined,
        user.user_metadata?.username as string | undefined
      );
      setProfile(created);
      return created;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await AuthService.signIn({ email, password });
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    username?: string;
  }) => {
    await AuthService.signUp(data);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setProfile(null);
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (user) {
      return loadProfile(user);
    }
    return null;
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
