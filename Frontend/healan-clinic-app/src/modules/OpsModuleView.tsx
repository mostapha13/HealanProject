import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  applyAccessToggle,
  flattenAccessTree,
  getOpsConfig,
  loadAccessRoleTree,
  saveAccessRoleTree,
  type OpsModuleConfig,
} from '../api/ops';
import type { EntityRow } from '../api/crud';
import type { ClinicModuleId } from '../navigation/catalog';
import {
  ActionSheet,
  AppScreen,
  EmptyBlock,
  FormField,
  FormModal,
  ListCard,
  LoadingBlock,
  PrimaryButton,
  SearchField,
  type ActionSheetItem,
} from '../components/Ui';
import { colors, fonts, spacing } from '../theme';
import { apiGet, apiPost, type TokenGetter } from '../api/client';
import { config } from '../config';
import { fetchSmsOutboxPage } from '../api/healan';
import { toPersianDigits } from '../utils/jalali';

export function OpsModuleView({ moduleId, title }: { moduleId: ClinicModuleId; title: string }) {
  const cfg = getOpsConfig(moduleId);
  if (moduleId === 'access-roles') return <AccessRolesView title={title} />;
  if (moduleId === 'sms-settings') return <SmsSettingsView title={title} />;
  if (moduleId === 'site-settings') return <SiteSettingsView title={title} />;
  if (moduleId === 'sms') return <SmsOutboxView title={title} />;
  if (!cfg) return null;
  return <OpsListView config={cfg} title={title} />;
}

function OpsListView({ config, title }: { config: OpsModuleConfig; title: string }) {
  const { getAccessToken } = useAuth();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EntityRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await config.load(getAccessToken, filter.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config, filter, getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const sheetItems: ActionSheetItem[] = useMemo(() => {
    if (!selected) return [];
    return config.actions(selected).map((a) => ({
      key: a.key,
      label: a.label,
      danger: a.danger,
      onPress: () => {
        void (async () => {
          try {
            await a.run(getAccessToken, selected);
            await load();
          } catch (err) {
            Alert.alert('خطا', err instanceof Error ? err.message : 'عملیات ناموفق بود');
          }
        })();
      },
    }));
  }, [config, selected, getAccessToken, load]);

  return (
    <AppScreen>
      <Text style={styles.count}>{rows.length} مورد · لمس برای اکشن‌ها</Text>
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
            <EmptyBlock title={error ? 'خطا در بارگذاری' : 'موردی نیست'} subtitle={error ?? undefined} />
          }
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              badge={item.badge}
              badgeTone={item.badgeTone}
              lines={[item.subtitle, item.meta].filter(Boolean) as string[]}
              onPress={() => {
                setSelected(item);
                setSheetOpen(true);
              }}
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
    </AppScreen>
  );
}

function AccessRolesView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const [roles, setRoles] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<Record<string, unknown>[]>([]);
  const [flat, setFlat] = useState<{ key: string; title: string; hasAccess: boolean }[]>([]);
  const [roleId, setRoleId] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = getOpsConfig('access-roles');
      setRoles(cfg ? await cfg.load(getAccessToken) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const openRole = async (row: EntityRow) => {
    const id = String(row.raw.id ?? row.raw.roleId ?? row.meta ?? '');
    if (!id) {
      Alert.alert('خطا', 'شناسه نقش یافت نشد');
      return;
    }
    setRoleId(id);
    setRoleTitle(row.title);
    setLoading(true);
    try {
      const items = await loadAccessRoleTree(getAccessToken, id);
      setTree(items);
      setFlat(flattenAccessTree(items));
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری درخت دسترسی ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: string, value: boolean) => {
    const next = applyAccessToggle(tree, key, value);
    setTree(next);
    setFlat(flattenAccessTree(next));
  };

  const save = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      await saveAccessRoleTree(getAccessToken, roleId, tree);
      Alert.alert('ثبت شد', `دسترسی نقش «${roleTitle}» ذخیره شد`);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  if (roleId) {
    return (
      <AppScreen>
        <View style={styles.toolbar}>
          <PrimaryButton label="بازگشت" onPress={() => { setRoleId(''); setTree([]); setFlat([]); }} />
          <PrimaryButton label={saving ? '...' : 'ذخیره دسترسی'} onPress={() => void save()} disabled={saving} />
        </View>
        <Text style={styles.heading}>{title}: {roleTitle}</Text>
        {loading ? (
          <LoadingBlock />
        ) : (
          <FlatList
            data={flat}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            renderItem={({ item }) => (
              <View style={styles.accessRow}>
                <Switch
                  value={item.hasAccess}
                  onValueChange={(v) => toggle(item.key, v)}
                  trackColor={{ false: colors.line, true: colors.primary }}
                />
                <Text style={styles.accessTitle}>{item.title}</Text>
              </View>
            )}
          />
        )}
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.hint}>یک نقش را انتخاب کنید تا منوهای مجاز را فعال/غیرفعال کنید.</Text>
      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => `${item.id}-${item.meta}`}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadRoles()} />}
          ListEmptyComponent={<EmptyBlock title={error ? 'خطا' : 'نقشی نیست'} subtitle={error ?? undefined} />}
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              lines={[item.subtitle, item.meta].filter(Boolean) as string[]}
              onPress={() => void openRole(item)}
            />
          )}
        />
      )}
    </AppScreen>
  );
}

