import { request } from '@tse/tools';
import { HEALAN_API_URL } from '../constants';
import { clampPageSize, fetchAllPaginated, HEALAN_MAX_PAGE_SIZE } from '../utils/pagination';
import type {
  AppointmentSummary,
  ClinicAnalytics,
  ClinicAnalyticsFilters,
  CompanySummary,
  DashboardStats,
  DoctorSummary,
  EnumItem,
  InsuranceCompany,
  MedicalFeeService,
  PaginatedResponse,
  PatientSummary,
  EchoPrintData,
  PatientVisitHistoryItem,
  PrescriptionDetail,
  PrescriptionSummary,
  ServiceType,
  UserSummary,
  CurrentUserResponse,
  PortalContentItem,
  PortalSiteSetting,
  PatientReviewItem,
} from './types';

const BASE = HEALAN_API_URL;

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request.get({ baseUrl: BASE, url, options: params ?? {} }) as Promise<T>;
}

async function post<T>(url: string, data: unknown): Promise<T> {
  return request.post({ baseUrl: BASE, url, options: data }) as Promise<T>;
}

function pagedParams(params?: Record<string, unknown>): Record<string, unknown> {
  const pageNumber = Number(params?.['pageNumber'] ?? 1) || 1;
  const pageSize = clampPageSize(Number(params?.['pageSize'] ?? HEALAN_MAX_PAGE_SIZE));
  return { ...params, pageNumber, pageSize };
}

