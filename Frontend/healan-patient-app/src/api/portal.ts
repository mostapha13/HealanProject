import { config } from '../config';
import type { PortalSiteContent, PortalServiceItem } from '../site/types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function formatFailure(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const errors = o.Errors ?? o.errors;
    if (Array.isArray(errors)) {
      const usable = errors.find((e) => typeof e === 'string' && e.trim());
      if (typeof usable === 'string') return usable;
    }
    const title = o.Title ?? o.title ?? o.detail ?? o.Detail ?? o.message;
    if (typeof title === 'string' && title.trim()) return title;
  }
  if (status === 401) return 'نشست منقضی شده. دوباره وارد شوید.';
  return `HTTP ${status}`;
}

async function portalFetch<T>(
  method: 'GET' | 'POST',
  path: string,
  opts?: { token?: string | null; params?: Record<string, unknown>; body?: unknown }
): Promise<T> {
  let url = joinUrl(config.healanApiUrl, `PortalPublic/${path}`);
  if (opts?.params) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.params)) {
      if (v == null || v === '') continue;
      q.set(k, String(v));
    }
    const qs = q.toString();
    if (qs) url += `?${qs}`;
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;
  if (method === 'POST') headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(opts?.body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'ارتباط با سرور برقرار نشد. اگر روی localhost هستید، CORS پورت اپ بیمار باید روی API فعال باشد.'
    );
  }

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, formatFailure(res.status, raw));
  return raw as T;
}

export type PortalHeroSlide = {
  id: number;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
};

export type PortalAuthResult = {
  accessToken: string;
  phoneNumber: string;
  phoneMasked?: string;
  userId?: string;
  expiresAtUtc?: string;
  isPatient?: boolean;
  patientId?: number;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
};

export type PortalBloodPressureItem = {
  id: number;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measuredAt: string;
  periodOfDay?: number | null;
  periodTitle?: string | null;
  measuredTime?: string | null;
  note?: string | null;
};

export type PortalMedicationItem = {
  id: number;
  medicationName: string;
  dose?: string | null;
  intervalHours?: number;
  firstDoseTime?: string;
  timesOfDay: string;
  isActive: boolean;
};

export type PortalBookingDoctor = {
  doctorId: number;
  firstName: string;
  lastName: string;
};

export type PortalOpenSlot = {
  appointmentSlotId: number;
  doctorId: number;
  doctorName: string;
  startAt: string;
  endAt: string;
};

export type PortalBookingService = {
  serviceTypeId: number;
  title: string;
};

export type PortalBookingItem = {
  appointmentBookingId: number;
  appointmentSlotId: number;
  doctorId: number;
  doctorName?: string;
  startAt: string;
  endAt: string;
  status: number;
  statusTitle?: string;
  firstName?: string;
  lastName?: string;
};

export type PortalMyHistory = {
  bookings?: Array<{
    appointmentBookingId?: number;
    doctorName?: string;
    startAt?: string;
    statusTitle?: string;
  }>;
  visits?: Array<{
    appointmentId: number;
    appointmentDate: string;
    appointmentStatus?: string;
    doctorName?: string;
    prescriptionNotes?: string;
    drugs?: Array<{ drugName?: string; dosage?: string; usageInstructions?: string }>;
  }>;
};

export type RagAskResult = {
  answer: string;
  wasAnswered: boolean;
  requiresLogin?: boolean;
  remainingCount?: number;
  dailyLimit?: number;
};

function asRecord(v: unknown): Record<string, unknown> {
  return (v ?? {}) as Record<string, unknown>;
}

