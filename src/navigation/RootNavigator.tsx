import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import React, { useState } from 'react';
import { ActivityIndicator, View, useColorScheme, useWindowDimensions } from 'react-native';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { DiamondRecoveryScreen } from '../screens/DiamondRecoveryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OutOfDiamondsScreen } from '../screens/OutOfDiamondsScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { StreakScreen } from '../screens/StreakScreen';
import { useAuth } from '../state/AuthContext';
import { ThemeColors, darkTheme, lightTheme, useTheme } from '../theme/theme';
import { Sidebar, SidebarItem } from './Sidebar';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const SIDEBAR_BREAKPOINT = 1000;

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Ionicons name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)} size={22} color={color} />
  );
}

type MainTabsProps = NativeStackScreenProps<RootStackParamList, 'Main'>;

function MainTabs({ navigation }: MainTabsProps) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  // Which bottom-tab is currently focused — used only to highlight the right
  // sidebar item; updated via each Tab.Screen's own `focus` listener, so it
  // stays correct whether the tab change came from the (hidden) tab bar or
  // from a sidebar item deep-navigating into the tab navigator.
  const [activeTab, setActiveTab] = useState<keyof MainTabParamList>('Home');

  const sidebarItems: SidebarItem[] = [
    {
      id: 'home',
      icon: 'home',
      label: 'Início',
      active: activeTab === 'Home',
      onPress: () => navigation.navigate('Main', { screen: 'Home' }),
    },
    { id: 'learn', icon: 'book', label: 'Aprender', active: false, onPress: () => navigation.navigate('Learn') },
    {
      id: 'practice',
      icon: 'barbell',
      label: 'Prática',
      active: activeTab === 'Practice',
      onPress: () => navigation.navigate('Main', { screen: 'Practice' }),
    },
    {
      id: 'achievements',
      icon: 'trophy',
      label: 'Conquistas',
      active: false,
      onPress: () => navigation.navigate('Achievements'),
    },
    {
      id: 'profile',
      icon: 'person-circle',
      label: 'Perfil',
      active: activeTab === 'Profile',
      onPress: () => navigation.navigate('Main', { screen: 'Profile' }),
    },
    { id: 'settings', icon: 'settings', label: 'Configurações', active: false, onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {isWide && <Sidebar items={sidebarItems} />}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
            tabBarStyle: isWide
              ? { display: 'none' }
              : {
                  backgroundColor: colors.background,
                  borderTopColor: colors.border,
                  borderTopWidth: 1,
                  height: 62,
                  paddingTop: 8,
                  paddingBottom: 8,
                },
          }}
        >
          <Tab.Screen
            name="Home"
            component={DashboardScreen}
            options={{ tabBarLabel: 'Início', tabBarIcon: tabIcon('home') }}
            listeners={{ focus: () => setActiveTab('Home') }}
          />
          <Tab.Screen
            name="Practice"
            component={PracticeScreen}
            options={{ tabBarLabel: 'Praticar', tabBarIcon: tabIcon('barbell') }}
            listeners={{ focus: () => setActiveTab('Practice') }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('person-circle') }}
            listeners={{ focus: () => setActiveTab('Profile') }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
}

export function RootNavigator() {
  const scheme = useColorScheme();
  const colors: ThemeColors = scheme === 'dark' ? darkTheme : lightTheme;
  const { user, isAuthLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Caveat_600SemiBold,
  });
  const navigationTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (isAuthLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="Streak" component={StreakScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="OutOfDiamonds" component={OutOfDiamondsScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="DiamondRecovery" component={DiamondRecoveryScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="Learn" component={HomeScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
        </Stack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
