/**
 * پارس تاریخ شمسی از متن فارسی برای رزرو نوبت.
 * خروجی نهایی dayKey میلادی (YYYY-MM-DD) برای API اسلات‌هاست.
 */
import {
  isValidJalaaliDate,
  jalaaliMonthLength,
  toGregorian,
  toJalaali,
} from 'jalaali-js';

export type JalaliDateHit = {
  jy: number;
  jm: number;
  jd: number;
  /** سال صریحاً در متن آمده */
  yearExplicit: boolean;
  source: 'numeric-ymd' | 'numeric-dmy' | 'named';
  /** زیره‌ای از متن که مچ شده */
  matched: string;
};

export type JalaliParseResult =
  | {
      ok: true;
      dayKey: string;
      jy: number;
      jm: number;
      jd: number;
      source: JalaliDateHit['source'];
      yearExplicit: boolean;
    }
  | { ok: false; attempted: true; error: string }
  | { ok: false; attempted: false };

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** نام ماه → شماره (۱..۱۲)؛ شامل املای رایج و حروف عربی. */
const MONTH_ALIASES: Array<{ re: RegExp; jm: number; name: string }> = [
  { jm: 1, name: 'فروردین', re: /فروردین/ },
  { jm: 2, name: 'اردیبهشت', re: /اردی\s*بهشت|اردیبهشت/ },
  { jm: 3, name: 'خرداد', re: /خرداد/ },
  // مرز بعد از ماه‌های کوتاه تا مثلاً داخل واژه‌های دیگر مچ نشوند
  { jm: 4, name: 'تیر', re: /تیر(?![\u0600-\u06FF])|تير(?![\u0600-\u06FF])/ },
  { jm: 5, name: 'مرداد', re: /مرداد/ },
  { jm: 6, name: 'شهریور', re: /شهریور|شهريور/ },
  { jm: 7, name: 'مهر', re: /مهر(?![\u0600-\u06FF])/ },
  { jm: 8, name: 'آبان', re: /آبان|ابان/ },
  { jm: 9, name: 'آذر', re: /آذر|اذر/ },
  { jm: 10, name: 'دی', re: /دی(?![\u0600-\u06FF])/ },
  { jm: 11, name: 'بهمن', re: /بهمن/ },
  { jm: 12, name: 'اسفند', re: /اسفند/ },
];

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

