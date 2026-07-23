import { config } from '../config';
import {
  apiGet,
  apiPost,
  fetchAllPaginated,
  type PaginatedPage,
  type TokenGetter,
} from './client';
import type { ClinicModuleId } from '../navigation/catalog';

export type EntityRow = {
  id: number;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  isActive?: boolean;
  raw: Record<string, unknown>;
};

export type EnumOption = { key: number; label: string };

export type FormFieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  keyboard?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  required?: boolean;
};

export type CrudModuleConfig = {
  id: ClinicModuleId;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canToggleActive: boolean;
  fields: FormFieldDef[];
  emptyForm: Record<string, string | boolean | number>;
  load: (getToken: TokenGetter, filterText?: string) => Promise<EntityRow[]>;
  loadOptions?: (getToken: TokenGetter) => Promise<Record<string, EnumOption[]>>;
  fromRow: (row: EntityRow) => Record<string, string | boolean | number>;
  save: (
    getToken: TokenGetter,
    form: Record<string, string | boolean | number>
  ) => Promise<void>;
  remove?: (getToken: TokenGetter, row: EntityRow) => Promise<void>;
  toggleActive?: (getToken: TokenGetter, row: EntityRow) => Promise<void>;
};

function asRecord(item: unknown): Record<string, unknown> {
  return (item ?? {}) as Record<string, unknown>;
}

function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v == null) return fallback;
  return String(v).toLowerCase() !== 'false' && v !== 0 && v !== '0';
}

function activeBadge(isActive: boolean | undefined): string | undefined {
  if (isActive === undefined) return undefined;
  return isActive ? 'فعال' : 'غیرفعال';
}

async function healanGet<T>(
  getToken: TokenGetter,
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  return apiGet<T>(config.healanApiUrl, path, getToken, params);
}

async function healanPost<T>(
  getToken: TokenGetter,
  path: string,
  data?: unknown
): Promise<T> {
  return apiPost<T>(config.healanApiUrl, path, getToken, data);
}

async function listAll(
  getToken: TokenGetter,
  path: string,
  extra?: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  return fetchAllPaginated((pageNumber, pageSize) =>
    healanGet<PaginatedPage<Record<string, unknown>>>(getToken, path, {
      pageNumber,
      pageSize,
      ...extra,
    })
  );
}

async function loadEnum(
  getToken: TokenGetter,
  path: string
): Promise<EnumOption[]> {
  const raw = await healanGet<unknown>(getToken, path);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.map((item) => {
    const r = asRecord(item);
    return {
      key: num(r.key ?? r.Key ?? r.id ?? r.value),
      label: str(r.displayName ?? r.DisplayName ?? r.name ?? r.Name ?? r.key ?? '—'),
    };
  });
}

function idOrUndefined(id: number): number | undefined {
  return id > 0 ? id : undefined;
}

function nullIfEmpty(value: string): string | undefined {
  const t = value.trim();
  return t ? t : undefined;
}

function mapService(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.serviceTypeId ?? raw.id);
  const isActive = bool(raw.isActive ?? raw.IsActive, true);
  return {
    id,
    title: str(raw.title ?? raw.serviceTypeName ?? raw.name, `خدمت #${id}`),
    subtitle: str(raw.categoryTypeName ?? raw.code ?? ''),
    meta: str(raw.description ?? ''),
    badge: activeBadge(isActive),
    isActive,
    raw,
  };
}

function mapInsurance(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.insuranceCompanyId ?? raw.id);
  const isActive = bool(raw.isActive ?? raw.IsActive, true);
  return {
    id,
    title: str(raw.name ?? raw.insuranceCompanyName, `بیمه #${id}`),
    subtitle: str(raw.insuranceTypeName ?? raw.code ?? ''),
    meta: str(raw.phoneNumber ?? ''),
    badge: activeBadge(isActive),
    isActive,
    raw,
  };
}

function mapCompany(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.companyId ?? raw.id);
  const isActive = bool(raw.isActive ?? raw.IsActive, true);
  return {
    id,
    title: str(raw.companyName ?? raw.name, `مرکز #${id}`),
    subtitle: str(raw.nationalId ?? raw.phoneNumber ?? ''),
    meta: str(raw.address ?? raw.email ?? ''),
    badge: activeBadge(isActive),
    isActive,
    raw,
  };
}

