import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { config } from '../config';
import { apiGet, apiPost, fetchAllPaginated, type PaginatedPage } from '../api/client';
import {
  AppScreen,
  EmptyBlock,
  FormModal,
  ListCard,
  LoadingBlock,
  PrimaryButton,
  SearchField,
} from '../components/Ui';
import { colors, fonts, spacing } from '../theme';
import { formatJalaliDateTime, toPersianDigits } from '../utils/jalali';

type QueueRow = {
  id: number;
  title: string;
  subtitle: string;
  meta: string;
  badge: string;
  status: string;
  raw: Record<string, unknown>;
};

type PayMethod = { id: string; label: string };

function asRecord(v: unknown): Record<string, unknown> {
  return (v ?? {}) as Record<string, unknown>;
}

function personName(raw: Record<string, unknown>, nestedKey: string): string {
  const nested = asRecord(raw[nestedKey]);
  return `${String(nested.firstName ?? '')} ${String(nested.lastName ?? '')}`.trim();
}

function isPaidStatus(value: unknown): boolean {
  const s = String(value ?? '').toLowerCase();
  return s === 'paid' || s === 'paied';
}

function isCanceledStatus(value: unknown): boolean {
  const s = String(value ?? '').toLowerCase();
  return s.includes('cancel') || s.includes('لغو');
}

function isPendingStatus(value: unknown): boolean {
  const s = String(value ?? '').toLowerCase();
  return (
    s === 'pending' ||
    s === 'unpaid' ||
    s.includes('در انتظار') ||
    s.includes('پرداخت نشده') ||
    s.includes('پرداخت‌نشده')
  );
}

function pendingInvoice(info: Record<string, unknown>): Record<string, unknown> | null {
  const invoices = (info.invoices ?? info.Invoices) as unknown;
  if (!Array.isArray(invoices) || !invoices.length) return null;

  const statusOf = (inv: unknown) => {
    const r = asRecord(inv);
    return r.invoiceStatusTypeId ?? r.invoiceStatusTypeName ?? r.status;
  };

  const explicitPending = invoices.find((inv) => isPendingStatus(statusOf(inv)));
  if (explicitPending) return asRecord(explicitPending);

  const unpaid = invoices.find((inv) => {
    const status = statusOf(inv);
    return !isPaidStatus(status) && !isCanceledStatus(status);
  });
  return unpaid ? asRecord(unpaid) : null;
}

function invoiceAmountLabel(inv: Record<string, unknown>): string {
  const amount =
    inv.patientPayable ??
    inv.PatientPayable ??
    inv.finalAmount ??
    inv.FinalAmount ??
    inv.totalAmount ??
    inv.TotalAmount ??
    inv.amount ??
    '';
  return String(amount);
}

