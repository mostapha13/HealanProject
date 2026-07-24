import type { TokenGetter } from './client';
import {
  apiGet,
  fetchAllPaginated,
  pageItems,
  type PaginatedPage,
} from './client';
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

export type PaginatedResponse<T> = PaginatedPage<T>;

function asRecord(item: unknown): Record<string, unknown> {
  return (item ?? {}) as Record<string, unknown>;
}

export async function fetchDashboardStats(getToken: TokenGetter): Promise<DashboardStats> {
  const raw = await apiGet<Record<string, unknown>>(config.healanApiUrl, 'Dashboard/Stats', getToken);
  const r = asRecord(raw);
  const n = (a: unknown, b?: unknown) => {
    const v = a ?? b;
    const num = Number(v);
    return Number.isFinite(num) ? num : 0;
  };
  return {
    todayAppointments: n(r.todayAppointments, r.TodayAppointments),
    waitingAppointments: n(r.waitingAppointments, r.WaitingAppointments),
    inProgressAppointments: n(r.inProgressAppointments, r.InProgressAppointments),
    completedToday: n(r.completedToday, r.CompletedToday),
    totalPatients: n(r.totalPatients, r.TotalPatients),
    totalDoctors: n(r.totalDoctors, r.TotalDoctors),
    todayRevenue: n(r.todayRevenue, r.TodayRevenue),
    pendingPayments: n(r.pendingPayments, r.PendingPayments),
    todayPrescriptions: n(r.todayPrescriptions, r.TodayPrescriptions),
  };
}

export async function fetchTodayAppointments(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<AppointmentSummary[]> {
  return fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<AppointmentSummary>>(
      config.healanApiUrl,
      'Appointment/CurrentAppointmentList',
      getToken,
      {
        pageNumber,
        pageSize,
        filterText: params.filterText,
      }
    )
  );
}

export async function fetchAppointments(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<AppointmentSummary[]> {
  return fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<AppointmentSummary>>(
      config.healanApiUrl,
      'Appointment/AppointmentList',
      getToken,
      {
        pageNumber,
        pageSize,
        filterText: params.filterText,
      }
    )
  );
}

export type VisitHistoryDrug = {
  drugName: string;
  dosage?: string | null;
  usageInstructions?: string | null;
};

export type VisitHistoryLab = {
  labTestType: string;
  notes?: string | null;
  attachmentId?: string | null;
  attachmentLink?: string | null;
  attachmentFileName?: string | null;
};

export type VisitHistoryImaging = {
  imageTypeId: number;
  imageTypeName: string;
  notes?: string | null;
  attachmentId?: string | null;
  attachmentLink?: string | null;
  attachmentFileName?: string | null;
};

export type PatientVisitHistoryItem = {
  appointmentId: number;
  appointmentDate: string;
  appointmentStatus: string;
  doctorName?: string | null;
  prescriptionId?: number | null;
  prescriptionIssueDate?: string | null;
  prescriptionNotes?: string | null;
  hasEchoReport?: boolean;
  echoConclusion?: string | null;
  echoRecommendation?: string | null;
  drugs: VisitHistoryDrug[];
  labs: VisitHistoryLab[];
  imaging: VisitHistoryImaging[];
};

