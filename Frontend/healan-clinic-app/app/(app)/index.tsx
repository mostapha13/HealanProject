import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { useAccess } from '../../src/access/AccessContext';
import { fetchDashboardStats, type DashboardStats } from '../../src/api/healan';
import {
  AppScreen,
  GhostButton,
  HeroHeader,
  LoadingBlock,
  MenuTile,
  SectionTitle,
  StatTile,
  SurfaceCard,
} from '../../src/components/Ui';
import { colors, fonts, radius, spacing } from '../../src/theme';

const QUICK = [
  { id: 'queue', title: 'صف انتظار', path: '/queue', icon: 'people-outline' as const },
  { id: 'appointments', title: 'نوبت‌ها', path: '/appointments', icon: 'calendar-outline' as const },
  { id: 'patients', title: 'بیماران', path: '/patients', icon: 'person-outline' as const },
  { id: 'prescriptions', title: 'نسخه‌ها', path: '/prescriptions', icon: 'document-text-outline' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, getAccessToken } = useAuth();
  const { sections, loading: menuLoading, reload } = useAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setStats(await fetchDashboardStats(getAccessToken));
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
      void reload();
    }, [load, reload])
  );

  const openModule = (id: string, title: string, path: string) => {
    router.push({
      pathname: '/(app)/module/[id]',
      params: { id, title, path },
    });
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <HeroHeader
          title="میز کار کلینیک"
          subtitle="طراحی کارتی · همه بخش‌ها با دسترسی شما"
          right={<GhostButton label="خروج" onPress={() => void signOut()} />}
        />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading || menuLoading}
            onRefresh={() => {
              setLoading(true);
              void load();
              void reload();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <SectionTitle title="وضعیت امروز" />
        {loading && !stats ? (
          <LoadingBlock />
        ) : (
          <View style={styles.statGrid}>
            <StatTile
              label="نوبت امروز"
              value={stats?.todayAppointments ?? '—'}
              icon="calendar-outline"
              tone="primary"
            />
            <StatTile
              label="صف انتظار"
              value={stats?.waitingAppointments ?? '—'}
              icon="people-outline"
              tone="warning"
            />
            <StatTile
              label="در حال ویزیت"
              value={stats?.inProgressAppointments ?? '—'}
              icon="pulse-outline"
              tone="accent"
            />
            <StatTile
              label="تکمیل‌شده"
              value={stats?.completedToday ?? '—'}
              icon="checkmark-circle-outline"
              tone="success"
            />
          </View>
        )}

        <SectionTitle title="میانبرهای روز" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickStrip}
        >
          {QUICK.map((q) => (
            <Pressable
              key={q.id}
              onPress={() => openModule(q.id, q.title, q.path)}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.88 }]}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={q.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>{q.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {sections.map((section) => (
          <View key={section.key} style={styles.sectionBlock}>
            <SectionTitle title={section.title} />
            <View style={styles.menuGrid}>
              {section.items.map((item) => (
                <MenuTile
                  key={`${section.key}-${item.path}`}
                  title={item.title}
                  subtitle="ورود به بخش"
                  icon={item.icon}
                  onPress={() => openModule(item.id, item.title, item.path)}
                />
              ))}
            </View>
          </View>
        ))}

        {!menuLoading && sections.length === 0 ? (
          <SurfaceCard style={styles.emptyMenus} tone="warning">
            <Ionicons name="lock-closed-outline" size={28} color={colors.muted} />
            <Text style={styles.emptyText}>منویی برای این حساب تعریف نشده است</Text>
          </SurfaceCard>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickStrip: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  quickChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 108,
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  sectionBlock: { marginTop: spacing.sm },
  menuGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emptyMenus: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
