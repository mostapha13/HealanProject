import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';
import { getRedirectUri } from '../src/auth/oidc';
import { PrimaryButton, SurfaceCard } from '../src/components/Ui';
import { colors, radius, spacing, typography } from '../src/theme';
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
    <LinearGradient colors={['#073F3F', colors.primary, '#1F8A8A']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Ionicons name="heart" size={28} color={colors.white} />
          </View>
          <Text style={styles.brand}>Healan</Text>
          <Text style={styles.headline}>اپ حرفه‌ای پذیرش کلینیک</Text>
          <Text style={styles.sub}>
            طراحی موبایل‌محور، کارت‌محور و هم‌تراز با دسترسی‌های سامانه کلینیک
          </Text>
        </View>

        <SurfaceCard style={styles.card}>
          <Text style={styles.cardTitle}>ورود پرسنل</Text>
          <Text style={styles.cardSub}>با همان حساب Identity کلینیک وارد شوید</Text>
          <PrimaryButton
            label={busy || loading ? 'در حال ورود...' : 'ورود امن'}
            icon="log-in-outline"
            onPress={() => void onLogin()}
            disabled={busy || loading}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.metaBox}>
            <Text style={styles.meta}>Identity: {config.identityUrl}</Text>
            <Text style={styles.meta}>Redirect: {getRedirectUri()}</Text>
          </View>
        </SurfaceCard>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: { marginTop: spacing.xl },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  brand: {
    ...typography.hero,
    color: colors.white,
    textAlign: 'right',
  },
  headline: {
    ...typography.title,
    color: colors.white,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  sub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.section, color: colors.ink, textAlign: 'right' },
  cardSub: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.md,
    marginTop: 4,
  },
  error: { color: colors.danger, textAlign: 'right', marginTop: spacing.sm },
  metaBox: { marginTop: spacing.md, gap: 4 },
  meta: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
