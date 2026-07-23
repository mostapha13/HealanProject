import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { patientBloodPressureSave } from '../../src/api/portal';
import {
  AppScreen,
  FormField,
  PrimaryButton,
  ScreenHeader,
  SurfaceCard,
} from '../../src/components/Ui';
import { PeriodChips } from '../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../src/theme';

export default function BloodPressureRegisterScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('');
  const [period, setPeriod] = useState(1);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (sys < 60 || sys > 250 || dia < 30 || dia > 150) {
      Alert.alert('خطا', 'مقادیر فشار خون نامعتبر است');
      return;
    }
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      await patientBloodPressureSave(token, {
        systolic: sys,
        diastolic: dia,
        pulse: pulse ? Number(pulse) : null,
        periodOfDay: period,
        measuredTime: time || null,
        note: note.trim() || undefined,
        measuredAt: new Date().toISOString(),
      });
      Alert.alert('ثبت شد', 'فشار خون با موفقیت ذخیره شد', [
        { text: 'مشاهده لیست', onPress: () => router.replace('/(app)/blood-pressure-list') },
        { text: 'باشه' },
      ]);
      setNote('');
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="ثبت فشار خون" onBack={() => router.back()} />
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>اندازه‌گیری جدید</Text>
          <Text style={styles.heroSub}>بازه روز را انتخاب کنید و اعداد را وارد کنید</Text>
        </SurfaceCard>

        <Text style={styles.label}>بازه روز</Text>
        <PeriodChips value={period} onChange={setPeriod} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormField
              label="سیستول (بالا)"
              value={systolic}
              onChangeText={setSystolic}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="دیاستول (پایین)"
              value={diastolic}
              onChangeText={setDiastolic}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormField label="نبض (اختیاری)" value={pulse} onChangeText={setPulse} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="ساعت (HH:mm)" value={time} onChangeText={setTime} />
          </View>
        </View>

        <FormField label="یادداشت" value={note} onChangeText={setNote} multiline />

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>پیش‌نمایش</Text>
          <Text style={styles.previewValue}>
            <Text style={{ color: '#DC2626' }}>{systolic || '—'}</Text>
            {' / '}
            <Text style={{ color: '#2563EB' }}>{diastolic || '—'}</Text>
          </Text>
        </View>

        <PrimaryButton
          label={saving ? 'در حال ذخیره...' : 'ثبت فشار خون'}
          icon="checkmark-circle-outline"
          onPress={() => void save()}
          disabled={saving}
        />
        <PrimaryButton
          label="مشاهده جدول ثبت‌ها"
          onPress={() => router.push('/(app)/blood-pressure-list')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: spacing.xxl, gap: 4 },
  heroCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  heroTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, textAlign: 'right' },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 6,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 8,
  },
  row: { flexDirection: 'row-reverse', gap: 10 },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 18,
    marginVertical: spacing.sm,
  },
  previewLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.muted },
  previewValue: { fontFamily: fonts.bold, fontSize: 32, color: colors.ink, marginTop: 6 },
});
