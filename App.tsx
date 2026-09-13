import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/state/ProgressContext';

export default function App() {
  return (
    <ProgressProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </ProgressProvider>
  );
}
