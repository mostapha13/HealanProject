import type { TokenGetter } from './client';
import { apiGet, clampPageSize, HEALAN_MAX_PAGE_SIZE } from './client';
import { config } from '../config';

export type DashboardStats = {
  todayAppointments: number;
  waitingAppointments: number;
  inProgressAppointments: number;
  completedToday: number;
  totalPatients: number;
  totalDoctors: number;
  todayRevenue: number;
  pendingPayments: number;
  todayPrescriptions: number;
};

export type NamedRow = {
  id: number;
  title: string;
  subtitle?: string;
  meta?: string;
};

export type PatientSummary = {
  patientId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber: string;
};

export type AppointmentSummary = {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  patientName?: string;
  doctorName?: string;
  patientNationalCode?: string;
  appointmentDate: string;
  appointmentTypeName?: string;
  note?: string;
  patient?: { firstName?: string; lastName?: string; nationalCode?: string };
  doctor?: { firstName?: string; lastName?: string; medicalGroupTypeName?: string };
};

export type DoctorSummary = {
  doctorId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  medicalGroupTypeName?: string;
};

export type PrescriptionSummary = {
  prescriptionId?: number;
  id?: number;
  patientName?: string;
  doctorName?: string;
  createDate?: string;
  prescriptionDate?: string;
};

export type PaginatedResponse<T> = {
  items?: T[];
  Items?: T[];
  totalCount?: number;
  TotalCount?: number;
};

function pageItems<T>(page: PaginatedResponse<T> | T[] | null | undefined): T[] {
  if (!page) return [];
  if (Array.isArray(page)) return page;
  return page.items ?? page.Items ?? [];
}

function asRecord(item: unknown): Record<string, unknown> {
  return (item ?? {}) as Record<string, unknown>;
}

export async function fetchDashboardStats(getToken: TokenGetter): Promise<DashboardStats> {
  return apiGet<DashboardStats>(config.healanApiUrl, 'Dashboard/Stats', getToken);
}

export async function fetchTodayAppointments(
  getToken: TokenGetter,
  params: { pageNumber?: number; pageSize?: number; filterText?: string } = {}
): Promise<AppointmentSummary[]> {
  const page = await apiGet<PaginatedResponse<AppointmentSummary>>(
    config.healanApiUrl,
    'Appointment/CurrentAppointmentList',
    getToken,
    {
      pageNumber: params.pageNumber ?? 1,
      pageSize: clampPageSize(params.pageSize ?? HEALAN_MAX_PAGE_SIZE),
      filterText: params.filterText,
    }
  );
  return pageItems(page);
}

export async function fetchAppointments(
  getToken: TokenGetter,
  params: { pageNumber?: number; pageSize?: number; filterText?: string } = {}
): Promise<AppointmentSummary[]> {
  const page = await apiGet<PaginatedResponse<AppointmentSummary>>(
    config.healanApiUrl,
    'Appointment/AppointmentList',
    getToken,
    {
      pageNumber: params.pageNumber ?? 1,
      pageSize: clampPageSize(params.pageSize ?? HEALAN_MAX_PAGE_SIZE),
      filterText: params.filterText,
    }
  );
  return pageItems(page);
}

export async function fetchPatients(
  getToken: TokenGetter,
  params: { pageNumber?: number; pageSize?: number; filterText?: string } = {}
): Promise<PatientSummary[]> {
  const page = await apiGet<PaginatedResponse<PatientSummary>>(
    config.healanApiUrl,
    'Patient/PatientList',
    getToken,
    {
      pageNumber: params.pageNumber ?? 1,
      pageSize: clampPageSize(params.pageSize ?? HEALAN_MAX_PAGE_SIZE),
      filterText: params.filterText,
    }
  );
  return pageItems(page);
}

export async function fetchDoctors(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<DoctorSummary[]> {
  const page = await apiGet<PaginatedResponse<DoctorSummary>>(
    config.healanApiUrl,
    'Doctor/DoctorList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE, filterText: params.filterText }
  );
  return pageItems(page);
}

export async function fetchPrescriptions(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<PrescriptionSummary[]> {
  const page = await apiGet<PaginatedResponse<PrescriptionSummary>>(
    config.healanApiUrl,
    'OrderResult/PrescriptionList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE, filterText: params.filterText }
  );
  return pageItems(page);
}

export async function fetchCompanies(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'Company/CompanyList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page).map((raw) => {
    const r = asRecord(raw);
    return {
      id: Number(r.companyId ?? r.id ?? 0),
      title: String(r.companyName ?? r.name ?? r.title ?? 'مرکز'),
      subtitle: String(r.phoneNumber ?? r.mobile ?? ''),
    };
  });
}

