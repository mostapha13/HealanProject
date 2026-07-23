import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import { fetchPortalHeroSlides, type PortalHeroSlide } from '../../../src/api/portal';
import { AppScreen, BankHeader, SiteHeroCarousel } from '../../../src/components/Ui';
import { LargeActionCard, SmallTile } from '../../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../../src/theme';

const SMALL = [
  { title: 'لیست رزروها', icon: 'list-outline' as const, href: '/(app)/bookings' },
  { title: 'لیست فشار خون', icon: 'pulse-outline' as const, href: '/(app)/blood-pressure-list' },
  { title: 'لیست داروها', icon: 'medkit-outline' as const, href: '/(app)/medications-list' },
  { title: 'سوابق ویزیت', icon: 'time-outline' as const, href: '/(app)/history' },
  { title: 'پروفایل', icon: 'person-outline' as const, href: '/(app)/(tabs)/profile' },
  { title: 'داشبورد', icon: 'grid-outline' as const, href: '/(app)/(tabs)/dashboard' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [slides, setSlides] = useState<PortalHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setSlides(await fetchPortalHeroSlides());
    } catch {
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const name = `${session?.firstName ?? ''} ${session?.lastName ?? ''}`.trim();

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <BankHeader />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              void load();
            }}
            tintColor={colors.primaryDeep}
          />
        }
      >
        <Text style={styles.hello}>{name ? `سلام ${name}` : 'سلام'}</Text>
        <Text style={styles.helloSub}>منطقه بیمار — همه‌چیز برای مراقبت روزانه شما</Text>

        <View style={styles.carouselWrap}>
          <SiteHeroCarousel
            slides={slides}
            fallbackTitle="همراه سلامت شما"
            fallbackSubtitle="نوبت، دارو، فشار خون و گفتگو با دستیار هوشمند"
          />
        </View>

        <Text style={styles.section}>لیست‌ها</Text>
        <View style={styles.smallGrid}>
          {SMALL.map((item) => (
            <SmallTile
              key={item.href}
              title={item.title}
              icon={item.icon}
              onPress={() => router.push(item.href as never)}
            />
          ))}
        </View>

        <Text style={styles.section}>ثبت سریع</Text>
        <View style={{ paddingHorizontal: spacing.md }}>
          <LargeActionCard
            title="ثبت رزرو نوبت"
            subtitle="انتخاب پزشک، روز و ساعت خالی مثل سایت"
            icon="calendar"
            onPress={() => router.push('/(app)/(tabs)/booking')}
          />
          <LargeActionCard
            title="ثبت فشار خون"
            subtitle="صبح، ظهر یا شب — سریع و دقیق"
            icon="heart"
            onPress={() => router.push('/(app)/blood-pressure')}
          />
          <LargeActionCard
            title="ثبت یادآوری دارو"
            subtitle="زمان‌بندی مصرف داروهای روزانه"
            icon="alarm"
            onPress={() => router.push('/(app)/medications')}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  hello: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'right',
  },
  helloSub: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
  },
  carouselWrap: { marginBottom: spacing.lg },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
  },
  smallGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'flex-start',
  },
});
