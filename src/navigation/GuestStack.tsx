/**
 * Guest Stack
 * Flusso per chi apre il link di condivisione struttura senza essere loggato:
 * PropertyGuestView → (back) → Sign Up
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute, RouteProp } from '@react-navigation/native';

import PropertyGuestViewScreen from '../screens/property/PropertyGuestViewScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import type { RootStackParamList } from '../types/navigation';

export type GuestStackParamList = {
  PropertyGuestView: { propertyId: string; requireSignUpOnBack?: boolean };
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<GuestStackParamList>();

export function GuestStack() {
  const route = useRoute<RouteProp<RootStackParamList, 'GuestStack'>>();
  const propertyId = route.params?.propertyId ?? '';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="PropertyGuestView"
    >
      <Stack.Screen
        name="PropertyGuestView"
        component={PropertyGuestViewScreen}
        initialParams={{ propertyId, requireSignUpOnBack: true }}
      />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