function mapVisitHistoryItem(raw: Record<string, unknown>): PatientVisitHistoryItem {
  const drugsRaw = (raw.drugs ?? raw.Drugs) as unknown;
  const labsRaw = (raw.labs ?? raw.Labs) as unknown;
  const imagingRaw = (raw.imaging ?? raw.Imaging) as unknown;
  const asObj = (v: unknown) => (v ?? {}) as Record<string, unknown>;
  return {
    appointmentId: Number(raw.appointmentId ?? raw.AppointmentId ?? 0),
    appointmentDate: String(raw.appointmentDate ?? raw.AppointmentDate ?? ''),
    appointmentStatus: String(raw.appointmentStatus ?? raw.AppointmentStatus ?? ''),
    doctorName: (raw.doctorName ?? raw.DoctorName) as string | null | undefined,
    prescriptionId: (() => {
      const v = raw.prescriptionId ?? raw.PrescriptionId;
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    prescriptionIssueDate: (raw.prescriptionIssueDate ?? raw.PrescriptionIssueDate) as
      | string
      | null
      | undefined,
    prescriptionNotes: (raw.prescriptionNotes ?? raw.PrescriptionNotes) as string | null | undefined,
    hasEchoReport: Boolean(raw.hasEchoReport ?? raw.HasEchoReport),
    echoConclusion: (raw.echoConclusion ?? raw.EchoConclusion) as string | null | undefined,
    echoRecommendation: (raw.echoRecommendation ?? raw.EchoRecommendation) as
      | string
      | null
      | undefined,
    drugs: Array.isArray(drugsRaw)
      ? drugsRaw.map((d) => {
          const r = asObj(d);
          return {
            drugName: String(r.drugName ?? r.DrugName ?? ''),
            dosage: (r.dosage ?? r.Dosage) as string | null | undefined,
            usageInstructions: (r.usageInstructions ?? r.UsageInstructions) as
              | string
              | null
              | undefined,
          };
        })
      : [],
    labs: Array.isArray(labsRaw)
      ? labsRaw.map((d) => {
          const r = asObj(d);
          return {
            labTestType: String(r.labTestType ?? r.LabTestType ?? ''),
            notes: (r.notes ?? r.Notes) as string | null | undefined,
            attachmentId: (r.attachmentId ?? r.AttachmentId) as string | null | undefined,
            attachmentLink: (r.attachmentLink ?? r.AttachmentLink) as string | null | undefined,
            attachmentFileName: (r.attachmentFileName ?? r.AttachmentFileName) as
              | string
              | null
              | undefined,
          };
        })
      : [],
    imaging: Array.isArray(imagingRaw)
      ? imagingRaw.map((d) => {
          const r = asObj(d);
          return {
            imageTypeId: Number(r.imageTypeId ?? r.ImageTypeId ?? 0),
            imageTypeName: String(r.imageTypeName ?? r.ImageTypeName ?? ''),
            notes: (r.notes ?? r.Notes) as string | null | undefined,
            attachmentId: (r.attachmentId ?? r.AttachmentId) as string | null | undefined,
            attachmentLink: (r.attachmentLink ?? r.AttachmentLink) as string | null | undefined,
            attachmentFileName: (r.attachmentFileName ?? r.AttachmentFileName) as
              | string
              | null
              | undefined,
          };
        })
      : [],
  };
}

/** سوابق ویزیت + نسخه به تفکیک نوبت (جدیدترین اول) */
export async function fetchPatientVisitHistory(
  getToken: TokenGetter,
  patientId: number
): Promise<PatientVisitHistoryItem[]> {
  if (!patientId || patientId <= 0) return [];
  const list = await apiGet<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>(
    config.healanApiUrl,
    'Patient/VisitHistory',
    getToken,
    { patientId }
  );
  const rows = Array.isArray(list)
    ? list
    : Array.isArray((list as { items?: unknown }).items)
      ? ((list as { items: Record<string, unknown>[] }).items)
      : [];
  return rows.map((raw) => mapVisitHistoryItem((raw ?? {}) as Record<string, unknown>));
}

export async function fetchPatients(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<PatientSummary[]> {
  return fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<PatientSummary>>(config.healanApiUrl, 'Patient/PatientList', getToken, {
      pageNumber,
      pageSize,
      filterText: params.filterText,
    })
  );
}

export async function fetchDoctors(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<DoctorSummary[]> {
  return fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<DoctorSummary>>(config.healanApiUrl, 'Doctor/DoctorList', getToken, {
      pageNumber,
      pageSize,
      filterText: params.filterText,
    })
  );
}

export async function fetchPrescriptions(
  getToken: TokenGetter,
  params: { filterText?: string } = {}
): Promise<PrescriptionSummary[]> {
  return fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<PrescriptionSummary>>(
      config.healanApiUrl,
      'OrderResult/PrescriptionList',
      getToken,
      { pageNumber, pageSize, filterText: params.filterText }
    )
  );
}

export async function fetchCompanies(getToken: TokenGetter): Promise<NamedRow[]> {
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'Company/CompanyList',
      getToken,
      { pageNumber, pageSize }
    )
  );
  return rows.map((raw) => {
    const r = asRecord(raw);
    const isActive = r.isActive !== false && r.IsActive !== false;
    return {
      id: Number(r.companyId ?? r.id ?? 0),
      title: String(r.companyName ?? r.name ?? r.title ?? 'مرکز'),
      subtitle: String(r.nationalId ?? r.phoneNumber ?? r.mobile ?? ''),
      meta: isActive ? 'فعال' : 'غیرفعال',
    };
  });
}

