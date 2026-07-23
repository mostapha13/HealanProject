import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  appointmentPatientLabel,
  doctorDisplayName,
  fetchAppointments,
  fetchBlogPosts,
  fetchBloodPressureHistory,
  fetchBookingReservations,
  fetchBookingSchedules,
  fetchClinicAnalytics,
  fetchCompanies,
  fetchDoctors,
  fetchInsurance,
  fetchMedicalFees,
  fetchPatients,
  fetchPortalContent,
  fetchPrescriptions,
  fetchRagChatLogs,
  fetchRagKnowledge,
  fetchRagSettingCards,
  fetchReviews,
  fetchRoles,
  fetchSeoPages,
  fetchServices,
  fetchSiteSettings,
  fetchSmsOutbox,
  fetchSmsSettings,
  fetchTodayAppointments,
  fetchUsers,
  patientDisplayName,
  type NamedRow,
} from '../../../src/api/healan';
import type { ClinicModuleId } from '../../../src/navigation/catalog';
import {
  AppScreen,
  EmptyBlock,
  ListCard,
  LoadingBlock,
  SearchField,
  SurfaceCard,
} from '../../../src/components/Ui';
import { colors, fonts, spacing } from '../../../src/theme';

type Row = NamedRow & { badge?: string };

export default function ModuleScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const params = useLocalSearchParams<{ id?: string; title?: string; path?: string }>();
  const moduleId = (params.id || 'generic') as ClinicModuleId;
  const title = String(params.title || 'بخش');

  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const load = useCallback(async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const q = filter.trim() || undefined;
      switch (moduleId) {
        case 'dashboard': {
          setInfo('میانبرهای عملیاتی روز — از اینجا سریع وارد صف، نوبت و بیماران شوید.');
          setRows([
            { id: 1, title: 'صف انتظار', subtitle: 'نوبت‌های امروز', meta: '/queue', badge: 'سریع' },
            { id: 2, title: 'نوبت‌ها', subtitle: 'تقویم نوبت‌ها', meta: '/appointments' },
            { id: 3, title: 'بیماران', subtitle: 'جستجو و پرونده', meta: '/patients' },
            { id: 4, title: 'نسخه‌ها', subtitle: 'آخرین نسخه‌ها', meta: '/prescriptions' },
          ]);
          break;
        }
        case 'queue': {
          const list = await fetchTodayAppointments(getAccessToken, { filterText: q });
          setRows(
            list.map((a) => ({
              id: a.appointmentId,
              title: appointmentPatientLabel(a),
              subtitle: `${a.appointmentTypeName ?? 'نوبت'} · ${a.doctorName ?? `پزشک #${a.doctorId}`}`,
              meta: a.appointmentDate,
              badge: 'امروز',
            }))
          );
          break;
        }
        case 'appointments': {
          const list = await fetchAppointments(getAccessToken, { filterText: q });
          setRows(
            list.map((a) => ({
              id: a.appointmentId,
              title: appointmentPatientLabel(a),
              subtitle: `${a.appointmentTypeName ?? 'نوبت'} · ${a.doctorName ?? ''}`,
              meta: a.appointmentDate,
            }))
          );
          break;
        }
        case 'patients': {
          const list = await fetchPatients(getAccessToken, { filterText: q });
          setRows(
            list.map((p) => ({
              id: p.patientId,
              title: patientDisplayName(p),
              subtitle: `کد ملی ${p.nationalCode}`,
              meta: p.phoneNumber,
            }))
          );
          break;
        }
        case 'doctors': {
          const list = await fetchDoctors(getAccessToken, { filterText: q });
          setRows(
            list.map((d) => ({
              id: d.doctorId,
              title: doctorDisplayName(d),
              subtitle: d.medicalGroupTypeName || 'پزشک',
              meta: d.mobile,
            }))
          );
          break;
        }
        case 'prescriptions': {
          const list = await fetchPrescriptions(getAccessToken, { filterText: q });
          setRows(
            list.map((p, index) => ({
              id: Number(p.prescriptionId ?? p.id ?? index),
              title: p.patientName || `نسخه #${p.prescriptionId ?? p.id ?? index}`,
              subtitle: p.doctorName,
              meta: p.prescriptionDate ?? p.createDate,
            }))
          );
          break;
        }
        case 'companies':
          setRows(await fetchCompanies(getAccessToken));
          break;
        case 'insurance':
          setRows(await fetchInsurance(getAccessToken));
          break;
        case 'services':
          setRows(await fetchServices(getAccessToken));
          break;
        case 'fees':
          setRows(await fetchMedicalFees(getAccessToken));
          break;
        case 'users':
          setRows(await fetchUsers(getAccessToken));
          break;
        case 'roles':
          setInfo('نقش‌های سامانه — هم‌تراز تعریف نقش در کلینیک وب.');
          setRows(await fetchRoles(getAccessToken));
          break;
        case 'access':
        case 'access-roles':
          setInfo('کاربران و تخصیص نقش — برای ویرایش درخت دسترسی از نسخه وب هم می‌توانید استفاده کنید.');
          setRows(await fetchUsers(getAccessToken));
          break;
        case 'booking-reservations':
          setRows(await fetchBookingReservations(getAccessToken));
          break;
        case 'booking-schedules':
          setRows(await fetchBookingSchedules(getAccessToken));
          break;
        case 'sms':
          setRows(await fetchSmsOutbox(getAccessToken));
          break;
        case 'sms-settings':
          setInfo('تنظیمات پیامک کلینیک (فقط مشاهده در موبایل).');
          setRows(await fetchSmsSettings(getAccessToken));
          break;
        case 'site-reviews':
          setRows(await fetchReviews(getAccessToken));
          break;
        case 'site-blog':
          setRows(await fetchBlogPosts(getAccessToken));
          break;
        case 'site-content':
          setRows(await fetchPortalContent(getAccessToken));
          break;
        case 'site-settings':
          setRows(await fetchSiteSettings(getAccessToken));
          break;
        case 'site-seo':
          setRows(await fetchSeoPages(getAccessToken));
          break;
        case 'site-rag':
          setRows(await fetchRagKnowledge(getAccessToken));
          break;
        case 'site-rag-logs':
          setRows(await fetchRagChatLogs(getAccessToken));
          break;
        case 'assistant':
          setInfo('تنظیمات دستیار هوشمند مطب.');
          setRows(await fetchRagSettingCards(getAccessToken));
          break;
        case 'blood-pressure': {
          if (!q) {
            setInfo('کد ملی بیمار را جستجو کنید تا تاریخچه فشار خون نمایش داده شود.');
            setRows([]);
          } else {
            setRows(await fetchBloodPressureHistory(getAccessToken, { nationalCode: q }));
          }
          break;
        }
        case 'reports':
          setInfo('خلاصه گزارش‌های تحلیلی کلینیک.');
          setRows(await fetchClinicAnalytics(getAccessToken));
          break;
        case 'workflow':
          setInfo('کارتابل گردش‌کار در موبایل به‌صورت فهرست وضعیت‌های مرتبط نمایش داده می‌شود.');
          setRows([
            { id: 1, title: 'صف انتظار', subtitle: 'پیگیری نوبت‌های جاری', meta: '/queue' },
            { id: 2, title: 'نوبت‌ها', subtitle: 'وضعیت زمان‌بندی', meta: '/appointments' },
            { id: 3, title: 'نسخه‌ها', subtitle: 'نتایج و سفارش‌ها', meta: '/prescriptions' },
          ]);
          break;
        case 'signature':
          setInfo('امضای دیجیتال روی فایل PDF در دسکتاپ/وب انجام می‌شود. از اینجا به بخش‌های مرتبط بروید.');
          setRows([
            { id: 1, title: 'نسخه‌ها', subtitle: 'اسناد قابل امضا', meta: '/prescriptions' },
            { id: 2, title: 'گزارش‌ها', subtitle: 'خروجی‌های کلینیک', meta: '/reports' },
          ]);
          break;
        case 'generic':
        default:
          setInfo(`بخش «${title}» با دسترسی شما باز شده است. مسیر سامانه: ${params.path || '—'}`);
          setRows([]);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت داده');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, getAccessToken, moduleId, params.path, title]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q || moduleId === 'blood-pressure') return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subtitle ?? '').toLowerCase().includes(q) ||
        (r.meta ?? '').toLowerCase().includes(q)
    );
  }, [filter, moduleId, rows]);

  const searchable = ![
    'sms-settings',
    'assistant',
    'signature',
    'generic',
  ].includes(moduleId);

  const searchPlaceholder =
    moduleId === 'blood-pressure' ? 'کد ملی بیمار...' : 'جستجو در این بخش...';

  const onRowPress = (item: Row) => {
    if (moduleId === 'dashboard' || moduleId === 'workflow' || moduleId === 'signature') {
      const path = item.meta;
      if (!path) return;
      const id =
        path === '/queue'
          ? 'queue'
          : path === '/appointments'
            ? 'appointments'
            : path === '/patients'
              ? 'patients'
              : path === '/prescriptions'
                ? 'prescriptions'
                : path === '/reports'
                  ? 'reports'
                  : 'generic';
      router.push({
        pathname: '/(app)/module/[id]',
        params: { id, title: item.title, path },
      });
    }
  };

  return (
    <AppScreen>
      {searchable ? (
        <SearchField
          placeholder={searchPlaceholder}
          value={filter}
          onChangeText={setFilter}
          onSubmitEditing={() => void load()}
          returnKeyType="search"
          keyboardType={moduleId === 'blood-pressure' ? 'number-pad' : 'default'}
        />
      ) : null}

      {info ? (
        <SurfaceCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>راهنما</Text>
          <Text style={styles.infoBody}>{info}</Text>
        </SurfaceCard>
      ) : null}

      {loading && rows.length === 0 ? (
        <LoadingBlock />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.id}-${item.title}`}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyBlock
              title={error ? 'خطا در بارگذاری' : 'موردی نیست'}
              subtitle={error ?? 'هنوز داده‌ای برای نمایش وجود ندارد'}
            />
          }
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              badge={item.badge}
              lines={[item.subtitle, item.meta].filter(Boolean) as string[]}
              onPress={
                moduleId === 'dashboard' || moduleId === 'workflow' || moduleId === 'signature'
                  ? () => onRowPress(item)
                  : undefined
              }
            />
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: { marginBottom: spacing.md },
  infoTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 4,
  },
  infoBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'right',
    lineHeight: 22,
  },
});
