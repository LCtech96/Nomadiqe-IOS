/**
 * Host Dashboard Stack — bottom-tab dashboard + property management flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HostDashboardStackParamList } from '../types/navigation';

import HostDashboardScreen from '../screens/host/HostDashboardScreen';
import HostEditPropertyScreen from '../screens/host/HostEditPropertyScreen';
import HostStructureViewScreen from '../screens/host/HostStructureViewScreen';
import HostPropertyCalendarSyncScreen from '../screens/host/HostPropertyCalendarSyncScreen';
import HostStructureScreen from '../screens/host/HostStructureScreen';
import PropertyGuideScreen from '../screens/host/PropertyGuideScreen';
import PropertyGuideSectionScreen from '../screens/host/PropertyGuideSectionScreen';
import NewPropertyOnboardingScreen from '../screens/host/NewPropertyOnboardingScreen';

const Stack = createNativeStackNavigator<HostDashboardStackParamList>();

export function HostDashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HostDashboard" component={HostDashboardScreen} />
      <Stack.Screen name="HostEditProperty" component={HostEditPropertyScreen} />
      <Stack.Screen name="HostStructureView" component={HostStructureViewScreen} />
      <Stack.Screen name="HostPropertyCalendarSync" component={HostPropertyCalendarSyncScreen} />
      <Stack.Screen name="HostStructure" component={HostStructureScreen} />
      <Stack.Screen name="PropertyGuide" component={PropertyGuideScreen} />
      <Stack.Screen name="PropertyGuideSection" component={PropertyGuideSectionScreen} />
      <Stack.Screen name="NewPropertyOnboarding" component={NewPropertyOnboardingScreen} />
    </Stack.Navigator>
  );
}
