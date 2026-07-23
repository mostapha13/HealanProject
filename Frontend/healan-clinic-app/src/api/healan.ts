import type { TokenGetter } from './client';
import { apiGet, apiPost } from './client';
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
};

export type PaginatedResponse<T> = {
  items?: T[];
  Items?: T[];
  totalCount?: number;
  TotalCount?: number;
  pageNumber?: number;
  pageCount?: number;
};

function pageItems<T>(page: PaginatedResponse<T> | T[] | null | undefined): T[] {
  if (!page) return [];
  if (Array.isArray(page)) return page;
  return page.items ?? page.Items ?? [];
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
    { pageNumber: params.pageNumber ?? 1, pageSize: params.pageSize ?? 50, filterText: params.filterText }
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
    { pageNumber: params.pageNumber ?? 1, pageSize: params.pageSize ?? 50, filterText: params.filterText }
  );
  return pageItems(page);
}

export async function changeAppointmentStatus(
  getToken: TokenGetter,
  data: { appointmentId: number; appointmentTypeId: string }
): Promise<unknown> {
  return apiPost(config.healanApiUrl, 'Appointment/ChangeStatus', getToken, data);
}

export async function fetchPatients(
  getToken: TokenGetter,
  params: { pageNumber?: number; pageSize?: number; filterText?: string } = {}
): Promise<PatientSummary[]> {
  const page = await apiGet<PaginatedResponse<PatientSummary>>(
    config.healanApiUrl,
    'Patient/PatientList',
    getToken,
    { pageNumber: params.pageNumber ?? 1, pageSize: params.pageSize ?? 50, filterText: params.filterText }
  );
  return pageItems(page);
}

export function patientDisplayName(p: PatientSummary): string {
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `بیمار ${p.patientId}`;
}

export function appointmentPatientLabel(a: AppointmentSummary): string {
  return a.patientName?.trim() || `بیمار #${a.patientId}`;
}
