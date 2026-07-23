/** Minimal Jalali helpers (no moment dependency). */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function div(a: number, b: number) {
  return Math.floor(a / b);
}

/** Gregorian → Jalali */
export function toJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

/** Jalali → Gregorian */
export function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  const days =
    365 * jy +
    div(jy, 33) * 8 +
    div((jy % 33) + 3, 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * div(days, 146097);
  let d = days % 146097;
  if (d >= 36525) {
    gy += 100 * div(--d, 36524);
    d %= 36524;
    if (d >= 365) d++;
  }
  gy += 4 * div(d, 1461);
  d %= 1461;
  if (d >= 366) {
    gy += div(d - 1, 365);
    d = (d - 1) % 365;
  }
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 0; gm < 13 && d >= sal_a[gm]; gm++) d -= sal_a[gm];
  return { gy, gm, gd: d + 1 };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatJalaliDate(value?: string | Date | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const { jy, jm, jd } = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

export function formatJalaliDateTime(value?: string | Date | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const date = formatJalaliDate(d);
  const time = toPersianDigits(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  return `${date} ${time}`;
}

/** Parse jalali date YYYY/MM/DD + HH:mm → local ISO-like YYYY-MM-DDTHH:mm */
export function jalaliDateTimeToLocal(dateJalali: string, time: string): string {
  const latin = dateJalali
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = latin.trim().match(/^(\d{3,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (!m) return '';
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  const t = (time || '00:00').trim();
  const [hh = '0', mm = '0'] = t.split(':');
  return `${gy}-${pad(gm)}-${pad(gd)}T${pad(Number(hh))}:${pad(Number(mm))}`;
}

export function localToJalaliParts(value?: string | null): { date: string; time: string } {
  if (!value) {
    const now = new Date();
    const { jy, jm, jd } = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return {
      date: `${jy}/${pad(jm)}/${pad(jd)}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return localToJalaliParts(null);
  const { jy, jm, jd } = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return {
    date: `${jy}/${pad(jm)}/${pad(jd)}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
