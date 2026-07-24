import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { config } from '../config';
import { apiGet, apiPost, fetchAllPaginated, type PaginatedPage } from '../api/client';
import { uploadImageFromUri } from '../api/fileUpload';
import {
  AppScreen,
  EmptyBlock,
  FormField,
  FormModal,
  ListCard,
  LoadingBlock,
  PrimaryButton,
  SearchField,
} from '../components/Ui';
import { JalaliCalendarModal } from '../components/JalaliCalendar';
import { colors, fonts, spacing } from '../theme';
import {
  formatJalaliDate,
  jalaliDateTimeToLocal,
  localToJalaliParts,
  toPersianDigits,
} from '../utils/jalali';

const ECHO_IMAGE_TYPE_ID = 2;

type Drug = { drugName: string; dosage: string; usageInstructions: string };
type Lab = { labTestType: string; notes: string; attachmentId?: string };
type Imaging = { imageTypeId: number; notes: string; attachmentId?: string };
type ImageType = { id: number; label: string };

type RxForm = {
  prescriptionId: number;
  appointmentId: number;
  issueDate: string;
  notes: string;
  drugs: Drug[];
  labs: Lab[];
  imaging: Imaging[];
  echo: { lvef: string; conclusion: string; recommendation: string };
};

const emptyDrug = (): Drug => ({ drugName: '', dosage: '', usageInstructions: '' });
const emptyLab = (): Lab => ({ labTestType: '', notes: '', attachmentId: '' });
const emptyImaging = (): Imaging => ({ imageTypeId: 0, notes: '', attachmentId: '' });

function emptyForm(appointmentId = 0): RxForm {
  return {
    prescriptionId: 0,
    appointmentId,
    issueDate: new Date().toISOString().slice(0, 10),
    notes: '',
    drugs: [emptyDrug()],
    labs: [],
    imaging: [],
    echo: { lvef: '', conclusion: '', recommendation: '' },
  };
}