export async function fetchInsurance(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'Insurance/InsuranceList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page).map((raw) => {
    const r = asRecord(raw);
    return {
      id: Number(r.insuranceCompanyId ?? r.id ?? 0),
      title: String(r.insuranceCompanyName ?? r.name ?? r.title ?? 'بیمه'),
      subtitle: String(r.insuranceTypeName ?? ''),
    };
  });
}

export async function fetchServices(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'ServiceTypes/List',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE, onlyActive: true }
  );
  return pageItems(page).map((raw) => {
    const r = asRecord(raw);
    return {
      id: Number(r.serviceTypeId ?? r.id ?? 0),
      title: String(r.serviceTypeName ?? r.name ?? r.title ?? 'خدمت'),
      subtitle: String(r.categoryTypeName ?? ''),
    };
  });
}

export async function fetchMedicalFees(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'MedicalFeeServices/List',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page).map((raw) => {
    const r = asRecord(raw);
    return {
      id: Number(r.medicalFeeServiceId ?? r.id ?? 0),
      title: String(r.serviceTypeName ?? r.name ?? r.title ?? 'تعرفه'),
      subtitle: r.fee != null ? `${r.fee} ریال` : undefined,
    };
  });
}

export async function fetchUsers(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'User/UserList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE, filterText: '' }
  );
  return pageItems(page).map((raw) => {
    const r = asRecord(raw);
    const name = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
    return {
      id: Number(r.userId ?? r.id ?? 0),
      title: name || String(r.userName ?? 'کاربر'),
      subtitle: String(r.phoneNumber ?? r.userName ?? ''),
    };
  });
}

export async function fetchBookingReservations(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'BookingReservation/List',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page).map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.reservationId ?? r.id ?? index),
      title: String(r.patientName ?? r.fullName ?? `رزرو #${r.reservationId ?? index}`),
      subtitle: String(r.slotStart ?? r.appointmentDate ?? r.statusName ?? ''),
    };
  });
}

export async function fetchBookingSchedules(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    config.healanApiUrl,
    'BookingSchedule/TemplateList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page as PaginatedResponse<Record<string, unknown>>).map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.templateId ?? r.id ?? index),
      title: String(r.doctorName ?? r.title ?? `برنامه #${index + 1}`),
      subtitle: String(r.dayOfWeekName ?? r.weekDayName ?? r.startTime ?? ''),
    };
  });
}

export async function fetchSmsOutbox(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'ClinicReports/SmsOutbox',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page).map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.id ?? index),
      title: String(r.phone ?? r.mobile ?? 'پیامک'),
      subtitle: String(r.statusName ?? r.message ?? r.createDate ?? ''),
    };
  });
}

export async function fetchReviews(getToken: TokenGetter): Promise<NamedRow[]> {
  const list = await apiGet<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'PatientReview/List',
    getToken
  );
  const rows = Array.isArray(list) ? list : pageItems(list);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.patientReviewId ?? r.id ?? index),
      title: String(r.patientName ?? r.fullName ?? 'نظر بیمار'),
      subtitle: String(r.statusName ?? r.comment ?? '').slice(0, 80),
    };
  });
}

export async function fetchBlogPosts(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'BlogPost/List',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  return pageItems(page).map((raw) => {
    const r = asRecord(raw);
    return {
      id: Number(r.blogPostId ?? r.id ?? 0),
      title: String(r.title ?? 'پست بلاگ'),
      subtitle: r.isPublished ? 'منتشر شده' : 'پیش‌نویس',
    };
  });
}

export async function fetchPortalContent(getToken: TokenGetter): Promise<NamedRow[]> {
  const list = await apiGet<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'PortalContent/ContentList',
    getToken
  );
  const rows = Array.isArray(list) ? list : pageItems(list);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.portalContentItemId ?? r.id ?? index),
      title: String(r.title ?? r.sectionType ?? 'مطلب'),
      subtitle: String(r.sectionType ?? ''),
    };
  });
}

