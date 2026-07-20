import type { PortalBookingItem, PortalOpenSlot } from '../../api/portalApi';

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj['items'])) return obj['items'] as T[];
    if (Array.isArray(obj['data'])) return obj['data'] as T[];
    if (Array.isArray(obj['result'])) return obj['result'] as T[];
  }
  return [];
}

function pickField(source: unknown, ...names: string[]): unknown {
  if (!source || typeof source !== 'object') return undefined;
  const obj = source as Record<string, unknown>;
  const lower = names.map((n) => n.toLowerCase());
  for (const [key, val] of Object.entries(obj)) {
    if (lower.includes(key.toLowerCase()) && val != null && val !== '') return val;
  }
  return undefined;
}

export function slotDayKey(startAt: unknown): string {
  const raw = String(startAt ?? '');
  const m = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function normalizeOpenSlots(list: unknown): PortalOpenSlot[] {
  return asArray<Record<string, unknown>>(list)
    .map((raw) => {
      const appointmentSlotId = Number(pickField(raw, 'appointmentSlotId', 'AppointmentSlotId') ?? 0);
      const doctorId = Number(pickField(raw, 'doctorId', 'DoctorId') ?? 0);
      const startAt = String(pickField(raw, 'startAt', 'StartAt') ?? '');
      const endAt = String(pickField(raw, 'endAt', 'EndAt') ?? '');
      const doctorName = String(pickField(raw, 'doctorName', 'DoctorName') ?? '');
      return { appointmentSlotId, doctorId, startAt, endAt, doctorName } as PortalOpenSlot;
    })
    .filter((s) => s.appointmentSlotId > 0 && !!s.startAt);
}

export function normalizeBookings(list: unknown): PortalBookingItem[] {
  return asArray<Record<string, unknown>>(list)
    .map((raw) => {
      const appointmentBookingId = Number(
        pickField(raw, 'appointmentBookingId', 'AppointmentBookingId') ?? 0
      );
      const appointmentSlotId = Number(pickField(raw, 'appointmentSlotId', 'AppointmentSlotId') ?? 0);
      const doctorId = Number(pickField(raw, 'doctorId', 'DoctorId') ?? 0);
      const startAt = String(pickField(raw, 'startAt', 'StartAt') ?? '');
      const endAt = String(pickField(raw, 'endAt', 'EndAt') ?? '');
      const doctorName = String(pickField(raw, 'doctorName', 'DoctorName') ?? '');
      const status = Number(pickField(raw, 'status', 'Status') ?? 0);
      const firstName = String(pickField(raw, 'firstName', 'FirstName') ?? '');
      const lastName = String(pickField(raw, 'lastName', 'LastName') ?? '');
      return {
        appointmentBookingId,
        appointmentSlotId,
        doctorId,
        doctorName,
        startAt,
        endAt,
        status,
        firstName,
        lastName,
      } as PortalBookingItem;
    })
    .filter((b) => b.appointmentBookingId > 0);
}

export function formatSlotTime(iso: unknown): string {
  if (iso == null || iso === '') return '—';
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso);
  }
}

export function formatSlotFull(iso: unknown): string {
  if (iso == null || iso === '') return '—';
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const data = err as {
      message?: string;
      data?: { errors?: string[]; title?: string; message?: string; detail?: string; Errors?: string[] };
    };
    const errors = data.data?.errors ?? data.data?.Errors;
    if (Array.isArray(errors) && errors[0]) return String(errors[0]);
    if (data.data?.detail) return String(data.data.detail);
    if (data.data?.message) return String(data.data.message);
    if (data.data?.title) return String(data.data.title);
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Booked = 1 */
export function isActiveBookingStatus(status: unknown): boolean {
  if (typeof status === 'number') return status === 1;
  if (typeof status === 'string') {
    if (status === 'Booked' || status === '1') return true;
    const n = Number(status);
    return n === 1;
  }
  return false;
}
