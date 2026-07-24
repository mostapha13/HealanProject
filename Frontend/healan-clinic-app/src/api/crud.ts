import { config } from '../config';
import { formatJalaliDate, formatJalaliDateTime, toPersianDigits } from '../utils/jalali';
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
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
  badgeTone?: 'ok' | 'warn' | 'danger' | 'neutral' | 'info';
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
  /** select = searchable list; multi-select = چندگزینه‌ای (مقدار CSV در فرم); datetime-jalali = تاریخ+ساعت شمسی; date-jalali = فقط تاریخ; time = HH:mm */
  kind?: 'text' | 'select' | 'multi-select' | 'datetime-jalali' | 'date-jalali' | 'time';
};

/** نوع کاربر — مطابق UserTypeId در بک‌اند */
export const USER_TYPE_OPTIONS: EnumOption[] = [
  { key: 1, label: 'رئیس' },
  { key: 2, label: 'مدیر' },
  { key: 3, label: 'منشی' },
  { key: 4, label: 'پرستار' },
  { key: 5, label: 'کمک پرستار' },
  { key: 6, label: 'کاربر عمومی' },
  { key: 7, label: 'پزشک' },
  { key: 8, label: 'حسابدار' },
  { key: 9, label: 'بیمار' },
];

/** روز هفته .NET (0=یکشنبه … 6=شنبه) با ترتیب نمایش ایرانی شنبه→جمعه */
export const WEEKDAY_OPTIONS: EnumOption[] = [
  { key: 6, label: 'شنبه' },
  { key: 0, label: 'یکشنبه' },
  { key: 1, label: 'دوشنبه' },
  { key: 2, label: 'سه‌شنبه' },
  { key: 3, label: 'چهارشنبه' },
  { key: 4, label: 'پنجشنبه' },
  { key: 5, label: 'جمعه' },
];

const WEEKDAY_LABEL: Record<number, string> = Object.fromEntries(
  WEEKDAY_OPTIONS.map((o) => [o.key, o.label])
);

