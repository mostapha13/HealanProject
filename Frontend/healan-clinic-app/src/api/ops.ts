import { config } from '../config';
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
import type { EntityRow } from './crud';

function asRecord(item: unknown): Record<string, unknown> {
  return (item ?? {}) as Record<string, unknown>;
}
function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}
function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function healanGet<T>(getToken: TokenGetter, path: string, params?: Record<string, unknown>) {
  return apiGet<T>(config.healanApiUrl, path, getToken, params);
}
async function healanPost<T>(getToken: TokenGetter, path: string, data?: unknown) {
  return apiPost<T>(config.healanApiUrl, path, getToken, data);
}
async function umGet<T>(getToken: TokenGetter, path: string, params?: Record<string, unknown>) {
  return apiGet<T>(config.userManagerApiUrl, path, getToken, params);
}
async function umPost<T>(getToken: TokenGetter, path: string, data?: unknown) {
  return apiPost<T>(config.userManagerApiUrl, path, getToken, data);
}
async function umPut<T>(getToken: TokenGetter, path: string, data?: unknown) {
  return apiPut<T>(config.userManagerApiUrl, path, getToken, data);
}
async function umDelete(getToken: TokenGetter, path: string) {
  return apiDelete(config.userManagerApiUrl, path, getToken);
}

export type OpsAction = {
  key: string;
  label: string;
  danger?: boolean;
  run: (getToken: TokenGetter, row: EntityRow) => Promise<void>;
};

export type OpsModuleConfig = {
  id: ClinicModuleId;
  canCreate?: boolean;
  load: (getToken: TokenGetter, filterText?: string) => Promise<EntityRow[]>;
  actions: (row: EntityRow) => OpsAction[];
  createLabel?: string;
  createFields?: { key: string; label: string; required?: boolean; multiline?: boolean; keyboard?: 'default' | 'numeric' | 'phone-pad' }[];
  emptyForm?: Record<string, string | boolean | number>;
  fromRow?: (row: EntityRow) => Record<string, string | boolean | number>;
  save?: (getToken: TokenGetter, form: Record<string, string | boolean | number>) => Promise<void>;
  canToggleActive?: boolean;
};

function personName(raw: Record<string, unknown>, nestedKey: string): string {
  const nested = asRecord(raw[nestedKey] ?? raw[nestedKey.charAt(0).toUpperCase() + nestedKey.slice(1)]);
  const name = `${str(nested.firstName)} ${str(nested.lastName)}`.trim();
  return name;
}