export async function fetchInsurance(getToken: TokenGetter): Promise<NamedRow[]> {
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'Insurance/InsuranceList',
      getToken,
      { pageNumber, pageSize }
    )
  );
  return rows.map((raw) => {
    const r = asRecord(raw);
    const isActive = r.isActive !== false && r.IsActive !== false;
    return {
      id: Number(r.insuranceCompanyId ?? r.id ?? 0),
      title: String(r.name ?? r.insuranceCompanyName ?? r.title ?? 'بیمه'),
      subtitle: String(r.insuranceTypeName ?? r.code ?? ''),
      meta: isActive ? 'فعال' : 'غیرفعال',
    };
  });
}

export async function fetchServices(getToken: TokenGetter): Promise<NamedRow[]> {
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'ServiceTypes/List',
      getToken,
      { pageNumber, pageSize }
    )
  );
  return rows.map((raw) => {
    const r = asRecord(raw);
    const isActive = r.isActive !== false && r.IsActive !== false;
    return {
      id: Number(r.serviceTypeId ?? r.id ?? 0),
      title: String(r.title ?? r.serviceTypeName ?? r.name ?? 'خدمت'),
      subtitle: String(r.categoryTypeName ?? r.code ?? ''),
      meta: isActive ? 'فعال' : 'غیرفعال',
    };
  });
}

export async function fetchMedicalFees(getToken: TokenGetter): Promise<NamedRow[]> {
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'MedicalFeeServices/List',
      getToken,
      { pageNumber, pageSize }
    )
  );
  return rows.map((raw) => {
    const r = asRecord(raw);
    const price = r.price ?? r.fee;
    const isActive = r.isActive !== false && r.IsActive !== false;
    return {
      id: Number(r.medicalFeeServiceId ?? r.id ?? 0),
      title: String(r.serviceTypeName ?? r.serviceTypeTitle ?? r.name ?? r.title ?? 'تعرفه'),
      subtitle: price != null ? `${price} ریال` : undefined,
      meta: isActive ? 'فعال' : 'غیرفعال',
    };
  });
}

export async function fetchUsers(getToken: TokenGetter): Promise<NamedRow[]> {
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(config.healanApiUrl, 'User/UserList', getToken, {
      pageNumber,
      pageSize,
      filterText: '',
    })
  );
  return rows.map((raw) => {
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
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'BookingReservation/List',
      getToken,
      { pageNumber, pageSize }
    )
  );
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.reservationId ?? r.id ?? index),
      title: String(r.patientName ?? r.fullName ?? `رزرو #${r.reservationId ?? index}`),
      subtitle: String(r.slotStart ?? r.appointmentDate ?? r.statusName ?? ''),
    };
  });
}

export async function fetchBookingSchedules(getToken: TokenGetter): Promise<NamedRow[]> {
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'BookingSchedule/TemplateList',
      getToken,
      { pageNumber, pageSize }
    )
  );
  return rows.map((raw, index) => {
    const r = asRecord(raw);
    return {
      id: Number(r.templateId ?? r.id ?? index),
      title: String(r.doctorName ?? r.title ?? `برنامه #${index + 1}`),
      subtitle: String(r.dayOfWeekName ?? r.weekDayName ?? r.startTime ?? ''),
    };
  });
}

