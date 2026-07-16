export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DashboardStats {
  todayAppointments: number;
  waitingAppointments: number;
  inProgressAppointments: number;
  completedToday: number;
  totalPatients: number;
  totalDoctors: number;
  todayRevenue: number;
  pendingPayments: number;
  todayPrescriptions: number;
}

export interface ClinicAnalyticsSummary {
  totalAppointments: number;
  completedAppointments: number;
  scheduledAppointments: number;
  inProgressAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  patientRevenue: number;
  insuranceRevenue: number;
  pendingPayments: number;
  prescriptionCount: number;
}

export interface ClinicAnalyticsChartItem {
  name: string;
  value: number;
  count: number;
}

export interface ClinicAnalyticsTimePoint {
  label: string;
  value: number;
  count: number;
}

export interface ClinicAnalytics {
  startDate: string;
  endDate: string;
  summary: ClinicAnalyticsSummary;
  appointmentsByStatus: ClinicAnalyticsChartItem[];
  appointmentsOverTime: ClinicAnalyticsTimePoint[];
  revenueOverTime: ClinicAnalyticsTimePoint[];
  revenueByPaymentMethod: ClinicAnalyticsChartItem[];
  topServices: ClinicAnalyticsChartItem[];
  topDoctors: ClinicAnalyticsChartItem[];
  prescriptionsOverTime: ClinicAnalyticsTimePoint[];
  paymentStatusBreakdown: ClinicAnalyticsChartItem[];
}

export interface ClinicAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  doctorId?: number | null;
  patientId?: number | null;
  serviceTypeId?: number | null;
}

export interface SmsOutboxItem {
  id: number;
  createdAt: string;
  phoneNumber: string;
  extractedCode?: string | null;
  message: string;
  success: boolean;
  errorMessage?: string | null;
  traceNumber?: string | null;
  channel?: string;
}

export interface SmsSetting {
  smsSettingId: number;
  apiKeyMasked: string;
  hasApiKey: boolean;
  templateId: number;
  lineNumber: number;
  verifyParameterName: string;
  sendEnabled: boolean;
  updatedAt: string;
}

export interface PatientSummary {
  patientId: number;
  userId?: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber: string;
  birthdate?: string;
}

export interface DoctorSummary {
  doctorId: number;
  companyId?: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  medicalGroupTypeId?: number;
  medicalGroupTypeName?: string;
  medicalSystemNumber?: number;
  birthdate?: string;
}

export interface AppointmentSummary {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  patientName?: string;
  doctorName?: string;
  patientNationalCode?: string;
  patient?: Pick<PatientSummary, 'patientId' | 'firstName' | 'lastName' | 'nationalCode'>;
  doctor?: Pick<DoctorSummary, 'doctorId' | 'firstName' | 'lastName' | 'nationalCode' | 'medicalGroupTypeId' | 'medicalGroupTypeName'>;
  appointmentDate: string;
  appointmentTypeId: string;
  appointmentTypeName?: string;
  durationMinutes?: number;
  note?: string;
  primaryInsuranceCompany?: AppointmentInsuranceInfo | null;
  secondInsuranceCompany?: AppointmentInsuranceInfo | null;
  confirmPrimaryInsuranceCompany?: boolean;
  confirmSecondInsuranceCompany?: boolean;
  serviceTypes?: ServiceType[];
  invoices?: InvoiceSummary[];
  prescriptionId?: number | null;
  hasEchoReport?: boolean;
  patientHasVisitHistory?: boolean;
}

export interface InvoiceItemSummary {
  invoiceItemId?: number;
  serviceTypeId?: number;
  unitPrice?: number;
  quantity?: number;
  amount?: number;
  patientPayable?: number;
  primaryInsuranceCovered?: number;
  secondaryInsuranceCovered?: number;
  serviceType?: ServiceType;
}

export interface InvoiceSummary {
  invoiceId: number;
  invoiceStatusTypeId: string;
  invoiceStatusTypeName?: string;
  totalAmount: number;
  patientPayable: number;
  primaryInsuranceCovered: number;
  secondaryInsuranceCovered: number;
  invoiceItems?: InvoiceItemSummary[];
}

export interface ServiceType {
  serviceTypeId: number;
  title: string;
  code?: string;
  categoryTypeId?: number;
  description?: string;
  isActive?: boolean;
}

