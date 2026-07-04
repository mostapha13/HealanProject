import { request } from '@tse/tools';
import { HEALAN_API_URL } from '../constants';
import type {
  AppointmentSummary,
  CompanySummary,
  DashboardStats,
  DoctorSummary,
  EnumItem,
  InsuranceCompany,
  MedicalFeeService,
  PaginatedResponse,
  PatientSummary,
  PrescriptionSummary,
  ServiceType,
  UserSummary,
} from './types';

const BASE = HEALAN_API_URL;

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
    medicalGroups: () => get<EnumItem[]>('Doctor/MedicalGroupType'),
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
    pay: (data: Record<string, unknown>) => post('Appointment/InvoicePay', data),
    paymentMethods: () => get('Appointment/GetPaymentMethodTypes'),
    types: () => get('Appointment/AppointmentType'),
  },

  services: {
    list: (params?: { filterText?: string; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<ServiceType>>('ServiceTypes/List', { pageNumber: 1, pageSize: 200, ...params }),
    info: (serviceTypeId: number) =>
      get<ServiceType>(`ServiceTypes/Info/?serviceTypeId=${serviceTypeId}`),
    register: (data: Record<string, unknown>) => post('ServiceTypes/Register', data),
    categories: () => get<EnumItem[]>('ServiceTypes/CategoryType'),
  },

  insurance: {
    list: (params?: { pageNumber?: number; pageSize?: number; filterText?: string }) =>
      get<PaginatedResponse<InsuranceCompany>>('Insurance/InsuranceList', {
        pageNumber: 1,
        pageSize: 100,
        ...params,
      }),
    info: (insuranceCompanyId: number) =>
      get(`Insurance/InsuranceInfo/?insuranceCompanyId=${insuranceCompanyId}`),
    register: (data: Record<string, unknown>) => post('Insurance/Register', data),
    types: () => get<EnumItem[]>('Insurance/InsuranceType'),
    registerContract: (data: Record<string, unknown>) =>
      post('Insurance/RegisterInsuranceContract', data),
    contractList: (params?: Record<string, unknown>) =>
      get('Insurance/InsuranceContractList', params),
  },

  medicalFees: {
    list: (params?: Record<string, unknown>) =>
      get<PaginatedResponse<MedicalFeeService>>('MedicalFeeServices/List', {
        pageNumber: 1,
        pageSize: 100,
        ...params,
      }),
    register: (data: Record<string, unknown>) => post('MedicalFeeServices/Register', data),
  },

  companies: {
    list: (params?: { filterText?: string; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<CompanySummary>>('Company/CompanyList', {
        pageNumber: 1,
        pageSize: 100,
        ...params,
      }),
    info: (companyId: number) => get(`Company/CompanyInfo/?companyId=${companyId}`),
    register: (data: Record<string, unknown>) => post('Company/Register', data),
    registrationTypes: () => get<EnumItem[]>('Company/CompanyRegistrationTypes'),
  },

  users: {
    list: (params?: Record<string, unknown>) => get<PaginatedResponse<UserSummary>>('User/UserList', params),
    info: (userId: number) => get(`User/UserInfo/?userId=${userId}`),
    register: (data: Record<string, unknown>) => post('User/Register', data),
    current: () => get('User/CurrentUser/Fa'),
  },

  prescriptions: {
    list: (params: Record<string, unknown>) =>
      get<PaginatedResponse<PrescriptionSummary>>('OrderResult/PrescriptionList', params),
    info: (prescriptionId: number) =>
      get(`OrderResult/PrescriptionInfo/?prescriptionId=${prescriptionId}`),
    register: (data: Record<string, unknown>) => post('OrderResult/Register', data),
    imageTypes: () => get<EnumItem[]>('OrderResult/GetImageType'),
  },

  signature: {
    validateCertificate: (data: Record<string, unknown>) =>
      post('Signature/ValidateCertificate', data),
  },

  workflow: {
    userCardboard: (params?: Record<string, unknown>) =>
      get('Cardboard/UserCardboard/Fa', params),
  },
};

export default healanApi;
