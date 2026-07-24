import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import { useAccess } from '../../../src/access/AccessContext';
import { AppScreen, LoadingBlock } from '../../../src/components/Ui';
import { colors, fonts } from '../../../src/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];

type TabDef = { name: string; title: string; icon: Ion };

/**
 * RTL bottom bar order (right → left):
 * خانه · خدمات · فشار خون · داشبورد · پروفایل
 */
const TAB_ORDER: TabDef[] = [
  { name: 'index', title: 'خانه', icon: 'home-outline' },
  { name: 'services', title: 'خدمات', icon: 'apps-outline' },
  { name: 'blood-pressure', title: 'فشار خون', icon: 'heart-outline' },
  { name: 'dashboard', title: 'داشبورد', icon: 'grid-outline' },
  { name: 'profile', title: 'پروفایل', icon: 'person-outline' },
];

const HIDDEN = { href: null } as const;

type TabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    navigate: (name: string) => void;
  };
};

function ClinicTabBar({
  state,
  navigation,
  visibleTabs,
}: TabBarProps & { visibleTabs: TabDef[] }) {
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.bar,
        {
          // Keep labels fully above home-indicator / browser chrome
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {visibleTabs.map((tab) => {
        const focused = focusedName === tab.name;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (!focused) navigation.navigate(tab.name);
            }}
            style={[styles.item, focused ? styles.itemFocused : styles.itemIdle]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={focused ? colors.primaryInk : colors.tabInactive}
            />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              style={[styles.label, focused ? styles.labelFocused : styles.labelIdle]}
            >
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { canAccess } = useAccess();
  const insets = useSafeAreaInsets();

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

  const visibleTabs = useMemo(
    () =>
      TAB_ORDER.filter((tab) => {
        if (tab.name === 'dashboard') return showDashboard;
        if (tab.name === 'blood-pressure') return showBloodPressure;
        return true;
      }),
    [showDashboard, showBloodPressure]
  );

  return (
    <Tabs
      tabBar={(props) => <ClinicTabBar {...props} visibleTabs={visibleTabs} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          // height is owned by custom bar + safe-area
          height: 58 + Math.max(insets.bottom, 10),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'خانه' }} />
      <Tabs.Screen name="services" options={{ title: 'خدمات' }} />
      <Tabs.Screen
        name="blood-pressure"
        options={{
          title: 'فشار خون',
          href: showBloodPressure ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'داشبورد',
          href: showDashboard ? undefined : null,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'پروفایل' }} />
      {/* Keep route for home/services deep links; not in bottom bar */}
      <Tabs.Screen name="patients" options={HIDDEN} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingHorizontal: 4,
    paddingTop: 8,
    minHeight: 58,
    overflow: 'visible',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 2,
    borderRadius: 14,
    marginHorizontal: 2,
    overflow: 'visible',
  },
  itemFocused: {
    backgroundColor: colors.primary,
  },
  itemIdle: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelFocused: {
    color: colors.primaryInk,
  },
  labelIdle: {
    color: colors.tabInactive,
  },
});
