import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/state/AuthContext';
import { ProgressProvider } from './src/state/ProgressContext';

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </ProgressProvider>
    </AuthProvider>
  );
}
