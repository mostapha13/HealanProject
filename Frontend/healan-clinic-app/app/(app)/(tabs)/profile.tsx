import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import { fetchCurrentUser, type CurrentUserInfo } from '../../../src/api/healan';
import { AppScreen, LoadingBlock, PrimaryButton, SurfaceCard } from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { signOut, getAccessToken } = useAuth();
  const [user, setUser] = useState<CurrentUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUser(await fetchCurrentUser(getAccessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت پروفایل');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName =
    user && `${user.firstName} ${user.lastName}`.trim()
      ? `${user.firstName} ${user.lastName}`.trim()
      : 'پروفایل پرسنل';

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.primaryInk} />
        </View>
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.sub}>{user?.userTypeName || user?.roleTitle || 'کاربر کلینیک'}</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        {loading && !user ? (
          <LoadingBlock />
        ) : (
          <SurfaceCard>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <InfoRow label="نام" value={user?.firstName} />
            <InfoRow label="نام خانوادگی" value={user?.lastName} />
            <InfoRow label="نام کاربری" value={user?.userName} />
            <InfoRow label="موبایل" value={user?.phoneNumber} />
            <InfoRow label="نوع کاربر" value={user?.userTypeName} />
            <InfoRow label="نقش" value={user?.roleTitle} />
            <InfoRow
              label="وضعیت"
              value={
                user?.isActive === undefined ? undefined : user.isActive ? 'فعال' : 'غیرفعال'
              }
            />
            {!user && !error ? (
              <Text style={styles.rowValue}>اطلاعات کاربری در دسترس نیست</Text>
            ) : null}
          </SurfaceCard>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton label="خروج از حساب" icon="log-out-outline" onPress={() => void signOut()} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    marginTop: spacing.md,
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.sm, fontFamily: fonts.bold, fontSize: 20, color: colors.primaryInk },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  infoRow: { marginBottom: 12 },
  rowLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.muted, textAlign: 'right' },
  rowValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'right',
    marginBottom: 12,
  },
});