export interface InsuranceCompany {
  insuranceCompanyId: number;
  name: string;
  code?: string;
  insuranceTypeId?: number;
  insuranceTypeName?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface AppointmentInsuranceInfo {
  insuranceCompanyId?: number;
  name?: string;
  code?: string;
  insuranceTypeName?: string;
}

export interface CompanySummary {
  companyId: number;
  companyName: string;
  companyRegistrationTypeId?: number;
  latinCompanyName?: string;
  nationalId?: string;
  address?: string;
  email?: string;
  isActive?: boolean;
}

export interface MedicalFeeService {
  medicalFeeServiceId: number;
  serviceTypeId: number;
  serviceTypeTitle?: string;
  serviceTypeName?: string;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserRoleInfo {
  roleName?: string;
  roleTitle?: string;
}

export interface UserRoleDto {
  name: string;
  displayName: string;
}

export interface UserSummary {
  userId: number;
  identityUserId?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userName?: string;
  userTypeId?: number;
  userTypeName?: string;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  departmentName?: string;
  roleTitle?: string;
  roles?: UserRoleInfo[];
  userRoles?: UserRoleDto[];
}

export interface CurrentUserResponse {
  userSummaryReply?: UserSummary;
  hasConfirmed?: boolean;
  hasAccessToConfirmForm?: boolean;
}

export interface PrescriptionSummary {
  prescriptionId: number;
  appointmentId?: number;
  issueDate?: string;
  notes?: string;
  patientName?: string;
  doctorName?: string;
  hasEchoReport?: boolean;
}

export interface AttachmentInfo {
  link?: string;
  fileName?: string;
  fileId?: string;
  fileType?: string;
}

export interface PrescriptionDrugRow {
  drugName: string;
  dosage: string;
  usageInstructions: string;
}

import type { FileUploadMeta } from '../api/fileApi';

export interface PrescriptionLabRow {
  labTestType: string;
  notes: string;
  attachmentId: string | null;
  uploadMeta: FileUploadMeta | null;
}

export interface PrescriptionImagingRow {
  imageTypeId: number;
  notes: string;
  attachmentId: string | null;
  uploadMeta: FileUploadMeta | null;
}

export interface PrescriptionDetail {
  prescriptionId: number;
  appointmentId: number;
  issueDate?: string;
  notes?: string;
  nextAppointmentDate?: string;
  prescriptionDrugs?: PrescriptionDrugRow[];
  labTestRequests?: {
    labTestType?: string;
    notes?: string;
    attachmentId?: string;
    attachment?: AttachmentInfo;
  }[];
  imagingRequests?: {
    imageTypeId?: number | string;
    notes?: string;
    attachmentId?: string;
    attachment?: AttachmentInfo;
  }[];
  echoReport?: Record<string, unknown> | null;
}

export interface PatientVisitHistoryItem {
  appointmentId: number;
  appointmentDate: string;
  appointmentStatus: string;
  doctorName?: string;
  prescriptionId?: number | null;
  prescriptionIssueDate?: string;
  prescriptionNotes?: string;
  hasEchoReport?: boolean;
  drugs?: PrescriptionDrugRow[];
  labs?: {
    labTestType: string;
    notes?: string;
    attachmentId?: string;
    attachmentLink?: string;
    attachmentFileName?: string;
  }[];
  imaging?: {
    imageTypeId: number;
    imageTypeName: string;
    notes?: string;
    attachmentId?: string;
    attachmentLink?: string;
    attachmentFileName?: string;
  }[];
}

export interface EchoPrintData {
  prescriptionId: number;
  appointmentId: number;
  patientName: string;
  patientNationalCode?: string;
  patientBirthdate?: string;
  patientAge?: string;
  examDate: string;
  echo: Record<string, unknown>;
}

export interface EnumItem {
  key: number;
  name: string;
  displayName?: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow'
  | 'ReScheduled';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  Scheduled: 'در انتظار',
  InProgress: 'در حال ویزیت',
  Completed: 'انجام شده',
  Cancelled: 'لغو شده',
  NoShow: 'عدم حضور',
  ReScheduled: 'جابجا شده',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  Scheduled: '#f59e0b',
  InProgress: '#3b82f6',
  Completed: '#10b981',
  Cancelled: '#ef4444',
  NoShow: '#6b7280',
  ReScheduled: '#8b5cf6',
};

export type PortalSectionType =
  | 'HeroSlide'
  | 'TrustBadge'
  | 'Service'
  | 'WhyUsFeature'
  | 'AboutBlock'
  | 'NavLink'
  | 'CustomSection'
  | 'HeroStat';

export type PatientReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PortalContentItem {
  portalContentItemId: number;
  sectionType: PortalSectionType;
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  imageFileId?: string;
  iconName?: string;
  linkUrl?: string;
  color?: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface PortalSiteSetting {
  portalSiteSettingId: number;
  settingKey: string;
  settingValue: string;
  settingGroup?: string;
  description?: string;
}

export interface PatientReviewItem {
  patientReviewId: number;
  displayName: string;
  contactInfo: string;
  reviewText: string;
  rating: number;
  status: PatientReviewStatus;
  sortOrder: number;
  adminNote?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface BlogPostSummary {
  blogPostId: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  coverImageFileId?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  body: string;
}

export interface RagKnowledgeItem {
  ragKnowledgeItemId: number;
  question: string;
  questionSummary?: string;
  keywords?: string;
  topic?: string;
  answer: string;
  similarQuestions?: string;
  priority: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  lastModifiedAt?: string;
}

export interface RagSetting {
  ragSettingId: number;
  syncIntervalMinutes: number;
  similarityThresholdPercent: number;
  pythonApiUrl: string;
  isEnabled: boolean;
  lastSyncedAt?: string;
}
