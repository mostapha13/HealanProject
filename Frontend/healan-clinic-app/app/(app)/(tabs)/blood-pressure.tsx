import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import { fetchBloodPressureHistory, isTenDigitNationalCode, toAsciiDigits, type NamedRow } from '../../../src/api/healan';
import {
  AppScreen,
  EmptyBlock,
  ListCard,
  LoadingBlock,
  SearchField,
  SurfaceCard,
} from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';

export default function BloodPressureTab() {
  const { getAccessToken } = useAuth();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<NamedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const load = useCallback(async () => {
    const nationalCode = toAsciiDigits(q);
    if (!nationalCode) {
      setRows([]);
      setSearched(false);
      setError(null);
      return;
    }
    if (!isTenDigitNationalCode(nationalCode)) {
      setRows([]);
      setSearched(true);
      setError('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setRows(await fetchBloodPressureHistory(getAccessToken, { nationalCode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, q]);

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.title}>فشار خون</Text>
        <Text style={styles.sub}>جستجو با کد ملی بیمار</Text>
      </SafeAreaView>

      <View style={styles.body}>
        <SearchField
          placeholder="کد ملی..."
          value={q}
          onChangeText={setQ}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={() => void load()}
        />

        <SurfaceCard style={styles.hint}>
          <Text style={styles.hintText}>کد ملی را وارد کنید و جستجو را بزنید.</Text>
        </SurfaceCard>

        {loading ? (
          <LoadingBlock />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => String(item.id)}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            ListEmptyComponent={
              searched ? (
                <EmptyBlock
                  title={error ? 'خطا' : 'موردی نیست'}
                  subtitle={error ?? 'برای این کد ملی ثبتی یافت نشد'}
                />
              ) : null
            }
            renderItem={({ item }) => (
              <ListCard
                title={item.title}
                lines={[item.subtitle, item.meta].filter(Boolean) as string[]}
              />
            )}
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
  hint: { marginBottom: spacing.md },
  hintText: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, textAlign: 'right' },
});
