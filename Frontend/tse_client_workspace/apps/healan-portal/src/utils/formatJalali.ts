import moment from 'moment-jalaali';

moment.loadPersian({ usePersianDigits: true, dialect: 'persian-modern' });

type DateInput = string | Date | null | undefined;

export type JalaliDay = { year: number; month: number; day: number };

function toMoment(value: DateInput) {
  if (value == null || value === '') return null;
  const m = moment(value);
  return m.isValid() ? m : null;
}

/** تاریخ امروز به فرمت YYYY-MM-DD برای فرم/API */
export function todayDateInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toJalaliDay(value: DateInput): JalaliDay | null {
  const m = toMoment(value);
  if (!m) return null;
  return { year: m.jYear(), month: m.jMonth() + 1, day: m.jDate() };
}

/** تبدیل روز شمسی به YYYY-MM-DD لاتین برای API */
export function jalaliDayToDateInput(day: JalaliDay): string {
  const m = moment(`${day.year}/${day.month}/${day.day}`, 'jYYYY/jM/jD');
  if (!m.isValid()) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${m.year()}-${pad(m.month() + 1)}-${pad(m.date())}`;
}

/** نمایش تاریخ شمسی — مثال ۱۴۰۳/۰۱/۱۵ */
export function formatJalaliDate(value: DateInput): string {
  const m = toMoment(value);
  return m ? m.format('jYYYY/jMM/jDD') : '';
}
