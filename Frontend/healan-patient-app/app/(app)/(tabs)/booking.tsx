import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  bookingCreate,
  bookingDoctors,
  bookingMyList,
  bookingOpenSlots,
  type PortalBookingDoctor,
  type PortalBookingItem,
  type PortalOpenSlot,
} from '../../../src/api/portal';
import {
  AppScreen,
  EmptyBlock,
  LoadingBlock,
  PrimaryButton,
  ScreenHeader,
} from '../../../src/components/Ui';
import {
  SlotChip,
  StatusBadge,
  bookingStatusTone,
} from '../../../src/components/PatientUi';
import { colors, fonts, spacing } from '../../../src/theme';
import { formatJalaliDate, formatJalaliDateTime, toPersianDigits } from '../../../src/utils/jalali';

const NOTE_MAX = 100;

function dayKey(iso: string) {
  const m = String(iso).match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return toPersianDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  );
}

export default function BookingTabScreen() {
  const router = useRouter();
  const { getAccessToken, session } = useAuth();
  const [doctors, setDoctors] = useState<PortalBookingDoctor[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [slots, setSlots] = useState<PortalOpenSlot[]>([]);
  const [mine, setMine] = useState<PortalBookingItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const [docs, list] = await Promise.all([
        bookingDoctors(),
        token ? bookingMyList(token) : Promise.resolve([] as PortalBookingItem[]),
      ]);
      setDoctors(docs);
      setMine(list);
      setDoctorId((prev) => prev ?? docs[0]?.doctorId ?? null);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const loadSlots = useCallback(async (id: number) => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    try {
      const list = await bookingOpenSlots({
        doctorId: id,
        fromDate: from.toISOString().slice(0, 10),
        toDate: to.toISOString().slice(0, 10),
      });
      setSlots(list);
      const days = [...new Set(list.map((s) => dayKey(s.startAt)).filter(Boolean))];
      setSelectedDay((prev) => (prev && days.includes(prev) ? prev : days[0] ?? null));
      setSelectedSlotId(null);
    } catch {
      setSlots([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setDone(false);
      void load();
    }, [load])
  );

  useEffect(() => {
    if (doctorId) void loadSlots(doctorId);
  }, [doctorId, loadSlots]);

  const days = useMemo(() => {
    const keys = [...new Set(slots.map((s) => dayKey(s.startAt)).filter(Boolean))];
    return keys.sort();
  }, [slots]);

  const daySlots = useMemo(
    () => slots.filter((s) => dayKey(s.startAt) === selectedDay),
    [slots, selectedDay]
  );

  const activeMine = mine.filter((b) => {
    const st = bookingStatusTone(b.status, b.statusTitle);
    return st.tone === 'ok';
  });

  const submit = async () => {
    if (!selectedSlotId) {
      Alert.alert('انتخاب زمان', 'یک ساعت خالی را انتخاب کنید');
      return;
    }
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('نشست منقضی شده');
      await bookingCreate(token, {
        appointmentSlotId: selectedSlotId,
        note: note.trim() || undefined,
      });
      setDone(true);
      setNote('');
      setSelectedSlotId(null);
      await load();
      if (doctorId) await loadSlots(doctorId);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'رزرو ناموفق');
    } finally {
      setSaving(false);
    }
  };

  const name = `${session?.firstName ?? ''} ${session?.lastName ?? ''}`.trim();

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primaryDeep }}>
        <ScreenHeader title="رزرو نوبت" onBack={() => router.replace('/(app)/(tabs)')} />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.lead}>
          {name ? `${name} عزیز، ` : ''}پزشک، روز و ساعت را مثل سایت اصلی انتخاب کنید
        </Text>
        {done ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>رزرو با موفقیت ثبت شد</Text>
            <Text style={styles.doneSub}>می‌توانید رزروهای خود را در لیست ببینید</Text>
            <PrimaryButton label="مشاهده رزروها" onPress={() => router.push('/(app)/(tabs)/bookings')} />
            <PrimaryButton label="رزرو دیگر" onPress={() => setDone(false)} />
          </View>
        ) : null}

        {activeMine.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>رزروهای فعال شما</Text>
            {activeMine.slice(0, 3).map((b) => {
              const st = bookingStatusTone(b.status, b.statusTitle);
              return (
                <View key={b.appointmentBookingId} style={styles.mineRow}>
                  <StatusBadge label={st.label} tone={st.tone} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mineDoctor}>{b.doctorName || 'نوبت'}</Text>
                    <Text style={styles.mineWhen}>{formatJalaliDateTime(b.startAt)}</Text>
                  </View>
                </View>
              );
            })}
            <Pressable onPress={() => router.push('/(app)/(tabs)/bookings')}>
              <Text style={styles.link}>مشاهده همه رزروها</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>انتخاب زمان</Text>

          <Text style={styles.label}>یادداشت (اختیاری)</Text>
          <TextInput
            value={note}
            onChangeText={(v) => setNote(v.slice(0, NOTE_MAX))}
            placeholder="توضیح کوتاه برای پذیرش..."
            placeholderTextColor={colors.muted}
            textAlign="right"
            multiline
            style={styles.note}
          />
          <Text style={styles.counter}>{note.length}/{NOTE_MAX}</Text>

          {doctors.length > 1 ? (
            <>
              <Text style={styles.label}>پزشک</Text>
              <View style={styles.chips}>
                {doctors.map((d) => {
                  const active = doctorId === d.doctorId;
                  return (
                    <Pressable
                      key={d.doctorId}
                      onPress={() => setDoctorId(d.doctorId)}
                      style={[styles.docChip, active && styles.docChipActive]}
                    >
                      <Text style={[styles.docText, active && styles.docTextActive]}>
                        {`${d.firstName} ${d.lastName}`.trim()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>روز</Text>
          {loading ? <LoadingBlock /> : null}
          {!loading && days.length === 0 ? (
            <EmptyBlock title="روز خالی نیست" subtitle="در دو هفته آینده زمانی آزاد نیست" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.dayRow}>
                {days.map((d) => {
                  const active = selectedDay === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        setSelectedDay(d);
                        setSelectedSlotId(null);
                      }}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                    >
                      <Text style={[styles.dayText, active && styles.dayTextActive]}>
                        {formatJalaliDate(d) || d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <Text style={styles.label}>ساعت‌های خالی</Text>
          <View style={styles.slotGrid}>
            {daySlots.map((s) => (
              <SlotChip
                key={s.appointmentSlotId}
                label={timeLabel(s.startAt)}
                selected={selectedSlotId === s.appointmentSlotId}
                onPress={() => setSelectedSlotId(s.appointmentSlotId)}
              />
            ))}
          </View>
          {!loading && selectedDay && daySlots.length === 0 ? (
            <Text style={styles.emptyDay}>برای این روز ساعتی نیست</Text>
          ) : null}

          <View style={{ marginTop: spacing.md }}>
            <Pressable
              onPress={() => void submit()}
              disabled={saving}
              style={[styles.submit, saving && { opacity: 0.6 }]}
            >
              <Text style={styles.submitText}>{saving ? 'در حال ثبت...' : 'ثبت رزرو'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.white, textAlign: 'right', marginTop: 4 },
  lead: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 20,
  },
  body: { padding: spacing.md, paddingBottom: spacing.xxl, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 8,
  },
  note: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.bg,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'left',
    marginTop: 4,
  },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  docChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  docChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDeep },
  docText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },
  docTextActive: { color: colors.primaryDeep },
  dayRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 },
  dayChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  dayChipActive: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  dayText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },
  dayTextActive: { color: colors.white },
  slotGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  emptyDay: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right' },
  submit: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  mineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  mineDoctor: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textAlign: 'right' },
  mineWhen: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  link: {
    marginTop: 10,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  doneCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: spacing.md,
    gap: 10,
  },
  doneTitle: { fontFamily: fonts.bold, fontSize: 17, color: '#047857', textAlign: 'right' },
  doneSub: { fontFamily: fonts.regular, fontSize: 13, color: '#065F46', textAlign: 'right' },
});