export function PrescriptionModuleView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const params = useLocalSearchParams<{ appointmentId?: string }>();
  const prefillAppointmentId = Number(params.appointmentId ?? 0) || 0;

  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RxForm>(emptyForm(prefillAppointmentId));
  const [imageTypes, setImageTypes] = useState<ImageType[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [section, setSection] = useState<'drugs' | 'labs' | 'imaging' | 'echo'>('drugs');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllPaginated((pageNumber, pageSize) =>
        apiGet<PaginatedPage<Record<string, unknown>>>(
          config.healanApiUrl,
          'OrderResult/PrescriptionList',
          getAccessToken,
          { pageNumber, pageSize, filterText: filter.trim() || undefined }
        )
      );
      setRows(list);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری نسخه‌ها ناموفق بود');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, getAccessToken]);

  const loadImageTypes = useCallback(async () => {
    try {
      const list = await apiGet<Record<string, unknown>[]>(
        config.healanApiUrl,
        'OrderResult/GetImageType',
        getAccessToken
      );
      setImageTypes(
        (Array.isArray(list) ? list : []).map((raw) => ({
          id: Number(raw.imageTypeId ?? raw.id),
          label: String(raw.imageTypeName ?? raw.name ?? `نوع #${raw.imageTypeId ?? raw.id}`),
        }))
      );
    } catch {
      setImageTypes([{ id: ECHO_IMAGE_TYPE_ID, label: 'اکوکاردیوگرافی' }]);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load();
    void loadImageTypes();
  }, [load, loadImageTypes]);

  const [prefillConsumed, setPrefillConsumed] = useState(false);

  useEffect(() => {
    if (prefillAppointmentId > 0 && !prefillConsumed) {
      setForm(emptyForm(prefillAppointmentId));
      setFormOpen(true);
      setPrefillConsumed(true);
    }
  }, [prefillAppointmentId, prefillConsumed]);

  const openNew = () => {
    setForm(emptyForm(prefillAppointmentId));
    setSection('drugs');
    setFormOpen(true);
  };

  const openEdit = async (raw: Record<string, unknown>) => {
    const id = Number(raw.prescriptionId ?? raw.id);
    try {
      const detail = await apiGet<Record<string, unknown>>(
        config.healanApiUrl,
        'OrderResult/PrescriptionInfo',
        getAccessToken,
        { prescriptionId: id }
      );
      const drugs = Array.isArray(detail.prescriptionDrugs)
        ? (detail.prescriptionDrugs as Record<string, unknown>[]).map((d) => ({
            drugName: String(d.drugName ?? ''),
            dosage: String(d.dosage ?? ''),
            usageInstructions: String(d.usageInstructions ?? ''),
          }))
        : [emptyDrug()];
      const labs = Array.isArray(detail.labTestRequests)
        ? (detail.labTestRequests as Record<string, unknown>[]).map((l) => ({
            labTestType: String(l.labTestType ?? ''),
            notes: String(l.notes ?? ''),
            attachmentId: String(l.attachmentId ?? ''),
          }))
        : [];
      const imaging = Array.isArray(detail.imagingRequests)
        ? (detail.imagingRequests as Record<string, unknown>[]).map((i) => ({
            imageTypeId: Number(i.imageTypeId ?? 0),
            notes: String(i.notes ?? ''),
            attachmentId: String(i.attachmentId ?? ''),
          }))
        : [];
      const echoRaw = (detail.echoReport ?? {}) as Record<string, unknown>;
      setForm({
        prescriptionId: id,
        appointmentId: Number(detail.appointmentId ?? raw.appointmentId ?? 0),
        issueDate: String(detail.issueDate ?? detail.prescriptionDate ?? '').slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
        notes: String(detail.notes ?? ''),
        drugs: drugs.length ? drugs : [emptyDrug()],
        labs,
        imaging,
        echo: {
          lvef: String(echoRaw.lvef ?? ''),
          conclusion: String(echoRaw.conclusion ?? ''),
          recommendation: String(echoRaw.recommendation ?? ''),
        },
      });
      setSection('drugs');
      setFormOpen(true);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری نسخه ناموفق بود');
    }
  };

  const pickAttachment = async (onDone: (fileId: string) => void) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('دسترسی', 'دسترسی گالری لازم است');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
      try {
      const uploaded = await uploadImageFromUri(getAccessToken, result.assets[0].uri);
      onDone(uploaded.fileId);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'آپلود ناموفق بود');
    }
  };

  const save = async () => {
    if (!form.appointmentId) {
      Alert.alert('خطا', 'شناسه نوبت الزامی است');
      return;
    }
    setSaving(true);
    try {
      const echoEntries = Object.entries(form.echo).filter(([, v]) => v.trim());
      const echoReport =
        echoEntries.length > 0 ? Object.fromEntries(echoEntries.map(([k, v]) => [k, v.trim()])) : undefined;

      let imaging = form.imaging.filter((i) => i.imageTypeId > 0);
      if (echoReport && !imaging.some((i) => i.imageTypeId === ECHO_IMAGE_TYPE_ID)) {
        imaging = [...imaging, { imageTypeId: ECHO_IMAGE_TYPE_ID, notes: '', attachmentId: '' }];
      }

      const issueYmd = form.issueDate.slice(0, 10);
      const issueParts = issueYmd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const issueIso = issueParts
        ? new Date(
            Number(issueParts[1]),
            Number(issueParts[2]) - 1,
            Number(issueParts[3]),
            12,
            0,
            0
          ).toISOString()
        : new Date().toISOString();

      await apiPost(config.healanApiUrl, 'OrderResult/Register', getAccessToken, {
        ...(form.prescriptionId > 0 ? { prescriptionId: form.prescriptionId } : {}),
        appointmentId: form.appointmentId,
        issueDate: issueIso,
        notes: form.notes.trim() || '',
        prescriptionDrugs: form.drugs
          .filter((d) => d.drugName.trim())
          .map((d) => ({
            drugName: d.drugName.trim(),
            dosage: d.dosage.trim(),
            usageInstructions: d.usageInstructions.trim(),
          })),
        labTestRequests: form.labs
          .filter((l) => l.labTestType.trim())
          .map((l) => ({
            labTestType: l.labTestType.trim(),
            notes: l.notes.trim(),
            ...(l.attachmentId ? { attachmentId: l.attachmentId } : {}),
          })),
        imagingRequests: imaging.map((i) => ({
          imageTypeId: i.imageTypeId,
          notes: i.notes.trim(),
          ...(i.attachmentId ? { attachmentId: i.attachmentId } : {}),
        })),
        ...(echoReport ? { echoReport } : {}),
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره نسخه ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const jalaliParts = localToJalaliParts(`${form.issueDate}T12:00`);

  return (
    <AppScreen>
      <View style={styles.toolbar}>
        <PrimaryButton label="نسخه جدید" onPress={openNew} />
        <Text style={styles.heading}>{title}</Text>
      </View>
      <SearchField value={filter} onChangeText={setFilter} placeholder="جستجو در نسخه‌ها..." />
      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => String(item.prescriptionId ?? item.id ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={<EmptyBlock title="نسخه‌ای نیست" />}
          renderItem={({ item }) => (
            <ListCard
              title={String(item.patientName ?? `نسخه #${item.prescriptionId ?? item.id}`)}
              lines={[
                String(item.doctorName ?? ''),
                formatJalaliDate(String(item.issueDate ?? item.prescriptionDate ?? '')) ||
                  String(item.issueDate ?? item.prescriptionDate ?? ''),
              ].filter(Boolean)}
              onPress={() => void openEdit(item)}
            />
          )}
        />
      )}

      <FormModal
        visible={formOpen}
        title={form.prescriptionId > 0 ? 'ویرایش نسخه' : 'نسخه جدید'}
        onClose={() => setFormOpen(false)}
        onSave={() => void save()}
        saving={saving}
      >
          <FormField
            label="شناسه نوبت"
            value={String(form.appointmentId || '')}
            onChangeText={(v) => setForm({ ...form, appointmentId: Number(v) || 0 })}
            keyboardType="numeric"
          />

          <Text style={styles.label}>تاریخ صدور (شمسی)</Text>
          <Pressable style={styles.dateBtn} onPress={() => setCalendarOpen(true)}>
            <Text style={styles.dateText}>{toPersianDigits(jalaliParts.date)}</Text>
          </Pressable>
          <JalaliCalendarModal
            visible={calendarOpen}
            value={jalaliParts.date}
            onClose={() => setCalendarOpen(false)}
            onSelect={(nextDate) => {
              const local = jalaliDateTimeToLocal(nextDate, '12:00');
              if (local) setForm({ ...form, issueDate: local.slice(0, 10) });
            }}
          />

          <FormField
            label="یادداشت"
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            multiline
          />

          <View style={styles.tabs}>
            {(
              [
                ['drugs', 'دارو'],
                ['labs', 'آزمایش'],
                ['imaging', 'تصویربرداری'],
                ['echo', 'اکو'],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setSection(key)}
                style={[styles.tab, section === key && styles.tabOn]}
              >
                <Text style={styles.tabText}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {section === 'drugs' ? (
            <View>
              {form.drugs.map((d, idx) => (
                <View key={idx} style={styles.block}>
                  <FormField
                    label={`دارو ${idx + 1}`}
                    value={d.drugName}
                    onChangeText={(v) => {
                      const drugs = [...form.drugs];
                      drugs[idx] = { ...d, drugName: v };
                      setForm({ ...form, drugs });
                    }}
                  />
                  <FormField
                    label="دوز"
                    value={d.dosage}
                    onChangeText={(v) => {
                      const drugs = [...form.drugs];
                      drugs[idx] = { ...d, dosage: v };
                      setForm({ ...form, drugs });
                    }}
                  />
                  <FormField
                    label="دستور مصرف"
                    value={d.usageInstructions}
                    onChangeText={(v) => {
                      const drugs = [...form.drugs];
                      drugs[idx] = { ...d, usageInstructions: v };
                      setForm({ ...form, drugs });
                    }}
                    multiline
                  />
                </View>
              ))}
              <PrimaryButton
                label="افزودن دارو"
                onPress={() => setForm({ ...form, drugs: [...form.drugs, emptyDrug()] })}
              />
            </View>
          ) : null}

          {section === 'labs' ? (
            <View>
              {form.labs.map((l, idx) => (
                <View key={idx} style={styles.block}>
                  <FormField
                    label={`آزمایش ${idx + 1}`}
                    value={l.labTestType}
                    onChangeText={(v) => {
                      const labs = [...form.labs];
                      labs[idx] = { ...l, labTestType: v };
                      setForm({ ...form, labs });
                    }}
                  />
                  <FormField
                    label="یادداشت"
                    value={l.notes}
                    onChangeText={(v) => {
                      const labs = [...form.labs];
                      labs[idx] = { ...l, notes: v };
                      setForm({ ...form, labs });
                    }}
                  />
                  <PrimaryButton
                    label={l.attachmentId ? 'تصویر پیوست شد' : 'پیوست تصویر'}
                    onPress={() =>
                      void pickAttachment((fileId) => {
                        setForm((prev) => {
                          const labs = [...prev.labs];
                          labs[idx] = { ...labs[idx], attachmentId: fileId };
                          return { ...prev, labs };
                        });
                      })
                    }
                  />
                </View>
              ))}
              <PrimaryButton
                label="افزودن آزمایش"
                onPress={() => setForm({ ...form, labs: [...form.labs, emptyLab()] })}
              />
            </View>
          ) : null}

          {section === 'imaging' ? (
            <View>
              {form.imaging.map((img, idx) => (
                <View key={idx} style={styles.block}>
                  <Text style={styles.label}>نوع تصویربرداری</Text>
                  <View style={styles.wrap}>
                    {imageTypes.map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => {
                          const imaging = [...form.imaging];
                          imaging[idx] = { ...img, imageTypeId: t.id };
                          setForm({ ...form, imaging });
                        }}
                        style={[styles.chip, img.imageTypeId === t.id && styles.chipOn]}
                      >
                        <Text style={styles.chipText}>{t.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <FormField
                    label="یادداشت"
                    value={img.notes}
                    onChangeText={(v) => {
                      const imaging = [...form.imaging];
                      imaging[idx] = { ...img, notes: v };
                      setForm({ ...form, imaging });
                    }}
                  />
                  <PrimaryButton
                    label={img.attachmentId ? 'تصویر پیوست شد' : 'پیوست تصویر'}
                    onPress={() =>
                      void pickAttachment((fileId) => {
                        setForm((prev) => {
                          const imaging = [...prev.imaging];
                          imaging[idx] = { ...imaging[idx], attachmentId: fileId };
                          return { ...prev, imaging };
                        });
                      })
                    }
                  />
                </View>
              ))}
              <PrimaryButton
                label="افزودن تصویربرداری"
                onPress={() => setForm({ ...form, imaging: [...form.imaging, emptyImaging()] })}
              />
            </View>
          ) : null}

          {section === 'echo' ? (
            <View>
              <FormField
                label="LVEF"
                value={form.echo.lvef}
                onChangeText={(v) => setForm({ ...form, echo: { ...form.echo, lvef: v } })}
              />
              <FormField
                label="نتیجه‌گیری"
                value={form.echo.conclusion}
                onChangeText={(v) => setForm({ ...form, echo: { ...form.echo, conclusion: v } })}
                multiline
              />
              <FormField
                label="توصیه"
                value={form.echo.recommendation}
                onChangeText={(v) =>
                  setForm({ ...form, echo: { ...form.echo, recommendation: v } })
                }
                multiline
              />
              <Text style={styles.hint}>با ذخیره اکو، ردیف تصویربرداری اکو به‌صورت خودکار افزوده می‌شود.</Text>
            </View>
          ) : null}
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 12,
  },
  heading: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, flex: 1, textAlign: 'right' },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 8,
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  dateText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.ink, textAlign: 'right' },
  tabs: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginVertical: spacing.sm },
  tab: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  tabOn: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDeep },
  tabText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  block: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 10,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink },
});
