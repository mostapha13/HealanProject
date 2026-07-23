import React from 'react';
import { Pressable } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { useAuth } from '../../../src/auth/AuthContext';
import { AppScreen, LoadingBlock } from '../../../src/components/Ui';
import { colors, fonts } from '../../../src/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: Ion; focused: boolean }) {
  return <Ionicons name={name} size={22} color={focused ? colors.white : colors.tabInactive} />;
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
          marginHorizontal: 2,
          marginVertical: 6,
          borderRadius: 16,
          backgroundColor: focused ? colors.primaryDeep : 'transparent',
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

  if (loading) {
    return (
      <AppScreen>
        <LoadingBlock />
      </AppScreen>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarButton: TabBarButton as never,
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 74,
          paddingBottom: 8,
          paddingTop: 4,
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
          tabBarIcon: ({ focused }) => <TabIcon name="grid-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'رزرو نوبت',
          tabBarIcon: ({ focused }) => <TabIcon name="calendar-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'چت‌بات',
          tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles-outline" focused={focused} />,
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