function setting(settings: Record<string, unknown>, key: string, fallback = ''): string {
  const v = settings[key];
  if (v == null) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

export async function fetchPortalSite(): Promise<{
  slides: PortalHeroSlide[];
  content: PortalSiteContent;
}> {
  const site = await portalFetch<Record<string, unknown>>('GET', 'Site');
  const settings = asRecord(site.settings);
  const items = Array.isArray(site.contentItems) ? site.contentItems.map(asRecord) : [];

  const slides = items
    .filter((r) => String(r.sectionType ?? '') === 'HeroSlide' && r.isPublished !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((r) => ({
      id: Number(r.portalContentItemId ?? r.id ?? 0),
      title: r.title != null ? String(r.title) : undefined,
      subtitle: r.subtitle != null ? String(r.subtitle) : undefined,
      imageUrl: r.imageUrl != null ? String(r.imageUrl) : undefined,
    }));

  const services: PortalServiceItem[] = items
    .filter((r) => String(r.sectionType ?? '') === 'Service' && r.isPublished !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((r) => ({
      id: Number(r.portalContentItemId ?? r.id ?? 0),
      title: String(r.title ?? 'خدمت'),
      subtitle: r.subtitle != null ? String(r.subtitle) : undefined,
      body: r.body != null ? String(r.body) : undefined,
      iconName: r.iconName != null ? String(r.iconName) : undefined,
      color: r.color != null ? String(r.color) : undefined,
      imageUrl: r.imageUrl != null ? String(r.imageUrl) : undefined,
      sortOrder: Number(r.sortOrder ?? 0),
    }));

  const content: PortalSiteContent = {
    services,
    about: {
      badge: setting(settings, 'section.about.badge', 'درباره پزشک'),
      title: setting(settings, 'section.about.title', 'پزشکی دقیق، همراهی صمیمانه'),
      p1: setting(settings, 'section.about.p1'),
      p2: setting(settings, 'section.about.p2'),
      quote: setting(
        settings,
        'about.quote',
        'سلامت قلب، پایه زندگی سالم است — پیشگیری همیشه از درمان آسان‌تر است.'
      ),
      doctorName: setting(settings, 'doctor.name', 'دکتر معصومه شهرویی'),
      specialty: setting(settings, 'doctor.specialty', 'فوق تخصص قلب و عروق'),
      board: setting(
        settings,
        'doctor.board',
        'فارغ التحصیل و دارای بورد تخصصی از بیمارستان فوق تخصصی شهید رجایی تهران'
      ),
    },
    contact: {
      title: setting(settings, 'section.contact.title', 'تماس و آدرس مطب'),
      lead: setting(
        settings,
        'section.contact.lead',
        'برای رزرو نوبت تماس بگیرید یا به مطب مراجعه کنید.'
      ),
      address: setting(settings, 'contact.address'),
      city: setting(settings, 'contact.city', 'شوشتر'),
      phone: setting(settings, 'contact.phone'),
      phoneDisplay: setting(settings, 'contact.phoneDisplay', setting(settings, 'contact.phone')),
      hours: setting(settings, 'contact.hours'),
    },
    map: {
      header: setting(settings, 'map.header'),
      building: setting(settings, 'map.building'),
      detail: setting(settings, 'map.detail'),
      link: setting(
        settings,
        'map.link',
        'https://www.google.com/maps/search/Shushtar+Taleghani'
      ),
    },
  };

  return { slides, content };
}

export async function fetchPortalHeroSlides(): Promise<PortalHeroSlide[]> {
  const { slides } = await fetchPortalSite();
  return slides;
}

export function bookingOtpRequest(phoneNumber: string) {
  return portalFetch<{ sent: boolean; phoneMasked?: string; expiresInSeconds?: number }>(
    'POST',
    'BookingOtpRequest',
    { body: { phoneNumber } }
  );
}

export function bookingOtpVerify(phoneNumber: string, code: string) {
  return portalFetch<PortalAuthResult>('POST', 'BookingOtpVerify', {
    body: { phoneNumber, code },
  });
}

export function bookingProfileStatus(token: string) {
  return portalFetch<PortalAuthResult>('GET', 'BookingProfileStatus', { token });
}

export function patientMyHistory(token: string) {
  return portalFetch<PortalMyHistory>('GET', 'MyHistory', { token });
}

export function patientBloodPressureList(token: string) {
  return portalFetch<PortalBloodPressureItem[]>('GET', 'MyBloodPressure', { token });
}

export function patientBloodPressureSave(
  token: string,
  payload: {
    id?: number;
    systolic: number;
    diastolic: number;
    pulse?: number | null;
    measuredAt?: string;
    periodOfDay?: number | null;
    measuredTime?: string | null;
    note?: string;
  }
) {
  return portalFetch<PortalBloodPressureItem>('POST', 'MyBloodPressureSave', {
    token,
    body: payload,
  });
}

export function patientBloodPressureDelete(token: string, id: number) {
  return portalFetch('POST', 'MyBloodPressureDelete', { token, body: { id } });
}

export function patientMedicationList(token: string) {
  return portalFetch<PortalMedicationItem[]>('GET', 'MyMedications', { token });
}

export function patientMedicationSave(
  token: string,
  payload: {
    id?: number;
    medicationName: string;
    dose?: string;
    intervalHours: number;
    firstDoseTime: string;
    isActive?: boolean;
  }
) {
  return portalFetch<PortalMedicationItem>('POST', 'MyMedicationSave', { token, body: payload });
}

export function patientMedicationDelete(token: string, id: number) {
  return portalFetch('POST', 'MyMedicationDelete', { token, body: { id } });
}

export function ragAsk(token: string | null, question: string, sessionId?: string) {
  return portalFetch<RagAskResult>('POST', 'RagAsk', {
    token,
    body: { question, sessionId },
  });
}

export function bookingDoctors() {
  return portalFetch<PortalBookingDoctor[]>('GET', 'BookingDoctors');
}

export function bookingOpenSlots(params?: { doctorId?: number; fromDate?: string; toDate?: string }) {
  return portalFetch<PortalOpenSlot[]>('GET', 'BookingOpenSlots', { params });
}

export function bookingServices() {
  return portalFetch<PortalBookingService[]>('GET', 'BookingServices');
}

export function bookingCreate(
  token: string,
  payload: { appointmentSlotId: number; note?: string; requestedServiceTypeIds?: number[] }
) {
  return portalFetch<PortalBookingItem>('POST', 'BookingCreate', { token, body: payload });
}

export function bookingMyList(token: string) {
  return portalFetch<PortalBookingItem[]>('GET', 'BookingMyList', { token });
}

export function bookingCancel(token: string, appointmentBookingId: number) {
  return portalFetch('POST', 'BookingCancel', { token, body: { appointmentBookingId } });
}
