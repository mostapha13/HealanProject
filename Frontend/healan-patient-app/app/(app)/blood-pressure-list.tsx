import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { patientBloodPressureList, type PortalBloodPressureItem } from '../../src/api/portal';
import {
  AppScreen,
  EmptyBlock,
  LoadingBlock,
  PrimaryButton,
  ScreenHeader,
  SurfaceCard,
} from '../../src/components/Ui';
import { PaginationBar } from '../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../src/theme';
import {
  groupBloodPressureByDay,
  type BpDayRow,
  type BpPeriodSlot,
} from '../../src/utils/groupBloodPressureByDay';
import { toPersianDigits } from '../../src/utils/jalali';

const PAGE_SIZE = 10;

function Cell({ slot }: { slot?: BpPeriodSlot }) {
  if (!slot) {
    return (
      <View style={styles.cell}>
        <Text style={styles.empty}>—</Text>
      </View>
    );
  }
  return (
    <View style={styles.cell}>
      <Text style={styles.bp}>
        <Text style={styles.sys}>{toPersianDigits(slot.systolic)}</Text>
        <Text style={styles.slash}>/</Text>
        <Text style={styles.dia}>{toPersianDigits(slot.diastolic)}</Text>
      </Text>
      {slot.measuredTime ? (
        <Text style={styles.meta}>{toPersianDigits(slot.measuredTime)}</Text>
      ) : null}
      {slot.pulse != null ? (
        <Text style={styles.meta}>نبض {toPersianDigits(slot.pulse)}</Text>
      ) : null}
    </View>
  );
}

function ReportTable({ days }: { days: BpDayRow[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
      <View style={styles.table}>
        <View style={[styles.tr, styles.thead]}>
          <Text style={[styles.th, styles.colDate]}>تاریخ</Text>
          <Text style={[styles.th, styles.colPeriod, styles.morning]}>صبح</Text>
          <Text style={[styles.th, styles.colPeriod, styles.noon]}>ظهر</Text>
          <Text style={[styles.th, styles.colPeriod, styles.night]}>شب</Text>
        </View>
        {days.map((day, i) => (
          <View key={day.dateKey} style={[styles.tr, i === days.length - 1 && styles.trLast]}>
            <View style={[styles.td, styles.colDate]}>
              <Text style={styles.dateText}>{day.jalaliLabel}</Text>
            </View>
            <View style={[styles.td, styles.colPeriod, styles.morningSoft]}>
              <Cell slot={day.morning} />
            </View>
            <View style={[styles.td, styles.colPeriod, styles.noonSoft]}>
              <Cell slot={day.noon} />
            </View>
            <View style={[styles.td, styles.colPeriod, styles.nightSoft]}>
              <Cell slot={day.night} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function BloodPressureListScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<PortalBloodPressureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      setItems(await patientBloodPressureList(token));
      setPage(1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const allDays = useMemo(() => groupBloodPressureByDay(items), [items]);
  const pageDays = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allDays.slice(start, start + PAGE_SIZE);
  }, [allDays, page]);

  const latest = items[0];

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="لیست فشار خون" onBack={() => router.back()} />
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <PrimaryButton
          label="ثبت فشار خون جدید"
          icon="add-outline"
          onPress={() => router.push('/(app)/blood-pressure')}
        />

        {loading && items.length === 0 ? <LoadingBlock /> : null}

        {items.length > 0 ? (
          <View style={styles.summaryRow}>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>تعداد ثبت</Text>
              <Text style={styles.summaryValue}>{toPersianDigits(items.length)}</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>آخرین فشار</Text>
              <Text style={styles.summaryValue}>
                {latest
                  ? toPersianDigits(`${latest.systolic}/${latest.diastolic}`)
                  : '—'}
              </Text>
            </SurfaceCard>
          </View>
        ) : null}

        <Text style={styles.section}>گزارش جدولی (صبح / ظهر / شب)</Text>
        {!loading && allDays.length === 0 ? (
          <EmptyBlock title="ثبتی نیست" subtitle="اولین فشار خون را ثبت کنید" />
        ) : (
          <>
            <ReportTable days={pageDays} />
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={allDays.length}
              onChange={setPage}
            />
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const COL_DATE = 110;
const COL_PERIOD = 118;

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: spacing.xxl, gap: 10 },
  summaryRow: { flexDirection: 'row-reverse', gap: 10 },
  summaryCard: { flex: 1 },
  summaryLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.muted, textAlign: 'right' },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  tableScroll: { marginTop: 4 },
  table: {
    minWidth: COL_DATE + COL_PERIOD * 3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  tr: {
    flexDirection: 'row-reverse',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  trLast: { borderBottomWidth: 0 },
  thead: { backgroundColor: '#EEF2F6' },
  th: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
    paddingVertical: 12,
  },
  td: { paddingVertical: 8, justifyContent: 'center' },
  colDate: { width: COL_DATE },
  colPeriod: { width: COL_PERIOD },
  morning: { backgroundColor: '#F4FAC8', color: '#A8C200' },
  noon: { backgroundColor: '#E0F2FE', color: '#0369A1' },
  night: { backgroundColor: '#EDE9FE', color: '#5B21B6' },
  morningSoft: { backgroundColor: 'rgba(244,250,200,0.35)' },
  noonSoft: { backgroundColor: 'rgba(224,242,254,0.45)' },
  nightSoft: { backgroundColor: 'rgba(237,233,254,0.5)' },
  dateText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.ink, textAlign: 'center' },
  cell: { alignItems: 'center', paddingHorizontal: 4 },
  bp: { fontFamily: fonts.bold, fontSize: 15 },
  sys: { color: '#DC2626' },
  dia: { color: '#2563EB' },
  slash: { color: colors.muted },
  meta: { fontFamily: fonts.regular, fontSize: 10, color: colors.inkSoft, marginTop: 2 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
});
