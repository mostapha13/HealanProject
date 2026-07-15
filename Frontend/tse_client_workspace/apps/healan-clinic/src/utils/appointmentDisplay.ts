import type { AppointmentStatus, AppointmentSummary } from '../api/types';

function fullName(firstName?: string, lastName?: string): string {
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return name || '—';
}

function isPaidStatus(status?: string): boolean {
  return status === 'Paid' || status === 'Paied';
}

export function appointmentPatientName(appointment: AppointmentSummary): string {
  if (appointment.patientName) return appointment.patientName;
  return fullName(appointment.patient?.firstName, appointment.patient?.lastName);
}

export function appointmentDoctorName(appointment: AppointmentSummary): string {
  if (appointment.doctorName) return appointment.doctorName;
  return fullName(appointment.doctor?.firstName, appointment.doctor?.lastName);
}

/** پزشک + گروه پزشکی — مثال: شهرویی · قلب و عروق */
export function appointmentDoctorDisplay(appointment: AppointmentSummary): string {
  const name = appointmentDoctorName(appointment);
  const group = appointment.doctor?.medicalGroupTypeName?.trim();
  if (group && name !== '—') return `${name} · ${group}`;
  if (group) return group;
  return name;
}

export function appointmentDoctorGroupKey(appointment: AppointmentSummary): string {
  return `${appointment.doctorId ?? 0}|${appointmentDoctorName(appointment)}`;
}

export function appointmentPatientNationalCode(appointment: AppointmentSummary): string {
  return appointment.patient?.nationalCode ?? appointment.patientNationalCode ?? '—';
}

/** نام بیمار همراه کد ملی — مثال: ۰۰۱۲۳۴۵۶۷۸ — علی احمدی */
export function appointmentPatientDisplay(appointment: AppointmentSummary): string {
  const name = appointmentPatientName(appointment);
  const code = appointment.patient?.nationalCode ?? appointment.patientNationalCode;
  if (code && name !== '—') return `${code} — ${name}`;
  if (code) return code;
  return name;
}

/** بیمه پایه و تکمیلی — مثال: تأمین اجتماعی / بیمه سلامت */
export function appointmentInsuranceDisplay(appointment: AppointmentSummary): string {
  const names: string[] = [];
  const primary = appointment.primaryInsuranceCompany?.name?.trim();
  const second = appointment.secondInsuranceCompany?.name?.trim();
  if (primary) names.push(primary);
  if (second) names.push(second);
  return names.length > 0 ? names.join(' / ') : 'بدون بیمه';
}

export function appointmentPendingInvoice(appointment: AppointmentSummary) {
  return appointment.invoices?.find((i) => !isPaidStatus(i.invoiceStatusTypeId));
}

export function appointmentPaidInvoices(appointment: AppointmentSummary) {
  return appointment.invoices?.filter((i) => isPaidStatus(i.invoiceStatusTypeId)) ?? [];
}

export function appointmentHasPaidInvoice(appointment: AppointmentSummary): boolean {
  return appointmentPaidInvoices(appointment).length > 0;
}

/** فاکتور فعال — اولویت با فاکتور در انتظار پرداخت */
export function appointmentInvoice(appointment: AppointmentSummary) {
  return appointmentPendingInvoice(appointment) ?? appointment.invoices?.[0];
}

export function appointmentIsPaid(appointment: AppointmentSummary): boolean {
  if (appointmentPendingInvoice(appointment)) return false;
  return appointmentHasPaidInvoice(appointment);
}

/** ویزیت بدون پرداخت هم قابل شروع است — پرداخت می‌تواند قبل یا بعد از ویزیت انجام شود */
export function appointmentCanStartVisit(_appointment: AppointmentSummary): boolean {
  return true;
}

export function appointmentIsScheduled(status: AppointmentStatus | string): boolean {
  return status === 'Scheduled' || status === 'ReScheduled';
}

export function appointmentIsDuringVisit(status: AppointmentStatus | string): boolean {
  return status === 'InProgress';
}

export function appointmentCanRecordClinicalWork(status: AppointmentStatus | string): boolean {
  return status === 'InProgress' || status === 'Completed';
}

export function appointmentPaymentLabel(appointment: AppointmentSummary): string {
  const pending = appointmentPendingInvoice(appointment);
  const hasPaid = appointmentHasPaidInvoice(appointment);
  if (pending && hasPaid) return 'پرداخت مکمل';
  if (pending) return pending.invoiceStatusTypeName ?? 'در انتظار پرداخت';
  if (hasPaid) return 'پرداخت شده';
  return 'بدون فاکتور';
}

export function appointmentPaymentColor(appointment: AppointmentSummary): string {
  const pending = appointmentPendingInvoice(appointment);
  if (pending) return '#f59e0b';
  if (appointmentHasPaidInvoice(appointment)) return '#10b981';
  return '#6b7280';
}

export function appointmentServiceTitles(appointment: AppointmentSummary): string {
  const titles = appointment.serviceTypes?.map((s) => s.title).filter(Boolean) ?? [];
  return titles.length > 0 ? titles.join('، ') : '—';
}

export function prescriptionPatientName(
  prescription: { patientName?: string; appointmentId?: number },
  appointments: AppointmentSummary[] = []
): string {
  if (prescription.patientName?.trim()) return prescription.patientName.trim();
  const appointment = appointments.find((a) => a.appointmentId === prescription.appointmentId);
  return appointment ? appointmentPatientName(appointment) : '—';
}

export function prescriptionDoctorName(
  prescription: { doctorName?: string; appointmentId?: number },
  appointments: AppointmentSummary[] = []
): string {
  if (prescription.doctorName?.trim()) return prescription.doctorName.trim();
  const appointment = appointments.find((a) => a.appointmentId === prescription.appointmentId);
  return appointment ? appointmentDoctorName(appointment) : '—';
}

/** عنوان خدمت برای ردیف فاکتور */
export function invoiceItemServiceTitle(
  item: { serviceTypeId?: number; serviceType?: { title?: string; serviceTypeId?: number } },
  appointment?: AppointmentSummary
): string {
  const direct = item.serviceType?.title?.trim();
  if (direct) return direct;

  const serviceTypeId = item.serviceTypeId ?? item.serviceType?.serviceTypeId;
  if (serviceTypeId && appointment?.serviceTypes?.length) {
    const match = appointment.serviceTypes.find((s) => s.serviceTypeId === serviceTypeId);
    if (match?.title) return match.title;
  }

  return '—';
}
