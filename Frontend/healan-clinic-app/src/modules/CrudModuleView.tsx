import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  getCrudConfig,
  type CrudModuleConfig,
  type EntityRow,
  type EnumOption,
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

function fieldValue(form: Record<string, string | boolean | number>, key: string): string {
  const v = form[key];
  if (typeof v === 'boolean') return v ? '1' : '0';
  return v == null ? '' : String(v);
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
      const v = fieldValue(form, field.key).trim();
      if (!v) {
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
          const opts = options[field.key];
          if (opts?.length) {
            return (
              <View key={field.key} style={styles.optionBlock}>
                <Text style={styles.optionLabel}>{field.label}</Text>
                <View style={styles.optionWrap}>
                  {opts.map((opt) => {
                    const active = Number(form[field.key]) === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setForm({ ...form, [field.key]: opt.key })}
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
});
