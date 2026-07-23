import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccess } from '../../../src/access/AccessContext';
import {
  AppScreen,
  EmptyBlock,
  ListCard,
  LoadingBlock,
  SearchField,
} from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';

export default function ServicesScreen() {
  const router = useRouter();
  const { home, loading } = useAccess();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return home.allServices;
    return home.allServices.filter(
      (m) => m.title.toLowerCase().includes(query) || m.path.toLowerCase().includes(query)
    );
  }, [home.allServices, q]);

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.title}>خدمات کلینیک</Text>
        <Text style={styles.sub}>منوها بر اساس سطح دسترسی شما از API</Text>
      </SafeAreaView>
      <View style={styles.body}>
        <SearchField placeholder="جستجوی منو..." value={q} onChangeText={setQ} />
        {loading && home.allServices.length === 0 ? (
          <LoadingBlock />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.path}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            ListEmptyComponent={<EmptyBlock title="موردی یافت نشد" />}
            renderItem={({ item }) => (
              <ListCard
                title={item.title}
                lines={[item.path]}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/module/[id]',
                    params: { id: item.id, title: item.title, path: item.path },
                  })
                }
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
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primaryInk,
    textAlign: 'right',
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 4,
  },
  body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
});
