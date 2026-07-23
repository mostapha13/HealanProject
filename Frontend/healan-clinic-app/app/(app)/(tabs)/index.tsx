import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccess } from '../../../src/access/AccessContext';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  fetchDashboardStats,
  fetchPortalHeroSlides,
  type DashboardStats,
  type PortalHeroSlide,
} from '../../../src/api/healan';
import {
  filterAccessibleTiles,
  HOME_LARGE_TILES,
  HOME_SMALL_TILES,
  type HomeTileDef,
} from '../../../src/navigation/homeTiles';
import {
  AppScreen,
  BankHeader,
  EmptyBlock,
  FeatureCard,
  IconGridItem,
  LoadingBlock,
  SiteHeroCarousel,
} from '../../../src/components/Ui';
import { colors, spacing } from '../../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { home, loading: menuLoading, reload } = useAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [slides, setSlides] = useState<PortalHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const smallTiles = useMemo(
    () => filterAccessibleTiles(HOME_SMALL_TILES, home.allServices),
    [home.allServices]
  );
  const largeTiles = useMemo(
    () => filterAccessibleTiles(HOME_LARGE_TILES, home.allServices),
    [home.allServices]
  );

  const load = useCallback(async () => {
    try {
      const [s, hero] = await Promise.all([
        fetchDashboardStats(getAccessToken).catch(() => null),
        fetchPortalHeroSlides().catch(() => [] as PortalHeroSlide[]),
      ]);
      setStats(s);
      setSlides(hero);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
      void reload();
    }, [load, reload])
  );

  const open = (item: HomeTileDef) => {
    router.push({
      pathname: '/(app)/module/[id]',
      params: { id: item.id, title: item.title, path: item.path },
    });
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
        <BankHeader
          onBell={() => open({ id: 'queue', path: '/queue', title: 'صف انتظار', icon: 'people-outline' })}
          onSupport={() =>
            open({ id: 'sms', path: '/reports/sms', title: 'پیامک‌ها', icon: 'chatbox-ellipses-outline' })
          }
          onScan={() =>
            open({ id: 'patients', path: '/patients', title: 'بیماران', icon: 'person-outline' })
          }
        />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading || menuLoading}
            onRefresh={() => {
              setLoading(true);
              void load();
              void reload();
            }}
            tintColor={colors.primaryDeep}
          />
        }
      >
        <View style={styles.carouselWrap}>
          <SiteHeroCarousel
            slides={slides}
            fallbackTitle={
              stats
                ? `امروز ${stats.todayAppointments} نوبت · ${stats.waitingAppointments} در صف`
                : 'میز کار پذیرش کلینیک'
            }
            fallbackSubtitle="اسلایدر سایت در دسترس نیست — وضعیت امروز"
            onFallbackPress={() =>
              open({ id: 'queue', path: '/queue', title: 'صف انتظار', icon: 'people-outline' })
            }
          />
        </View>

        {menuLoading && smallTiles.length === 0 && largeTiles.length === 0 ? (
          <LoadingBlock />
        ) : smallTiles.length === 0 && largeTiles.length === 0 ? (
          <EmptyBlock title="منویی نیست" subtitle="برای این حساب دسترسی عملیاتی تعریف نشده" />
        ) : (
          <>
            {smallTiles.length ? (
              <View style={styles.iconGrid}>
                {smallTiles.map((item) => (
                  <IconGridItem
                    key={item.path}
                    title={item.title}
                    icon={item.icon}
                    onPress={() => open(item)}
                  />
                ))}
              </View>
            ) : null}

            {largeTiles.length ? (
              <View style={styles.featureGrid}>
                {largeTiles.map((item) => (
                  <FeatureCard
                    key={`f-${item.path}`}
                    title={item.title}
                    icon={item.icon}
                    onPress={() => open(item)}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  carouselWrap: {
    marginTop: -spacing.sm,
  },
  iconGrid: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  featureGrid: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
