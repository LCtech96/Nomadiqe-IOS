/**
 * Root Navigator
 * Navigazione principale dell'app con gestione Auth/Onboarding/Main
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Import navigators
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { MainTabs } from './MainTabs';

// Placeholder modal screens
import { View as RNView, Text } from 'react-native';

const CreatePostScreen = () => (
  <RNView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Create Post Modal</Text>
  </RNView>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, profile, loading } = useAuth();

  const isLoading = Boolean(loading);
  const onboardingCompleted =
    profile?.onboarding_completed === true ||
    String(profile?.onboarding_completed).toLowerCase() === 'true';

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const screenOptions = { headerShown: false as const };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // Not authenticated - Show Auth flow
          <Stack.Screen name="Auth" component={AuthStack} />
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
