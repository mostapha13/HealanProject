/** ابزارهای ساخت payload سازگار با API Healan (nullable، id=0، رشته خالی) */

export type ApiPayload = Record<string, unknown>;

/** رشته خالی → null؛ undefined → undefined (حذف از payload) */
export function nullIfEmpty(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === '') return null;
  return value;
}

/** شناسه ۰ یا منفی → undefined (ایجاد رکورد جدید) */
export function idOrUndefined(id: number | null | undefined): number | undefined {
  if (id == null || id <= 0) return undefined;
  return id;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

export function isoDate(value: string | null | undefined): string | undefined {
  const trimmed = toLatinDigits(value?.trim() ?? '');
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/** مقدار ورودی type=date از رشته ISO یا تاریخ API */
export function toDateInputValue(value: string | null | undefined): string {
  const iso = isoDate(value);
  return iso ? iso.slice(0, 10) : '';
}

/** مقدار ورودی datetime-local از رشته ISO یا تاریخ API */
export function toDateTimeLocalValue(value: string | null | undefined): string {
  const iso = isoDate(value);
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface UserRoleDto {
  name: string;
  displayName: string;
}

/** نقش Identity متناظر با UserTypeId در Healan */
export const ACCESS_ROLE_BY_USER_TYPE: Record<number, UserRoleDto> = {
  2: { name: 'Admin', displayName: 'مدیر' },
  3: { name: 'Secretary', displayName: 'منشی' },
  7: { name: 'Doctor', displayName: 'پزشک' },
  8: { name: 'Accountant', displayName: 'حسابدار' },
};

export function rolesForUserType(userTypeId: number): UserRoleDto[] {
  const role = ACCESS_ROLE_BY_USER_TYPE[userTypeId];
  if (!role) return [{ name: 'Healan', displayName: 'پذیرش' }];
  return [role, { name: 'Healan', displayName: 'پذیرش' }];
}

export interface PatientForm {
  patientId: number;
  userId?: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber: string;
  birthdate?: string;
}

export function buildPatientPayload(form: PatientForm): ApiPayload {
  const payload: ApiPayload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    nationalCode: form.nationalCode.trim(),
    phoneNumber: form.phoneNumber.trim(),
  };
  const patientId = idOrUndefined(form.patientId);
  if (patientId) payload['patientId'] = patientId;
  const userId = idOrUndefined(form.userId);
  if (userId) payload['userId'] = userId;
  const birthdate = isoDate(form.birthdate);
  if (birthdate) payload['birthdate'] = birthdate;
  return payload;
}

export interface DoctorForm {
  doctorId: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  medicalGroupTypeId: number;
  companyId: number;
  medicalSystemNumber: number;
  birthdate?: string;
}

export function buildDoctorPayload(form: DoctorForm): ApiPayload {
  const payload: ApiPayload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    nationalCode: form.nationalCode.trim(),
    mobile: form.mobile.trim(),
    medicalGroupTypeId: form.medicalGroupTypeId,
    companyId: form.companyId,
    medicalSystemNumber: form.medicalSystemNumber,
  };
  const doctorId = idOrUndefined(form.doctorId);
  if (doctorId) payload['doctorId'] = doctorId;
  const birthdate = isoDate(form.birthdate);
  if (birthdate) payload['birthdate'] = birthdate;
  return payload;
}

export interface AppointmentForm {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  durationMinutes: number;
  note: string;
  primaryInsuranceCompanyId: number | null;
  confirmPrimaryInsuranceCompany: boolean;
  secondInsuranceCompanyId: number | null;
  confirmSecondInsuranceCompany: boolean;
  serviceTypeIds: number[];
  appointmentDate: string;
}

export function buildAppointmentPayload(form: AppointmentForm): ApiPayload {
  const appointmentDate = isoDate(form.appointmentDate);
  if (!appointmentDate) {
    throw new Error('تاریخ نوبت نامعتبر است');
  }
  const payload: ApiPayload = {
    patientId: form.patientId,
    doctorId: form.doctorId,
    durationMinutes: form.durationMinutes,
    serviceTypeIds: form.serviceTypeIds,
    appointmentDate,
    confirmPrimaryInsuranceCompany: false,
    confirmSecondInsuranceCompany: false,
  };
  const appointmentId = idOrUndefined(form.appointmentId);
  if (appointmentId) payload['appointmentId'] = appointmentId;

  const note = nullIfEmpty(form.note);
  if (note) payload['note'] = note;

  if (form.primaryInsuranceCompanyId && form.primaryInsuranceCompanyId > 0) {
    payload['primaryInsuranceCompanyId'] = form.primaryInsuranceCompanyId;
    payload['confirmPrimaryInsuranceCompany'] = true;
  }
  if (form.secondInsuranceCompanyId && form.secondInsuranceCompanyId > 0) {
    payload['secondInsuranceCompanyId'] = form.secondInsuranceCompanyId;
    payload['confirmSecondInsuranceCompany'] = true;
  }
  return payload;
}

export interface PrescriptionForm {
  prescriptionId: number;
  appointmentId: number;
  issueDate: string;
  notes: string;
  prescriptionDrugs: { drugName: string; dosage: string; usageInstructions: string }[];
  labTestRequests: { labTestType: string; notes: string; attachmentId?: string | null }[];
  imagingRequests: { imageTypeId: number; notes: string; attachmentId?: string | null }[];
  includeImaging: boolean;
}

function withAttachmentId(attachmentId?: string | null): Record<string, string> {
  if (!attachmentId) return {};
  return { attachmentId };
}

export function buildPrescriptionPayload(form: PrescriptionForm): ApiPayload {
  const payload: ApiPayload = {
    appointmentId: form.appointmentId,
    issueDate: isoDate(form.issueDate) ?? new Date().toISOString(),
    prescriptionDrugs: form.prescriptionDrugs
      .filter((d) => d.drugName.trim())
      .map((d) => ({
        drugName: d.drugName.trim(),
        dosage: nullIfEmpty(d.dosage) ?? '',
        usageInstructions: nullIfEmpty(d.usageInstructions) ?? '',
      })),
    labTestRequests: form.labTestRequests
      .filter((l) => l.labTestType.trim())
      .map((l) => ({
        labTestType: l.labTestType.trim(),
        notes: nullIfEmpty(l.notes) ?? '',
        ...withAttachmentId(l.attachmentId),
      })),
    imagingRequests: form.imagingRequests
      .filter((i) => i.imageTypeId > 0)
      .map((i) => ({
        imageTypeId: i.imageTypeId,
        notes: nullIfEmpty(i.notes) ?? '',
        ...withAttachmentId(i.attachmentId),
      })),
  };
  const prescriptionId = idOrUndefined(form.prescriptionId);
  if (prescriptionId) payload['prescriptionId'] = prescriptionId;
  payload['notes'] = nullIfEmpty(form.notes) ?? '';
  return payload;
}

export interface ServiceForm {
  serviceTypeId: number;
  title: string;
  code: string;
  categoryTypeId: number;
  description: string;
}

export function buildServicePayload(form: ServiceForm): ApiPayload {
  const payload: ApiPayload = {
    title: form.title.trim(),
    categoryTypeId: form.categoryTypeId,
  };
  const serviceTypeId = idOrUndefined(form.serviceTypeId);
  if (serviceTypeId) payload['serviceTypeId'] = serviceTypeId;
  const code = nullIfEmpty(form.code);
  if (code) payload['code'] = code;
  const description = nullIfEmpty(form.description);
  if (description) payload['description'] = description;
  return payload;
}

export interface InsuranceForm {
  insuranceCompanyId: number;
  name: string;
  code: string;
  insuranceTypeId: number;
  phoneNumber: string;
}

export function buildInsurancePayload(form: InsuranceForm): ApiPayload {
  const payload: ApiPayload = {
    name: form.name.trim(),
    insuranceTypeId: form.insuranceTypeId,
  };
  const insuranceCompanyId = idOrUndefined(form.insuranceCompanyId);
  if (insuranceCompanyId) payload['insuranceCompanyId'] = insuranceCompanyId;
  const code = nullIfEmpty(form.code);
  if (code) payload['code'] = code;
  const phoneNumber = nullIfEmpty(form.phoneNumber);
  if (phoneNumber) payload['phoneNumber'] = phoneNumber;
  return payload;
}

export interface CompanyForm {
  companyId: number;
  companyName: string;
  latinCompanyName: string;
  nationalId: string;
  address: string;
  email: string;
  companyRegistrationTypeId: number;
}

export function buildCompanyPayload(form: CompanyForm): ApiPayload {
  const payload: ApiPayload = {
    companyName: form.companyName.trim(),
    nationalId: form.nationalId.trim(),
    companyRegistrationTypeId: form.companyRegistrationTypeId,
  };
  const companyId = idOrUndefined(form.companyId);
  if (companyId) payload['companyId'] = companyId;
  const latin = nullIfEmpty(form.latinCompanyName);
  if (latin) payload['latinCompanyName'] = latin;
  const address = nullIfEmpty(form.address);
  if (address) payload['address'] = address;
  const email = nullIfEmpty(form.email);
  if (email) payload['email'] = email;
  return payload;
}

export interface MedicalFeeForm {
  medicalFeeServiceId: number;
  serviceTypeId: number;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function buildMedicalFeePayload(form: MedicalFeeForm): ApiPayload {
  const payload: ApiPayload = {
    serviceTypeId: form.serviceTypeId,
    price: form.price,
    startDate: isoDate(form.startDate) ?? new Date().toISOString(),
    endDate: isoDate(form.endDate) ?? new Date().toISOString(),
    isActive: form.isActive,
  };
  const medicalFeeServiceId = idOrUndefined(form.medicalFeeServiceId);
  if (medicalFeeServiceId) payload['medicalFeeServiceId'] = medicalFeeServiceId;
  return payload;
}

export interface UserForm {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userTypeId: number;
  isActive: boolean;
}

export function buildUserPayload(form: UserForm): ApiPayload {
  const payload: ApiPayload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    userTypeId: form.userTypeId,
    isActive: form.isActive,
    userRoles: rolesForUserType(form.userTypeId),
  };
  const userId = idOrUndefined(form.userId);
  if (userId) payload['userId'] = userId;
  return payload;
}

/** گواهی Base64 → payload با فیلد certificate (byte[] در JSON) */
export function buildCertificatePayload(base64: string): ApiPayload {
  const trimmed = base64.trim();
  return { certificate: trimmed };
}
