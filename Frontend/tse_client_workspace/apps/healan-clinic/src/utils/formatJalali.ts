import moment from 'moment-jalaali';

moment.loadPersian({ usePersianDigits: true, dialect: 'persian-modern' });

type DateInput = string | Date | null | undefined;

export type JalaliDay = { year: number; month: number; day: number };

function toMoment(value: DateInput) {
  if (value == null || value === '') return null;
  const m = moment(value);
  return m.isValid() ? m : null;
}

/** مقدار محلی برای فرم — YYYY-MM-DDTHH:mm */
export function nowDateTimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toJalaliDay(value: DateInput): JalaliDay | null {
  const m = toMoment(value);
  if (!m) return null;
  return { year: m.jYear(), month: m.jMonth() + 1, day: m.jDate() };
}

export function jalaliDayAndTimeToLocal(day: JalaliDay, time: string): string {
  const safeTime = time?.trim() || '00:00';
  const m = moment(`${day.year}/${day.month}/${day.day} ${safeTime}`, 'jYYYY/jM/jD HH:mm');
  if (!m.isValid()) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const [hours = '0', minutes = '0'] = safeTime.split(':');
  return `${m.year()}-${pad(m.month() + 1)}-${pad(m.date())}T${pad(Number(hours))}:${pad(Number(minutes))}`;
}

export function localDateTimeToTime(value: DateInput): string {
  const m = toMoment(value);
  return m ? m.format('HH:mm') : '00:00';
}
