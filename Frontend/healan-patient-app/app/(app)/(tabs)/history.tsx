import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import { patientMyHistory, type PortalMyHistory } from '../../../src/api/portal';
import {
  AppScreen,
  EmptyBlock,
  LoadingBlock,
  ScreenHeader,
  SurfaceCard,
} from '../../../src/components/Ui';
import { PaginationBar, StatusBadge } from '../../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../../src/theme';
import { formatJalaliDateTime } from '../../../src/utils/jalali';

const PAGE_SIZE = 8;

export default function HistoryScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [data, setData] = useState<PortalMyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      const res = await patientMyHistory(token);
      const visits = [...(res.visits ?? [])].sort((a, b) => {
        return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
      });
      setData({ ...res, visits });
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const visits = data?.visits ?? [];
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visits.slice(start, start + PAGE_SIZE);
  }, [visits, page]);

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="سوابق ویزیت" onBack={() => router.back()} />
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <Text style={styles.lead}>از آخرین ویزیت تا اولین — با جزئیات نسخه و دارو</Text>
        {loading && !data ? <LoadingBlock /> : null}
        {error ? <EmptyBlock title="خطا" subtitle={error} /> : null}
        {!loading && visits.length === 0 ? (
          <EmptyBlock title="ویزیتی نیست" subtitle="هنوز سابقه‌ای ثبت نشده است" />
        ) : null}

        {pageItems.map((v) => {
          const open = openId === v.appointmentId;
          return (
            <Pressable
              key={v.appointmentId}
              onPress={() => setOpenId(open ? null : v.appointmentId)}
              style={styles.card}
            >
              <View style={styles.cardHead}>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{v.doctorName || `ویزیت #${v.appointmentId}`}</Text>
                  <Text style={styles.cardMeta}>{formatJalaliDateTime(v.appointmentDate)}</Text>
                </View>
                {v.appointmentStatus ? (
                  <StatusBadge label={v.appointmentStatus} tone="info" />
                ) : null}
              </View>
              {open ? (
                <View style={styles.cardBody}>
                  {v.prescriptionNotes ? (
                    <Text style={styles.note}>یادداشت: {v.prescriptionNotes}</Text>
                  ) : null}
                  {(v.drugs ?? []).length > 0 ? (
                    <View style={styles.drugs}>
                      <Text style={styles.drugsTitle}>داروها</Text>
                      {(v.drugs ?? []).map((d, i) => (
                        <Text key={i} style={styles.drugLine}>
                          • {d.drugName} {d.dosage ? `· ${d.dosage}` : ''}
                          {d.usageInstructions ? `\n  ${d.usageInstructions}` : ''}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyNote}>جزئیات نسخه‌ای ثبت نشده</Text>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <PaginationBar
          page={page}
          pageSize={PAGE_SIZE}
          total={visits.length}
          onChange={setPage}
        />
        {visits.length > 0 ? (
          <SurfaceCard style={{ marginTop: spacing.md }}>
            <Text style={styles.total}>جمع ویزیت‌ها: {visits.length}</Text>
          </SurfaceCard>
        ) : null}
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
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'right' },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  cardBody: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 8,
  },
  drugs: { backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12 },
  drugsTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDeep,
    textAlign: 'right',
    marginBottom: 6,
  },
  drugLine: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 4,
    lineHeight: 20,
  },
  emptyNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right' },
  total: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
});
