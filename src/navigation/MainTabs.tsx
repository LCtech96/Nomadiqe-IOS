/**
 * Main Tabs Navigation
 * Bottom tab bar con Home, Explore, Create (non-host) / Host Dashboard (host), Noma Hub, Profile
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types/navigation';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isCreatorAwaitingApproval } from '../utils/creatorReview';
import { isHostAwaitingApproval } from '../utils/hostReview';
import * as Haptics from 'expo-haptics';

// Import stacks
import { HomeStack } from './HomeStack';
import { ExploreStack } from './ExploreStack';
import { ProfileStack } from './ProfileStack';

import KOLBEDScreen from '../screens/kolbed/KOLBEDScreen';
import { HostDashboardStack } from '../navigation/HostDashboardStack';
import { CreatorReviewGate } from '../components/CreatorReviewGate';

import { View } from 'react-native';

const CreatePlaceholderScreen = () => <View style={{ flex: 1 }} />;

function GatedHomeStack() {
  return (
    <CreatorReviewGate>
      <HomeStack />
    </CreatorReviewGate>
  );
}

function GatedExploreStack() {
  return (
    <CreatorReviewGate>
      <ExploreStack />
    </CreatorReviewGate>
  );
}

function GatedKOLBEDScreen() {
  return (
    <CreatorReviewGate>
      <KOLBEDScreen />
    </CreatorReviewGate>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const creatorUploadDisabled = isCreatorAwaitingApproval(profile) || isHostAwaitingApproval(profile);
  const isHost = profile?.role === 'host';
  const disabledTabColor = isDark
    ? theme.colors.dark.tertiaryLabel
    : theme.colors.light.tertiaryLabel;

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
          } else if (route.name === 'HostDashboardTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'KOLBEDTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          const iconColor =
            route.name === 'Create' && creatorUploadDisabled ? disabledTabColor : color;

          return <Ionicons name={iconName} size={size} color={iconColor} />;
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
        component={GatedHomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={GatedExploreStack}
        options={{ tabBarLabel: 'Explore' }}
      />
      {isHost ? (
        <Tab.Screen
          name="HostDashboardTab"
          component={HostDashboardStack}
          options={{ tabBarLabel: 'Dashboard' }}
        />
      ) : (
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
              if (creatorUploadDisabled) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              (navigation.getParent() as { navigate: (name: string) => void } | undefined)
                ?.navigate('CreatePost');
            },
          })}
        />
      )}
      <Tab.Screen
        name="KOLBEDTab"
        component={GatedKOLBEDScreen}
        options={{ tabBarLabel: 'Noma Hub' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