function mapPatient(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.patientId ?? raw.id);
  const name = `${str(raw.firstName)} ${str(raw.lastName)}`.trim();
  return {
    id,
    title: name || `بیمار #${id}`,
    subtitle: `کد ملی ${str(raw.nationalCode)}`,
    meta: str(raw.phoneNumber ?? ''),
    raw,
  };
}

function mapDoctor(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.doctorId ?? raw.id);
  const name = `${str(raw.firstName)} ${str(raw.lastName)}`.trim();
  return {
    id,
    title: name || `پزشک #${id}`,
    subtitle: str(raw.medicalGroupTypeName ?? 'پزشک'),
    meta: str(raw.mobile ?? raw.nationalCode ?? ''),
    raw,
  };
}

function mapFee(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.medicalFeeServiceId ?? raw.id);
  const isActive = bool(raw.isActive ?? raw.IsActive, true);
  const price = raw.price ?? raw.fee;
  return {
    id,
    title: str(raw.serviceTypeName ?? raw.serviceTypeTitle ?? raw.title, `تعرفه #${id}`),
    subtitle: price != null ? `${price} ریال` : undefined,
    meta: str(raw.startDate ?? ''),
    badge: activeBadge(isActive),
    isActive,
    raw,
  };
}

function mapRag(raw: Record<string, unknown>): EntityRow {
  const id = num(raw.ragKnowledgeItemId ?? raw.id);
  const isActive = bool(raw.isActive ?? raw.IsActive, true);
  return {
    id,
    title: str(raw.question ?? raw.title, `دانش #${id}`).slice(0, 80),
    subtitle: str(raw.answer ?? raw.topic ?? '').slice(0, 100),
    meta: str(raw.keywords ?? ''),
    badge: activeBadge(isActive),
    isActive,
    raw,
  };
}

