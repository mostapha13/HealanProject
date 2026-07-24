import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors, fonts, spacing } from '../theme';
import type { BloodPressureItem } from '../api/healan';
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
}: {
  categories: string[];
  systolic: number[];
  diastolic: number[];
}) {
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
                <View style={[styles.bar, { height: diaH, backgroundColor: '#3B82F6' }]} />
              </View>
              <Text style={styles.cat} numberOfLines={2}>
                {cat}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function LineChart({
  categories,
  systolic,
  diastolic,
  accent,
  empty,
}: {
  categories: string[];
  systolic: number[];
  diastolic: number[];
  accent: string;
  empty: string;
}) {
  if (!categories.length) {
    return <Text style={styles.emptyTrend}>{empty}</Text>;
  }

  const n = categories.length;
  const padX = 16;
  const padTop = 12;
  const padBottom = 28;
  const chartH = 120;
  const step = n === 1 ? 56 : 52;
  const width = Math.max(220, padX * 2 + step * Math.max(n - 1, 1));
  const height = chartH + padTop + padBottom;
  const min = Math.min(60, ...systolic, ...diastolic);
  const max = Math.max(160, ...systolic, ...diastolic);
  const span = Math.max(1, max - min);

  const pointAt = (vals: number[], i: number) => {
    const x = padX + (n === 1 ? 0 : (i / (n - 1)) * (width - padX * 2));
    const y = padTop + chartH - ((vals[i] - min) / span) * chartH;
    return { x, y };
  };

  const sysPts = systolic.map((_, i) => pointAt(systolic, i));
  const diaPts = diastolic.map((_, i) => pointAt(diastolic, i));
  const toPoints = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((t) => {
            const y = padTop + chartH * (1 - t);
            return (
              <Line
                key={t}
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke={colors.line}
                strokeWidth={1}
              />
            );
          })}
          <Polyline
            points={toPoints(sysPts)}
            fill="none"
            stroke="#EF4444"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Polyline
            points={toPoints(diaPts)}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {sysPts.map((p, i) => (
            <Circle key={`s-${i}`} cx={p.x} cy={p.y} r={4} fill="#EF4444" />
          ))}
          {diaPts.map((p, i) => (
            <Circle key={`d-${i}`} cx={p.x} cy={p.y} r={4} fill={accent} />
          ))}
        </Svg>
        <View style={[styles.lineCats, { width }]}>
          {categories.map((c, i) => (
            <Text
              key={`${c}-${i}`}
              style={[styles.cat, { width: step, left: padX + i * (n === 1 ? 0 : step) - step / 2, position: 'absolute' }]}
              numberOfLines={1}
            >
              {c}
            </Text>
          ))}
        </View>
        <View style={styles.valueRow}>
          {categories.map((c, i) => (
            <Text key={`v-${c}-${i}`} style={styles.valueChip}>
              {toPersianDigits(`${systolic[i]}/${diastolic[i]}`)}
            </Text>
          ))}
        </View>
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
    hint: 'ترند خطی سیستول و دیاستول در بازه صبح',
    empty: 'هنوز ثبت صبحی برای این بیمار نیست.',
    accent: '#0D9488',
  },
  {
    key: 'noon',
    title: 'فشارهای ظهر',
    badge: 'ظهر',
    hint: 'ترند خطی سیستول و دیاستول در بازه ظهر',
    empty: 'هنوز ثبت ظهری برای این بیمار نیست.',
    accent: '#0284C7',
  },
  {
    key: 'night',
    title: 'فشارهای شب',
    badge: 'شب',
    hint: 'ترند خطی سیستول و دیاستول در بازه شب',
    empty: 'هنوز ثبت شبی برای این بیمار نیست.',
    accent: '#7C3AED',
  },
];

export function BloodPressureAnalytics({ items }: { items: BloodPressureItem[] }) {
  const dayRows = useMemo(() => groupBloodPressureByDay(items), [items]);
  // Keep API order (newest first) then take last 20 chronological for overview bars
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
      <Text style={styles.sub}>نمای کلی ستونی، سپس ترند خطی صبح / ظهر / شب</Text>
      <View style={styles.legend}>
        <View style={[styles.legendChip, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.legendText, { color: '#DC2626' }]}>سیستولیک</Text>
        </View>
        <View style={[styles.legendChip, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.legendText, { color: '#2563EB' }]}>دیاستولیک</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>نمای کلی</Text>
        <Text style={styles.cardTitle}>نمودار ستونی فشار خون</Text>
        <Text style={styles.cardHint}>حداکثر ۲۰ ثبت اخیر (به ترتیب زمانی)</Text>
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
          <LineChart
            categories={t.trend.categories}
            systolic={t.trend.systolic}
            diastolic={t.trend.diastolic}
            accent={t.accent}
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
  cardEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.primaryDeep,
    textAlign: 'right',
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
  colGroup: { width: 44, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 120 },
  bar: { width: 12, borderRadius: 4 },
  cat: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted, textAlign: 'center', marginTop: 6 },
  lineCats: { height: 18, position: 'relative', marginTop: -22 },
  valueRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 8 },
  valueChip: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.inkSoft,
    minWidth: 44,
    textAlign: 'center',
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