function SmsOutboxView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<{ id: number; title: string; subtitle?: string; meta?: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSmsOutboxPage(getAccessToken, page, pageSize);
      setRows(res.items);
      setTotal(res.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت پیامک‌ها');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppScreen>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.hint}>
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} · مجموع {toPersianDigits(total)}
      </Text>
      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => `${item.id}-${item.title}`}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyBlock title={error ? 'خطا' : 'پیامکی نیست'} subtitle={error ?? undefined} />
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  disabled={page >= totalPages}
                  onPress={() => setPage((p) => p + 1)}
                  style={[styles.pagerBtn, page >= totalPages && { opacity: 0.4 }]}
                >
                  <Text style={styles.pagerText}>بعدی</Text>
                </Pressable>
                <Text style={styles.pagerLabel}>
                  {toPersianDigits(page)} / {toPersianDigits(totalPages)}
                </Text>
                <Pressable
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={[styles.pagerBtn, page <= 1 && { opacity: 0.4 }]}
                >
                  <Text style={styles.pagerText}>قبلی</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ListCard title={item.title} lines={[item.subtitle, item.meta].filter(Boolean) as string[]} />
          )}
        />
      )}
    </AppScreen>
  );
}

function SmsSettingsView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const [form, setForm] = useState({
    apiKey: '',
    apiKeyMasked: '',
    hasApiKey: false,
    templateId: '',
    lineNumber: '',
    verifyParameterName: 'Code',
    sendEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await apiGet<Record<string, unknown>>(
        config.healanApiUrl,
        'ClinicReports/SmsSettings',
        getAccessToken
      );
      setForm({
        apiKey: '',
        apiKeyMasked: String(raw.apiKeyMasked ?? raw.ApiKeyMasked ?? ''),
        hasApiKey: Boolean(raw.hasApiKey ?? raw.HasApiKey),
        templateId: String(raw.templateId ?? raw.TemplateId ?? ''),
        lineNumber: String(raw.lineNumber ?? raw.LineNumber ?? ''),
        verifyParameterName: String(raw.verifyParameterName ?? raw.VerifyParameterName ?? 'Code'),
        sendEnabled: Boolean(raw.sendEnabled ?? raw.SendEnabled ?? true),
      });
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری تنظیمات ناموفق بود');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const templateId = Number(form.templateId);
    const lineNumber = Number(form.lineNumber);
    if (!Number.isFinite(templateId) || templateId <= 0) {
      Alert.alert('خطا', 'TemplateId باید عدد معتبر باشد');
      return;
    }
    if (!Number.isFinite(lineNumber) || lineNumber <= 0) {
      Alert.alert('خطا', 'شماره خط باید عدد معتبر باشد');
      return;
    }
    setSaving(true);
    try {
      await apiPost(config.healanApiUrl, 'ClinicReports/SmsSettingsSave', getAccessToken, {
        ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
        templateId,
        lineNumber,
        verifyParameterName: form.verifyParameterName.trim() || 'Code',
        sendEnabled: form.sendEnabled,
      });
      Alert.alert('ثبت شد', 'تنظیمات پیامک ذخیره شد');
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <LoadingBlock />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Text style={styles.heading}>{title}</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.metaHint}>
          {form.hasApiKey
            ? `کلید فعلی: ${form.apiKeyMasked || '••••••••'}`
            : 'کلید API هنوز تنظیم نشده است'}
        </Text>
        <FormField
          label="ApiKey جدید (خالی = بدون تغییر)"
          value={form.apiKey}
          onChangeText={(v) => setForm({ ...form, apiKey: v })}
        />
        <FormField
          label="TemplateId"
          value={form.templateId}
          onChangeText={(v) => setForm({ ...form, templateId: v })}
          keyboardType="numeric"
        />
        <FormField
          label="شماره خط"
          value={form.lineNumber}
          onChangeText={(v) => setForm({ ...form, lineNumber: v })}
          keyboardType="numeric"
        />
        <FormField
          label="نام پارامتر کد"
          value={form.verifyParameterName}
          onChangeText={(v) => setForm({ ...form, verifyParameterName: v })}
        />
        <View style={styles.accessRow}>
          <Switch
            value={form.sendEnabled}
            onValueChange={(v) => setForm({ ...form, sendEnabled: v })}
            trackColor={{ false: colors.line, true: colors.primary }}
          />
          <Text style={styles.accessTitle}>ارسال فعال باشد</Text>
        </View>
        <PrimaryButton label={saving ? '...' : 'ذخیره تنظیمات'} onPress={() => void save()} disabled={saving} />
      </ScrollView>
    </AppScreen>
  );
}

