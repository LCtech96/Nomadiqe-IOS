/**
 * Explore Stack Navigation
 * Stack per mappa e esplorazione proprietà
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../types/navigation';

// Import screens (to be created)
import ExploreMapScreen from '../screens/explore/ExploreMapScreen';

// Placeholder
import { View, Text } from 'react-native';

const PropertyDetailScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Property Detail</Text>
  </View>
);

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
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </Stack.Navigator>
  );
}
