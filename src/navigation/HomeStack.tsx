/**
 * Home Stack Navigation
 * Stack per feed, post detail, profili
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types/navigation';

import HomeFeedScreen from '../screens/home/HomeFeedScreen';
import CommentsScreen from '../screens/home/CommentsScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';

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
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ gestureEnabled: true, fullScreenGestureEnabled: true }}
      />
      <Stack.Screen name="Comments" component={CommentsScreen} />
    </Stack.Navigator>
  );
}
