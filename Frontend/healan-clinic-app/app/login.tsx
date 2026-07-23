import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';
import { getRedirectUri } from '../src/auth/oidc';
import { PrimaryButton, SurfaceCard } from '../src/components/Ui';
import { colors, fonts, radius, spacing } from '../src/theme';
import { config } from '../src/config';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>هیلن کلینیک</Text>
            <View style={styles.logo}>
              <Text style={styles.logoLetter}>H</Text>
            </View>
          </View>
          <Text style={styles.headline}>اپ پذیرش کلینیک</Text>
          <Text style={styles.sub}>طراحی موبایل‌محور · منوها از سطح دسترسی شما</Text>
          <Text style={styles.buildMark}>build-v9-home</Text>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <SurfaceCard style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.ink} />
          </View>
          <Text style={styles.cardTitle}>ورود پرسنل</Text>
          <Text style={styles.cardSub}>با همان حساب Identity کلینیک</Text>
          <PrimaryButton
            label={busy || loading ? 'در حال ورود...' : 'ورود امن'}
            icon="log-in-outline"
            onPress={() => void onLogin()}
            disabled={busy || loading}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.meta}>Redirect: {getRedirectUri()}</Text>
          <Text style={styles.meta}>{config.identityUrl}</Text>
        </SurfaceCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.lg,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: colors.primary, fontFamily: fonts.bold, fontSize: 20 },
  brand: { fontFamily: fonts.bold, fontSize: 22, color: colors.primaryInk },
  headline: {
    marginTop: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.primaryInk,
    textAlign: 'right',
  },
  sub: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
  },
  buildMark: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'right',
  },
  body: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  card: { borderRadius: radius.xl },
  cardIcon: {
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, textAlign: 'right' },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.md,
    marginTop: 4,
  },
  error: { color: colors.danger, textAlign: 'right', marginTop: spacing.sm, fontFamily: fonts.regular },
  meta: {
    marginTop: 8,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'left',
    writingDirection: 'ltr',
    fontFamily: fonts.regular,
  },
});
