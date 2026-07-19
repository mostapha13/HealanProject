import React, { useEffect, useMemo, useState } from 'react';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import {
  patientBloodPressureDelete,
  patientBloodPressureList,
  patientBloodPressureSave,
  type PortalBloodPressureItem,
} from '../../api/portalApi';
import { jalaliToDayKey, todayJalali } from '../Assistant/jalaliDate';
import { PatientPagedList } from './PatientPagedList';

const PERIODS = [
  { value: 1, label: 'صبح' },
  { value: 2, label: 'ظهر' },
  { value: 3, label: 'شب' },
] as const;

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

type JalaliParts = { jy: number; jm: number; jd: number };

function isoToJalali(iso?: string): JalaliParts {
  if (!iso) return todayJalali();
  try {
    const d = new Date(iso);
    return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  } catch {
    return todayJalali();
  }
}

function fmtJalali(iso?: string) {
  if (!iso) return '—';
  try {
    const { jy, jm, jd } = isoToJalali(iso);
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

function clampJalali(parts: JalaliParts): JalaliParts {
  const maxDay = jalaaliMonthLength(parts.jy, parts.jm);
  return { ...parts, jd: Math.min(parts.jd, maxDay) };
}

function asList(value: unknown): PortalBloodPressureItem[] {
  if (Array.isArray(value)) return value as PortalBloodPressureItem[];
  return [];
}

export default function PatientBloodPressurePage() {
  const [items, setItems] = useState<PortalBloodPressureItem[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('');
  const [jalali, setJalali] = useState<JalaliParts>(() => todayJalali());
  const [period, setPeriod] = useState<number>(1);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const yearOptions = useMemo(() => {
    const current = todayJalali().jy;
    const years = new Set<number>();
    for (let y = current; y >= current - 5; y -= 1) years.add(y);
    years.add(jalali.jy);
    return Array.from(years).sort((a, b) => b - a);
  }, [jalali.jy]);

  const dayOptions = useMemo(() => {
    const max = jalaaliMonthLength(jalali.jy, jalali.jm);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [jalali.jy, jalali.jm]);

  const reload = async () => {
    const list = await patientBloodPressureList();
    setItems(asList(list));
  };

  useEffect(() => {
    void reload().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'بارگذاری ناموفق بود')
    );
  }, []);

  const resetForm = () => {
    setEditId(null);
    setSystolic('120');
    setDiastolic('80');
    setPulse('');
    setJalali(todayJalali());
    setPeriod(1);
    setTime('');
    setNote('');
  };

  const startEdit = (item: PortalBloodPressureItem) => {
    setEditId(item.id);
    setSystolic(String(item.systolic));
    setDiastolic(String(item.diastolic));
    setPulse(item.pulse != null ? String(item.pulse) : '');
    setJalali(isoToJalali(item.measuredAt));
    setPeriod(item.periodOfDay || 1);
    setTime(item.measuredTime || '');
    setNote(item.note || '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const dayKey = jalaliToDayKey(jalali.jy, jalali.jm, jalali.jd);
      if (!dayKey) {
        setError('تاریخ شمسی معتبر نیست.');
        return;
      }
      await patientBloodPressureSave({
        id: editId || undefined,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse ? Number(pulse) : null,
        measuredAt: `${dayKey}T00:00:00`,
        periodOfDay: period,
        measuredTime: time.trim() || null,
        note: note.trim() || undefined,
      });
      resetForm();
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ثبت ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try {
      await patientBloodPressureDelete(id);
      if (editId === id) resetForm();
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const updateJalali = (patch: Partial<JalaliParts>) => {
    setJalali((prev) => clampJalali({ ...prev, ...patch }));
  };

  return (
    <div className="portal-patient__panel">
      <h1 className="portal-patient__title">ثبت فشار خون</h1>
      <p className="portal-patient__lead">تاریخ شمسی، بازه روز و در صورت نیاز ساعت را مشخص کنید.</p>
      {error && <div className="portal-patient__error">{error}</div>}

      <form className="portal-patient__form" onSubmit={save}>
        <label className="portal-patient__form-wide">
          تاریخ شمسی
          <div className="portal-patient__jalali-row">
            <select
              aria-label="روز"
              value={jalali.jd}
              onChange={(e) => updateJalali({ jd: Number(e.target.value) })}
              required
            >
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              aria-label="ماه"
              value={jalali.jm}
              onChange={(e) => updateJalali({ jm: Number(e.target.value) })}
              required
            >
              {JALALI_MONTHS.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              aria-label="سال"
              value={jalali.jy}
              onChange={(e) => updateJalali({ jy: Number(e.target.value) })}
              required
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          بازه روز
          <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          ساعت (اختیاری)
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label>
          سیستولیک
          <input value={systolic} onChange={(e) => setSystolic(e.target.value)} inputMode="numeric" required />
        </label>
        <label>
          دیاستولیک
          <input value={diastolic} onChange={(e) => setDiastolic(e.target.value)} inputMode="numeric" required />
        </label>
        <label>
          نبض (اختیاری)
          <input value={pulse} onChange={(e) => setPulse(e.target.value)} inputMode="numeric" />
        </label>
        <label className="portal-patient__form-wide">
          یادداشت
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </label>
        <div className="portal-patient__form-actions portal-patient__form-wide">
          <button type="submit" className="p-btn p-btn--success" disabled={busy}>
            {editId ? 'به‌روزرسانی' : 'ذخیره'}
          </button>
          {editId != null && (
            <button type="button" className="p-btn p-btn--outline" disabled={busy} onClick={resetForm}>
              انصراف
            </button>
          )}
        </div>
      </form>

      <section className="portal-patient__section">
        <h2>سوابق ثبت‌شده</h2>
        <PatientPagedList
          items={items}
          emptyText="هنوز رکوردی نیست."
          getKey={(item) => item.id}
          renderItem={(item) => (
            <div className="portal-patient__list-row">
              <span>
                <strong>
                  {item.systolic}/{item.diastolic}
                </strong>
                {item.pulse != null ? ` · نبض ${item.pulse}` : ''}
                <div className="portal-patient__muted">
                  {fmtJalali(item.measuredAt)}
                  {item.periodTitle ? ` · ${item.periodTitle}` : ''}
                  {item.measuredTime ? ` · ساعت ${item.measuredTime}` : ''}
                </div>
                {item.note ? <div className="portal-patient__muted">{item.note}</div> : null}
              </span>
              <span className="portal-patient__row-actions">
                <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => startEdit(item)}>
                  ویرایش
                </button>
                <button type="button" className="p-btn p-btn--outline p-btn--sm" disabled={busy} onClick={() => void remove(item.id)}>
                  حذف
                </button>
              </span>
            </div>
          )}
        />
      </section>
    </div>
  );
}
