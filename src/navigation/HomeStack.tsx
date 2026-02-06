/**
 * Home Stack Navigation
 * Stack per feed, post detail, profili
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types/navigation';

// Import screens (to be created)
import HomeFeedScreen from '../screens/home/HomeFeedScreen';

// Placeholder screens
import { View, Text } from 'react-native';

const PostDetailScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Post Detail</Text>
  </View>
);

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeFeed" component={HomeFeedScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
}
