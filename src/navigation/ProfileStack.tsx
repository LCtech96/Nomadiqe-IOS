/**
 * Profile Stack Navigation
 * Stack per profilo, settings, dashboard
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';

import ProfileScreen from '../screens/profile/ProfileScreen';
import AdminScreen from '../screens/profile/AdminScreen';
import DashboardScreen from '../screens/profile/DashboardScreen';
import HostStructureScreen from '../screens/host/HostStructureScreen';
import HostStructureViewScreen from '../screens/host/HostStructureViewScreen';
import EditStructureScreen from '../screens/host/EditStructureScreen';
import NewPropertyOnboardingScreen from '../screens/host/NewPropertyOnboardingScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import MessagesListScreen from '../screens/messages/MessagesListScreen';
import NewConversationScreen from '../screens/messages/NewConversationScreen';
import ConversationScreen from '../screens/messages/ConversationScreen';

import SettingsScreen from '../screens/profile/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import RequestSupportScreen from '../screens/profile/RequestSupportScreen';
import SupportConversationScreen from '../screens/profile/SupportConversationScreen';
import AdminSupportTicketScreen from '../screens/profile/AdminSupportTicketScreen';
import HostCollaborationRequestDetailScreen from '../screens/profile/HostCollaborationRequestDetailScreen';
import HostTravelerLinkScreen from '../screens/profile/HostTravelerLinkScreen';
import ViewUserProfileScreen from '../screens/profile/ViewUserProfileScreen';
import AffiliateLinkRequestsScreen from '../screens/profile/AffiliateLinkRequestsScreen';
import JollyProductListScreen from '../screens/jolly/JollyProductListScreen';
import JollyMyProductsScreen from '../screens/jolly/JollyMyProductsScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="RequestSupport" component={RequestSupportScreen} />
      <Stack.Screen name="SupportConversation" component={SupportConversationScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="HostCollaborationRequestDetail" component={HostCollaborationRequestDetailScreen} />
      <Stack.Screen name="HostTravelerLink" component={HostTravelerLinkScreen} />
      <Stack.Screen name="ViewUserProfile" component={ViewUserProfileScreen} />
      <Stack.Screen name="AffiliateLinkRequests" component={AffiliateLinkRequestsScreen} />
      <Stack.Screen name="JollyProductList" component={JollyProductListScreen} />
      <Stack.Screen name="JollyMyProducts" component={JollyMyProductsScreen} />
      <Stack.Screen name="HostStructure" component={HostStructureScreen} />
      <Stack.Screen name="HostStructureView" component={HostStructureViewScreen} />
      <Stack.Screen name="EditStructure" component={EditStructureScreen} />
      <Stack.Screen name="NewPropertyOnboarding" component={NewPropertyOnboardingScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="AdminSupportTicket" component={AdminSupportTicketScreen} />
      <Stack.Screen name="MessagesList" component={MessagesListScreen} />
      <Stack.Screen name="NewConversation" component={NewConversationScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ gestureEnabled: true, fullScreenGestureEnabled: true }}
      />
    </Stack.Navigator>
  );
}
