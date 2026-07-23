import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  fetchBloodPressureHistory,
  isTenDigitNationalCode,
  toAsciiDigits,
  type BloodPressureHistory,
} from '../../../src/api/healan';
import {
  AppScreen,
  EmptyBlock,
  LoadingBlock,
  SearchField,
  SurfaceCard,
} from '../../../src/components/Ui';
import { BloodPressureAnalytics } from '../../../src/components/BloodPressureAnalytics';
import { colors, fonts, spacing } from '../../../src/theme';
import {
  groupBloodPressureByDay,
  periodTitle,
  type BpDayRow,
  type BpPeriodSlot,
} from '../../../src/utils/groupBloodPressureByDay';
import { toPersianDigits } from '../../../src/utils/jalali';

function formatSlot(slot?: BpPeriodSlot): React.ReactNode {
  if (!slot) return <Text style={styles.bpEmpty}>—</Text>;
  return (
    <Text style={styles.bpValue}>
      <Text style={styles.sys}>{toPersianDigits(slot.systolic)}</Text>
      <Text style={styles.slash}>/</Text>
      <Text style={styles.dia}>{toPersianDigits(slot.diastolic)}</Text>
    </Text>
  );
}

function formatSlotMeta(slot?: BpPeriodSlot): string {
  if (!slot) return '';
  const bits = [
    slot.measuredTime ? toPersianDigits(slot.measuredTime) : null,
    slot.pulse != null ? `نبض ${toPersianDigits(slot.pulse)}` : null,
  ].filter(Boolean);
  return bits.join(' · ');
}

function BpTable({ days }: { days: BpDayRow[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
      <View style={styles.table}>
        <View style={[styles.tr, styles.thead]}>
          <Text style={[styles.th, styles.colDate]}>تاریخ</Text>
          <Text style={[styles.th, styles.colPeriod, styles.periodMorning]}>صبح</Text>
          <Text style={[styles.th, styles.colPeriod, styles.periodNoon]}>ظهر</Text>
          <Text style={[styles.th, styles.colPeriod, styles.periodNight]}>شب</Text>
        </View>
        {days.map((day, index) => (
          <View
            key={day.dateKey}
            style={[styles.tr, index === days.length - 1 && styles.trLast]}
          >
            <View style={[styles.td, styles.colDate]}>
              <Text style={styles.dateText}>{day.jalaliLabel}</Text>
            </View>
            {([
              ['morning', day.morning, styles.periodMorning],
              ['noon', day.noon, styles.periodNoon],
              ['night', day.night, styles.periodNight],
            ] as const).map(([key, slot, tone]) => (
              <View key={key} style={[styles.td, styles.colPeriod, tone]}>
                {formatSlot(slot)}
                {slot ? <Text style={styles.bpMeta}>{formatSlotMeta(slot)}</Text> : null}
                {slot?.note ? (
                  <Text style={styles.bpNote} numberOfLines={1}>
                    {slot.note}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function BloodPressureTab() {
  const { getAccessToken } = useAuth();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<BloodPressureHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const load = useCallback(async () => {
    const nationalCode = toAsciiDigits(q);
    if (!nationalCode) {
      setResult(null);
      setSearched(false);
      setError(null);
      return;
    }
    if (!isTenDigitNationalCode(nationalCode)) {
      setResult(null);
      setSearched(true);
      setError('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setResult(await fetchBloodPressureHistory(getAccessToken, { nationalCode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, q]);

  const items = result?.items ?? [];
  const dayRows = useMemo(() => groupBloodPressureByDay(items), [items]);
  const latest = items[0];
  const patientName = result
    ? `${result.firstName} ${result.lastName}`.trim() || 'بیمار'
    : '';

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.title}>فشار خون</Text>
        <Text style={styles.sub}>گزارش جدولی سوابق بیمار</Text>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        keyboardShouldPersistTaps="handled"
      >
        <SearchField
          placeholder="کد ملی ۱۰ رقمی..."
          value={q}
          onChangeText={setQ}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={() => void load()}
        />
        <Pressable style={styles.searchBtn} onPress={() => void load()}>
          <Text style={styles.searchBtnText}>{loading ? 'در حال جستجو...' : 'نمایش سوابق'}</Text>
        </Pressable>

        {loading && !result ? <LoadingBlock /> : null}

        {result ? (
          <View style={styles.summaryWrap}>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>بیمار</Text>
              <Text style={styles.summaryStrong}>{patientName}</Text>
              <Text style={styles.summaryMuted}>
                کد ملی {toPersianDigits(result.nationalCode)}
              </Text>
            </SurfaceCard>
            <View style={styles.summaryRow}>
              <SurfaceCard style={styles.summaryMini}>
                <Text style={styles.summaryLabel}>تعداد ثبت</Text>
                <Text style={styles.summaryStrong}>{toPersianDigits(items.length)}</Text>
              </SurfaceCard>
              <SurfaceCard style={styles.summaryMini}>
                <Text style={styles.summaryLabel}>آخرین فشار</Text>
                <Text style={styles.summaryStrong}>
                  {latest ? toPersianDigits(`${latest.systolic}/${latest.diastolic}`) : '—'}
                </Text>
                <Text style={styles.summaryMuted}>
                  {[
                    latest?.periodTitle || periodTitle(latest?.periodOfDay),
                    latest?.measuredTime,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </SurfaceCard>
            </View>

            {dayRows.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>جدول روزانه (صبح / ظهر / شب)</Text>
                <BpTable days={dayRows} />
                <BloodPressureAnalytics items={items} />
              </>
            ) : (
              <EmptyBlock title="موردی نیست" subtitle="برای این بیمار فشاری ثبت نشده است" />
            )}
          </View>
        ) : searched ? (
          <EmptyBlock
            title={error ? 'خطا' : 'موردی نیست'}
            subtitle={error ?? 'برای این کد ملی ثبتی یافت نشد'}
          />
        ) : (
          <SurfaceCard style={styles.hint}>
            <Text style={styles.hintText}>کد ملی را وارد کنید و «نمایش سوابق» را بزنید.</Text>
          </SurfaceCard>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const COL_DATE = 112;
const COL_PERIOD = 124;

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
  body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  searchBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchBtnText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primaryInk },
  hint: { marginTop: spacing.sm },
  hintText: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, textAlign: 'right' },
  summaryWrap: { marginBottom: spacing.sm },
  summaryCard: { marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: spacing.md },
  summaryMini: { flex: 1 },
  summaryLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
  },
  summaryStrong: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 4,
  },
  summaryMuted: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  tableScroll: {
    marginBottom: spacing.md,
  },
  table: {
    minWidth: COL_DATE + COL_PERIOD * 3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  tr: {
    flexDirection: 'row-reverse',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  trLast: {
    borderBottomWidth: 0,
  },
  thead: {
    backgroundColor: '#EEF2F6',
  },
  th: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.line,
  },
  td: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.line,
  },
  colDate: {
    width: COL_DATE,
    borderLeftWidth: 0,
  },
  colPeriod: {
    width: COL_PERIOD,
  },
  periodMorning: {
    backgroundColor: 'rgba(198, 224, 0, 0.14)',
  },
  periodNoon: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  periodNight: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  dateText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  bpValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: 'center',
  },
  sys: { color: '#DC2626' },
  dia: { color: '#2563EB' },
  slash: { color: colors.muted },
  bpEmpty: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
  },
  bpMeta: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  bpNote: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
});
