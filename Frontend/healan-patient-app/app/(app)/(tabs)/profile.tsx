import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../src/auth/AuthContext';
import { AppScreen, PrimaryButton, SurfaceCard } from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const name = `${session?.firstName ?? ''} ${session?.lastName ?? ''}`.trim() || 'بیمار';

  return (
    <AppScreen padded={false}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.top}>
        <SafeAreaView edges={['top']} style={styles.topInner}>
          <Pressable onPress={() => router.replace('/(app)/(tabs)')} style={styles.backBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.white} />
          </Pressable>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.primaryDeep} />
          </View>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.sub}>{session?.phoneMasked || session?.phoneNumber}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <SurfaceCard>
          <Row label="نام" value={session?.firstName} />
          <Row label="نام خانوادگی" value={session?.lastName} />
          <Row label="کد ملی" value={session?.nationalCode} />
          <Row label="موبایل" value={session?.phoneNumber} />
          <Row label="شناسه بیمار" value={session?.patientId ? String(session.patientId) : undefined} />
        </SurfaceCard>
        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton label="خروج از حساب" icon="log-out-outline" onPress={() => void signOut()} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: spacing.xl,
  },
  topInner: { alignItems: 'center', paddingHorizontal: spacing.md },
  backBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  avatar: {
    marginTop: spacing.sm,
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.sm, fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: { marginBottom: 12 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.muted, textAlign: 'right' },
  value: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'right', marginTop: 4 },
});
