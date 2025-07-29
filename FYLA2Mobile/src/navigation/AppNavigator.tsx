import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList, AuthStackParamList, ClientTabParamList, ProviderTabParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Legal Screens
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';

// Client Screens (Consumer-focused)
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/EnhancedSearchScreen';
import BookingsScreen from '../screens/main/BookingsScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Provider Screens (Business Dashboard)
import DashboardScreen from '../screens/provider/DashboardScreen';
import AppointmentsScreen from '../screens/provider/AppointmentsScreenSimple';
import AnalyticsScreen from '../screens/provider/AnalyticsScreen';
import ScheduleScreen from '../screens/provider/ScheduleScreen';
import ClientsScreen from '../screens/provider/ClientsScreen';
import ReviewsScreen from '../screens/reviews/ReviewsScreen';

// Detail Screens (Shared)
import ServiceDetailsScreen from '../screens/details/ServiceDetailsScreen';
import ProviderProfileScreen from '../screens/details/ProviderProfileScreen';
import BookingDetailsScreen from '../screens/details/BookingDetailsScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import UserSelectionScreen from '../screens/UserSelectionScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import NotificationTestScreen from '../screens/testing/NotificationTestScreen';
import EnhancedProfileScreen from '../screens/profile/EnhancedProfileScreen';

// Social Media Screens
import SocialFeedScreen from '../screens/social/SocialFeedScreen';
import CreatePostScreen from '../screens/social/CreatePostScreen';
import PostCommentsScreen from '../screens/social/PostCommentsScreen';
import UserProfileScreen from '../screens/social/UserProfileScreen';
import FollowingBookmarksScreen from '../screens/social/FollowingBookmarksScreen';
import EnhancedProviderProfileScreen from '../screens/social/EnhancedProviderProfileScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const ClientTab = createBottomTabNavigator<ClientTabParamList>();
const ProviderTab = createBottomTabNavigator<ProviderTabParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </AuthStack.Navigator>
  );
};

const ClientTabNavigator = () => {
  return (
    <ClientTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Social':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Bookings':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          const iconSize = focused ? 26 : 24;
          return <Ionicons name={iconName as any} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <ClientTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <ClientTab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <ClientTab.Screen 
        name="Social" 
        component={SocialFeedScreen}
        options={{ tabBarLabel: 'Social' }}
      />
      <ClientTab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <ClientTab.Screen 
        name="Messages" 
        component={ChatListScreen}
        options={{ tabBarLabel: 'Messages' }}
      />
      <ClientTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </ClientTab.Navigator>
  );
};

const ProviderTabNavigator = () => {
  return (
    <ProviderTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Appointments':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Social':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          const iconSize = focused ? 26 : 24;
          return <Ionicons name={iconName as any} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <ProviderTab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <ProviderTab.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Appointments' }}
      />
      <ProviderTab.Screen 
        name="Social" 
        component={SocialFeedScreen}
        options={{ tabBarLabel: 'Social' }}
      />
      <ProviderTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </ProviderTab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    // You can replace this with a proper loading screen
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* Role-based navigation */}
            {user?.isServiceProvider ? (
              <RootStack.Screen name="ProviderMain" component={ProviderTabNavigator} />
            ) : (
              <RootStack.Screen name="ClientMain" component={ClientTabNavigator} />
            )}
            
            {/* Shared detail screens */}
            <RootStack.Screen 
              name="ServiceDetails" 
              component={ServiceDetailsScreen}
              options={{ 
                headerShown: true, 
                title: 'Service Details',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="BookingFlow" 
              component={BookingFlowScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="ProviderProfile" 
              component={ProviderProfileScreen}
              options={{ 
                headerShown: true, 
                title: 'Provider Profile',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="BookingDetails" 
              component={BookingDetailsScreen}
              options={{ 
                headerShown: true, 
                title: 'Booking Details',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="ChatScreen" 
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="UserSelection" 
              component={UserSelectionScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="NotificationTest" 
              component={NotificationTestScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="EnhancedProfile" 
              component={EnhancedProfileScreen}
              options={{ headerShown: false }}
            />
            
            {/* Provider Dashboard Navigation Screens */}
            <RootStack.Screen 
              name="Analytics" 
              component={AnalyticsScreen}
              options={{ 
                headerShown: true, 
                title: 'Analytics',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="Schedule" 
              component={ScheduleScreen}
              options={{ 
                headerShown: true, 
                title: 'Schedule',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="Clients" 
              component={ClientsScreen}
              options={{ 
                headerShown: true, 
                title: 'Clients',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="Reviews" 
              component={ReviewsScreen}
              options={{ 
                headerShown: true, 
                title: 'Reviews',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            
            {/* Social Media Screens */}
            <RootStack.Screen 
              name="SocialFeed" 
              component={SocialFeedScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="CreatePost" 
              component={CreatePostScreen}
              options={{ 
                headerShown: true, 
                title: 'Create Post',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="PostComments" 
              component={PostCommentsScreen}
              options={{ 
                headerShown: true, 
                title: 'Comments',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
              options={{ 
                headerShown: true, 
                title: 'Profile',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="FollowingBookmarks" 
              component={FollowingBookmarksScreen}
              options={{ 
                headerShown: true, 
                title: 'Following & Bookmarks',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
            <RootStack.Screen 
              name="EnhancedProviderProfile" 
              component={EnhancedProviderProfileScreen}
              options={{ 
                headerShown: true, 
                title: 'Provider Profile',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerBackground: () => (
                  <BlurView
                    intensity={100}
                    tint="dark"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ),
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                },
                headerBackTitleVisible: false,
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
