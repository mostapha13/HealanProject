import type { PatientBloodPressureItem } from '../api/types';
import { formatJalaliDate } from './formatJalali';

export type BpPeriodSlot = {
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measuredTime?: string | null;
  note?: string | null;
};

export type BpDayRow = {
  dateKey: string;
  jalaliLabel: string;
  morning?: BpPeriodSlot;
  noon?: BpPeriodSlot;
  night?: BpPeriodSlot;
};

function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toSlot(item: PatientBloodPressureItem): BpPeriodSlot {
  return {
    systolic: item.systolic,
    diastolic: item.diastolic,
    pulse: item.pulse,
    measuredTime: item.measuredTime,
    note: item.note,
  };
}

/** گروه‌بندی ثبت‌ها بر اساس روز؛ آخرین ثبت هر بازه اولویت دارد. */
export function groupBloodPressureByDay(items: PatientBloodPressureItem[]): BpDayRow[] {
  const map = new Map<string, BpDayRow>();
  const chronological = [...items].sort((a, b) => {
    const ta = new Date(a.measuredAt).getTime();
    const tb = new Date(b.measuredAt).getTime();
    if (ta !== tb) return ta - tb;
    return (a.id || 0) - (b.id || 0);
  });

  for (const item of chronological) {
    const dateKey = toDateKey(item.measuredAt);
    let row = map.get(dateKey);
    if (!row) {
      row = {
        dateKey,
        jalaliLabel: formatJalaliDate(item.measuredAt) || dateKey,
      };
      map.set(dateKey, row);
    }

    const slot = toSlot(item);
    const period = item.periodOfDay ?? 0;
    if (period === 1) row.morning = slot;
    else if (period === 2) row.noon = slot;
    else if (period === 3) row.night = slot;
    else if (!row.morning) row.morning = slot;
  }

  return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0));
}

export function periodTitle(periodOfDay?: number | null): string {
  if (periodOfDay === 1) return 'صبح';
  if (periodOfDay === 2) return 'ظهر';
  if (periodOfDay === 3) return 'شب';
  return '';
}
