import React from 'react';
import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAuth } from '../../../src/auth/AuthContext';
import { useAccess } from '../../../src/access/AccessContext';
import { AppScreen, LoadingBlock } from '../../../src/components/Ui';
import { colors, fonts } from '../../../src/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: Ion; focused: boolean }) {
  return (
    <View
      style={{
        backgroundColor: focused ? colors.primary : 'transparent',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Ionicons name={name} size={22} color={focused ? colors.primaryInk : colors.tabInactive} />
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { canAccess } = useAccess();

  // Do NOT block the whole tab tree on AccessMenu fetch — that remounts screens and loops.
  if (loading) {
    return (
      <AppScreen>
        <LoadingBlock />
      </AppScreen>
    );
  }
  if (!session) return <Redirect href="/login" />;

  const showDashboard = canAccess('/') || canAccess('/reports');
  const showBloodPressure = canAccess('/blood-pressure');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryInk,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'خانه',
          tabBarIcon: ({ focused }) => <TabIcon name="home-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'داشبورد',
          href: showDashboard ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="grid-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="blood-pressure"
        options={{
          title: 'فشار خون',
          href: showBloodPressure ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="heart-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'خدمات',
          tabBarIcon: ({ focused }) => <TabIcon name="apps-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'پروفایل',
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
