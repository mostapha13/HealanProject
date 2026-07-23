import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { useAccess } from '../../src/access/AccessContext';
import { colors } from '../../src/theme';
import { LoadingBlock } from '../../src/components/Ui';

function HeaderLogout() {
  const { signOut } = useAuth();
  return (
    <Pressable onPress={() => void signOut()} style={styles.logout}>
      <Text style={styles.logoutText}>خروج</Text>
    </Pressable>
  );
}

export default function AppLayout() {
  const { session, loading: authLoading } = useAuth();
  const { tabs, loading: accessLoading } = useAccess();

  if (authLoading) return <LoadingBlock />;
  if (!session) return <Redirect href="/login" />;
  if (accessLoading) {
    return (
      <View style={styles.boot}>
        <LoadingBlock label="در حال بارگذاری منو..." />
      </View>
    );
  }

  const enabled = new Set(tabs.map((t) => t.key));

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        headerRight: () => <HeaderLogout />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'داشبورد',
          href: enabled.has('index') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'صف انتظار',
          href: enabled.has('queue') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'نوبت‌ها',
          href: enabled.has('appointments') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'بیماران',
          href: enabled.has('patients') ? undefined : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: colors.bg },
  logout: { paddingHorizontal: 14, paddingVertical: 6 },
  logoutText: { color: colors.primary, fontWeight: '600' },
});
