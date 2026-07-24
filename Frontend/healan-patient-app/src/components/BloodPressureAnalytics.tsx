import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import type { PortalBloodPressureItem } from '../api/portal';
import {
  groupBloodPressureByDay,
  periodTitle,
  type BpDayRow,
} from '../utils/groupBloodPressureByDay';
import { toPersianDigits } from '../utils/jalali';

type PeriodKey = 'morning' | 'noon' | 'night';

function buildPeriodTrend(dayRows: BpDayRow[], periodKey: PeriodKey) {
  const chronological = [...dayRows].sort((a, b) =>
    a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0
  );
  const withSlot = chronological.filter((d) => d[periodKey]);
  return {
    categories: withSlot.map((d) => d.jalaliLabel),
    systolic: withSlot.map((d) => d[periodKey]!.systolic),
    diastolic: withSlot.map((d) => d[periodKey]!.diastolic),
  };
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function ColumnChart({
  categories,
  systolic,
  diastolic,
  empty,
}: {
  categories: string[];
  systolic: number[];
  diastolic: number[];
  empty?: string;
}) {
  if (!categories.length) {
    return <Text style={styles.emptyTrend}>{empty || 'داده‌ای نیست'}</Text>;
  }
  const max = Math.max(1, ...systolic, ...diastolic, 160);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={styles.chartRow}>
        {categories.map((cat, i) => {
          const sysH = Math.max(4, (systolic[i] / max) * 120);
          const diaH = Math.max(4, (diastolic[i] / max) * 120);
          return (
            <View key={`${cat}-${i}`} style={styles.colGroup}>
              <View style={styles.bars}>
                <View style={[styles.bar, { height: sysH, backgroundColor: '#EF4444' }]} />
                <View style={[styles.bar, { height: diaH, backgroundColor: '#2563EB' }]} />
              </View>
              <Text style={styles.cat} numberOfLines={1}>
                {cat}
              </Text>
              <Text style={styles.valueChip}>
                {toPersianDigits(`${systolic[i]}/${diastolic[i]}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const PERIOD_TRENDS: Array<{
  key: PeriodKey;
  title: string;
  badge: string;
  hint: string;
  empty: string;
  accent: string;
}> = [
  {
    key: 'morning',
    title: 'فشارهای صبح',
    badge: 'صبح',
    hint: 'ترند ستونی سیستول و دیاستول در بازه صبح',
    empty: 'هنوز ثبت صبحی نیست.',
    accent: '#0D9488',
  },
  {
    key: 'noon',
    title: 'فشارهای ظهر',
    badge: 'ظهر',
    hint: 'ترند ستونی سیستول و دیاستول در بازه ظهر',
    empty: 'هنوز ثبت ظهری نیست.',
    accent: '#0284C7',
  },
  {
    key: 'night',
    title: 'فشارهای شب',
    badge: 'شب',
    hint: 'ترند ستونی سیستول و دیاستول در بازه شب',
    empty: 'هنوز ثبت شبی نیست.',
    accent: '#7C3AED',
  },
];

export function BloodPressureAnalytics({ items }: { items: PortalBloodPressureItem[] }) {
  const dayRows = useMemo(() => groupBloodPressureByDay(items), [items]);
  const chartItems = useMemo(() => {
    const chronological = [...items].sort((a, b) =>
      String(a.measuredAt).localeCompare(String(b.measuredAt))
    );
    return chronological.slice(-20);
  }, [items]);

  const overviewCategories = chartItems.map((r) => {
    const dateLabel = r.measuredAt
      ? toPersianDigits(r.measuredAt.slice(5, 10).replace('-', '/'))
      : '—';
    const period = r.periodTitle || periodTitle(r.periodOfDay) || '';
    return period ? `${dateLabel} · ${period}` : dateLabel;
  });
  const overviewSystolic = chartItems.map((r) => Number(r.systolic) || 0);
  const overviewDiastolic = chartItems.map((r) => Number(r.diastolic) || 0);

  const periodTrends = useMemo(
    () =>
      PERIOD_TRENDS.map((meta) => {
        const trend = buildPeriodTrend(dayRows, meta.key);
        const lastSys = trend.systolic.length ? trend.systolic[trend.systolic.length - 1] : null;
        const lastDia = trend.diastolic.length ? trend.diastolic[trend.diastolic.length - 1] : null;
        return {
          ...meta,
          trend,
          lastLabel: lastSys != null && lastDia != null ? `${lastSys}/${lastDia}` : '—',
          avgSys: avg(trend.systolic),
          avgDia: avg(trend.diastolic),
        };
      }),
    [dayRows]
  );

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>تحلیل نموداری</Text>
      <Text style={styles.sub}>جدول بالا · نمودارها در ادامه</Text>
      <View style={styles.legend}>
        <View style={[styles.legendChip, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.legendText, { color: '#DC2626' }]}>سیستولیک</Text>
        </View>
        <View style={[styles.legendChip, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.legendText, { color: '#2563EB' }]}>دیاستولیک</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>نمودار ستونی فشار خون</Text>
        <Text style={styles.cardHint}>حداکثر ۲۰ ثبت اخیر</Text>
        <ColumnChart
          categories={overviewCategories}
          systolic={overviewSystolic}
          diastolic={overviewDiastolic}
        />
      </View>

      {periodTrends.map((t) => (
        <View key={t.key} style={styles.card}>
          <View style={styles.trendHead}>
            <View style={[styles.badge, { backgroundColor: `${t.accent}22` }]}>
              <Text style={[styles.badgeText, { color: t.accent }]}>{t.badge}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardHint}>{t.hint}</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <Text style={styles.stat}>آخرین: {toPersianDigits(t.lastLabel)}</Text>
            <Text style={styles.stat}>
              میانگین:{' '}
              {t.avgSys != null && t.avgDia != null
                ? toPersianDigits(`${t.avgSys}/${t.avgDia}`)
                : '—'}
            </Text>
          </View>
          <ColumnChart
            categories={t.trend.categories}
            systolic={t.trend.systolic}
            diastolic={t.trend.diastolic}
            empty={t.empty}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md, marginBottom: spacing.md },
  heading: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'right' },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  legend: { flexDirection: 'row-reverse', gap: 8, marginBottom: spacing.sm },
  legendChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  legendText: { fontFamily: fonts.semiBold, fontSize: 11 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'right', marginTop: 2 },
  cardHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: 10,
  },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 8, minHeight: 160 },
  colGroup: { width: 52, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 120 },
  bar: { width: 12, borderRadius: 4 },
  cat: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted, textAlign: 'center', marginTop: 6 },
  valueChip: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 2,
  },
  trendHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  stats: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
  stat: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkSoft },
  emptyTrend: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
