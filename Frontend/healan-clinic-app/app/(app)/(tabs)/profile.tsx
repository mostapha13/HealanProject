import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthContext';
import { AppScreen, PrimaryButton, SurfaceCard } from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';
import { config } from '../../../src/config';

export default function ProfileScreen() {
  const { signOut, session } = useAuth();

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.primaryInk} />
        </View>
        <Text style={styles.title}>پروفایل پرسنل</Text>
        <Text style={styles.sub}>ورود با Identity کلینیک</Text>
      </SafeAreaView>

      <View style={styles.body}>
        <SurfaceCard>
          <Text style={styles.rowLabel}>وضعیت نشست</Text>
          <Text style={styles.rowValue}>{session ? 'فعال' : 'خارج شده'}</Text>
          <Text style={[styles.rowLabel, { marginTop: 12 }]}>Identity</Text>
          <Text style={styles.rowMeta}>{config.identityUrl}</Text>
        </SurfaceCard>

        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton label="خروج از حساب" icon="log-out-outline" onPress={() => void signOut()} />
        </View>
      </View>
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
  body: { padding: spacing.md },
  rowLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.muted, textAlign: 'right' },
  rowValue: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'right', marginTop: 4 },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'left',
    writingDirection: 'ltr',
    marginTop: 4,
  },
});
