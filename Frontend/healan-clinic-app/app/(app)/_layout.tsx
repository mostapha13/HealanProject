import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { LoadingBlock, AppScreen } from '../../src/components/Ui';
import { colors } from '../../src/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <AppScreen>
        <LoadingBlock />
      </AppScreen>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: 'بازگشت',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="module/[id]" options={{ title: 'بخش' }} />
    </Stack>
  );
}
