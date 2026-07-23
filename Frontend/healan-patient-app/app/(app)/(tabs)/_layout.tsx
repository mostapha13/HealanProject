import React from 'react';
import { Pressable } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { useAuth } from '../../../src/auth/AuthContext';
import { AppScreen, LoadingBlock } from '../../../src/components/Ui';
import { SiteProvider } from '../../../src/site/SiteContext';
import { colors, fonts } from '../../../src/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: Ion; focused: boolean }) {
  return <Ionicons name={name} size={20} color={focused ? colors.white : colors.tabInactive} />;
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
          marginHorizontal: 1,
          marginVertical: 5,
          borderRadius: 14,
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

const HIDDEN = { href: null } as const;

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
    <SiteProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.white,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarButton: TabBarButton as never,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontFamily: fonts.semiBold,
            fontSize: 9,
            marginTop: 1,
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.line,
            height: 72,
            paddingBottom: 6,
            paddingTop: 2,
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
            title: 'رزرو',
            tabBarIcon: ({ focused }) => <TabIcon name="calendar-outline" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: 'درباره ما',
            tabBarIcon: ({ focused }) => <TabIcon name="information-circle-outline" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="contact"
          options={{
            title: 'تماس',
            tabBarIcon: ({ focused }) => <TabIcon name="call-outline" focused={focused} />,
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

        {/* Keep bottom tabs visible on these stack-like screens */}
        <Tabs.Screen name="blood-pressure" options={HIDDEN} />
        <Tabs.Screen name="blood-pressure-list" options={HIDDEN} />
        <Tabs.Screen name="medications" options={HIDDEN} />
        <Tabs.Screen name="medications-list" options={HIDDEN} />
        <Tabs.Screen name="bookings" options={HIDDEN} />
        <Tabs.Screen name="history" options={HIDDEN} />
      </Tabs>
    </SiteProvider>
  );
}
