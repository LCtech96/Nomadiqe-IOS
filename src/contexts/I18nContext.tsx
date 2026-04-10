/**
 * i18n Context
 * Gestisce la lingua dell'app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type Language } from '../constants/translations';

interface I18nContextType {
  locale: Language;
  setLocale: (locale: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const LOCALE_STORAGE_KEY = '@nomadiqe/locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Language>('en');

  // Load locale from storage or system
  useEffect(() => {
    loadLocale();
  }, []);

  const SUPPORTED_LOCALES: Language[] = ['it', 'en', 'ru', 'zh', 'fr', 'ur', 'bn', 'de', 'fa', 'ar', 'es'];

  const loadLocale = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as Language)) {
        setLocaleState(savedLocale as Language);
        i18n.locale = savedLocale;
      } else {
        const systemLocale = Localization.getLocales()[0]?.languageCode || 'en';
        const supportedLocale: Language = SUPPORTED_LOCALES.includes(systemLocale as Language)
          ? (systemLocale as Language)
          : 'en';
        setLocaleState(supportedLocale);
        i18n.locale = supportedLocale;
      }
    } catch (error) {
      console.error('Error loading locale:', error);
    }
  };

  const setLocale = async (newLocale: Language) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setLocaleState(newLocale);
      i18n.locale = newLocale;
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  };

  const t = (key: string, params?: Record<string, any>) => {
    return i18n.t(key, params);
  };

  const value = {
    locale,
    setLocale,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