export async function fetchSiteSettings(getToken: TokenGetter): Promise<NamedRow[]> {
  const list = await apiGet<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'PortalContent/SettingList',
    getToken
  );
  const rows = Array.isArray(list) ? list : pageItems(list);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.portalSiteSettingId ?? r.id ?? index),
      title: String(r.key ?? r.settingKey ?? r.title ?? `تنظیم ${index + 1}`),
      subtitle: String(r.value ?? r.settingValue ?? '').slice(0, 120),
    };
  });
}

export async function fetchSeoPages(getToken: TokenGetter): Promise<NamedRow[]> {
  const list = await apiGet<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'PortalSeo/List',
    getToken
  );
  const rows = Array.isArray(list) ? list : pageItems(list);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.portalSeoPageId ?? r.id ?? index),
      title: String(r.path ?? r.pagePath ?? r.title ?? `صفحه SEO ${index + 1}`),
      subtitle: String(r.metaTitle ?? r.title ?? '').slice(0, 100),
    };
  });
}

export async function fetchRagKnowledge(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    config.healanApiUrl,
    'RagKnowledge/List',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  const rows = Array.isArray(page) ? page : pageItems(page);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.ragKnowledgeItemId ?? r.id ?? index),
      title: String(r.question ?? r.title ?? `دانش #${index + 1}`).slice(0, 80),
      subtitle: String(r.answer ?? r.category ?? '').slice(0, 100),
    };
  });
}

export async function fetchRagChatLogs(getToken: TokenGetter): Promise<NamedRow[]> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    config.healanApiUrl,
    'RagKnowledge/ChatLogList',
    getToken,
    { pageNumber: 1, pageSize: HEALAN_MAX_PAGE_SIZE }
  );
  const rows = Array.isArray(page) ? page : pageItems(page);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.ragChatLogId ?? r.id ?? index),
      title: String(r.question ?? r.userMessage ?? `گفتگو #${index + 1}`).slice(0, 80),
      subtitle: String(r.createDate ?? r.createdUtc ?? r.answer ?? '').slice(0, 100),
    };
  });
}

export async function fetchRagSettingCards(getToken: TokenGetter): Promise<NamedRow[]> {
  const raw = await apiGet<Record<string, unknown>>(config.healanApiUrl, 'RagKnowledge/SettingGet', getToken);
  const r = asRecord(raw);
  return Object.entries(r)
    .filter(([k]) => !['$id', '$type'].includes(k))
    .slice(0, 40)
    .map(([key, value], index) => ({
      id: index + 1,
      title: key,
      subtitle: typeof value === 'object' ? JSON.stringify(value).slice(0, 120) : String(value ?? '—'),
    }));
}

export async function fetchSmsSettings(getToken: TokenGetter): Promise<NamedRow[]> {
  const raw = await apiGet<Record<string, unknown>>(config.healanApiUrl, 'ClinicReports/SmsSettings', getToken);
  const r = asRecord(raw);
  return Object.entries(r)
    .filter(([k]) => !['$id', '$type'].includes(k))
    .map(([key, value], index) => ({
      id: index + 1,
      title: key,
      subtitle: typeof value === 'object' ? JSON.stringify(value).slice(0, 120) : String(value ?? '—'),
    }));
}

export async function fetchClinicAnalytics(getToken: TokenGetter): Promise<NamedRow[]> {
  const raw = await apiGet<Record<string, unknown>>(config.healanApiUrl, 'ClinicReports/Analytics', getToken);
  const summary = asRecord(asRecord(raw).summary ?? asRecord(raw).Summary ?? {});
  const labels: Record<string, string> = {
    totalAppointments: 'کل نوبت‌ها',
    completedAppointments: 'تکمیل‌شده',
    scheduledAppointments: 'زمان‌بندی‌شده',
    inProgressAppointments: 'در حال ویزیت',
    cancelledAppointments: 'لغو شده',
    noShowAppointments: 'عدم حضور',
    totalRevenue: 'درآمد کل',
    patientRevenue: 'سهم بیمار',
    insuranceRevenue: 'سهم بیمه',
    pendingPayments: 'پرداخت معلق',
    prescriptionCount: 'نسخه‌ها',
  };
  return Object.entries(summary).map(([key, value], index) => ({
    id: index + 1,
    title: labels[key] ?? labels[key.charAt(0).toLowerCase() + key.slice(1)] ?? key,
    subtitle: String(value ?? '—'),
  }));
}

