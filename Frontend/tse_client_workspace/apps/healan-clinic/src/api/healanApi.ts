import { request } from '@tse/tools';
import { HEALAN_API_URL } from '../constants';
import { userManager } from '../store/userManager';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';
import { clampPageSize, fetchAllPaginated } from '../utils/pagination';
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
  PatientBloodPressureHistoryResult,
  PrescriptionDetail,
  PrescriptionSummary,
  ServiceType,
  UserSummary,
  CurrentUserResponse,
  PortalContentItem,
  PortalSiteSetting,
  PatientReviewItem,
  BlogPostSummary,
  BlogPostDetail,
  RagKnowledgeItem,
  RagSetting,
  RagChatLogItem,
  SmsOutboxItem,
  SmsSetting,
  ScheduleTemplateItem,
  ScheduleExceptionItem,
  AppointmentSlotItem,
  AppointmentBookingItem,
  BookingAcceptResult,
} from './types';

const BASE = HEALAN_API_URL;

async function accessToken(): Promise<string | undefined> {
  try {
    const user = await userManager.getUser();
    if (user?.access_token && !user.expired) {
      setClinicBearerToken(user.access_token);
      return user.access_token;
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const token = await accessToken();
  return request.get({ baseUrl: BASE, url, options: params ?? {}, token }) as Promise<T>;
}

async function post<T>(url: string, data: unknown): Promise<T> {
  const token = await accessToken();
  return request.post({ baseUrl: BASE, url, options: data, token }) as Promise<T>;
}

function pagedParams(params?: Record<string, unknown>): Record<string, unknown> {
  const pageNumber = Number(params?.['pageNumber'] ?? 1) || 1;
  const pageSize = clampPageSize(
    params?.['pageSize'] == null ? undefined : Number(params['pageSize'])
  );
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
    smsOutbox: (params: { phone?: string; pageNumber?: number; pageSize?: number } = {}) =>
      get<PaginatedResponse<SmsOutboxItem>>(
        'ClinicReports/SmsOutbox',
        pagedParams({
          phone: params.phone,
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
        })
      ),
    smsSettingsGet: () => get<SmsSetting>('ClinicReports/SmsSettings'),
    smsSettingsSave: (data: {
      apiKey?: string;
      templateId: number;
      lineNumber: number;
      verifyParameterName?: string;
      sendEnabled: boolean;
    }) => post<SmsSetting>('ClinicReports/SmsSettingsSave', data),
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
    bloodPressureHistory: (params: { nationalCode?: string; patientId?: number }) =>
      get<PatientBloodPressureHistoryResult>('ClinicBloodPressure/History', {
        nationalCode: params.nationalCode,
        patientId: params.patientId,
      }),
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
    listActive: (params?: { filterText?: string }) =>
      fetchAllPaginated<ServiceType>((pageNumber, pageSize) =>
        get<PaginatedResponse<ServiceType>>('ServiceTypes/List', {
          ...params,
          onlyActive: true,
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
      get<PaginatedResponse<UserSummary>>('User/UserList', pagedParams({ filterText: '', ...params })),
    listAll: (params?: Record<string, unknown>) =>
      fetchAllPaginated<UserSummary>((pageNumber, pageSize) =>
        get<PaginatedResponse<UserSummary>>('User/UserList', {
          filterText: '',
          ...params,
          pageNumber,
          pageSize,
        })
      ),
    info: (userId: number) => get(`User/UserInfo/?userId=${userId}`),
    register: (data: Record<string, unknown>) => post('User/Register', data),
    current: () => get<CurrentUserResponse>('User/CurrentUser/Fa'),
    updateMyProfile: (data: { firstName: string; lastName: string; phoneNumber: string }) =>
      post('User/UpdateMyProfile', data),
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
    blogList: (params?: { filterText?: string; isPublished?: boolean; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<BlogPostSummary>>('BlogPost/List', pagedParams(params)),
    blogInfo: (blogPostId: number) =>
      get<BlogPostDetail>(`BlogPost/Info/?blogPostId=${blogPostId}`),
    blogRegister: (data: Record<string, unknown>) => post('BlogPost/Register', data),
    blogDelete: (blogPostId: number) => post('BlogPost/Delete', { blogPostId }),
    ragList: (params?: { filterText?: string; topic?: string; isActive?: boolean; pageNumber?: number; pageSize?: number }) =>
      get<PaginatedResponse<RagKnowledgeItem>>('RagKnowledge/List', pagedParams(params)),
    ragInfo: (ragKnowledgeItemId: number) =>
      get<RagKnowledgeItem>(`RagKnowledge/Info/?ragKnowledgeItemId=${ragKnowledgeItemId}`),
    ragRegister: (data: Record<string, unknown>) => post('RagKnowledge/Register', data),
    ragDelete: (ragKnowledgeItemId: number) => post('RagKnowledge/Delete', { ragKnowledgeItemId }),
    ragSettingGet: () => get<RagSetting>('RagKnowledge/SettingGet'),
    ragSettingSave: (data: RagSetting) => post<RagSetting>('RagKnowledge/SettingSave', data),
    ragChatLogList: (params?: {
      filterText?: string;
      phone?: string;
      fromUtc?: string;
      toUtc?: string;
      authenticatedOnly?: boolean;
      pageNumber?: number;
      pageSize?: number;
    }) => get<PaginatedResponse<RagChatLogItem>>('RagKnowledge/ChatLogList', pagedParams(params)),
  },

  booking: {
    templateList: (doctorId?: number) =>
      get<ScheduleTemplateItem[]>('BookingSchedule/TemplateList', doctorId ? { doctorId } : {}),
    templateSave: (data: Record<string, unknown>) =>
      post<ScheduleTemplateItem>('BookingSchedule/TemplateSave', data),
    templateDelete: (doctorScheduleTemplateId: number) =>
      post('BookingSchedule/TemplateDelete', { doctorScheduleTemplateId }),
    templateCopy: (data: { doctorId: number; sourceDayOfWeek: number; targetDayOfWeeks: number[] }) =>
      post('BookingSchedule/TemplateCopy', data),
    generateSlots: (data: { doctorId: number; fromDate: string; toDate: string }) =>
      post<{ added: number }>('BookingSchedule/GenerateSlots', data),
    exceptionList: (params: { doctorId: number; fromDate?: string; toDate?: string }) =>
      get<ScheduleExceptionItem[]>('BookingSchedule/ExceptionList', params),
    exceptionSave: (data: Record<string, unknown>) =>
      post<ScheduleExceptionItem>('BookingSchedule/ExceptionSave', data),
    slotList: (params: Record<string, unknown> = {}) =>
      get<PaginatedResponse<AppointmentSlotItem>>('BookingSchedule/SlotList', pagedParams(params)),
    slotBlock: (data: { appointmentSlotId: number; block: boolean; note?: string }) =>
      post('BookingSchedule/SlotBlock', data),
    slotManualCreate: (data: Record<string, unknown>) =>
      post<AppointmentSlotItem>('BookingSchedule/SlotManualCreate', data),
    reservationList: (params: Record<string, unknown> = {}) =>
      get<PaginatedResponse<AppointmentBookingItem>>('BookingReservation/List', pagedParams(params)),
    reservationCreate: (data: Record<string, unknown>) =>
      post<AppointmentBookingItem>('BookingReservation/Create', data),
    reservationCancel: (appointmentBookingId: number) =>
      post('BookingReservation/Cancel', { appointmentBookingId, byStaff: true }),
    reservationNoShow: (appointmentBookingId: number) =>
      post('BookingReservation/NoShow', { appointmentBookingId }),
    reservationDelete: (appointmentBookingId: number) =>
      post('BookingReservation/Delete', { appointmentBookingId }),
    reservationMove: (data: { appointmentBookingId: number; newAppointmentSlotId: number }) =>
      post<AppointmentBookingItem>('BookingReservation/Move', data),
    reservationUpdateNote: (data: { appointmentBookingId: number; note?: string }) =>
      post('BookingReservation/UpdateNote', data),
    reservationAccept: (appointmentBookingId: number, appointmentId?: number) =>
      post<BookingAcceptResult>('BookingReservation/Accept', {
        appointmentBookingId,
        ...(appointmentId ? { appointmentId } : {}),
      }),
  },
};

export default healanApi;
