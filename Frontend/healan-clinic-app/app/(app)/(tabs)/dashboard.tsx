import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import { fetchDashboardStats, type DashboardStats } from '../../../src/api/healan';
import { AppScreen, FeatureCard, LoadingBlock, SurfaceCard } from '../../../src/components/Ui';
import { colors, fonts, radius, spacing } from '../../../src/theme';

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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </SurfaceCard>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
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

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.title}>داشبورد</Text>
        <Text style={styles.sub}>خلاصه وضعیت امروز کلینیک</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} />
        }
      >
        {loading && !stats ? (
          <LoadingBlock />
        ) : (
          <View style={styles.statGrid}>
            <StatCard label="نوبت امروز" value={stats?.todayAppointments ?? '—'} icon="calendar-outline" />
            <StatCard label="صف انتظار" value={stats?.waitingAppointments ?? '—'} icon="people-outline" />
            <StatCard label="در حال ویزیت" value={stats?.inProgressAppointments ?? '—'} icon="pulse-outline" />
            <StatCard label="تکمیل‌شده" value={stats?.completedToday ?? '—'} icon="checkmark-circle-outline" />
            <StatCard label="بیماران" value={stats?.totalPatients ?? '—'} icon="person-outline" />
            <StatCard label="پزشکان" value={stats?.totalDoctors ?? '—'} icon="medkit-outline" />
          </View>
        )}

        <View style={styles.links}>
          <FeatureCard
            title="نمودارها و آمارها"
            icon="bar-chart-outline"
            onPress={() =>
              router.push({
                pathname: '/(app)/module/[id]',
                params: { id: 'reports', title: 'نمودارها و آمارها', path: '/reports' },
              })
            }
          />
          <FeatureCard
            title="صف انتظار"
            icon="people-outline"
            onPress={() =>
              router.push({
                pathname: '/(app)/module/[id]',
                params: { id: 'queue', title: 'صف انتظار', path: '/queue' },
              })
            }
          />
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
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  statValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink, textAlign: 'right' },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  links: {
    marginTop: spacing.lg,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
