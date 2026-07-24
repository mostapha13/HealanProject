import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import {
  getCrudConfig,
  type CrudModuleConfig,
  type EntityRow,
  type EnumOption,
  type FormFieldDef,
} from '../api/crud';
import type { ClinicModuleId } from '../navigation/catalog';
import {
  ActionSheet,
  AppScreen,
  EmptyBlock,
  FormField,
  FormModal,
  LoadingBlock,
  PrimaryButton,
  SearchField,
  SwitchRow,
  type ActionSheetItem,
} from '../components/Ui';
import { colors, fonts, spacing } from '../theme';
import { ListCard } from '../components/Ui';
import { jalaliDateTimeToLocal, localToJalaliParts, toPersianDigits } from '../utils/jalali';
import { JalaliCalendarModal } from '../components/JalaliCalendar';

function fieldValue(form: Record<string, string | boolean | number>, key: string): string {
  const v = form[key];
  if (typeof v === 'boolean') return v ? '1' : '0';
  return v == null ? '' : String(v);
}

function normalizeTimeValue(value: string): string {
  const m = value.trim().match(/^(\d{1,2}):(\d{1,2})/);
  if (!m) return '09:00';
  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function dateOnlyFromValue(value?: string | null): string {
  if (!value) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return dateOnlyFromValue(null);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CrudModuleView({
  moduleId,
  title,
}: {
  moduleId: ClinicModuleId;
  title: string;
}) {
  const config = getCrudConfig(moduleId);
  if (!config) return null;
  return <CrudModuleInner config={config} title={title} />;
}

function SelectPickerField({
  field,
  options,
  value,
  onChange,
}: {
  field: FormFieldDef;
  options: EnumOption[];
  value: number;
  onChange: (key: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.key === value);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(needle) || String(o.key).includes(needle)
    );
  }, [options, q]);

  // Small enums stay as chips
  if (options.length > 0 && options.length <= 8 && field.kind !== 'select') {
    return (
      <View style={styles.optionBlock}>
        <Text style={styles.optionLabel}>{field.label}</Text>
        <View style={styles.optionWrap}>
          {options.map((opt) => {
            const active = value === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => onChange(opt.key)}
                style={[styles.optionChip, active && styles.optionChipActive]}
              >
                <Text style={styles.optionChipText}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>{field.label}</Text>
      <Pressable
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
        style={styles.selectTrigger}
      >
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
        <Text style={[styles.selectTriggerText, !selected && styles.selectPlaceholder]} numberOfLines={1}>
          {selected?.label || field.placeholder || 'انتخاب کنید'}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.closeXBtn} accessibilityLabel="بستن">
                <Ionicons name="close" size={22} color="#DC2626" />
              </Pressable>
              <Text style={styles.pickerTitle}>{field.label}</Text>
            </View>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="جستجو..."
              placeholderTextColor={colors.muted}
              textAlign="right"
              style={styles.pickerSearch}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.key)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>موردی یافت نشد</Text>
              }
              renderItem={({ item }) => {
                const active = item.key === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.key);
                      setOpen(false);
                    }}
                    style={[styles.pickerRow, active && styles.pickerRowActive]}
                  >
                    <Text style={styles.pickerRowText}>{item.label}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function parseCsvIds(value: string): number[] {
  return value
    .split(/[,\s]+/)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function MultiSelectField({
  field,
  options,
  value,
  onChange,
}: {
  field: FormFieldDef;
  options: EnumOption[];
  value: string;
  onChange: (csv: string) => void;
}) {
  const selected = new Set(parseCsvIds(value));
  const toggle = (key: number) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next].join(','));
  };

  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>{field.label}</Text>
      <View style={styles.optionWrap}>
        {options.map((opt) => {
          const active = selected.has(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => toggle(opt.key)}
              style={[styles.optionChip, active && styles.optionChipActive]}
            >
              <Text style={styles.optionChipText}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {!options.length ? (
        <Text style={styles.jalaliHint}>خدمت فعالی برای انتخاب نیست</Text>
      ) : null}
    </View>
  );
}

function JalaliDateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (local: string) => void;
}) {
  const parts = localToJalaliParts(value || null);
  const [date, setDate] = useState(parts.date);
  const [time, setTime] = useState(parts.time);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const p = localToJalaliParts(value || null);
    setDate(p.date);
    setTime(p.time);
  }, [value]);

  const commit = (nextDate: string, nextTime: string) => {
    const local = jalaliDateTimeToLocal(nextDate, nextTime);
    if (local) onChange(local);
  };

  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.jalaliRow}>
        <View style={styles.jalaliHalf}>
          <Text style={styles.jalaliHint}>تاریخ شمسی</Text>
          <Pressable style={styles.calendarTrigger} onPress={() => setCalendarOpen(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.primaryDeep} />
            <Text style={styles.calendarTriggerText}>{toPersianDigits(date)}</Text>
          </Pressable>
        </View>
        <View style={styles.jalaliHalf}>
          <Text style={styles.jalaliHint}>ساعت</Text>
          <TextInput
            value={time}
            onChangeText={(v) => {
              setTime(v);
              commit(date, v);
            }}
            placeholder="09:30"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            textAlign="right"
            style={styles.jalaliInput}
          />
        </View>
      </View>

      <JalaliCalendarModal
        visible={calendarOpen}
        value={date}
        onClose={() => setCalendarOpen(false)}
        onSelect={(nextDate) => {
          setDate(nextDate);
          commit(nextDate, time);
        }}
      />
    </View>
  );
}

function JalaliDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (ymd: string) => void;
}) {
  const ymd = dateOnlyFromValue(value);
  const parts = localToJalaliParts(`${ymd}T12:00`);
  const [date, setDate] = useState(parts.date);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const next = dateOnlyFromValue(value);
    setDate(localToJalaliParts(`${next}T12:00`).date);
  }, [value]);

  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Pressable style={styles.calendarTrigger} onPress={() => setCalendarOpen(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.primaryDeep} />
        <Text style={styles.calendarTriggerText}>{toPersianDigits(date)}</Text>
      </Pressable>
      <JalaliCalendarModal
        visible={calendarOpen}
        value={date}
        onClose={() => setCalendarOpen(false)}
        onSelect={(nextDate) => {
          setDate(nextDate);
          const local = jalaliDateTimeToLocal(nextDate, '12:00');
          if (local) onChange(local.slice(0, 10));
        }}
      />
    </View>
  );
}

const TIME_HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_MINUTES = [0, 15, 30, 45];

function TimePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
}) {
  const normalized = normalizeTimeValue(value || '09:00');
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(Number(normalized.slice(0, 2)));
  const [minute, setMinute] = useState(Number(normalized.slice(3, 5)));

  useEffect(() => {
    const n = normalizeTimeValue(value || '09:00');
    const h = Number(n.slice(0, 2));
    const rawM = Number(n.slice(3, 5));
    const m = TIME_MINUTES.reduce((best, cur) =>
      Math.abs(cur - rawM) < Math.abs(best - rawM) ? cur : best
    );
    setHour(h);
    setMinute(m);
  }, [value]);

  const commit = (h: number, m: number) => {
    const nearest = TIME_MINUTES.reduce((best, cur) =>
      Math.abs(cur - m) < Math.abs(best - m) ? cur : best
    );
    onChange(`${String(h).padStart(2, '0')}:${String(nearest).padStart(2, '0')}`);
  };

  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Pressable style={styles.selectTrigger} onPress={() => setOpen(true)}>
        <Ionicons name="time-outline" size={18} color={colors.primaryDeep} />
        <Text style={styles.selectTriggerText}>{toPersianDigits(normalized)}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.closeXBtn} accessibilityLabel="بستن">
                <Ionicons name="close" size={22} color="#DC2626" />
              </Pressable>
              <Text style={styles.pickerTitle}>{label}</Text>
            </View>
            <Text style={styles.timeSectionHint}>ساعت</Text>
            <View style={styles.timeChipWrap}>
              {TIME_HOURS.map((h) => {
                const active = hour === h;
                return (
                  <Pressable
                    key={h}
                    onPress={() => {
                      setHour(h);
                      commit(h, minute);
                    }}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                  >
                    <Text style={styles.optionChipText}>{toPersianDigits(String(h).padStart(2, '0'))}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.timeSectionHint}>دقیقه</Text>
            <View style={styles.timeChipWrap}>
              {TIME_MINUTES.map((m) => {
                const active = minute === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      setMinute(m);
                      commit(hour, m);
                      setOpen(false);
                    }}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                  >
                    <Text style={styles.optionChipText}>{toPersianDigits(String(m).padStart(2, '0'))}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CrudModuleInner({ config, title }: { config: CrudModuleConfig; title: string }) {
  const { getAccessToken } = useAuth();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(config.emptyForm);
  const [selected, setSelected] = useState<EntityRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [options, setOptions] = useState<Record<string, EnumOption[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filter.trim() || undefined;
      setRows(await config.load(getAccessToken, q));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت داده');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config, filter, getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!config.loadOptions) return;
    void config.loadOptions(getAccessToken).then(setOptions).catch(() => setOptions({}));
  }, [config, getAccessToken]);

  const openCreate = () => {
    setForm({ ...config.emptyForm });
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (row: EntityRow) => {
    setSelected(row);
    setForm(config.fromRow(row));
    setFormOpen(true);
  };

  const onSave = async () => {
    for (const field of config.fields) {
      if (!field.required) continue;
      const raw = form[field.key];
      const v = fieldValue(form, field.key).trim();
      if (!v) {
        Alert.alert('خطا', `${field.label} الزامی است`);
        return;
      }
      // شناسه‌های عددی الزامی نباید صفر باشند؛ dayOfWeek=0 (یکشنبه) مجاز است
      if (
        typeof raw === 'number' &&
        raw <= 0 &&
        field.key !== 'dayOfWeek' &&
        (field.kind === 'select' ||
          field.key.endsWith('Id') ||
          field.key === 'doctorId' ||
          field.key === 'patientId' ||
          field.key === 'serviceTypeId')
      ) {
        Alert.alert('خطا', `${field.label} الزامی است`);
        return;
      }
    }
    setSaving(true);
    try {
      await config.save(getAccessToken, form);
      setFormOpen(false);
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (row: EntityRow) => {
    if (!config.remove) return;
    Alert.alert('حذف', `«${row.title}» حذف شود؟`, [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await config.remove!(getAccessToken, row);
              await load();
            } catch (err) {
              Alert.alert('خطا', err instanceof Error ? err.message : 'حذف ناموفق بود');
            }
          })();
        },
      },
    ]);
  };

  const onToggle = async (row: EntityRow) => {
    if (!config.toggleActive) return;
    try {
      await config.toggleActive(getAccessToken, row);
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
    }
  };

  const sheetItems: ActionSheetItem[] = useMemo(() => {
    if (!selected) return [];
    const items: ActionSheetItem[] = [];
    if (config.canEdit) {
      items.push({ key: 'edit', label: 'ویرایش', onPress: () => openEdit(selected) });
    }
    if (config.canToggleActive && config.toggleActive) {
      items.push({
        key: 'toggle',
        label: selected.isActive === false ? 'فعال‌سازی' : 'غیرفعال‌سازی',
        onPress: () => void onToggle(selected),
      });
    }
    if (config.canDelete && config.remove) {
      items.push({
        key: 'delete',
        label: 'حذف',
        danger: true,
        onPress: () => onDelete(selected),
      });
    }
    return items;
  }, [config, selected]);

  const setField = (key: string, value: string) => {
    const current = form[key];
    if (typeof current === 'boolean') {
      setForm({ ...form, [key]: value === '1' || value === 'true' });
      return;
    }
    if (typeof current === 'number') {
      const n = Number(value);
      setForm({ ...form, [key]: Number.isFinite(n) ? n : 0 });
      return;
    }
    setForm({ ...form, [key]: value });
  };

  return (
    <AppScreen>
      <View style={styles.toolbar}>
        {config.canCreate ? (
          <PrimaryButton label="افزودن" icon="add-outline" onPress={openCreate} />
        ) : null}
        <Text style={styles.count}>{rows.length} مورد</Text>
      </View>

      <SearchField
        placeholder={`جستجو در ${title}...`}
        value={filter}
        onChangeText={setFilter}
        onSubmitEditing={() => void load()}
        returnKeyType="search"
      />

      {loading && rows.length === 0 ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => `${item.id}-${item.title}`}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyBlock
              title={error ? 'خطا در بارگذاری' : 'موردی نیست'}
              subtitle={error ?? 'هنوز موردی ثبت نشده است'}
            />
          }
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              badge={item.badge}
              lines={[item.subtitle, item.meta].filter(Boolean) as string[]}
              onPress={
                config.canEdit || config.canDelete || config.canToggleActive
                  ? () => {
                      setSelected(item);
                      setSheetOpen(true);
                    }
                  : undefined
              }
            />
          )}
        />
      )}

      <ActionSheet
        visible={sheetOpen}
        title={selected?.title}
        items={sheetItems}
        onClose={() => setSheetOpen(false)}
      />

      <FormModal
        visible={formOpen}
        title={selected ? `ویرایش ${title}` : `افزودن ${title}`}
        onClose={() => setFormOpen(false)}
        onSave={() => void onSave()}
        saving={saving}
      >
        {config.fields.map((field) => {
          if (field.kind === 'datetime-jalali') {
            return (
              <JalaliDateTimeField
                key={field.key}
                label={field.label}
                value={fieldValue(form, field.key)}
                onChange={(local) => setForm({ ...form, [field.key]: local })}
              />
            );
          }

          if (field.kind === 'date-jalali') {
            return (
              <JalaliDateField
                key={field.key}
                label={field.label}
                value={fieldValue(form, field.key)}
                onChange={(ymd) => setForm({ ...form, [field.key]: ymd })}
              />
            );
          }

          if (field.kind === 'time') {
            return (
              <TimePickerField
                key={field.key}
                label={field.label}
                value={fieldValue(form, field.key)}
                onChange={(hhmm) => setForm({ ...form, [field.key]: hhmm })}
              />
            );
          }

          if (field.kind === 'multi-select') {
            return (
              <MultiSelectField
                key={field.key}
                field={field}
                options={options[field.key] ?? []}
                value={fieldValue(form, field.key)}
                onChange={(csv) => setForm({ ...form, [field.key]: csv })}
              />
            );
          }

          const opts = options[field.key];
          if (opts?.length || field.kind === 'select') {
            return (
              <SelectPickerField
                key={field.key}
                field={field}
                options={opts ?? []}
                value={Number(form[field.key]) || 0}
                onChange={(key) => setForm({ ...form, [field.key]: key })}
              />
            );
          }

          return (
            <FormField
              key={field.key}
              label={field.label}
              value={fieldValue(form, field.key)}
              onChangeText={(v) => setField(field.key, v)}
              placeholder={field.placeholder}
              keyboardType={
                field.keyboard === 'numeric'
                  ? 'numeric'
                  : field.keyboard === 'phone-pad'
                    ? 'phone-pad'
                    : field.keyboard === 'email-address'
                      ? 'email-address'
                      : 'default'
              }
              multiline={field.multiline}
            />
          );
        })}
        {config.canToggleActive ? (
          <SwitchRow
            label="فعال"
            value={Boolean(form.isActive)}
            onValueChange={(v) => setForm({ ...form, isActive: v })}
          />
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
  count: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  optionBlock: { marginBottom: spacing.sm },
  optionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 6,
  },
  optionWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  optionChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryDeep,
  },
  optionChipText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
  selectTrigger: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  selectTriggerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  selectPlaceholder: { color: colors.muted },
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pickerTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  pickerClose: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primaryDeep },
  closeXBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearch: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  pickerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pickerRowActive: { backgroundColor: colors.primarySoft },
  pickerRowText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  pickerEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  jalaliRow: { flexDirection: 'row-reverse', gap: 10 },
  jalaliHalf: { flex: 1 },
  jalaliHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: 4,
  },
  jalaliInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  calendarTrigger: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  calendarTriggerText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  timeSectionHint: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: 8,
  },
  timeChipWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
