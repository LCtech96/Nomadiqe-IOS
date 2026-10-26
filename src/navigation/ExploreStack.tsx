/**
 * Explore Stack Navigation
 * Stack per mappa e esplorazione proprietà
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../types/navigation';

import ExploreMapScreen from '../screens/explore/ExploreMapScreen';
import CreatorPropertyDetailScreen from '../screens/explore/CreatorPropertyDetailScreen';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ExploreMap" component={ExploreMapScreen} />
      <Stack.Screen name="PropertyDetail" component={CreatorPropertyDetailScreen} />
    </Stack.Navigator>
  );
}