export const CRUD_MODULES: Partial<Record<ClinicModuleId, CrudModuleConfig>> = {
  services: {
    id: 'services',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'title', label: 'عنوان خدمت', required: true },
      { key: 'code', label: 'کد' },
      { key: 'categoryTypeId', label: 'شناسه دسته', keyboard: 'numeric', required: true },
      { key: 'description', label: 'توضیح', multiline: true },
    ],
    emptyForm: {
      serviceTypeId: 0,
      title: '',
      code: '',
      categoryTypeId: 1,
      description: '',
      isActive: true,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'ServiceTypes/List', { filterText });
      return rows.map(mapService);
    },
    loadOptions: async (getToken) => ({
      categoryTypeId: await loadEnum(getToken, 'ServiceTypes/CategoryType'),
    }),
    fromRow: (row) => ({
      serviceTypeId: row.id,
      title: str(row.raw.title ?? row.title),
      code: str(row.raw.code),
      categoryTypeId: num(row.raw.categoryTypeId, 1),
      description: str(row.raw.description),
      isActive: bool(row.raw.isActive, true),
    }),
    save: async (getToken, form) => {
      const serviceTypeId = idOrUndefined(num(form.serviceTypeId));
      await healanPost(getToken, 'ServiceTypes/Register', {
        ...(serviceTypeId ? { serviceTypeId } : {}),
        title: str(form.title).trim(),
        categoryTypeId: num(form.categoryTypeId, 1),
        code: nullIfEmpty(str(form.code)),
        description: nullIfEmpty(str(form.description)),
        isActive: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'ServiceTypes/Delete', { serviceTypeId: row.id });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'ServiceTypes/Register', {
        serviceTypeId: row.id,
        title: str(row.raw.title ?? row.title),
        categoryTypeId: num(row.raw.categoryTypeId, 1),
        code: nullIfEmpty(str(row.raw.code)),
        description: nullIfEmpty(str(row.raw.description)),
        isActive: !bool(row.raw.isActive, true),
      });
    },
  },

  insurance: {
    id: 'insurance',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'name', label: 'نام بیمه', required: true },
      { key: 'code', label: 'کد' },
      { key: 'insuranceTypeId', label: 'شناسه نوع بیمه', keyboard: 'numeric', required: true },
      { key: 'phoneNumber', label: 'تلفن', keyboard: 'phone-pad' },
    ],
    emptyForm: {
      insuranceCompanyId: 0,
      name: '',
      code: '',
      insuranceTypeId: 1,
      phoneNumber: '',
      isActive: true,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'Insurance/InsuranceList', { filterText });
      return rows.map(mapInsurance);
    },
    loadOptions: async (getToken) => ({
      insuranceTypeId: await loadEnum(getToken, 'Insurance/InsuranceType'),
    }),
    fromRow: (row) => ({
      insuranceCompanyId: row.id,
      name: str(row.raw.name ?? row.title),
      code: str(row.raw.code),
      insuranceTypeId: num(row.raw.insuranceTypeId, 1),
      phoneNumber: str(row.raw.phoneNumber),
      isActive: bool(row.raw.isActive, true),
    }),
    save: async (getToken, form) => {
      const insuranceCompanyId = idOrUndefined(num(form.insuranceCompanyId));
      await healanPost(getToken, 'Insurance/Register', {
        ...(insuranceCompanyId ? { insuranceCompanyId } : {}),
        name: str(form.name).trim(),
        insuranceTypeId: num(form.insuranceTypeId, 1),
        code: nullIfEmpty(str(form.code)),
        phoneNumber: nullIfEmpty(str(form.phoneNumber)),
        isActive: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'Insurance/DeleteInsurance', { id: row.id });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'Insurance/Register', {
        insuranceCompanyId: row.id,
        name: str(row.raw.name ?? row.title),
        insuranceTypeId: num(row.raw.insuranceTypeId, 1),
        code: nullIfEmpty(str(row.raw.code)),
        phoneNumber: nullIfEmpty(str(row.raw.phoneNumber)),
        isActive: !bool(row.raw.isActive, true),
      });
    },
  },

  companies: {
    id: 'companies',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'companyName', label: 'نام مرکز', required: true },
      { key: 'nationalId', label: 'شناسه ملی', required: true, keyboard: 'numeric' },
      { key: 'companyRegistrationTypeId', label: 'نوع ثبت', keyboard: 'numeric', required: true },
      { key: 'address', label: 'آدرس', multiline: true },
      { key: 'email', label: 'ایمیل', keyboard: 'email-address' },
    ],
    emptyForm: {
      companyId: 0,
      companyName: '',
      nationalId: '',
      companyRegistrationTypeId: 2,
      address: '',
      email: '',
      isActive: true,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'Company/CompanyList', { filterText });
      return rows.map(mapCompany);
    },
    loadOptions: async (getToken) => ({
      companyRegistrationTypeId: await loadEnum(getToken, 'Company/CompanyRegistrationTypes'),
    }),
    fromRow: (row) => ({
      companyId: row.id,
      companyName: str(row.raw.companyName ?? row.title),
      nationalId: str(row.raw.nationalId),
      companyRegistrationTypeId: num(row.raw.companyRegistrationTypeId, 2),
      address: str(row.raw.address),
      email: str(row.raw.email),
      isActive: bool(row.raw.isActive, true),
    }),
    save: async (getToken, form) => {
      const companyId = idOrUndefined(num(form.companyId));
      await healanPost(getToken, 'Company/Register', {
        ...(companyId ? { companyId } : {}),
        companyName: str(form.companyName).trim(),
        nationalId: str(form.nationalId).trim(),
        companyRegistrationTypeId: num(form.companyRegistrationTypeId, 2),
        address: nullIfEmpty(str(form.address)),
        email: nullIfEmpty(str(form.email)),
        isActive: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'Company/Delete', { id: row.id });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'Company/Register', {
        companyId: row.id,
        companyName: str(row.raw.companyName ?? row.title),
        nationalId: str(row.raw.nationalId),
        companyRegistrationTypeId: num(row.raw.companyRegistrationTypeId, 2),
        address: nullIfEmpty(str(row.raw.address)),
        email: nullIfEmpty(str(row.raw.email)),
        isActive: !bool(row.raw.isActive, true),
      });
    },
  },

  patients: {
    id: 'patients',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canToggleActive: false,
    fields: [
      { key: 'firstName', label: 'نام', required: true },
      { key: 'lastName', label: 'نام خانوادگی', required: true },
      { key: 'nationalCode', label: 'کد ملی', required: true, keyboard: 'numeric' },
      { key: 'phoneNumber', label: 'موبایل', required: true, keyboard: 'phone-pad' },
    ],
    emptyForm: {
      patientId: 0,
      firstName: '',
      lastName: '',
      nationalCode: '',
      phoneNumber: '',
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'Patient/PatientList', { filterText });
      return rows.map(mapPatient);
    },
    fromRow: (row) => ({
      patientId: row.id,
      firstName: str(row.raw.firstName),
      lastName: str(row.raw.lastName),
      nationalCode: str(row.raw.nationalCode),
      phoneNumber: str(row.raw.phoneNumber),
      userId: num(row.raw.userId),
    }),
    save: async (getToken, form) => {
      const patientId = idOrUndefined(num(form.patientId));
      const userId = idOrUndefined(num(form.userId));
      await healanPost(getToken, 'Patient/Register', {
        ...(patientId ? { patientId } : {}),
        ...(userId ? { userId } : {}),
        firstName: str(form.firstName).trim(),
        lastName: str(form.lastName).trim(),
        nationalCode: str(form.nationalCode).trim(),
        phoneNumber: str(form.phoneNumber).trim(),
      });
    },
  },

  doctors: {
    id: 'doctors',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canToggleActive: false,
    fields: [
      { key: 'firstName', label: 'نام', required: true },
      { key: 'lastName', label: 'نام خانوادگی', required: true },
      { key: 'nationalCode', label: 'کد ملی', required: true, keyboard: 'numeric' },
      { key: 'mobile', label: 'موبایل', required: true, keyboard: 'phone-pad' },
      { key: 'medicalGroupTypeId', label: 'گروه پزشکی', keyboard: 'numeric', required: true },
      { key: 'companyId', label: 'شناسه مرکز', keyboard: 'numeric', required: true },
      { key: 'medicalSystemNumber', label: 'شماره نظام', keyboard: 'numeric', required: true },
    ],
    emptyForm: {
      doctorId: 0,
      firstName: '',
      lastName: '',
      nationalCode: '',
      mobile: '',
      medicalGroupTypeId: 1,
      companyId: 0,
      medicalSystemNumber: 0,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'Doctor/DoctorList', { filterText });
      return rows.map(mapDoctor);
    },
    loadOptions: async (getToken) => ({
      medicalGroupTypeId: await loadEnum(getToken, 'Doctor/MedicalGroupType'),
    }),
    fromRow: (row) => ({
      doctorId: row.id,
      firstName: str(row.raw.firstName),
      lastName: str(row.raw.lastName),
      nationalCode: str(row.raw.nationalCode),
      mobile: str(row.raw.mobile),
      medicalGroupTypeId: num(row.raw.medicalGroupTypeId, 1),
      companyId: num(row.raw.companyId),
      medicalSystemNumber: num(row.raw.medicalSystemNumber),
    }),
    save: async (getToken, form) => {
      const doctorId = idOrUndefined(num(form.doctorId));
      await healanPost(getToken, 'Doctor/Register', {
        ...(doctorId ? { doctorId } : {}),
        firstName: str(form.firstName).trim(),
        lastName: str(form.lastName).trim(),
        nationalCode: str(form.nationalCode).trim(),
        mobile: str(form.mobile).trim(),
        medicalGroupTypeId: num(form.medicalGroupTypeId, 1),
        companyId: num(form.companyId),
        medicalSystemNumber: num(form.medicalSystemNumber),
      });
    },
  },

  fees: {
    id: 'fees',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'serviceTypeId', label: 'شناسه خدمت', keyboard: 'numeric', required: true },
      { key: 'price', label: 'قیمت (ریال)', keyboard: 'numeric', required: true },
      { key: 'startDate', label: 'شروع (YYYY-MM-DD)', required: true },
      { key: 'endDate', label: 'پایان (YYYY-MM-DD)', required: true },
    ],
    emptyForm: {
      medicalFeeServiceId: 0,
      serviceTypeId: 0,
      price: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      isActive: true,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'MedicalFeeServices/List', { filterText });
      return rows.map(mapFee);
    },
    fromRow: (row) => ({
      medicalFeeServiceId: row.id,
      serviceTypeId: num(row.raw.serviceTypeId),
      price: num(row.raw.price ?? row.raw.fee),
      startDate: str(row.raw.startDate).slice(0, 10),
      endDate: str(row.raw.endDate).slice(0, 10),
      isActive: bool(row.raw.isActive, true),
    }),
    save: async (getToken, form) => {
      const medicalFeeServiceId = idOrUndefined(num(form.medicalFeeServiceId));
      const start = str(form.startDate).trim();
      const end = str(form.endDate).trim();
      await healanPost(getToken, 'MedicalFeeServices/Register', {
        ...(medicalFeeServiceId ? { medicalFeeServiceId } : {}),
        serviceTypeId: num(form.serviceTypeId),
        price: num(form.price),
        startDate: start ? new Date(start).toISOString() : new Date().toISOString(),
        endDate: end ? new Date(end).toISOString() : new Date().toISOString(),
        isActive: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'MedicalFeeServices/Delete', { id: row.id });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'MedicalFeeServices/Register', {
        medicalFeeServiceId: row.id,
        serviceTypeId: num(row.raw.serviceTypeId),
        price: num(row.raw.price ?? row.raw.fee),
        startDate: row.raw.startDate ?? new Date().toISOString(),
        endDate: row.raw.endDate ?? new Date().toISOString(),
        isActive: !bool(row.raw.isActive, true),
      });
    },
  },

  'site-rag': {
    id: 'site-rag',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'question', label: 'سوال', required: true, multiline: true },
      { key: 'answer', label: 'پاسخ', required: true, multiline: true },
      { key: 'topic', label: 'موضوع' },
      { key: 'keywords', label: 'کلیدواژه' },
    ],
    emptyForm: {
      ragKnowledgeItemId: 0,
      question: '',
      answer: '',
      topic: '',
      keywords: '',
      priority: 0,
      sortOrder: 0,
      isActive: true,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'RagKnowledge/List', { filterText });
      return rows.map(mapRag);
    },
    fromRow: (row) => ({
      ragKnowledgeItemId: row.id,
      question: str(row.raw.question ?? row.title),
      answer: str(row.raw.answer),
      topic: str(row.raw.topic),
      keywords: str(row.raw.keywords),
      priority: num(row.raw.priority),
      sortOrder: num(row.raw.sortOrder),
      isActive: bool(row.raw.isActive, true),
    }),
    save: async (getToken, form) => {
      const ragKnowledgeItemId = idOrUndefined(num(form.ragKnowledgeItemId));
      await healanPost(getToken, 'RagKnowledge/Register', {
        ...(ragKnowledgeItemId ? { ragKnowledgeItemId } : {}),
        question: str(form.question).trim(),
        answer: str(form.answer).trim(),
        topic: nullIfEmpty(str(form.topic)),
        keywords: nullIfEmpty(str(form.keywords)),
        priority: num(form.priority),
        sortOrder: num(form.sortOrder),
        isActive: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'RagKnowledge/Delete', { ragKnowledgeItemId: row.id });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'RagKnowledge/Register', {
        ragKnowledgeItemId: row.id,
        question: str(row.raw.question),
        answer: str(row.raw.answer),
        topic: nullIfEmpty(str(row.raw.topic)),
        keywords: nullIfEmpty(str(row.raw.keywords)),
        priority: num(row.raw.priority),
        sortOrder: num(row.raw.sortOrder),
        isActive: !bool(row.raw.isActive, true),
      });
    },
  },
};

export function getCrudConfig(moduleId: ClinicModuleId): CrudModuleConfig | undefined {
  return CRUD_MODULES[moduleId];
}