export const OPS_MODULES: Partial<Record<ClinicModuleId, OpsModuleConfig>> = {
  queue: {
    id: 'queue',
    load: async (getToken, filterText) => {
      const rows = await fetchAllPaginated((pageNumber, pageSize) =>
        healanGet<PaginatedPage<Record<string, unknown>>>(getToken, 'Appointment/CurrentAppointmentList', {
          pageNumber,
          pageSize,
          filterText,
        })
      );
      return rows.map((raw) => {
        const r = asRecord(raw);
        const id = num(r.appointmentId);
        const patient = personName(r, 'patient') || str(r.patientName, `بیمار #${r.patientId}`);
        const doctor = personName(r, 'doctor') || str(r.doctorName, `پزشک #${r.doctorId}`);
        return {
          id,
          title: patient,
          subtitle: `${str(r.appointmentTypeName ?? 'نوبت')} · ${doctor}`,
          meta: str(r.appointmentDate),
          badge: str(r.appointmentTypeName ?? r.appointmentTypeId, 'امروز'),
          raw: r,
        };
      });
    },
    actions: (row) => {
      const status = str(row.raw.appointmentTypeId ?? row.raw.appointmentTypeName);
      const items: OpsAction[] = [];
      if (status !== 'InProgress' && status !== 'Completed') {
        items.push({
          key: 'start',
          label: 'شروع ویزیت',
          run: async (getToken, r) => {
            await healanPost(getToken, 'Appointment/ChangeStatus', {
              appointmentId: r.id,
              appointmentTypeId: 'InProgress',
            });
          },
        });
        items.push({
          key: 'noshow',
          label: 'عدم حضور',
          danger: true,
          run: async (getToken, r) => {
            await healanPost(getToken, 'Appointment/ChangeStatus', {
              appointmentId: r.id,
              appointmentTypeId: 'NoShow',
            });
          },
        });
      }
      if (status === 'InProgress') {
        items.push({
          key: 'complete',
          label: 'تکمیل ویزیت',
          run: async (getToken, r) => {
            await healanPost(getToken, 'Appointment/ChangeStatus', {
              appointmentId: r.id,
              appointmentTypeId: 'Completed',
            });
          },
        });
      }
      return items;
    },
  },

  'booking-reservations': {
    id: 'booking-reservations',
    load: async (getToken, filterText) => {
      const rows = await fetchAllPaginated((pageNumber, pageSize) =>
        healanGet<PaginatedPage<Record<string, unknown>>>(getToken, 'BookingReservation/List', {
          pageNumber,
          pageSize,
          filterText,
        })
      );
      return rows.map((raw, index) => {
        const r = asRecord(raw);
        const id = num(r.appointmentBookingId ?? r.reservationId ?? r.id ?? index);
        return {
          id,
          title: str(r.patientName ?? r.fullName ?? `${str(r.firstName)} ${str(r.lastName)}`.trim(), `رزرو #${id}`),
          subtitle: str(r.statusName ?? r.status ?? ''),
          meta: str(r.slotStart ?? r.appointmentDate ?? r.nationalCode ?? ''),
          badge: str(r.statusName ?? r.status),
          raw: { ...r, appointmentBookingId: id },
        };
      });
    },
    actions: () => [
      {
        key: 'accept',
        label: 'پذیرش رزرو',
        run: async (getToken, r) => {
          await healanPost(getToken, 'BookingReservation/Accept', {
            appointmentBookingId: num(r.raw.appointmentBookingId ?? r.id),
          });
        },
      },
      {
        key: 'cancel',
        label: 'لغو رزرو',
        danger: true,
        run: async (getToken, r) => {
          await healanPost(getToken, 'BookingReservation/Cancel', {
            appointmentBookingId: num(r.raw.appointmentBookingId ?? r.id),
            byStaff: true,
          });
        },
      },
      {
        key: 'noshow',
        label: 'عدم حضور',
        danger: true,
        run: async (getToken, r) => {
          await healanPost(getToken, 'BookingReservation/NoShow', {
            appointmentBookingId: num(r.raw.appointmentBookingId ?? r.id),
          });
        },
      },
      {
        key: 'delete',
        label: 'حذف',
        danger: true,
        run: async (getToken, r) => {
          await healanPost(getToken, 'BookingReservation/Delete', {
            appointmentBookingId: num(r.raw.appointmentBookingId ?? r.id),
          });
        },
      },
    ],
  },

  'site-reviews': {
    id: 'site-reviews',
    load: async (getToken) => {
      const list = await healanGet<Record<string, unknown>[] | PaginatedPage<Record<string, unknown>>>(
        getToken,
        'PatientReview/List'
      );
      const rows = Array.isArray(list) ? list : list.items ?? list.Items ?? [];
      return rows.map((raw, index) => {
        const r = asRecord(raw);
        const id = num(r.patientReviewId ?? r.id ?? index);
        return {
          id,
          title: str(r.patientName ?? r.fullName ?? 'نظر بیمار'),
          subtitle: str(r.comment ?? r.statusName ?? '').slice(0, 120),
          meta: str(r.statusName ?? r.status ?? ''),
          badge: str(r.statusName ?? r.status),
          raw: r,
        };
      });
    },
    actions: (row) => {
      const status = str(row.raw.status ?? row.raw.statusName);
      const items: OpsAction[] = [];
      if (status !== 'Approved') {
        items.push({
          key: 'approve',
          label: 'تأیید',
          run: async (getToken, r) => {
            await healanPost(getToken, 'PatientReview/Moderate', {
              patientReviewId: r.id,
              status: 'Approved',
            });
          },
        });
      }
      if (status !== 'Rejected') {
        items.push({
          key: 'reject',
          label: 'رد',
          danger: true,
          run: async (getToken, r) => {
            await healanPost(getToken, 'PatientReview/Moderate', {
              patientReviewId: r.id,
              status: 'Rejected',
            });
          },
        });
      }
      items.push({
        key: 'delete',
        label: 'حذف',
        danger: true,
        run: async (getToken, r) => {
          await healanPost(getToken, 'PatientReview/Delete', { patientReviewId: r.id });
        },
      });
      return items;
    },
  },

  'access-roles': {
    id: 'access-roles',
    canCreate: false,
    load: async (getToken) => {
      const roles = await umGet<Record<string, unknown>[]>(getToken, 'HealanRoleManagement/roles');
      const rows = Array.isArray(roles) ? roles : [];
      return rows.map((raw, index) => {
        const r = asRecord(raw);
        return {
          id: index + 1,
          title: str(r.displayName ?? r.DisplayName ?? r.name ?? r.Name, `نقش ${index + 1}`),
          subtitle: str(r.name ?? r.Name),
          meta: r.isSystem || r.IsSystem ? 'سیستمی' : `${r.userCount ?? r.UserCount ?? 0} کاربر`,
          raw: r,
        };
      });
    },
    actions: () => [
      {
        key: 'edit-access',
        label: 'ویرایش سطح دسترسی',
        run: async () => {
          /* handled in OpsModuleView with dedicated sheet */
        },
      },
    ],
  },
};