export function QueueModuleView({ title }: { title: string }) {
  const { getAccessToken } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [methods, setMethods] = useState<PayMethod[]>([]);
  const [methodId, setMethodId] = useState('Cash');
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [infoText, setInfoText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllPaginated((pageNumber, pageSize) =>
        apiGet<PaginatedPage<Record<string, unknown>>>(
          config.healanApiUrl,
          'Appointment/CurrentAppointmentList',
          getAccessToken,
          { pageNumber, pageSize, filterText: filter.trim() || undefined }
        )
      );
      setRows(
        list.map((raw) => {
          const r = asRecord(raw);
          const id = Number(r.appointmentId);
          const patient =
            personName(r, 'patient') || String(r.patientName ?? `بیمار #${r.patientId}`);
          const doctor =
            personName(r, 'doctor') || String(r.doctorName ?? `پزشک #${r.doctorId}`);
          const status = String(r.appointmentTypeId ?? r.appointmentTypeName ?? '');
          return {
            id,
            title: patient,
            subtitle: `${String(r.appointmentTypeName ?? 'نوبت')} · ${doctor}`,
            meta: formatJalaliDateTime(String(r.appointmentDate ?? '')) || String(r.appointmentDate ?? ''),
            badge: String(r.appointmentTypeName ?? (status || 'امروز')),
            status,
            raw: r,
          };
        })
      );
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری صف ناموفق بود');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (appointmentId: number, appointmentTypeId: string) => {
    await apiPost(config.healanApiUrl, 'Appointment/ChangeStatus', getAccessToken, {
      appointmentId,
      appointmentTypeId,
    });
  };

  const openPayFlow = async (row: QueueRow) => {
    setBusy(true);
    try {
      const info = await apiGet<Record<string, unknown>>(
        config.healanApiUrl,
        'Appointment/AppointmentInfo',
        getAccessToken,
        { appointmentId: row.id }
      );
      const inv = pendingInvoice(info);
      const methodList = await apiGet<Record<string, unknown>[]>(
        config.healanApiUrl,
        'Appointment/GetPaymentMethodTypes',
        getAccessToken
      );
      const parsedMethods: PayMethod[] = (Array.isArray(methodList) ? methodList : []).map((m) => {
        const r = asRecord(m);
        return {
          id: String(r.paymentMethodTypeId ?? r.id ?? 'Cash'),
          label: String(r.paymentMethodTypeName ?? r.name ?? r.paymentMethodTypeId ?? 'نقد'),
        };
      });
      setMethods(parsedMethods.length ? parsedMethods : [{ id: 'Cash', label: 'نقد' }]);
      setMethodId(parsedMethods[0]?.id ?? 'Cash');
      setInvoice(inv);
      setSelected(row);
      const amount = inv ? invoiceAmountLabel(inv) : '';
      setInfoText(
        inv
          ? `فاکتور پرداخت‌نشده: ${toPersianDigits(amount)} ریال`
          : 'فاکتور باز یافت نشد — می‌توانید ویزیت را تکمیل کنید'
      );
      setPayOpen(true);
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'بارگذاری فاکتور ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const confirmPayAndComplete = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      if (invoice) {
        const invoiceId = Number(invoice.invoiceId ?? invoice.id);
        await apiPost(config.healanApiUrl, 'Appointment/InvoicePay', getAccessToken, {
          invoiceId,
          paymentReference: `PAY-${Date.now()}`,
          paymentMethodTypeId: methodId,
          description: null,
        });
      }
      await changeStatus(selected.id, 'Completed');
      setPayOpen(false);
      setSheetOpen(false);
      await load();
      Alert.alert('انجام شد', invoice ? 'پرداخت ثبت و ویزیت تکمیل شد' : 'ویزیت تکمیل شد');
    } catch (err) {
      Alert.alert('خطا', err instanceof Error ? err.message : 'پرداخت/تکمیل ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const actions = useMemo(() => {
    if (!selected) return [];
    const status = selected.status;
    const items: { key: string; label: string; danger?: boolean; run: () => Promise<void> }[] = [];
    if (status !== 'InProgress' && status !== 'Completed') {
      items.push({
        key: 'start',
        label: 'شروع ویزیت',
        run: async () => {
          await changeStatus(selected.id, 'InProgress');
          await load();
        },
      });
      items.push({
        key: 'noshow',
        label: 'عدم حضور',
        danger: true,
        run: async () => {
          await changeStatus(selected.id, 'NoShow');
          await load();
        },
      });
    }
    if (status === 'InProgress') {
      items.push({
        key: 'pay',
        label: 'پرداخت و تکمیل ویزیت',
        run: async () => openPayFlow(selected),
      });
      items.push({
        key: 'rx',
        label: 'ثبت نسخه',
        run: async () => {
          router.push({
            pathname: '/(app)/module/[id]',
            params: {
              id: 'prescriptions',
              title: 'نسخه‌ها',
              path: '/prescriptions',
              appointmentId: String(selected.id),
            },
          });
        },
      });
    }
    return items;
  }, [selected, load, router]);

  return (
    <AppScreen>
      <Text style={styles.heading}>{title}</Text>
      <SearchField value={filter} onChangeText={setFilter} placeholder="جستجو در صف..." />
      {loading ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={<EmptyBlock title="نوبتی در صف نیست" />}
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              lines={[item.subtitle, item.meta]}
              badge={item.badge}
              badgeTone={item.status === 'InProgress' ? 'info' : 'neutral'}
              onPress={() => {
                setSelected(item);
                setSheetOpen(true);
              }}
            />
          )}
        />
      )}

      <FormModal
        visible={sheetOpen}
        title={selected?.title ?? 'عملیات نوبت'}
        onClose={() => setSheetOpen(false)}
        onSave={() => setSheetOpen(false)}
        saving={false}
        saveLabel="بستن"
      >
        <Text style={styles.meta}>{selected?.subtitle}</Text>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            style={[styles.actionBtn, a.danger && styles.actionDanger]}
            disabled={busy}
            onPress={() => {
              void (async () => {
                try {
                  await a.run();
                  if (a.key !== 'pay' && a.key !== 'rx') setSheetOpen(false);
                } catch (err) {
                  Alert.alert('خطا', err instanceof Error ? err.message : 'عملیات ناموفق بود');
                }
              })();
            }}
          >
            <Text style={[styles.actionText, a.danger && styles.actionTextDanger]}>{a.label}</Text>
          </Pressable>
        ))}
      </FormModal>

      <FormModal
        visible={payOpen}
        title="پرداخت و تکمیل"
        onClose={() => setPayOpen(false)}
        onSave={() => void confirmPayAndComplete()}
        saving={busy}
        saveLabel={invoice ? 'پرداخت و تکمیل' : 'تکمیل ویزیت'}
      >
          <Text style={styles.meta}>{infoText}</Text>
          {invoice ? (
            <>
              <Text style={styles.label}>روش پرداخت</Text>
              <View style={styles.wrap}>
                {methods.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setMethodId(m.id)}
                    style={[styles.chip, methodId === m.id && styles.chipOn]}
                  >
                    <Text style={styles.chipText}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          <PrimaryButton
            label={busy ? '...' : invoice ? 'پرداخت و تکمیل' : 'تکمیل بدون فاکتور'}
            onPress={() => void confirmPayAndComplete()}
            disabled={busy}
          />
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 8,
  },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  actionDanger: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  actionText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.ink, textAlign: 'right' },
  actionTextDanger: { color: '#DC2626' },
});
