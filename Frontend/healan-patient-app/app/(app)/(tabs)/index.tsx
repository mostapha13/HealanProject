import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/AuthContext';
import { useSite } from '../../../src/site/SiteContext';
import { AppScreen, BankHeader, SiteHeroCarousel } from '../../../src/components/Ui';
import { LargeActionCard, ServiceCard, SmallTile } from '../../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../../src/theme';

const SMALL = [
  { title: 'لیست رزروها', icon: 'list-outline' as const, href: '/(app)/(tabs)/bookings' },
  { title: 'لیست فشار خون', icon: 'pulse-outline' as const, href: '/(app)/(tabs)/blood-pressure-list' },
  { title: 'لیست داروها', icon: 'medkit-outline' as const, href: '/(app)/(tabs)/medications-list' },
  { title: 'سوابق ویزیت', icon: 'time-outline' as const, href: '/(app)/(tabs)/history' },
  { title: 'چت‌بات', icon: 'chatbubbles-outline' as const, href: '/(app)/(tabs)/assistant' },
  { title: 'درباره ما', icon: 'information-circle-outline' as const, href: '/(app)/(tabs)/about' },
  { title: 'تماس', icon: 'call-outline' as const, href: '/(app)/(tabs)/contact' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { slides, content, loading, refresh } = useSite();
  const name = `${session?.firstName ?? ''} ${session?.lastName ?? ''}`.trim();

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <BankHeader
          brand="کلینیک قلب و عروق دکتر معصومه شهرویی"
          subtitle={
            content.about.board ||
            'فارغ التحصیل و دارای بورد تخصصی از بیمارستان فوق تخصصی شهید رجایی تهران'
          }
        />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
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
            onPress={() => router.push('/(app)/(tabs)/blood-pressure')}
          />
          <LargeActionCard
            title="ثبت یادآوری دارو"
            subtitle="زمان‌بندی مصرف داروهای روزانه"
            icon="alarm"
            onPress={() => router.push('/(app)/(tabs)/medications')}
          />
          <LargeActionCard
            title="گفتگو با چت‌بات"
            subtitle="سوال درباره نوبت، دارو و مراقبت قلب"
            icon="chatbubbles"
            onPress={() => router.push('/(app)/(tabs)/assistant')}
          />
        </View>

        <Text style={[styles.section, { marginTop: spacing.md }]}>خدمات مطب</Text>
        {content.services.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesRow}
          >
            {content.services.map((s) => (
              <ServiceCard
                key={s.id}
                title={s.title}
                body={s.body || s.subtitle}
                color={s.color}
                compact
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyHint, { paddingHorizontal: spacing.md, marginBottom: spacing.lg }]}>
            {loading ? 'در حال دریافت خدمات...' : 'هنوز خدمتی از سایت دریافت نشده است'}
          </Text>
        )}
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
  emptyHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
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
  servicesRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    gap: 8,
  },
});