export async function fetchBloodPressureHistory(
  getToken: TokenGetter,
  params: { nationalCode?: string; patientId?: number } = {}
): Promise<NamedRow[]> {
  const list = await apiGet<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'ClinicBloodPressure/History',
    getToken,
    { nationalCode: params.nationalCode, patientId: params.patientId }
  );
  const rows = Array.isArray(list) ? list : pageItems(list);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    const sys = r.systolic ?? r.Systolic;
    const dia = r.diastolic ?? r.Diastolic;
    return {
      id: Number(r.patientBloodPressureId ?? r.id ?? index),
      title: sys != null && dia != null ? `${sys}/${dia} mmHg` : `ثبت #${index + 1}`,
      subtitle: String(r.measuredAt ?? r.createDate ?? r.note ?? ''),
      meta: String(r.pulse ?? r.heartRate ?? ''),
    };
  });
}

export async function fetchRoles(getToken: TokenGetter): Promise<NamedRow[]> {
  const list = await apiGet<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
    config.userManagerApiUrl,
    'HealanRoleManagement/roles',
    getToken
  );
  const rows = Array.isArray(list) ? list : pageItems(list);
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: index + 1,
      title: String(r.displayName ?? r.DisplayName ?? r.name ?? r.Name ?? `نقش ${index + 1}`),
      subtitle: r.isSystem || r.IsSystem ? 'سیستمی' : `${r.userCount ?? r.UserCount ?? 0} کاربر`,
      meta: String(r.name ?? r.Name ?? ''),
    };
  });
}

export function patientDisplayName(p: PatientSummary): string {
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `بیمار ${p.patientId}`;
}

function personFullName(firstName?: string, lastName?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim();
}

export function appointmentPatientLabel(a: AppointmentSummary): string {
  if (a.patientName?.trim()) return a.patientName.trim();
  const nested = personFullName(a.patient?.firstName, a.patient?.lastName);
  return nested || `بیمار #${a.patientId}`;
}

export function appointmentDoctorLabel(a: AppointmentSummary): string {
  if (a.doctorName?.trim()) return a.doctorName.trim();
  const nested = personFullName(a.doctor?.firstName, a.doctor?.lastName);
  return nested || `پزشک #${a.doctorId}`;
}

export function doctorDisplayName(d: DoctorSummary): string {
  return `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || `پزشک ${d.doctorId}`;
}

/** Normalize Persian/Arabic digits and keep only 0-9. */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - '۰'.charCodeAt(0)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - '٠'.charCodeAt(0)))
    .replace(/\D/g, '');
}

export function isTenDigitNationalCode(value: string): boolean {
  return toAsciiDigits(value).length === 10;
}

export type PortalHeroSlide = {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
};

/** Public site hero slides (same source as www HeroSlide). */
export async function fetchPortalHeroSlides(): Promise<PortalHeroSlide[]> {
  const raw = await apiGet<Record<string, unknown>>(
    config.healanApiUrl,
    'PortalPublic/Site',
    async () => null
  );
  const r = asRecord(raw);
  const items = (r.contentItems ?? r.ContentItems ?? []) as unknown[];
  const list = Array.isArray(items) ? items : [];
  const slides = list
    .map((item, index) => {
      const row = asRecord(item);
      const section = row.sectionType ?? row.SectionType;
      const isHero =
        section === 'HeroSlide' ||
        section === 1 ||
        section === '1' ||
        String(section).toLowerCase() === 'heroslide';
      if (!isHero) return null;
      const published = row.isPublished ?? row.IsPublished;
      if (published === false) return null;
      return {
        id: Number(row.portalContentItemId ?? row.id ?? index),
        title: String(row.title ?? row.Title ?? ''),
        subtitle: String(row.subtitle ?? row.Subtitle ?? '') || undefined,
        imageUrl: String(row.imageUrl ?? row.ImageUrl ?? '') || undefined,
        linkUrl: String(row.linkUrl ?? row.LinkUrl ?? '') || undefined,
        sortOrder: Number(row.sortOrder ?? row.SortOrder ?? index),
      };
    })
    .filter(Boolean) as (PortalHeroSlide & { sortOrder: number })[];
  return slides
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _s, ...rest }) => rest);
}