function formatThousands(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** تاریخ/ساعت محلی به صورت YYYY-MM-DDTHH:mm (نه UTC slice) */
function localDateTimeValue(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** YYYY-MM-DD → ISO با ظهر محلی تا شیفت timezone روز را جابه‌جا نکند */
function localDateOnlyToIso(ymd: string): string {
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date().toISOString();
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return d.toISOString();
}

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
      key: num(
        r.key ??
          r.Key ??
          r.id ??
          r.value ??
          r.companyRegistrationTypeId ??
          r.CompanyRegistrationTypeId
      ),
      label: str(
        r.displayName ??
          r.DisplayName ??
          r.name ??
          r.Name ??
          r.companyRegistrationTypeName ??
          r.CompanyRegistrationTypeName ??
          r.key ??
          '—'
      ),
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
  const priceLabel = formatThousands(price);
  const start = formatJalaliDate(str(raw.startDate) || null);
  const end = formatJalaliDate(str(raw.endDate) || null);
  return {
    id,
    title: str(raw.serviceTypeName ?? raw.serviceTypeTitle ?? raw.title, `تعرفه #${id}`),
    subtitle: priceLabel ? `${toPersianDigits(priceLabel)} ریال` : undefined,
    meta: start && end ? `${start} تا ${end}` : start || end || undefined,
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
      { key: 'companyRegistrationTypeId', label: 'نوع ثبت', kind: 'select', required: true },
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
    loadOptions: async (getToken) => {
      const fromApi = await loadEnum(getToken, 'Company/CompanyRegistrationTypes');
      return {
        companyRegistrationTypeId:
          fromApi.length > 0
            ? fromApi
            : [
                { key: 1, label: 'بیمارستان' },
                { key: 2, label: 'کلینیک' },
                { key: 3, label: 'مطب' },
              ],
      };
    },
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
      { key: 'startDate', label: 'تاریخ شروع', kind: 'date-jalali', required: true },
      { key: 'endDate', label: 'تاریخ پایان', kind: 'date-jalali', required: true },
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
        startDate: start ? localDateOnlyToIso(start) : new Date().toISOString(),
        endDate: end ? localDateOnlyToIso(end) : new Date().toISOString(),
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

  users: {
    id: 'users',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canToggleActive: true,
    fields: [
      { key: 'firstName', label: 'نام', required: true },
      { key: 'lastName', label: 'نام خانوادگی', required: true },
      { key: 'phoneNumber', label: 'موبایل', required: true, keyboard: 'phone-pad' },
      { key: 'userTypeId', label: 'نوع کاربر', kind: 'select', required: true },
    ],
    emptyForm: {
      userId: 0,
      firstName: '',
      lastName: '',
      phoneNumber: '',
      userTypeId: 3,
      isActive: true,
      twoFactorEnabled: false,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'User/UserList', { filterText: filterText ?? '' });
      return rows.map((raw) => {
        const id = num(raw.userId ?? raw.id);
        const name = `${str(raw.firstName)} ${str(raw.lastName)}`.trim();
        const isActive = bool(raw.isActive, true);
        const typeId = num(raw.userTypeId, 0);
        const typeLabel =
          USER_TYPE_OPTIONS.find((o) => o.key === typeId)?.label ||
          str(raw.userTypeName ?? '');
        return {
          id,
          title: name || str(raw.userName, `کاربر #${id}`),
          subtitle: [str(raw.phoneNumber), typeLabel].filter(Boolean).join(' · '),
          badge: activeBadge(isActive),
          isActive,
          raw,
        };
      });
    },
    loadOptions: async () => ({
      userTypeId: USER_TYPE_OPTIONS,
    }),
    fromRow: (row) => ({
      userId: row.id,
      identityUserId: str(row.raw.identityUserId),
      firstName: str(row.raw.firstName),
      lastName: str(row.raw.lastName),
      phoneNumber: str(row.raw.phoneNumber),
      userTypeId: num(row.raw.userTypeId, 3),
      isActive: bool(row.raw.isActive, true),
      twoFactorEnabled: bool(row.raw.twoFactorEnabled, false),
    }),
    save: async (getToken, form) => {
      const userId = idOrUndefined(num(form.userId));
      const identityUserId = nullIfEmpty(str(form.identityUserId));
      await healanPost(getToken, 'User/Register', {
        ...(userId ? { userId } : {}),
        ...(identityUserId ? { identityUserId } : {}),
        firstName: str(form.firstName).trim(),
        lastName: str(form.lastName).trim(),
        phoneNumber: str(form.phoneNumber).trim(),
        userTypeId: num(form.userTypeId, 3),
        isActive: bool(form.isActive, true),
        twoFactorEnabled: bool(form.twoFactorEnabled, false),
      });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'User/Register', {
        userId: row.id,
        identityUserId: row.raw.identityUserId,
        firstName: str(row.raw.firstName),
        lastName: str(row.raw.lastName),
        phoneNumber: str(row.raw.phoneNumber),
        userTypeId: num(row.raw.userTypeId, 3),
        isActive: !bool(row.raw.isActive, true),
        twoFactorEnabled: bool(row.raw.twoFactorEnabled, false),
      });
    },
  },

  appointments: {
    id: 'appointments',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canToggleActive: false,
    fields: [
      { key: 'patientId', label: 'بیمار', kind: 'select', required: true },
      { key: 'doctorId', label: 'پزشک', kind: 'select', required: true },
      { key: 'appointmentDate', label: 'تاریخ و ساعت', kind: 'datetime-jalali', required: true },
      { key: 'durationMinutes', label: 'مدت (دقیقه)', keyboard: 'numeric', required: true },
      { key: 'serviceTypeIds', label: 'خدمت‌ها', kind: 'multi-select', required: true },
      { key: 'note', label: 'یادداشت', multiline: true },
    ],
    emptyForm: {
      appointmentId: 0,
      patientId: 0,
      doctorId: 0,
      appointmentDate: localDateTimeValue(),
      durationMinutes: 15,
      serviceTypeIds: '',
      note: '',
    },
    loadOptions: async (getToken) => {
      const [patients, doctors, services] = await Promise.all([
        listAll(getToken, 'Patient/PatientList'),
        listAll(getToken, 'Doctor/DoctorList'),
        listAll(getToken, 'ServiceTypes/List', { onlyActive: true }),
      ]);
      return {
        patientId: patients.map((raw) => {
          const id = num(raw.patientId ?? raw.id);
          const name = `${str(raw.firstName)} ${str(raw.lastName)}`.trim();
          const nc = str(raw.nationalCode);
          return {
            key: id,
            label: nc ? `${name || `بیمار #${id}`} · ${nc}` : name || `بیمار #${id}`,
          };
        }),
        doctorId: doctors.map((raw) => {
          const id = num(raw.doctorId ?? raw.id);
          const name = `${str(raw.firstName)} ${str(raw.lastName)}`.trim();
          const group = str(raw.medicalGroupTypeName);
          return {
            key: id,
            label: group ? `${name || `پزشک #${id}`} · ${group}` : name || `پزشک #${id}`,
          };
        }),
        serviceTypeIds: services.map((raw) => {
          const id = num(raw.serviceTypeId ?? raw.id);
          return {
            key: id,
            label: str(raw.title ?? raw.serviceTypeName ?? raw.name, `خدمت #${id}`),
          };
        }),
      };
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'Appointment/AppointmentList', { filterText });
      return rows.map((raw) => {
        const id = num(raw.appointmentId ?? raw.id);
        const patient = asRecord(raw.patient ?? {});
        const doctor = asRecord(raw.doctor ?? {});
        const patientName =
          str(raw.patientName) ||
          `${str(patient.firstName)} ${str(patient.lastName)}`.trim() ||
          `بیمار #${raw.patientId}`;
        const doctorName =
          str(raw.doctorName) ||
          `${str(doctor.firstName)} ${str(doctor.lastName)}`.trim() ||
          `پزشک #${raw.doctorId}`;
        const when = formatJalaliDateTime(str(raw.appointmentDate)) || str(raw.appointmentDate);
        return {
          id,
          title: patientName,
          subtitle: `${str(raw.appointmentTypeName ?? 'نوبت')} · ${doctorName}`,
          meta: when,
          badge: str(raw.appointmentTypeName),
          raw,
        };
      });
    },
    fromRow: (row) => {
      const services = Array.isArray(row.raw.serviceTypes)
        ? (row.raw.serviceTypes as Record<string, unknown>[])
            .map((s) => num(s.serviceTypeId ?? s.id))
            .filter(Boolean)
            .join(',')
        : '';
      const rawDate = str(row.raw.appointmentDate);
      let appointmentDate = rawDate.slice(0, 16);
      if (rawDate) {
        const d = new Date(rawDate);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, '0');
          appointmentDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      }
      return {
        appointmentId: row.id,
        patientId: num(row.raw.patientId),
        doctorId: num(row.raw.doctorId),
        appointmentDate,
        durationMinutes: num(row.raw.durationMinutes, 15),
        serviceTypeIds: services,
        note: str(row.raw.note),
      };
    },
    save: async (getToken, form) => {
      const appointmentId = idOrUndefined(num(form.appointmentId));
      const serviceTypeIds = str(form.serviceTypeIds)
        .split(/[,\s]+/)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0);
      const appointmentDate = new Date(str(form.appointmentDate)).toISOString();
      await healanPost(getToken, 'Appointment/Register', {
        ...(appointmentId ? { appointmentId } : {}),
        patientId: num(form.patientId),
        doctorId: num(form.doctorId),
        durationMinutes: num(form.durationMinutes, 15),
        serviceTypeIds,
        appointmentDate,
        note: nullIfEmpty(str(form.note)),
        confirmPrimaryInsuranceCompany: false,
        confirmSecondInsuranceCompany: false,
      });
    },
  },

  prescriptions: {
    id: 'prescriptions',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canToggleActive: false,
    fields: [
      { key: 'appointmentId', label: 'شناسه نوبت', keyboard: 'numeric', required: true },
      { key: 'issueDate', label: 'تاریخ صدور (YYYY-MM-DD)', required: true },
      { key: 'notes', label: 'یادداشت', multiline: true },
      { key: 'drugName', label: 'نام دارو', required: true },
      { key: 'dosage', label: 'دوز' },
      { key: 'usageInstructions', label: 'دستور مصرف', multiline: true },
    ],
    emptyForm: {
      prescriptionId: 0,
      appointmentId: 0,
      issueDate: new Date().toISOString().slice(0, 10),
      notes: '',
      drugName: '',
      dosage: '',
      usageInstructions: '',
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'OrderResult/PrescriptionList', { filterText });
      return rows.map((raw, index) => {
        const id = num(raw.prescriptionId ?? raw.id ?? index);
        return {
          id,
          title: str(raw.patientName, `نسخه #${id}`),
          subtitle: str(raw.doctorName ?? ''),
          meta: str(raw.prescriptionDate ?? raw.issueDate ?? raw.createDate ?? ''),
          raw,
        };
      });
    },
    fromRow: (row) => ({
      prescriptionId: row.id,
      appointmentId: num(row.raw.appointmentId),
      issueDate: str(row.raw.issueDate ?? row.raw.prescriptionDate).slice(0, 10),
      notes: str(row.raw.notes),
      drugName: '',
      dosage: '',
      usageInstructions: '',
    }),
    save: async (getToken, form) => {
      const prescriptionId = idOrUndefined(num(form.prescriptionId));
      await healanPost(getToken, 'OrderResult/Register', {
        ...(prescriptionId ? { prescriptionId } : {}),
        appointmentId: num(form.appointmentId),
        issueDate: localDateOnlyToIso(str(form.issueDate).slice(0, 10)),
        notes: nullIfEmpty(str(form.notes)),
        prescriptionDrugs: [
          {
            drugName: str(form.drugName).trim(),
            dosage: str(form.dosage).trim(),
            usageInstructions: str(form.usageInstructions).trim(),
          },
        ],
        labTestRequests: [],
        imagingRequests: [],
      });
    },
  },

  'site-blog': {
    id: 'site-blog',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'title', label: 'عنوان', required: true },
      { key: 'slug', label: 'اسلاگ', required: true },
      { key: 'excerpt', label: 'خلاصه', multiline: true },
      { key: 'body', label: 'متن', required: true, multiline: true },
      { key: 'coverImageUrl', label: 'آدرس تصویر' },
    ],
    emptyForm: {
      blogPostId: 0,
      title: '',
      slug: '',
      excerpt: '',
      body: '',
      coverImageUrl: '',
      isActive: true,
    },
    load: async (getToken, filterText) => {
      const rows = await listAll(getToken, 'BlogPost/List', { filterText });
      return rows.map((raw) => {
        const id = num(raw.blogPostId ?? raw.id);
        const published = bool(raw.isPublished, false);
        return {
          id,
          title: str(raw.title, `پست #${id}`),
          subtitle: published ? 'منتشر شده' : 'پیش‌نویس',
          meta: str(raw.slug ?? ''),
          badge: published ? 'منتشر' : 'پیش‌نویس',
          isActive: published,
          raw,
        };
      });
    },
    fromRow: (row) => ({
      blogPostId: row.id,
      title: str(row.raw.title),
      slug: str(row.raw.slug),
      excerpt: str(row.raw.excerpt),
      body: str(row.raw.body),
      coverImageUrl: str(row.raw.coverImageUrl),
      isActive: bool(row.raw.isPublished, false),
    }),
    save: async (getToken, form) => {
      const blogPostId = idOrUndefined(num(form.blogPostId));
      const published = bool(form.isActive, false);
      await healanPost(getToken, 'BlogPost/Register', {
        ...(blogPostId ? { blogPostId } : {}),
        title: str(form.title).trim(),
        slug: str(form.slug).trim(),
        excerpt: nullIfEmpty(str(form.excerpt)),
        body: str(form.body).trim(),
        coverImageUrl: nullIfEmpty(str(form.coverImageUrl)),
        isPublished: published,
        publishedAt: published ? new Date().toISOString() : undefined,
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'BlogPost/Delete', { blogPostId: row.id });
    },
    toggleActive: async (getToken, row) => {
      const published = !bool(row.raw.isPublished, false);
      await healanPost(getToken, 'BlogPost/Register', {
        blogPostId: row.id,
        title: str(row.raw.title),
        slug: str(row.raw.slug),
        excerpt: nullIfEmpty(str(row.raw.excerpt)),
        body: str(row.raw.body),
        coverImageUrl: nullIfEmpty(str(row.raw.coverImageUrl)),
        isPublished: published,
        publishedAt: published ? new Date().toISOString() : row.raw.publishedAt,
      });
    },
  },

  'site-content': {
    id: 'site-content',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'sectionType', label: 'نوع بخش (HeroSlide / About / …)', required: true },
      { key: 'title', label: 'عنوان', required: true },
      { key: 'subtitle', label: 'زیرعنوان' },
      { key: 'body', label: 'متن', multiline: true },
      { key: 'imageUrl', label: 'آدرس تصویر' },
      { key: 'linkUrl', label: 'لینک' },
      { key: 'sortOrder', label: 'ترتیب', keyboard: 'numeric' },
    ],
    emptyForm: {
      portalContentItemId: 0,
      sectionType: 'HeroSlide',
      title: '',
      subtitle: '',
      body: '',
      imageUrl: '',
      linkUrl: '',
      sortOrder: 0,
      isActive: true,
    },
    load: async (getToken) => {
      const list = await healanGet<Record<string, unknown>[] | PaginatedPage<Record<string, unknown>>>(
        getToken,
        'PortalContent/ContentList'
      );
      const rows = Array.isArray(list) ? list : list.items ?? list.Items ?? [];
      return rows.map((raw, index) => {
        const r = asRecord(raw);
        const id = num(r.portalContentItemId ?? r.id ?? index);
        const published = bool(r.isPublished, false);
        return {
          id,
          title: str(r.title, `مطلب #${id}`),
          subtitle: str(r.sectionType ?? r.subtitle ?? ''),
          meta: str(r.linkUrl ?? ''),
          badge: published ? 'منتشر' : 'پیش‌نویس',
          isActive: published,
          raw: r,
        };
      });
    },
    fromRow: (row) => ({
      portalContentItemId: row.id,
      sectionType: str(row.raw.sectionType, 'HeroSlide'),
      title: str(row.raw.title),
      subtitle: str(row.raw.subtitle),
      body: str(row.raw.body),
      imageUrl: str(row.raw.imageUrl),
      linkUrl: str(row.raw.linkUrl),
      sortOrder: num(row.raw.sortOrder),
      isActive: bool(row.raw.isPublished, false),
    }),
    save: async (getToken, form) => {
      const portalContentItemId = idOrUndefined(num(form.portalContentItemId));
      await healanPost(getToken, 'PortalContent/ContentRegister', {
        ...(portalContentItemId ? { portalContentItemId } : {}),
        sectionType: str(form.sectionType).trim(),
        title: str(form.title).trim(),
        subtitle: nullIfEmpty(str(form.subtitle)),
        body: nullIfEmpty(str(form.body)),
        imageUrl: nullIfEmpty(str(form.imageUrl)),
        linkUrl: nullIfEmpty(str(form.linkUrl)),
        sortOrder: num(form.sortOrder),
        isPublished: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'PortalContent/ContentDelete', { portalContentItemId: row.id });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'PortalContent/ContentRegister', {
        portalContentItemId: row.id,
        sectionType: str(row.raw.sectionType),
        title: str(row.raw.title),
        subtitle: nullIfEmpty(str(row.raw.subtitle)),
        body: nullIfEmpty(str(row.raw.body)),
        imageUrl: nullIfEmpty(str(row.raw.imageUrl)),
        linkUrl: nullIfEmpty(str(row.raw.linkUrl)),
        sortOrder: num(row.raw.sortOrder),
        isPublished: !bool(row.raw.isPublished, false),
      });
    },
  },

  'booking-schedules': {
    id: 'booking-schedules',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    fields: [
      { key: 'doctorId', label: 'شناسه پزشک', keyboard: 'numeric', required: true },
      { key: 'dayOfWeek', label: 'روز هفته', required: true },
      { key: 'startTime', label: 'ساعت شروع', kind: 'time', required: true },
      { key: 'endTime', label: 'ساعت پایان', kind: 'time', required: true },
      { key: 'visitDurationMinutes', label: 'مدت ویزیت (دقیقه)', keyboard: 'numeric', required: true },
    ],
    emptyForm: {
      doctorScheduleTemplateId: 0,
      doctorId: 0,
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '13:00',
      visitDurationMinutes: 15,
      isActive: true,
    },
    load: async (getToken) => {
      const list = await healanGet<Record<string, unknown>[] | PaginatedPage<Record<string, unknown>>>(
        getToken,
        'BookingSchedule/TemplateList'
      );
      const rows = Array.isArray(list) ? list : list.items ?? list.Items ?? [];
      return rows.map((raw, index) => {
        const r = asRecord(raw);
        const id = num(r.doctorScheduleTemplateId ?? r.templateId ?? r.id ?? index);
        const isActive = bool(r.isActive, true);
        const dow = num(r.dayOfWeek, 6);
        const dayLabel = WEEKDAY_LABEL[dow] ?? str(r.dayOfWeek);
        return {
          id,
          title: str(r.doctorName, `برنامه #${id}`),
          subtitle: `${dayLabel} · ${str(r.startTime).slice(0, 5)}-${str(r.endTime).slice(0, 5)}`,
          meta: `${str(r.visitDurationMinutes)} دقیقه`,
          badge: activeBadge(isActive),
          isActive,
          raw: r,
        };
      });
    },
    loadOptions: async () => ({
      dayOfWeek: WEEKDAY_OPTIONS,
    }),
    fromRow: (row) => ({
      doctorScheduleTemplateId: row.id,
      doctorId: num(row.raw.doctorId),
      dayOfWeek: num(row.raw.dayOfWeek, 6),
      startTime: str(row.raw.startTime).slice(0, 5),
      endTime: str(row.raw.endTime).slice(0, 5),
      visitDurationMinutes: num(row.raw.visitDurationMinutes, 15),
      isActive: bool(row.raw.isActive, true),
    }),
    save: async (getToken, form) => {
      const doctorScheduleTemplateId = idOrUndefined(num(form.doctorScheduleTemplateId));
      await healanPost(getToken, 'BookingSchedule/TemplateSave', {
        doctorScheduleTemplateId: doctorScheduleTemplateId ?? 0,
        doctorId: num(form.doctorId),
        dayOfWeek: num(form.dayOfWeek, 6),
        startTime: str(form.startTime),
        endTime: str(form.endTime),
        visitDurationMinutes: num(form.visitDurationMinutes, 15),
        isActive: bool(form.isActive, true),
      });
    },
    remove: async (getToken, row) => {
      await healanPost(getToken, 'BookingSchedule/TemplateDelete', {
        doctorScheduleTemplateId: row.id,
      });
    },
    toggleActive: async (getToken, row) => {
      await healanPost(getToken, 'BookingSchedule/TemplateSave', {
        doctorScheduleTemplateId: row.id,
        doctorId: num(row.raw.doctorId),
        dayOfWeek: num(row.raw.dayOfWeek, 6),
        startTime: str(row.raw.startTime),
        endTime: str(row.raw.endTime),
        visitDurationMinutes: num(row.raw.visitDurationMinutes, 15),
        isActive: !bool(row.raw.isActive, true),
      });
    },
  },

  roles: {
    id: 'roles',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canToggleActive: false,
    fields: [
      { key: 'name', label: 'نام نقش (انگلیسی)', required: true },
      { key: 'displayName', label: 'عنوان نمایشی', required: true },
    ],
    emptyForm: { roleId: '', name: '', displayName: '' },
    load: async (getToken) => {
      const list = await apiGet<Record<string, unknown>[]>(
        config.userManagerApiUrl,
        'HealanRoleManagement/roles',
        getToken,
        { includeDeleted: false }
      );
      const rows = Array.isArray(list) ? list : [];
      return rows.map((raw, index) => {
        const r = asRecord(raw);
        return {
          id: index + 1,
          title: str(r.displayName ?? r.DisplayName ?? r.name, `نقش ${index + 1}`),
          subtitle: str(r.name ?? r.Name),
          meta: str(r.id ?? r.roleId ?? ''),
          raw: r,
        };
      });
    },
    fromRow: (row) => ({
      roleId: str(row.raw.id ?? row.raw.roleId ?? row.meta),
      name: str(row.raw.name ?? row.raw.Name),
      displayName: str(row.raw.displayName ?? row.raw.DisplayName ?? row.title),
    }),
    save: async (getToken, form) => {
      const roleId = str(form.roleId).trim();
      const payload = { name: str(form.name).trim(), displayName: str(form.displayName).trim() };
      if (roleId) {
        await apiPut(config.userManagerApiUrl, `HealanRoleManagement/roles/${roleId}`, getToken, payload);
      } else {
        await apiPost(config.userManagerApiUrl, 'HealanRoleManagement/roles', getToken, payload);
      }
    },
    remove: async (getToken, row) => {
      const roleId = str(row.raw.id ?? row.raw.roleId ?? row.meta);
      await apiDelete(config.userManagerApiUrl, `HealanRoleManagement/roles/${roleId}`, getToken);
    },
  },
};

export function getCrudConfig(moduleId: ClinicModuleId): CrudModuleConfig | undefined {
  return CRUD_MODULES[moduleId];
}
