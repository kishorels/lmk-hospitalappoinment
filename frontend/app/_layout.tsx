import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { DataProvider } from '../src/context/DataContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(user)" />
          <Stack.Screen name="(doctor)" />
          <Stack.Screen name="(hospital)" />
        </Stack>
      </DataProvider>
    </AuthProvider>
  );
}
