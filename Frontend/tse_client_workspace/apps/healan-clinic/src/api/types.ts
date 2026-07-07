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
  doctor?: Pick<DoctorSummary, 'doctorId' | 'firstName' | 'lastName' | 'nationalCode'>;
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
}

export interface InsuranceCompany {
  insuranceCompanyId: number;
  name: string;
  code?: string;
  insuranceTypeId?: number;
  insuranceTypeName?: string;
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
  latinCompanyName?: string;
  nationalId?: string;
  address?: string;
  email?: string;
}

export interface MedicalFeeService {
  medicalFeeServiceId: number;
  serviceTypeId: number;
  serviceTypeTitle?: string;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserRoleInfo {
  roleName?: string;
  roleTitle?: string;
}

export interface UserSummary {
  userId: number;
  identityUserId?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userName?: string;
  userTypeId?: number;
  isActive?: boolean;
  departmentName?: string;
  roleTitle?: string;
  roles?: UserRoleInfo[];
}

export interface UserRoleDto {
  name: string;
  displayName: string;
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
