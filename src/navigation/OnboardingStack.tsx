/**
 * Onboarding Stack Navigation
 * Stack per onboarding e selezione ruolo
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types/navigation';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import RoleSelectionScreen from '../screens/onboarding/RoleSelectionScreen';
import JollySubcategoryScreen from '../screens/onboarding/JollySubcategoryScreen';
import ProfileCompletionScreen from '../screens/onboarding/ProfileCompletionScreen';
import HostPropertyTypeSelectionScreen from '../screens/onboarding/HostPropertyTypeSelectionScreen';
import HostPropertyBasicInfoScreen from '../screens/onboarding/HostPropertyBasicInfoScreen';
import HostPropertyAmenitiesScreen from '../screens/onboarding/HostPropertyAmenitiesScreen';
import HostPropertyPhotosScreen from '../screens/onboarding/HostPropertyPhotosScreen';
import HostCollaborationSettingsScreen from '../screens/onboarding/HostCollaborationSettingsScreen';
import HostKolbedProgramScreen from '../screens/onboarding/HostKolbedProgramScreen';
import HostBasePriceScreen from '../screens/onboarding/HostBasePriceScreen';
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
      <Stack.Screen name="JollySubcategory" component={JollySubcategoryScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
      <Stack.Screen name="HostPropertyTypeSelection" component={HostPropertyTypeSelectionScreen} />
      <Stack.Screen name="HostPropertyBasicInfo" component={HostPropertyBasicInfoScreen} />
      <Stack.Screen name="HostPropertyAmenities" component={HostPropertyAmenitiesScreen} />
      <Stack.Screen name="HostPropertyPhotos" component={HostPropertyPhotosScreen} />
      <Stack.Screen name="HostCollaborationSettings" component={HostCollaborationSettingsScreen} />
      <Stack.Screen name="HostKolbedProgram" component={HostKolbedProgramScreen} />
      <Stack.Screen name="HostBasePrice" component={HostBasePriceScreen} />
      <Stack.Screen name="HostOnboarding" component={HostOnboardingScreen} />
      <Stack.Screen name="CreatorOnboarding" component={CreatorOnboardingScreen} />
      <Stack.Screen name="JollyOnboarding" component={JollyOnboardingScreen} />
    </Stack.Navigator>
  );
}
