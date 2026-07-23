import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';
import { PrimaryButton, SurfaceCard } from '../src/components/Ui';
import { colors, fonts, radius, spacing } from '../src/theme';

export default function LoginScreen() {
  const { signIn, loading, lastError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    setBusy(true);
    try {
      await signIn(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const displayError = error || lastError;
  const disabled = busy || loading;

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
          <Text style={styles.headline}>ورود پرسنل</Text>
          <Text style={styles.sub}>نام کاربری و رمز عبور همان حساب کلینیک</Text>
          <Text style={styles.buildMark}>build-v18-login-cors</Text>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <SurfaceCard style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.ink} />
          </View>
          <Text style={styles.cardTitle}>ورود به اپ</Text>
          <Text style={styles.cardSub}>بدون باز شدن صفحه Identity — همین‌جا وارد شوید</Text>

          <Text style={styles.fieldLabel}>نام کاربری</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            placeholder="نام کاربری"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlign="right"
            editable={!disabled}
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>رمز عبور</Text>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              placeholder="رمز عبور"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.passwordInput]}
              textAlign="right"
              editable={!disabled}
              returnKeyType="done"
              onSubmitEditing={() => void onLogin()}
            />
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.muted}
              style={styles.eye}
              onPress={() => setShowPassword((v) => !v)}
            />
          </View>

          <PrimaryButton
            label={disabled ? 'در حال ورود...' : 'ورود'}
            icon="log-in-outline"
            onPress={() => void onLogin()}
            disabled={disabled}
          />
          {displayError ? <Text style={styles.error}>{displayError}</Text> : null}
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
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingLeft: 44 },
  eye: { position: 'absolute', left: 14, top: 14 },
  error: { color: colors.danger, textAlign: 'right', marginTop: spacing.sm, fontFamily: fonts.regular },
});
