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
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber: string;
  birthdate?: string;
}

export interface DoctorSummary {
  doctorId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  medicalGroupTypeName?: string;
}

export interface AppointmentSummary {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  patientName?: string;
  doctorName?: string;
  appointmentDate: string;
  appointmentTypeId: string;
  appointmentTypeName?: string;
  durationMinutes?: number;
  note?: string;
  invoices?: InvoiceSummary[];
}

export interface InvoiceSummary {
  invoiceId: number;
  invoiceStatusTypeId: string;
  totalAmount: number;
  patientPayable: number;
  primaryInsuranceCovered: number;
  secondaryInsuranceCovered: number;
}

export interface ServiceType {
  serviceTypeId: number;
  title: string;
}

export interface InsuranceCompany {
  insuranceCompanyId: number;
  name: string;
}

export interface PrescriptionSummary {
  prescriptionId: number;
  appointmentId?: number;
  issueDate?: string;
  notes?: string;
  patientName?: string;
  doctorName?: string;
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
