import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import DoctorDiscoveryScreen from '../screens/patient/DoctorDiscoveryScreen';
import PatientAppointmentsScreen from '../screens/patient/PatientAppointmentsScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorConsultationsScreen from '../screens/doctor/DoctorConsultationsScreen';
import DoctorReferralsScreen from '../screens/doctor/DoctorReferralsScreen';

// Common
import ProfileScreen from '../screens/common/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Auth Stack ──────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Patient Tab Navigator ──────────────────────
function PatientTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: focused ? 'home' : 'home-outline',
            DiscoverTab: focused ? 'search' : 'search-outline',
            AppointmentsTab: focused ? 'calendar' : 'calendar-outline',
            ProfileTab: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={PatientHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DoctorDiscoveryScreen}
        options={{ title: 'Find Doctors' }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={PatientAppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ── Doctor Tab Navigator ────────────────────────
function DoctorTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            AnalyticsTab: focused ? 'stats-chart' : 'stats-chart-outline',
            AppointmentsTab: focused ? 'calendar' : 'calendar-outline',
            ConsultationsTab: focused ? 'create' : 'create-outline',
            ReferralsTab: focused ? 'git-branch' : 'git-branch-outline',
            ProfileTab: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="AnalyticsTab"
        component={DoctorHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={DoctorAppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen
        name="ConsultationsTab"
        component={DoctorConsultationsScreen}
        options={{ title: 'Consults' }}
      />
      <Tab.Screen
        name="ReferralsTab"
        component={DoctorReferralsScreen}
        options={{ title: 'Referrals' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ── Root Navigator ──────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgPrimary,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            backgroundColor: 'rgba(99,102,241,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="medical" size={28} color={colors.accentPrimary} />
        </View>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Loading MedZoo...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : role === 'doctor' ? (
        <DoctorTabs />
      ) : (
        <PatientTabs />
      )}
    </NavigationContainer>
  );
}
