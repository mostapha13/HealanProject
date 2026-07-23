import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { fetchDashboardStats, type DashboardStats } from '../../src/api/healan';
import { Card, EmptyBlock, LoadingBlock, Muted, Screen, Title } from '../../src/components/Ui';
import { colors, spacing } from '../../src/theme';

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { getAccessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchDashboardStats(getAccessToken);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت آمار');
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
    <Screen>
      <Title>داشبورد کلینیک</Title>
      <Muted>خلاصه وضعیت امروز</Muted>
      {loading && !stats ? (
        <LoadingBlock />
      ) : error && !stats ? (
        <EmptyBlock label={error} />
      ) : stats ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        >
          <Card>
            <View style={styles.grid}>
              <Stat label="نوبت امروز" value={stats.todayAppointments} />
              <Stat label="در انتظار" value={stats.waitingAppointments} />
              <Stat label="در حال ویزیت" value={stats.inProgressAppointments} />
              <Stat label="تکمیل‌شده" value={stats.completedToday} />
              <Stat label="بیماران" value={stats.totalPatients} />
              <Stat label="نسخه امروز" value={stats.todayPrescriptions} />
            </View>
          </Card>
        </ScrollView>
      ) : (
        <EmptyBlock label="آماری موجود نیست" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    width: '47%',
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: spacing.md,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  statLabel: {
    marginTop: 4,
    color: colors.muted,
    textAlign: 'right',
  },
});