export async function fetchClinicAnalytics(getToken: TokenGetter): Promise<NamedRow[]> {
  const raw = await apiGet<Record<string, unknown>>(config.healanApiUrl, 'ClinicReports/Analytics', getToken);
  const summary = asRecord(asRecord(raw).summary ?? asRecord(raw).Summary ?? raw);
  const labels: Record<string, string> = {
    totalAppointments: 'کل نوبت‌ها',
    TotalAppointments: 'کل نوبت‌ها',
    completedAppointments: 'تکمیل‌شده',
    CompletedAppointments: 'تکمیل‌شده',
    scheduledAppointments: 'زمان‌بندی‌شده',
    ScheduledAppointments: 'زمان‌بندی‌شده',
    inProgressAppointments: 'در حال ویزیت',
    InProgressAppointments: 'در حال ویزیت',
    cancelledAppointments: 'لغو شده',
    CancelledAppointments: 'لغو شده',
    noShowAppointments: 'عدم حضور',
    NoShowAppointments: 'عدم حضور',
    totalRevenue: 'درآمد کل',
    TotalRevenue: 'درآمد کل',
    patientRevenue: 'سهم بیمار',
    PatientRevenue: 'سهم بیمار',
    insuranceRevenue: 'سهم بیمه',
    InsuranceRevenue: 'سهم بیمه',
    pendingPayments: 'پرداخت معلق',
    PendingPayments: 'پرداخت معلق',
    prescriptionCount: 'نسخه‌ها',
    PrescriptionCount: 'نسخه‌ها',
  };
  const seen = new Set<string>();
  return Object.entries(summary)
    .filter(([key]) => !['$id', '$type', 'summary', 'Summary', 'charts', 'Charts'].includes(key))
    .map(([key, value], index) => {
      const camel = key.charAt(0).toLowerCase() + key.slice(1);
      if (seen.has(camel)) return null;
      seen.add(camel);
      const numVal = typeof value === 'number' ? value : Number(value);
      const display =
        typeof value === 'number' || Number.isFinite(numVal)
          ? String(numVal)
          : String(value ?? '—');
      return {
        id: index + 1,
        title: labels[key] ?? labels[camel] ?? key,
        subtitle: display,
      };
    })
    .filter(Boolean) as NamedRow[];
}

export async function fetchSmsOutboxPage(
  getToken: TokenGetter,
  pageNumber = 1,
  pageSize = 20
): Promise<{ items: NamedRow[]; totalCount: number; pageNumber: number; pageSize: number }> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    config.healanApiUrl,
    'ClinicReports/SmsOutbox',
    getToken,
    { pageNumber, pageSize }
  );
  const rows = pageItems(page);
  const totalCount = Number(page.totalCount ?? page.TotalCount ?? rows.length);
  return {
    pageNumber: Number(page.pageNumber ?? page.PageNumber ?? pageNumber),
    pageSize: Number(page.pageSize ?? page.PageSize ?? pageSize),
    totalCount,
    items: rows.map((raw, index) => {
      const r = asRecord(raw);
      return {
        id: Number(r.id ?? r.smsOutboxId ?? index),
        title: String(r.phone ?? r.mobile ?? r.receptor ?? 'پیامک'),
        subtitle: String(r.statusName ?? r.status ?? r.message ?? '').slice(0, 100),
        meta: String(r.createDate ?? r.sentAt ?? r.createdAt ?? ''),
      };
    }),
  };
}

export async function fetchSmsOutbox(getToken: TokenGetter): Promise<NamedRow[]> {
  const first = await fetchSmsOutboxPage(getToken, 1, 20);
  return first.items;
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
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(config.healanApiUrl, 'BlogPost/List', getToken, {
      pageNumber,
      pageSize,
    })
  );
  return rows.map((raw) => {
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
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'RagKnowledge/List',
      getToken,
      { pageNumber, pageSize }
    )
  );
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
  const rows = await fetchAllPaginated((pageNumber, pageSize) =>
    apiGet<PaginatedResponse<Record<string, unknown>>>(
      config.healanApiUrl,
      'RagKnowledge/ChatLogList',
      getToken,
      { pageNumber, pageSize }
    )
  );
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