/** نرمال‌سازی حروف عربی/فاصله‌های مجازی برای مچ ماه. */
export function normalizePersianText(input: string): string {
  return toAsciiDigits(input || '')
    .replace(/\u200c/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function jalaliToDayKey(jy: number, jm: number, jd: number): string | null {
  if (!isValidJalaaliDate(jy, jm, jd)) return null;
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

export function todayJalali(now = new Date()): { jy: number; jm: number; jd: number } {
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function todayGregorianDayKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function invalidDayMessage(jy: number, jm: number, jd: number): string {
  const month = MONTH_ALIASES.find((m) => m.jm === jm)?.name ?? `ماه ${jm}`;
  if (jm < 1 || jm > 12) return `ماه «${jm}» معتبر نیست.`;
  const max = jm >= 1 && jm <= 12 ? jalaaliMonthLength(jy, jm) : 0;
  if (jd < 1 || (max > 0 && jd > max)) {
    return `روز ${jd} برای ${month} ${jy} معتبر نیست` + (max > 0 ? ` (این ماه ${max} روز دارد).` : '.');
  }
  return `تاریخ ${jy}/${pad2(jm)}/${pad2(jd)} معتبر نیست.`;
}

/**
 * اگر سال ذکر نشده و تاریخ نسبت به امروز گذشته است، سال بعد را امتحان می‌کند
 * (مثلاً در مرداد بگویند «۱۰ فروردین» → فروردین سال بعد).
 */
function resolveYearForBooking(
  hit: JalaliDateHit,
  now = new Date()
): JalaliParseResult {
  let { jy, jm, jd, yearExplicit, source } = hit;

  if (!isValidJalaaliDate(jy, jm, jd)) {
    // اگر سال ذکر نشده، شاید سال بعد (مثل ۳۰ اسفند در سال کبیسه)
    if (!yearExplicit && isValidJalaaliDate(jy + 1, jm, jd)) {
      jy += 1;
    } else {
      return { ok: false, attempted: true, error: invalidDayMessage(jy, jm, jd) };
    }
  }

  let dayKey = jalaliToDayKey(jy, jm, jd)!;
  const todayKey = todayGregorianDayKey(now);

  if (!yearExplicit && dayKey < todayKey) {
    const nextY = jy + 1;
    if (isValidJalaaliDate(nextY, jm, jd)) {
      const nextKey = jalaliToDayKey(nextY, jm, jd)!;
      jy = nextY;
      dayKey = nextKey;
    }
  }

  return { ok: true, dayKey, jy, jm, jd, source, yearExplicit };
}

function parseNumericDate(text: string): JalaliDateHit | { error: string } | null {
  // Y/M/D یا D/M/Y با جداکننده / - . یا فاصله
  const re =
    /(?<!\d)(\d{1,4})\s*[\/\-.\s]\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{1,4})(?!\d)/;
  const m = text.match(re);
  if (!m) return null;

  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  if (![a, b, c].every((n) => Number.isFinite(n))) {
    return { error: 'تاریخ عددی نامعتبر است.' };
  }

  let jy: number;
  let jm: number;
  let jd: number;
  let source: JalaliDateHit['source'];

  // سال معمولاً ۱۳۰۰..۱۶۰۰؛ اگر جزء اول سال‌مانند باشد → Y/M/D
  if (a >= 1200 && a <= 1700) {
    jy = a;
    jm = b;
    jd = c;
    source = 'numeric-ymd';
  } else if (c >= 1200 && c <= 1700) {
    // D/M/Y رایج در فارسی
    jd = a;
    jm = b;
    jy = c;
    source = 'numeric-dmy';
  } else if (a > 31 && a < 1200) {
    return { error: `سال «${a}» برای تاریخ شمسی نامعتبر است.` };
  } else {
    // ابهام: ترجیح D/M/Y با سال جاری بعداً در resolve — ولی بدون سال سه‌تایی مبهم است
    return {
      error: `فرمت تاریخ «${m[0].trim()}» مبهم است. مثال: 1405/04/31 یا 31/04/1405`,
    };
  }

  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) {
    return { error: invalidDayMessage(jy, jm, jd) };
  }

  return {
    jy,
    jm,
    jd,
    yearExplicit: true,
    source,
    matched: m[0].trim(),
  };
}

function parseNamedMonthDate(text: string): JalaliDateHit | { error: string } | null {
  // «31 تیر 1405» | «۳۱ تیر» | «تیر 31 1405» (کم‌کاربرد، پشتیبانی محدود)
  const monthUnion = MONTH_ALIASES.map((x) => x.re.source).join('|');

  // روز + ماه + سال اختیاری
  const reDayMonth = new RegExp(
    String.raw`(?<!\d)(\d{1,2})\s*(?:ام|م)?\s*(${monthUnion})(?:\s*(?:ماه)?\s*)?(?:(\d{4}))?`,
    'u'
  );
  let m = text.match(reDayMonth);
  let jd: number | null = null;
  let jm: number | null = null;
  let jy: number | null = null;
  let matched = '';

  if (m) {
    jd = Number(m[1]);
    const monthToken = m[2];
    jy = m[3] ? Number(m[3]) : null;
    matched = m[0].trim();
    const found = MONTH_ALIASES.find((x) => x.re.test(monthToken));
    jm = found?.jm ?? null;
  } else {
    // ماه + روز (+ سال)
    const reMonthDay = new RegExp(
      String.raw`(${monthUnion})\s*(?:ماه\s*)?(\d{1,2})(?:\s*(?:ام|م))?(?:\s+(\d{4}))?`,
      'u'
    );
    m = text.match(reMonthDay);
    if (!m) return null;
    const monthToken = m[1];
    jd = Number(m[2]);
    jy = m[3] ? Number(m[3]) : null;
    matched = m[0].trim();
    const found = MONTH_ALIASES.find((x) => x.re.test(monthToken));
    jm = found?.jm ?? null;
  }

  if (jm == null || jd == null || !Number.isFinite(jd)) {
    return { error: 'روز یا ماه در تاریخ شمسی نامعتبر است.' };
  }

  const yearExplicit = jy != null && Number.isFinite(jy);
  if (!yearExplicit) {
    jy = todayJalali().jy;
  } else if (jy! < 1200 || jy! > 1700) {
    return { error: `سال «${jy}» برای تاریخ شمسی نامعتبر است.` };
  }

  return {
    jy: jy!,
    jm,
    jd,
    yearExplicit,
    source: 'named',
    matched,
  };
}

/**
 * استخراج یک تاریخ شمسی مطلق از متن کاربر.
 * اول فرم عددی، بعد «روز + نام ماه».
 */
export function parseJalaliDateFromText(raw: string, now = new Date()): JalaliParseResult {
  const text = normalizePersianText(raw);
  if (!text) return { ok: false, attempted: false };

  const numeric = parseNumericDate(text);
  if (numeric) {
    if ('error' in numeric) return { ok: false, attempted: true, error: numeric.error };
    return resolveYearForBooking(numeric, now);
  }

  const named = parseNamedMonthDate(text);
  if (named) {
    if ('error' in named) return { ok: false, attempted: true, error: named.error };
    return resolveYearForBooking(named, now);
  }

  return { ok: false, attempted: false };
}

/** آیا متن شبیه تلاش برای نوشتن تاریخ است (برای پیام خطای بهتر). */
export function looksLikeJalaliDateAttempt(raw: string): boolean {
  const text = normalizePersianText(raw);
  if (/\d{1,4}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{1,4}/.test(text)) return true;
  const monthUnion = MONTH_ALIASES.map((x) => x.re.source).join('|');
  return new RegExp(String.raw`\d{1,2}\s*(?:ام|م)?\s*(?:${monthUnion})|(?:${monthUnion})\s*\d{1,2}`).test(
    text
  );
}
