import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthContext';
import { AppScreen, FormField, PrimaryButton } from '../src/components/Ui';
import { colors, fonts, spacing } from '../src/theme';

export default function LoginScreen() {
  const { requestOtp, verifyOtp, lastError } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [masked, setMasked] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    const p = phone.replace(/\D/g, '');
    if (p.length < 10) {
      Alert.alert('خطا', 'شماره موبایل را درست وارد کنید');
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(p);
      setMasked(res.phoneMasked);
      setStep('code');
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ارسال کد ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.trim().length < 4) {
      Alert.alert('خطا', 'کد تأیید را وارد کنید');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(phone.replace(/\D/g, ''), code.trim());
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : lastError || 'ورود ناموفق');
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
            ? 'شماره موبایلی که با آن در کلینیک ثبت شده‌اید را وارد کنید'
            : `کد ارسال‌شده به ${masked || phone} را وارد کنید`}
        </Text>

        {step === 'phone' ? (
          <FormField
            label="موبایل"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="09xxxxxxxxx"
          />
        ) : (
          <FormField
            label="کد تأیید"
            value={code}
            onChangeText={setCode}
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
            label="تغییر شماره"
            onPress={() => {
              setStep('phone');
              setCode('');
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
});
