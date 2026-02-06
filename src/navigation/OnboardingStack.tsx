/**
 * Onboarding Stack Navigation
 * Stack per onboarding e selezione ruolo
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types/navigation';

// Import screens (to be created)
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import RoleSelectionScreen from '../screens/onboarding/RoleSelectionScreen';
import HostOnboardingScreen from '../screens/onboarding/HostOnboardingScreen';
import CreatorOnboardingScreen from '../screens/onboarding/CreatorOnboardingScreen';
import JollyOnboardingScreen from '../screens/onboarding/JollyOnboardingScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="HostOnboarding" component={HostOnboardingScreen} />
      <Stack.Screen name="CreatorOnboarding" component={CreatorOnboardingScreen} />
      <Stack.Screen name="JollyOnboarding" component={JollyOnboardingScreen} />
    </Stack.Navigator>
  );
}
