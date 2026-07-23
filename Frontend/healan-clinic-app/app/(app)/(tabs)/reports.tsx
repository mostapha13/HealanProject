import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccess } from '../../../src/access/AccessContext';
import { FeatureCard, AppScreen, EmptyBlock } from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';
import type { ClinicModuleId } from '../../../src/navigation/catalog';

const REPORT_IDS: ClinicModuleId[] = ['reports', 'sms', 'sms-settings', 'workflow', 'signature'];

export default function ReportsTab() {
  const router = useRouter();
  const { home } = useAccess();
  const items = home.allServices.filter((m) => REPORT_IDS.includes(m.id)).slice(0, 6);

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.title}>گزارش و پیامک</Text>
        <Text style={styles.sub}>تحلیل و ارتباطات کلینیک</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.grid}>
        {items.length === 0 ? (
          <EmptyBlock title="دسترسی گزارش ندارید" />
        ) : (
          <View style={styles.wrap}>
            {items.map((item) => (
              <FeatureCard
                key={item.path}
                title={item.title}
                icon={item.icon}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/module/[id]',
                    params: { id: item.id, title: item.title, path: item.path },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
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
  grid: { padding: spacing.md, paddingBottom: spacing.xxl },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
});
