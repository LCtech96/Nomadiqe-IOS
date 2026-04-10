/**
 * Invite Context
 * Gestisce il codice invito da deep link (nomadiqe://invite?code=xxx o nomadiqe.app/invite?code=xxx)
 * e lo espone a SignUp / Onboarding per pre-impostare il ruolo e fare claim dopo registrazione.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_KEY = 'pending_invite_code';

function getInviteCodeFromUrl(url: string): string | null {
  try {
    const parsed = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(parsed);
    return params.get('code')?.trim() || null;
  } catch {
    return null;
  }
}

interface InviteContextType {
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
  clearPendingInviteCode: () => Promise<void>;
}

const InviteContext = createContext<InviteContextType | undefined>(undefined);

export function InviteProvider({ children }: { children: React.ReactNode }) {
  const [pendingInviteCode, setPendingInviteCodeState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PENDING_INVITE_KEY).then((code) => {
      if (code) setPendingInviteCodeState(code);
    });
  }, []);

  const setPendingInviteCode = (code: string | null) => {
    setPendingInviteCodeState(code);
    if (code) AsyncStorage.setItem(PENDING_INVITE_KEY, code);
    else AsyncStorage.removeItem(PENDING_INVITE_KEY);
  };

  const clearPendingInviteCode = async () => {
    setPendingInviteCodeState(null);
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
  };

  useEffect(() => {
    const onUrl = (event: { url: string }) => {
      const url = event?.url || '';
      if (url.includes('invite') && url.includes('code=')) {
        const code = getInviteCodeFromUrl(url);
        if (code) setPendingInviteCode(code);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('invite') && url.includes('code=')) {
        const code = getInviteCodeFromUrl(url);
        if (code) setPendingInviteCode(code);
      }
    });
    const sub = Linking.addEventListener('url', onUrl);
    return () => sub.remove();
  }, []);

  const value = {
    pendingInviteCode,
    setPendingInviteCode,
    clearPendingInviteCode,
  };

  return (
    <InviteContext.Provider value={value}>{children}</InviteContext.Provider>
  );
}

export function useInvite() {
  const context = useContext(InviteContext);
  if (context === undefined) {
    throw new Error('useInvite must be used within an InviteProvider');
  }
  return context;
}
