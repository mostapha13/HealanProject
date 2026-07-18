/** تشخیص قصد رزرو نوبت از متن فارسی کاربر (بدون LLM). */

import {
  looksLikeJalaliDateAttempt,
  parseJalaliDateFromText,
  toAsciiDigits as jalaliToAsciiDigits,
} from './jalaliDate';

export type BookingIntentKind =
  | 'list_slots'
  | 'book'
  | 'my_bookings'
  | 'cancel'
  | 'reschedule'
  | 'none';

export interface BookingIntent {
  kind: BookingIntentKind;
  /** YYYY-MM-DD local Gregorian date, if resolved */
  dayKey?: string;
  /** day offset from today when relative words used */
  dayOffset?: number;
  /** HH:mm 24h if parsed */
  timeHm?: string;
  /** اگر کاربر تاریخ نوشته ولی نامعتبر بوده */
  dateParseError?: string;
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

function dayOffsetFromKey(dayKey: string): number {
  try {
    const [y, m, d] = dayKey.split('-').map(Number);
    const target = new Date(y, (m || 1) - 1, d || 1);
    target.setHours(0, 0, 0, 0);
    const today = todayLocal();
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  } catch {
    return 0;
  }
}

/** JS getDay(): 0=یکشنبه … 6=شنبه — مرکب‌ها قبل از «شنبه» تا تداخل نباشد. */
const WEEKDAY_FA: Array<{ re: RegExp; dow: number; label: string }> = [
  { label: 'یکشنبه', dow: 0, re: /یک\s*شنبه|يك\s*شنبه/ },
  { label: 'دوشنبه', dow: 1, re: /دو\s*شنبه/ },
  { label: 'سه‌شنبه', dow: 2, re: /سه\s*شنبه|سه‌شنبه/ },
  { label: 'چهارشنبه', dow: 3, re: /چهار\s*شنبه/ },
  { label: 'پنجشنبه', dow: 4, re: /پنج\s*شنبه|پنجشنبه/ },
  { label: 'جمعه', dow: 5, re: /جمعه/ },
  // نباید داخل یکشنبه/دوشنبه/... مچ شود
  { label: 'شنبه', dow: 6, re: /(?<![\u0600-\u06FF])شنبه/ },
];

/**
 * نزدیک‌ترین Occurance آیندهٔ آن روز هفته.
 * اگر امروز همان روز باشد و «بعد/آینده» باشد → هفته بعد (+۷).
 * اگر «این» باشد و امروز همان روز باشد → امروز.
 */
function dateForWeekday(
  targetDow: number,
  mode: 'next' | 'this',
  from = todayLocal()
): Date {
  const current = from.getDay();
  let delta = (targetDow - current + 7) % 7;
  if (mode === 'next' && delta === 0) delta = 7;
  // mode === 'this': delta=0 means today
  return addDays(from, delta);
}

function parseWeekdayRelative(text: string): { offset: number; dayKey: string } | null {
  // اول الگوهای صریح «شنبه بعد / آینده / بعد از شنبه / این شنبه»
  for (const w of WEEKDAY_FA) {
    const nextRe = new RegExp(
      String.raw`(?:${w.re.source})\s*(?:ی\s*)?(?:بعد|آینده|اينده|آينده)|(?:بعد|آینده|اينده|آينده)\s*(?:از\s*)?(?:ی\s*)?(?:${w.re.source})`
    );
    if (nextRe.test(text)) {
      const d = dateForWeekday(w.dow, 'next');
      return { offset: dayOffsetFromKey(toDayKey(d)), dayKey: toDayKey(d) };
    }
  }

  for (const w of WEEKDAY_FA) {
    const thisRe = new RegExp(String.raw`این\s*(?:${w.re.source})`);
    if (thisRe.test(text)) {
      const d = dateForWeekday(w.dow, 'this');
      return { offset: dayOffsetFromKey(toDayKey(d)), dayKey: toDayKey(d) };
    }
  }

  // «نوبت‌های شنبه» بدون بعد/این → نزدیک‌ترین شنبه آینده (اگر امروز شنبه است، امروز)
  for (const w of WEEKDAY_FA) {
    const bareRe = new RegExp(
      String.raw`(?:^|[\s،,])(?:${w.re.source})(?=$|[\s،,.?؟!؛;:])`
    );
    if (bareRe.test(` ${text} `) && !/(بعد|آینده|اينده|آينده|این)/.test(text)) {
      const d = dateForWeekday(w.dow, 'this');
      return { offset: dayOffsetFromKey(toDayKey(d)), dayKey: toDayKey(d) };
    }
  }

  return null;
}

type RelativeDayResult =
  | { ok: true; offset: number; dayKey: string }
  | { ok: false; error: string };

function parseRelativeDay(text: string): RelativeDayResult | null {
  const t = toAsciiDigits(text);

  if (/(امروز|همین\s*امروز)/.test(t)) {
    const d = todayLocal();
    return { ok: true, offset: 0, dayKey: toDayKey(d) };
  }
  if (/(پس\s*فردا)/.test(t)) {
    const d = addDays(todayLocal(), 2);
    return { ok: true, offset: 2, dayKey: toDayKey(d) };
  }
  if (/(فردا)/.test(t)) {
    const d = addDays(todayLocal(), 1);
    return { ok: true, offset: 1, dayKey: toDayKey(d) };
  }

  // ۴ روز بعد | ۵ روز دیگه | بعد از ۳ روز | تا ۶ روز دیگر
  const nDays =
    t.match(/(\d+)\s*روز\s*(?:دیگر|دیگه|بعد)/) ||
    t.match(/بعد\s*(?:از\s*)?(\d+)\s*روز/) ||
    t.match(/(?:تا|برای)\s*(\d+)\s*روز\s*(?:دیگر|دیگه|بعد)?/);
  if (nDays) {
    const n = Number(nDays[1]);
    if (!Number.isFinite(n) || n < 0 || n > 60) {
      return { ok: false, error: 'تعداد روز باید بین ۰ تا ۶۰ باشد.' };
    }
    const d = addDays(todayLocal(), n);
    return { ok: true, offset: n, dayKey: toDayKey(d) };
  }

  const weekday = parseWeekdayRelative(t);
  if (weekday) return { ok: true, ...weekday };

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

type ResolvedDay =
  | { ok: true; dayKey: string; dayOffset: number; from: 'jalali' | 'relative' }
  | { ok: false; error?: string };

function resolveDayFromText(text: string): ResolvedDay {
  // تاریخ مطلق شمسی بر نسبی اولویت دارد (مثلاً «فردا» داخل جمله طولانی نادر است کنار تاریخ عددی)
  const jalali = parseJalaliDateFromText(text);
  if (jalali.ok) {
    return {
      ok: true,
      dayKey: jalali.dayKey,
      dayOffset: dayOffsetFromKey(jalali.dayKey),
      from: 'jalali',
    };
  }
  if (jalali.attempted) {
    return { ok: false, error: jalali.error };
  }

  const relative = parseRelativeDay(text);
  if (relative) {
    if (!relative.ok) return { ok: false, error: relative.error };
    return {
      ok: true,
      dayKey: relative.dayKey,
      dayOffset: relative.offset,
      from: 'relative',
    };
  }

  if (looksLikeJalaliDateAttempt(text) && hasBookingKeyword(text)) {
    return {
      ok: false,
      error: 'تاریخ شمسی را متوجه نشدم. مثال: ۱۴۰۵/۰۴/۳۱ یا ۳۱ تیر ۱۴۰۵',
    };
  }

  return { ok: false };
}

/**
 * تشخیص قصد نوبت‌دهی از متن کاربر.
 * اگر مرتبط با نوبت نباشد kind=none برمی‌گرداند.
 */
export function parseBookingIntent(rawInput: string): BookingIntent {
  const raw = (rawInput || '').trim();
  const text = jalaliToAsciiDigits(raw)
    .replace(/\u200c/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[?؟!؛;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return { kind: 'none', raw };

  const timeHm = parseTimeHm(text);
  const day = resolveDayFromText(text);

  const wantsCancel = /(لغو|کنسل|حذف)\s*نوبت|نوبت\s*را?\s*(?:لغو|کنسل|حذف)/.test(text);
  const wantsReschedule =
    /(تعویض\s*نوبت|تغییر\s*نوبت|عوض\s*کردن\s*نوبت|جابجا(?:یی)?\s*(?:کردن\s*)?نوبت|نوبت.{0,16}جابجا)/.test(
      text
    );
  const wantsMine = /(نوبتهای\s*من|نوبت\s*های\s*من|رزروهای\s*من|رزرو\s*های\s*من|نوبت\s*من)/.test(text);
  const wantsBook =
    /(رزرو\s*کن|برام\s*رزرو|نوبت\s*بگیر|بگیر\s*برام|ثبت\s*نوبت|رزرو\s*نوبت)/.test(text) ||
    (!!timeHm && hasBookingKeyword(text));
  const wantsList =
    /(لیست\s*نوبت|نوبتهای|نوبت\s*های|نوبتها|نوبت\s*ها|چه\s*نوبت|چه\s*ساعت|نوبت\s*دارید|نوبت\s*هست)/.test(
      text
    ) || (hasBookingKeyword(text) && day.ok && !wantsBook && !wantsCancel && !wantsReschedule);

  const withDay = <T extends BookingIntent>(base: T): T => {
    if (day.ok) {
      return { ...base, dayKey: day.dayKey, dayOffset: day.dayOffset };
    }
    if (day.error && hasBookingKeyword(text)) {
      return { ...base, dateParseError: day.error };
    }
    return base;
  };

  if (wantsCancel || (wantsMine && /(لغو|کنسل|حذف)/.test(text))) {
    return withDay({
      kind: 'cancel',
      timeHm,
      raw,
    });
  }

  if (wantsReschedule) {
    return withDay({
      kind: 'reschedule',
      timeHm,
      raw,
    });
  }

  if (wantsMine && !wantsBook) {
    return { kind: 'my_bookings', raw };
  }

  if (wantsBook) {
    return withDay({
      kind: 'book',
      timeHm,
      raw,
    });
  }

  if (wantsList || (hasBookingKeyword(text) && day.ok)) {
    if (!day.ok && day.error) {
      return {
        kind: 'list_slots',
        dateParseError: day.error,
        timeHm,
        raw,
      };
    }
    // «نوبت‌های …» بدون تاریخ مشخص → امروز (نه خطای تاریخ)
    const dayKey = day.ok ? day.dayKey : toDayKey(todayLocal());
    const dayOffset = day.ok ? day.dayOffset : 0;
    return {
      kind: 'list_slots',
      dayKey,
      dayOffset,
      timeHm,
      raw,
    };
  }

  // تاریخ شمسی با کلمه نوبت ولی بدون الگوی list صریح
  if (hasBookingKeyword(text) && day.ok) {
    return {
      kind: 'list_slots',
      dayKey: day.dayKey,
      dayOffset: day.dayOffset,
      timeHm,
      raw,
    };
  }

  if (hasBookingKeyword(text) && day.error) {
    return {
      kind: 'list_slots',
      dateParseError: day.error,
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
