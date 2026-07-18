/** تشخیص قصد رزرو نوبت از متن فارسی کاربر (بدون LLM). */

export type BookingIntentKind =
  | 'list_slots'
  | 'book'
  | 'my_bookings'
  | 'cancel'
  | 'reschedule'
  | 'none';

export interface BookingIntent {
  kind: BookingIntentKind;
  /** YYYY-MM-DD local date, if resolved */
  dayKey?: string;
  /** day offset from today when relative words used */
  dayOffset?: number;
  /** HH:mm 24h if parsed */
  timeHm?: string;
  raw: string;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toAsciiDigits(input: string): string {
  return (input || '')
    .split('')
    .map((ch) => {
      const p = PERSIAN_DIGITS.indexOf(ch);
      if (p >= 0) return String(p);
      const a = ARABIC_DIGITS.indexOf(ch);
      if (a >= 0) return String(a);
      return ch;
    })
    .join('');
}

function todayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** امروز (نیمه‌شب محلی) برای محاسبه روز نوبت. */
export function todayLocalDate(): Date {
  return todayLocal();
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDayLabelFa(dayKey: string): string {
  try {
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    return date.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dayKey;
  }
}

function parseRelativeDay(text: string): { offset: number; dayKey: string } | null {
  const t = toAsciiDigits(text);

  if (/(امروز|همین\s*امروز)/.test(t)) {
    const d = todayLocal();
    return { offset: 0, dayKey: toDayKey(d) };
  }
  if (/(پس\s*فردا)/.test(t)) {
    const d = addDays(todayLocal(), 2);
    return { offset: 2, dayKey: toDayKey(d) };
  }
  if (/(فردا)/.test(t)) {
    const d = addDays(todayLocal(), 1);
    return { offset: 1, dayKey: toDayKey(d) };
  }

  const nDays =
    t.match(/(\d+)\s*روز\s*(?:دیگر|دیگه|بعد)/) ||
    t.match(/(?:تا|برای)\s*(\d+)\s*روز\s*(?:دیگر|دیگه|بعد)?/);
  if (nDays) {
    const n = Number(nDays[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 60) {
      const d = addDays(todayLocal(), n);
      return { offset: n, dayKey: toDayKey(d) };
    }
  }

  return null;
}

function parseTimeHm(text: string): string | undefined {
  const t = toAsciiDigits(text);
  // 18:30 یا ۱۸:۳۰ یا 18.30
  const m = t.match(/(?:ساعت\s*)?(\d{1,2})[:.٫](\d{2})/);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }
  // ساعت 18 بدون دقیقه
  const hOnly = t.match(/ساعت\s*(\d{1,2})(?!\d)/);
  if (hOnly) {
    const h = Number(hOnly[1]);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
  }
  return undefined;
}

function hasBookingKeyword(text: string): boolean {
  return /(نوبت|رزرو|اسلات|وقت\s*ویزیت|وقت\s*ملاقات)/.test(text);
}

/**
 * تشخیص قصد نوبت‌دهی از متن کاربر.
 * اگر مرتبط با نوبت نباشد kind=none برمی‌گرداند.
 */
export function parseBookingIntent(rawInput: string): BookingIntent {
  const raw = (rawInput || '').trim();
  const text = toAsciiDigits(raw)
    .replace(/\u200c/g, '')
    .replace(/\s+/g, ' ');
  if (!text) return { kind: 'none', raw };

  const timeHm = parseTimeHm(text);
  const relative = parseRelativeDay(text);

  const wantsCancel = /(لغو|کنسل|حذف\s*نوبت)/.test(text);
  const wantsReschedule = /(جابجا|تعویض\s*نوبت|تغییر\s*نوبت|عوض\s*کردن\s*نوبت)/.test(text);
  const wantsMine = /(نوبتهای\s*من|نوبت\s*های\s*من|رزروهای\s*من|رزرو\s*های\s*من|نوبت\s*من)/.test(text);
  const wantsBook =
    /(رزرو\s*کن|برام\s*رزرو|نوبت\s*بگیر|بگیر\s*برام|ثبت\s*نوبت|رزرو\s*نوبت)/.test(text) ||
    (!!timeHm && hasBookingKeyword(text));
  const wantsList =
    /(لیست\s*نوبت|نوبتهای|نوبت\s*های|چه\s*نوبت|چه\s*ساعت|نوبت\s*دارید|نوبت\s*هست)/.test(text) ||
    (hasBookingKeyword(text) && !!relative && !wantsBook && !wantsCancel && !wantsReschedule);

  if (wantsCancel && (hasBookingKeyword(text) || wantsMine || /(لغو|کنسل)/.test(text))) {
    return {
      kind: 'cancel',
      dayKey: relative?.dayKey,
      dayOffset: relative?.offset,
      timeHm,
      raw,
    };
  }

  if (wantsReschedule) {
    return {
      kind: 'reschedule',
      dayKey: relative?.dayKey,
      dayOffset: relative?.offset,
      timeHm,
      raw,
    };
  }

  if (wantsMine && !wantsBook) {
    return { kind: 'my_bookings', raw };
  }

  if (wantsBook) {
    return {
      kind: 'book',
      dayKey: relative?.dayKey,
      dayOffset: relative?.offset,
      timeHm,
      raw,
    };
  }

  if (wantsList || (hasBookingKeyword(text) && relative)) {
    return {
      kind: 'list_slots',
      dayKey: relative?.dayKey ?? toDayKey(todayLocal()),
      dayOffset: relative?.offset ?? 0,
      timeHm,
      raw,
    };
  }

  // «نوبت‌های ۴ روز دیگه» بدون فعل صریح
  if (hasBookingKeyword(text) && relative) {
    return {
      kind: 'list_slots',
      dayKey: relative.dayKey,
      dayOffset: relative.offset,
      timeHm,
      raw,
    };
  }

  return { kind: 'none', raw };
}

export function slotMatchesTime(startAt: string, timeHm: string): boolean {
  try {
    const d = new Date(startAt);
    if (Number.isNaN(d.getTime())) return false;
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return hm === timeHm;
  } catch {
    return false;
  }
}
