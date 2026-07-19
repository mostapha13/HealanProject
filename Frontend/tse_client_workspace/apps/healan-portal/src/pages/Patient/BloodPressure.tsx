import React, { useEffect, useMemo, useState } from 'react';
import {
  patientBloodPressureDelete,
  patientBloodPressureList,
  patientBloodPressureSave,
  type PortalBloodPressureItem,
} from '../../api/portalApi';
import { JalaliDateInput } from '../../components/JalaliDateInput';
import { usePortalSessionUser } from '../../components/PortalSessionUser';
import { formatJalaliDate, todayDateInput } from '../../utils/formatJalali';
import { groupBloodPressureByDay } from '../../utils/groupBloodPressureByDay';
import { openBloodPressurePrintWindow } from '../../utils/printBloodPressureReport';
import { PatientPagedList } from './PatientPagedList';

const PERIODS = [
  { value: 1, label: 'صبح' },
  { value: 2, label: 'ظهر' },
  { value: 3, label: 'شب' },
] as const;

function asList(value: unknown): PortalBloodPressureItem[] {
  if (Array.isArray(value)) return value as PortalBloodPressureItem[];
  return [];
}

function isoToDateInput(iso?: string): string {
  if (!iso) return todayDateInput();
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return todayDateInput();
  }
}

export default function PatientBloodPressurePage() {
  const { user } = usePortalSessionUser();
  const [items, setItems] = useState<PortalBloodPressureItem[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('');
  const [date, setDate] = useState(todayDateInput());
  const [period, setPeriod] = useState<number>(1);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const dayRows = useMemo(() => groupBloodPressureByDay(items), [items]);

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
    setDate(todayDateInput());
    setPeriod(1);
    setTime('');
    setNote('');
  };

  const startEdit = (item: PortalBloodPressureItem) => {
    setEditId(item.id);
    setSystolic(String(item.systolic));
    setDiastolic(String(item.diastolic));
    setPulse(item.pulse != null ? String(item.pulse) : '');
    setDate(isoToDateInput(item.measuredAt));
    setPeriod(item.periodOfDay || 1);
    setTime(item.measuredTime || '');
    setNote(item.note || '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!date.trim()) {
        setError('تاریخ را انتخاب کنید.');
        return;
      }
      await patientBloodPressureSave({
        id: editId || undefined,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse ? Number(pulse) : null,
        measuredAt: `${date}T00:00:00`,
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

  const printReport = () => {
    try {
      openBloodPressurePrintWindow({
        patientName: user?.displayName || 'بیمار',
        patientNationalCode: null,
        printedAtLabel: formatJalaliDate(new Date()) || '',
        days: dayRows,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'چاپ ناموفق بود');
    }
  };

  return (
    <div className="portal-patient__panel">
      <div className="portal-patient__title-row">
        <div>
          <h1 className="portal-patient__title">ثبت فشار خون</h1>
          <p className="portal-patient__lead">تاریخ شمسی، بازه روز و در صورت نیاز ساعت را مشخص کنید.</p>
        </div>
        <button
          type="button"
          className="p-btn p-btn--outline"
          disabled={busy || items.length === 0}
          onClick={printReport}
        >
          چاپ گزارش
        </button>
      </div>
      {error && <div className="portal-patient__error">{error}</div>}

      <form className="portal-patient__form" onSubmit={save}>
        <label>
          تاریخ شمسی
          <JalaliDateInput
            value={date}
            onChange={setDate}
            disabled={busy}
            placeholder="انتخاب تاریخ"
            calendarPopperPosition="bottom"
          />
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
                  {formatJalaliDate(item.measuredAt) || '—'}
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
