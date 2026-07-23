import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
import { colors, fonts, spacing } from '../../../src/theme';
import {
  groupBloodPressureByDay,
  periodTitle,
  type BpDayRow,
  type BpPeriodSlot,
} from '../../../src/utils/groupBloodPressureByDay';
import { toPersianDigits } from '../../../src/utils/jalali';

function SlotCell({ label, slot }: { label: string; slot?: BpPeriodSlot }) {
  if (!slot) {
    return (
      <View style={styles.slot}>
        <Text style={styles.slotLabel}>{label}</Text>
        <Text style={styles.slotEmpty}>—</Text>
      </View>
    );
  }
  return (
    <View style={styles.slot}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotValue}>
        {toPersianDigits(`${slot.systolic}/${slot.diastolic}`)}
      </Text>
      {slot.pulse != null ? (
        <Text style={styles.slotMeta}>نبض {toPersianDigits(slot.pulse)}</Text>
      ) : null}
      {slot.measuredTime ? (
        <Text style={styles.slotMeta}>{toPersianDigits(slot.measuredTime)}</Text>
      ) : null}
    </View>
  );
}

function DayCard({ day }: { day: BpDayRow }) {
  return (
    <SurfaceCard style={styles.dayCard}>
      <Text style={styles.dayTitle}>{day.jalaliLabel}</Text>
      <View style={styles.slotsRow}>
        <SlotCell label="صبح" slot={day.morning} />
        <SlotCell label="ظهر" slot={day.noon} />
        <SlotCell label="شب" slot={day.night} />
      </View>
    </SurfaceCard>
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
        <Text style={styles.sub}>گزارش سوابق بیمار با کد ملی</Text>
      </SafeAreaView>

      <View style={styles.body}>
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

        {loading && !result ? (
          <LoadingBlock />
        ) : (
          <FlatList
            data={dayRows}
            keyExtractor={(item) => item.dateKey}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            ListHeaderComponent={
              result ? (
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
                      <Text style={styles.summaryStrong}>
                        {toPersianDigits(items.length)}
                      </Text>
                    </SurfaceCard>
                    <SurfaceCard style={styles.summaryMini}>
                      <Text style={styles.summaryLabel}>آخرین فشار</Text>
                      <Text style={styles.summaryStrong}>
                        {latest
                          ? toPersianDigits(`${latest.systolic}/${latest.diastolic}`)
                          : '—'}
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
                    <Text style={styles.sectionTitle}>گزارش روزانه</Text>
                  ) : null}
                </View>
              ) : null
            }
            ListEmptyComponent={
              searched ? (
                <EmptyBlock
                  title={error ? 'خطا' : 'موردی نیست'}
                  subtitle={error ?? 'برای این کد ملی ثبتی یافت نشد'}
                />
              ) : (
                <SurfaceCard style={styles.hint}>
                  <Text style={styles.hintText}>کد ملی را وارد کنید و «نمایش سوابق» را بزنید.</Text>
                </SurfaceCard>
              )
            }
            renderItem={({ item }) => <DayCard day={item} />}
          />
        )}
      </View>
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
  dayCard: { marginBottom: spacing.sm },
  dayTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  slotsRow: { flexDirection: 'row-reverse', gap: 8 },
  slot: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  slotLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 6,
  },
  slotValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
  slotEmpty: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  slotMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
});