export type BloodPressureItem = {
  id: number;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measuredAt: string;
  periodOfDay?: number | null;
  periodTitle?: string | null;
  measuredTime?: string | null;
  note?: string | null;
};

export type BloodPressureHistory = {
  patientId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  items: BloodPressureItem[];
};

export type CurrentUserInfo = {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userName?: string;
  userTypeName?: string;
  roleTitle?: string;
  isActive?: boolean;
};

export async function fetchCurrentUser(getToken: TokenGetter): Promise<CurrentUserInfo | null> {
  const raw = await apiGet<Record<string, unknown>>(
    config.healanApiUrl,
    'User/CurrentUser/Fa',
    getToken
  );
  const summary = asRecord(raw.userSummaryReply ?? raw.UserSummaryReply ?? raw);
  const userId = Number(summary.userId ?? summary.UserId ?? 0);
  if (!userId && !summary.firstName && !summary.FirstName) return null;
  return {
    userId,
    firstName: String(summary.firstName ?? summary.FirstName ?? ''),
    lastName: String(summary.lastName ?? summary.LastName ?? ''),
    phoneNumber: summary.phoneNumber != null ? String(summary.phoneNumber) : undefined,
    userName: summary.userName != null ? String(summary.userName) : undefined,
    userTypeName: summary.userTypeName != null ? String(summary.userTypeName) : undefined,
    roleTitle: summary.roleTitle != null ? String(summary.roleTitle) : undefined,
    isActive:
      typeof summary.isActive === 'boolean'
        ? summary.isActive
        : typeof summary.IsActive === 'boolean'
          ? summary.IsActive
          : undefined,
  };
}

export async function fetchBloodPressureHistory(
  getToken: TokenGetter,
  params: { nationalCode?: string; patientId?: number } = {}
): Promise<BloodPressureHistory> {
  const raw = await apiGet<Record<string, unknown>>(
    config.healanApiUrl,
    'ClinicBloodPressure/History',
    getToken,
    { nationalCode: params.nationalCode, patientId: params.patientId }
  );
  const root = asRecord(raw);
  const itemsRaw = root.items ?? root.Items;
  const list = Array.isArray(itemsRaw) ? itemsRaw : [];
  const items: BloodPressureItem[] = list.map((item, index) => {
    const r = asRecord(item);
    return {
      id: Number(r.id ?? r.Id ?? index + 1),
      systolic: Number(r.systolic ?? r.Systolic ?? 0),
      diastolic: Number(r.diastolic ?? r.Diastolic ?? 0),
      pulse:
        r.pulse != null || r.Pulse != null
          ? Number(r.pulse ?? r.Pulse)
          : null,
      measuredAt: String(r.measuredAt ?? r.MeasuredAt ?? ''),
      periodOfDay:
        r.periodOfDay != null || r.PeriodOfDay != null
          ? Number(r.periodOfDay ?? r.PeriodOfDay)
          : null,
      periodTitle:
        r.periodTitle != null || r.PeriodTitle != null
          ? String(r.periodTitle ?? r.PeriodTitle)
          : null,
      measuredTime:
        r.measuredTime != null || r.MeasuredTime != null
          ? String(r.measuredTime ?? r.MeasuredTime)
          : null,
      note: r.note != null || r.Note != null ? String(r.note ?? r.Note) : null,
    };
  });
  return {
    patientId: Number(root.patientId ?? root.PatientId ?? 0),
    firstName: String(root.firstName ?? root.FirstName ?? ''),
    lastName: String(root.lastName ?? root.LastName ?? ''),
    nationalCode: String(root.nationalCode ?? root.NationalCode ?? params.nationalCode ?? ''),
    items,
  };
}

export function bloodPressureToNamedRows(history: BloodPressureHistory): NamedRow[] {
  return history.items.map((item, index) => ({
    id: item.id || index + 1,
    title: `${item.systolic}/${item.diastolic} mmHg`,
    subtitle: [item.periodTitle, item.measuredTime, item.measuredAt].filter(Boolean).join(' · '),
    meta: item.pulse != null ? `نبض ${item.pulse}` : item.note || undefined,
  }));
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