function SiteSettingsView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await apiGet<unknown>(
        config.healanApiUrl,
        'PortalContent/SettingList',
        getAccessToken
      );
      let list: Record<string, unknown>[] = [];
      if (Array.isArray(raw)) {
        list = raw as Record<string, unknown>[];
      } else if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        const items = o.items ?? o.Items ?? o.settings ?? o.Settings;
        if (Array.isArray(items)) list = items as Record<string, unknown>[];
      }
      setRows(list);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری ناموفق بود');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveOne = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const editId = Number(edit.portalSiteSettingId ?? edit.PortalSiteSettingId ?? edit.id);
      const next = rows.map((r) => {
        const id = Number(r.portalSiteSettingId ?? r.PortalSiteSettingId ?? r.id);
        return id === editId ? { ...r, settingValue: value, SettingValue: value } : r;
      });
      await apiPost(config.healanApiUrl, 'PortalContent/SettingSave', getAccessToken, {
        settings: next.map((r) => ({
          portalSiteSettingId: Number(r.portalSiteSettingId ?? r.PortalSiteSettingId ?? r.id) || undefined,
          settingKey: String(r.settingKey ?? r.SettingKey ?? r.key ?? ''),
          settingValue: String(r.settingValue ?? r.SettingValue ?? ''),
          settingGroup: (r.settingGroup ?? r.SettingGroup ?? r.group ?? null) as string | null,
          description: (r.description ?? r.Description ?? null) as string | null,
        })),
      });
      setEdit(null);
      await load();
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <Text style={styles.heading}>{title}</Text>
      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => String(item.portalSiteSettingId ?? item.id ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={<EmptyBlock title="تنظیمی نیست" />}
          renderItem={({ item }) => (
            <ListCard
              title={String(item.settingKey ?? item.key ?? 'تنظیم')}
              lines={[String(item.settingValue ?? item.SettingValue ?? ''), String(item.settingGroup ?? '')]}
              onPress={() => {
                setEdit(item);
                setValue(String(item.settingValue ?? item.SettingValue ?? ''));
              }}
            />
          )}
        />
      )}
      <FormModal
        visible={!!edit}
        title={String(edit?.settingKey ?? 'ویرایش تنظیم')}
        onClose={() => setEdit(null)}
        onSave={() => void saveOne()}
        saving={saving}
      >
        <FormField label="مقدار" value={value} onChangeText={setValue} multiline />
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  count: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  metaHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: spacing.sm,
  },
  accessRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 12,
  },
  accessTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  pager: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: 8,
  },
  pagerBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pagerText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primaryDeep },
  pagerLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft },
});
