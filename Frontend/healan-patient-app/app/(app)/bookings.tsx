import React, { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { bookingCancel, bookingMyList, type PortalBookingItem } from '../../src/api/portal';
import {
  AppScreen,
  EmptyBlock,
  LoadingBlock,
  PrimaryButton,
  ScreenHeader,
} from '../../src/components/Ui';
import {
  PaginationBar,
  StatusBadge,
  bookingStatusTone,
} from '../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../src/theme';
import { formatJalaliDateTime } from '../../src/utils/jalali';

const PAGE_SIZE = 10;

export default function BookingsListScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<PortalBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      const list = await bookingMyList(token);
      const sorted = [...list].sort(
        (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
      );
      setItems(sorted);
      setPage(1);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'خطا');
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

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="رزروهای نوبت" onBack={() => router.back()} />
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <PrimaryButton
          label="رزرو نوبت جدید"
          icon="add-outline"
          onPress={() => router.push('/(app)/(tabs)/booking')}
        />

        {loading && items.length === 0 ? <LoadingBlock /> : null}
        {!loading && items.length === 0 ? (
          <EmptyBlock title="رزروی نیست" subtitle="هنوز نوبتی رزرو نکرده‌اید" />
        ) : null}

        {pageItems.map((b) => {
          const st = bookingStatusTone(b.status, b.statusTitle);
          return (
            <View key={b.appointmentBookingId} style={styles.card}>
              <View style={styles.head}>
                <StatusBadge label={st.label} tone={st.tone} />
                <Text style={styles.title}>{b.doctorName || 'نوبت'}</Text>
              </View>
              <Text style={styles.when}>{formatJalaliDateTime(b.startAt)}</Text>
              <Text style={styles.meta}>
                تا {formatJalaliDateTime(b.endAt)} · کد رزرو {b.appointmentBookingId}
              </Text>
              {st.tone === 'ok' ? (
                <PrimaryButton
                  label="لغو این نوبت"
                  onPress={() => {
                    Alert.alert('لغو نوبت', 'این رزرو لغو شود؟', [
                      { text: 'خیر', style: 'cancel' },
                      {
                        text: 'لغو',
                        style: 'destructive',
                        onPress: () => {
                          void (async () => {
                            const token = await getAccessToken();
                            if (!token) return;
                            await bookingCancel(token, b.appointmentBookingId);
                            await load();
                          })();
                        },
                      },
                    ]);
                  }}
                />
              ) : null}
            </View>
          );
        })}

        <PaginationBar page={page} pageSize={PAGE_SIZE} total={items.length} onChange={setPage} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: spacing.xxl, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 8,
  },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'right' },
  when: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primaryDeep, textAlign: 'right' },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right' },
});
