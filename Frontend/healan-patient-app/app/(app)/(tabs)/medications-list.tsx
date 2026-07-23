import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  patientMedicationDelete,
  patientMedicationList,
  type PortalMedicationItem,
} from '../../../src/api/portal';
import {
  AppScreen,
  EmptyBlock,
  LoadingBlock,
  PrimaryButton,
  ScreenHeader,
} from '../../../src/components/Ui';
import { PaginationBar, StatusBadge } from '../../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../../src/theme';

const PAGE_SIZE = 8;

export default function MedicationsListScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<PortalMedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      setItems(await patientMedicationList(token));
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
        <ScreenHeader title="داروهای ثبت‌شده" onBack={() => router.back()} />
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <PrimaryButton
          label="ثبت داروی جدید"
          icon="add-outline"
          onPress={() => router.push('/(app)/(tabs)/medications')}
        />

        {loading && items.length === 0 ? <LoadingBlock /> : null}
        {!loading && items.length === 0 ? (
          <EmptyBlock title="دارویی نیست" subtitle="اولین یادآور را ثبت کنید" />
        ) : null}

        {pageItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.iconWrap}>
                <Ionicons name="medkit" size={22} color={colors.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.medicationName}</Text>
                {item.dose ? <Text style={styles.dose}>{item.dose}</Text> : null}
              </View>
              <StatusBadge
                label={item.isActive ? 'فعال' : 'غیرفعال'}
                tone={item.isActive ? 'ok' : 'neutral'}
              />
            </View>
            <Text style={styles.meta}>هر {item.intervalHours} ساعت</Text>
            <View style={styles.times}>
              {String(item.timesOfDay || '')
                .split(/[,\s]+/)
                .filter(Boolean)
                .map((t) => (
                  <View key={t} style={styles.timePill}>
                    <Text style={styles.timeText}>{t}</Text>
                  </View>
                ))}
            </View>
            <Pressable
              onPress={() => {
                Alert.alert('حذف دارو', `«${item.medicationName}» حذف شود؟`, [
                  { text: 'انصراف', style: 'cancel' },
                  {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => {
                      void (async () => {
                        const token = await getAccessToken();
                        if (!token) return;
                        await patientMedicationDelete(token, item.id);
                        await load();
                      })();
                    },
                  },
                ]);
              }}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>حذف</Text>
            </Pressable>
          </View>
        ))}

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
  },
  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'right' },
  dose: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  meta: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primaryDeep,
    textAlign: 'right',
    marginTop: 10,
  },
  times: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  timePill: {
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  timeText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.ink },
  deleteBtn: { alignSelf: 'flex-start', marginTop: 12 },
  deleteText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger },
});
