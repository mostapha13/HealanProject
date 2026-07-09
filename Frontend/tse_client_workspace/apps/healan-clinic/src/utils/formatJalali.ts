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

/** تاریخ امروز به فرمت YYYY-MM-DD برای فیلترها */
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

/** تبدیل روز شمسی به YYYY-MM-DD برای API */
export function jalaliDayToDateInput(day: JalaliDay): string {
  const m = moment(`${day.year}/${day.month}/${day.day}`, 'jYYYY/jM/jD');
  if (!m.isValid()) return '';
  return m.format('YYYY-MM-DD');
}

/** نمایش تاریخ شمسی — مثال ۱۴۰۳/۰۱/۱۵ */
export function formatJalaliDate(value: DateInput): string {
  const m = toMoment(value);
  return m ? m.format('jYYYY/jMM/jDD') : '';
}

/** محاسبه سن بر اساس تاریخ تولد */
export function calculateAgeYears(value: DateInput): string | null {
  const m = toMoment(value);
  if (!m) return null;
  const age = moment().diff(m, 'years');
  return age >= 0 ? String(age) : null;
}

/** YYYY-MM-DD → ISO برای ذخیره تاریخ تولد */
export function dateOnlyToIso(value: string | null | undefined): string | undefined {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return undefined;
  const latin = trimmed.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
  const m = moment(latin, 'YYYY-MM-DD', true);
  if (!m.isValid()) return undefined;
  return m.startOf('day').toISOString();
}
