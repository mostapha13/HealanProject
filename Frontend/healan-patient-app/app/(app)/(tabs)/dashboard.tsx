import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  bookingMyList,
  patientBloodPressureList,
  patientMedicationList,
  patientMyHistory,
} from '../../../src/api/portal';
import { AppScreen, LoadingBlock, ScreenHeader, SurfaceCard } from '../../../src/components/Ui';
import { LargeActionCard, SmallTile } from '../../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../../src/theme';
import { toPersianDigits } from '../../../src/utils/jalali';

export default function DashboardScreen() {
  const router = useRouter();
  const { session, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ visits: 0, bookings: 0, bp: 0, meds: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const [history, bookings, bp, meds] = await Promise.all([
        patientMyHistory(token).catch(() => ({ visits: [], bookings: [] })),
        bookingMyList(token).catch(() => []),
        patientBloodPressureList(token).catch(() => []),
        patientMedicationList(token).catch(() => []),
      ]);
      setStats({
        visits: history.visits?.length ?? 0,
        bookings: bookings.length,
        bp: bp.length,
        meds: meds.length,
      });
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const name = `${session?.firstName ?? ''} ${session?.lastName ?? ''}`.trim() || 'بیمار';

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="داشبورد" onBack={() => router.replace('/(app)/(tabs)')} />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <Text style={styles.lead}>خلاصه وضعیت سلامت {name}</Text>
        {loading ? <LoadingBlock /> : null}

        <View style={styles.statsRow}>
          {[
            { label: 'ویزیت‌ها', value: stats.visits },
            { label: 'رزروها', value: stats.bookings },
            { label: 'فشار خون', value: stats.bp },
            { label: 'داروها', value: stats.meds },
          ].map((s) => (
            <SurfaceCard key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{toPersianDigits(s.value)}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </SurfaceCard>
          ))}
        </View>

        <Text style={styles.section}>میانبرها</Text>
        <View style={styles.grid}>
          <SmallTile title="سوابق" icon="time-outline" onPress={() => router.push('/(app)/history')} />
          <SmallTile title="رزروها" icon="list-outline" onPress={() => router.push('/(app)/bookings')} />
          <SmallTile
            title="فشار خون"
            icon="pulse-outline"
            onPress={() => router.push('/(app)/blood-pressure-list')}
          />
          <SmallTile
            title="داروها"
            icon="medkit-outline"
            onPress={() => router.push('/(app)/medications-list')}
          />
          <SmallTile title="چت‌بات" icon="chatbubbles-outline" onPress={() => router.push('/(app)/(tabs)/assistant')} />
          <SmallTile title="رزرو جدید" icon="calendar-outline" onPress={() => router.push('/(app)/(tabs)/booking')} />
        </View>

        <Text style={styles.section}>اقدام سریع</Text>
        <LargeActionCard
          title="ثبت فشار خون"
          subtitle="همین حالا اندازه‌گیری را ذخیره کنید"
          icon="heart"
          onPress={() => router.push('/(app)/blood-pressure')}
        />
        <LargeActionCard
          title="ثبت دارو"
          subtitle="یادآور مصرف روزانه"
          icon="alarm"
          onPress={() => router.push('/(app)/medications')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  lead: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  statCard: { width: '47%', alignItems: 'center', paddingVertical: 16 },
  statValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.primaryDeep },
  statLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.muted, marginTop: 4 },
  section: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.lg,
  },
});
