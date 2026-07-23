import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { patientMedicationSave } from '../../src/api/portal';
import {
  AppScreen,
  FormField,
  PrimaryButton,
  ScreenHeader,
  SurfaceCard,
} from '../../src/components/Ui';
import { colors, fonts, spacing } from '../../src/theme';

const INTERVALS = [4, 6, 8, 10, 12, 24];

function computeTimes(firstDose: string, intervalHours: number): string[] {
  const m = firstDose.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return [];
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return [];
  const out: string[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let i = 0; i < 24 / intervalHours; i++) {
    out.push(`${pad(h % 24)}:${pad(min)}`);
    h += intervalHours;
  }
  return out;
}

export default function MedicationsRegisterScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [interval, setInterval] = useState(8);
  const [firstDose, setFirstDose] = useState('08:00');
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => computeTimes(firstDose, interval), [firstDose, interval]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('خطا', 'نام دارو الزامی است');
      return;
    }
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      await patientMedicationSave(token, {
        medicationName: name.trim(),
        dose: dose.trim() || undefined,
        intervalHours: interval,
        firstDoseTime: firstDose,
        isActive: true,
      });
      Alert.alert('ثبت شد', 'یادآور دارو ذخیره شد', [
        { text: 'مشاهده لیست', onPress: () => router.replace('/(app)/medications-list') },
        { text: 'باشه' },
      ]);
      setName('');
      setDose('');
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="ثبت یادآوری دارو" onBack={() => router.back()} />
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <SurfaceCard style={styles.hero}>
          <Text style={styles.heroTitle}>برنامه مصرف دارو</Text>
          <Text style={styles.heroSub}>نام، دوز و فاصله زمانی را مشخص کنید</Text>
        </SurfaceCard>

        <FormField label="نام دارو" value={name} onChangeText={setName} placeholder="مثلاً آسپرین" />
        <FormField label="دوز" value={dose} onChangeText={setDose} placeholder="مثلاً ۸۰ میلی‌گرم" />
        <FormField label="اولین دوز (HH:mm)" value={firstDose} onChangeText={setFirstDose} />

        <Text style={styles.label}>فاصله مصرف (ساعت)</Text>
        <View style={styles.chips}>
          {INTERVALS.map((h) => (
            <Pressable
              key={h}
              onPress={() => setInterval(h)}
              style={[styles.chip, interval === h && styles.chipActive]}
            >
              <Text style={[styles.chipText, interval === h && styles.chipTextActive]}>{h}س</Text>
            </Pressable>
          ))}
        </View>

        <SurfaceCard style={styles.preview}>
          <Text style={styles.previewTitle}>ساعات پیشنهادی امروز</Text>
          <View style={styles.times}>
            {preview.length === 0 ? (
              <Text style={styles.previewEmpty}>ساعت اول را درست وارد کنید</Text>
            ) : (
              preview.map((t) => (
                <View key={t} style={styles.timePill}>
                  <Text style={styles.timeText}>{t}</Text>
                </View>
              ))
            )}
          </View>
        </SurfaceCard>

        <PrimaryButton
          label={saving ? 'در حال ذخیره...' : 'ثبت یادآور'}
          icon="alarm-outline"
          onPress={() => void save()}
          disabled={saving}
        />
        <PrimaryButton
          label="مشاهده داروهای ثبت‌شده"
          onPress={() => router.push('/(app)/medications-list')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: { marginBottom: spacing.md, backgroundColor: colors.primarySoft, borderColor: colors.primary },
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
    marginTop: 4,
  },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.white },
  preview: { marginBottom: spacing.md },
  previewTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 10,
  },
  times: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  timePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primaryDeep },
  previewEmpty: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});
