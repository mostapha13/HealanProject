import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthContext';
import { AppScreen, FormField, PrimaryButton } from '../src/components/Ui';
import { colors, fonts, spacing } from '../src/theme';
import { isValidMobile, normalizePhone } from '../src/utils/phone';

export default function LoginScreen() {
  const { requestOtp, verifyOtp, lastError } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [masked, setMasked] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    const p = normalizePhone(phone);
    if (!isValidMobile(p)) {
      setError('شماره موبایل را ۱۱ رقمی وارد کنید (مثال: 09123456789)');
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(p);
      setPhone(p);
      setMasked(res.phoneMasked);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال کد ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError(null);
    const p = normalizePhone(phone);
    const codeAscii = code
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/\D/g, '');
    if (codeAscii.length < 4) {
      setError('کد تأیید را وارد کنید');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(p, codeAscii);
    } catch (err) {
      setError(err instanceof Error ? err.message : lastError || 'ورود ناموفق');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen padded={false}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.brand}>هیلن بیمار</Text>
          <Text style={styles.tagline}>سوابق، فشار خون، دارو و نوبت — همه در یک اپ</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>{step === 'phone' ? 'ورود با موبایل' : 'کد تأیید'}</Text>
        <Text style={styles.sub}>
          {step === 'phone'
            ? 'شماره موبایل ۱۱ رقمی خود را وارد کنید تا کد پیامک شود'
            : `کد ارسال‌شده به ${masked || phone} را وارد کنید`}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 'phone' ? (
          <FormField
            label="موبایل"
            value={phone}
            onChangeText={(v) => {
              setError(null);
              setPhone(v);
            }}
            keyboardType="phone-pad"
            placeholder="09123456789"
          />
        ) : (
          <FormField
            label="کد تأیید"
            value={code}
            onChangeText={(v) => {
              setError(null);
              setCode(v);
            }}
            keyboardType="number-pad"
            placeholder="------"
          />
        )}

        <PrimaryButton
          label={busy ? 'لطفاً صبر کنید...' : step === 'phone' ? 'دریافت کد' : 'ورود'}
          onPress={() => void (step === 'phone' ? sendOtp() : confirm())}
          disabled={busy}
        />

        {step === 'code' ? (
          <PrimaryButton
            label="تغییر شماره / ارسال مجدد"
            onPress={() => {
              setStep('phone');
              setCode('');
              setError(null);
            }}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  brand: {
    marginTop: spacing.xl,
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.white,
    textAlign: 'right',
  },
  tagline: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    lineHeight: 22,
  },
  card: {
    marginTop: -24,
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, textAlign: 'right' },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 20,
  },
  error: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'right',
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 10,
    lineHeight: 20,
  },
});
