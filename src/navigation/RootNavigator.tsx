/**
 * Root Navigator
 * Navigazione principale dell'app con gestione Auth/Onboarding/Main
 * e deep link struttura (nomadiqe://property/ID) per ospiti non loggati.
 * Deep link affiliato: nomadiqe://r/TOKEN → registra apertura e notifica host+creator.
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../constants/config';
import { AffiliateService } from '../services/affiliate.service';

// Import navigators
import { AuthStack } from './AuthStack';
import { GuestStack } from './GuestStack';
import { OnboardingStack } from './OnboardingStack';
import { MainTabs } from './MainTabs';

import CreatePostScreen from '../screens/home/CreatePostScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const scheme = config.app.shareScheme || 'nomadiqe';

function parsePropertyIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  const prefix = `${scheme}://property/`;
  if (url.startsWith(prefix)) {
    const id = url.slice(prefix.length).split('?')[0].split('#')[0].trim();
    return id || null;
  }
  return null;
}

/** Estrae token link affiliato da URL (nomadiqe://r/TOKEN o https://.../r/TOKEN). */
function parseAffiliateTokenFromUrl(url: string | null): string | null {
  if (!url) return null;
  const prefix1 = `${scheme}://r/`;
  const prefix2 = '/r/';
  if (url.startsWith(prefix1)) {
    const token = url.slice(prefix1.length).split('?')[0].split('#')[0].trim();
    return token || null;
  }
  try {
    const idx = url.indexOf(prefix2);
    if (idx !== -1) {
      const token = url.slice(idx + prefix2.length).split('?')[0].split('#')[0].trim();
      return token || null;
    }
  } catch (_) {}
  return null;
}

async function handleAffiliateLinkOpen(token: string): Promise<void> {
  const link = await AffiliateService.getLinkByToken(token);
  if (link) await AffiliateService.recordLinkOpen(link.id);
}

export function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const [initialGuestPropertyId, setInitialGuestPropertyId] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const id = parsePropertyIdFromUrl(url);
      if (id) setInitialGuestPropertyId(id);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const processUrl = (url: string | null) => {
      const token = parseAffiliateTokenFromUrl(url);
      if (token) handleAffiliateLinkOpen(token).catch(() => {});
    };
    Linking.getInitialURL().then(processUrl);
    const sub = Linking.addEventListener('url', (e) => processUrl(e?.url ?? null));
    return () => sub.remove();
  }, [user?.id]);

  const isLoading = Boolean(loading);
  const onboardingCompleted =
    profile?.onboarding_completed === true ||
    String(profile?.onboarding_completed).toLowerCase() === 'true';

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <Image
          source={require('../../assets/icon.png')}
          style={loadingStyles.logo}
          resizeMode="contain"
        />
        <Text style={loadingStyles.title}>Nomadiqe</Text>
      </View>
    );
  }

  const screenOptions = { headerShown: false as const };
  const showGuestFlow = !user && initialGuestPropertyId;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          showGuestFlow ? (
            <Stack.Screen
              name="GuestStack"
              component={GuestStack}
              initialParams={{ propertyId: initialGuestPropertyId }}
            />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )
        ) : !onboardingCompleted ? (
          // Authenticated but not onboarded - Show Onboarding
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : (
          // Authenticated and onboarded - Show Main app
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            {/* Modal screens */}
            <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
});
