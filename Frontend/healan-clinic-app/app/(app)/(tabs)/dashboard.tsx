import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import { useAccess } from '../../../src/access/AccessContext';
import { fetchDashboardStats, type DashboardStats } from '../../../src/api/healan';
import { AppScreen, EmptyBlock, FeatureCard, LoadingBlock, SurfaceCard } from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';
import { toPersianDigits } from '../../../src/utils/jalali';

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <SurfaceCard style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryInk} />
      </View>
      <Text style={styles.statValue}>{typeof value === 'number' ? toPersianDigits(value) : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </SurfaceCard>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { canAccess } = useAccess();
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
    }, [load])
  );

  const open = (id: string, title: string, path: string) => {
    if (!canAccess(path)) return;
    router.push({
      pathname: '/(app)/module/[id]',
      params: { id, title, path },
    });
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.title}>داشبورد</Text>
        <Text style={styles.sub}>خلاصه وضعیت امروز کلینیک</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              void load();
            }}
          />
        }
      >
        {loading && !stats ? (
          <LoadingBlock />
        ) : (
          <View style={styles.statGrid}>
            <StatCard label="نوبت امروز" value={stats?.todayAppointments ?? '—'} icon="calendar-outline" />
            <StatCard label="در انتظار" value={stats?.waitingAppointments ?? '—'} icon="people-outline" />
            <StatCard label="در حال ویزیت" value={stats?.inProgressAppointments ?? '—'} icon="pulse-outline" />
            <StatCard label="تکمیل‌شده" value={stats?.completedToday ?? '—'} icon="checkmark-circle-outline" />
            <StatCard label="بیماران" value={stats?.totalPatients ?? '—'} icon="person-outline" />
            <StatCard label="پزشکان" value={stats?.totalDoctors ?? '—'} icon="medkit-outline" />
            <StatCard label="پرداخت معلق" value={stats?.pendingPayments ?? '—'} icon="card-outline" />
            <StatCard label="نسخه امروز" value={stats?.todayPrescriptions ?? '—'} icon="document-text-outline" />
            <StatCard
              label="درآمد امروز"
              value={
                stats?.todayRevenue != null
                  ? toPersianDigits(Math.round(stats.todayRevenue).toLocaleString('en-US'))
                  : '—'
              }
              icon="cash-outline"
            />
          </View>
        )}

        <View style={styles.links}>
          {canAccess('/reports') ? (
            <FeatureCard
              title="نمودارها و آمارها"
              icon="bar-chart-outline"
              onPress={() => open('reports', 'نمودارها و آمارها', '/reports')}
            />
          ) : null}
          {canAccess('/queue') ? (
            <FeatureCard
              title="صف انتظار"
              icon="people-outline"
              onPress={() => open('queue', 'صف انتظار', '/queue')}
            />
          ) : null}
          {!canAccess('/reports') && !canAccess('/queue') ? (
            <EmptyBlock title="میانبری نیست" subtitle="بر اساس سطح دسترسی شما" />
          ) : null}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.primaryInk, textAlign: 'right' },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft, textAlign: 'right', marginTop: 4 },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  statGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { width: '48%', minHeight: 100 },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  statValue: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, textAlign: 'right' },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  links: { marginTop: spacing.lg, gap: spacing.sm },
});