export const healanApi = {
  dashboard: {
    stats: () => get<DashboardStats>('Dashboard/Stats'),
  },

  reports: {
    analytics: (params: ClinicAnalyticsFilters = {}) => {
      const query: Record<string, unknown> = {};
      if (params.startDate) query['startDate'] = params.startDate;
      if (params.endDate) query['endDate'] = params.endDate;
      if (params.doctorId && params.doctorId > 0) query['doctorId'] = params.doctorId;
      if (params.patientId && params.patientId > 0) query['patientId'] = params.patientId;
      if (params.serviceTypeId && params.serviceTypeId > 0) query['serviceTypeId'] = params.serviceTypeId;
      return get<ClinicAnalytics>('ClinicReports/Analytics', query);
    },
  },

  patients: {
    list: (params: { filterText?: string; pageNumber?: number; pageSize?: number } = {}) =>
      get<PaginatedResponse<PatientSummary>>('Patient/PatientList', pagedParams(params)),
    listAll: (params: { filterText?: string } = {}) =>
      fetchAllPaginated<PatientSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<PatientSummary>>('Patient/PatientList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (patientId: number) =>
      get<PatientSummary & { userId?: number }>(`Patient/PatientInfo/?patientId=${patientId}`),
    register: (data: Record<string, unknown>) =>
      post<{ id: number; loginUserName?: string; initialPassword?: string }>('Patient/Register', data),
    byNationalCode: (nationalCode: string) =>
      get<PatientSummary>(`Patient/PatientInfoByNationalCode/?nationalCode=${nationalCode}`),
    visitHistory: (patientId: number) =>
      get<PatientVisitHistoryItem[]>(`Patient/VisitHistory/?patientId=${patientId}`),
  },

  doctors: {
    list: (params: { filterText?: string; pageNumber?: number; pageSize?: number } = {}) =>
      get<PaginatedResponse<DoctorSummary>>('Doctor/DoctorList', pagedParams(params)),
    listAll: (params: { filterText?: string } = {}) =>
      fetchAllPaginated<DoctorSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<DoctorSummary>>('Doctor/DoctorList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (doctorId: number) =>
      get<DoctorSummary>(`Doctor/DoctorInfo/?doctorId=${doctorId}`),
    register: (data: Record<string, unknown>) =>
      post<{ id: number }>('Doctor/Register', data),
    medicalGroups: () => get<EnumItem[]>('Doctor/MedicalGroupType'),
  },

  appointments: {
    list: (params: Record<string, unknown> = {}) =>
      get<PaginatedResponse<AppointmentSummary>>('Appointment/AppointmentList', pagedParams(params)),
    listAll: (params: Record<string, unknown> = {}) =>
      fetchAllPaginated<AppointmentSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<AppointmentSummary>>('Appointment/AppointmentList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    today: (params: Record<string, unknown> = {}) =>
      get<PaginatedResponse<AppointmentSummary>>('Appointment/CurrentAppointmentList', pagedParams(params)),
    todayAll: (params: Record<string, unknown> = {}) =>
      fetchAllPaginated<AppointmentSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<AppointmentSummary>>('Appointment/CurrentAppointmentList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
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
      get<PaginatedResponse<ServiceType>>('ServiceTypes/List', pagedParams(params)),
    listAll: (params?: { filterText?: string }) =>
      fetchAllPaginated<ServiceType>((pageNumber, pageSize) =>
        get<PaginatedResponse<ServiceType>>('ServiceTypes/List', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (serviceTypeId: number) =>
      get<ServiceType>(`ServiceTypes/Info/?serviceTypeId=${serviceTypeId}`),
    register: (data: Record<string, unknown>) => post('ServiceTypes/Register', data),
    delete: (serviceTypeId: number) => post('ServiceTypes/Delete', { serviceTypeId }),
    categories: () => get<EnumItem[]>('ServiceTypes/CategoryType'),
  },

  insurance: {
    list: (params?: { pageNumber?: number; pageSize?: number; filterText?: string }) =>
      get<PaginatedResponse<InsuranceCompany>>('Insurance/InsuranceList', pagedParams(params)),
    listAll: (params?: { filterText?: string }) =>
      fetchAllPaginated<InsuranceCompany>((pageNumber, pageSize) =>
        get<PaginatedResponse<InsuranceCompany>>('Insurance/InsuranceList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (insuranceCompanyId: number) =>
      get(`Insurance/InsuranceInfo/?insuranceCompanyId=${insuranceCompanyId}`),
    register: (data: Record<string, unknown>) => post('Insurance/Register', data),
    types: () => get<EnumItem[]>('Insurance/InsuranceType'),
    registerContract: (data: Record<string, unknown>) =>
      post('Insurance/RegisterInsuranceContract', data),
    contractList: (params?: Record<string, unknown>) =>
      get('Insurance/InsuranceContractList', pagedParams(params)),
  },

  medicalFees: {
    list: (params?: Record<string, unknown>) =>
      get<PaginatedResponse<MedicalFeeService>>('MedicalFeeServices/List', pagedParams(params)),
    listAll: (params?: Record<string, unknown>) =>
      fetchAllPaginated<MedicalFeeService>((pageNumber, pageSize) =>
        get<PaginatedResponse<MedicalFeeService>>('MedicalFeeServices/List', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    register: (data: Record<string, unknown>) => post('MedicalFeeServices/Register', data),
  },

  companies: {
    list: (params?: { filterText?: string; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<CompanySummary>>('Company/CompanyList', pagedParams(params)),
    listAll: (params?: { filterText?: string }) =>
      fetchAllPaginated<CompanySummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<CompanySummary>>('Company/CompanyList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (companyId: number) => get(`Company/CompanyInfo/?companyId=${companyId}`),
    register: (data: Record<string, unknown>) => post('Company/Register', data),
    registrationTypes: () => get<EnumItem[]>('Company/CompanyRegistrationTypes'),
  },

  users: {
    list: (params?: Record<string, unknown>) =>
      get<PaginatedResponse<UserSummary>>('User/UserList', pagedParams(params)),
    listAll: (params?: Record<string, unknown>) =>
      fetchAllPaginated<UserSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<UserSummary>>('User/UserList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (userId: number) => get(`User/UserInfo/?userId=${userId}`),
    register: (data: Record<string, unknown>) => post('User/Register', data),
    current: () => get<CurrentUserResponse>('User/CurrentUser/Fa'),
  },

  prescriptions: {
    list: (params: Record<string, unknown> = {}) =>
      get<PaginatedResponse<PrescriptionSummary>>('OrderResult/PrescriptionList', pagedParams(params)),
    listAll: (params: Record<string, unknown> = {}) =>
      fetchAllPaginated<PrescriptionSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<PrescriptionSummary>>('OrderResult/PrescriptionList', {
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (prescriptionId: number) =>
      get<PrescriptionDetail>(`OrderResult/PrescriptionInfo/?prescriptionId=${prescriptionId}`),
    register: (data: Record<string, unknown>) =>
      post<{ prescriptionId?: number; id?: number }>('OrderResult/Register', data),
    imageTypes: () => get<EnumItem[]>('OrderResult/GetImageType'),
    echoPrintData: (prescriptionId: number) =>
      get<EchoPrintData>(`OrderResult/EchoReportPrintData/?prescriptionId=${prescriptionId}`),
  },

  signature: {
    validateCertificate: (data: Record<string, unknown>) =>
      post('Signature/ValidateCertificate', data),
  },

  workflow: {
    userCardboard: (params?: Record<string, unknown>) =>
      get('Cardboard/UserCardboard/Fa', pagedParams(params)),
  },

  portal: {
    contentList: (params?: { sectionType?: string; isPublished?: boolean }) =>
      get<PortalContentItem[]>('PortalContent/ContentList', params ?? {}),
    contentRegister: (data: Record<string, unknown>) => post('PortalContent/ContentRegister', data),
    contentDelete: (portalContentItemId: number) =>
      post('PortalContent/ContentDelete', { portalContentItemId }),
    settingList: () => get<PortalSiteSetting[]>('PortalContent/SettingList'),
    settingSave: (settings: PortalSiteSetting[]) => post('PortalContent/SettingSave', { settings }),
    reviewList: (status?: string) =>
      get<PatientReviewItem[]>('PatientReview/List', status ? { status } : {}),
    reviewModerate: (data: Record<string, unknown>) => post('PatientReview/Moderate', data),
    reviewDelete: (patientReviewId: number) => post('PatientReview/Delete', { patientReviewId }),
  },
};

export default healanApi;
