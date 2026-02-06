/**
 * Main Tabs Navigation
 * Bottom tab bar con Home, Explore, Create, KOL&BED, Profile
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types/navigation';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

// Import stacks
import { HomeStack } from './HomeStack';
import { ExploreStack } from './ExploreStack';
import { ProfileStack } from './ProfileStack';

// Temporary placeholder screens
import { View, Text } from 'react-native';

const KOLBEDScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>KOL&BED</Text>
  </View>
);

const CreatePlaceholderScreen = () => <View style={{ flex: 1 }} />;

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ExploreTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Create') {
            iconName = 'add-circle';
          } else if (route.name === 'KOLBEDTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary.blue,
        tabBarInactiveTintColor: isDark
          ? theme.colors.dark.tertiaryLabel
          : theme.colors.light.tertiaryLabel,
        tabBarStyle: {
          backgroundColor: isDark
            ? theme.colors.dark.secondaryBackground
            : theme.colors.light.background,
          borderTopColor: isDark
            ? theme.colors.dark.separator
            : theme.colors.light.separator,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...theme.typography.caption2,
          fontWeight: '500',
        },
      })}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePlaceholderScreen}
        options={{
          tabBarLabel: '',
          tabBarIconStyle: { marginTop: -8 },
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // @ts-ignore
            navigation.navigate('CreatePost');
          },
        })}
      />
      <Tab.Screen
        name="KOLBEDTab"
        component={KOLBEDScreen}
        options={{ tabBarLabel: 'KOL&BED' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
