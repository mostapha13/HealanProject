import React from 'react';
import { Pressable, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
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
    <Ionicons name={name} size={22} color={focused ? colors.primaryInk : colors.tabInactive} />
  );
}

type TabButtonProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
};

function TabBarButton({ children, style, onPress, accessibilityState, ...rest }: TabButtonProps) {
  const focused = Boolean(accessibilityState?.selected);
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      accessibilityState={accessibilityState}
      style={[
        style,
        {
          flex: 1,
          marginHorizontal: 3,
          marginVertical: 6,
          borderRadius: 16,
          backgroundColor: focused ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 4,
          paddingBottom: 2,
        },
      ]}
    >
      {children}
    </Pressable>
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
  const showPatients = canAccess('/patients');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryInk,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarButton: TabBarButton,
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 72,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
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
        name="patients"
        options={{
          title: 'بیماران',
          href: showPatients ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="people-outline" focused={focused} />,
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
