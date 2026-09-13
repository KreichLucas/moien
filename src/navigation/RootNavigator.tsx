import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { darkTheme, lightTheme } from '../theme/theme';
import { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Aprender', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🧑‍🎓</Text> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkTheme : lightTheme;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