export async function loadAccessRoleTree(getToken: TokenGetter, roleId: string) {
  const res = await umGet<Record<string, unknown>>(getToken, 'UserAccess/AccessRole/1', {
    RoleId: roleId,
    AccessSystemId: config.accessSystemId,
  });
  const items = (res?.items ?? res?.Items ?? []) as Record<string, unknown>[];
  return Array.isArray(items) ? items : [];
}

export async function saveAccessRoleTree(
  getToken: TokenGetter,
  roleId: string,
  items: Record<string, unknown>[]
) {
  await umPost(getToken, 'UserAccess/SaveAccessRole', { roleId, items });
}

export function flattenAccessTree(
  items: Record<string, unknown>[],
  acc: { key: string; title: string; hasAccess: boolean; children?: Record<string, unknown>[] }[] = []
) {
  for (const item of items) {
    const r = asRecord(item);
    const key = str(r.key ?? r.Key ?? r.accessMenuId ?? r.AccessMenuId);
    const title = str(r.title ?? r.Title ?? r.formTitle ?? key);
    const hasAccess = Boolean(r.hasAccess ?? r.HasAccess);
    const children = (r.children ?? r.Children) as Record<string, unknown>[] | undefined;
    acc.push({ key, title, hasAccess, children });
    if (Array.isArray(children) && children.length) flattenAccessTree(children, acc);
  }
  return acc;
}

export function applyAccessToggle(
  items: Record<string, unknown>[],
  key: string,
  hasAccess: boolean
): Record<string, unknown>[] {
  return items.map((item) => {
    const r = { ...asRecord(item) };
    const itemKey = str(r.key ?? r.Key ?? r.accessMenuId ?? r.AccessMenuId);
    const children = (r.children ?? r.Children) as Record<string, unknown>[] | undefined;
    if (itemKey === key) {
      r.hasAccess = hasAccess;
      r.HasAccess = hasAccess;
    }
    if (Array.isArray(children)) {
      const next = applyAccessToggle(children, key, hasAccess);
      r.children = next;
      r.Children = next;
    }
    return r;
  });
}

export async function createManagedRole(getToken: TokenGetter, name: string, displayName: string) {
  return umPost(getToken, 'HealanRoleManagement/roles', { name, displayName });
}

export async function updateManagedRole(
  getToken: TokenGetter,
  roleId: string,
  name: string,
  displayName: string
) {
  return umPut(getToken, `HealanRoleManagement/roles/${roleId}`, { name, displayName });
}

export async function deleteManagedRole(getToken: TokenGetter, roleId: string) {
  return umDelete(getToken, `HealanRoleManagement/roles/${roleId}`);
}

export async function restoreManagedRole(getToken: TokenGetter, roleId: string) {
  return umPost(getToken, `HealanRoleManagement/roles/${roleId}/restore`);
}

export function getOpsConfig(moduleId: ClinicModuleId): OpsModuleConfig | undefined {
  return OPS_MODULES[moduleId];
}
