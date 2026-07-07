import { request } from '@tse/tools';
import { environment } from '../../environments/environment';
import type {
  AppointmentSummary,
  DashboardStats,
  DoctorSummary,
  InsuranceCompany,
  PaginatedResponse,
  PatientSummary,
  PrescriptionSummary,
  ServiceType,
} from './types';

const BASE = environment.healanApiUrl;

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request.get({ baseUrl: BASE, url, options: params ?? {} }) as Promise<T>;
}

async function post<T>(url: string, data: unknown): Promise<T> {
  return request.post({ baseUrl: BASE, url, options: data }) as Promise<T>;
}

export const healanApi = {
  dashboard: {
    stats: () => get<DashboardStats>('Dashboard/Stats'),
  },

  patients: {
    list: (params: { filterText?: string; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<PatientSummary>>('Patient/PatientList', params),
    info: (patientId: number) =>
      get<PatientSummary>(`Patient/PatientInfo/?patientId=${patientId}`),
    register: (data: Record<string, unknown>) =>
      post<{ patientId: number }>('Patient/Register', data),
    byNationalCode: (nationalCode: string) =>
      get<PatientSummary>(`Patient/PatientInfoByNationalCode/?nationalCode=${nationalCode}`),
  },

  doctors: {
    list: (params: { filterText?: string; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<DoctorSummary>>('Doctor/DoctorList', params),
    info: (doctorId: number) =>
      get<DoctorSummary>(`Doctor/DoctorInfo/?doctorId=${doctorId}`),
    register: (data: Record<string, unknown>) =>
      post<{ doctorId: number }>('Doctor/Register', data),
    medicalGroups: () => get<{ key: number; name: string; displayName?: string }[]>('Doctor/MedicalGroupType'),
  },

  appointments: {
    list: (params: Record<string, unknown>) =>
      get<PaginatedResponse<AppointmentSummary>>('Appointment/AppointmentList', params),
    today: (params: Record<string, unknown>) =>
      get<PaginatedResponse<AppointmentSummary>>('Appointment/CurrentAppointmentList', params),
    info: (appointmentId: number) =>
      get<AppointmentSummary>(`Appointment/AppointmentInfo/?appointmentId=${appointmentId}`),
    register: (data: Record<string, unknown>) =>
      post<{ appointmentId: number }>('Appointment/Register', data),
    changeStatus: (data: { appointmentId: number; appointmentTypeId: string }) =>
      post('Appointment/ChangeStatus', data),
    invoice: (appointmentId: number) =>
      get(`Appointment/GetInvoice/?appointmentId=${appointmentId}`),
    pay: (data: Record<string, unknown>) =>
      post('Appointment/InvoicePay', data),
    paymentMethods: () => get('Appointment/GetPaymentMethodTypes'),
    types: () => get('Appointment/AppointmentType'),
    byNationalCode: (nationalCode: string) =>
      get(`Appointment/GetAppointmentByNationalCode/?nationalCode=${nationalCode}`),
  },

  services: {
    list: () =>
      get<PaginatedResponse<ServiceType>>('ServiceTypes/List', { pageNumber: 1, pageSize: 200 }),
  },

  insurance: {
    list: (params?: { pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<InsuranceCompany>>('Insurance/InsuranceList', {
        pageNumber: 1,
        pageSize: 100,
        ...params,
      }),
  },

  prescriptions: {
    list: (params: Record<string, unknown>) =>
      get<PaginatedResponse<PrescriptionSummary>>('OrderResult/PrescriptionList', params),
    info: (prescriptionId: number) =>
      get(`OrderResult/PrescriptionInfo/?prescriptionId=${prescriptionId}`),
    register: (data: Record<string, unknown>) =>
      post('OrderResult/Register', data),
    imageTypes: () => get('OrderResult/GetImageType'),
  },
};

export default healanApi;
