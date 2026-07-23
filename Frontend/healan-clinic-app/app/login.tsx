import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthContext';
import { getRedirectUri } from '../src/auth/oidc';
import { PrimaryButton, Subtitle, Title } from '../src/components/Ui';
import { colors, spacing } from '../src/theme';
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Healan</Text>
        <Title>ورود پرسنل کلینیک</Title>
        <Subtitle>با همان حساب Identity سامانه پذیرش وارد شوید.</Subtitle>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label={busy || loading ? 'در حال ورود...' : 'ورود با حساب کلینیک'}
          onPress={() => void onLogin()}
          disabled={busy || loading}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.meta}>Identity: {config.identityUrl}</Text>
        <Text style={styles.meta}>Redirect: {getRedirectUri()}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: spacing.xl,
  },
  brand: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  meta: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
