import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccess } from '../../../src/access/AccessContext';
import { useAuth } from '../../../src/auth/AuthContext';
import { fetchDashboardStats, type DashboardStats } from '../../../src/api/healan';
import type { ClinicModule } from '../../../src/navigation/catalog';
import {
  AppScreen,
  BankHeader,
  EmptyBlock,
  FeatureCard,
  IconGridItem,
  LoadingBlock,
  PromoBanner,
} from '../../../src/components/Ui';
import { colors, spacing } from '../../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { home, loading: menuLoading, reload } = useAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setStats(await fetchDashboardStats(getAccessToken));
    } catch {
      setStats(null);
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

  const open = (item: ClinicModule) => {
    router.push({
      pathname: '/(app)/module/[id]',
      params: { id: item.id, title: item.title, path: item.path },
    });
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
        <BankHeader
          onBell={() =>
            router.push({
              pathname: '/(app)/module/[id]',
              params: { id: 'queue', title: 'صف انتظار', path: '/queue' },
            })
          }
          onSupport={() =>
            router.push({
              pathname: '/(app)/module/[id]',
              params: { id: 'sms', title: 'پیامک‌ها', path: '/reports/sms' },
            })
          }
          onScan={() =>
            router.push({
              pathname: '/(app)/module/[id]',
              params: { id: 'patients', title: 'بیماران', path: '/patients' },
            })
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
        <PromoBanner
          title={
            stats
              ? `امروز ${stats.todayAppointments} نوبت · ${stats.waitingAppointments} در صف`
              : 'میز کار پذیرش کلینیک'
          }
          subtitle="وضعیت لحظه‌ای نوبت و صف انتظار"
          cta="مشاهده صف"
          onPress={() =>
            router.push({
              pathname: '/(app)/module/[id]',
              params: { id: 'queue', title: 'صف انتظار', path: '/queue' },
            })
          }
        />

        {menuLoading && home.quickActions.length === 0 ? (
          <LoadingBlock />
        ) : home.quickActions.length === 0 ? (
          <EmptyBlock title="منویی نیست" subtitle="برای این حساب منوی دسترسی تعریف نشده" />
        ) : (
          <>
            <View style={styles.iconGrid}>
              {home.quickActions.map((item) => (
                <IconGridItem
                  key={item.path}
                  title={item.title}
                  icon={item.icon}
                  onPress={() => open(item)}
                />
              ))}
            </View>

            <View style={styles.featureGrid}>
              {home.featureCards.map((item) => (
                <FeatureCard
                  key={`f-${item.path}`}
                  title={item.title}
                  icon={item.icon}
                  onPress={() => open(item)}
                />
              ))}
            </View>
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
