/**
 * Dependency-free Jalali helpers for the NegareshAI client.
 * API/storage values remain Gregorian ISO; these helpers own presentation and input conversion.
 */
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
] as const;

export const JALALI_WEEKDAY_NAMES = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)));
}

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toJalali(gy: number, gm: number, gd: number) {
  const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100)
    + div(gy2 + 399, 400) - 80 + gd + monthDays[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  return {
    jy,
    jm: days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30),
    jd: 1 + (days < 186 ? days % 31 : (days - 186) % 30),
  };
}

export function toGregorian(jy: number, jm: number, jd: number) {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  const days = 365 * jy + div(jy, 33) * 8 + div((jy % 33) + 3, 4)
    + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * div(days, 146097);
  let remaining = days % 146097;
  if (remaining >= 36525) {
    gy += 100 * div(--remaining, 36524);
    remaining %= 36524;
    if (remaining >= 365) remaining++;
  }
  gy += 4 * div(remaining, 1461);
  remaining %= 1461;
  if (remaining >= 366) {
    gy += div(remaining - 1, 365);
    remaining = (remaining - 1) % 365;
  }
  const monthLengths = [
    0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  let gm = 0;
  for (; gm < 13 && remaining >= monthLengths[gm]; gm++) remaining -= monthLengths[gm];
  return { gy, gm, gd: remaining + 1 };
}

function asLocalDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatJalaliDate(value?: string | Date | null): string {
  if (!value) return "";
  const date = asLocalDate(value);
  if (!date) return "";
  const { jy, jm, jd } = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

export function formatJalaliDateTime(value?: string | Date | null): string {
  if (!value) return "";
  const date = asLocalDate(value);
  if (!date) return "";
  return `${formatJalaliDate(date)}، ساعت ${toPersianDigits(`${pad(date.getHours())}:${pad(date.getMinutes())}`)}`;
}

export function formatJalaliLongDate(value: string | Date = new Date()): string {
  const date = asLocalDate(value);
  if (!date) return "";
  const { jy, jm, jd } = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const weekday = new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date);
  return `${weekday}، ${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
}

export function isJalaliLeap(jy: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635,
    2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let previous = breaks[0];
  let jump = 0;
  for (let index = 1; index < breaks.length; index++) {
    const current = breaks[index];
    jump = current - previous;
    if (jy < current) break;
    previous = current;
  }
  let offset = jy - previous;
  if (jump - offset < 6) offset = offset - jump + div(jump + 4, 33) * 33;
  let leap = (((offset + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;
  return leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

export function formatJalaliYmd(jy: number, jm: number, jd: number): string {
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

export function parseJalaliYmd(value: string) {
  const match = toLatinDigits(value).trim().match(/^(\d{3,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  if (!jy || jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) return null;
  return { jy, jm, jd };
}

export function jalaliWeekday(jy: number, jm: number, jd: number): number {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

export function shiftJalaliMonth(jy: number, jm: number, delta: number) {
  let year = jy;
  let month = jm + delta;
  while (month < 1) { month += 12; year--; }
  while (month > 12) { month -= 12; year++; }
  return { jy: year, jm: month };
}

export function gregorianYmdToJalali(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return toJalali(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function jalaliToGregorianYmd(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}
