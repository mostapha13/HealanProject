import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import { AppScreen, LoadingBlock } from '../../../src/components/Ui';
import { SiteProvider } from '../../../src/site/SiteContext';
import { colors, fonts } from '../../../src/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];

type TabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    navigate: (name: string) => void;
  };
};

const VISIBLE_TABS: Array<{ name: string; title: string; icon: Ion }> = [
  { name: 'index', title: 'خانه', icon: 'home-outline' },
  { name: 'dashboard', title: 'داشبورد', icon: 'grid-outline' },
  { name: 'booking', title: 'رزرو', icon: 'calendar-outline' },
  { name: 'about', title: 'درباره ما', icon: 'information-circle-outline' },
  { name: 'contact', title: 'تماس', icon: 'call-outline' },
  { name: 'assistant', title: 'چت‌بات', icon: 'chatbubbles-outline' },
  { name: 'profile', title: 'پروفایل', icon: 'person-outline' },
];

const HIDDEN = { href: null } as const;

function PurpleTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {VISIBLE_TABS.map((tab) => {
        const focused = currentName === tab.name;
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
              size={18}
              color={focused ? colors.white : colors.tabInactive}
            />
            <Text
              numberOfLines={1}
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
        tabBar={(props) => <PurpleTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'خانه' }} />
        <Tabs.Screen name="dashboard" options={{ title: 'داشبورد' }} />
        <Tabs.Screen name="booking" options={{ title: 'رزرو' }} />
        <Tabs.Screen name="about" options={{ title: 'درباره ما' }} />
        <Tabs.Screen name="contact" options={{ title: 'تماس' }} />
        <Tabs.Screen name="assistant" options={{ title: 'چت‌بات' }} />
        <Tabs.Screen name="profile" options={{ title: 'پروفایل' }} />

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

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 4,
    paddingTop: 6,
    minHeight: 64,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 14,
    marginHorizontal: 1,
  },
  itemFocused: {
    backgroundColor: colors.primaryDeep,
  },
  itemIdle: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  labelFocused: {
    color: colors.white,
  },
  labelIdle: {
    color: colors.tabInactive,
  },
});
