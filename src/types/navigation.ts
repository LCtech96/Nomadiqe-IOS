/**
 * Navigation Types - React Navigation
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { UserRole } from './user';

// Auth Stack
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  VerifyEmailSecond: { email: string };
  ResetPassword: { token: string };
};

// Onboarding Stack
export type OnboardingStackParamList = {
  Welcome: undefined;
  RoleSelection: undefined;
  JollySubcategory: undefined;
  ProfileCompletion: { role?: UserRole };
  HostPropertyTypeSelection: undefined;
  HostPropertyBasicInfo: undefined;
  HostPropertyAmenities: undefined;
  HostPropertyPhotos: undefined;
  HostCollaborationSettings: { propertyId: string };
  HostKolbedProgram: { propertyId: string };
  HostBasePrice: { propertyId: string };
  HostOnboarding: undefined;
  CreatorOnboarding: undefined;
  JollyOnboarding: undefined;
};

// Main Tabs
export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  Create: undefined;
  KOLBEDTab: undefined;
  ProfileTab: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeFeed: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  PropertyDetail: { propertyId: string };
  Comments: { postId: string };
};

// Explore Stack
export type ExploreStackParamList = {
  ExploreMap: undefined;
  PropertyDetail: { propertyId: string };
  UserProfile: { userId: string };
  Filters: undefined;
};

export type ExploreScreenProps<T extends keyof ExploreStackParamList> = 
  NativeStackScreenProps<ExploreStackParamList, T>;

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Favorites: undefined;
  Bookings: undefined;
  Dashboard: undefined;
  HostStructure: { propertyId?: string };
  HostStructureView: { propertyId: string };
  EditStructure: { propertyId: string };
  NewPropertyOnboarding: undefined;
  Admin: undefined;
  MessagesList: undefined;
  NewConversation: undefined;
  Conversation: { recipientId: string; recipientName: string };
  Notifications: undefined;
  RequestSupport: undefined;
  SupportConversation: { ticketId?: string };
  AdminSupportTicket: { ticketId: string };
  HostCollaborationRequestDetail: { requestId: string };
  /** Host: link pagamento / anteprima per viaggiatori */
  HostTravelerLink: undefined;
  ViewUserProfile: { userId: string };
  AffiliateLinkRequests: undefined;
  JollyProductList: { jollyId: string };
  JollyMyProducts: undefined;
  /** Dettaglio post: immagini, like, commenti (stesso stack del profilo) */
  PostDetail: { postId: string };
};

// Dashboard Stack (per ruolo)
export type DashboardStackParamList = {
  DashboardHome: { role: UserRole };
  // Host
  HostProperties: undefined;
  CreateProperty: undefined;
  EditProperty: { propertyId: string };
  PropertyBookings: { propertyId: string };
  // Creator
  CreatorAnalytics: undefined;
  CreatorSocial: undefined;
  CreatorSettings: undefined;
  // Jolly
  JollyServices: undefined;
  CreateService: undefined;
  EditService: { serviceId: string };
  ServiceRequests: undefined;
};

// Messages Stack
export type MessagesStackParamList = {
  MessagesList: undefined;
  Conversation: { conversationId: string; recipientId: string; recipientName: string };
  NewMessage: undefined;
};

// Communities Stack
export type CommunitiesStackParamList = {
  CommunitiesList: undefined;
  CommunityDetail: { communityId: string };
  CreateCommunity: undefined;
};

// Root Stack (top level)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  /** Flusso ospite: vista struttura da link + Sign Up se torna indietro */
  GuestStack: { propertyId: string };
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Modal screens
  CreatePost: undefined;
  ImageViewer: { images: string[]; initialIndex: number };
  SharePost: { postId: string };
  ReportContent: { contentType: 'post' | 'comment' | 'user'; contentId: string };
};

// Screen Props Types
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = 
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = 
  NativeStackScreenProps<HomeStackParamList, T>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
