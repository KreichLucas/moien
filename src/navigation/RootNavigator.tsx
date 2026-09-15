import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { DiamondRecoveryScreen } from '../screens/DiamondRecoveryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { ObjectiveScreen } from '../screens/ObjectiveScreen';
import { OutOfDiamondsScreen } from '../screens/OutOfDiamondsScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StreakScreen } from '../screens/StreakScreen';
import { ThemeColors, darkTheme, lightTheme, useTheme } from '../theme/theme';
import { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

function MainTabs() {
  const colors = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
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
        component={HomeScreen}
        options={{ tabBarLabel: 'Aprender', tabBarIcon: tabIcon('🏠') }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
        options={{ tabBarLabel: 'Praticar', tabBarIcon: tabIcon('🏋️') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('🧑‍🎓') }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const scheme = useColorScheme();
  const colors: ThemeColors = scheme === 'dark' ? darkTheme : lightTheme;
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

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Lesson" component={LessonScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="Streak" component={StreakScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Objective" component={ObjectiveScreen} />
        <Stack.Screen name="OutOfDiamonds" component={OutOfDiamondsScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="DiamondRecovery" component={DiamondRecoveryScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
